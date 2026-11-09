/**
 * Installation View Wiring & Floor Plan Routing Helper
 * Computes orthogonal L-shaped routing between component install positions and aggregates wire lengths.
 */

import { Point, Wire, Endpoint, CircuitState, ComponentInstance, WireType } from './model';
import { getComponentDef } from './registry';
import { pinWorldPos } from './geometry';
import { routeOrthogonal } from './wiring';

/**
 * Returns effective render position and rotation for a component based on view mode
 */
export function getComponentRenderPos(
  comp: ComponentInstance,
  isInstallView: boolean
): { x: number; y: number; rot: number } {
  if (isInstallView && comp.install) {
    return {
      x: comp.install.x,
      y: comp.install.y,
      rot: typeof comp.install.rot === 'number' ? comp.install.rot : (comp.rot || 0),
    };
  }
  return {
    x: comp.x,
    y: comp.y,
    rot: comp.rot || 0,
  };
}

/**
 * Returns absolute coordinates of an endpoint in installation view
 */
export function getEndpointInstallPos(ep: Endpoint, circuit: CircuitState): Point | null {
  if (ep.compId) {
    const comp = circuit.components.find((c) => c.id === ep.compId);
    if (!comp) return null;
    const effComp: ComponentInstance = {
      ...comp,
      x: comp.install?.x ?? comp.x,
      y: comp.install?.y ?? comp.y,
      rot: comp.install?.rot ?? comp.rot ?? 0,
    };
    const def = getComponentDef(comp.type);
    return pinWorldPos(effComp, ep.pinId, def);
  }

  if (ep.junctionId) {
    const j = circuit.junctions.find((junc) => junc.id === ep.junctionId);
    if (!j) return null;
    if (j.install && typeof j.install.x === 'number' && typeof j.install.y === 'number') {
      return { x: j.install.x, y: j.install.y };
    }

    // Default junction position: average of connected endpoint positions
    const connectedWires = circuit.wires.filter(
      (w) => w.from.junctionId === j.id || w.to.junctionId === j.id
    );
    const otherPoints: Point[] = [];
    for (const cw of connectedWires) {
      const otherEnd = cw.from.junctionId === j.id ? cw.to : cw.from;
      if (otherEnd.compId) {
        const oc = circuit.components.find((c) => c.id === otherEnd.compId);
        if (oc) {
          const oeff: ComponentInstance = {
            ...oc,
            x: oc.install?.x ?? oc.x,
            y: oc.install?.y ?? oc.y,
            rot: oc.install?.rot ?? oc.rot ?? 0,
          };
          const odef = getComponentDef(oc.type);
          otherPoints.push(pinWorldPos(oeff, otherEnd.pinId, odef));
        }
      }
    }

    if (otherPoints.length > 0) {
      const avgX = otherPoints.reduce((sum, p) => sum + p.x, 0) / otherPoints.length;
      const avgY = otherPoints.reduce((sum, p) => sum + p.y, 0) / otherPoints.length;
      return {
        x: Math.round(avgX / 10) * 10,
        y: Math.round(avgY / 10) * 10,
      };
    }

    return { x: j.x, y: j.y };
  }

  return null;
}

/**
 * Computes polyline points for a wire in installation view.
 * Routes orthogonally (L-shaped) between the two endpoints at their installation coordinates.
 */
export function getWireInstallPoints(wire: Wire, circuit: CircuitState): Point[] {
  const startPos = getEndpointInstallPos(wire.from, circuit);
  const endPos = getEndpointInstallPos(wire.to, circuit);

  if (!startPos || !endPos) {
    return wire.points || [];
  }

  return routeOrthogonal(startPos, endPos, true);
}

/**
 * Calculates polyline length in meters given a pixel-per-meter scale (default 100 px = 1 m)
 */
export function calculatePolylineLengthMeters(points: Point[], pxPerMeter = 100): number {
  if (!points || points.length < 2) return 0;
  let totalPx = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    totalPx += Math.sqrt(dx * dx + dy * dy);
  }
  return Math.round((totalPx / pxPerMeter) * 100) / 100;
}

export interface WireSummaryRow {
  crossSection: number;
  wireType: WireType;
  typeNameVi: string;
  color: string;
  totalLengthMeters: number;
  wireCount: number;
}

export interface WireSummaryResult {
  rows: WireSummaryRow[];
  grandTotalMeters: number;
  totalWires: number;
}

/**
 * Aggregates wire lengths by cross section and wire type for the installation view
 */
export function aggregateWireSummary(circuit: CircuitState, pxPerMeter = 100): WireSummaryResult {
  const typeNameMap: Record<WireType, string> = {
    phase: 'Dây pha (A)',
    neutral: 'Dây trung tính (O)',
    ground: 'Dây nối đất (PE)',
    other: 'Dây khác / Tùy chỉnh',
  };

  const map = new Map<string, WireSummaryRow>();
  let grandTotalMeters = 0;

  for (const w of circuit.wires) {
    const pts = getWireInstallPoints(w, circuit);
    const len = calculatePolylineLengthMeters(pts, pxPerMeter);
    grandTotalMeters += len;

    const wType: WireType = w.wireType || 'phase';
    const cs = w.crossSection || 2.5;
    const key = `${cs}_${wType}`;

    let row = map.get(key);
    if (!row) {
      row = {
        crossSection: cs,
        wireType: wType,
        typeNameVi: typeNameMap[wType] || 'Dây dẫn',
        color: w.color,
        totalLengthMeters: 0,
        wireCount: 0,
      };
      map.set(key, row);
    }

    row.totalLengthMeters = Math.round((row.totalLengthMeters + len) * 100) / 100;
    row.wireCount += 1;
  }

  // Sort by crossSection descending, then wireType
  const rows = Array.from(map.values()).sort((a, b) => {
    if (b.crossSection !== a.crossSection) return b.crossSection - a.crossSection;
    return a.wireType.localeCompare(b.wireType);
  });

  return {
    rows,
    grandTotalMeters: Math.round(grandTotalMeters * 100) / 100,
    totalWires: circuit.wires.length,
  };
}
