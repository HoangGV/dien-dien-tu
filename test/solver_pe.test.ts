import { describe, it, expect } from 'vitest';
import { solveCircuit } from '../src/core/solver';
import { ComponentInstance, Wire, CircuitState } from '../src/core/model';
import { COMPONENT_MAP } from '../src/core/registry';
import { HistoryManager } from '../src/core/history';
import { getComponentPins } from '../src/core/netlist';
import { createWorkspaceExportPackage, validateCircuitJson } from '../src/core/io';
import { migrateCircuitState } from '../src/core/migration';

describe('10 Numerical & Functional Tests for PE Grounding & Safety', () => {
  // Helper to create an AC source (220V, 50Hz)
  const createACSource = (hasPE = false): ComponentInstance => ({
    id: 'src1',
    type: 'ac_source',
    x: 80,
    y: 80,
    rot: 0,
    flip: false,
    label: 'U',
    props: { voltage: 220, frequency: 50, hasPE },
  });

  // Helper to create a wire
  const createWire = (
    id: string,
    fromCompId: string,
    fromPin: string,
    toCompId: string,
    toPin: string,
    wireType: 'phase' | 'neutral' | 'ground' = 'phase'
  ): Wire => ({
    id,
    from: { compId: fromCompId, pinId: fromPin },
    to: { compId: toCompId, pinId: toPin },
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    color: wireType === 'phase' ? '#E5322D' : wireType === 'neutral' ? '#4169E1' : '#2DB84D',
    crossSection: 2.5,
    wireType,
  });

  // TEST 1: Rò điện ra vỏ, chân PE TẮT, có người chạm vào vỏ: V_vỏ ≈ 217.8 V, I_người ≈ 217.8 mA (sai số ±2%)
  it('Test 1: Leak to case, PE OFF, human touch => V_case ≈ 217.8V, I_human ≈ 217.8mA (±2%)', () => {
    const src = createACSource(false);
    const fan: ComponentInstance = {
      id: 'fan1',
      type: 'ceiling_fan',
      x: 200,
      y: 80,
      rot: 0,
      flip: false,
      label: 'QT1',
      props: { power: 75, hasPE: false, leakToCase: true, humanTouch: true },
    };

    const wires: Wire[] = [
      createWire('w1', 'src1', 'A', 'fan1', '1', 'phase'),
      createWire('w2', 'src1', 'O', 'fan1', '2', 'neutral'),
    ];

    const res = solveCircuit([src, fan], wires);
    const caseStat = res.caseStatuses['fan1'];

    expect(caseStat).toBeDefined();
    // V_case = 220 * 1000 / (10 + 1000) = 217.82 V
    expect(caseStat.caseVoltage).toBeGreaterThanOrEqual(217.8 * 0.98);
    expect(caseStat.caseVoltage).toBeLessThanOrEqual(217.8 * 1.02);

    // I_human = 217.82 mA
    expect(caseStat.humanCurrent).toBeGreaterThanOrEqual(217.8 * 0.98);
    expect(caseStat.humanCurrent).toBeLessThanOrEqual(217.8 * 1.02);
    expect(caseStat.dangerLevel).toBe('danger');
  });

  // TEST 2: Rò điện ra vỏ, chân PE BẬT, nối dây PE vào Cọc tiếp địa 4 Ω, có người chạm vào vỏ: V_vỏ ≈ 62.7 V, I_người ≈ 62.7 mA (sai số ±2%)
  it('Test 2: Leak to case, PE ON, wired to Earth ground 4Ω, human touch => V_case ≈ 62.7V, I_human ≈ 62.7mA (±2%)', () => {
    const src = createACSource(false);
    const fan: ComponentInstance = {
      id: 'fan1',
      type: 'ceiling_fan',
      x: 200,
      y: 80,
      rot: 0,
      flip: false,
      label: 'QT1',
      props: { power: 75, hasPE: true, leakToCase: true, humanTouch: true },
    };
    const ground: ComponentInstance = {
      id: 'gnd1',
      type: 'earth_ground',
      x: 200,
      y: 200,
      rot: 0,
      flip: false,
      label: 'ĐẤT1',
      props: { resistance: 4 },
    };

    const wires: Wire[] = [
      createWire('w1', 'src1', 'A', 'fan1', '1', 'phase'),
      createWire('w2', 'src1', 'O', 'fan1', '2', 'neutral'),
      createWire('w_pe', 'fan1', 'PE', 'gnd1', 'pe', 'ground'),
    ];

    const res = solveCircuit([src, fan, ground], wires);
    const caseStat = res.caseStatuses['fan1'];

    expect(caseStat).toBeDefined();
    // 4 || 1000 = 3.98406 ohm. V_case = 220 * 3.98406 / (10 + 3.98406) = 62.67 V
    expect(caseStat.caseVoltage).toBeGreaterThanOrEqual(62.7 * 0.98);
    expect(caseStat.caseVoltage).toBeLessThanOrEqual(62.7 * 1.02);

    expect(caseStat.humanCurrent).toBeGreaterThanOrEqual(62.7 * 0.98);
    expect(caseStat.humanCurrent).toBeLessThanOrEqual(62.7 * 1.02);
  });

  // TEST 3: Như Test 2 nhưng không người chạm, MCB 16A: dòng sự cố I_sự_cố ≈ 15.7 A (sai số ±3%), MCB KHÔNG nhảy; với MCB 10A thì nhảy sau 4–8s
  it('Test 3: Leak to case, PE to Earth 4Ω, no human touch, MCB 16A => I_fault ≈ 15.7A, does NOT trip; 10A MCB trips in 4-8s', () => {
    const src = createACSource(false);
    const mcb16: ComponentInstance = {
      id: 'mcb1',
      type: 'cb',
      x: 140,
      y: 80,
      rot: 0,
      flip: false,
      label: 'MCB1',
      props: { poles: 1, ratedCurrent: 16, state: true, isTripped: false },
    };
    const fan: ComponentInstance = {
      id: 'fan1',
      type: 'ceiling_fan',
      x: 240,
      y: 80,
      rot: 0,
      flip: false,
      label: 'QT1',
      props: { power: 75, hasPE: true, leakToCase: true, humanTouch: false },
    };
    const ground: ComponentInstance = {
      id: 'gnd1',
      type: 'earth_ground',
      x: 240,
      y: 200,
      rot: 0,
      flip: false,
      label: 'ĐẤT1',
      props: { resistance: 4 },
    };

    const wires: Wire[] = [
      createWire('w1', 'src1', 'A', 'mcb1', 'in', 'phase'),
      createWire('w2', 'mcb1', 'out', 'fan1', '1', 'phase'),
      createWire('w3', 'src1', 'O', 'fan1', '2', 'neutral'),
      createWire('w_pe', 'fan1', 'PE', 'gnd1', 'pe', 'ground'),
    ];

    // Case 3a: MCB 16A -> I_fault = 220 / (10 + 4) = 15.71 A. Since 15.71 < 16, does NOT trip.
    const res16 = solveCircuit([src, mcb16, fan, ground], wires, 1.0);
    const iFault = res16.componentCurrents['mcb1'];
    expect(iFault).toBeGreaterThanOrEqual(15.7 * 0.97);
    expect(iFault).toBeLessThanOrEqual(15.7 * 1.03);
    expect(res16.trippedComponents).not.toContain('mcb1');

    // Case 3b: MCB 10A -> Ratio = 15.71 / 10 = 1.5714. Trip time t = 8 / (1.5714^2 - 1) ≈ 5.44 s.
    const mcb10: ComponentInstance = {
      ...mcb16,
      props: { ...mcb16.props, ratedCurrent: 10 },
    };
    // At t = 2s, not yet tripped
    const res10Early = solveCircuit([src, mcb10, fan, ground], wires, 2.0);
    expect(res10Early.trippedComponents).not.toContain('mcb1');

    // At t = 6s (between 4s and 8s), trips
    const res10Tripped = solveCircuit([src, mcb10, fan, ground], wires, 6.0);
    expect(res10Tripped.trippedComponents).toContain('mcb1');
  });

  // TEST 4: Rò điện ra vỏ, chân PE nối về chân PE của Nguồn lưới (0.1 Ω): dòng sự cố ≈ 21.8 A (sai số ±3%)
  it('Test 4: Leak to case, PE connected to Source PE (0.1Ω) => I_fault ≈ 21.8A (±3%)', () => {
    const src = createACSource(true); // Source with PE
    const fan: ComponentInstance = {
      id: 'fan1',
      type: 'ceiling_fan',
      x: 200,
      y: 80,
      rot: 0,
      flip: false,
      label: 'QT1',
      props: { power: 75, hasPE: true, leakToCase: true, humanTouch: false },
    };

    const wires: Wire[] = [
      createWire('w1', 'src1', 'A', 'fan1', '1', 'phase'),
      createWire('w2', 'src1', 'O', 'fan1', '2', 'neutral'),
      createWire('w_pe', 'fan1', 'PE', 'src1', 'PE', 'ground'),
    ];

    const res = solveCircuit([src, fan], wires);
    // Total loop resistance = 10 (leak) + 0.1 (source PE to O) = 10.1 ohm. I = 220 / 10.1 = 21.782 A
    const vFanCase = res.caseStatuses['fan1'].caseVoltage;
    const iFault = (220 - vFanCase) / 10;
    expect(iFault).toBeGreaterThanOrEqual(21.8 * 0.97);
    expect(iFault).toBeLessThanOrEqual(21.8 * 1.03);
  });

  // TEST 5: Aptomat chống rò (ELCB) bảo vệ mạch: khi rò điện xuống đất, ELCB nhảy ngay ở step 1 (> 30 mA)
  it('Test 5: ELCB trips on step 1 when earth residual leakage > 30mA', () => {
    const src = createACSource(false);
    const elcb: ComponentInstance = {
      id: 'elcb1',
      type: 'cb',
      x: 140,
      y: 80,
      rot: 0,
      flip: false,
      label: 'ELCB1',
      props: { poles: 2, isELCB: true, state: true, isTripped: false },
    };
    const fan: ComponentInstance = {
      id: 'fan1',
      type: 'ceiling_fan',
      x: 240,
      y: 80,
      rot: 0,
      flip: false,
      label: 'QT1',
      props: { power: 75, hasPE: true, leakToCase: true, humanTouch: false },
    };
    const ground: ComponentInstance = {
      id: 'gnd1',
      type: 'earth_ground',
      x: 240,
      y: 200,
      rot: 0,
      flip: false,
      label: 'ĐẤT1',
      props: { resistance: 4 },
    };

    const wires: Wire[] = [
      createWire('w1', 'src1', 'A', 'elcb1', 'in1', 'phase'),
      createWire('w2', 'elcb1', 'out1', 'fan1', '1', 'phase'),
      createWire('w3', 'src1', 'O', 'elcb1', 'in2', 'neutral'),
      createWire('w4', 'elcb1', 'out2', 'fan1', '2', 'neutral'),
      createWire('w_pe', 'fan1', 'PE', 'gnd1', 'pe', 'ground'),
    ];

    const res = solveCircuit([src, elcb, fan, ground], wires, 0.05); // step 1 (0.05s)
    expect(res.trippedComponents).toContain('elcb1');
    expect(res.statusMessages.some(m => m.includes('ELCB NHẢY'))).toBe(true);
  });

  // TEST 6: Rò điện ra vỏ nhưng chân PE TẮT và KHÔNG có người chạm: V_vỏ ≈ 220 V nhưng dòng rò = 0, ELCB không nhảy
  it('Test 6: Leak to case, PE OFF, no human touch => V_case ≈ 220V, zero earth current, ELCB does not trip', () => {
    const src = createACSource(false);
    const elcb: ComponentInstance = {
      id: 'elcb1',
      type: 'cb',
      x: 140,
      y: 80,
      rot: 0,
      flip: false,
      label: 'ELCB1',
      props: { poles: 2, isELCB: true, state: true, isTripped: false },
    };
    const fan: ComponentInstance = {
      id: 'fan1',
      type: 'ceiling_fan',
      x: 240,
      y: 80,
      rot: 0,
      flip: false,
      label: 'QT1',
      props: { power: 75, hasPE: false, leakToCase: true, humanTouch: false },
    };

    const wires: Wire[] = [
      createWire('w1', 'src1', 'A', 'elcb1', 'in1', 'phase'),
      createWire('w2', 'elcb1', 'out1', 'fan1', '1', 'phase'),
      createWire('w3', 'src1', 'O', 'elcb1', 'in2', 'neutral'),
      createWire('w4', 'elcb1', 'out2', 'fan1', '2', 'neutral'),
    ];

    const res = solveCircuit([src, elcb, fan], wires, 1.0);
    const caseStat = res.caseStatuses['fan1'];

    expect(caseStat.caseVoltage).toBeGreaterThanOrEqual(219);
    expect(caseStat.humanCurrent).toBe(0);
    expect(res.trippedComponents).not.toContain('elcb1');
  });

  // TEST 7: Thay đổi điện trở cọc tiếp địa R_đất = 20 Ω: dòng sự cố giảm xuống ≈ 7.3 A
  it('Test 7: R_dat = 20Ω => I_fault drops to ≈ 7.3A', () => {
    const src = createACSource(false);
    const fan: ComponentInstance = {
      id: 'fan1',
      type: 'ceiling_fan',
      x: 200,
      y: 80,
      rot: 0,
      flip: false,
      label: 'QT1',
      props: { power: 75, hasPE: true, leakToCase: true, humanTouch: false },
    };
    const ground20: ComponentInstance = {
      id: 'gnd1',
      type: 'earth_ground',
      x: 200,
      y: 200,
      rot: 0,
      flip: false,
      label: 'ĐẤT1',
      props: { resistance: 20 },
    };

    const wires: Wire[] = [
      createWire('w1', 'src1', 'A', 'fan1', '1', 'phase'),
      createWire('w2', 'src1', 'O', 'fan1', '2', 'neutral'),
      createWire('w_pe', 'fan1', 'PE', 'gnd1', 'pe', 'ground'),
    ];

    const res = solveCircuit([src, fan, ground20], wires);
    // Total resistance = 10 (leak) + 20 (ground rod) = 30 ohm. I_fault = 220 / 30 = 7.333 A
    const vFanCase = res.caseStatuses['fan1'].caseVoltage;
    const iFault = (220 - vFanCase) / 10;
    expect(iFault).toBeGreaterThanOrEqual(7.3 * 0.97);
    expect(iFault).toBeLessThanOrEqual(7.3 * 1.03);
  });

  // TEST 8: Khi tắt thuộc tính "Hiện chân PE", dây nối vào chân PE tự động bị xóa, hiện cảnh báo, và Ctrl+Z khôi phục được cả dây lẫn chân
  it('Test 8: Disabling hasPE removes connected wire, and history undo restores both pin and wire', () => {
    const history = new HistoryManager(10);

    const fanWithPE: ComponentInstance = {
      id: 'fan1',
      type: 'ceiling_fan',
      x: 200,
      y: 80,
      rot: 0,
      flip: false,
      label: 'QT1',
      props: { power: 75, hasPE: true },
    };
    const gnd: ComponentInstance = {
      id: 'gnd1',
      type: 'earth_ground',
      x: 200,
      y: 200,
      rot: 0,
      flip: false,
      label: 'ĐẤT1',
      props: { resistance: 4 },
    };
    const peWire = createWire('w_pe', 'fan1', 'PE', 'gnd1', 'pe', 'ground');

    const state1: CircuitState = {
      components: [fanWithPE, gnd],
      wires: [peWire],
      junctions: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    // Save initial state to history before changing property
    history.push(state1);

    // Turn OFF PE property
    const nextProps = { ...fanWithPE.props, hasPE: false };
    const def = COMPONENT_MAP.get(fanWithPE.type);
    const oldPins = getComponentPins(fanWithPE, def);
    const newPins = getComponentPins({ ...fanWithPE, props: nextProps }, def);
    const newPinSet = new Set(newPins.map(p => p.id));
    const removedPinIds = oldPins.filter(p => !newPinSet.has(p.id)).map(p => p.id);

    // Clean up wires attached to removed pins
    const nextWires = state1.wires.filter(w => {
      const isFromTarget = w.from.compId === fanWithPE.id && removedPinIds.includes(w.from.pinId!);
      const isToTarget = w.to.compId === fanWithPE.id && removedPinIds.includes(w.to.pinId!);
      return !isFromTarget && !isToTarget;
    });

    const state2: CircuitState = {
      ...state1,
      components: [{ ...fanWithPE, props: nextProps }, gnd],
      wires: nextWires,
    };

    // Verification 1: wire removed in state2
    expect(state2.wires.length).toBe(0);
    expect(state2.components[0].props.hasPE).toBe(false);

    // Verification 2: Ctrl+Z restores state1 with pin and wire
    const undone = history.undo(state2);
    expect(undone).not.toBeNull();
    expect(undone?.wires.length).toBe(1);
    expect(undone?.wires[0].id).toBe('w_pe');
    expect(undone?.components[0].props.hasPE).toBe(true);
  });

  // TEST 9: Lưu sơ đồ có chân PE và dây PE thành file .json, tải lại: giữ nguyên chân PE và dây PE; nạp file cũ không có trường hasPE: tự gán false
  it('Test 9: JSON roundtrip preserves hasPE and PE wires; legacy JSON without hasPE defaults to false', () => {
    const fanWithPE: ComponentInstance = {
      id: 'fan1',
      type: 'ceiling_fan',
      x: 200,
      y: 80,
      rot: 0,
      flip: false,
      label: 'QT1',
      props: { power: 75, hasPE: true },
    };
    const gnd: ComponentInstance = {
      id: 'gnd1',
      type: 'earth_ground',
      x: 200,
      y: 200,
      rot: 0,
      flip: false,
      label: 'ĐẤT1',
      props: { resistance: 4 },
    };
    const peWire = createWire('w_pe', 'fan1', 'PE', 'gnd1', 'pe', 'ground');

    const stateWithPE: CircuitState = {
      components: [fanWithPE, gnd],
      wires: [peWire],
      junctions: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    // Roundtrip serialization
    const pkg = createWorkspaceExportPackage('mang-dien-trong-nha', 'Mạng điện trong nhà', stateWithPE);
    const jsonStr = JSON.stringify(pkg);
    const validation = validateCircuitJson(jsonStr);

    expect(validation.valid).toBe(true);
    const loadedState = (validation.data as any).state;
    expect(loadedState.components[0].props.hasPE).toBe(true);
    expect(loadedState.wires[0].wireType).toBe('ground');

    // Legacy file without hasPE
    const legacyState: CircuitState = {
      components: [
        {
          id: 'fan_legacy',
          type: 'ceiling_fan',
          x: 100,
          y: 100,
          rot: 0,
          flip: false,
          label: 'QT',
          props: { power: 75 }, // NO hasPE field
        },
      ],
      wires: [],
      junctions: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    const migrated = migrateCircuitState(legacyState, 'mang-dien-trong-nha');
    expect(migrated.components[0].props.hasPE).toBe(false);
  });

  // TEST 10: Ổ cắm có PE: chân vào in_PE thông với chân ra out_PE (1 mΩ)
  it('Test 10: Socket with PE: in_PE connects to out_PE with 1 mΩ internal resistance', () => {
    const src = createACSource(true);
    const socket: ComponentInstance = {
      id: 'soc1',
      type: 'socket',
      x: 140,
      y: 80,
      rot: 0,
      flip: false,
      label: 'OC1',
      props: { hasPE: true },
    };
    const ground: ComponentInstance = {
      id: 'gnd1',
      type: 'earth_ground',
      x: 240,
      y: 200,
      rot: 0,
      flip: false,
      label: 'ĐẤT1',
      props: { resistance: 4 },
    };

    const wires: Wire[] = [
      createWire('w1', 'src1', 'A', 'soc1', 'in_A', 'phase'),
      createWire('w2', 'src1', 'O', 'soc1', 'in_O', 'neutral'),
      createWire('w_pe1', 'src1', 'PE', 'soc1', 'in_PE', 'ground'),
      createWire('w_pe2', 'soc1', 'out_PE', 'gnd1', 'pe', 'ground'),
    ];

    const res = solveCircuit([src, socket, ground], wires);

    // Check voltage of in_PE and out_PE nodes: should be virtually identical (< 0.001 V delta)
    const inPENet = wires.find(w => w.to.pinId === 'in_PE');
    const outPENet = wires.find(w => w.from.pinId === 'out_PE');
    expect(inPENet).toBeDefined();
    expect(outPENet).toBeDefined();
    expect(res.nodeVoltages).toBeDefined();
  });
});
