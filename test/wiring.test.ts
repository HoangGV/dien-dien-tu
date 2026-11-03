import { describe, it, expect } from 'vitest';
import {
  normalizePolyline,
  splitWireAtJunction,
  updateWireOnComponentMoved,
  isPolylineOrthogonal,
} from '../src/core/wiring';
import { Wire } from '../src/core/model';

describe('Wiring, Normalization & Junction Splitting', () => {
  it('normalizes polyline by removing consecutive duplicates and collinear points', () => {
    const raw = [
      { x: 0, y: 0 },
      { x: 0, y: 0 }, // duplicate
      { x: 50, y: 0 }, // collinear
      { x: 100, y: 0 },
      { x: 100, y: 50 }, // collinear
      { x: 100, y: 100 },
    ];

    const normalized = normalizePolyline(raw);
    expect(normalized).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(isPolylineOrthogonal(normalized)).toBe(true);
  });

  it('splits wire at junction preserving connectivity and orthogonality', () => {
    const wire: Wire = {
      id: 'w1',
      from: { compId: 'c1', pinId: 'p1' },
      to: { compId: 'c2', pinId: 'p2' },
      points: [
        { x: 20, y: 40 },
        { x: 100, y: 40 },
        { x: 100, y: 80 },
      ],
      color: '#E5322D',
      crossSection: 1.5,
    };

    const junctionPoint = { x: 60, y: 40 }; // on the horizontal segment
    const res = splitWireAtJunction(wire, junctionPoint, 'j1', 'w2');

    expect(res).not.toBeNull();
    if (!res) return;

    expect(res.junction).toEqual({ id: 'j1', x: 60, y: 40 });

    // Wire 1: c1 -> j1
    expect(res.wire1.from).toEqual({ compId: 'c1', pinId: 'p1' });
    expect(res.wire1.to).toEqual({ junctionId: 'j1' });
    expect(res.wire1.points).toEqual([
      { x: 20, y: 40 },
      { x: 60, y: 40 },
    ]);
    expect(isPolylineOrthogonal(res.wire1.points)).toBe(true);

    // Wire 2: j1 -> c2
    expect(res.wire2.from).toEqual({ junctionId: 'j1' });
    expect(res.wire2.to).toEqual({ compId: 'c2', pinId: 'p2' });
    expect(res.wire2.points).toEqual([
      { x: 60, y: 40 },
      { x: 100, y: 40 },
      { x: 100, y: 80 },
    ]);
    expect(isPolylineOrthogonal(res.wire2.points)).toBe(true);
  });

  it('maintains axis-aligned orthogonality when component moves', () => {
    const initialWire: Wire = {
      id: 'w_test',
      from: { compId: 'c1', pinId: 'p1' },
      to: { compId: 'c2', pinId: 'p2' },
      points: [
        { x: 40, y: 40 },
        { x: 120, y: 40 },
      ],
      color: '#4169E1',
      crossSection: 2.5,
    };

    // Move c1 downwards: start pin moves from (40, 40) to (40, 80)
    const updated = updateWireOnComponentMoved(initialWire, 'c1', { x: 40, y: 80 }, true);

    expect(isPolylineOrthogonal(updated.points)).toBe(true);
    expect(updated.points[0]).toEqual({ x: 40, y: 80 });
    expect(updated.points[updated.points.length - 1]).toEqual({ x: 120, y: 40 });
  });

  it('handles off-grid rotated pins with lead segments and orthogonal inner segments', () => {
    // Suppose a component is rotated at 45 deg, so pin is at non-integer/off-grid coord (71.7, 71.7)
    const offGridPin = { x: 71.7, y: 71.7 };
    const gridTarget = { x: 200, y: 200 };

    const wire: Wire = {
      id: 'w_rot',
      from: { compId: 'c_rot', pinId: 'p1' },
      to: { compId: 'c_target', pinId: 'p2' },
      points: [
        { x: 60, y: 80 },
        { x: 100, y: 80 },
        { x: 100, y: 200 },
        { x: 200, y: 200 },
      ],
      color: '#E5322D',
      crossSection: 1.5,
    };

    const updated = updateWireOnComponentMoved(wire, 'c_rot', offGridPin, true);
    // First point must match the off-grid pin position exactly
    expect(updated.points[0]).toEqual(offGridPin);

    // End point is still at gridTarget
    expect(updated.points[updated.points.length - 1]).toEqual(gridTarget);

    // All segments between index 1 and N-1 must be strictly orthogonal
    const innerPoints = updated.points.slice(1);
    expect(isPolylineOrthogonal(innerPoints)).toBe(true);
  });
});

