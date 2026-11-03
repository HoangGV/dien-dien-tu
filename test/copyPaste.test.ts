import { describe, it, expect } from 'vitest';
import { ComponentInstance, Wire } from '../src/core/model';

describe('Copy / Paste Logic (internal wire preservation)', () => {
  it('keeps wires between copied components and discards external wires', () => {
    // 3 components: c1, c2, c3
    const components: ComponentInstance[] = [
      { id: 'c1', type: 'resistor', x: 20, y: 20, rot: 0, flip: false, label: 'R1', props: {} },
      { id: 'c2', type: 'resistor', x: 100, y: 20, rot: 0, flip: false, label: 'R2', props: {} },
      { id: 'c3', type: 'resistor', x: 200, y: 20, rot: 0, flip: false, label: 'R3', props: {} },
    ];

    // Wire w12 connects c1 to c2 (internal to {c1, c2})
    // Wire w23 connects c2 to c3 (external to {c1, c2})
    const wires: Wire[] = [
      {
        id: 'w12',
        from: { compId: 'c1', pinId: '2' },
        to: { compId: 'c2', pinId: '1' },
        points: [{ x: 40, y: 20 }, { x: 80, y: 20 }],
        color: '#000',
        crossSection: 1.5,
      },
      {
        id: 'w23',
        from: { compId: 'c2', pinId: '2' },
        to: { compId: 'c3', pinId: '1' },
        points: [{ x: 120, y: 20 }, { x: 180, y: 20 }],
        color: '#000',
        crossSection: 1.5,
      },
    ];

    // User selects only c1 and c2
    const selectedComponentIds = ['c1', 'c2'];
    const selSet = new Set(selectedComponentIds);

    const copiedComponents = components.filter(c => selSet.has(c.id));
    const copiedWires = wires.filter(w => {
      const fromIn = w.from.compId && selSet.has(w.from.compId);
      const toIn = w.to.compId && selSet.has(w.to.compId);
      return fromIn && toIn;
    });

    expect(copiedComponents.length).toBe(2);
    // Only w12 should be copied! w23 must be discarded
    expect(copiedWires.length).toBe(1);
    expect(copiedWires[0].id).toBe('w12');
  });
});
