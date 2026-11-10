/**
 * Wire Ampacity & Protection Coordination Checker
 * Standard Vietnamese Educational Values for Electrical Installation (Mạng điện trong nhà)
 */

import { CircuitState, ComponentInstance, Wire } from './model';
import { solveCircuit } from './solver';

export interface AmpacityEntry {
  crossSection: number; // mm²
  maxCurrent: number;   // Amperes (A)
}

export const AMPACITY_TABLE: AmpacityEntry[] = [
  { crossSection: 1.0, maxCurrent: 10 },
  { crossSection: 1.5, maxCurrent: 16 },
  { crossSection: 2.5, maxCurrent: 24 },
  { crossSection: 4.0, maxCurrent: 32 },
  { crossSection: 6.0, maxCurrent: 42 },
];

export function getAllowableCurrent(crossSection: number): number {
  // Find exact or closest smaller, or extrapolate
  for (let i = AMPACITY_TABLE.length - 1; i >= 0; i--) {
    if (crossSection >= AMPACITY_TABLE[i].crossSection) {
      return AMPACITY_TABLE[i].maxCurrent;
    }
  }
  return 10;
}

export function getSuggestedCrossSection(currentA: number): number {
  for (const entry of AMPACITY_TABLE) {
    if (entry.maxCurrent >= currentA) {
      return entry.crossSection;
    }
  }
  return 6.0;
}

export interface WireAuditRow {
  wireId: string;
  name: string;
  wireType: string;
  crossSection: number;
  calculatedCurrent: number; // A
  allowableCurrent: number;  // A
  loadPct: number;          // %
  statusLevel: 'normal' | 'warning' | 'danger';
  conclusion: string;
  suggestion?: string;
}

export interface ProtectionAuditRow {
  compId: string;
  compName: string;
  type: string;
  inA: number;
  calculatedCurrent: number;
  downstreamMinCrossSection: number | null;
  downstreamAllowableCurrent: number | null;
  statusLevel: 'normal' | 'warning' | 'danger';
  conclusion: string;
}

export interface AuditReport {
  wireRows: WireAuditRow[];
  protectionRows: ProtectionAuditRow[];
}

/**
 * Solve circuit under hypothetical "all switches closed" condition
 * Does NOT trip or change state of circuit breakers / MCBs.
 */
export function solveWithAllSwitchesClosed(circuit: CircuitState) {
  const clonedComps: ComponentInstance[] = circuit.components.map((c) => {
    // Force switches to closed / ON
    if (
      c.type === 'switch_2p' ||
      c.type === 'switch_3p' ||
      c.type === 'push_button' ||
      c.type === 'knife_switch'
    ) {
      return {
        ...c,
        props: {
          ...c.props,
          state: true,
        },
      };
    }
    return c;
  });

  return solveCircuit(clonedComps, circuit.wires);
}

/**
 * Generate wire ampacity & breaker coordination report
 */
export function generateAuditReport(
  circuit: CircuitState,
  mode: 'current' | 'all_switches_closed',
  activeSnapshotCurrents?: Record<string, number>
): AuditReport {
  // 1. Calculate currents
  let componentCurrents: Record<string, number> = {};
  let wireCurrents: Record<string, number> = {};

  if (mode === 'all_switches_closed') {
    const sol = solveWithAllSwitchesClosed(circuit);
    componentCurrents = sol.componentCurrents || {};
    wireCurrents = sol.wireCurrents || {};
  } else if (activeSnapshotCurrents && Object.keys(activeSnapshotCurrents).length > 0) {
    componentCurrents = activeSnapshotCurrents;
    const sol = solveCircuit(circuit.components, circuit.wires);
    wireCurrents = sol.wireCurrents || {};
  } else {
    const sol = solveCircuit(circuit.components, circuit.wires);
    componentCurrents = sol.componentCurrents || {};
    wireCurrents = sol.wireCurrents || {};
  }

  // 2. Audit Wires
  const wireRows: WireAuditRow[] = circuit.wires.map((w, idx) => {
    const currentA = Math.abs(wireCurrents[w.id] ?? 0);
    const allowA = getAllowableCurrent(w.crossSection);
    const loadPct = (currentA / allowA) * 100;

    let statusLevel: 'normal' | 'warning' | 'danger' = 'normal';
    let conclusion = 'Bình thường';
    let suggestion: string | undefined;

    if (loadPct > 100) {
      statusLevel = 'danger';
      conclusion = 'Dây quá dòng';
      const sug = getSuggestedCrossSection(currentA);
      suggestion = `Nên dùng tiết diện ≥ ${sug.toFixed(1).replace('.', ',')} mm²`;
    } else if (loadPct >= 80) {
      statusLevel = 'warning';
      conclusion = 'Tải cao (80–100%)';
    }

    const typeLabel =
      w.wireType === 'phase'
        ? 'Dây pha (A)'
        : w.wireType === 'neutral'
        ? 'Dây trung tính (O)'
        : w.wireType === 'ground'
        ? 'Dây nối đất (PE)'
        : 'Dây dẫn';

    return {
      wireId: w.id,
      name: `Dây ${idx + 1} (${typeLabel})`,
      wireType: typeLabel,
      crossSection: w.crossSection,
      calculatedCurrent: currentA,
      allowableCurrent: allowA,
      loadPct,
      statusLevel,
      conclusion,
      suggestion,
    };
  });

  // 3. Audit Protection (CBs, fuses)
  const protectionComps = circuit.components.filter(
    (c) => c.type === 'cb' || c.type === 'fuse'
  );

  const protectionRows: ProtectionAuditRow[] = protectionComps.map((comp) => {
    const inA = Number(comp.props.ratedCurrent || 16);
    const calculatedCurrent = Math.abs(componentCurrents[comp.id] ?? 0);

    // Find wires connected directly downstream (e.g. pin 'out', 'out1', '2')
    const downstreamWires: Wire[] = circuit.wires.filter(
      (w) =>
        (w.from.compId === comp.id && (w.from.pinId === 'out' || w.from.pinId === 'out1' || w.from.pinId === '2')) ||
        (w.to.compId === comp.id && (w.to.pinId === 'out' || w.to.pinId === 'out1' || w.to.pinId === '2'))
    );

    let downstreamMinCrossSection: number | null = null;
    let downstreamAllowableCurrent: number | null = null;

    if (downstreamWires.length > 0) {
      downstreamMinCrossSection = Math.min(
        ...downstreamWires.map((w) => w.crossSection)
      );
      downstreamAllowableCurrent = getAllowableCurrent(downstreamMinCrossSection);
    }

    let statusLevel: 'normal' | 'warning' | 'danger' = 'normal';
    let conclusion = 'Phù hợp';

    if (calculatedCurrent > inA) {
      statusLevel = 'danger';
      conclusion = 'Dòng tải vượt In — sẽ nhảy';
    } else if (
      downstreamAllowableCurrent !== null &&
      inA > downstreamAllowableCurrent
    ) {
      statusLevel = 'warning';
      conclusion = `In lớn hơn dòng cho phép của dây ${downstreamMinCrossSection?.toFixed(1).replace('.', ',')} mm² — dây có thể quá nhiệt trước khi aptomat nhảy`;
    }

    return {
      compId: comp.id,
      compName: comp.label || comp.id,
      type: comp.type === 'cb' ? 'Aptomat (MCB)' : 'Cầu chì',
      inA,
      calculatedCurrent,
      downstreamMinCrossSection,
      downstreamAllowableCurrent,
      statusLevel,
      conclusion,
    };
  });

  return {
    wireRows,
    protectionRows,
  };
}

/**
 * Returns color stroke based on load percentage for "Tô màu dây theo tải"
 * < 60%: Green (#10B981)
 * 60% - 100%: Yellow/Orange (#F59E0B)
 * > 100%: Red (#EF4444)
 */
export function getWireLoadColor(
  wire: Wire,
  currentA: number
): string {
  const allowA = getAllowableCurrent(wire.crossSection);
  const pct = (currentA / allowA) * 100;
  if (pct > 100) return '#EF4444';
  if (pct >= 60) return '#F59E0B';
  return '#10B981';
}
