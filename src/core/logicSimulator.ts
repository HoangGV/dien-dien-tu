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
    if (
      c.type === 'logic_switch' ||
      c.type === 'logic_push_button' ||
      c.type === 'logic_high' ||
      c.type === 'logic_low' ||
      c.type === 'logic_clock'
    ) {
      registerPin(c.id, 'Q');
    } else if (c.type === 'logic_led') {
      registerPin(c.id, 'in');
    } else if (c.type === 'logic_7segment') {
      registerPin(c.id, 'D0');
      registerPin(c.id, 'D1');
      registerPin(c.id, 'D2');
      registerPin(c.id, 'D3');
    } else if (c.type === 'logic_gate') {
      const inputsCount = c.props.inputsCount || (c.props.gateType === 'NOT' ? 1 : 2);
      const pinLetters = ['A', 'B', 'C', 'D'].slice(0, inputsCount);
      for (const p of pinLetters) {
        registerPin(c.id, p);
      }
      registerPin(c.id, 'Y');
    } else if (c.type === 'logic_flip_flop') {
      const kind = (c.props.kind || 'D').toUpperCase();
      if (kind === 'JK') {
        registerPin(c.id, 'J');
        registerPin(c.id, 'K');
      } else if (kind === 'T') {
        registerPin(c.id, 'T');
      } else {
        registerPin(c.id, 'D');
      }
      registerPin(c.id, 'CLK');
      registerPin(c.id, 'Q');
      registerPin(c.id, 'NQ');
      if (c.props.hasClr) {
        registerPin(c.id, 'CLR');
      }
    }
  }

  // Initialize flip-flop qState if not set
  for (const c of circuit.components) {
    if (c.type === 'logic_flip_flop') {
      if (c.props.qState === undefined) {
        c.props.qState = c.props.initialState ?? 0;
      }
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

  // Helper to get driver states of fixed components and flip-flops
  const getFixedAndMemoryDrivers = (): Record<string, LogicValue> => {
    const drivers: Record<string, LogicValue> = {};
    for (const c of circuit.components) {
      if (c.type === 'logic_switch' || c.type === 'logic_push_button' || c.type === 'logic_clock') {
        drivers[`${c.id}:Q`] = c.props.state ? 1 : 0;
      } else if (c.type === 'logic_high') {
        drivers[`${c.id}:Q`] = 1;
      } else if (c.type === 'logic_low') {
        drivers[`${c.id}:Q`] = 0;
      } else if (c.type === 'logic_flip_flop') {
        const qVal: LogicValue = (c.props.qState !== undefined) ? c.props.qState : (c.props.initialState ?? 0);
        drivers[`${c.id}:Q`] = qVal;
        drivers[`${c.id}:NQ`] = qVal === 1 ? 0 : qVal === 0 ? 1 : 'X';
      }
    }
    return drivers;
  };

  let netValues: Record<string, LogicValue> = {};
  let pinValues: Record<string, LogicValue> = {};
  let isOscillating = false;
  let warning: string | undefined;

  let seqIteration = 0;
  const MAX_SEQ_ITERATIONS = 100;

  // Sequential update loop (cascading flip-flops, ripple counters, asynchronous resets)
  while (seqIteration < MAX_SEQ_ITERATIONS) {
    seqIteration++;

    // Step A: Combinatorial evaluation until gates and nets stabilize
    const fixedDrivers = getFixedAndMemoryDrivers();
    const gateDrivers: Record<string, LogicValue> = {};
    for (const c of circuit.components) {
      if (c.type === 'logic_gate') {
        gateDrivers[`${c.id}:Y`] = 0;
      }
    }

    let combIteration = 0;
    const MAX_COMB_ITERATIONS = 50;
    const stateHistory: string[] = [];

    while (combIteration < MAX_COMB_ITERATIONS) {
      combIteration++;
      const newNetValues: Record<string, LogicValue> = {};

      for (const netId of Object.keys(netPins)) {
        const pinsOnNet = netPins[netId];
        const driversOnNet: LogicValue[] = [];

        for (const p of pinsOnNet) {
          if (p in fixedDrivers) {
            driversOnNet.push(fixedDrivers[p]);
          } else if (p in gateDrivers) {
            driversOnNet.push(gateDrivers[p]);
          }
        }

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

      const newPinValues: Record<string, LogicValue> = {};
      for (const [pKey, netId] of Object.entries(pinToNet)) {
        newPinValues[pKey] = newNetValues[netId] ?? 'X';
      }

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
        break;
      }

      const snapshotKey = Object.entries(netValues)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join(';');

      if (stateHistory.includes(snapshotKey) && combIteration > 3) {
        isOscillating = true;
        break;
      }
      stateHistory.push(snapshotKey);
    }

    if (combIteration >= MAX_COMB_ITERATIONS) {
      isOscillating = true;
    }

    if (isOscillating) {
      warning = 'Mạch dao động / vòng phản hồi không ổn định';
      for (const netId of Object.keys(netValues)) {
        netValues[netId] = 'X';
      }
      for (const pKey of Object.keys(pinValues)) {
        pinValues[pKey] = 'X';
      }
      break;
    }

    // Step B: Sequential edge detection and sampling for Flip-Flops
    const nextFFStates: Record<string, { q: LogicValue; triggered: boolean; clkVal: LogicValue }> = {};

    for (const c of circuit.components) {
      if (c.type === 'logic_flip_flop') {
        const currentQ: LogicValue = (c.props.qState !== undefined) ? c.props.qState : (c.props.initialState ?? 0);
        const isFalling = c.props.triggerEdge === 'falling';
        const hasClr = Boolean(c.props.hasClr);

        const clrVal = hasClr ? (pinValues[`${c.id}:CLR`] ?? 'X') : 1;
        const clkVal = pinValues[`${c.id}:CLK`] ?? 'X';
        const prevClk = (c.props.lastClk !== undefined) ? c.props.lastClk : clkVal;

        let isEdge = false;
        if (isFalling) {
          if (prevClk === 1 && clkVal === 0) isEdge = true;
        } else {
          if (prevClk === 0 && clkVal === 1) isEdge = true;
        }

        let newQ = currentQ;
        let triggered = false;

        if (isEdge) {
          triggered = true;
          const kind = (c.props.kind || 'D').toUpperCase();
          if (kind === 'D') {
            const dVal = pinValues[`${c.id}:D`] ?? 'X';
            newQ = (dVal === 'X' || dVal === 'CONFLICT') ? 'X' : dVal;
          } else if (kind === 'T') {
            const tVal = pinValues[`${c.id}:T`] ?? 'X';
            if (tVal === 1) {
              newQ = currentQ === 1 ? 0 : currentQ === 0 ? 1 : 'X';
            } else if (tVal === 0) {
              newQ = currentQ;
            } else {
              newQ = 'X';
            }
          } else if (kind === 'JK') {
            const jVal = pinValues[`${c.id}:J`] ?? 'X';
            const kVal = pinValues[`${c.id}:K`] ?? 'X';
            if (jVal === 0 && kVal === 0) {
              newQ = currentQ;
            } else if (jVal === 0 && kVal === 1) {
              newQ = 0;
            } else if (jVal === 1 && kVal === 0) {
              newQ = 1;
            } else if (jVal === 1 && kVal === 1) {
              newQ = currentQ === 1 ? 0 : currentQ === 0 ? 1 : 'X';
            } else {
              newQ = 'X';
            }
          }
        }

        // Asynchronous active-low CLR override
        if (hasClr && clrVal === 0) {
          newQ = 0;
        }

        nextFFStates[c.id] = { q: newQ, triggered, clkVal };
      }
    }

    // Step C: Apply all new Q values simultaneously
    let anyQChanged = false;
    for (const c of circuit.components) {
      if (c.type === 'logic_flip_flop' && nextFFStates[c.id]) {
        const next = nextFFStates[c.id];
        const oldQ = (c.props.qState !== undefined) ? c.props.qState : (c.props.initialState ?? 0);
        if (next.q !== oldQ) {
          anyQChanged = true;
        }
        c.props.qState = next.q;
        c.props.lastClk = next.clkVal;
        if (next.triggered) {
          c.props.edgeCount = (c.props.edgeCount || 0) + 1;
        }
      }
    }

    // If no Q changed, we have stabilized!
    if (!anyQChanged) {
      break;
    }
  }

  if (seqIteration >= MAX_SEQ_ITERATIONS) {
    warning = 'Mạch dãy không ổn định';
  }

  // Map wire values from their connected pins
  const wireValues: Record<string, LogicValue> = {};
  for (const w of circuit.wires) {
    const pinA = `${w.from.compId}:${w.from.pinId}`;
    const netId = pinToNet[pinA];
    wireValues[w.id] = (netId ? netValues[netId] : 'X') ?? 'X';
  }

  // Component states
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
    } else if (c.type === 'logic_flip_flop') {
      const qVal: LogicValue = (c.props.qState !== undefined) ? c.props.qState : (c.props.initialState ?? 0);
      componentStates[c.id] = {
        q: qVal,
        nq: qVal === 1 ? 0 : qVal === 0 ? 1 : 'X',
        edgeCount: c.props.edgeCount || 0,
        kind: c.props.kind || 'D',
        triggerEdge: c.props.triggerEdge || 'rising',
        hasClr: Boolean(c.props.hasClr),
      };
    } else if (c.type === 'logic_clock') {
      componentStates[c.id] = {
        state: c.props.state ? 1 : 0,
        frequency: c.props.frequency || 1,
      };
    } else if (c.type === 'logic_7segment') {
      const d0 = pinValues[`${c.id}:D0`];
      const d1 = pinValues[`${c.id}:D1`];
      const d2 = pinValues[`${c.id}:D2`];
      const d3 = pinValues[`${c.id}:D3`];
      let digit = '?';
      if (
        d0 === 'X' || d1 === 'X' || d2 === 'X' || d3 === 'X' ||
        d0 === 'CONFLICT' || d1 === 'CONFLICT' || d2 === 'CONFLICT' || d3 === 'CONFLICT' ||
        d0 === undefined || d1 === undefined || d2 === undefined || d3 === undefined
      ) {
        digit = '?';
      } else {
        const val = (d0 === 1 ? 1 : 0) + (d1 === 1 ? 2 : 0) + (d2 === 1 ? 4 : 0) + (d3 === 1 ? 8 : 0);
        if (val >= 0 && val <= 9) {
          digit = String(val);
        } else {
          digit = '-';
        }
      }
      componentStates[c.id] = { digit, d0, d1, d2, d3 };
    }
  }

  return {
    netValues,
    pinValues,
    wireValues,
    componentStates,
    isOscillating,
    warning,
    iterationCount: seqIteration,
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
