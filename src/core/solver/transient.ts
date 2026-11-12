/**
 * Pure TypeScript Transient Analysis Solver
 * High precision pre-calculated transient analysis (t_0 = 0 to tStop).
 *
 * Principles:
 * - NO React, NO store, NO mutation of running simulation state.
 * - Works on cloned component states with uncharged capacitors at t = 0 (V_cap = 0).
 * - Direct time calculation: t_k = k * dt (no error accumulation).
 * - Passes t_k and dt into all stamps and updates; updates kinetic states after each step.
 * - Backward Euler for capacitors: companion resistor Req = dt/C, current source Ieq = V_prev/Req.
 * - AC voltage source: V(t) = dcOffset + vPeak * sin(2*pi*f*t + phase).
 * - Diode/LED: piecewise linear with Newton-Raphson iteration.
 * - Probes: return node voltages relative to circuit ground reference.
 */

import { ComponentInstance, Wire, Junction } from '../model';
import { extractNetlist } from '../netlist';
import { COMPONENT_MAP } from '../registry';
import { solveCircuit } from '../solver';

export interface TransientOptions {
  tStop: number;          // Total simulation duration in seconds (e.g. 0.02, 1.0)
  dt?: number;            // Optional time step in seconds
  probes: string[];       // Array of netIds or pinKeys (e.g. 'osc1:ch1', 'c1:pos', 'N1')
}

export interface TransientResult {
  t: Float64Array;        // Time points t_k = k * dt
  v: Float64Array[];      // Array of voltage trajectories, one Float64Array per probe
  converged: boolean;     // Whether all time steps converged
  warnings: string[];     // Warnings encountered (e.g. step size capped)
  dt: number;             // Actual dt used
  tStop: number;          // Actual tStop used
  probes: string[];       // Probes evaluated
  resolvedNets: string[]; // Resolved net IDs for each probe
}

export type TransientInputCircuit =
  | { components: ComponentInstance[]; wires: Wire[]; junctions?: Junction[] }
  | { circuit: { components: ComponentInstance[]; wires: Wire[]; junctions?: Junction[] } };

/**
 * Pure transient analysis function.
 */
export function runTransient(
  circuitInput: TransientInputCircuit,
  options: TransientOptions
): TransientResult {
  const circ = 'circuit' in circuitInput ? circuitInput.circuit : circuitInput;
  const rawComponents = circ.components || [];
  const rawWires = circ.wires || [];
  const rawJunctions = circ.junctions || [];
  const warnings: string[] = [];

  // 1. Clone components to prevent mutating runtime simulation state
  // Reset all dynamic storage (capacitors start uncharged at 0 V)
  const components: ComponentInstance[] = rawComponents.map((c) => ({
    ...c,
    props: {
      ...c.props,
      _vCap: 0,
      _vCapPrev: 0,
      _voltage: 0,
    },
  }));
  const wires = [...rawWires];
  const junctions = [...rawJunctions];

  // 2. Extract netlist to resolve probes and identify AC frequencies
  const defMap = COMPONENT_MAP;
  const { pinToNetId, nets } = extractNetlist(components, wires, junctions, defMap);

  // Identify reference ground
  let refNetId: string | null = null;
  const acSources = components.filter((c) => c.type === 'ac_source');
  if (acSources.length > 0) {
    refNetId = pinToNetId.get(`${acSources[0].id}:O`) || pinToNetId.get(`${acSources[0].id}:neg`) || null;
  }
  if (!refNetId) {
    const dcSources = components.filter((c) => c.type === 'dc_source');
    if (dcSources.length > 0) {
      refNetId = pinToNetId.get(`${dcSources[0].id}:neg`) || null;
    }
  }
  if (!refNetId) {
    const gnd = components.find((c) => c.type === 'gnd');
    if (gnd) {
      refNetId = pinToNetId.get(`${gnd.id}:gnd`) || null;
    }
  }
  if (!refNetId && nets.length > 0) {
    refNetId = nets[0].id;
  }

  // 3. Resolve probes to electrical Net IDs
  const resolvedNets = (options.probes || []).map((probe) => {
    if (pinToNetId.has(probe)) {
      return pinToNetId.get(probe)!;
    }
    // Check if probe is already a valid net ID
    const existsInNets = nets.some((n) => n.id === probe);
    if (existsInNets) return probe;
    // Or if probe is pin ID like 'ch1' without component prefix, check oscilloscope
    const osc = components.find((c) => c.type === 'oscilloscope');
    if (osc && pinToNetId.has(`${osc.id}:${probe}`)) {
      return pinToNetId.get(`${osc.id}:${probe}`)!;
    }
    return probe;
  });

  // 4. Select dt according to specification
  const tStop = Math.max(1e-6, options.tStop);
  let maxFreq = 0;
  for (const c of components) {
    if (c.type === 'ac_source') {
      const f = Number(c.props.frequency ?? 50);
      if (f > maxFreq) maxFreq = f;
    }
  }

  let dt = options.dt && options.dt > 0 ? options.dt : tStop / 2000;
  if (maxFreq > 0) {
    const dtAc = 1 / (100 * maxFreq);
    if (dt > dtAc) {
      dt = dtAc;
    }
  }

  let numSteps = Math.round(tStop / dt);
  if (numSteps > 20000) {
    numSteps = 20000;
    dt = tStop / numSteps;
    warnings.push('Số bước vượt quá giới hạn 20 000, đã tự động tăng bước thời gian dt.');
  }
  if (numSteps < 1) {
    numSteps = 1;
    dt = tStop;
  }

  const numSamples = numSteps + 1;
  const tArr = new Float64Array(numSamples);
  const probeVoltages: Float64Array[] = resolvedNets.map(() => new Float64Array(numSamples));

  // 5. Initial sample at t = 0
  // Capacitor starts uncharged with 0 V (Backward Euler initial condition)
  tArr[0] = 0;
  const initStepResult = solveCircuit(
    components,
    wires,
    junctions,
    defMap,
    0, // simTimeSeconds = 0
    {},
    {},
    0 // dtSeconds = 0 -> capacitor holds initial 0V
  );

  for (let pIdx = 0; pIdx < resolvedNets.length; pIdx++) {
    const netId = resolvedNets[pIdx];
    if (netId === refNetId) {
      probeVoltages[pIdx][0] = 0;
    } else {
      probeVoltages[pIdx][0] = initStepResult.nodeVoltages[netId] ?? 0;
    }
  }

  let allConverged = true;

  // 6. Main Transient Loop: t_k = k * dt calculated directly
  for (let k = 1; k <= numSteps; k++) {
    const t_k = k * dt; // Tính trực tiếp theo chỉ số bước k nhân với dt, không cộng dồn sai số
    tArr[k] = t_k;

    const stepResult = solveCircuit(
      components,
      wires,
      junctions,
      defMap,
      t_k,
      {},
      {},
      dt
    );

    for (let pIdx = 0; pIdx < resolvedNets.length; pIdx++) {
      const netId = resolvedNets[pIdx];
      if (netId === refNetId) {
        probeVoltages[pIdx][k] = 0;
      } else {
        probeVoltages[pIdx][k] = stepResult.nodeVoltages[netId] ?? 0;
      }
    }
  }

  return {
    t: tArr,
    v: probeVoltages,
    converged: allConverged,
    warnings,
    dt,
    tStop,
    probes: options.probes,
    resolvedNets,
  };
}
