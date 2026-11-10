/**
 * Standalone Digital Logic Simulator
 * Does NOT touch or alter the continuous MNA electrical solver.
 * Operates on discrete 0, 1, 'X' (undefined), and 'CONFLICT'.
 */

import { CircuitState, ComponentInstance, Wire } from './model';

export type LogicValue = 0 | 1 | 'X' | 'CONFLICT';

export interface LogicSimulationResult {
  netValues: Record<string, LogicValue>;
  pinValues: Record<string, LogicValue>; // key: `${compId}:${pinId}`
  wireValues: Record<string, LogicValue>; // key: wireId
  componentStates: Record<string, any>; // LED active status, etc.
  isOscillating: boolean;
  warning?: string;
  iterationCount: number;
}

export interface TruthTableRow {
  inputs: Record<string, 0 | 1>; // inputCompId or label -> 0 | 1
  output: LogicValue;
  isCurrent: boolean;
}

export interface TruthTableResult {
  inputComps: { id: string; label: string }[];
  outputComp: { id: string; label: string; pinId?: string };
  rows: TruthTableRow[];
  expression: string | null; // e.g. "Y = (A · B) + NOT(C)", null if cyclic
  error?: string;
}

/**
 * Union-Find data structure to partition pins & wires into nets
 */
class UnionFind {
  parent: Record<string, string> = {};

  find(i: string): string {
    if (!this.parent[i]) this.parent[i] = i;
    if (this.parent[i] === i) return i;
    this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }

  union(i: string, j: string) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent[rootI] = rootJ;
    }
  }
}

/**
 * Evaluates a single gate logic function
 */
export function evaluateGate(
  gateType: string,
  inputs: LogicValue[]
): LogicValue {
  const normType = (gateType || 'AND').toUpperCase();

  switch (normType) {
    case 'NOT': {
      const inVal = inputs[0] ?? 'X';
      if (inVal === 1) return 0;
      if (inVal === 0) return 1;
      return 'X';
    }

    case 'AND': {
      // If ANY input is 0, output is definitely 0
      if (inputs.some((v) => v === 0)) return 0;
      // If any input is X or CONFLICT, result is X
      if (inputs.some((v) => v === 'X' || v === 'CONFLICT')) return 'X';
      // If all inputs are 1
      if (inputs.length > 0 && inputs.every((v) => v === 1)) return 1;
      return 'X';
    }

    case 'OR': {
      // If ANY input is 1, output is definitely 1
      if (inputs.some((v) => v === 1)) return 1;
      // If any input is X or CONFLICT, result is X
      if (inputs.some((v) => v === 'X' || v === 'CONFLICT')) return 'X';
      // If all inputs are 0
      if (inputs.length > 0 && inputs.every((v) => v === 0)) return 0;
      return 'X';
    }

    case 'NAND': {
      // If ANY input is 0, output is definitely 1
      if (inputs.some((v) => v === 0)) return 1;
      // If any input is X or CONFLICT, result is X
      if (inputs.some((v) => v === 'X' || v === 'CONFLICT')) return 'X';
      // If all inputs are 1
      if (inputs.length > 0 && inputs.every((v) => v === 1)) return 0;
      return 'X';
    }

    case 'NOR': {
      // If ANY input is 1, output is definitely 0
      if (inputs.some((v) => v === 1)) return 0;
      // If any input is X or CONFLICT, result is X
      if (inputs.some((v) => v === 'X' || v === 'CONFLICT')) return 'X';
      // If all inputs are 0
      if (inputs.length > 0 && inputs.every((v) => v === 0)) return 1;
      return 'X';
    }

    case 'XOR': {
      const a = inputs[0] ?? 'X';
      const b = inputs[1] ?? 'X';
      if (a === 'X' || a === 'CONFLICT' || b === 'X' || b === 'CONFLICT') return 'X';
      return a !== b ? 1 : 0;
    }

    case 'XNOR': {
      const a = inputs[0] ?? 'X';
      const b = inputs[1] ?? 'X';
      if (a === 'X' || a === 'CONFLICT' || b === 'X' || b === 'CONFLICT') return 'X';
      return a === b ? 1 : 0;
    }

    default:
      return 'X';
  }
}

/**
 * Run discrete logic simulation on circuit
 */
export function runLogicSimulation(circuit: CircuitState): LogicSimulationResult {
  const uf = new UnionFind();

  // 1. Group connected pins via wires
  for (const w of circuit.wires) {
    const pinA = `${w.from.compId}:${w.from.pinId}`;
    const pinB = `${w.to.compId}:${w.to.pinId}`;
    uf.union(pinA, pinB);
  }

  // Map each pin to its root net
  const pinToNet: Record<string, string> = {};
  const netPins: Record<string, string[]> = {};

  const registerPin = (compId: string, pinId: string) => {
    const pKey = `${compId}:${pinId}`;
    const netId = uf.find(pKey);
    pinToNet[pKey] = netId;
    if (!netPins[netId]) netPins[netId] = [];
    netPins[netId].push(pKey);
  };

  // Register all pins of components in circuit
  for (const c of circuit.components) {
    if (c.type === 'logic_switch' || c.type === 'logic_push_button' || c.type === 'logic_high' || c.type === 'logic_low') {
      registerPin(c.id, 'Q');
    } else if (c.type === 'logic_led') {
      registerPin(c.id, 'in');
    } else if (c.type === 'logic_gate') {
      const inputsCount = c.props.inputsCount || (c.props.gateType === 'NOT' ? 1 : 2);
      const pinLetters = ['A', 'B', 'C', 'D'].slice(0, inputsCount);
      for (const p of pinLetters) {
        registerPin(c.id, p);
      }
      registerPin(c.id, 'Y');
    }
  }

  // Helper to determine active inputs for a gate
  const getGateInputs = (comp: ComponentInstance, currentPinValues: Record<string, LogicValue>): LogicValue[] => {
    const inputsCount = comp.props.inputsCount || (comp.props.gateType === 'NOT' ? 1 : 2);
    const pinLetters = ['A', 'B', 'C', 'D'].slice(0, inputsCount);
    return pinLetters.map((p) => {
      const pKey = `${comp.id}:${p}`;
      return currentPinValues[pKey] ?? 'X';
    });
  };

  // Track initial driver states for components
  const fixedDrivers: Record<string, LogicValue> = {};
  for (const c of circuit.components) {
    if (c.type === 'logic_switch' || c.type === 'logic_push_button') {
      fixedDrivers[`${c.id}:Q`] = c.props.state ? 1 : 0;
    } else if (c.type === 'logic_high') {
      fixedDrivers[`${c.id}:Q`] = 1;
    } else if (c.type === 'logic_low') {
      fixedDrivers[`${c.id}:Q`] = 0;
    }
  }

  // Initialize gate output drivers.
  // When a gate feeds into itself (e.g. NOT gate Y -> A), initializing with previous or default 0
  // allows physical feedback oscillation to trigger rather than stalling at X.
  const gateDrivers: Record<string, LogicValue> = {};
  for (const c of circuit.components) {
    if (c.type === 'logic_gate') {
      gateDrivers[`${c.id}:Y`] = 0;
    }
  }

  let netValues: Record<string, LogicValue> = {};
  let pinValues: Record<string, LogicValue> = {};
  let isOscillating = false;
  let iteration = 0;
  const MAX_ITERATIONS = 50;

  // History to detect cycling oscillation
  const stateHistory: string[] = [];

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    // Step A: For each net, collect all driver pins
    const newNetValues: Record<string, LogicValue> = {};

    for (const netId of Object.keys(netPins)) {
      const pinsOnNet = netPins[netId];
      const driversOnNet: LogicValue[] = [];

      for (const p of pinsOnNet) {
        if (p in fixedDrivers) {
          driversOnNet.push(fixedDrivers[p]);
        } else if (p in gateDrivers) {
          // A gate Y pin is a driver ONLY if it has an active input or has been evaluated
          driversOnNet.push(gateDrivers[p]);
        }
      }

      // Check conflict or value
      const hasOne = driversOnNet.some((d) => d === 1);
      const hasZero = driversOnNet.some((d) => d === 0);
      const hasConflict = driversOnNet.some((d) => d === 'CONFLICT') || (hasOne && hasZero);

      if (hasConflict) {
        newNetValues[netId] = 'CONFLICT';
      } else if (hasOne) {
        newNetValues[netId] = 1;
      } else if (hasZero) {
        newNetValues[netId] = 0;
      } else {
        newNetValues[netId] = 'X';
      }
    }

    // Step B: Update all pin values from their net values
    const newPinValues: Record<string, LogicValue> = {};
    for (const [pKey, netId] of Object.entries(pinToNet)) {
      newPinValues[pKey] = newNetValues[netId] ?? 'X';
    }

    // Step C: Update gate outputs for next iteration
    let gatesChanged = false;
    for (const c of circuit.components) {
      if (c.type === 'logic_gate') {
        const inputs = getGateInputs(c, newPinValues);
        const out = evaluateGate(c.props.gateType || 'AND', inputs);
        const yKey = `${c.id}:Y`;
        if (gateDrivers[yKey] !== out) {
          gateDrivers[yKey] = out;
          gatesChanged = true;
        }
      }
    }

    // Check convergence: did net values change?
    let netsChanged = false;
    for (const [netId, val] of Object.entries(newNetValues)) {
      if (netValues[netId] !== val) {
        netsChanged = true;
        break;
      }
    }

    netValues = newNetValues;
    pinValues = newPinValues;

    if (!netsChanged && !gatesChanged) {
      // Stable state reached!
      break;
    }

    // Fingerprint current state to detect cyclic oscillation
    const snapshotKey = Object.entries(netValues)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(';');

    if (stateHistory.includes(snapshotKey) && iteration > 3) {
      isOscillating = true;
      break;
    }
    stateHistory.push(snapshotKey);
  }

  if (iteration >= MAX_ITERATIONS) {
    isOscillating = true;
  }

  let warning: string | undefined;
  if (isOscillating) {
    warning = 'Mạch dao động / vòng phản hồi không ổn định';
    // Set nets involved in oscillation to 'X'
    for (const netId of Object.keys(netValues)) {
      netValues[netId] = 'X';
    }
    for (const pKey of Object.keys(pinValues)) {
      pinValues[pKey] = 'X';
    }
  }

  // Map wire values from their connected pins
  const wireValues: Record<string, LogicValue> = {};
  for (const w of circuit.wires) {
    const pinA = `${w.from.compId}:${w.from.pinId}`;
    const netId = pinToNet[pinA];
    wireValues[w.id] = (netId ? netValues[netId] : 'X') ?? 'X';
  }

  // Component states (e.g. LED on/off/X)
  const componentStates: Record<string, any> = {};
  for (const c of circuit.components) {
    if (c.type === 'logic_led') {
      const inVal = pinValues[`${c.id}:in`] ?? 'X';
      componentStates[c.id] = {
        level: inVal,
        isOn: inVal === 1,
        isX: inVal === 'X',
        isConflict: inVal === 'CONFLICT',
      };
    } else if (c.type === 'logic_gate') {
      const yVal = pinValues[`${c.id}:Y`] ?? 'X';
      componentStates[c.id] = {
        output: yVal,
      };
    }
  }

  return {
    netValues,
    pinValues,
    wireValues,
    componentStates,
    isOscillating,
    warning,
    iterationCount: iteration,
  };
}

/**
 * Generate Truth Table for specified inputs and output
 */
export function generateTruthTable(
  circuit: CircuitState,
  inputCompIds?: string[],
  outputTarget?: { compId: string; pinId?: string }
): TruthTableResult {
  // 1. Identify inputs: logic_switch and logic_push_button connected to wires
  const connectedCompIds = new Set<string>();
  for (const w of circuit.wires) {
    if (w.from.compId) connectedCompIds.add(w.from.compId);
    if (w.to.compId) connectedCompIds.add(w.to.compId);
  }

  const availableInputs = circuit.components.filter(
    (c) =>
      (c.type === 'logic_switch' || c.type === 'logic_push_button') &&
      connectedCompIds.has(c.id)
  );

  const selectedInputs = inputCompIds
    ? availableInputs.filter((c) => inputCompIds.includes(c.id))
    : availableInputs;

  if (selectedInputs.length === 0) {
    return {
      inputComps: [],
      outputComp: { id: '', label: '' },
      rows: [],
      expression: null,
      error: 'Chưa có công tắc hoặc nút bấm nào được nối vào mạch.',
    };
  }

  if (selectedInputs.length > 5) {
    return {
      inputComps: selectedInputs.map((c) => ({ id: c.id, label: c.label || c.id })),
      outputComp: { id: '', label: '' },
      rows: [],
      expression: null,
      error: 'Tối đa 5 đầu vào. Vui lòng ngắt bớt công tắc hoặc chọn tối đa 5 đầu vào.',
    };
  }

  // 2. Identify output target
  let chosenOutput: { compId: string; label: string; pinId?: string } | null = null;

  if (outputTarget) {
    const comp = circuit.components.find((c) => c.id === outputTarget.compId);
    if (comp) {
      chosenOutput = {
        compId: comp.id,
        label: comp.label || comp.id,
        pinId: outputTarget.pinId || (comp.type === 'logic_led' ? 'in' : 'Y'),
      };
    }
  }

  if (!chosenOutput) {
    // Default to first LED, or first gate Y
    const led = circuit.components.find((c) => c.type === 'logic_led');
    if (led) {
      chosenOutput = { compId: led.id, label: led.label || 'LED', pinId: 'in' };
    } else {
      const gate = circuit.components.find((c) => c.type === 'logic_gate');
      if (gate) {
        chosenOutput = { compId: gate.id, label: gate.label || `${gate.props.gateType || 'Cổng'} (Y)`, pinId: 'Y' };
      }
    }
  }

  if (!chosenOutput) {
    return {
      inputComps: selectedInputs.map((c) => ({ id: c.id, label: c.label || c.id })),
      outputComp: { id: '', label: '' },
      rows: [],
      expression: null,
      error: 'Chưa có LED hoặc ngõ ra cổng logic nào trong mạch.',
    };
  }

  // Sort inputs by label (e.g. A, B, C...)
  selectedInputs.sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id));

  const n = selectedInputs.length;
  const numRows = Math.pow(2, n);
  const rows: TruthTableRow[] = [];

  // Current real states of inputs
  const currentRealStates: Record<string, 0 | 1> = {};
  for (const inp of selectedInputs) {
    currentRealStates[inp.id] = inp.props.state ? 1 : 0;
  }

  // Run all 2^n combinations on a cloned circuit
  for (let i = 0; i < numRows; i++) {
    const inputCombo: Record<string, 0 | 1> = {};

    // Determine bits for each input
    for (let bit = 0; bit < n; bit++) {
      const inp = selectedInputs[bit];
      const bitVal = ((i >> (n - 1 - bit)) & 1) as 0 | 1;
      inputCombo[inp.id] = bitVal;
    }

    // Clone circuit with updated states
    const clonedComps = circuit.components.map((c) => {
      if (inputCombo[c.id] !== undefined) {
        return {
          ...c,
          props: {
            ...c.props,
            state: inputCombo[c.id] === 1,
          },
        };
      }
      return c;
    });

    const simRes = runLogicSimulation({
      ...circuit,
      components: clonedComps,
    });

    const outPinKey = `${chosenOutput.compId}:${chosenOutput.pinId}`;
    const outVal = simRes.pinValues[outPinKey] ?? 'X';

    const isCurrent = selectedInputs.every(
      (inp) => inputCombo[inp.id] === currentRealStates[inp.id]
    );

    rows.push({
      inputs: inputCombo,
      output: outVal,
      isCurrent,
    });
  }

  // 3. Build logic expression if acyclic
  const expression = buildLogicExpression(circuit, chosenOutput.compId, chosenOutput.pinId || 'in');

  return {
    inputComps: selectedInputs.map((c) => ({ id: c.id, label: c.label || c.id })),
    outputComp: {
      id: chosenOutput.compId,
      label: chosenOutput.label,
      pinId: chosenOutput.pinId,
    },
    rows,
    expression,
  };
}

/**
 * Builds unreduced boolean logic expression tracing back from output to inputs.
 * Returns null if cycle/feedback is detected.
 */
function buildLogicExpression(
  circuit: CircuitState,
  targetCompId: string,
  targetPinId: string
): string | null {
  const visited = new Set<string>();

  const tracePin = (compId: string, pinId: string): string | null => {
    const nodeKey = `${compId}:${pinId}`;
    if (visited.has(nodeKey)) {
      return null; // Cyclic feedback loop detected!
    }
    visited.add(nodeKey);

    const comp = circuit.components.find((c) => c.id === compId);
    if (!comp) return null;

    if (comp.type === 'logic_switch' || comp.type === 'logic_push_button') {
      return comp.label || comp.id;
    }
    if (comp.type === 'logic_high') return '1';
    if (comp.type === 'logic_low') return '0';

    if (comp.type === 'logic_led') {
      // Trace wire leading to 'in'
      const inWire = circuit.wires.find(
        (w) =>
          (w.to.compId === comp.id && w.to.pinId === 'in') ||
          (w.from.compId === comp.id && w.from.pinId === 'in')
      );
      if (!inWire) return null;
      const other = inWire.to.compId === comp.id ? inWire.from : inWire.to;
      if (!other.compId || !other.pinId) return null;
      return tracePin(other.compId, other.pinId);
    }

    if (comp.type === 'logic_gate') {
      const gateType = (comp.props.gateType || 'AND').toUpperCase();
      const inputsCount = comp.props.inputsCount || (gateType === 'NOT' ? 1 : 2);
      const pinLetters = ['A', 'B', 'C', 'D'].slice(0, inputsCount);

      const inSubExprs: string[] = [];

      for (const p of pinLetters) {
        const inWire = circuit.wires.find(
          (w) =>
            (w.to.compId === comp.id && w.to.pinId === p) ||
            (w.from.compId === comp.id && w.from.pinId === p)
        );
        if (!inWire) {
          inSubExprs.push('X');
        } else {
          const other = inWire.to.compId === comp.id ? inWire.from : inWire.to;
          if (!other.compId || !other.pinId) return null;
          const sub = tracePin(other.compId, other.pinId);
          if (!sub) return null; // cycle
          inSubExprs.push(sub);
        }
      }

      if (gateType === 'NOT') {
        return `NOT(${inSubExprs[0]})`;
      }
      if (gateType === 'AND') {
        return `(${inSubExprs.join(' · ')})`;
      }
      if (gateType === 'OR') {
        return `(${inSubExprs.join(' + ')})`;
      }
      if (gateType === 'NAND') {
        return `NOT(${inSubExprs.join(' · ')})`;
      }
      if (gateType === 'NOR') {
        return `NOT(${inSubExprs.join(' + ')})`;
      }
      if (gateType === 'XOR') {
        return `(${inSubExprs.join(' ⊕ ')})`;
      }
      if (gateType === 'XNOR') {
        return `NOT(${inSubExprs.join(' ⊕ ')})`;
      }
    }

    return null;
  };

  const rawExpr = tracePin(targetCompId, targetPinId);
  if (!rawExpr) return null;
  return `Y = ${rawExpr}`;
}
