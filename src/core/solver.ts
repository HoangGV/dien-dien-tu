/**
 * Electrical Solver for Household (RMS) and Electronics (DC) Circuits
 * Supports:
 * - Nodal analysis with reference ground (terminal O on ac_source or neg/gnd on DC)
 * - Voltage sources: AC 220V, DC 9V/1.5-24V, VCC
 * - Passive components: Resistor, Potentiometer, Capacitors (DC steady state)
 * - Semiconductors: Diode (0.7V), LED (2.0V-3.0V forward drop by color)
 * - Meters: Ammeter (1 mΩ), Voltmeter (10 MΩ), Wattmeter (4 pins: I+, I-, U+, U-), Ohmmeter (secondary offline solver)
 * - Protection & Switching: MCB/CB, Knife Switch, ELCB (30mA residual), Fuse, Switch 2P/3P, Push Button
 * - Thermal accumulation & damage curves (LED burn, Resistor burn, Cap explosion, Wire melt, Breaker trip, Fuse blow)
 * - PE ground connection with source PE (0.1 Ω) and Earth Ground rod (R_đất)
 * - Metal chassis (vỏ) with 10 Ω leakage, 1000 Ω human touch
 * - Open Circuit & reverse polarity detection
 */

import {
  ComponentInstance,
  Wire,
  Junction,
  ComponentDef,
  CaseStatus,
} from './model';
import { extractNetlist, getComponentPins } from './netlist';
import { COMPONENT_MAP } from './registry';
import {
  COMPONENT_THERMAL_SPECS,
  calculateWireStress,
  DEFAULT_TAU_COOL,
} from './componentSpecs';
import { formatMeasure } from './measureFormat';

export interface OpenCircuitInfo {
  isOpen: boolean;
  reason: string;
  componentId?: string;
  missingPinId?: string;
}

export interface MeterMeasurement {
  kind: 'A' | 'V' | 'W' | 'Ω' | 'kWh';
  value: number;
  formatted: string;
  voltage?: number;
  current?: number;
  power?: number;
  resistance?: number;
  energyKwh?: number;
  isReversePolarity?: boolean;
  isVoltageCoilConnected?: boolean;
  hasLiveVoltageWarning?: boolean;
}

export interface ThermalState {
  heat: number;         // h: 0 to > 2 (h > 1: HOT, h > 2: DAMAGED)
  stress: number;       // s: load ratio
  status: 'normal' | 'hot' | 'damaged' | 'tripped' | 'blown';
  damageType?: 'burn' | 'trip' | 'blow' | 'explode' | 'melt';
}

export interface SolverStepResult {
  nodeVoltages: Record<string, number>;
  componentCurrents: Record<string, number>;
  componentVoltages: Record<string, number>;
  componentPowers: Record<string, number>;
  operatingStates: Record<string, boolean>;
  caseStatuses: Record<string, CaseStatus>;
  earthCurrents: Record<string, number>;
  faultCurrents: Record<string, number>;
  trippedComponents: string[];
  blownComponents: string[];
  damagedComponents: string[];
  thermalStates: Record<string, ThermalState>;
  wireCurrents: Record<string, number>;
  wireThermalStates: Record<string, ThermalState>;
  meterMeasurements: Record<string, MeterMeasurement>;
  statusMessages: string[];
  openCircuit?: OpenCircuitInfo;
}

// Gaussian elimination with partial pivoting
export function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const val = Math.abs(M[r][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = r;
      }
    }

    if (maxVal < 1e-12) {
      continue;
    }

    if (maxRow !== col) {
      const tmp = M[col];
      M[col] = M[maxRow];
      M[maxRow] = tmp;
    }

    const pivot = M[col][col];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col] / pivot;
      if (Math.abs(factor) < 1e-14) continue;
      for (let c = col; c <= n; c++) {
        M[r][c] -= factor * M[col][c];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (Math.abs(M[i][i]) > 1e-12) {
      x[i] = M[i][n] / M[i][i];
    }
  }
  return x;
}

/**
 * Secondary solver: calculates resistance measured by an Ohmmeter.
 * Runs on a clone of the circuit with all power sources disabled (V=0 with internal resistance),
 * capacitors open, diodes/LEDs open, other meters detached, and an injected 1 mA test current.
 */
export function solveOhmmeterResistance(
  components: ComponentInstance[],
  wires: Wire[],
  junctions: Junction[],
  ohmmeterId: string,
  defMap: Map<string, ComponentDef> = COMPONENT_MAP
): { resistance: number; hasLiveVoltageWarning: boolean } {
  const ohmComp = components.find(c => c.id === ohmmeterId);
  if (!ohmComp) {
    return { resistance: Infinity, hasLiveVoltageWarning: false };
  }

  // Check if live sources are present and wired in the main circuit
  const hasLiveSources = components.some(c =>
    (c.type === 'ac_source' && (Number(c.props.voltage) || 220) > 0) ||
    (c.type === 'dc_source' && (Number(c.props.voltage) || 9) > 0)
  );

  const { pinToNetId, nets } = extractNetlist(components, wires, junctions, defMap);
  const net1 = pinToNetId.get(`${ohmmeterId}:1`) || pinToNetId.get(`${ohmmeterId}:pos`);
  const net2 = pinToNetId.get(`${ohmmeterId}:2`) || pinToNetId.get(`${ohmmeterId}:neg`);

  if (!net1 || !net2) {
    return { resistance: Infinity, hasLiveVoltageWarning: hasLiveSources };
  }
  if (net1 === net2) {
    return { resistance: 0, hasLiveVoltageWarning: hasLiveSources };
  }

  // Build secondary MNA with net2 as reference ground (0V)
  const nodeMap = new Map<string, number>();
  let nextIdx = 0;
  nodeMap.set(net2, -1); // Ground ref

  for (const net of nets) {
    if (net.id !== net2 && !nodeMap.has(net.id)) {
      nodeMap.set(net.id, nextIdx++);
    }
  }

  const numNodes = nextIdx;
  if (numNodes === 0) {
    return { resistance: Infinity, hasLiveVoltageWarning: hasLiveSources };
  }

  const G: number[][] = Array.from({ length: numNodes }, () => new Array(numNodes).fill(0));
  const I: number[] = new Array(numNodes).fill(0);

  const addResistor = (u: number, v: number, r: number) => {
    if (r <= 0) r = 1e-6;
    const g = 1 / r;
    if (u >= 0 && u < numNodes) G[u][u] += g;
    if (v >= 0 && v < numNodes) G[v][v] += g;
    if (u >= 0 && v >= 0 && u < numNodes && v < numNodes) {
      G[u][v] -= g;
      G[v][u] -= g;
    }
  };

  // Small gmin shunt to prevent singular matrices on floating parts
  for (let i = 0; i < numNodes; i++) {
    G[i][i] += 1e-9;
  }

  for (const c of components) {
    if (c.id === ohmmeterId) {
      // Skip the ohmmeter itself in passive mesh
      continue;
    }

    if (c.type === 'ac_source') {
      // Voltage source OFF -> internal resistance 0.001 Ω
      const aNet = pinToNetId.get(`${c.id}:A`);
      const oNet = pinToNetId.get(`${c.id}:O`);
      if (aNet && oNet) {
        addResistor(nodeMap.get(aNet) ?? -1, nodeMap.get(oNet) ?? -1, 0.001);
      }
    } else if (c.type === 'dc_source') {
      const posNet = pinToNetId.get(`${c.id}:pos`);
      const negNet = pinToNetId.get(`${c.id}:neg`);
      if (posNet && negNet) {
        addResistor(nodeMap.get(posNet) ?? -1, nodeMap.get(negNet) ?? -1, 0.001);
      }
    } else if (c.type === 'resistor') {
      const n1 = pinToNetId.get(`${c.id}:1`);
      const n2 = pinToNetId.get(`${c.id}:2`);
      if (n1 && n2) {
        const rVal = Number(c.props.resistance ?? 1000) || 1000;
        addResistor(nodeMap.get(n1) ?? -1, nodeMap.get(n2) ?? -1, rVal);
      }
    } else if (['ceiling_fan', 'appliance_generic', 'lamp_fluorescent', 'lamp'].includes(c.type)) {
      const n1 = pinToNetId.get(`${c.id}:A`) || pinToNetId.get(`${c.id}:1`);
      const n2 = pinToNetId.get(`${c.id}:O`) || pinToNetId.get(`${c.id}:2`);
      if (n1 && n2) {
        const power = Number(c.props.power) || (c.type === 'ceiling_fan' ? 60 : c.type === 'lamp_fluorescent' ? 36 : 60);
        const rLoad = Math.max((220 * 220) / power, 10);
        addResistor(nodeMap.get(n1) ?? -1, nodeMap.get(n2) ?? -1, rLoad);
      }
    } else if (c.type === 'ammeter' || c.type === 'cb' || c.type === 'switch_2p' || c.type === 'push_button') {
      const isClosed = c.type === 'ammeter' || (c.props.state !== false && !c.props.isTripped);
      if (isClosed) {
        const n1 = pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:pos`) || pinToNetId.get(`${c.id}:in`) || pinToNetId.get(`${c.id}:in1`);
        const n2 = pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:neg`) || pinToNetId.get(`${c.id}:out`) || pinToNetId.get(`${c.id}:out1`);
        if (n1 && n2) {
          addResistor(nodeMap.get(n1) ?? -1, nodeMap.get(n2) ?? -1, 0.001);
        }
      }
    } else if (c.type === 'switch_3p') {
      const netCom = pinToNetId.get(`${c.id}:com`) || pinToNetId.get(`${c.id}:COM`) || pinToNetId.get(`${c.id}:0`);
      const isPosA = c.props.state === true || c.props.state === 1 || c.props.state === 'a' || c.props.state === '1';
      const netTarget = isPosA
        ? (pinToNetId.get(`${c.id}:a`) || pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:A`))
        : (pinToNetId.get(`${c.id}:b`) || pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:B`));
      if (netCom && netTarget) {
        addResistor(nodeMap.get(netCom) ?? -1, nodeMap.get(netTarget) ?? -1, 0.001);
      }
    } else if (c.type === 'wattmeter') {
      // Current coil is shorted (1 mΩ), voltage coil is open (10 MΩ)
      const ni1 = pinToNetId.get(`${c.id}:I+`);
      const ni2 = pinToNetId.get(`${c.id}:I-`);
      if (ni1 && ni2) {
        addResistor(nodeMap.get(ni1) ?? -1, nodeMap.get(ni2) ?? -1, 0.001);
      }
      const nu1 = pinToNetId.get(`${c.id}:U+`);
      const nu2 = pinToNetId.get(`${c.id}:U-`);
      if (nu1 && nu2) {
        addResistor(nodeMap.get(nu1) ?? -1, nodeMap.get(nu2) ?? -1, 1e7);
      }
    } else if (c.type === 'kwh_meter') {
      const netPIn = pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:in_p`);
      const netPOut = pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:out_p`);
      if (netPIn && netPOut) addResistor(nodeMap.get(netPIn) ?? -1, nodeMap.get(netPOut) ?? -1, 0.001);
      const netNIn = pinToNetId.get(`${c.id}:3`) || pinToNetId.get(`${c.id}:in_n`);
      const netNOut = pinToNetId.get(`${c.id}:4`) || pinToNetId.get(`${c.id}:out_n`);
      if (netNIn && netNOut) addResistor(nodeMap.get(netNIn) ?? -1, nodeMap.get(netNOut) ?? -1, 0.001);
    } else if (c.type === 'socket') {
      // Socket pins A and O are wired natively
    } else if (c.type === 'lamp_dc') {
      const vNom = Number(c.props.voltage) || 5;
      const pNom = Number(c.props.power) || 1;
      const rLamp = Math.max((vNom * vNom) / pNom, 0.1);
      const n1 = pinToNetId.get(`${c.id}:1`);
      const n2 = pinToNetId.get(`${c.id}:2`);
      if (n1 && n2) addResistor(nodeMap.get(n1) ?? -1, nodeMap.get(n2) ?? -1, rLamp);
    } else if (c.type === 'sensor_module') {
      const nVcc = pinToNetId.get(`${c.id}:vcc`);
      const nGnd = pinToNetId.get(`${c.id}:gnd`);
      if (nVcc && nGnd) addResistor(nodeMap.get(nVcc) ?? -1, nodeMap.get(nGnd) ?? -1, 1000);
    } else if (c.type === 'relay_module_1ch' || c.type === 'time_relay') {
      const nVcc = pinToNetId.get(`${c.id}:vcc`);
      const nGnd = pinToNetId.get(`${c.id}:gnd`);
      if (nVcc && nGnd) addResistor(nodeMap.get(nVcc) ?? -1, nodeMap.get(nGnd) ?? -1, 1000);
      const nCom = pinToNetId.get(`${c.id}:com`);
      const nNc = pinToNetId.get(`${c.id}:nc`);
      if (nCom && nNc) addResistor(nodeMap.get(nCom) ?? -1, nodeMap.get(nNc) ?? -1, 0.001);
    }
  }

  // Inject 1 mA test current into net1 (positive node)
  const idx1 = nodeMap.get(net1) ?? -1;
  if (idx1 < 0) {
    return { resistance: Infinity, hasLiveVoltageWarning: hasLiveSources };
  }

  I[idx1] += 0.001; // 1 mA injected into pin 1

  const solution = solveLinearSystem(G, I);
  const v1 = solution[idx1];

  // R = V1 / 1 mA = V1 / 0.001
  const rMeasured = v1 / 0.001;

  if (rMeasured >= 1e8 || rMeasured < 0 || !isFinite(rMeasured)) {
    return { resistance: Infinity, hasLiveVoltageWarning: hasLiveSources };
  }

  return {
    resistance: Math.round(rMeasured * 100) / 100,
    hasLiveVoltageWarning: hasLiveSources,
  };
}

/**
 * Main Circuit Solver
 */
export function solveCircuit(
  components: ComponentInstance[],
  wires: Wire[],
  junctionsOrTime?: Junction[] | number,
  compDefMap?: Map<string, ComponentDef>,
  simTimeSeconds: number = 0,
  prevThermalStates: Record<string, ThermalState> = {},
  prevWireThermalStates: Record<string, ThermalState> = {},
  dtSeconds: number = 0.05
): SolverStepResult {
  const junctions: Junction[] = Array.isArray(junctionsOrTime) ? junctionsOrTime : [];
  const timeSec = typeof junctionsOrTime === 'number' ? junctionsOrTime : simTimeSeconds;
  const defMap = compDefMap || COMPONENT_MAP;
  const { pinToNetId, nets } = extractNetlist(components, wires, junctions, defMap);

  // 1. Identify Ground Reference Node
  let refNetId: string | null = null;
  const acSources = components.filter(c => c.type === 'ac_source');
  if (acSources.length > 0) {
    const src = acSources[0];
    refNetId = pinToNetId.get(`${src.id}:O`) || null;
  }
  if (!refNetId) {
    const dcSources = components.filter(c => c.type === 'dc_source');
    if (dcSources.length > 0) {
      refNetId = pinToNetId.get(`${dcSources[0].id}:neg`) || null;
    }
  }
  if (!refNetId) {
    const gnd = components.find(c => c.type === 'gnd');
    if (gnd) {
      refNetId = pinToNetId.get(`${gnd.id}:gnd`) || null;
    }
  }
  if (!refNetId) {
    const vcc = components.find(c => c.type === 'vcc');
    if (vcc) {
      const otherNets = nets.filter(n => !n.pinKeys.includes(`${vcc.id}:vcc`));
      if (otherNets.length > 0) refNetId = otherNets[0].id;
    }
  }
  if (!refNetId && nets.length > 0) {
    refNetId = nets[0].id;
  }

  // 2. Identify all electrical nodes (Nets + internal Chassis nodes)
  const nodeMap = new Map<string, number>();
  let nextNodeIdx = 0;

  const REF_NODE_NAME = refNetId || '__gnd_ref__';
  nodeMap.set(REF_NODE_NAME, -1);

  for (const net of nets) {
    if (net.id !== REF_NODE_NAME && !nodeMap.has(net.id)) {
      nodeMap.set(net.id, nextNodeIdx++);
    }
  }

  const chassisComps = components.filter(c =>
    ['ceiling_fan', 'appliance_generic', 'lamp_fluorescent', 'lamp'].includes(c.type)
  );
  for (const c of chassisComps) {
    const caseKey = `case:${c.id}`;
    if (!nodeMap.has(caseKey)) {
      nodeMap.set(caseKey, nextNodeIdx++);
    }
  }

  const numNodes = nextNodeIdx;

  // Voltage source branches
  interface VSourceBranch {
    id: string;
    posNode: number;
    negNode: number;
    voltage: number;
  }
  const vSources: VSourceBranch[] = [];

  const deadShortSources: Record<string, number> = {};

  for (const src of acSources) {
    // Check if source is burned/damaged
    const isDamaged = prevThermalStates[src.id]?.status === 'damaged';
    if (!isDamaged) {
      const vPosNet = pinToNetId.get(`${src.id}:A`);
      const vNegNet = pinToNetId.get(`${src.id}:O`);
      if (vPosNet && vNegNet && vPosNet === vNegNet) {
        // Direct dead short across source terminals!
        const vVal = Number(src.props.voltage) || 220;
        deadShortSources[src.id] = vVal / 0.05;
      } else {
        const posIdx = vPosNet ? (nodeMap.get(vPosNet) ?? -1) : -1;
        const negIdx = vNegNet ? (nodeMap.get(vNegNet) ?? -1) : -1;
        vSources.push({
          id: src.id,
          posNode: posIdx,
          negNode: negIdx,
          voltage: Number(src.props.voltage) || 220,
        });
      }
    }
  }

  const dcSources = components.filter(c => c.type === 'dc_source');
  for (const src of dcSources) {
    const isDamaged = prevThermalStates[src.id]?.status === 'damaged';
    if (!isDamaged) {
      const vPosNet = pinToNetId.get(`${src.id}:pos`);
      const vNegNet = pinToNetId.get(`${src.id}:neg`);
      if (vPosNet && vNegNet && vPosNet === vNegNet) {
        // Direct dead short across source terminals!
        const vVal = Number(src.props.voltage) || 9;
        deadShortSources[src.id] = vVal / 0.1;
      } else {
        const posIdx = vPosNet ? (nodeMap.get(vPosNet) ?? -1) : -1;
        const negIdx = vNegNet ? (nodeMap.get(vNegNet) ?? -1) : -1;
        vSources.push({
          id: src.id,
          posNode: posIdx,
          negNode: negIdx,
          voltage: Number(src.props.voltage) || 9,
        });
      }
    }
  }

  const vccSources = components.filter(c => c.type === 'vcc');
  for (const src of vccSources) {
    const vNet = pinToNetId.get(`${src.id}:vcc`);
    const posIdx = vNet ? (nodeMap.get(vNet) ?? -1) : -1;
    vSources.push({
      id: src.id,
      posNode: posIdx,
      negNode: -1,
      voltage: Number(src.props.voltage) || 5,
    });
  }

  // Dynamic protective devices states for re-solve loop
  const dynamicallyTripped = new Set<string>();
  const dynamicallyBlown = new Set<string>();

  const computeSensorDoHigh = (c: ComponentInstance, isPowered: boolean, prevDoHigh?: boolean): boolean => {
    if (!isPowered) return false;
    const sensorType = c.props.sensorType || 'light';

    if (sensorType === 'pir') {
      return Boolean(c.props.motionDetected);
    }

    let minVal = 0, maxVal = 100;
    let defaultThresh = 50;
    let defaultCond: 'below' | 'above' = 'below';

    if (sensorType === 'temperature' || sensorType === 'temp') {
      minVal = -10;
      maxVal = 80;
      defaultThresh = 35;
      defaultCond = 'above';
    } else if (sensorType === 'humidity') {
      minVal = 0;
      maxVal = 100;
      defaultThresh = 70;
      defaultCond = 'above';
    } else if (sensorType === 'gas') {
      minVal = 0;
      maxVal = 1000;
      defaultThresh = 300;
      defaultCond = 'above';
    } else if (sensorType === 'smoke') {
      minVal = 0;
      maxVal = 100;
      defaultThresh = 30;
      defaultCond = 'above';
    } else if (sensorType === 'ultrasonic') {
      minVal = 2;
      maxVal = 400;
      defaultThresh = 50;
      defaultCond = 'below';
    }

    const curVal = Number(c.props.envValue ?? defaultThresh);
    const threshold = Number(c.props.threshold ?? defaultThresh);
    const triggerCond = c.props.triggerCondition || defaultCond;

    const span = maxVal - minVal;
    const hyst = 0.02 * span; // ±2% hysteresis

    if (triggerCond === 'below') {
      if (prevDoHigh === true) {
        return curVal <= threshold + hyst;
      } else if (prevDoHigh === false) {
        return curVal < threshold - hyst;
      } else {
        return curVal < threshold;
      }
    } else {
      if (prevDoHigh === true) {
        return curVal >= threshold - hyst;
      } else if (prevDoHigh === false) {
        return curVal > threshold + hyst;
      } else {
        return curVal > threshold;
      }
    }
  };

  const computeRelayEnergized = (vSup: number, vInRel: number, prevEnergized?: boolean): boolean => {
    if (vSup < 3.5) return false;
    const highThreshold = 0.6 * vSup;
    const lowThreshold = 0.3 * vSup;

    if (prevEnergized === true) {
      return vInRel > lowThreshold;
    } else {
      return vInRel >= highThreshold;
    }
  };

  const computeTimeRelay = (
    c: ComponentInstance,
    vSup: number,
    vInRel: number,
    dt: number
  ): { isEnergized: boolean; timer: number; isCounting: boolean } => {
    const mode = c.props.mode || 'on_delay';
    const delayTime = Math.max(1, Number(c.props.delayTime) || 10);
    const timer = Number(c.props._timer ?? 0);
    const prevEnergized = Boolean(c.props._isEnergized ?? false);

    if (vSup < 3.5) {
      return { isEnergized: false, timer: 0, isCounting: false };
    }

    const isHigh = vInRel >= 0.6 * vSup;

    if (mode === 'on_delay') {
      if (isHigh) {
        if (prevEnergized) {
          return { isEnergized: true, timer: delayTime, isCounting: false };
        } else {
          const nextTimer = timer + dt;
          if (nextTimer >= delayTime) {
            return { isEnergized: true, timer: delayTime, isCounting: false };
          } else {
            return { isEnergized: false, timer: nextTimer, isCounting: true };
          }
        }
      } else {
        return { isEnergized: false, timer: 0, isCounting: false };
      }
    } else {
      // off_delay
      if (isHigh) {
        return { isEnergized: true, timer: 0, isCounting: false };
      } else {
        if (prevEnergized) {
          const nextTimer = timer + dt;
          if (nextTimer >= delayTime) {
            return { isEnergized: false, timer: 0, isCounting: false };
          } else {
            return { isEnergized: true, timer: nextTimer, isCounting: true };
          }
        } else {
          return { isEnergized: false, timer: 0, isCounting: false };
        }
      }
    }
  };

  // Linear System Builder
  const buildAndSolve = (
    ledConduction: Record<string, boolean>,
    controlStates?: {
      sensorPowered?: Record<string, boolean>;
      sensorDoHigh?: Record<string, boolean>;
      relayEnergized?: Record<string, boolean>;
    }
  ) => {
    const totalMatrixSize = numNodes + vSources.length;
    const G: number[][] = Array.from({ length: totalMatrixSize }, () =>
      new Array(totalMatrixSize).fill(0)
    );
    const I: number[] = new Array(totalMatrixSize).fill(0);

    const addResistor = (u: number, v: number, r: number) => {
      if (r <= 0) r = 1e-6;
      const g = 1 / r;
      if (u >= 0 && u < numNodes) {
        G[u][u] += g;
      }
      if (v >= 0 && v < numNodes) {
        G[v][v] += g;
      }
      if (u >= 0 && v >= 0 && u < numNodes && v < numNodes) {
        G[u][v] -= g;
        G[v][u] -= g;
      }
    };

    // Shunt gmin
    for (let i = 0; i < numNodes; i++) {
      G[i][i] += 1e-9;
    }

    for (const c of components) {
      const isDamaged = prevThermalStates[c.id]?.status === 'damaged';
      if (isDamaged) {
        // Burned/blown components become open circuit (1 GΩ)
        continue;
      }

      if (c.type === 'ac_source') {
        if (c.props.hasPE) {
          const peNet = pinToNetId.get(`${c.id}:PE`) || pinToNetId.get(`${c.id}:pe`);
          if (peNet) {
            const peIdx = nodeMap.get(peNet) ?? -1;
            const oNet = pinToNetId.get(`${c.id}:O`);
            const oIdx = oNet ? (nodeMap.get(oNet) ?? -1) : -1;
            addResistor(peIdx, oIdx, 0.1);
          }
        }
      } else if (c.type === 'earth_ground') {
        const peNet = pinToNetId.get(`${c.id}:pe`) || pinToNetId.get(`${c.id}:PE`);
        if (peNet) {
          const peIdx = nodeMap.get(peNet) ?? -1;
          const rDat = Number(c.props.resistance ?? 4) || 4;
          addResistor(peIdx, -1, rDat);
        }
      } else if (c.type === 'socket') {
        // Socket terminals A, O, PE connect directly
      } else if (c.type === 'resistor') {
        const net1 = pinToNetId.get(`${c.id}:1`);
        const net2 = pinToNetId.get(`${c.id}:2`);
        if (net1 && net2) {
          const r = Number(c.props.resistance ?? 1000) || 1000;
          addResistor(nodeMap.get(net1) ?? -1, nodeMap.get(net2) ?? -1, r);
        }
      } else if (c.type === 'potentiometer') {
        const rTot = Number(c.props.resistance ?? 10000) || 10000;
        const ratio = Math.max(0.001, Math.min(0.999, Number(c.props.ratio ?? 50) / 100));
        const net1 = pinToNetId.get(`${c.id}:1`);
        const netWiper = pinToNetId.get(`${c.id}:2`);
        const net2 = pinToNetId.get(`${c.id}:3`);
        if (net1 && netWiper) addResistor(nodeMap.get(net1) ?? -1, nodeMap.get(netWiper) ?? -1, rTot * ratio);
        if (netWiper && net2) addResistor(nodeMap.get(netWiper) ?? -1, nodeMap.get(net2) ?? -1, rTot * (1 - ratio));
      } else if (c.type === 'capacitor_ceramic' || c.type === 'capacitor_electrolytic') {
        const net1 = pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:pos`);
        const net2 = pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:neg`);
        if (net1 && net2) {
          addResistor(nodeMap.get(net1) ?? -1, nodeMap.get(net2) ?? -1, 1e7);
        }
      } else if (c.type === 'ammeter') {
        const net1 = pinToNetId.get(`${c.id}:pos`) || pinToNetId.get(`${c.id}:1`);
        const net2 = pinToNetId.get(`${c.id}:neg`) || pinToNetId.get(`${c.id}:2`);
        if (net1 && net2) {
          addResistor(nodeMap.get(net1) ?? -1, nodeMap.get(net2) ?? -1, 0.001);
        }
      } else if (c.type === 'voltmeter') {
        const net1 = pinToNetId.get(`${c.id}:pos`) || pinToNetId.get(`${c.id}:1`);
        const net2 = pinToNetId.get(`${c.id}:neg`) || pinToNetId.get(`${c.id}:2`);
        if (net1 && net2) {
          addResistor(nodeMap.get(net1) ?? -1, nodeMap.get(net2) ?? -1, 1e7);
        }
      } else if (c.type === 'wattmeter') {
        // Current coil I+ -> I- (1 mΩ)
        const nI1 = pinToNetId.get(`${c.id}:I+`);
        const nI2 = pinToNetId.get(`${c.id}:I-`);
        if (nI1 && nI2) {
          addResistor(nodeMap.get(nI1) ?? -1, nodeMap.get(nI2) ?? -1, 0.001);
        }
        // Voltage coil U+ -> U- (10 MΩ)
        const nU1 = pinToNetId.get(`${c.id}:U+`);
        const nU2 = pinToNetId.get(`${c.id}:U-`);
        if (nU1 && nU2) {
          addResistor(nodeMap.get(nU1) ?? -1, nodeMap.get(nU2) ?? -1, 1e7);
        }
      } else if (c.type === 'ohmmeter') {
        // In main circuit, ohmmeter is open (1 GΩ)
        const net1 = pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:pos`);
        const net2 = pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:neg`);
        if (net1 && net2) {
          addResistor(nodeMap.get(net1) ?? -1, nodeMap.get(net2) ?? -1, 1e9);
        }
      } else if (c.type === 'switch_2p') {
        const isClosed = Boolean(c.props.state);
        const net1 = pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:in`) || pinToNetId.get(`${c.id}:A`);
        const net2 = pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:out`) || pinToNetId.get(`${c.id}:B`);
        if (net1 && net2 && isClosed) {
          addResistor(nodeMap.get(net1) ?? -1, nodeMap.get(net2) ?? -1, 0.001);
        }
      } else if (c.type === 'push_button') {
        const isClosed = Boolean(c.props.state);
        const net1 = pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:in`);
        const net2 = pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:out`);
        if (net1 && net2 && isClosed) {
          addResistor(nodeMap.get(net1) ?? -1, nodeMap.get(net2) ?? -1, 0.001);
        }
      } else if (c.type === 'switch_3p') {
        const netCom = pinToNetId.get(`${c.id}:com`) || pinToNetId.get(`${c.id}:COM`) || pinToNetId.get(`${c.id}:0`);
        const isPosA = c.props.state === true || c.props.state === 1 || c.props.state === 'a' || c.props.state === '1';
        const netTarget = isPosA
          ? (pinToNetId.get(`${c.id}:a`) || pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:A`))
          : (pinToNetId.get(`${c.id}:b`) || pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:B`));
        if (netCom && netTarget) {
          addResistor(nodeMap.get(netCom) ?? -1, nodeMap.get(netTarget) ?? -1, 0.001);
        }
      } else if (c.type === 'kwh_meter') {
        // Công tơ điện: mỗi cực nối thông 1 mΩ (pha vào↔pha ra: 1↔2; trung tính vào↔trung tính ra: 3↔4)
        const netPIn = pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:in_p`) || pinToNetId.get(`${c.id}:in`);
        const netPOut = pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:out_p`) || pinToNetId.get(`${c.id}:out`);
        if (netPIn && netPOut) {
          addResistor(nodeMap.get(netPIn) ?? -1, nodeMap.get(netPOut) ?? -1, 0.001);
        }
        const netNIn = pinToNetId.get(`${c.id}:3`) || pinToNetId.get(`${c.id}:in_n`);
        const netNOut = pinToNetId.get(`${c.id}:4`) || pinToNetId.get(`${c.id}:out_n`);
        if (netNIn && netNOut) {
          addResistor(nodeMap.get(netNIn) ?? -1, nodeMap.get(netNOut) ?? -1, 0.001);
        }
      } else if (c.type === 'cb' || c.type === 'knife_switch') {
        const isTripped = Boolean(c.props.isTripped) || dynamicallyTripped.has(c.id);
        const isClosed = Boolean(c.props.state) && !isTripped;
        const poles = c.props.poles || (c.type === 'knife_switch' ? 2 : 1);
        if (isClosed) {
          if (poles === 1) {
            const inNet = pinToNetId.get(`${c.id}:in`) || pinToNetId.get(`${c.id}:in1`);
            const outNet = pinToNetId.get(`${c.id}:out`) || pinToNetId.get(`${c.id}:out1`);
            if (inNet && outNet) {
              addResistor(nodeMap.get(inNet) ?? -1, nodeMap.get(outNet) ?? -1, 0.001);
            }
          } else {
            for (let p = 1; p <= poles; p++) {
              const inNet = pinToNetId.get(`${c.id}:in${p}`);
              const outNet = pinToNetId.get(`${c.id}:out${p}`);
              if (inNet && outNet) {
                addResistor(nodeMap.get(inNet) ?? -1, nodeMap.get(outNet) ?? -1, 0.001);
              }
            }
          }
        }
      } else if (c.type === 'fuse') {
        const isBlown = Boolean(c.props.isBlown) || prevThermalStates[c.id]?.status === 'blown' || dynamicallyBlown.has(c.id);
        if (!isBlown) {
          const poles = c.props.poles || 1;
          if (poles === 1) {
            const inNet = pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:in`);
            const outNet = pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:out`);
            if (inNet && outNet) {
              addResistor(nodeMap.get(inNet) ?? -1, nodeMap.get(outNet) ?? -1, 0.001);
            }
          } else {
            for (let p = 1; p <= poles; p++) {
              const inNet = pinToNetId.get(`${c.id}:in${p}`);
              const outNet = pinToNetId.get(`${c.id}:out${p}`);
              if (inNet && outNet) {
                addResistor(nodeMap.get(inNet) ?? -1, nodeMap.get(outNet) ?? -1, 0.001);
              }
            }
          }
        }
      } else if (['ceiling_fan', 'appliance_generic', 'lamp_fluorescent', 'lamp', 'electric_bell'].includes(c.type)) {
        const power = Number(c.props.power) || (c.type === 'ceiling_fan' ? 60 : c.type === 'lamp_fluorescent' ? 36 : c.type === 'electric_bell' ? 25 : 60);
        const rLoad = Math.max((220 * 220) / power, 10);

        const netA = pinToNetId.get(`${c.id}:A`) || pinToNetId.get(`${c.id}:1`);
        const netO = pinToNetId.get(`${c.id}:O`) || pinToNetId.get(`${c.id}:2`);
        if (netA && netO) {
          addResistor(nodeMap.get(netA) ?? -1, nodeMap.get(netO) ?? -1, rLoad);
        }

        const caseIdx = nodeMap.get(`case:${c.id}`) ?? -1;
        if (c.props.hasPE) {
          const peNet = pinToNetId.get(`${c.id}:PE`) || pinToNetId.get(`${c.id}:pe`);
          if (peNet) {
            const peIdx = nodeMap.get(peNet) ?? -1;
            addResistor(caseIdx, peIdx, 0.001);
          }
        }
        if (c.props.leakToCase) {
          if (netA) {
            const aIdx = nodeMap.get(netA) ?? -1;
            addResistor(aIdx, caseIdx, 10);
          }
        }
        if (c.props.humanTouch) {
          addResistor(caseIdx, -1, 1000);
        }
      } else if (c.type === 'led' || c.type === 'diode') {
        const netA = pinToNetId.get(`${c.id}:A`) || pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:pos`);
        const netK = pinToNetId.get(`${c.id}:K`) || pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:neg`);
        if (netA && netK) {
          const isConducting = ledConduction[c.id] ?? true;
          if (isConducting) {
            const vf = c.type === 'diode' ? 0.7 : (c.props.color === 'blue' || c.props.color === 'white' ? 3.0 : 2.0);
            const rEq = (vf / 0.0146) + 10;
            addResistor(nodeMap.get(netA) ?? -1, nodeMap.get(netK) ?? -1, rEq);
          } else {
            addResistor(nodeMap.get(netA) ?? -1, nodeMap.get(netK) ?? -1, 1e7);
          }
        }
      } else if (c.type === 'lamp_dc') {
        const vNom = Number(c.props.voltage) || 5;
        const pNom = Number(c.props.power) || 1;
        const rLamp = Math.max((vNom * vNom) / pNom, 0.1);
        const net1 = pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:pos`);
        const net2 = pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:neg`);
        if (net1 && net2) {
          addResistor(nodeMap.get(net1) ?? -1, nodeMap.get(net2) ?? -1, rLamp);
        }
      } else if (c.type === 'sensor_module') {
        const netVcc = pinToNetId.get(`${c.id}:vcc`) || pinToNetId.get(`${c.id}:VCC`);
        const netGnd = pinToNetId.get(`${c.id}:gnd`) || pinToNetId.get(`${c.id}:GND`);
        const netDo = pinToNetId.get(`${c.id}:do`) || pinToNetId.get(`${c.id}:DO`);
        const netAo = pinToNetId.get(`${c.id}:ao`) || pinToNetId.get(`${c.id}:AO`);

        const uVcc = netVcc ? (nodeMap.get(netVcc) ?? -1) : -1;
        const uGnd = netGnd ? (nodeMap.get(netGnd) ?? -1) : -1;
        const uDo = netDo ? (nodeMap.get(netDo) ?? -1) : -1;
        const uAo = netAo ? (nodeMap.get(netAo) ?? -1) : -1;

        if (uVcc >= 0 && uGnd >= 0) {
          addResistor(uVcc, uGnd, 1000);
        }

        const isDoHigh = controlStates?.sensorDoHigh?.[c.id] ?? false;
        if (uDo >= 0) {
          if (isDoHigh && uVcc >= 0) {
            addResistor(uDo, uVcc, 100);
          } else if (uGnd >= 0) {
            addResistor(uDo, uGnd, 100);
          }
        }

        const sensorType = c.props.sensorType || 'light';
        let minVal = 0, maxVal = 100;
        if (sensorType === 'temperature' || sensorType === 'temp') {
          minVal = -10;
          maxVal = 80;
        } else if (sensorType === 'gas') {
          minVal = 0;
          maxVal = 1000;
        } else if (sensorType === 'smoke') {
          minVal = 0;
          maxVal = 100;
        } else if (sensorType === 'ultrasonic') {
          minVal = 2;
          maxVal = 400;
        }
        const curVal = Number(c.props.envValue ?? (sensorType === 'temp' || sensorType === 'temperature' ? 25 : sensorType === 'humidity' ? 60 : sensorType === 'gas' ? 300 : sensorType === 'ultrasonic' ? 50 : 50));
        const k = Math.max(0.0001, Math.min(0.9999, (curVal - minVal) / Math.max(1, maxVal - minVal)));

        if (uAo >= 0) {
          const isPowered = controlStates?.sensorPowered?.[c.id] ?? true;
          if (isPowered && uVcc >= 0 && uGnd >= 0) {
            addResistor(uAo, uVcc, 100 / k);
            addResistor(uAo, uGnd, 100 / (1 - k));
          } else if (uGnd >= 0) {
            addResistor(uAo, uGnd, 100);
          }
        }
      } else if (c.type === 'relay_module_1ch' || c.type === 'time_relay') {
        const netVcc = pinToNetId.get(`${c.id}:vcc`) || pinToNetId.get(`${c.id}:VCC`);
        const netGnd = pinToNetId.get(`${c.id}:gnd`) || pinToNetId.get(`${c.id}:GND`);
        const netIn = pinToNetId.get(`${c.id}:in`) || pinToNetId.get(`${c.id}:IN`);
        const netCom = pinToNetId.get(`${c.id}:com`) || pinToNetId.get(`${c.id}:COM`);
        const netNo = pinToNetId.get(`${c.id}:no`) || pinToNetId.get(`${c.id}:NO`);
        const netNc = pinToNetId.get(`${c.id}:nc`) || pinToNetId.get(`${c.id}:NC`);

        const uVcc = netVcc ? (nodeMap.get(netVcc) ?? -1) : -1;
        const uGnd = netGnd ? (nodeMap.get(netGnd) ?? -1) : -1;
        const uIn = netIn ? (nodeMap.get(netIn) ?? -1) : -1;
        const uCom = netCom ? (nodeMap.get(netCom) ?? -1) : -1;
        const uNo = netNo ? (nodeMap.get(netNo) ?? -1) : -1;
        const uNc = netNc ? (nodeMap.get(netNc) ?? -1) : -1;

        if (uIn >= 0 && uGnd >= 0) {
          addResistor(uIn, uGnd, 10000);
        }

        const isEnergized = controlStates?.relayEnergized?.[c.id] ?? false;

        if (uVcc >= 0 && uGnd >= 0) {
          addResistor(uVcc, uGnd, isEnergized ? 70 : 1000);
        }

        if (uCom >= 0 && uNo >= 0) {
          addResistor(uCom, uNo, isEnergized ? 0.001 : 1e7);
        }
        if (uCom >= 0 && uNc >= 0) {
          addResistor(uCom, uNc, isEnergized ? 1e7 : 0.001);
        }
      }
    }

    // Stamp voltage sources
    vSources.forEach((src, vIdx) => {
      const branchRow = numNodes + vIdx;
      if (src.posNode >= 0) {
        G[src.posNode][branchRow] += 1;
        G[branchRow][src.posNode] += 1;
      }
      if (src.negNode >= 0) {
        G[src.negNode][branchRow] -= 1;
        G[branchRow][src.negNode] -= 1;
      }
      I[branchRow] = src.voltage;
    });

    const solution = solveLinearSystem(G, I);
    const nodeVoltages: Record<string, number> = {
      [REF_NODE_NAME]: 0,
    };
    for (const [key, idx] of nodeMap.entries()) {
      if (idx >= 0 && idx < numNodes) {
        nodeVoltages[key] = solution[idx];
      } else if (idx === -1) {
        nodeVoltages[key] = 0;
      }
    }

    const sourceCurrents: Record<string, number> = {};
    vSources.forEach((src, vIdx) => {
      sourceCurrents[src.id] = Math.abs(solution[numNodes + vIdx] || 0);
    });

    return { nodeVoltages, sourceCurrents };
  };

  // Pass 1 solve
  const initialConduction: Record<string, boolean> = {};
  for (const c of components) {
    if (c.type === 'led' || c.type === 'diode') initialConduction[c.id] = true;
  }

  const initialControlStates = {
    sensorPowered: {} as Record<string, boolean>,
    sensorDoHigh: {} as Record<string, boolean>,
    relayEnergized: {} as Record<string, boolean>,
  };

  for (const c of components) {
    if (c.type === 'sensor_module') {
      const assumedPowered = vSources.length > 0;
      initialControlStates.sensorPowered[c.id] = assumedPowered;
      initialControlStates.sensorDoHigh[c.id] = computeSensorDoHigh(c, assumedPowered, c.props._doHigh);
    } else if (c.type === 'relay_module_1ch' || c.type === 'time_relay') {
      initialControlStates.relayEnergized[c.id] = Boolean(c.props._isEnergized);
    }
  }

  let solveOutput = buildAndSolve(initialConduction, initialControlStates);
  let nodeVoltages = solveOutput.nodeVoltages;
  let sourceCurrents = solveOutput.sourceCurrents;

  // Check diode bias direction and re-solve if needed
  let needsResolve = false;
  const refinedConduction = { ...initialConduction };
  for (const c of components) {
    if (c.type === 'led' || c.type === 'diode') {
      const netA = pinToNetId.get(`${c.id}:A`) || pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:pos`);
      const netK = pinToNetId.get(`${c.id}:K`) || pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:neg`);
      const vA = netA ? (nodeVoltages[netA] ?? 0) : 0;
      const vK = netK ? (nodeVoltages[netK] ?? 0) : 0;
      if (vA - vK < 0.1) {
        refinedConduction[c.id] = false;
        needsResolve = true;
      }
    }
  }

  const refinedControlStates = {
    sensorPowered: { ...initialControlStates.sensorPowered },
    sensorDoHigh: { ...initialControlStates.sensorDoHigh },
    relayEnergized: { ...initialControlStates.relayEnergized },
  };

  for (const c of components) {
    if (c.type === 'sensor_module') {
      const netVcc = pinToNetId.get(`${c.id}:vcc`) || pinToNetId.get(`${c.id}:VCC`);
      const netGnd = pinToNetId.get(`${c.id}:gnd`) || pinToNetId.get(`${c.id}:GND`);
      const vVcc = netVcc ? (nodeVoltages[netVcc] ?? 0) : 0;
      const vGnd = netGnd ? (nodeVoltages[netGnd] ?? 0) : 0;
      const vSup = vVcc - vGnd;
      const isPowered = vSup >= 3.0;
      const doHigh = computeSensorDoHigh(c, isPowered, c.props._doHigh);

      if (refinedControlStates.sensorPowered[c.id] !== isPowered || refinedControlStates.sensorDoHigh[c.id] !== doHigh) {
        refinedControlStates.sensorPowered[c.id] = isPowered;
        refinedControlStates.sensorDoHigh[c.id] = doHigh;
        needsResolve = true;
      }
    }
  }

  for (const c of components) {
    if (c.type === 'relay_module_1ch') {
      const netVcc = pinToNetId.get(`${c.id}:vcc`) || pinToNetId.get(`${c.id}:VCC`);
      const netGnd = pinToNetId.get(`${c.id}:gnd`) || pinToNetId.get(`${c.id}:GND`);
      const netIn = pinToNetId.get(`${c.id}:in`) || pinToNetId.get(`${c.id}:IN`);
      const vVcc = netVcc ? (nodeVoltages[netVcc] ?? 0) : 0;
      const vGnd = netGnd ? (nodeVoltages[netGnd] ?? 0) : 0;
      const vIn = netIn ? (nodeVoltages[netIn] ?? 0) : 0;
      const vSup = vVcc - vGnd;
      const vInRel = vIn - vGnd;
      const isEnergized = computeRelayEnergized(vSup, vInRel, c.props._isEnergized);

      if (refinedControlStates.relayEnergized[c.id] !== isEnergized) {
        refinedControlStates.relayEnergized[c.id] = isEnergized;
        needsResolve = true;
      }
    } else if (c.type === 'time_relay') {
      const netVcc = pinToNetId.get(`${c.id}:vcc`) || pinToNetId.get(`${c.id}:VCC`);
      const netGnd = pinToNetId.get(`${c.id}:gnd`) || pinToNetId.get(`${c.id}:GND`);
      const netIn = pinToNetId.get(`${c.id}:in`) || pinToNetId.get(`${c.id}:IN`);
      const vVcc = netVcc ? (nodeVoltages[netVcc] ?? 0) : 0;
      const vGnd = netGnd ? (nodeVoltages[netGnd] ?? 0) : 0;
      const vIn = netIn ? (nodeVoltages[netIn] ?? 0) : 0;
      const vSup = vVcc - vGnd;
      const vInRel = vIn - vGnd;
      const trRes = computeTimeRelay(c, vSup, vInRel, dtSeconds);

      if (refinedControlStates.relayEnergized[c.id] !== trRes.isEnergized) {
        refinedControlStates.relayEnergized[c.id] = trRes.isEnergized;
        needsResolve = true;
      }
    }
  }

  if (needsResolve) {
    solveOutput = buildAndSolve(refinedConduction, refinedControlStates);
    nodeVoltages = solveOutput.nodeVoltages;
    sourceCurrents = solveOutput.sourceCurrents;
  }

  // 6. Post-processing calculations
  const componentVoltages: Record<string, number> = {};
  const componentCurrents: Record<string, number> = {};
  const componentPowers: Record<string, number> = {};
  const signedCapVoltages: Record<string, number> = {};
  const operatingStates: Record<string, boolean> = {};
  const caseStatuses: Record<string, CaseStatus> = {};
  const earthCurrents: Record<string, number> = {};
  const faultCurrents: Record<string, number> = {};
  const trippedComponents: string[] = [];
  const blownComponents: string[] = [];
  const damagedComponents: string[] = [];
  const thermalStates: Record<string, ThermalState> = {};
  const wireCurrents: Record<string, number> = {};
  const wireThermalStates: Record<string, ThermalState> = {};
  const meterMeasurements: Record<string, MeterMeasurement> = {};
  const statusMessages: string[] = [];

  const updateCalculations = () => {
    // Populate source currents
    for (const src of acSources) {
      const iSrc = deadShortSources[src.id] ?? (sourceCurrents[src.id] ?? 0);
      componentCurrents[src.id] = Math.round(iSrc * 100) / 100;
      componentVoltages[src.id] = Number(src.props.voltage) || 220;
      componentPowers[src.id] = Math.round(componentVoltages[src.id] * iSrc * 100) / 100;
    }
    for (const src of dcSources) {
      const iSrc = deadShortSources[src.id] ?? (sourceCurrents[src.id] ?? 0);
      componentCurrents[src.id] = Math.round(iSrc * 100) / 100;
      componentVoltages[src.id] = Number(src.props.voltage) || 9;
      componentPowers[src.id] = Math.round(componentVoltages[src.id] * iSrc * 100) / 100;
    }
    for (const src of vccSources) {
      const iSrc = sourceCurrents[src.id] ?? 0;
      componentCurrents[src.id] = Math.round(iSrc * 100) / 100;
      componentVoltages[src.id] = Number(src.props.voltage) || 5;
      componentPowers[src.id] = Math.round(componentVoltages[src.id] * iSrc * 100) / 100;
    }

    // Calculate per-component V, I, and operating state
    for (const c of components) {
      if (['ceiling_fan', 'lamp', 'lamp_fluorescent', 'appliance_generic', 'electric_bell'].includes(c.type)) {
        const netA = pinToNetId.get(`${c.id}:A`) || pinToNetId.get(`${c.id}:1`);
        const netO = pinToNetId.get(`${c.id}:O`) || pinToNetId.get(`${c.id}:2`);
        const vA = netA ? (nodeVoltages[netA] ?? 0) : 0;
        const vO = netO ? (nodeVoltages[netO] ?? 0) : 0;
        const vDrop = Math.abs(vA - vO);
        const power = Number(c.props.power) || (c.type === 'ceiling_fan' ? 60 : c.type === 'lamp_fluorescent' ? 36 : c.type === 'electric_bell' ? 25 : 60);
        const rLoad = Math.max((220 * 220) / power, 10);
        const iLoad = vDrop / rLoad;
        const pReal = vDrop * iLoad;

        componentVoltages[c.id] = Math.round(vDrop * 100) / 100;
        componentCurrents[c.id] = Math.round(iLoad * 1000) / 1000;
        componentPowers[c.id] = Math.round(pReal * 100) / 100;
        operatingStates[c.id] = pReal >= 0.05 * power; // operates if power >= 5% rated
      } else if (c.type === 'resistor') {
        const net1 = pinToNetId.get(`${c.id}:1`);
        const net2 = pinToNetId.get(`${c.id}:2`);
        const v1 = net1 ? (nodeVoltages[net1] ?? 0) : 0;
        const v2 = net2 ? (nodeVoltages[net2] ?? 0) : 0;
        const vDrop = Math.abs(v1 - v2);
        const r = Number(c.props.resistance ?? 1000) || 1000;
        const iRes = vDrop / r;

        componentVoltages[c.id] = Math.round(vDrop * 100) / 100;
        componentCurrents[c.id] = Math.round(iRes * 10000) / 10000;
        componentPowers[c.id] = Math.round((vDrop * iRes) * 1000) / 1000;
      } else if (c.type === 'ammeter') {
        const net1 = pinToNetId.get(`${c.id}:pos`) || pinToNetId.get(`${c.id}:1`);
        const net2 = pinToNetId.get(`${c.id}:neg`) || pinToNetId.get(`${c.id}:2`);
        const v1 = net1 ? (nodeVoltages[net1] ?? 0) : 0;
        const v2 = net2 ? (nodeVoltages[net2] ?? 0) : 0;
        const iAmp = (v1 - v2) / 0.001;
        const absIAmp = Math.abs(iAmp);

        componentCurrents[c.id] = Math.round(absIAmp * 1000) / 1000;
        componentVoltages[c.id] = Math.round(Math.abs(v1 - v2) * 1000) / 1000;
        meterMeasurements[c.id] = {
          kind: 'A',
          value: absIAmp,
          current: absIAmp,
          formatted: formatMeasure(absIAmp, 'current'),
          isReversePolarity: iAmp < 0,
        };
      } else if (c.type === 'voltmeter') {
        const net1 = pinToNetId.get(`${c.id}:pos`) || pinToNetId.get(`${c.id}:1`);
        const net2 = pinToNetId.get(`${c.id}:neg`) || pinToNetId.get(`${c.id}:2`);
        const v1 = net1 ? (nodeVoltages[net1] ?? 0) : 0;
        const v2 = net2 ? (nodeVoltages[net2] ?? 0) : 0;
        const vMeter = v1 - v2;
        const absVMeter = Math.abs(vMeter);

        componentVoltages[c.id] = Math.round(absVMeter * 100) / 100;
        componentCurrents[c.id] = 0;
        meterMeasurements[c.id] = {
          kind: 'V',
          value: absVMeter,
          voltage: absVMeter,
          formatted: formatMeasure(absVMeter, 'voltage'),
          isReversePolarity: vMeter < 0,
        };
      } else if (c.type === 'wattmeter') {
        const nI1 = pinToNetId.get(`${c.id}:I+`);
        const nI2 = pinToNetId.get(`${c.id}:I-`);
        const nU1 = pinToNetId.get(`${c.id}:U+`);
        const nU2 = pinToNetId.get(`${c.id}:U-`);

        const vI1 = nI1 ? (nodeVoltages[nI1] ?? 0) : 0;
        const vI2 = nI2 ? (nodeVoltages[nI2] ?? 0) : 0;
        const vU1 = nU1 ? (nodeVoltages[nU1] ?? 0) : 0;
        const vU2 = nU2 ? (nodeVoltages[nU2] ?? 0) : 0;

        const iVal = (vI1 - vI2) / 0.001;
        const uVal = vU1 - vU2;
        const isVoltageCoilConnected = Boolean(nU1 && nU2);
        const pReal = isVoltageCoilConnected ? uVal * iVal : 0;

        componentVoltages[c.id] = Math.round(Math.abs(uVal) * 100) / 100;
        componentCurrents[c.id] = Math.round(Math.abs(iVal) * 1000) / 1000;
        componentPowers[c.id] = Math.round(pReal * 100) / 100;

        meterMeasurements[c.id] = {
          kind: 'W',
          value: Math.abs(pReal),
          power: Math.abs(pReal),
          voltage: Math.abs(uVal),
          current: Math.abs(iVal),
          formatted: formatMeasure(Math.abs(pReal), 'power'),
          isReversePolarity: pReal < 0,
          isVoltageCoilConnected,
        };
      } else if (c.type === 'ohmmeter') {
        const resResult = solveOhmmeterResistance(components, wires, junctions, c.id, defMap);
        const rVal = resResult.resistance;
        componentVoltages[c.id] = 0;
        componentCurrents[c.id] = 0;

        meterMeasurements[c.id] = {
          kind: 'Ω',
          value: rVal,
          resistance: rVal,
          formatted: formatMeasure(rVal, 'resistance'),
          hasLiveVoltageWarning: resResult.hasLiveVoltageWarning,
        };
      } else if (c.type === 'kwh_meter') {
        const netPIn = pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:in_p`) || pinToNetId.get(`${c.id}:in`);
        const netPOut = pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:out_p`) || pinToNetId.get(`${c.id}:out`);
        const netNIn = pinToNetId.get(`${c.id}:3`) || pinToNetId.get(`${c.id}:in_n`);
        const netNOut = pinToNetId.get(`${c.id}:4`) || pinToNetId.get(`${c.id}:out_n`);

        const vPIn = netPIn ? (nodeVoltages[netPIn] ?? 0) : 0;
        const vPOut = netPOut ? (nodeVoltages[netPOut] ?? 0) : 0;
        const vNOut = netNOut ? (nodeVoltages[netNOut] ?? 0) : 0;

        // U_tải: điện áp giữa hai chân ra tải (2 và 4)
        const uLoad = Math.abs(vPOut - vNOut);
        // I: dòng điện qua cực pha (1 -> 2)
        const iPhase = Math.abs(vPIn - vPOut) / 0.001;
        // P = U_tải * I
        const pVal = uLoad * iPhase;

        componentVoltages[c.id] = Math.round(uLoad * 100) / 100;
        componentCurrents[c.id] = Math.round(iPhase * 1000) / 1000;
        componentPowers[c.id] = Math.round(pVal * 100) / 100;

        const kwh = Number(c.props.kwh ?? 0);
        meterMeasurements[c.id] = {
          kind: 'kWh',
          value: kwh,
          power: Math.round(pVal * 100) / 100,
          voltage: Math.round(uLoad * 100) / 100,
          current: Math.round(iPhase * 1000) / 1000,
          energyKwh: kwh,
          formatted: `${kwh.toFixed(3).replace('.', ',')} kWh`,
        };
      } else if (c.type === 'led' || c.type === 'diode') {
        const netA = pinToNetId.get(`${c.id}:A`) || pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:pos`);
        const netK = pinToNetId.get(`${c.id}:K`) || pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:neg`);
        const vA = netA ? (nodeVoltages[netA] ?? 0) : 0;
        const vK = netK ? (nodeVoltages[netK] ?? 0) : 0;
        const vAK = vA - vK;
        const isConducting = refinedConduction[c.id] ?? false;
        const vf = c.type === 'diode' ? 0.7 : (c.props.color === 'blue' || c.props.color === 'white' ? 3.0 : 2.0);
        const rEq = (vf / 0.0146) + 10;
        const iLed = isConducting ? Math.max(0, vAK / rEq) : 0;

        componentVoltages[c.id] = Math.round(Math.max(0, vAK) * 100) / 100;
        componentCurrents[c.id] = Math.round(iLed * 10000) / 10000;
        componentPowers[c.id] = Math.round((vAK * iLed) * 1000) / 1000;
        operatingStates[c.id] = isConducting && iLed > 0.001;
      } else if (c.type === 'capacitor_ceramic' || c.type === 'capacitor_electrolytic') {
        const net1 = pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:pos`);
        const net2 = pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:neg`);
        const v1 = net1 ? (nodeVoltages[net1] ?? 0) : 0;
        const v2 = net2 ? (nodeVoltages[net2] ?? 0) : 0;
        const vCap = v1 - v2;
        signedCapVoltages[c.id] = vCap;
        componentVoltages[c.id] = Math.round(Math.abs(vCap) * 100) / 100;
        componentCurrents[c.id] = 0; // DC steady state

        if (c.type === 'capacitor_electrolytic' && vCap < -0.5) {
          statusMessages.push(`CẢNH BÁO: Tụ hóa ${c.label} bị đấu ngược cực! (+ nối âm, − nối dương).`);
        }
      } else if (c.type === 'lamp_dc') {
        const net1 = pinToNetId.get(`${c.id}:1`) || pinToNetId.get(`${c.id}:pos`);
        const net2 = pinToNetId.get(`${c.id}:2`) || pinToNetId.get(`${c.id}:neg`);
        const v1 = net1 ? (nodeVoltages[net1] ?? 0) : 0;
        const v2 = net2 ? (nodeVoltages[net2] ?? 0) : 0;
        const vDrop = Math.abs(v1 - v2);
        const vNom = Number(c.props.voltage) || 5;
        const pNom = Number(c.props.power) || 1;
        const rLamp = Math.max((vNom * vNom) / pNom, 0.1);
        const iLamp = vDrop / rLamp;
        const pReal = vDrop * iLamp;

        componentVoltages[c.id] = Math.round(vDrop * 100) / 100;
        componentCurrents[c.id] = Math.round(iLamp * 1000) / 1000;
        componentPowers[c.id] = Math.round(pReal * 100) / 100;
        operatingStates[c.id] = pReal >= 0.05 * pNom;
      } else if (c.type === 'sensor_module') {
        const netVcc = pinToNetId.get(`${c.id}:vcc`) || pinToNetId.get(`${c.id}:VCC`);
        const netGnd = pinToNetId.get(`${c.id}:gnd`) || pinToNetId.get(`${c.id}:GND`);
        const netDo = pinToNetId.get(`${c.id}:do`) || pinToNetId.get(`${c.id}:DO`);
        const netAo = pinToNetId.get(`${c.id}:ao`) || pinToNetId.get(`${c.id}:AO`);

        const vVcc = netVcc ? (nodeVoltages[netVcc] ?? 0) : 0;
        const vGnd = netGnd ? (nodeVoltages[netGnd] ?? 0) : 0;
        const vDo = netDo ? (nodeVoltages[netDo] ?? 0) : 0;
        const vAo = netAo ? (nodeVoltages[netAo] ?? 0) : 0;
        const vSup = Math.max(0, vVcc - vGnd);

        const isDoHigh = Boolean(refinedControlStates.sensorDoHigh[c.id]);
        const isPowered = Boolean(refinedControlStates.sensorPowered[c.id]);
        const aoVolts = Math.round(Math.abs(vAo - vGnd) * 100) / 100;
        c.props._doHigh = isDoHigh;
        c.props._isPowered = isPowered;
        c.props._aoVoltage = aoVolts;

        componentVoltages[c.id] = Math.round(vSup * 100) / 100;
        componentCurrents[c.id] = isPowered ? Math.round((vSup / 1000) * 1000) / 1000 : 0;
        componentPowers[c.id] = Math.round(componentVoltages[c.id] * componentCurrents[c.id] * 100) / 100;
        operatingStates[c.id] = isDoHigh;
      } else if (c.type === 'relay_module_1ch') {
        const netVcc = pinToNetId.get(`${c.id}:vcc`) || pinToNetId.get(`${c.id}:VCC`);
        const netGnd = pinToNetId.get(`${c.id}:gnd`) || pinToNetId.get(`${c.id}:GND`);
        const vVcc = netVcc ? (nodeVoltages[netVcc] ?? 0) : 0;
        const vGnd = netGnd ? (nodeVoltages[netGnd] ?? 0) : 0;
        const vSup = Math.max(0, vVcc - vGnd);
        const isEnergized = Boolean(refinedControlStates.relayEnergized[c.id]);
        c.props._isEnergized = isEnergized;

        componentVoltages[c.id] = Math.round(vSup * 100) / 100;
        const iCoil = isEnergized ? vSup / 70 : vSup / 1000;
        componentCurrents[c.id] = Math.round(iCoil * 1000) / 1000;
        componentPowers[c.id] = Math.round(vSup * iCoil * 100) / 100;
        operatingStates[c.id] = isEnergized;
      } else if (c.type === 'time_relay') {
        const netVcc = pinToNetId.get(`${c.id}:vcc`) || pinToNetId.get(`${c.id}:VCC`);
        const netGnd = pinToNetId.get(`${c.id}:gnd`) || pinToNetId.get(`${c.id}:GND`);
        const netIn = pinToNetId.get(`${c.id}:in`) || pinToNetId.get(`${c.id}:IN`);
        const vVcc = netVcc ? (nodeVoltages[netVcc] ?? 0) : 0;
        const vGnd = netGnd ? (nodeVoltages[netGnd] ?? 0) : 0;
        const vIn = netIn ? (nodeVoltages[netIn] ?? 0) : 0;
        const vSup = Math.max(0, vVcc - vGnd);
        const vInRel = Math.max(0, vIn - vGnd);

        const trRes = computeTimeRelay(c, vSup, vInRel, dtSeconds);
        c.props._isEnergized = trRes.isEnergized;
        c.props._timer = trRes.timer;
        c.props._isCounting = trRes.isCounting;

        componentVoltages[c.id] = Math.round(vSup * 100) / 100;
        const iCoil = trRes.isEnergized ? vSup / 70 : vSup / 1000;
        componentCurrents[c.id] = Math.round(iCoil * 1000) / 1000;
        componentPowers[c.id] = Math.round(vSup * iCoil * 100) / 100;
        operatingStates[c.id] = trRes.isEnergized;
      }
    }

    // Check Chassis Devices
    for (const c of chassisComps) {
      const vCase = nodeVoltages[`case:${c.id}`] ?? 0;
      const humanTouch = Boolean(c.props.humanTouch);
      const humanCurrent = humanTouch ? (vCase / 1000) * 1000 : 0; // in mA

      let dangerLevel: 'none' | 'mild' | 'warning' | 'danger' = 'none';
      let dangerMessage = '';

      if (humanTouch) {
        if (humanCurrent < 10) {
          dangerLevel = 'mild';
          dangerMessage = 'Tê / giật nhẹ (minh họa)';
        } else if (humanCurrent <= 30) {
          dangerLevel = 'warning';
          dangerMessage = 'Co giật cơ (minh họa)';
        } else {
          dangerLevel = 'danger';
          dangerMessage = 'Nguy hiểm đến tính mạng! (minh họa)';
        }
      }

      caseStatuses[c.id] = {
        caseVoltage: Math.round(vCase * 100) / 100,
        humanCurrent: Math.round(humanCurrent * 100) / 100,
        dangerLevel,
        dangerMessage,
      };
    }

    // Check Earth Ground currents
    const earthGrounds = components.filter(c => c.type === 'earth_ground');
    for (const eg of earthGrounds) {
      const peNet = pinToNetId.get(`${eg.id}:pe`) || pinToNetId.get(`${eg.id}:PE`);
      const vPe = peNet ? (nodeVoltages[peNet] ?? 0) : 0;
      const rDat = Number(eg.props.resistance ?? 4) || 4;
      const iEarth = vPe / rDat;
      earthCurrents[eg.id] = Math.round(iEarth * 1000) / 1000;
    }
  };

  // Step 1: Initial solve post-processing
  updateCalculations();

  const effectiveDt = (timeSec > 0 && Object.keys(prevThermalStates).length === 0) ? timeSec : dtSeconds;

  // Step 2: Check protection devices (Breakers, ELCBs, Fuses)
  const newlyTripped: { id: string; reason: string }[] = [];
  const newlyBlown: { id: string; reason: string }[] = [];

  const breakers = components.filter(c => c.type === 'cb' || c.type === 'knife_switch');
  for (const brk of breakers) {
    if (brk.props.isTripped || dynamicallyTripped.has(brk.id)) {
      if (!trippedComponents.includes(brk.id)) trippedComponents.push(brk.id);
      continue;
    }

    const poles = brk.props.poles || (brk.type === 'knife_switch' ? 2 : 1);
    const inNet1 = pinToNetId.get(`${brk.id}:in1`) || pinToNetId.get(`${brk.id}:in`);
    const outNet1 = pinToNetId.get(`${brk.id}:out1`) || pinToNetId.get(`${brk.id}:out`);
    const vIn1 = inNet1 ? (nodeVoltages[inNet1] ?? 0) : 0;
    const vOut1 = outNet1 ? (nodeVoltages[outNet1] ?? 0) : 0;
    const iPole1 = Math.abs(vIn1 - vOut1) / 0.001;

    let iPole2 = 0;
    if (poles >= 2) {
      const inNet2 = pinToNetId.get(`${brk.id}:in2`);
      const outNet2 = pinToNetId.get(`${brk.id}:out2`);
      const vIn2 = inNet2 ? (nodeVoltages[inNet2] ?? 0) : 0;
      const vOut2 = outNet2 ? (nodeVoltages[outNet2] ?? 0) : 0;
      iPole2 = Math.abs(vIn2 - vOut2) / 0.001;
    }

    const iMax = Math.max(iPole1, iPole2);
    componentCurrents[brk.id] = Math.round(iMax * 100) / 100;
    componentVoltages[brk.id] = Math.round(Math.abs(vIn1 - vOut1) * 1000) / 1000;

    const inVal = Number(brk.props.ratedCurrent) || 16;
    const s = iMax / inVal;

    // Check ELCB Residual Current: |I_phase - I_neutral| > 30 mA
    const isELCB = Boolean(brk.props.isELCB || brk.props.hasELCB || (poles === 2 && brk.props.ratedCurrent === undefined && brk.type === 'knife_switch'));
    const iResidual = Math.abs(iPole1 - iPole2);

    let tripReason: string | null = null;
    if ((isELCB || brk.props.isELCB) && iResidual > 0.030) {
      tripReason = `ELCB NHẢY do dòng rò: ${(iResidual * 1000).toFixed(1)} mA > 30 mA.`;
    } else if (s >= 5.0) {
      tripReason = `Aptomat ${brk.label} NHẢY do ngắn mạch (dòng > 5·In).`;
    } else {
      const prevH = prevThermalStates[brk.id]?.heat || 0;
      let newH = prevH;
      if (s > 1.0) {
        newH += ((s * s - 1) * effectiveDt) / 8.0;
        if (newH >= 1.0) {
          tripReason = `Aptomat ${brk.label} NHẢY do quá tải nhiệt.`;
        }
      }
    }

    if (tripReason) {
      newlyTripped.push({ id: brk.id, reason: tripReason });
    }
  }

  const fuses = components.filter(c => c.type === 'fuse');
  for (const f of fuses) {
    if (f.props.isBlown || prevThermalStates[f.id]?.status === 'blown' || dynamicallyBlown.has(f.id)) {
      if (!blownComponents.includes(f.id)) blownComponents.push(f.id);
      continue;
    }
    const inNet = pinToNetId.get(`${f.id}:1`) || pinToNetId.get(`${f.id}:in`);
    const outNet = pinToNetId.get(`${f.id}:2`) || pinToNetId.get(`${f.id}:out`);
    const vIn = inNet ? (nodeVoltages[inNet] ?? 0) : 0;
    const vOut = outNet ? (nodeVoltages[outNet] ?? 0) : 0;
    const iFuse = Math.abs(vIn - vOut) / 0.001;
    componentCurrents[f.id] = Math.round(iFuse * 100) / 100;
    componentVoltages[f.id] = Math.round(Math.abs(vIn - vOut) * 1000) / 1000;

    const inVal = Number(f.props.ratedCurrent) || 10;
    const s = iFuse / inVal;

    let blowReason: string | null = null;
    if (s >= 5.0) {
      blowReason = `Cầu chì ${f.label} ĐỨT do ngắn mạch (dòng > 5·In).`;
    } else {
      const prevH = prevThermalStates[f.id]?.heat || 0;
      let newH = prevH;
      if (s > 1.0) {
        newH += ((s * s - 1) * effectiveDt) / 2.0;
        if (newH >= 1.0) {
          blowReason = `Cầu chì ${f.label} ĐỨT do quá tải nhiệt.`;
        }
      }
    }

    if (blowReason) {
      newlyBlown.push({ id: f.id, reason: blowReason });
    }
  }

  const protectionDeviceTriggered = newlyTripped.length > 0 || newlyBlown.length > 0;

  if (protectionDeviceTriggered) {
    // Step 3: Thiết bị bảo vệ vừa nhảy/đứt: Giải lại mạch & BỎ QUA tích lũy nhiệt bước này
    for (const t of newlyTripped) {
      dynamicallyTripped.add(t.id);
      if (!trippedComponents.includes(t.id)) trippedComponents.push(t.id);
      const prevH = prevThermalStates[t.id]?.heat || 1.0;
      thermalStates[t.id] = { heat: Math.max(1.0, prevH), stress: 0, status: 'tripped', damageType: 'trip' };
      statusMessages.push(t.reason);
    }
    for (const b of newlyBlown) {
      dynamicallyBlown.add(b.id);
      if (!blownComponents.includes(b.id)) blownComponents.push(b.id);
      thermalStates[b.id] = { heat: 2.5, stress: 0, status: 'blown', damageType: 'blow' };
      statusMessages.push(b.reason);
    }

    // Giải lại mạch với tiếp điểm thiết bị bảo vệ mở
    solveOutput = buildAndSolve(refinedConduction, refinedControlStates);
    nodeVoltages = solveOutput.nodeVoltages;
    sourceCurrents = solveOutput.sourceCurrents;
    updateCalculations();

    // BỎ QUA việc tích lũy nhiệt cho bước này cho toàn bộ linh kiện và dây còn lại
    for (const c of components) {
      if (dynamicallyTripped.has(c.id) || dynamicallyBlown.has(c.id)) continue;
      const prev = prevThermalStates[c.id];
      if (prev) {
        thermalStates[c.id] = { ...prev };
        if (prev.status === 'damaged') damagedComponents.push(c.id);
        if (prev.status === 'tripped') trippedComponents.push(c.id);
        if (prev.status === 'blown') blownComponents.push(c.id);
      } else {
        thermalStates[c.id] = { heat: 0, stress: 0, status: 'normal' };
      }
    }

    for (const w of wires) {
      const prevW = prevWireThermalStates[w.id];
      wireThermalStates[w.id] = prevW ? { ...prevW } : { heat: 0, stress: 0, status: 'normal', damageType: 'melt' };
      wireCurrents[w.id] = 0;
    }
  } else {
    // Step 4: Không có thiết bị bảo vệ vừa nhảy -> Cập nhật nhiệt và hỏng hóc bình thường
    for (const c of components) {
      const spec = COMPONENT_THERMAL_SPECS[c.type];
      const prev = prevThermalStates[c.id] || { heat: 0, stress: 0, status: 'normal' };

      if (prev.status === 'damaged' || prev.status === 'blown') {
        thermalStates[c.id] = { ...prev };
        if (prev.status === 'blown') blownComponents.push(c.id);
        if (prev.status === 'damaged') damagedComponents.push(c.id);
        continue;
      }

      // Aptomat đang ở trạng thái hở mạch (đã nhảy hoặc công tắc tắt): giảm nhiệt theo tauCool (4s)
      if (c.type === 'cb' || c.type === 'knife_switch') {
        const isTripped = Boolean(c.props.isTripped) || dynamicallyTripped.has(c.id);
        const isOpen = isTripped || !c.props.state;
        if (isOpen) {
          let h = prev.heat;
          h -= (h * effectiveDt) / 4.0;
          if (h < 0) h = 0;
          const status = isTripped ? 'tripped' : (h > 1.0 ? 'hot' : 'normal');
          if (isTripped && !trippedComponents.includes(c.id)) trippedComponents.push(c.id);
          thermalStates[c.id] = {
            heat: Math.round(h * 1000) / 1000,
            stress: 0,
            status,
            damageType: 'trip',
          };
          continue;
        }
      }

      if (!spec) {
        thermalStates[c.id] = { heat: 0, stress: 0, status: 'normal' };
        continue;
      }

      const cur = componentCurrents[c.id] || 0;
      const volt = componentVoltages[c.id] || 0;
      const pwr = componentPowers[c.id] || 0;

      const stressInfo = spec.calculateStress({
        voltage: volt,
        current: cur,
        power: pwr,
        ratedVoltage: Number(c.props.voltage || c.props.ratedVoltage),
        ratedCurrent: Number(c.props.ratedCurrent),
        ratedPower: Number(c.props.power || c.props.ratedPower),
        isReversePolarity: c.type === 'capacitor_electrolytic' && ((signedCapVoltages[c.id] !== undefined ? signedCapVoltages[c.id] : volt) < -0.5),
      });

      let h = prev.heat;
      if (stressInfo.instantExplode || (stressInfo.instantTrip && stressInfo.damageType === 'explode')) {
        h = 2.5; // Instant explosion
      } else if (stressInfo.instantTrip && stressInfo.damageType === 'trip') {
        // Aptomat never damaged, trips keeping current heat
        if (!trippedComponents.includes(c.id)) trippedComponents.push(c.id);
        thermalStates[c.id] = { heat: Math.max(1.0, h), stress: stressInfo.stress, status: 'tripped', damageType: 'trip' };
        statusMessages.push(`Aptomat ${c.label} NHẢY do ngắn mạch (dòng > 5·In).`);
        continue;
      } else if (stressInfo.instantTrip && stressInfo.damageType === 'blow') {
        // Instant fuse blow
        blownComponents.push(c.id);
        thermalStates[c.id] = { heat: 2.5, stress: stressInfo.stress, status: 'blown', damageType: 'blow' };
        statusMessages.push(`Cầu chì ${c.label} ĐỨT do ngắn mạch (dòng > 5·In).`);
        continue;
      } else if (stressInfo.stress > 1.0) {
        h += (stressInfo.overloadRate * effectiveDt) / spec.tauHeatSec;
      } else {
        h -= (h * effectiveDt) / (spec.tauCoolSec || DEFAULT_TAU_COOL);
        if (h < 0) h = 0;
      }

      let status: 'normal' | 'hot' | 'damaged' | 'tripped' | 'blown' = 'normal';
      if (stressInfo.damageType === 'trip' && h >= 1.0) {
        status = 'tripped';
        // Giữ nguyên h >= 1.0, không đặt h = 0 khi nhảy
        if (!trippedComponents.includes(c.id)) trippedComponents.push(c.id);
        statusMessages.push(`Aptomat ${c.label} NHẢY do quá tải nhiệt.`);
      } else if (stressInfo.damageType === 'blow' && h >= 1.0) {
        status = 'blown';
        blownComponents.push(c.id);
        statusMessages.push(`Cầu chì ${c.label} ĐỨT do quá tải nhiệt.`);
      } else if (h > 2.0) {
        if (c.type !== 'cb' && c.type !== 'knife_switch') {
          status = 'damaged';
          damagedComponents.push(c.id);
          statusMessages.push(`Linh kiện ${c.label} (${c.type}) ĐÃ BỊ HỎNG / CHÁY do quá tải.`);
        } else {
          status = 'tripped';
          if (!trippedComponents.includes(c.id)) trippedComponents.push(c.id);
        }
      } else if (h > 1.0) {
        status = 'hot';
      }

      thermalStates[c.id] = {
        heat: Math.round(h * 1000) / 1000,
        stress: Math.round(stressInfo.stress * 100) / 100,
        status,
        damageType: stressInfo.damageType,
      };
    }

    // Wire current & thermal accumulation
    for (const w of wires) {
      const fromCompId = w.from.compId;
      const toCompId = w.to.compId;
      let iWire = 0;

      // Approximate wire current from connected components
      if (fromCompId && toCompId && fromCompId === toCompId && deadShortSources[fromCompId]) {
        iWire = deadShortSources[fromCompId];
      } else if (fromCompId && deadShortSources[fromCompId]) {
        iWire = deadShortSources[fromCompId];
      } else if (toCompId && deadShortSources[toCompId]) {
        iWire = deadShortSources[toCompId];
      } else if (fromCompId && componentCurrents[fromCompId] !== undefined) {
        iWire = componentCurrents[fromCompId];
      } else if (toCompId && componentCurrents[toCompId] !== undefined) {
        iWire = componentCurrents[toCompId];
      }

      wireCurrents[w.id] = iWire;
      const prevW = prevWireThermalStates[w.id] || { heat: 0, stress: 0, status: 'normal' };

      if (prevW.status === 'damaged') {
        wireThermalStates[w.id] = { ...prevW };
        continue;
      }

      const wStress = calculateWireStress(iWire, w.crossSection || 2.5);
      let hw = prevW.heat;

      if (wStress.stress > 1.0) {
        hw += (wStress.overloadRate * effectiveDt) / wStress.tauHeatSec;
      } else {
        hw -= (hw * effectiveDt) / wStress.tauCoolSec;
        if (hw < 0) hw = 0;
      }

      let wStatus: 'normal' | 'hot' | 'damaged' = 'normal';
      if (hw > 2.0) {
        wStatus = 'damaged';
        statusMessages.push(`Dây dẫn ${w.id} (tiết diện ${w.crossSection} mm²) ĐÃ BỊ CHÁY HỎNG!`);
      } else if (hw > 1.0) {
        wStatus = 'hot';
      }

      wireThermalStates[w.id] = {
        heat: Math.round(hw * 1000) / 1000,
        stress: Math.round(wStress.stress * 100) / 100,
        status: wStatus,
        damageType: 'melt',
      };
    }
  }

  // 9. Open Circuit Analysis
  let openCircuit: OpenCircuitInfo | undefined;
  if (acSources.length > 0) {
    const src = acSources[0];
    const srcANet = pinToNetId.get(`${src.id}:A`);
    const srcONet = pinToNetId.get(`${src.id}:O`);
    if (!srcANet) {
      openCircuit = { isOpen: true, reason: 'Mạch hở: Nguồn điện chưa nối dây ở cực Pha (A)', componentId: src.id, missingPinId: 'A' };
    } else if (!srcONet) {
      openCircuit = { isOpen: true, reason: 'Mạch hở: Nguồn điện chưa nối dây ở cực Trung tính (O)', componentId: src.id, missingPinId: 'O' };
    } else {
      const loads = components.filter(c => ['ceiling_fan', 'lamp', 'lamp_fluorescent', 'appliance_generic', 'electric_bell'].includes(c.type));
      for (const ld of loads) {
        const pinA = pinToNetId.get(`${ld.id}:A`) || pinToNetId.get(`${ld.id}:1`);
        const pinO = pinToNetId.get(`${ld.id}:O`) || pinToNetId.get(`${ld.id}:2`);
        const vPinA = pinA ? (nodeVoltages[pinA] ?? 0) : 0;
        const isConnectedToA = pinA && vPinA > 10;
        const isConnectedToO = pinO === srcONet;

        if (isConnectedToA && !isConnectedToO) {
          const ldName = ld.type === 'ceiling_fan' ? 'quạt trần' : ld.type === 'lamp_fluorescent' ? 'đèn huỳnh quang' : ld.type === 'lamp' ? 'bóng đèn' : 'thiết bị';
          openCircuit = {
            isOpen: true,
            reason: `Mạch hở: ${ldName} (${ld.label}) chưa nối về chân O của nguồn`,
            componentId: ld.id,
            missingPinId: ld.type === 'appliance_generic' ? 'O' : '2',
          };
          break;
        }
      }
    }
  } else if (dcSources.length > 0) {
    const src = dcSources[0];
    const posNet = pinToNetId.get(`${src.id}:pos`);
    const negNet = pinToNetId.get(`${src.id}:neg`);
    if (!posNet) {
      openCircuit = { isOpen: true, reason: 'Mạch hở: Nguồn DC chưa nối dây ở cực dương (+)', componentId: src.id, missingPinId: 'pos' };
    } else if (!negNet) {
      openCircuit = { isOpen: true, reason: 'Mạch hở: Nguồn DC chưa nối dây ở cực âm (−)', componentId: src.id, missingPinId: 'neg' };
    }
  }

  return {
    nodeVoltages,
    componentCurrents,
    componentVoltages,
    componentPowers,
    operatingStates,
    caseStatuses,
    earthCurrents,
    faultCurrents,
    trippedComponents,
    blownComponents,
    damagedComponents,
    thermalStates,
    wireCurrents,
    wireThermalStates,
    meterMeasurements,
    statusMessages,
    openCircuit,
  };
}
