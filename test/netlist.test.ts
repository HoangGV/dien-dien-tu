import { describe, it, expect } from 'vitest';
import { extractNetlist, lintCircuit } from '../src/core/netlist';
import { ComponentInstance, Wire, Junction, ComponentDef } from '../src/core/model';

describe('Netlist Extraction & Circuit Linter', () => {
  const dummyResistorDef: ComponentDef = {
    type: 'resistor',
    nameVi: 'Điện trở',
    category: 'passive',
    refPrefix: 'R',
    width: 80,
    height: 40,
    pins: [
      { id: '1', label: '', dx: -2, dy: 0 },
      { id: '2', label: '', dx: 2, dy: 0 },
    ],
    symbol: () => null as any,
    propsSchema: [],
  };

  const dummyDcDef: ComponentDef = {
    type: 'dc_source',
    nameVi: 'Nguồn DC',
    category: 'source',
    refPrefix: 'V',
    width: 60,
    height: 80,
    pins: [
      { id: 'pos', label: '+', dx: 0, dy: -2 },
      { id: 'neg', label: '−', dx: 0, dy: 2 },
    ],
    symbol: () => null as any,
    propsSchema: [],
  };

  const dummyGndDef: ComponentDef = {
    type: 'gnd',
    nameVi: 'Nối đất',
    category: 'connector',
    refPrefix: 'GND',
    width: 40,
    height: 40,
    pins: [{ id: 'gnd', label: '', dx: 0, dy: -1 }],
    symbol: () => null as any,
    propsSchema: [],
  };

  const defMap = new Map<string, ComponentDef>([
    ['resistor', dummyResistorDef],
    ['dc_source', dummyDcDef],
    ['gnd', dummyGndDef],
  ]);

  it('Circuit 1: Two series resistors connected by 1 wire', () => {
    const comps: ComponentInstance[] = [
      { id: 'R1', type: 'resistor', x: 0, y: 0, rot: 0, flip: false, label: 'R1', props: {} },
      { id: 'R2', type: 'resistor', x: 100, y: 0, rot: 0, flip: false, label: 'R2', props: {} },
    ];
    const wires: Wire[] = [
      {
        id: 'w1',
        from: { compId: 'R1', pinId: '2' },
        to: { compId: 'R2', pinId: '1' },
        points: [{ x: 40, y: 0 }, { x: 60, y: 0 }],
        color: '#000',
        crossSection: 1.5,
      },
    ];
    const junctions: Junction[] = [];

    const { pinToNetId, nets } = extractNetlist(comps, wires, junctions, defMap);

    // R1:2 and R2:1 must have identical Net ID
    const netR1_2 = pinToNetId.get('R1:2');
    const netR2_1 = pinToNetId.get('R2:1');
    expect(netR1_2).toBeDefined();
    expect(netR1_2).toBe(netR2_1);

    // Unconnected pins R1:1 and R2:2 must be in different nets
    const netR1_1 = pinToNetId.get('R1:1');
    const netR2_2 = pinToNetId.get('R2:2');
    expect(netR1_1).not.toBe(netR1_2);
    expect(netR2_2).not.toBe(netR1_2);
  });

  it('Circuit 2: Three-wire star connection with a central Junction', () => {
    const comps: ComponentInstance[] = [
      { id: 'R1', type: 'resistor', x: 0, y: 0, rot: 0, flip: false, label: 'R1', props: {} },
      { id: 'R2', type: 'resistor', x: 100, y: 0, rot: 0, flip: false, label: 'R2', props: {} },
      { id: 'R3', type: 'resistor', x: 50, y: 100, rot: 0, flip: false, label: 'R3', props: {} },
    ];
    const junctions: Junction[] = [{ id: 'j_center', x: 50, y: 50 }];
    const wires: Wire[] = [
      {
        id: 'w1',
        from: { compId: 'R1', pinId: '2' },
        to: { junctionId: 'j_center' },
        points: [{ x: 40, y: 0 }, { x: 50, y: 50 }],
        color: '#000',
        crossSection: 1.5,
      },
      {
        id: 'w2',
        from: { compId: 'R2', pinId: '1' },
        to: { junctionId: 'j_center' },
        points: [{ x: 60, y: 0 }, { x: 50, y: 50 }],
        color: '#000',
        crossSection: 1.5,
      },
      {
        id: 'w3',
        from: { compId: 'R3', pinId: '1' },
        to: { junctionId: 'j_center' },
        points: [{ x: 50, y: 100 }, { x: 50, y: 50 }],
        color: '#000',
        crossSection: 1.5,
      },
    ];

    const { pinToNetId } = extractNetlist(comps, wires, junctions, defMap);

    const net1 = pinToNetId.get('R1:2');
    const net2 = pinToNetId.get('R2:1');
    const net3 = pinToNetId.get('R3:1');

    expect(net1).toBe(net2);
    expect(net2).toBe(net3);
  });

  it('Circuit 3: Closed DC loop (V1 -> R1 -> GND)', () => {
    const comps: ComponentInstance[] = [
      { id: 'V1', type: 'dc_source', x: 0, y: 0, rot: 0, flip: false, label: 'V1', props: {} },
      { id: 'R1', type: 'resistor', x: 100, y: 0, rot: 0, flip: false, label: 'R1', props: {} },
      { id: 'G1', type: 'gnd', x: 50, y: 50, rot: 0, flip: false, label: 'GND', props: {} },
    ];
    const wires: Wire[] = [
      {
        id: 'w1',
        from: { compId: 'V1', pinId: 'pos' },
        to: { compId: 'R1', pinId: '1' },
        points: [{ x: 0, y: -40 }, { x: 60, y: 0 }],
        color: '#E5322D',
        crossSection: 1.5,
      },
      {
        id: 'w2',
        from: { compId: 'V1', pinId: 'neg' },
        to: { compId: 'G1', pinId: 'gnd' },
        points: [{ x: 0, y: 40 }, { x: 50, y: 30 }],
        color: '#000',
        crossSection: 1.5,
      },
    ];

    const warnings = lintCircuit(comps, wires, [], 'dc', defMap);
    // Pin R1:2 is unconnected -> linter must warn
    expect(warnings.some(w => w.id.includes('unconnected_pin_R1:2'))).toBe(true);
  });

  it('Linter detects component short-circuit when 2 pins are tied together', () => {
    const comps: ComponentInstance[] = [
      { id: 'R_short', type: 'resistor', x: 0, y: 0, rot: 0, flip: false, label: 'R_short', props: {} },
    ];
    // A wire looping pin 1 to pin 2 of the same resistor
    const wires: Wire[] = [
      {
        id: 'w_loop',
        from: { compId: 'R_short', pinId: '1' },
        to: { compId: 'R_short', pinId: '2' },
        points: [{ x: -40, y: 0 }, { x: 0, y: -20 }, { x: 40, y: 0 }],
        color: '#E5322D',
        crossSection: 1.5,
      },
    ];

    const warnings = lintCircuit(comps, wires, [], 'dc', defMap);
    const shortWarning = warnings.find(w => w.id.includes('short_circuit_R_short'));
    expect(shortWarning).toBeDefined();
    expect(shortWarning?.message).toContain('chập 2 đầu');
  });
});
