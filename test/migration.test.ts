import { describe, it, expect } from 'vitest';
import { migrateCircuitState } from '../src/core/migration';
import { CircuitState } from '../src/core/model';

describe('Auto-Migration for TCVN & Component Unification', () => {
  it('migrates legacy separate color LEDs to unified led with color prop', () => {
    const legacyState: CircuitState = {
      version: 1,
      components: [
        {
          id: 'c_red',
          type: 'led_red',
          x: 100,
          y: 100,
          rot: 0,
          flip: false,
          label: 'D1',
          props: {},
        },
        {
          id: 'c_green',
          type: 'led_green',
          x: 200,
          y: 100,
          rot: 90,
          flip: false,
          label: 'D2',
          props: {},
        },
      ],
      wires: [],
      junctions: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    const migrated = migrateCircuitState(legacyState, 'mach-dien-tu-co-ban');

    expect(migrated.components[0].type).toBe('led');
    expect(migrated.components[0].props.color).toBe('red');

    expect(migrated.components[1].type).toBe('led');
    expect(migrated.components[1].props.color).toBe('green');
  });

  it('migrates household L/N source pins to A/O', () => {
    const legacyState: CircuitState = {
      version: 1,
      components: [
        {
          id: 'src1',
          type: 'ac_source',
          x: 80,
          y: 80,
          rot: 0,
          flip: false,
          label: 'U',
          props: { voltage: 220 },
        },
        {
          id: 'lamp1',
          type: 'lamp',
          x: 200,
          y: 80,
          rot: 0,
          flip: false,
          label: 'Đ1',
          props: {},
        },
      ],
      wires: [
        {
          id: 'w1',
          from: { compId: 'src1', pinId: 'L' },
          to: { compId: 'lamp1', pinId: '1' },
          points: [
            { x: 80, y: 80 },
            { x: 200, y: 80 },
          ],
          color: '#E5322D',
          crossSection: 1.5,
        },
        {
          id: 'w2',
          from: { compId: 'src1', pinId: 'N' },
          to: { compId: 'lamp1', pinId: '2' },
          points: [
            { x: 80, y: 120 },
            { x: 200, y: 120 },
          ],
          color: '#4169E1',
          crossSection: 1.5,
        },
      ],
      junctions: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    const migrated = migrateCircuitState(legacyState, 'mang-dien-trong-nha');

    expect(migrated.wires[0].from).toEqual({ compId: 'src1', pinId: 'A' });
    expect(migrated.wires[0].wireType).toBe('phase');

    expect(migrated.wires[1].from).toEqual({ compId: 'src1', pinId: 'O' });
    expect(migrated.wires[1].wireType).toBe('neutral');
  });

  it('migrates legacy cb_single to unified cb with poles = 1', () => {
    const legacyState: CircuitState = {
      version: 1,
      components: [
        {
          id: 'cb1',
          type: 'cb_single',
          x: 100,
          y: 100,
          rot: 0,
          flip: false,
          label: 'MCB',
          props: { ratedCurrent: 16 },
        },
      ],
      wires: [],
      junctions: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    const migrated = migrateCircuitState(legacyState, 'mang-dien-trong-nha');
    expect(migrated.components[0].type).toBe('cb');
    expect(migrated.components[0].props.poles).toBe(1);
    expect(migrated.components[0].props.ratedCurrent).toBe(16);
  });
});
