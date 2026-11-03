/**
 * Geometry Calculations & Coordinate Transformations
 * Pure TypeScript, independent of React/DOM.
 */

import { ComponentInstance, ComponentDef, Point, BoundingBox, PinDef } from './model';

export const GRID_SIZE = 20;

export function snapToGrid(val: number, gridSize = GRID_SIZE): number {
  return Math.round(val / gridSize) * gridSize;
}

export function snapPointToGrid(pt: Point, gridSize = GRID_SIZE): Point {
  return {
    x: snapToGrid(pt.x, gridSize),
    y: snapToGrid(pt.y, gridSize),
  };
}

/**
 * Calculates absolute world coordinates of a component's pin
 * taking into account component (x, y), arbitrary continuous rotation (0 <= rot < 360),
 * and horizontal/vertical flip applied BEFORE rotation.
 */
export function pinWorldPos(
  comp: ComponentInstance,
  pinId: string,
  compDef?: ComponentDef
): Point {
  let dx = 0;
  let dy = 0;

  if (compDef) {
    const pins = typeof compDef.pins === 'function' ? compDef.pins(comp.props) : compDef.pins;
    const pin = pins.find(p => p.id === pinId);
    if (pin) {
      dx = pin.dx * GRID_SIZE;
      dy = pin.dy * GRID_SIZE;
    }
  }

  // 1. Apply flip (horizontal and vertical) BEFORE rotation
  const localX = comp.flip ? -dx : dx;
  const localY = comp.flipY ? -dy : dy;

  // 2. Apply continuous rotation around local origin (0, 0)
  const rad = ((comp.rot || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotX = localX * cos - localY * sin;
  const rotY = localX * sin + localY * cos;

  return {
    x: Math.round((comp.x + rotX) * 10) / 10,
    y: Math.round((comp.y + rotY) * 10) / 10,
  };
}

/**
 * Computes bounding box for a component in world coordinates after arbitrary rotation and flip
 */
export function getComponentBoundingBox(
  comp: ComponentInstance,
  compDef?: ComponentDef
): BoundingBox {
  const w = compDef ? compDef.width : 60;
  const h = compDef ? compDef.height : 40;
  const halfW = w / 2;
  const halfH = h / 2;

  const corners: Point[] = [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH },
  ];

  const rad = ((comp.rot || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const c of corners) {
    const fx = comp.flip ? -c.x : c.x;
    const fy = comp.flipY ? -c.y : c.y;

    const rx = fx * cos - fy * sin;
    const ry = fx * sin + fy * cos;

    const wx = comp.x + rx;
    const wy = comp.y + ry;

    if (wx < minX) minX = wx;
    if (wy < minY) minY = wy;
    if (wx > maxX) maxX = wx;
    if (wy > maxY) maxY = wy;
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Checks if a point lies inside a bounding box with optional tolerance
 */
export function isPointInBox(pt: Point, box: BoundingBox, tol = 0): boolean {
  return (
    pt.x >= box.minX - tol &&
    pt.x <= box.maxX + tol &&
    pt.y >= box.minY - tol &&
    pt.y <= box.maxY + tol
  );
}

/**
 * Checks if two bounding boxes intersect
 */
export function boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  );
}

/**
 * Checks if point C lies on segment AB within tolerance
 */
export function isPointOnOrthogonalSegment(
  p: Point,
  a: Point,
  b: Point,
  tol = 5
): boolean {
  const minX = Math.min(a.x, b.x) - tol;
  const maxX = Math.max(a.x, b.x) + tol;
  const minY = Math.min(a.y, b.y) - tol;
  const maxY = Math.max(a.y, b.y) + tol;

  if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
    return false;
  }

  // Cross-product distance to line segment
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y) <= tol;

  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;

  return Math.hypot(p.x - projX, p.y - projY) <= tol;
}
