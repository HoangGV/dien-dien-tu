/**
 * State Migration Utility
 * Migrates legacy saved circuits to the unified component & TCVN nomenclature
 */

import { CircuitState, ComponentInstance, Wire } from './model';

export function migrateCircuitState(state: CircuitState, workspaceSlug?: string): CircuitState {
  if (!state || !Array.isArray(state.components)) return state;

  const colorMap: Record<string, string> = {
    led_red: 'red',
    led_yellow: 'yellow',
    led_green: 'green',
    led_blue: 'blue',
    led_white: 'white',
  };

  const isHousehold = workspaceSlug === 'mang-dien-trong-nha';

  const migratedComponents: ComponentInstance[] = state.components.map((c) => {
    let nextType = c.type;
    const nextProps = { ...c.props };
    let nextRot = typeof c.rot === 'number' ? (c.rot % 360 + 360) % 360 : 0;
    nextRot = Math.round(nextRot * 10) / 10;

    // 1. Migrate individual colored LEDs -> unified 'led'
    if (colorMap[c.type]) {
      nextType = 'led';
      nextProps.color = nextProps.color || colorMap[c.type];
    }

    // 2. Migrate lamps -> unified 'lamp'
    if (c.type === 'lamp_incandescent') {
      nextType = 'lamp';
      nextProps.lampType = 'incandescent';
    } else if (c.type === 'lamp_led') {
      nextType = 'lamp';
      nextProps.lampType = 'led';
    }

    // 3. Migrate CB -> unified 'cb'
    if (c.type === 'cb_single') {
      nextType = 'cb';
      nextProps.poles = nextProps.poles || 1;
    }

    // 4. Migrate ELCB -> unified 'elcb'
    if (c.type === 'elcb_double') {
      nextType = 'elcb';
      nextProps.poles = nextProps.poles || 2;
    }

    // 5. Ensure poles default on fuses
    if (c.type === 'fuse' && !nextProps.poles) {
      nextProps.poles = 1;
    }

    // 6. Ensure hasPE defaults to false for legacy files
    if (['ac_source', 'socket', 'lamp', 'lamp_fluorescent', 'ceiling_fan', 'appliance_generic'].includes(nextType)) {
      nextProps.hasPE = Boolean(nextProps.hasPE);
    }

    // 7. Ensure install property exists and defaults to schematic position/rotation
    const nextInstall = c.install && typeof c.install.x === 'number' && typeof c.install.y === 'number'
      ? {
          x: c.install.x,
          y: c.install.y,
          rot: typeof c.install.rot === 'number' ? Math.round(((c.install.rot % 360 + 360) % 360) * 10) / 10 : nextRot,
        }
      : {
          x: c.x,
          y: c.y,
          rot: nextRot,
        };

    return {
      ...c,
      type: nextType,
      rot: nextRot,
      flip: !!c.flip,
      flipY: !!c.flipY,
      props: nextProps,
      install: nextInstall,
    };
  });

  // Migrate wire endpoints
  const rawWires: Wire[] = (state.wires || []).map((w) => {
    let fromPin = w.from.pinId;
    let toPin = w.to.pinId;

    const fromComp = state.components.find(c => c.id === w.from.compId);
    const toComp = state.components.find(c => c.id === w.to.compId);

    // Socket migration: in_A/out_A/A' -> A, in_O/out_O/O' -> O, in_PE/out_PE/PE' -> PE
    if (fromComp?.type === 'socket') {
      if (fromPin === 'in_A' || fromPin === 'out_A' || fromPin === 'A\'') fromPin = 'A';
      else if (fromPin === 'in_O' || fromPin === 'out_O' || fromPin === 'O\'') fromPin = 'O';
      else if (fromPin === 'in_PE' || fromPin === 'out_PE' || fromPin === 'PE\'') fromPin = 'PE';
    }
    if (toComp?.type === 'socket') {
      if (toPin === 'in_A' || toPin === 'out_A' || toPin === 'A\'') toPin = 'A';
      else if (toPin === 'in_O' || toPin === 'out_O' || toPin === 'O\'') toPin = 'O';
      else if (toPin === 'in_PE' || toPin === 'out_PE' || toPin === 'PE\'') toPin = 'PE';
    }

    // Wattmeter migration: pos/1 -> I+, neg/2 -> I-
    if (fromComp?.type === 'wattmeter') {
      if (fromPin === 'pos' || fromPin === '1') fromPin = 'I+';
      else if (fromPin === 'neg' || fromPin === '2') fromPin = 'I-';
    }
    if (toComp?.type === 'wattmeter') {
      if (toPin === 'pos' || toPin === '1') toPin = 'I+';
      else if (toPin === 'neg' || toPin === '2') toPin = 'I-';
    }

    // Ohmmeter migration: pos -> 1, neg -> 2
    if (fromComp?.type === 'ohmmeter') {
      if (fromPin === 'pos') fromPin = '1';
      else if (fromPin === 'neg') fromPin = '2';
    }
    if (toComp?.type === 'ohmmeter') {
      if (toPin === 'pos') toPin = '1';
      else if (toPin === 'neg') toPin = '2';
    }

    if (isHousehold) {
      if (fromComp?.type === 'ceiling_fan') {
        if (fromPin === 'A') fromPin = '1';
        else if (fromPin === 'O') fromPin = '2';
      } else if (fromComp?.type !== 'socket') {
        if (fromPin === 'L') fromPin = 'A';
        else if (fromPin === 'N') fromPin = 'O';
      }

      if (toComp?.type === 'ceiling_fan') {
        if (toPin === 'A') toPin = '1';
        else if (toPin === 'O') toPin = '2';
      } else if (toComp?.type !== 'socket') {
        if (toPin === 'L') toPin = 'A';
        else if (toPin === 'N') toPin = 'O';
      }
    }

    let wireType = w.wireType;
    if (!wireType) {
      if (w.color === '#E5322D') wireType = 'phase';
      else if (w.color === '#4169E1') wireType = 'neutral';
      else if (w.color === '#2DB84D') wireType = 'ground';
      else wireType = 'other';
    }

    return {
      ...w,
      from: w.from.compId ? { compId: w.from.compId, pinId: fromPin! } : { junctionId: w.from.junctionId! },
      to: w.to.compId ? { compId: w.to.compId, pinId: toPin! } : { junctionId: w.to.junctionId! },
      wireType,
    };
  });

  // Deduplicate wires: eliminate duplicate connections between exact same terminals
  const seenConnections = new Set<string>();
  const migratedWires: Wire[] = [];

  for (const w of rawWires) {
    const endA = w.from.compId ? `${w.from.compId}:${w.from.pinId}` : `j:${w.from.junctionId}`;
    const endB = w.to.compId ? `${w.to.compId}:${w.to.pinId}` : `j:${w.to.junctionId}`;
    const key = endA < endB ? `${endA}<->${endB}` : `${endB}<->${endA}`;
    if (endA === endB) {
      // Self loop wire -> discard
      continue;
    }
    if (!seenConnections.has(key)) {
      seenConnections.add(key);
      migratedWires.push(w);
    }
  }

  const migratedJunctions = (state.junctions || []).map((j) => ({
    ...j,
    install: j.install && typeof j.install.x === 'number' && typeof j.install.y === 'number'
      ? { x: j.install.x, y: j.install.y }
      : { x: j.x, y: j.y },
  }));

  const migratedFloorPlan = state.floorPlan
    ? {
        name: state.floorPlan.name || 'MẶT BẰNG PHÒNG',
        widthM: typeof state.floorPlan.widthM === 'number' && state.floorPlan.widthM > 0 ? state.floorPlan.widthM : 5,
        lengthM: typeof state.floorPlan.lengthM === 'number' && state.floorPlan.lengthM > 0 ? state.floorPlan.lengthM : 4,
        x: typeof state.floorPlan.x === 'number' ? state.floorPlan.x : 80,
        y: typeof state.floorPlan.y === 'number' ? state.floorPlan.y : 80,
        doors: Array.isArray(state.floorPlan.doors) ? state.floorPlan.doors : [{ id: 'door1', wall: 'bottom' as const, offset: 1.0, width: 0.9 }],
        partitionWalls: Array.isArray(state.floorPlan.partitionWalls) ? state.floorPlan.partitionWalls : [],
      }
    : isHousehold
    ? {
        name: 'MẶT BẰNG PHÒNG',
        widthM: 5,
        lengthM: 4,
        x: 80,
        y: 80,
        doors: [{ id: 'door1', wall: 'bottom' as const, offset: 1.0, width: 0.9 }],
        partitionWalls: [],
      }
    : undefined;

  const migratedExplainerState = state.explainerState || (workspaceSlug === 'do-dung-dien-gia-dinh' ? {
    selectedApplianceId: 'noi-com-dien',
    selectedSubtypeId: 'soi-dot',
    activeTab: 'cautao' as const,
    viewMode: 'ngoai' as const,
    selectedPartId: null,
    stepIndex: 0,
    calcRows: [
      { id: '1', name: 'Đèn sợi đốt', powerWatts: 60, hoursPerDay: 4, daysPerMonth: 30 },
      { id: '2', name: 'Đèn LED', powerWatts: 9, hoursPerDay: 4, daysPerMonth: 30 },
      { id: '3', name: 'Nồi cơm điện', powerWatts: 700, hoursPerDay: 1, daysPerMonth: 30 },
      { id: '4', name: 'Quạt điện', powerWatts: 55, hoursPerDay: 6, daysPerMonth: 30 },
    ],
    unitPrice: null,
    compareRowAId: '1',
    compareRowBId: '2',
  } : undefined);

  return {
    ...state,
    components: migratedComponents,
    wires: migratedWires,
    junctions: migratedJunctions,
    floorPlan: migratedFloorPlan,
    explainerState: migratedExplainerState,
  };
}
