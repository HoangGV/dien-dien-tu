import { describe, it, expect } from 'vitest';
import { pinWorldPos } from '../src/core/geometry';
import { ComponentInstance, ComponentDef } from '../src/core/model';

describe('Geometry & Pin Transformations (pinWorldPos)', () => {
  const dummyDef: ComponentDef = {
    type: 'resistor',
    nameVi: 'Điện trở',
    category: 'passive',
    refPrefix: 'R',
    width: 80,
    height: 40,
    pins: [
      { id: '1', label: '1', dx: -2, dy: 0 },
      { id: '2', label: '2', dx: 2, dy: 0 },
    ],
    symbol: () => null as any,
    propsSchema: [],
  };

  const createComp = (rot: number, flip: boolean, flipY: boolean = false): ComponentInstance => ({
    id: 'r1',
    type: 'resistor',
    x: 100,
    y: 100,
    rot,
    flip,
    flipY,
    label: 'R1',
    props: {},
  });

  it('calculates pin positions at rot = 0 (unrotated, not flipped)', () => {
    const comp = createComp(0, false);
    const p1 = pinWorldPos(comp, '1', dummyDef);
    expect(p1).toEqual({ x: 60, y: 100 });

    const p2 = pinWorldPos(comp, '2', dummyDef);
    expect(p2).toEqual({ x: 140, y: 100 });
  });

  it('calculates pin positions at rot = 90 deg clockwise', () => {
    const comp = createComp(90, false);
    const p1 = pinWorldPos(comp, '1', dummyDef);
    expect(p1).toEqual({ x: 100, y: 60 });

    const p2 = pinWorldPos(comp, '2', dummyDef);
    expect(p2).toEqual({ x: 100, y: 140 });
  });

  it('calculates pin positions at rot = 180 deg', () => {
    const comp = createComp(180, false);
    const p1 = pinWorldPos(comp, '1', dummyDef);
    expect(p1).toEqual({ x: 140, y: 100 });

    const p2 = pinWorldPos(comp, '2', dummyDef);
    expect(p2).toEqual({ x: 60, y: 100 });
  });

  it('calculates pin positions at rot = 270 deg', () => {
    const comp = createComp(270, false);
    const p1 = pinWorldPos(comp, '1', dummyDef);
    expect(p1).toEqual({ x: 100, y: 140 });

    const p2 = pinWorldPos(comp, '2', dummyDef);
    expect(p2).toEqual({ x: 100, y: 60 });
  });

  it('calculates pin positions with horizontal flip and vertical flip', () => {
    const compX = createComp(0, true, false);
    const p1X = pinWorldPos(compX, '1', dummyDef);
    expect(p1X).toEqual({ x: 140, y: 100 });

    const compY = createComp(0, false, true);
    const p1Y = pinWorldPos(compY, '1', dummyDef);
    expect(p1Y).toEqual({ x: 60, y: 100 });
  });

  it('preserves distance to center under continuous arbitrary rotations (0°, 30°, 45°, 137°)', () => {
    const angles = [0, 30, 45, 90, 137.5, 215.3, 310];
    const initialDist = 40; // dx = 2 grid units = 40px

    for (const rot of angles) {
      const comp = createComp(rot, false);
      const p1 = pinWorldPos(comp, '1', dummyDef);
      const p2 = pinWorldPos(comp, '2', dummyDef);

      const d1 = Math.hypot(p1.x - comp.x, p1.y - comp.y);
      const d2 = Math.hypot(p2.x - comp.x, p2.y - comp.y);

      expect(Math.abs(d1 - initialDist)).toBeLessThan(0.1);
      expect(Math.abs(d2 - initialDist)).toBeLessThan(0.1);
    }
  });

  it('calculates exact coordinates for 45 degree rotation', () => {
    const comp = createComp(45, false);
    // Pin 1 original dx=-40, dy=0.
    // Rotated by 45 deg: x' = -40 * cos(45) = -28.284, y' = -40 * sin(45) = -28.284
    const p1 = pinWorldPos(comp, '1', dummyDef);
    expect(p1.x).toBeCloseTo(100 - 40 * Math.cos(Math.PI / 4), 1);
    expect(p1.y).toBeCloseTo(100 - 40 * Math.sin(Math.PI / 4), 1);
  });
});
