import { describe, it, expect } from 'vitest';
import { createWorkspaceExportPackage, validateCircuitJson } from '../src/core/io';
import { CircuitState } from '../src/core/model';

describe('Export -> Import Round-trip Integrity', () => {
  it('serializes and deserializes circuit state with exact equivalence', () => {
    const originalState: CircuitState = {
      components: [
        {
          id: 'comp_1',
          type: 'resistor',
          x: 40,
          y: 60,
          rot: 90,
          flip: false,
          label: 'R1',
          props: { resistance: 2200, powerRating: 0.5 },
          damaged: false,
        },
        {
          id: 'comp_2',
          type: 'led_red',
          x: 120,
          y: 60,
          rot: 0,
          flip: true,
          label: 'LED1',
          props: { color: 'red', maxCurrent: 30 },
          damaged: true,
          damageReason: 'Quá dòng 45 mA',
        },
      ],
      wires: [
        {
          id: 'wire_1',
          from: { compId: 'comp_1', pinId: '2' },
          to: { compId: 'comp_2', pinId: 'A' },
          points: [
            { x: 40, y: 100 },
            { x: 80, y: 100 },
            { x: 80, y: 60 },
          ],
          color: '#E5322D',
          crossSection: 1.5,
          isBurnt: false,
        },
      ],
      junctions: [],
      viewport: { x: 50, y: 20, zoom: 1.2 },
    };

    // 1. Export package
    const pkg = createWorkspaceExportPackage(
      'mach-dien-tu-co-ban',
      'Mạch điện tử cơ bản',
      originalState
    );
    const jsonString = JSON.stringify(pkg);

    // 2. Import & Validate
    const res = validateCircuitJson(jsonString, 'mach-dien-tu-co-ban');
    expect(res.valid).toBe(true);

    const importedData = res.data as any;
    expect(importedData.slug).toBe('mach-dien-tu-co-ban');
    expect(importedData.state.components).toEqual(originalState.components);
    expect(importedData.state.wires).toEqual(originalState.wires);
    expect(importedData.state.junctions).toEqual(originalState.junctions);
  });

  it('preserves continuous float rotation, flipY, and wireType during export and import', () => {
    const floatState: CircuitState = {
      components: [
        {
          id: 'comp_rot',
          type: 'resistor',
          x: 100,
          y: 100,
          rot: 137.5,
          flip: true,
          flipY: true,
          label: 'R1',
          props: { resistance: 1000 },
        },
      ],
      wires: [
        {
          id: 'w_phase',
          from: { compId: 'comp_rot', pinId: '1' },
          to: { compId: 'comp_rot', pinId: '2' },
          points: [
            { x: 100, y: 100 },
            { x: 150, y: 100 },
          ],
          color: '#E5322D',
          crossSection: 2.5,
          wireType: 'phase',
        },
      ],
      junctions: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    const pkg = createWorkspaceExportPackage(
      'mang-dien-trong-nha',
      'Mạng điện trong nhà',
      floatState
    );
    const jsonString = JSON.stringify(pkg);

    const res = validateCircuitJson(jsonString, 'mang-dien-trong-nha');
    expect(res.valid).toBe(true);

    const importedData = res.data as any;
    expect(importedData.state.components[0].rot).toBe(137.5);
    expect(importedData.state.components[0].flipY).toBe(true);
    expect(importedData.state.wires[0].wireType).toBe('phase');
  });
});

