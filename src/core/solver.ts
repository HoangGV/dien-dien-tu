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
  kind: 'A' | 'V' | 'W' | 'Ω';
  value: number;
  formatted: string;
  voltage?: number;
  current?: number;
  power?: number;
  resistance?: number;
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
    } else if (c.type === 'socket') {
      // Socket pins A and O are wired natively
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

  // Linear System Builder
  const buildAndSolve = (ledConduction: Record<string, boolean>) => {
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
        const net1 = pinToNetId.get(`${c.id}:1`);
        const net2 = pinToNetId.get(`${c.id}:2`);
        if (net1 && net2 && isClosed) {
          addResistor(nodeMap.get(net1) ?? -1, nodeMap.get(net2) ?? -1, 0.001);
        }
      } else if (c.type === 'push_button') {
        const isClosed = Boolean(c.props.state);
        const net1 = pinToNetId.get(`${c.id}:1`);
        const net2 = pinToNetId.get(`${c.id}:2`);
        if (net1 && net2 && isClosed) {
          addResistor(nodeMap.get(net1) ?? -1, nodeMap.get(net2) ?? -1, 0.001);
        }
      } else if (c.type === 'switch_3p') {
        const netCom = pinToNetId.get(`${c.id}:com`);
        const targetPin = (c.props.state === true || c.props.state === 1) ? 'a' : 'b';
        const netTarget = pinToNetId.get(`${c.id}:${targetPin}`);
        if (netCom && netTarget) {
          addResistor(nodeMap.get(netCom) ?? -1, nodeMap.get(netTarget) ?? -1, 0.001);
        }
      } else if (c.type === 'cb' || c.type === 'knife_switch') {
        const isTripped = Boolean(c.props.isTripped) || prevThermalStates[c.id]?.status === 'tripped';
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
        const isBlown = Boolean(c.props.isBlown) || prevThermalStates[c.id]?.status === 'blown';
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
  let solveOutput = buildAndSolve(initialConduction);
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
  if (needsResolve) {
    solveOutput = buildAndSolve(refinedConduction);
    nodeVoltages = solveOutput.nodeVoltages;
    sourceCurrents = solveOutput.sourceCurrents;
  }

  // 6. Post-processing calculations
  const componentVoltages: Record<string, number> = {};
  const componentCurrents: Record<string, number> = {};
  const componentPowers: Record<string, number> = {};
  const signedCapVoltages: Record<string, number> = {};

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

  // Check Breakers and Fuses
  const breakers = components.filter(c => c.type === 'cb' || c.type === 'knife_switch');
  for (const brk of breakers) {
    if (brk.props.isTripped || prevThermalStates[brk.id]?.status === 'tripped') {
      trippedComponents.push(brk.id);
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

    // Check ELCB Residual Current: |I_phase - I_neutral| > 30 mA
    const isELCB = Boolean(brk.props.isELCB || brk.props.hasELCB || (poles === 2 && brk.props.ratedCurrent === undefined && brk.type === 'knife_switch'));
    const iResidual = Math.abs(iPole1 - iPole2);

    if ((isELCB || brk.props.isELCB) && iResidual > 0.030) {
      trippedComponents.push(brk.id);
      statusMessages.push(`ELCB NHẢY do dòng rò: ${(iResidual * 1000).toFixed(1)} mA > 30 mA.`);
    }
  }

  // Calculate Fuses
  const fuses = components.filter(c => c.type === 'fuse');
  for (const f of fuses) {
    if (f.props.isBlown || prevThermalStates[f.id]?.status === 'blown') {
      blownComponents.push(f.id);
      continue;
    }
    const inNet = pinToNetId.get(`${f.id}:1`) || pinToNetId.get(`${f.id}:in`);
    const outNet = pinToNetId.get(`${f.id}:2`) || pinToNetId.get(`${f.id}:out`);
    const vIn = inNet ? (nodeVoltages[inNet] ?? 0) : 0;
    const vOut = outNet ? (nodeVoltages[outNet] ?? 0) : 0;
    const iFuse = Math.abs(vIn - vOut) / 0.001;
    componentCurrents[f.id] = Math.round(iFuse * 100) / 100;
    componentVoltages[f.id] = Math.round(Math.abs(vIn - vOut) * 1000) / 1000;
  }

  // 7. Thermal accumulation & damage updates (dt step)
  const effectiveDt = (timeSec > 0 && Object.keys(prevThermalStates).length === 0) ? timeSec : dtSeconds;

  for (const c of components) {
    const spec = COMPONENT_THERMAL_SPECS[c.type];
    const prev = prevThermalStates[c.id] || { heat: 0, stress: 0, status: 'normal' };

    if (prev.status === 'damaged' || prev.status === 'tripped' || prev.status === 'blown') {
      thermalStates[c.id] = { ...prev };
      if (prev.status === 'tripped') trippedComponents.push(c.id);
      if (prev.status === 'blown') blownComponents.push(c.id);
      if (prev.status === 'damaged') damagedComponents.push(c.id);
      continue;
    }

    if (trippedComponents.includes(c.id)) {
      thermalStates[c.id] = { heat: 2.5, stress: 1.0, status: 'tripped', damageType: 'trip' };
      continue;
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
      // Instant breaker magnetic trip
      trippedComponents.push(c.id);
      thermalStates[c.id] = { heat: 2.5, stress: stressInfo.stress, status: 'tripped', damageType: 'trip' };
      statusMessages.push(`Aptomat ${c.label} NHẢY do ngắn mạch (dòng > 5·In).`);
      continue;
    } else if (stressInfo.instantTrip && stressInfo.damageType === 'blow') {
      // Instant fuse blow
      blownComponents.push(c.id);
      thermalStates[c.id] = { heat: 2.5, stress: stressInfo.stress, status: 'blown', damageType: 'blow' };
      statusMessages.push(`Cầu chì ${c.label} ĐỨT do ngắn mạch (dòng > 5·In).`);
      continue;
    } else if (stressInfo.stress > 1.0) {
      // Heating up: dh = overloadRate * dt / tauHeat
      h += (stressInfo.overloadRate * effectiveDt) / spec.tauHeatSec;
    } else {
      // Cooling down: dh = -h * dt / tauCool
      h -= (h * effectiveDt) / (spec.tauCoolSec || DEFAULT_TAU_COOL);
      if (h < 0) h = 0;
    }

    let status: 'normal' | 'hot' | 'damaged' | 'tripped' | 'blown' = 'normal';
    if (stressInfo.damageType === 'trip' && h >= 1.0) {
      status = 'tripped';
      trippedComponents.push(c.id);
      statusMessages.push(`Aptomat ${c.label} NHẢY do quá tải nhiệt.`);
    } else if (stressInfo.damageType === 'blow' && h >= 1.0) {
      status = 'blown';
      blownComponents.push(c.id);
      statusMessages.push(`Cầu chì ${c.label} ĐỨT do quá tải nhiệt.`);
    } else if (h > 2.0) {
      status = 'damaged';
      damagedComponents.push(c.id);
      statusMessages.push(`Linh kiện ${c.label} (${c.type}) ĐÃ BỊ HỎNG / CHÁY do quá tải.`);
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

  // 8. Wire current & thermal accumulation
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
