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

    return {
      ...c,
      type: nextType,
      rot: nextRot,
      flip: !!c.flip,
      flipY: !!c.flipY,
      props: nextProps,
    };
  });

  // Migrate wire endpoints L -> A, N -> O in household workspace
  const migratedWires: Wire[] = (state.wires || []).map((w) => {
    let fromPin = w.from.pinId;
    let toPin = w.to.pinId;

    if (isHousehold) {
      if (fromPin === 'L') fromPin = 'A';
      else if (fromPin === 'N') fromPin = 'O';

      if (toPin === 'L') toPin = 'A';
      else if (toPin === 'N') toPin = 'O';
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

  return {
    ...state,
    components: migratedComponents,
    wires: migratedWires,
  };
}
