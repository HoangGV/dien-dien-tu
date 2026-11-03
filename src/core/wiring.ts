/**
 * Orthogonal Wire Routing with Off-Grid Pin Leads, Normalization, and Dragging
 * Pure TypeScript, independent of React/DOM.
 */

import { Point, Wire, Endpoint, Junction, ComponentInstance, ComponentDef } from './model';
import { snapToGrid, snapPointToGrid, isPointOnOrthogonalSegment, pinWorldPos } from './geometry';

/**
 * Checks if a point is cleanly on the 20px grid
 */
export function isPointOnGrid(pt: Point, gridSize = 20): boolean {
  return Math.abs(pt.x - Math.round(pt.x / gridSize) * gridSize) < 0.1 &&
         Math.abs(pt.y - Math.round(pt.y / gridSize) * gridSize) < 0.1;
}

/**
 * Normalizes polyline:
 * - Preserves short off-grid lead segments at the very start (pts[0] -> pts[1]) or very end (pts[n-2] -> pts[n-1])
 * - For all intermediate points, removes consecutive identical points and merges collinear horizontal/vertical segments.
 */
export function normalizePolyline(pts: Point[]): Point[] {
  if (!pts || pts.length < 2) return pts ? [...pts] : [];

  // 1. Remove consecutive identical points (within epsilon 0.1)
  const cleaned: Point[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (cleaned.length === 0) {
      cleaned.push({ x: p.x, y: p.y });
    } else {
      const prev = cleaned[cleaned.length - 1];
      if (Math.abs(prev.x - p.x) > 0.1 || Math.abs(prev.y - p.y) > 0.1) {
        cleaned.push({ x: p.x, y: p.y });
      }
    }
  }

  if (cleaned.length < 3) return cleaned;

  // Check if first or last points are off-grid
  const startIsOffGrid = !isPointOnGrid(cleaned[0]);
  const endIsOffGrid = !isPointOnGrid(cleaned[cleaned.length - 1]);

  const merged: Point[] = [cleaned[0]];

  for (let i = 1; i < cleaned.length - 1; i++) {
    // If this is the junction point connecting the off-grid start lead to the on-grid wire, preserve it!
    if (i === 1 && startIsOffGrid) {
      merged.push(cleaned[i]);
      continue;
    }
    // If this is the junction point connecting the on-grid wire to the off-grid end lead, preserve it!
    if (i === cleaned.length - 2 && endIsOffGrid) {
      merged.push(cleaned[i]);
      continue;
    }

    const prev = merged[merged.length - 1];
    const curr = cleaned[i];
    const next = cleaned[i + 1];

    const isHorizontalCollinear = Math.abs(prev.y - curr.y) < 0.1 && Math.abs(curr.y - next.y) < 0.1;
    const isVerticalCollinear = Math.abs(prev.x - curr.x) < 0.1 && Math.abs(curr.x - next.x) < 0.1;

    if (isHorizontalCollinear || isVerticalCollinear) {
      // Collinear: drop intermediate point
      continue;
    } else {
      merged.push(curr);
    }
  }

  merged.push(cleaned[cleaned.length - 1]);
  return merged;
}

/**
 * Computes an orthogonal route between start and end.
 * If start or end are off-grid (e.g. from arbitrary component rotation),
 * inserts short diagonal pin-leads from the pin to its nearest grid point,
 * while ensuring all inner segments remain strictly axis-aligned!
 */
export function routeOrthogonal(start: Point, end: Point, horizontalFirst = true): Point[] {
  const startOffGrid = !isPointOnGrid(start);
  const endOffGrid = !isPointOnGrid(end);

  const gridStart = startOffGrid ? snapPointToGrid(start) : { x: start.x, y: start.y };
  const gridEnd = endOffGrid ? snapPointToGrid(end) : { x: end.x, y: end.y };

  const innerSegments: Point[] = [];

  if (gridStart.x === gridEnd.x || gridStart.y === gridEnd.y) {
    innerSegments.push(gridStart, gridEnd);
  } else if (horizontalFirst) {
    innerSegments.push(
      gridStart,
      { x: gridEnd.x, y: gridStart.y },
      gridEnd
    );
  } else {
    innerSegments.push(
      gridStart,
      { x: gridStart.x, y: gridEnd.y },
      gridEnd
    );
  }

  const fullPath: Point[] = [];
  if (startOffGrid) fullPath.push(start);
  fullPath.push(...innerSegments);
  if (endOffGrid) fullPath.push(end);

  return normalizePolyline(fullPath);
}

/**
 * Verifies if all inner segments (excluding off-grid pin leads) are axis-aligned
 */
export function isPolylineOrthogonal(pts: Point[]): boolean {
  if (pts.length < 2) return true;
  const startOffGrid = !isPointOnGrid(pts[0]);
  const endOffGrid = !isPointOnGrid(pts[pts.length - 1]);

  const startIndex = startOffGrid ? 1 : 0;
  const endIndex = endOffGrid ? pts.length - 2 : pts.length - 1;

  for (let i = startIndex; i < endIndex; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    if (Math.abs(p1.x - p2.x) > 0.1 && Math.abs(p1.y - p2.y) > 0.1) {
      return false;
    }
  }
  return true;
}

/**
 * Splits a wire at a junction point, producing 2 valid wires.
 */
export function splitWireAtJunction(
  wire: Wire,
  junctionPt: Point,
  newJunctionId: string,
  newWireId: string
): { wire1: Wire; wire2: Wire; junction: Junction } | null {
  const snapJ = snapPointToGrid(junctionPt);
  const pts = wire.points;
  let splitIndex = -1;

  for (let i = 0; i < pts.length - 1; i++) {
    if (isPointOnOrthogonalSegment(snapJ, pts[i], pts[i + 1], 8)) {
      splitIndex = i;
      break;
    }
  }

  if (splitIndex === -1) {
    return null;
  }

  const pts1 = [...pts.slice(0, splitIndex + 1), snapJ];
  const pts2 = [snapJ, ...pts.slice(splitIndex + 1)];

  const norm1 = normalizePolyline(pts1);
  const norm2 = normalizePolyline(pts2);

  const wire1: Wire = {
    ...wire,
    to: { junctionId: newJunctionId },
    points: norm1,
  };

  const wire2: Wire = {
    id: newWireId,
    from: { junctionId: newJunctionId },
    to: wire.to,
    points: norm2,
    wireType: wire.wireType,
    color: wire.color,
    crossSection: wire.crossSection,
  };

  const junction: Junction = {
    id: newJunctionId,
    x: snapJ.x,
    y: snapJ.y,
  };

  return { wire1, wire2, junction };
}

/**
 * Updates attached wire endpoints when a component moves or rotates
 */
export function updateWireOnComponentMoved(
  wire: Wire,
  compId: string,
  newPinPos: Point,
  isFromEnd: boolean
): Wire {
  const pts = [...wire.points];
  if (pts.length < 2) return wire;

  if (isFromEnd) {
    pts[0] = { x: newPinPos.x, y: newPinPos.y };
    const p1 = pts[1];

    if (!isPointOnGrid(newPinPos)) {
      // Pin rotated off-grid: pin -> grid point -> remaining
      const gridP = snapPointToGrid(newPinPos);
      pts.splice(1, 0, gridP);
    } else {
      const wasHoriz = Math.abs(pts[0].y - p1.y) < 0.1;
      const wasVert = Math.abs(pts[0].x - p1.x) < 0.1;

      if (wasHoriz) {
        if (pts[0].y !== p1.y) {
          pts.splice(1, 0, { x: p1.x, y: pts[0].y });
        }
      } else if (wasVert) {
        if (pts[0].x !== p1.x) {
          pts.splice(1, 0, { x: pts[0].x, y: p1.y });
        }
      } else {
        const lPts = routeOrthogonal(pts[0], p1, true);
        pts.splice(0, 2, ...lPts);
      }
    }
  } else {
    const lastIdx = pts.length - 1;
    pts[lastIdx] = { x: newPinPos.x, y: newPinPos.y };
    const prev = pts[lastIdx - 1];

    if (!isPointOnGrid(newPinPos)) {
      const gridP = snapPointToGrid(newPinPos);
      pts.splice(lastIdx, 0, gridP);
    } else {
      const wasHoriz = Math.abs(pts[lastIdx].y - prev.y) < 0.1;
      const wasVert = Math.abs(pts[lastIdx].x - prev.x) < 0.1;

      if (wasHoriz) {
        if (pts[lastIdx].y !== prev.y) {
          pts.splice(lastIdx, 0, { x: prev.x, y: pts[lastIdx].y });
        }
      } else if (wasVert) {
        if (pts[lastIdx].x !== prev.x) {
          pts.splice(lastIdx, 0, { x: pts[lastIdx].x, y: prev.y });
        }
      } else {
        const lPts = routeOrthogonal(prev, pts[lastIdx], true);
        pts.splice(lastIdx - 1, 2, ...lPts);
      }
    }
  }

  return {
    ...wire,
    points: normalizePolyline(pts),
  };
}

/**
 * Drags a segment of a wire perpendicular to its orientation
 */
export function dragWireSegment(
  wire: Wire,
  segIdx: number,
  newCoord: number,
  allowDiagonal = false
): Wire {
  const pts = [...wire.points];
  if (segIdx < 0 || segIdx >= pts.length - 1) return wire;

  const snapped = snapToGrid(newCoord);
  const pA = pts[segIdx];
  const pB = pts[segIdx + 1];

  const isHorizontal = Math.abs(pA.y - pB.y) < 0.1;

  if (isHorizontal) {
    if (segIdx === 0) {
      pts.splice(1, 0, { x: pA.x, y: snapped }, { x: pB.x, y: snapped });
    } else if (segIdx === pts.length - 2) {
      pts.splice(segIdx + 1, 0, { x: pA.x, y: snapped }, { x: pB.x, y: snapped });
    } else {
      pA.y = snapped;
      pB.y = snapped;
    }
  } else {
    if (segIdx === 0) {
      pts.splice(1, 0, { x: snapped, y: pA.y }, { x: snapped, y: pB.y });
    } else if (segIdx === pts.length - 2) {
      pts.splice(segIdx + 1, 0, { x: snapped, y: pA.y }, { x: snapped, y: pB.y });
    } else {
      pA.x = snapped;
      pB.x = snapped;
    }
  }

  return {
    ...wire,
    points: normalizePolyline(pts),
  };
}
