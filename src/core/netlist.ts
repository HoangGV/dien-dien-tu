/**
 * Netlist Extraction (Union-Find) and Circuit Linting / Rule Checker
 * Pure TypeScript, independent of React/DOM.
 */

import {
  ComponentInstance,
  Wire,
  Junction,
  Net,
  LintWarning,
  WorkspaceMode,
  ComponentDef,
  PinDef,
} from './model';

class DisjointSet {
  private parent = new Map<string, string>();
  private rank = new Map<string, number>();

  find(item: string): string {
    if (!this.parent.has(item)) {
      this.parent.set(item, item);
      this.rank.set(item, 0);
      return item;
    }
    const p = this.parent.get(item)!;
    if (p !== item) {
      const root = this.find(p);
      this.parent.set(item, root);
      return root;
    }
    return p;
  }

  union(a: string, b: string): string {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return rootA;

    const rankA = this.rank.get(rootA) || 0;
    const rankB = this.rank.get(rootB) || 0;

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
      return rootB;
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
      return rootA;
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
      return rootA;
    }
  }

  getAllItems(): string[] {
    return Array.from(this.parent.keys());
  }
}

export function getComponentPins(comp: ComponentInstance, def?: ComponentDef): PinDef[] {
  if (!def) return [];
  return typeof def.pins === 'function' ? def.pins(comp.props) : def.pins;
}

export interface NetlistResult {
  nets: Net[];
  pinToNetId: Map<string, string>;
  junctionToNetId: Map<string, string>;
  wireToNetId: Map<string, string>;
}

export function extractNetlist(
  components: ComponentInstance[],
  wires: Wire[],
  junctions: Junction[],
  compDefMap: Map<string, ComponentDef>
): NetlistResult {
  const dsu = new DisjointSet();

  for (const c of components) {
    const def = compDefMap.get(c.type);
    const pins = getComponentPins(c, def);
    for (const pin of pins) {
      dsu.find(`${c.id}:${pin.id}`);
    }
    // Add alias unions so both '1'/'2' and 'A'/'O' (or 'pos'/'neg' etc) resolve to the same pin net
    if (c.type === 'appliance_generic') {
      dsu.union(`${c.id}:A`, `${c.id}:1`);
      dsu.union(`${c.id}:O`, `${c.id}:2`);
    } else if (c.type === 'ceiling_fan' || c.type === 'lamp' || c.type === 'lamp_fluorescent' || c.type === 'electric_bell') {
      dsu.union(`${c.id}:1`, `${c.id}:A`);
      dsu.union(`${c.id}:2`, `${c.id}:O`);
    } else if (c.type === 'cb' || c.type === 'knife_switch') {
      dsu.union(`${c.id}:in`, `${c.id}:in1`);
      dsu.union(`${c.id}:out`, `${c.id}:out1`);
    } else if (c.type === 'fuse') {
      dsu.union(`${c.id}:1`, `${c.id}:in`);
      dsu.union(`${c.id}:2`, `${c.id}:out`);
      dsu.union(`${c.id}:1`, `${c.id}:in1`);
      dsu.union(`${c.id}:2`, `${c.id}:out1`);
    } else if (c.type === 'ohmmeter') {
      dsu.union(`${c.id}:1`, `${c.id}:pos`);
      dsu.union(`${c.id}:2`, `${c.id}:neg`);
    } else if (c.type === 'ammeter' || c.type === 'voltmeter') {
      dsu.union(`${c.id}:pos`, `${c.id}:1`);
      dsu.union(`${c.id}:neg`, `${c.id}:2`);
    } else if (c.type === 'socket') {
      dsu.union(`${c.id}:A`, `${c.id}:in_A`);
      dsu.union(`${c.id}:A`, `${c.id}:out_A`);
      dsu.union(`${c.id}:O`, `${c.id}:in_O`);
      dsu.union(`${c.id}:O`, `${c.id}:out_O`);
      dsu.union(`${c.id}:PE`, `${c.id}:in_PE`);
      dsu.union(`${c.id}:PE`, `${c.id}:out_PE`);
    }
  }

  for (const j of junctions) {
    dsu.find(`j:${j.id}`);
  }

  for (const w of wires) {
    const fromKey = w.from.compId
      ? `${w.from.compId}:${w.from.pinId}`
      : `j:${w.from.junctionId}`;
    const toKey = w.to.compId
      ? `${w.to.compId}:${w.to.pinId}`
      : `j:${w.to.junctionId}`;

    dsu.union(fromKey, toKey);
  }

  const netGroups = new Map<string, { pinKeys: string[]; junctionIds: string[]; wireIds: string[] }>();

  for (const item of dsu.getAllItems()) {
    const root = dsu.find(item);
    if (!netGroups.has(root)) {
      netGroups.set(root, { pinKeys: [], junctionIds: [], wireIds: [] });
    }
    const group = netGroups.get(root)!;

    if (item.startsWith('j:')) {
      group.junctionIds.push(item.slice(2));
    } else {
      group.pinKeys.push(item);
    }
  }

  const wireToNetId = new Map<string, string>();
  for (const w of wires) {
    const fromKey = w.from.compId
      ? `${w.from.compId}:${w.from.pinId}`
      : `j:${w.from.junctionId}`;
    const root = dsu.find(fromKey);
    wireToNetId.set(w.id, root);
    const grp = netGroups.get(root);
    if (grp && !grp.wireIds.includes(w.id)) {
      grp.wireIds.push(w.id);
    }
  }

  const pinToNetId = new Map<string, string>();
  const junctionToNetId = new Map<string, string>();
  const nets: Net[] = [];

  let netIndex = 1;
  for (const [, grp] of netGroups.entries()) {
    const friendlyNetId = `NET_${netIndex++}`;
    nets.push({
      id: friendlyNetId,
      pinKeys: grp.pinKeys,
      junctionIds: grp.junctionIds,
      wireIds: grp.wireIds,
    });

    for (const pk of grp.pinKeys) {
      pinToNetId.set(pk, friendlyNetId);
    }
    for (const jId of grp.junctionIds) {
      junctionToNetId.set(jId, friendlyNetId);
    }
    for (const wId of grp.wireIds) {
      wireToNetId.set(wId, friendlyNetId);
    }
  }

  return { nets, pinToNetId, junctionToNetId, wireToNetId };
}

export function lintCircuit(
  components: ComponentInstance[],
  wires: Wire[],
  junctions: Junction[],
  mode: WorkspaceMode,
  compDefMap: Map<string, ComponentDef>
): LintWarning[] {
  const warnings: LintWarning[] = [];

  if (components.length === 0) {
    warnings.push({
      id: 'empty_circuit',
      type: 'warning',
      message: 'Bảng vẽ chưa có linh kiện nào.',
    });
    return warnings;
  }

  // 1. Check for Power Source
  const sourceTypes = ['ac_source', 'dc_source', 'battery'];
  const hasSource = components.some(c => sourceTypes.includes(c.type));
  if (!hasSource) {
    warnings.push({
      id: 'missing_source',
      type: 'error',
      message: mode === 'rms' ? 'Mạch chưa có nguồn điện xoay chiều (220 V A-O).' : 'Mạch chưa có nguồn cấp điện DC (Pin/Nguồn DC).',
    });
  }

  // 2. Check for Ground / Reference node
  if (mode === 'dc') {
    const hasGnd = components.some(c => c.type === 'gnd');
    if (!hasGnd) {
      warnings.push({
        id: 'missing_gnd',
        type: 'warning',
        message: 'Mạch DC nên có nút nối đất tham chiếu (GND 0 V).',
      });
    }
  } else {
    // Mode RMS: Check if AC source exists and has O (neutral) pin connected
    const ac = components.find(c => c.type === 'ac_source');
    if (ac) {
      const oConnected = wires.some(
        w => (w.from.compId === ac.id && (w.from.pinId === 'O' || w.from.pinId === 'N')) ||
             (w.to.compId === ac.id && (w.to.pinId === 'O' || w.to.pinId === 'N'))
      );
      if (!oConnected) {
        warnings.push({
          id: 'missing_neutral',
          type: 'error',
          message: 'Chân dây Trung tính (O) của nguồn điện chưa được nối dây.',
          targetCompId: ac.id,
          targetPinId: 'O',
        });
      }
    }
  }

  // 3. Check for unconnected components & pins
  const connectedCompIds = new Set<string>();
  const connectedPins = new Set<string>();

  for (const w of wires) {
    if (w.from.compId) {
      connectedCompIds.add(w.from.compId);
      connectedPins.add(`${w.from.compId}:${w.from.pinId}`);
    }
    if (w.to.compId) {
      connectedCompIds.add(w.to.compId);
      connectedPins.add(`${w.to.compId}:${w.to.pinId}`);
    }
  }

  for (const c of components) {
    if (!connectedCompIds.has(c.id)) {
      warnings.push({
        id: `isolated_${c.id}`,
        type: 'warning',
        message: `Linh kiện ${c.label || c.type} đang nằm lơ lửng, chưa được nối vào mạch.`,
        targetCompId: c.id,
      });
    } else {
      const def = compDefMap.get(c.type);
      const pins = getComponentPins(c, def);
      for (const pin of pins) {
        if (pin.id === 'PE' && c.type !== 'ac_source') continue;

        const pinKey = `${c.id}:${pin.id}`;
        if (!connectedPins.has(pinKey)) {
          warnings.push({
            id: `unconnected_pin_${pinKey}`,
            type: 'warning',
            message: `Chân "${pin.label || pin.id}" của linh kiện ${c.label || c.type} chưa được nối dây.`,
            targetCompId: c.id,
            targetPinId: pin.id,
          });
        }
      }
    }
  }

  // 4. Check for Component Short-Circuit
  const { pinToNetId } = extractNetlist(components, wires, junctions, compDefMap);

  for (const c of components) {
    const def = compDefMap.get(c.type);
    const pins = getComponentPins(c, def);
    if (pins.length === 2) {
      const net0 = pinToNetId.get(`${c.id}:${pins[0].id}`);
      const net1 = pinToNetId.get(`${c.id}:${pins[1].id}`);

      if (net0 && net1 && net0 === net1) {
        warnings.push({
          id: `short_circuit_${c.id}`,
          type: 'error',
          message: `Linh kiện ${c.label || c.type} bị nối tắt (chập 2 đầu vào cùng một nút điện).`,
          targetCompId: c.id,
        });
      }
    }
  }

  return warnings;
}
