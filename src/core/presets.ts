/**
 * Presets and standard circuit generators for Household and Electronics workspaces.
 * Pure TypeScript, no circular dependencies.
 */

import { CircuitState, ComponentInstance, Wire, Preset } from './model';

export function makePresetWire(
  id: string,
  fromCompId: string,
  fromPin: string,
  toCompId: string,
  toPin: string,
  points: { x: number; y: number }[],
  wireType: 'phase' | 'neutral' | 'ground' | 'other' = 'phase'
): Wire {
  return {
    id,
    from: { compId: fromCompId, pinId: fromPin },
    to: { compId: toCompId, pinId: toPin },
    points,
    color: wireType === 'phase' ? '#E5322D' : wireType === 'neutral' ? '#4169E1' : wireType === 'ground' ? '#2DB84D' : '#000000',
    crossSection: 2.5,
    wireType,
  };
}

// ----------------------------------------------------
// Mạch nhà ở (Household presets)
// ----------------------------------------------------

export function createPresetHouseholdA(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const cb1: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 16, state: true } };
  const am: ComponentInstance = { id: 'a1', type: 'ammeter', x: 300, y: 140, rot: 0, flip: false, label: 'A1', props: {} };
  const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 420, y: 140, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
  const w2 = makePresetWire('w2', 'mcb1', 'out', 'a1', 'pos', [{ x: 240, y: 140 }, { x: 260, y: 140 }], 'phase');
  const w3 = makePresetWire('w3', 'a1', 'neg', 'fan1', '1', [{ x: 340, y: 140 }, { x: 380, y: 140 }], 'phase');
  const w4 = makePresetWire('w4', 'fan1', '2', 'src1', 'O', [{ x: 460, y: 140 }, { x: 460, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
  return { components: [u, cb1, am, fan], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export function createPresetHouseholdB(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const am: ComponentInstance = { id: 'a1', type: 'ammeter', x: 200, y: 140, rot: 0, flip: false, label: 'A1', props: {} };
  const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 340, y: 140, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } };
  const vm: ComponentInstance = { id: 'v1', type: 'voltmeter', x: 340, y: 240, rot: 0, flip: false, label: 'V1', props: {} };
  const w1 = makePresetWire('w1', 'src1', 'A', 'a1', 'pos', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
  const w2 = makePresetWire('w2', 'a1', 'neg', 'fan1', '1', [{ x: 240, y: 140 }, { x: 300, y: 140 }], 'phase');
  const w3 = makePresetWire('w3', 'fan1', '2', 'src1', 'O', [{ x: 380, y: 140 }, { x: 380, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
  const wv1 = makePresetWire('wv1', 'fan1', '1', 'v1', 'pos', [{ x: 300, y: 140 }, { x: 300, y: 240 }], 'phase');
  const wv2 = makePresetWire('wv2', 'fan1', '2', 'v1', 'neg', [{ x: 380, y: 140 }, { x: 380, y: 240 }], 'neutral');
  return { components: [u, am, fan, vm], wires: [w1, w2, w3, wv1, wv2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export function createPresetHouseholdC(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 240, y: 120, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: false, leakToCase: true, humanTouch: true } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'fan1', '1', [{ x: 120, y: 140 }, { x: 200, y: 120 }], 'phase');
  const w2 = makePresetWire('w2', 'src1', 'O', 'fan1', '2', [{ x: 120, y: 100 }, { x: 200, y: 60 }, { x: 280, y: 60 }, { x: 280, y: 120 }], 'neutral');
  return { components: [u, fan], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export function createPresetHouseholdD(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 240, y: 120, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: true, leakToCase: true, humanTouch: true } };
  const gnd: ComponentInstance = { id: 'gnd1', type: 'earth_ground', x: 240, y: 220, rot: 0, flip: false, label: 'ĐẤT1', props: { resistance: 4 } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'fan1', '1', [{ x: 120, y: 140 }, { x: 200, y: 120 }], 'phase');
  const w2 = makePresetWire('w2', 'src1', 'O', 'fan1', '2', [{ x: 120, y: 100 }, { x: 200, y: 60 }, { x: 280, y: 60 }, { x: 280, y: 120 }], 'neutral');
  const wpe = makePresetWire('wpe', 'fan1', 'PE', 'gnd1', 'pe', [{ x: 240, y: 140 }, { x: 240, y: 200 }], 'ground');
  return { components: [u, fan, gnd], wires: [w1, w2, wpe], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export function createPresetHouseholdE(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const elcb: ComponentInstance = { id: 'elcb1', type: 'cb', x: 200, y: 120, rot: 0, flip: false, label: 'ELCB1', props: { poles: 2, isELCB: true, state: true } };
  const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 340, y: 120, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: true, leakToCase: true, humanTouch: true } };
  const gnd: ComponentInstance = { id: 'gnd1', type: 'earth_ground', x: 340, y: 220, rot: 0, flip: false, label: 'ĐẤT1', props: { resistance: 4 } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'elcb1', 'in1', [{ x: 120, y: 140 }, { x: 160, y: 100 }], 'phase');
  const w2 = makePresetWire('w2', 'elcb1', 'out1', 'fan1', '1', [{ x: 240, y: 100 }, { x: 300, y: 120 }], 'phase');
  const w3 = makePresetWire('w3', 'src1', 'O', 'elcb1', 'in2', [{ x: 120, y: 100 }, { x: 160, y: 140 }], 'neutral');
  const w4 = makePresetWire('w4', 'elcb1', 'out2', 'fan1', '2', [{ x: 240, y: 140 }, { x: 380, y: 120 }], 'neutral');
  const wpe = makePresetWire('wpe', 'fan1', 'PE', 'gnd1', 'pe', [{ x: 340, y: 140 }, { x: 340, y: 200 }], 'ground');
  return { components: [u, elcb, fan, gnd], wires: [w1, w2, w3, w4, wpe], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (A1): Đèn + công tắc 1 cực + aptomat
export function createPresetHouseholdA1(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 16, state: true } };
  const sw: ComponentInstance = { id: 'sw1', type: 'switch_2p', x: 320, y: 140, rot: 0, flip: false, label: 'CT1', props: { state: true } };
  const lamp: ComponentInstance = { id: 'lamp1', type: 'lamp', x: 440, y: 140, rot: 0, flip: false, label: 'Đ1', props: { power: 60, hasPE: false } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
  const w2 = makePresetWire('w2', 'mcb1', 'out', 'sw1', '1', [{ x: 240, y: 140 }, { x: 280, y: 140 }], 'phase');
  const w3 = makePresetWire('w3', 'sw1', '2', 'lamp1', '1', [{ x: 360, y: 140 }, { x: 400, y: 140 }], 'phase');
  const w4 = makePresetWire('w4', 'lamp1', '2', 'src1', 'O', [{ x: 480, y: 140 }, { x: 480, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
  return { components: [u, mcb, sw, lamp], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (A2): Đèn cầu thang (2 công tắc 3 cực)
export function createPresetHouseholdA2(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const sw1: ComponentInstance = { id: 'sw1', type: 'switch_3p', x: 200, y: 140, rot: 0, flip: false, label: 'CT1', props: { state: true } };
  const sw2: ComponentInstance = { id: 'sw2', type: 'switch_3p', x: 340, y: 140, rot: 0, flip: false, label: 'CT2', props: { state: true } };
  const lamp: ComponentInstance = { id: 'lamp1', type: 'lamp', x: 480, y: 140, rot: 0, flip: false, label: 'Đ1', props: { power: 60, hasPE: false } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'sw1', 'com', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
  const w2 = makePresetWire('w2', 'sw1', 'a', 'sw2', 'a', [{ x: 240, y: 120 }, { x: 300, y: 120 }], 'phase');
  const w3 = makePresetWire('w3', 'sw1', 'b', 'sw2', 'b', [{ x: 240, y: 160 }, { x: 300, y: 160 }], 'phase');
  const w4 = makePresetWire('w4', 'sw2', 'com', 'lamp1', '1', [{ x: 380, y: 140 }, { x: 440, y: 140 }], 'phase');
  const w5 = makePresetWire('w5', 'lamp1', '2', 'src1', 'O', [{ x: 520, y: 140 }, { x: 520, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
  return { components: [u, sw1, sw2, lamp], wires: [w1, w2, w3, w4, w5], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (A3): Ổ cắm + quạt trần + đèn mắc song song có aptomat tổng
export function createPresetHouseholdA3(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 16, state: true } };
  const sock: ComponentInstance = { id: 'sk1', type: 'socket', x: 340, y: 80, rot: 0, flip: false, label: 'OC1', props: { state: true, loadPower: 100 } };
  const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 340, y: 180, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } };
  const lamp: ComponentInstance = { id: 'lamp1', type: 'lamp', x: 340, y: 280, rot: 0, flip: false, label: 'Đ1', props: { power: 60, hasPE: false } };

  const w1 = makePresetWire('w1', 'src1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
  const w2 = makePresetWire('w2', 'mcb1', 'out', 'sk1', '1', [{ x: 240, y: 140 }, { x: 280, y: 140 }, { x: 280, y: 80 }, { x: 300, y: 80 }], 'phase');
  const w3 = makePresetWire('w3', 'sk1', '1', 'fan1', '1', [{ x: 280, y: 80 }, { x: 280, y: 180 }, { x: 300, y: 180 }], 'phase');
  const w4 = makePresetWire('w4', 'fan1', '1', 'lamp1', '1', [{ x: 280, y: 180 }, { x: 280, y: 280 }, { x: 300, y: 280 }], 'phase');

  const w5 = makePresetWire('w5', 'sk1', '2', 'src1', 'O', [{ x: 380, y: 80 }, { x: 420, y: 80 }, { x: 420, y: 40 }, { x: 120, y: 40 }, { x: 120, y: 100 }], 'neutral');
  const w6 = makePresetWire('w6', 'fan1', '2', 'sk1', '2', [{ x: 380, y: 180 }, { x: 420, y: 180 }, { x: 420, y: 80 }], 'neutral');
  const w7 = makePresetWire('w7', 'lamp1', '2', 'fan1', '2', [{ x: 380, y: 280 }, { x: 420, y: 280 }, { x: 420, y: 180 }], 'neutral');

  return { components: [u, mcb, sock, fan, lamp], wires: [w1, w2, w3, w4, w5, w6, w7], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (A4): Mạng điện một phòng (ELCB tổng -> 2 nhánh MCB)
export function createPresetHouseholdA4(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const elcb: ComponentInstance = { id: 'elcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'ELCB1', props: { poles: 2, isELCB: true, state: true, ratedCurrent: 25 } };
  const mcb1: ComponentInstance = { id: 'mcb_light', type: 'cb', x: 340, y: 80, rot: 0, flip: false, label: 'MCB_CS', props: { poles: 1, ratedCurrent: 6, state: true } };
  const lamp: ComponentInstance = { id: 'lamp1', type: 'lamp', x: 480, y: 80, rot: 0, flip: false, label: 'Đ1', props: { power: 60, hasPE: false } };
  const mcb2: ComponentInstance = { id: 'mcb_sock', type: 'cb', x: 340, y: 200, rot: 0, flip: false, label: 'MCB_OC', props: { poles: 1, ratedCurrent: 16, state: true } };
  const sock: ComponentInstance = { id: 'sk1', type: 'socket', x: 480, y: 200, rot: 0, flip: false, label: 'OC1', props: { state: true, loadPower: 500 } };

  const w1 = makePresetWire('w1', 'src1', 'A', 'elcb1', 'in1', [{ x: 120, y: 140 }, { x: 160, y: 120 }], 'phase');
  const w2 = makePresetWire('w2', 'src1', 'O', 'elcb1', 'in2', [{ x: 120, y: 100 }, { x: 160, y: 160 }], 'neutral');

  const w3 = makePresetWire('w3', 'elcb1', 'out1', 'mcb_light', 'in', [{ x: 240, y: 120 }, { x: 280, y: 120 }, { x: 280, y: 80 }, { x: 300, y: 80 }], 'phase');
  const w4 = makePresetWire('w4', 'mcb_light', 'out', 'lamp1', '1', [{ x: 380, y: 80 }, { x: 440, y: 80 }], 'phase');
  const w5 = makePresetWire('w5', 'lamp1', '2', 'elcb1', 'out2', [{ x: 520, y: 80 }, { x: 540, y: 80 }, { x: 540, y: 160 }, { x: 240, y: 160 }], 'neutral');

  const w6 = makePresetWire('w6', 'elcb1', 'out1', 'mcb_sock', 'in', [{ x: 240, y: 120 }, { x: 280, y: 120 }, { x: 280, y: 200 }, { x: 300, y: 200 }], 'phase');
  const w7 = makePresetWire('w7', 'mcb_sock', 'out', 'sk1', '1', [{ x: 380, y: 200 }, { x: 440, y: 200 }], 'phase');
  const w8 = makePresetWire('w8', 'sk1', '2', 'elcb1', 'out2', [{ x: 520, y: 200 }, { x: 540, y: 200 }, { x: 540, y: 160 }], 'neutral');

  return { components: [u, elcb, mcb1, lamp, mcb2, sock], wires: [w1, w2, w3, w4, w5, w6, w7, w8], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export const HOUSEHOLD_PRESETS: Preset[] = [
  // --- Nhóm: Lắp đặt mạng điện trong nhà (L9, L12) ---
  {
    id: 'hh_a1',
    group: 'Lắp đặt mạng điện trong nhà (L9, L12)',
    grade: 'L9',
    title: 'A1) Đèn + công tắc 1 cực + aptomat',
    description: 'Mạch điện điều khiển 1 đèn sợi đốt 60 W qua công tắc 2 cực và aptomat MCB 1P 16A bảo vệ.',
    expectation: 'Kì vọng: bật công tắc thì đèn sáng; ngắt aptomat thì đèn tắt.',
    state: createPresetHouseholdA1(),
  },
  {
    id: 'hh_a2',
    group: 'Lắp đặt mạng điện trong nhà (L9, L12)',
    grade: 'L9',
    title: 'A2) Đèn cầu thang: 1 đèn điều khiển bằng 2 công tắc 3 cực',
    description: 'Mạch đèn cầu thang kinh điển: đảo trạng thái bất kì công tắc nào cũng đổi trạng thái đèn.',
    expectation: 'Kì vọng: bấm bất kì công tắc nào cũng đổi trạng thái đèn.',
    state: createPresetHouseholdA2(),
  },
  {
    id: 'hh_a3',
    group: 'Lắp đặt mạng điện trong nhà (L9, L12)',
    grade: 'L9, L12',
    title: 'A3) Ổ cắm + quạt trần + đèn mắc song song có aptomat',
    description: 'Mạch phân phối song song 3 thiết bị độc lập: ổ cắm, quạt trần 60 W và đèn 60 W có aptomat bảo vệ.',
    expectation: 'Kì vọng: ba thiết bị hoạt động độc lập; aptomat ngắt thì cả ba mất điện.',
    state: createPresetHouseholdA3(),
  },
  {
    id: 'hh_a',
    group: 'Lắp đặt mạng điện trong nhà (L9, L12)',
    grade: 'L9',
    title: 'a) Mạch cấp nguồn quạt trần qua MCB 1P 16A',
    description: 'Mạch khép kín đầy đủ dây về O, đo dòng tiêu thụ qua quạt trần 60 W (I ≈ 0.273 A).',
    expectation: 'Kì vọng: đóng aptomat thì quạt chạy bình thường, dòng xấp xỉ 0,27 A.',
    state: createPresetHouseholdA(),
  },

  // --- Nhóm: Bảo vệ mạch điện (L8, L9) ---
  {
    id: 'hh_a4',
    group: 'Bảo vệ mạch điện (L8, L9)',
    grade: 'L9, L12',
    title: 'A4) Mạng điện một phòng: ELCB tổng → 2 nhánh MCB',
    description: 'Hệ thống điện hiện đại: ELCB tổng 30 mA cấp cho 2 nhánh (chiếu sáng MCB 6A và ổ cắm MCB 16A).',
    expectation: 'Kì vọng: chập ở nhánh ổ cắm chỉ làm nhảy aptomat của nhánh đó, nhánh chiếu sáng vẫn sáng.',
    state: createPresetHouseholdA4(),
  },
  {
    id: 'hh_j',
    group: 'Bảo vệ mạch điện (L8, L9)',
    grade: 'L8, L9',
    title: 'j) Quá tải: Nguồn lưới 220V → MCB 10A → Tải 3000W',
    description: 'Dòng tải I ≈ 13.6 A vượt quá định mức 10 A. Aptomat tích lũy nhiệt và nhảy sau khoảng 8 s.',
    expectation: 'Kì vọng: dòng quá tải 13,6 A làm aptomat tích nhiệt và nhảy sau vài giây.',
    state: createPresetHouseholdJ(),
  },
  {
    id: 'hh_k',
    group: 'Bảo vệ mạch điện (L8, L9)',
    grade: 'L8, L9',
    title: 'k) Chập mạch: Nối tắt A với O qua MCB 16A',
    description: 'Dòng ngắn mạch cực lớn (vượt quá 5·In), cuộn điện từ của aptomat tác động nhảy tức thì (≤ 20 ms).',
    expectation: 'Kì vọng: dòng ngắn mạch làm cuộn điện từ aptomat tác động nhảy tức thì.',
    state: createPresetHouseholdK(),
  },
  {
    id: 'hh_l',
    group: 'Bảo vệ mạch điện (L8, L9)',
    grade: 'L8, L9',
    title: 'l) Chập mạch không có Aptomat: Dây 1.5 mm²',
    description: 'Chập trực tiếp dây pha A và trung tính O không qua thiết bị bảo vệ; dây dẫn bốc khói và cháy đứt.',
    expectation: 'Kì vọng: dây dẫn 1,5 mm² nóng đỏ và cháy đứt do không có aptomat bảo vệ.',
    state: createPresetHouseholdL(),
  },
  {
    id: 'hh_m',
    group: 'Bảo vệ mạch điện (L8, L9)',
    grade: 'L8, L9',
    title: 'm) Chọn sai dây dẫn: MCB 20A + Dây 1.0 mm² + Tải 3300W',
    description: 'Tải 15 A vượt quá khả năng chịu tải 10 A của dây 1.0 mm² nhưng nhỏ hơn MCB 20A; dây dẫn cháy trước khi aptomat nhảy!',
    expectation: 'Kì vọng: dây dẫn bốc khói cháy trước khi aptomat kịp nhảy.',
    state: createPresetHouseholdM(),
  },
  {
    id: 'hh_n',
    group: 'Bảo vệ mạch điện (L8, L9)',
    grade: 'L8, L9',
    title: 'n) Cầu chì 5A + Tải 2000W (Quá tải)',
    description: 'Dòng tải I ≈ 9.1 A vượt quá định mức cầu chì 5 A; dây chì nóng chảy và đứt sau ~2 s kèm tiếng tạch.',
    expectation: 'Kì vọng: dòng quá tải làm đứt dây chì sau khoảng 2 s.',
    state: createPresetHouseholdN(),
  },

  // --- Nhóm: An toàn điện (L8, L12) ---
  {
    id: 'hh_c',
    group: 'An toàn điện (L8, L12)',
    grade: 'L8, L12',
    title: 'c) Sự cố rò vỏ: Không có dây PE, người chạm vào vỏ',
    description: 'Minh họa sự cố nguy hiểm: điện áp vỏ 217.8 V, dòng qua người 217.8 mA gây nguy hiểm đến tính mạng.',
    expectation: 'Kì vọng: điện áp vỏ lên 218 V, dòng qua người vượt ngưỡng nguy hiểm.',
    state: createPresetHouseholdC(),
  },
  {
    id: 'hh_d',
    group: 'An toàn điện (L8, L12)',
    grade: 'L8, L12',
    title: 'd) Sự cố rò vỏ: Có dây PE nối Cọc tiếp địa 4 Ω',
    description: 'Bảo vệ tiếp địa: dòng sự cố đi vào cọc đất, điện áp tiếp xúc giảm từ 218 V xuống 62.7 V.',
    expectation: 'Kì vọng: dòng sự cố tiêu thoát xuống đất, điện áp tiếp xúc trên người giảm an toàn.',
    state: createPresetHouseholdD(),
  },
  {
    id: 'hh_e',
    group: 'An toàn điện (L8, L12)',
    grade: 'L8, L12',
    title: 'e) Bảo vệ toàn diện: Nối đất PE kết hợp ELCB 30 mA',
    description: 'Aptomat chống rò phát hiện chênh lệch dòng pha và trung tính (> 30 mA) và nhảy ngắt mạch tức thì.',
    expectation: 'Kì vọng: ELCB phát hiện dòng rò đất và nhảy ngắt nguồn bảo vệ tức thì.',
    state: createPresetHouseholdE(),
  },
  {
    id: 'hh_o',
    group: 'An toàn điện (L8, L12)',
    grade: 'L8, L12',
    title: 'o) Rò vỏ nguy hiểm có ELCB 30mA bảo vệ',
    description: 'Tải bị rò pha ra vỏ khi không có dây PE, người chạm vào vỏ tạo dòng rò đất ~218 mA làm ELCB nhảy ngay.',
    expectation: 'Kì vọng: người chạm vỏ rò kích hoạt ELCB nhảy ngay trong 20 ms.',
    state: createPresetHouseholdO(),
  },

  // --- Nhóm: Đo lường (L9) ---
  {
    id: 'hh_b',
    group: 'Đo lường (L9)',
    grade: 'L9',
    title: 'b) Mạch đo điện áp và dòng điện tải',
    description: 'Đo đồng thời điện áp 220 V trên tải bằng Vôn kế và dòng điện qua mạch bằng Ampe kế.',
    expectation: 'Kì vọng: Ampe kế chỉ ≈ 0,27 A, Vôn kế chỉ ≈ 220 V.',
    state: createPresetHouseholdB(),
  },
  {
    id: 'hh_p',
    group: 'Đo lường (L9)',
    grade: 'L9',
    title: 'p) Đo công suất: Oát kế 4 chân + Đèn 60W',
    description: 'Cuộn dòng (I+, I-) nối tiếp với đèn, cuộn áp (U+, U-) nối song song giữa pha và trung tính; oát kế đo đúng 60 W.',
    expectation: 'Kì vọng: Oát kế hiển thị công suất tiêu thụ chính xác 60 W.',
    state: createPresetHouseholdP(),
  },
];

// ----------------------------------------------------
// Mạch điện tử (Electronics presets)
// ----------------------------------------------------

export function createPresetElectronicsF(): CircuitState {
  const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 80, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
  const r: ComponentInstance = { id: 'r1', type: 'resistor', x: 200, y: 80, rot: 0, flip: false, label: 'R1', props: { resistance: 470 } };
  const am: ComponentInstance = { id: 'a1', type: 'ammeter', x: 300, y: 80, rot: 0, flip: false, label: 'A1', props: {} };
  const led: ComponentInstance = { id: 'led1', type: 'led', x: 420, y: 80, rot: 0, flip: false, label: 'D1', props: { color: 'red' } };
  const w1 = makePresetWire('w1', 'v1', 'pos', 'r1', '1', [{ x: 80, y: 80 }, { x: 160, y: 80 }], 'phase');
  const w2 = makePresetWire('w2', 'r1', '2', 'a1', 'pos', [{ x: 240, y: 80 }, { x: 260, y: 80 }], 'phase');
  const w3 = makePresetWire('w3', 'a1', 'neg', 'led1', 'A', [{ x: 340, y: 80 }, { x: 380, y: 80 }], 'phase');
  const w4 = makePresetWire('w4', 'led1', 'K', 'v1', 'neg', [{ x: 460, y: 80 }, { x: 460, y: 160 }, { x: 80, y: 160 }], 'neutral');
  return { components: [v, r, am, led], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export function createPresetElectronicsG(): CircuitState {
  const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 100, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
  const led: ComponentInstance = { id: 'led1', type: 'led', x: 260, y: 120, rot: 0, flip: false, label: 'D1', props: { color: 'red' } };
  const w1 = makePresetWire('w1', 'v1', 'pos', 'led1', 'A', [{ x: 100, y: 80 }, { x: 220, y: 120 }], 'phase');
  const w2 = makePresetWire('w2', 'led1', 'K', 'v1', 'neg', [{ x: 300, y: 120 }, { x: 300, y: 160 }, { x: 100, y: 160 }], 'neutral');
  return { components: [v, led], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export function createPresetElectronicsH(): CircuitState {
  const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 80, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
  const sw: ComponentInstance = { id: 'ct1', type: 'switch_2p', x: 180, y: 80, rot: 0, flip: false, label: 'CT1', props: { state: true } };
  const r: ComponentInstance = { id: 'r1', type: 'resistor', x: 280, y: 80, rot: 0, flip: false, label: 'R1', props: { resistance: 1000 } };
  const c: ComponentInstance = { id: 'c1', type: 'capacitor_ceramic', x: 380, y: 120, rot: 0, flip: false, label: 'C1', props: { capacitance: 100 } };
  const w1 = makePresetWire('w1', 'v1', 'pos', 'ct1', '1', [{ x: 80, y: 80 }, { x: 140, y: 80 }], 'phase');
  const w2 = makePresetWire('w2', 'ct1', '2', 'r1', '1', [{ x: 220, y: 80 }, { x: 240, y: 80 }], 'phase');
  const w3 = makePresetWire('w3', 'r1', '2', 'c1', '1', [{ x: 320, y: 80 }, { x: 340, y: 120 }], 'phase');
  const w4 = makePresetWire('w4', 'c1', '2', 'v1', 'neg', [{ x: 420, y: 120 }, { x: 420, y: 160 }, { x: 80, y: 160 }], 'neutral');
  return { components: [v, sw, r, c], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export function createPresetElectronicsI(): CircuitState {
  const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 100, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
  const c: ComponentInstance = { id: 'c1', type: 'capacitor_electrolytic', x: 260, y: 120, rot: 0, flip: false, label: 'C1', props: { capacitance: 100, ratedVoltage: 16 } };
  const w1 = makePresetWire('w1', 'v1', 'pos', 'c1', 'neg', [{ x: 100, y: 80 }, { x: 300, y: 80 }, { x: 300, y: 120 }], 'phase');
  const w2 = makePresetWire('w2', 'c1', 'pos', 'v1', 'neg', [{ x: 220, y: 120 }, { x: 220, y: 160 }, { x: 100, y: 160 }], 'neutral');
  return { components: [v, c], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (j)
export function createPresetHouseholdJ(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 10, state: true } };
  const am: ComponentInstance = { id: 'a1', type: 'ammeter', x: 300, y: 140, rot: 0, flip: false, label: 'A1', props: {} };
  const app: ComponentInstance = { id: 'app1', type: 'appliance_generic', x: 440, y: 140, rot: 0, flip: false, label: 'TB1', props: { power: 3000, hasPE: false } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
  const w2 = makePresetWire('w2', 'mcb1', 'out', 'a1', 'pos', [{ x: 240, y: 140 }, { x: 260, y: 140 }], 'phase');
  const w3 = makePresetWire('w3', 'a1', 'neg', 'app1', '1', [{ x: 340, y: 140 }, { x: 400, y: 140 }], 'phase');
  const w4 = makePresetWire('w4', 'app1', '2', 'src1', 'O', [{ x: 480, y: 140 }, { x: 480, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
  return { components: [u, mcb, am, app], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (k)
export function createPresetHouseholdK(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 100, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 240, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 16, state: true } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'mcb1', 'in', [{ x: 140, y: 140 }, { x: 200, y: 140 }], 'phase');
  const w2 = makePresetWire('w2', 'mcb1', 'out', 'src1', 'O', [{ x: 280, y: 140 }, { x: 320, y: 140 }, { x: 320, y: 60 }, { x: 140, y: 60 }, { x: 140, y: 100 }], 'neutral');
  return { components: [u, mcb], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (l)
export function createPresetHouseholdL(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 120, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'src1', 'O', [{ x: 160, y: 140 }, { x: 300, y: 140 }, { x: 300, y: 60 }, { x: 160, y: 60 }, { x: 160, y: 100 }], 'phase');
  w1.crossSection = 1.5;
  return { components: [u], wires: [w1], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (m)
export function createPresetHouseholdM(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 20, state: true } };
  const app: ComponentInstance = { id: 'app1', type: 'appliance_generic', x: 400, y: 140, rot: 0, flip: false, label: 'TB1', props: { power: 3300, hasPE: false } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
  const w2 = makePresetWire('w2', 'mcb1', 'out', 'app1', '1', [{ x: 240, y: 140 }, { x: 360, y: 140 }], 'phase');
  w2.crossSection = 1.0;
  const w3 = makePresetWire('w3', 'app1', '2', 'src1', 'O', [{ x: 440, y: 140 }, { x: 440, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
  w3.crossSection = 1.0;
  return { components: [u, mcb, app], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (n)
export function createPresetHouseholdN(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const f: ComponentInstance = { id: 'f1', type: 'fuse', x: 200, y: 140, rot: 0, flip: false, label: 'CC1', props: { ratedCurrent: 5 } };
  const app: ComponentInstance = { id: 'app1', type: 'appliance_generic', x: 360, y: 140, rot: 0, flip: false, label: 'TB1', props: { power: 2000, hasPE: false } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'f1', '1', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
  const w2 = makePresetWire('w2', 'f1', '2', 'app1', '1', [{ x: 240, y: 140 }, { x: 320, y: 140 }], 'phase');
  const w3 = makePresetWire('w3', 'app1', '2', 'src1', 'O', [{ x: 400, y: 140 }, { x: 400, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
  return { components: [u, f, app], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (o)
export function createPresetHouseholdO(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const elcb: ComponentInstance = { id: 'elcb1', type: 'cb', x: 200, y: 120, rot: 0, flip: false, label: 'ELCB1', props: { poles: 2, isELCB: true, state: true } };
  const app: ComponentInstance = { id: 'app1', type: 'appliance_generic', x: 360, y: 120, rot: 0, flip: false, label: 'TB1', props: { power: 500, leakToCase: true, humanTouch: true, hasPE: false } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'elcb1', 'in1', [{ x: 120, y: 140 }, { x: 160, y: 100 }], 'phase');
  const w2 = makePresetWire('w2', 'elcb1', 'out1', 'app1', '1', [{ x: 240, y: 100 }, { x: 320, y: 120 }], 'phase');
  const w3 = makePresetWire('w3', 'src1', 'O', 'elcb1', 'in2', [{ x: 120, y: 100 }, { x: 160, y: 140 }], 'neutral');
  const w4 = makePresetWire('w4', 'elcb1', 'out2', 'app1', '2', [{ x: 240, y: 140 }, { x: 400, y: 120 }], 'neutral');
  return { components: [u, elcb, app], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (p)
export function createPresetHouseholdP(): CircuitState {
  const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
  const wtt: ComponentInstance = { id: 'w1', type: 'wattmeter', x: 240, y: 140, rot: 0, flip: false, label: 'W1', props: {} };
  const lamp: ComponentInstance = { id: 'l1', type: 'lamp', x: 420, y: 140, rot: 0, flip: false, label: 'Đ1', props: { power: 60, hasPE: false } };
  const w1 = makePresetWire('w1', 'src1', 'A', 'w1', 'I+', [{ x: 120, y: 140 }, { x: 190, y: 140 }], 'phase');
  const w2 = makePresetWire('w2', 'w1', 'I-', 'l1', '1', [{ x: 290, y: 140 }, { x: 380, y: 140 }], 'phase');
  const w3 = makePresetWire('w3', 'l1', '2', 'src1', 'O', [{ x: 460, y: 140 }, { x: 460, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
  const w4 = makePresetWire('w4', 'src1', 'A', 'w1', 'U+', [{ x: 120, y: 140 }, { x: 160, y: 140 }, { x: 160, y: 90 }, { x: 240, y: 90 }], 'phase');
  const w5 = makePresetWire('w5', 'src1', 'O', 'w1', 'U-', [{ x: 120, y: 100 }, { x: 120, y: 60 }, { x: 240, y: 60 }, { x: 240, y: 190 }], 'neutral');
  return { components: [u, wtt, lamp], wires: [w1, w2, w3, w4, w5], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (q)
export function createPresetElectronicsQ(): CircuitState {
  const ohm: ComponentInstance = { id: 'ohm1', type: 'ohmmeter', x: 100, y: 140, rot: 0, flip: false, label: 'Ω1', props: {} };
  const r1: ComponentInstance = { id: 'r1', type: 'resistor', x: 260, y: 100, rot: 0, flip: false, label: 'R1', props: { resistance: 1000 } };
  const r2: ComponentInstance = { id: 'r2', type: 'resistor', x: 400, y: 100, rot: 0, flip: false, label: 'R2', props: { resistance: 2000 } };
  const w1 = makePresetWire('w1', 'ohm1', '1', 'r1', '1', [{ x: 140, y: 140 }, { x: 200, y: 140 }, { x: 200, y: 100 }, { x: 220, y: 100 }], 'phase');
  const w2 = makePresetWire('w2', 'r1', '2', 'r2', '1', [{ x: 300, y: 100 }, { x: 360, y: 100 }], 'phase');
  const w3 = makePresetWire('w3', 'r2', '2', 'ohm1', '2', [{ x: 440, y: 100 }, { x: 480, y: 100 }, { x: 480, y: 180 }, { x: 140, y: 180 }, { x: 140, y: 160 }], 'neutral');
  return { components: [ohm, r1, r2], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (v): Mạch nạp tụ RC + Dao động kí ảo
export function createPresetElectronicsV(): CircuitState {
  const v: ComponentInstance = { id: 'src1', type: 'dc_source', x: 80, y: 140, rot: 0, flip: false, label: 'E', props: { voltage: 5 } };
  const sw: ComponentInstance = { id: 'sw1', type: 'switch_2p', x: 180, y: 100, rot: 0, flip: false, label: 'K', props: { state: true } };
  const r: ComponentInstance = { id: 'r1', type: 'resistor', x: 280, y: 100, rot: 0, flip: false, label: 'R', props: { resistance: 1000 } };
  const c: ComponentInstance = { id: 'c1', type: 'capacitor_electrolytic', x: 380, y: 140, rot: 0, flip: false, label: 'C', props: { capacitance: 100, ratedVoltage: 16 } };
  const osc: ComponentInstance = { id: 'osc1', type: 'oscilloscope', x: 500, y: 140, rot: 0, flip: false, label: 'OSC', props: {} };
  const gnd: ComponentInstance = { id: 'gnd1', type: 'gnd', x: 80, y: 220, rot: 0, flip: false, label: '', props: {} };

  const w1 = makePresetWire('w1', 'src1', 'pos', 'sw1', '1', [{ x: 80, y: 100 }, { x: 140, y: 100 }], 'phase');
  const w2 = makePresetWire('w2', 'sw1', '2', 'r1', '1', [{ x: 220, y: 100 }, { x: 240, y: 100 }], 'phase');
  const w3 = makePresetWire('w3', 'r1', '2', 'c1', 'pos', [{ x: 320, y: 100 }, { x: 340, y: 140 }], 'phase');
  const w4 = makePresetWire('w4', 'c1', 'neg', 'src1', 'neg', [{ x: 420, y: 140 }, { x: 420, y: 180 }, { x: 80, y: 180 }], 'neutral');
  const w_gnd = makePresetWire('w_gnd', 'src1', 'neg', 'gnd1', 'gnd', [{ x: 80, y: 180 }, { x: 80, y: 200 }], 'ground');
  const w_ch1 = makePresetWire('w_ch1', 'c1', 'pos', 'osc1', 'ch1', [{ x: 340, y: 140 }, { x: 340, y: 80 }, { x: 460, y: 80 }, { x: 460, y: 120 }], 'phase');
  const w_osc_gnd = makePresetWire('w_osc_gnd', 'c1', 'neg', 'osc1', 'gnd', [{ x: 420, y: 140 }, { x: 540, y: 140 }], 'neutral');

  return {
    components: [v, sw, r, c, osc, gnd],
    wires: [w1, w2, w3, w4, w_gnd, w_ch1, w_osc_gnd],
    junctions: [],
    viewport: { x: 40, y: 40, zoom: 1 },
  };
}

// Preset (x): Nguồn xoay chiều sin 5 V đỉnh, 50 Hz + Dao động kí
export function createPresetElectronicsX(): CircuitState {
  const ac: ComponentInstance = {
    id: 'src1',
    type: 'ac_source',
    x: 100,
    y: 140,
    rot: 0,
    flip: false,
    label: 'U~',
    props: { peakVoltage: 5, frequency: 50, dcOffset: 0, phase: 0 },
  };
  const osc: ComponentInstance = {
    id: 'osc1',
    type: 'oscilloscope',
    x: 340,
    y: 140,
    rot: 0,
    flip: false,
    label: 'OSC',
    props: {},
  };
  const gnd: ComponentInstance = {
    id: 'gnd1',
    type: 'gnd',
    x: 100,
    y: 220,
    rot: 0,
    flip: false,
    label: '',
    props: {},
  };

  const w_ch1 = makePresetWire('w_ch1', 'src1', 'pos', 'osc1', 'ch1', [{ x: 100, y: 110 }, { x: 300, y: 110 }, { x: 300, y: 120 }], 'phase');
  const w_gnd = makePresetWire('w_gnd', 'src1', 'neg', 'osc1', 'gnd', [{ x: 100, y: 170 }, { x: 380, y: 170 }, { x: 380, y: 140 }], 'neutral');
  const w_earth = makePresetWire('w_earth', 'src1', 'neg', 'gnd1', 'gnd', [{ x: 100, y: 170 }, { x: 100, y: 200 }], 'ground');

  return {
    components: [ac, osc, gnd],
    wires: [w_ch1, w_gnd, w_earth],
    junctions: [],
    viewport: { x: 40, y: 40, zoom: 1 },
  };
}

// Preset (y): Mạch chỉnh lưu nửa chu kì (Diode + Trở tải 1 kΩ + Dao động kí CH1/CH2)
export function createPresetElectronicsY(): CircuitState {
  const ac: ComponentInstance = {
    id: 'src1',
    type: 'ac_source',
    x: 80,
    y: 140,
    rot: 0,
    flip: false,
    label: 'U~',
    props: { peakVoltage: 5, frequency: 50, dcOffset: 0, phase: 0 },
  };
  const d: ComponentInstance = {
    id: 'd1',
    type: 'diode',
    x: 220,
    y: 100,
    rot: 0,
    flip: false,
    label: 'D1',
    props: { model: '1N4007' },
  };
  const r: ComponentInstance = {
    id: 'r1',
    type: 'resistor',
    x: 360,
    y: 140,
    rot: 0,
    flip: false,
    label: 'R_tải',
    props: { resistance: 1000 },
  };
  const osc: ComponentInstance = {
    id: 'osc1',
    type: 'oscilloscope',
    x: 520,
    y: 140,
    rot: 0,
    flip: false,
    label: 'OSC',
    props: {},
  };
  const gnd: ComponentInstance = {
    id: 'gnd1',
    type: 'gnd',
    x: 80,
    y: 220,
    rot: 0,
    flip: false,
    label: '',
    props: {},
  };

  const w1 = makePresetWire('w1', 'src1', 'pos', 'd1', 'A', [{ x: 80, y: 100 }, { x: 180, y: 100 }], 'phase');
  const w2 = makePresetWire('w2', 'd1', 'K', 'r1', '1', [{ x: 260, y: 100 }, { x: 320, y: 100 }, { x: 320, y: 140 }], 'phase');
  const w3 = makePresetWire('w3', 'r1', '2', 'src1', 'neg', [{ x: 400, y: 140 }, { x: 400, y: 180 }, { x: 80, y: 180 }], 'neutral');
  const w_earth = makePresetWire('w_earth', 'src1', 'neg', 'gnd1', 'gnd', [{ x: 80, y: 180 }, { x: 80, y: 200 }], 'ground');

  const w_ch1 = makePresetWire('w_ch1', 'src1', 'pos', 'osc1', 'ch1', [{ x: 80, y: 100 }, { x: 80, y: 60 }, { x: 480, y: 60 }, { x: 480, y: 120 }], 'phase');
  const w_ch2 = makePresetWire('w_ch2', 'r1', '1', 'osc1', 'ch2', [{ x: 320, y: 100 }, { x: 460, y: 100 }, { x: 460, y: 140 }, { x: 480, y: 140 }], 'phase');
  const w_osc_gnd = makePresetWire('w_osc_gnd', 'src1', 'neg', 'osc1', 'gnd', [{ x: 400, y: 180 }, { x: 560, y: 180 }, { x: 560, y: 140 }], 'neutral');

  return {
    components: [ac, d, r, osc, gnd],
    wires: [w1, w2, w3, w_earth, w_ch1, w_ch2, w_osc_gnd],
    junctions: [],
    viewport: { x: 40, y: 40, zoom: 1 },
  };
}

// Preset (B1): Transistor NPN đóng cắt LED bằng nút nhấn qua điện trở cực nền
export function createPresetElectronicsB1(): CircuitState {
  const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 80, y: 140, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
  const pb: ComponentInstance = { id: 'pb1', type: 'push_button', x: 200, y: 80, rot: 0, flip: false, label: 'PB1', props: { state: true } };
  const rb: ComponentInstance = { id: 'rb1', type: 'resistor', x: 300, y: 80, rot: 0, flip: false, label: 'Rb', props: { resistance: 10000 } };
  const rc: ComponentInstance = { id: 'rc1', type: 'resistor', x: 300, y: 180, rot: 0, flip: false, label: 'Rc', props: { resistance: 470 } };
  const led: ComponentInstance = { id: 'led1', type: 'led', x: 400, y: 180, rot: 0, flip: false, label: 'D1', props: { color: 'red' } };
  const q: ComponentInstance = { id: 'q1', type: 'transistor_npn', x: 480, y: 120, rot: 0, flip: false, label: 'Q1', props: { beta: 100 } };
  const gnd: ComponentInstance = { id: 'gnd1', type: 'gnd', x: 80, y: 240, rot: 0, flip: false, label: '', props: {} };

  const w1 = makePresetWire('w1', 'v1', 'pos', 'pb1', '1', [{ x: 80, y: 100 }, { x: 80, y: 80 }, { x: 160, y: 80 }], 'phase');
  const w2 = makePresetWire('w2', 'pb1', '2', 'rb1', '1', [{ x: 240, y: 80 }, { x: 260, y: 80 }], 'phase');
  const w3 = makePresetWire('w3', 'rb1', '2', 'q1', 'B', [{ x: 340, y: 80 }, { x: 440, y: 80 }, { x: 440, y: 120 }], 'phase');

  const w4 = makePresetWire('w4', 'v1', 'pos', 'rc1', '1', [{ x: 80, y: 100 }, { x: 80, y: 180 }, { x: 260, y: 180 }], 'phase');
  const w5 = makePresetWire('w5', 'rc1', '2', 'led1', 'A', [{ x: 340, y: 180 }, { x: 360, y: 180 }], 'phase');
  const w6 = makePresetWire('w6', 'led1', 'K', 'q1', 'C', [{ x: 440, y: 180 }, { x: 500, y: 180 }, { x: 500, y: 80 }], 'phase');
  const w7 = makePresetWire('w7', 'q1', 'E', 'v1', 'neg', [{ x: 500, y: 160 }, { x: 500, y: 220 }, { x: 80, y: 220 }, { x: 80, y: 180 }], 'neutral');
  const wg = makePresetWire('wg', 'v1', 'neg', 'gnd1', 'gnd', [{ x: 80, y: 180 }, { x: 80, y: 220 }], 'ground');

  return { components: [v, pb, rb, rc, led, q, gnd], wires: [w1, w2, w3, w4, w5, w6, w7, wg], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (B2): Biến trở điều chỉnh độ sáng LED (biến trở nối tiếp điện trở hạn dòng)
export function createPresetElectronicsB2(): CircuitState {
  const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 80, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
  const vr: ComponentInstance = { id: 'vr1', type: 'potentiometer', x: 200, y: 80, rot: 0, flip: false, label: 'VR1', props: { resistance: 1000, ratio: 50 } };
  const r: ComponentInstance = { id: 'r1', type: 'resistor', x: 320, y: 80, rot: 0, flip: false, label: 'R1', props: { resistance: 220 } };
  const led: ComponentInstance = { id: 'led1', type: 'led', x: 440, y: 80, rot: 0, flip: false, label: 'D1', props: { color: 'red' } };
  const gnd: ComponentInstance = { id: 'gnd1', type: 'gnd', x: 80, y: 220, rot: 0, flip: false, label: '', props: {} };

  const w1 = makePresetWire('w1', 'v1', 'pos', 'vr1', '1', [{ x: 80, y: 80 }, { x: 160, y: 80 }], 'phase');
  const w2 = makePresetWire('w2', 'vr1', '2', 'r1', '1', [{ x: 200, y: 120 }, { x: 280, y: 80 }], 'phase');
  const w3 = makePresetWire('w3', 'r1', '2', 'led1', 'A', [{ x: 360, y: 80 }, { x: 400, y: 80 }], 'phase');
  const w4 = makePresetWire('w4', 'led1', 'K', 'v1', 'neg', [{ x: 480, y: 80 }, { x: 480, y: 160 }, { x: 80, y: 160 }], 'neutral');
  const wg = makePresetWire('wg', 'v1', 'neg', 'gnd1', 'gnd', [{ x: 80, y: 160 }, { x: 80, y: 200 }], 'ground');

  return { components: [v, vr, r, led, gnd], wires: [w1, w2, w3, w4, wg], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (B3): Cầu chia áp hai điện trở có Vôn kế
export function createPresetElectronicsB3(): CircuitState {
  const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 80, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
  const r1: ComponentInstance = { id: 'r1', type: 'resistor', x: 220, y: 80, rot: 0, flip: false, label: 'R1', props: { resistance: 1000 } };
  const r2: ComponentInstance = { id: 'r2', type: 'resistor', x: 360, y: 80, rot: 0, flip: false, label: 'R2', props: { resistance: 1000 } };
  const vm: ComponentInstance = { id: 'vm1', type: 'voltmeter', x: 360, y: 180, rot: 0, flip: false, label: 'V_out', props: {} };
  const gnd: ComponentInstance = { id: 'gnd1', type: 'gnd', x: 80, y: 220, rot: 0, flip: false, label: '', props: {} };

  const w1 = makePresetWire('w1', 'v1', 'pos', 'r1', '1', [{ x: 80, y: 80 }, { x: 180, y: 80 }], 'phase');
  const w2 = makePresetWire('w2', 'r1', '2', 'r2', '1', [{ x: 260, y: 80 }, { x: 320, y: 80 }], 'phase');
  const w3 = makePresetWire('w3', 'r2', '2', 'v1', 'neg', [{ x: 400, y: 80 }, { x: 400, y: 160 }, { x: 80, y: 160 }], 'neutral');
  const wv1 = makePresetWire('wv1', 'r2', '1', 'vm1', 'pos', [{ x: 320, y: 80 }, { x: 320, y: 180 }], 'phase');
  const wv2 = makePresetWire('wv2', 'r2', '2', 'vm1', 'neg', [{ x: 400, y: 80 }, { x: 400, y: 180 }], 'neutral');
  const wg = makePresetWire('wg', 'v1', 'neg', 'gnd1', 'gnd', [{ x: 80, y: 160 }, { x: 80, y: 200 }], 'ground');

  return { components: [v, r1, r2, vm, gnd], wires: [w1, w2, w3, wv1, wv2, wg], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export const ELECTRONICS_PRESETS: Preset[] = [
  // --- Nhóm: Linh kiện cơ bản (L9, L12) ---
  {
    id: 'el_f',
    group: 'Linh kiện cơ bản (L9, L12)',
    grade: 'L9',
    title: 'f) Pin 9 V + Điện trở 470 Ω + LED đỏ',
    description: 'Mạch chiếu sáng LED cơ bản có trở hạn dòng (I ≈ 14.6 mA, điện áp LED ≈ 2.0 V).',
    expectation: 'Kì vọng: LED sáng đỏ bình thường, dòng hạn mức ≈ 14,6 mA.',
    state: createPresetElectronicsF(),
  },
  {
    id: 'el_b2',
    group: 'Linh kiện cơ bản (L9, L12)',
    grade: 'L9, L12',
    title: 'B2) Biến trở điều chỉnh độ sáng LED',
    description: 'Biến trở 1 kΩ nối tiếp điện trở hạn dòng 220 Ω; kéo con chạy biến trở để chỉnh độ sáng LED.',
    expectation: 'Kì vọng: kéo núm biến trở thì dòng và độ sáng LED đổi.',
    state: createPresetElectronicsB2(),
  },
  {
    id: 'el_b3',
    group: 'Linh kiện cơ bản (L9, L12)',
    grade: 'L9, L12',
    title: 'B3) Cầu chia áp hai điện trở có Vôn kế',
    description: 'Hai điện trở R1 = R2 = 1 kΩ chia đôi điện áp nguồn 9 V, Vôn kế đo điện áp ra U_ra = 4.5 V.',
    expectation: 'Kì vọng: số đo vôn kế khớp công thức chia áp U_ra = U_vào · R2 / (R1 + R2).',
    state: createPresetElectronicsB3(),
  },
  {
    id: 'el_h',
    group: 'Linh kiện cơ bản (L9, L12)',
    grade: 'L12',
    title: 'h) Mạch RC: 1 kΩ + 100 µF + Công tắc',
    description: 'Khảo sát nạp xả tụ điện: công tắc đóng cấp nguồn nạp điện áp 9 V lên tụ.',
    expectation: 'Kì vọng: đóng công tắc thì điện áp trên tụ tăng dần đạt 9 V.',
    state: createPresetElectronicsH(),
  },
  {
    id: 'el_q',
    group: 'Linh kiện cơ bản (L9, L12)',
    grade: 'L9',
    title: 'q) Đo điện trở: Ôm kế 2 chân + Cụm 1 kΩ nối tiếp 2 kΩ',
    description: 'Ôm kế bơm dòng thử đo chính xác tổng trở tương đương 3,00 kΩ khi mạch không có nguồn điện.',
    expectation: 'Kì vọng: Ôm kế đo chính xác tổng trở nối tiếp 3,00 kΩ.',
    state: createPresetElectronicsQ(),
  },
  {
    id: 'el_v',
    group: 'Linh kiện cơ bản (L9, L12)',
    grade: 'L12',
    title: 'v) Quá trình nạp tụ RC (Dao động kí ảo)',
    description: 'Nguồn 5 V + điện trở 1 kΩ + tụ 100 µF + công tắc. Kênh CH1 đo điện áp tức thời trên tụ. Kì vọng: V_tụ tăng theo đường cong, đạt ≈ 3,16 V (63%) sau 0,1 s.',
    expectation: 'Kì vọng: V_tụ tăng theo đường cong, đạt ≈ 3,16 V (63%) sau 0,1 s.',
    state: createPresetElectronicsV(),
  },
  {
    id: 'el_x',
    group: 'Linh kiện cơ bản (L9, L12)',
    grade: 'L12',
    title: 'x) Nguồn xoay chiều sin 5 V đỉnh, 50 Hz (Dao động kí)',
    description: 'Nguồn xoay chiều 5 V đỉnh, 50 Hz nối vào kênh CH1 của dao động kí.',
    expectation: 'Kì vọng: sóng sin chu kì 20 ms, đỉnh ±5 V.',
    state: createPresetElectronicsX(),
  },
  {
    id: 'el_y',
    group: 'Linh kiện cơ bản (L9, L12)',
    grade: 'L12',
    title: 'y) Chỉnh lưu nửa chu kì (Diode 1N4007 + Tải 1 kΩ)',
    description: 'Nguồn 5 V đỉnh 50 Hz qua diode 1N4007 nạp tải 1 kΩ. CH1 đo nguồn, CH2 đo tải.',
    expectation: 'Kì vọng: CH2 chỉ có nửa chu kì dương, đỉnh ≈ 4,3 V.',
    state: createPresetElectronicsY(),
  },

  // --- Nhóm: Mạch trang trí, báo hiệu (L9) ---
  {
    id: 'el_b1',
    group: 'Mạch trang trí, báo hiệu (L9)',
    grade: 'L9, L12',
    title: 'B1) Transistor NPN đóng cắt LED bằng nút nhấn',
    description: 'Transistor BJT NPN đóng vai trò khóa điện tử: dòng điều khiển cực nền kích mở mạch tải LED sáng.',
    expectation: 'Kì vọng: nhấn nút thì LED sáng; nhả nút thì LED tắt.',
    state: createPresetElectronicsB1(),
  },

  // --- Nhóm: Sự cố linh kiện (L9) ---
  {
    id: 'el_g',
    group: 'Sự cố linh kiện (L9)',
    grade: 'L9',
    title: 'g) LED nối thẳng pin 9 V (không trở hạn dòng)',
    description: 'Mạch báo động quá dòng: dòng điện chạy thẳng qua LED mà không có điện trở cản trở làm hỏng LED.',
    expectation: 'Kì vọng: dòng quá lớn làm LED cháy hỏng ngay khi cấp điện.',
    state: createPresetElectronicsG(),
  },
  {
    id: 'el_i',
    group: 'Sự cố linh kiện (L9)',
    grade: 'L9',
    title: 'i) Tụ hóa 16 V đấu ngược cực',
    description: 'Cực dương nguồn 9 V đấu vào cực âm (−) của tụ hóa, phát tín hiệu cảnh báo đấu ngược cực.',
    expectation: 'Kì vọng: tụ hóa đấu ngược cực phát nổ hỏng linh kiện.',
    state: createPresetElectronicsI(),
  },
];

// ----------------------------------------------------
// Mạch điều khiển cảm biến (Sensor presets)
// ----------------------------------------------------

export function createPresetSensorR(): CircuitState {
  const src: ComponentInstance = { id: 'src1', type: 'dc_source', x: 80, y: 160, rot: 0, flip: false, label: 'E', props: { voltage: 5 } };
  const sensor: ComponentInstance = {
    id: 'cb1',
    type: 'sensor_module',
    x: 260,
    y: 120,
    rot: 0,
    flip: false,
    label: 'CB_AS',
    props: { sensorType: 'light', envValue: 30, threshold: 50, triggerCondition: 'below' },
  };
  const relay: ComponentInstance = {
    id: 'rl1',
    type: 'relay_module_1ch',
    x: 440,
    y: 160,
    rot: 0,
    flip: false,
    label: 'RL1',
    props: { ratedCurrent: 10 },
  };
  const lamp: ComponentInstance = {
    id: 'den1',
    type: 'lamp_dc',
    x: 620,
    y: 160,
    rot: 0,
    flip: false,
    label: 'Đ1',
    props: { voltage: 5, power: 1 },
  };

  const w1 = makePresetWire('w1', 'src1', 'pos', 'cb1', 'vcc', [{ x: 120, y: 160 }, { x: 160, y: 160 }, { x: 160, y: 95 }, { x: 210, y: 95 }], 'phase');
  const w2 = makePresetWire('w2', 'src1', 'pos', 'rl1', 'vcc', [{ x: 160, y: 160 }, { x: 160, y: 40 }, { x: 390, y: 40 }, { x: 390, y: 110 }], 'phase');
  const w3 = makePresetWire('w3', 'src1', 'pos', 'rl1', 'com', [{ x: 160, y: 160 }, { x: 160, y: 260 }, { x: 490, y: 260 }, { x: 490, y: 210 }], 'phase');
  const w4 = makePresetWire('w4', 'src1', 'neg', 'cb1', 'gnd', [{ x: 120, y: 180 }, { x: 180, y: 180 }, { x: 180, y: 115 }, { x: 210, y: 115 }], 'neutral');
  const w5 = makePresetWire('w5', 'src1', 'neg', 'rl1', 'gnd', [{ x: 180, y: 180 }, { x: 180, y: 280 }, { x: 390, y: 280 }, { x: 390, y: 160 }], 'neutral');
  const w6 = makePresetWire('w6', 'cb1', 'do', 'rl1', 'in', [{ x: 310, y: 95 }, { x: 350, y: 95 }, { x: 350, y: 210 }, { x: 390, y: 210 }], 'phase');
  const w7 = makePresetWire('w7', 'rl1', 'no', 'den1', '1', [{ x: 490, y: 110 }, { x: 550, y: 110 }, { x: 550, y: 160 }, { x: 580, y: 160 }], 'phase');
  const w8 = makePresetWire('w8', 'den1', '2', 'src1', 'neg', [{ x: 660, y: 160 }, { x: 680, y: 160 }, { x: 680, y: 300 }, { x: 120, y: 300 }, { x: 120, y: 180 }], 'neutral');

  return { components: [src, sensor, relay, lamp], wires: [w1, w2, w3, w4, w5, w6, w7, w8], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export function createPresetSensorS(): CircuitState {
  const src: ComponentInstance = { id: 'src1', type: 'dc_source', x: 80, y: 160, rot: 0, flip: false, label: 'E', props: { voltage: 5 } };
  const sensor: ComponentInstance = {
    id: 'cb1',
    type: 'sensor_module',
    x: 260,
    y: 120,
    rot: 0,
    flip: false,
    label: 'CB_ND',
    props: { sensorType: 'temp', envValue: 40, threshold: 35, triggerCondition: 'above' },
  };
  const relay: ComponentInstance = {
    id: 'rl1',
    type: 'relay_module_1ch',
    x: 440,
    y: 160,
    rot: 0,
    flip: false,
    label: 'RL1',
    props: { ratedCurrent: 10 },
  };
  const load: ComponentInstance = {
    id: 'tai1',
    type: 'lamp_dc',
    x: 620,
    y: 160,
    rot: 0,
    flip: false,
    label: 'Đ1',
    props: { voltage: 5, power: 1 },
  };

  const w1 = makePresetWire('w1', 'src1', 'pos', 'cb1', 'vcc', [{ x: 120, y: 160 }, { x: 160, y: 160 }, { x: 160, y: 95 }, { x: 210, y: 95 }], 'phase');
  const w2 = makePresetWire('w2', 'src1', 'pos', 'rl1', 'vcc', [{ x: 160, y: 160 }, { x: 160, y: 40 }, { x: 390, y: 40 }, { x: 390, y: 110 }], 'phase');
  const w3 = makePresetWire('w3', 'src1', 'pos', 'rl1', 'com', [{ x: 160, y: 160 }, { x: 160, y: 260 }, { x: 490, y: 260 }, { x: 490, y: 210 }], 'phase');
  const w4 = makePresetWire('w4', 'src1', 'neg', 'cb1', 'gnd', [{ x: 120, y: 180 }, { x: 180, y: 180 }, { x: 180, y: 115 }, { x: 210, y: 115 }], 'neutral');
  const w5 = makePresetWire('w5', 'src1', 'neg', 'rl1', 'gnd', [{ x: 180, y: 180 }, { x: 180, y: 280 }, { x: 390, y: 280 }, { x: 390, y: 160 }], 'neutral');
  const w6 = makePresetWire('w6', 'cb1', 'do', 'rl1', 'in', [{ x: 310, y: 95 }, { x: 350, y: 95 }, { x: 350, y: 210 }, { x: 390, y: 210 }], 'phase');
  const w7 = makePresetWire('w7', 'rl1', 'no', 'tai1', '1', [{ x: 490, y: 110 }, { x: 550, y: 110 }, { x: 550, y: 160 }, { x: 580, y: 160 }], 'phase');
  const w8 = makePresetWire('w8', 'tai1', '2', 'src1', 'neg', [{ x: 660, y: 160 }, { x: 680, y: 160 }, { x: 680, y: 300 }, { x: 120, y: 300 }, { x: 120, y: 180 }], 'neutral');

  return { components: [src, sensor, relay, load], wires: [w1, w2, w3, w4, w5, w6, w7, w8], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export function createPresetSensorT(): CircuitState {
  const src: ComponentInstance = { id: 'src1', type: 'dc_source', x: 80, y: 160, rot: 0, flip: false, label: 'E', props: { voltage: 5 } };
  const sensor: ComponentInstance = {
    id: 'cb1',
    type: 'sensor_module',
    x: 260,
    y: 120,
    rot: 0,
    flip: false,
    label: 'CB_GAS',
    props: { sensorType: 'gas', envValue: 200, threshold: 300, triggerCondition: 'above' },
  };
  const relay: ComponentInstance = {
    id: 'rl1',
    type: 'relay_module_1ch',
    x: 440,
    y: 160,
    rot: 0,
    flip: false,
    label: 'RL1',
    props: { ratedCurrent: 10 },
  };
  const bell: ComponentInstance = {
    id: 'c1',
    type: 'electric_bell',
    x: 620,
    y: 160,
    rot: 0,
    flip: false,
    label: 'C1',
    props: { voltage: 5 },
  };

  const w1 = makePresetWire('w1', 'src1', 'pos', 'cb1', 'vcc', [{ x: 120, y: 160 }, { x: 160, y: 160 }, { x: 160, y: 95 }, { x: 210, y: 95 }], 'phase');
  const w2 = makePresetWire('w2', 'src1', 'pos', 'rl1', 'vcc', [{ x: 160, y: 160 }, { x: 160, y: 40 }, { x: 390, y: 40 }, { x: 390, y: 110 }], 'phase');
  const w3 = makePresetWire('w3', 'src1', 'pos', 'rl1', 'com', [{ x: 160, y: 160 }, { x: 160, y: 260 }, { x: 490, y: 260 }, { x: 490, y: 210 }], 'phase');
  const w4 = makePresetWire('w4', 'src1', 'neg', 'cb1', 'gnd', [{ x: 120, y: 180 }, { x: 180, y: 180 }, { x: 180, y: 115 }, { x: 210, y: 115 }], 'neutral');
  const w5 = makePresetWire('w5', 'src1', 'neg', 'rl1', 'gnd', [{ x: 180, y: 180 }, { x: 180, y: 280 }, { x: 390, y: 280 }, { x: 390, y: 160 }], 'neutral');
  const w6 = makePresetWire('w6', 'cb1', 'do', 'rl1', 'in', [{ x: 310, y: 95 }, { x: 350, y: 95 }, { x: 350, y: 210 }, { x: 390, y: 210 }], 'phase');
  const w7 = makePresetWire('w7', 'rl1', 'no', 'c1', '1', [{ x: 490, y: 110 }, { x: 550, y: 110 }, { x: 550, y: 160 }, { x: 580, y: 160 }], 'phase');
  const w8 = makePresetWire('w8', 'c1', '2', 'src1', 'neg', [{ x: 660, y: 160 }, { x: 680, y: 160 }, { x: 680, y: 300 }, { x: 120, y: 300 }, { x: 120, y: 180 }], 'neutral');

  return { components: [src, sensor, relay, bell], wires: [w1, w2, w3, w4, w5, w6, w7, w8], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export function createPresetSensorU(): CircuitState {
  const src: ComponentInstance = { id: 'src1', type: 'dc_source', x: 80, y: 160, rot: 0, flip: false, label: 'E', props: { voltage: 5 } };
  const sensor: ComponentInstance = {
    id: 'cb1',
    type: 'sensor_module',
    x: 260,
    y: 120,
    rot: 0,
    flip: false,
    label: 'CB_PIR',
    props: { sensorType: 'pir', motionDetected: false },
  };
  const timeRelay: ComponentInstance = {
    id: 'rlt1',
    type: 'time_relay',
    x: 440,
    y: 160,
    rot: 0,
    flip: false,
    label: 'RLT1',
    props: { mode: 'off_delay', delayTime: 10 },
  };
  const load: ComponentInstance = {
    id: 'tai1',
    type: 'lamp_dc',
    x: 620,
    y: 160,
    rot: 0,
    flip: false,
    label: 'Đ1',
    props: { voltage: 5, power: 1 },
  };

  const w1 = makePresetWire('w1', 'src1', 'pos', 'cb1', 'vcc', [{ x: 120, y: 160 }, { x: 160, y: 160 }, { x: 160, y: 95 }, { x: 210, y: 95 }], 'phase');
  const w2 = makePresetWire('w2', 'src1', 'pos', 'rlt1', 'vcc', [{ x: 160, y: 160 }, { x: 160, y: 40 }, { x: 390, y: 40 }, { x: 390, y: 110 }], 'phase');
  const w3 = makePresetWire('w3', 'src1', 'pos', 'rlt1', 'com', [{ x: 160, y: 160 }, { x: 160, y: 260 }, { x: 490, y: 260 }, { x: 490, y: 210 }], 'phase');
  const w4 = makePresetWire('w4', 'src1', 'neg', 'cb1', 'gnd', [{ x: 120, y: 180 }, { x: 180, y: 180 }, { x: 180, y: 115 }, { x: 210, y: 115 }], 'neutral');
  const w5 = makePresetWire('w5', 'src1', 'neg', 'rlt1', 'gnd', [{ x: 180, y: 180 }, { x: 180, y: 280 }, { x: 390, y: 280 }, { x: 390, y: 160 }], 'neutral');
  const w6 = makePresetWire('w6', 'cb1', 'do', 'rlt1', 'in', [{ x: 310, y: 95 }, { x: 350, y: 95 }, { x: 350, y: 210 }, { x: 390, y: 210 }], 'phase');
  const w7 = makePresetWire('w7', 'rlt1', 'no', 'tai1', '1', [{ x: 490, y: 110 }, { x: 550, y: 110 }, { x: 550, y: 160 }, { x: 580, y: 160 }], 'phase');
  const w8 = makePresetWire('w8', 'tai1', '2', 'src1', 'neg', [{ x: 660, y: 160 }, { x: 680, y: 160 }, { x: 680, y: 300 }, { x: 120, y: 300 }, { x: 120, y: 180 }], 'neutral');

  return { components: [src, sensor, timeRelay, load], wires: [w1, w2, w3, w4, w5, w6, w7, w8], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export const SENSOR_PRESETS: Preset[] = [
  // --- Nhóm: Cảm biến + rơ le (L8) ---
  {
    id: 'sn_r',
    group: 'Cảm biến + rơ le (L8)',
    grade: 'L8',
    title: 'r) Đèn tự bật khi trời tối (Cảm biến ánh sáng + Rơ le + Đèn nhỏ 5 V)',
    description: 'Trời tối (ánh sáng < ngưỡng 50%): ngõ ra DO lên mức cao (5 V), kích rơ le hút đóng tiếp điểm COM–NO cấp điện cho đèn nhỏ 5 V sáng.',
    expectation: 'Kì vọng: khi tối (ánh sáng < 50%), rơ le hút bật đèn sáng.',
    state: createPresetSensorR(),
  },
  {
    id: 'sn_s',
    group: 'Cảm biến + rơ le (L8)',
    grade: 'L8',
    title: 's) Bật tải khi nóng (Cảm biến nhiệt độ + Rơ le + Tải)',
    description: 'Nhiệt độ môi trường vượt ngưỡng 35 °C: ngõ ra DO lên mức cao, kích rơ le đóng mạch cấp nguồn cho tải hoạt động.',
    expectation: 'Kì vọng: khi nhiệt độ > 35 °C, rơ le đóng mạch cấp điện cho tải hoạt động.',
    state: createPresetSensorS(),
  },

  // --- Nhóm: Nhà thông minh – chiếu sáng (L9) ---
  {
    id: 'sn_u',
    group: 'Nhà thông minh – chiếu sáng (L9)',
    grade: 'L9',
    title: 'u) Đèn hành lang tự tắt sau 10 s (Cảm biến hồng ngoại + Rơ le thời gian)',
    description: 'Phát hiện chuyển động: DO lên cao, rơ le thời gian hút bật đèn ngay. Khi hết chuyển động: rơ le vẫn giữ hút và đếm lùi 10 s rồi mới nhả tắt đèn.',
    expectation: "Kì vọng: bật 'Có chuyển động' thì đèn sáng; tắt chuyển động thì đèn vẫn sáng thêm 10 s rồi tắt.",
    state: createPresetSensorU(),
  },

  // --- Nhóm: Nhà thông minh – an ninh (L9) ---
  {
    id: 'sn_t',
    group: 'Nhà thông minh – an ninh (L9)',
    grade: 'L9',
    title: 't) Báo cháy / rò gas (Cảm biến gas + Rơ le + Chuông điện)',
    description: 'Nồng độ gas vượt ngưỡng 300 ppm: DO lên mức cao (5 V), kích rơ le hút đóng tiếp điểm COM–NO cấp điện cho chuông reo.',
    expectation: 'Kì vọng: kéo nồng độ vượt ngưỡng thì chuông chạy (xanh); giảm xuống thì tắt.',
    state: createPresetSensorT(),
  },
];

// ==========================================
// PRESETS CHO WORKSPACE: ĐIỆN TỬ SỐ (L12)
// ==========================================

// Preset (D1): 2 công tắc -> 1 cổng logic -> LED
export function createPresetLogicD1(): CircuitState {
  const swA: ComponentInstance = { id: 'swA', type: 'logic_switch', x: 100, y: 120, rot: 0, flip: false, label: 'A', props: { state: false, label: 'A' } };
  const swB: ComponentInstance = { id: 'swB', type: 'logic_switch', x: 100, y: 180, rot: 0, flip: false, label: 'B', props: { state: false, label: 'B' } };
  const g1: ComponentInstance = { id: 'g1', type: 'logic_gate', x: 260, y: 150, rot: 0, flip: false, label: 'G1', props: { gateType: 'AND', inputsCount: 2 } };
  const led1: ComponentInstance = { id: 'led1', type: 'logic_led', x: 400, y: 150, rot: 0, flip: false, label: 'Y', props: { color: '#EF4444' } };

  const w1 = makePresetWire('w1', 'swA', 'Q', 'g1', 'A', [{ x: 140, y: 120 }, { x: 180, y: 120 }, { x: 180, y: 130 }, { x: 220, y: 130 }], 'other');
  const w2 = makePresetWire('w2', 'swB', 'Q', 'g1', 'B', [{ x: 140, y: 180 }, { x: 180, y: 180 }, { x: 180, y: 170 }, { x: 220, y: 170 }], 'other');
  const w3 = makePresetWire('w3', 'g1', 'Y', 'led1', 'in', [{ x: 300, y: 150 }, { x: 360, y: 150 }], 'other');

  return { components: [swA, swB, g1, led1], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (D2): Nửa cộng (Half Adder): XOR + AND
export function createPresetLogicD2(): CircuitState {
  const swA: ComponentInstance = { id: 'swA', type: 'logic_switch', x: 80, y: 120, rot: 0, flip: false, label: 'A', props: { state: false, label: 'A' } };
  const swB: ComponentInstance = { id: 'swB', type: 'logic_switch', x: 80, y: 240, rot: 0, flip: false, label: 'B', props: { state: false, label: 'B' } };
  const gXor: ComponentInstance = { id: 'g_xor', type: 'logic_gate', x: 260, y: 120, rot: 0, flip: false, label: 'XOR', props: { gateType: 'XOR', inputsCount: 2 } };
  const gAnd: ComponentInstance = { id: 'g_and', type: 'logic_gate', x: 260, y: 240, rot: 0, flip: false, label: 'AND', props: { gateType: 'AND', inputsCount: 2 } };
  const ledSum: ComponentInstance = { id: 'led_sum', type: 'logic_led', x: 440, y: 120, rot: 0, flip: false, label: 'Tổng (S)', props: { color: '#10B981' } };
  const ledCarry: ComponentInstance = { id: 'led_carry', type: 'logic_led', x: 440, y: 240, rot: 0, flip: false, label: 'Nhớ (C)', props: { color: '#EF4444' } };

  const w1 = makePresetWire('w1', 'swA', 'Q', 'g_xor', 'A', [{ x: 120, y: 120 }, { x: 180, y: 120 }, { x: 180, y: 100 }, { x: 220, y: 100 }], 'other');
  const w2 = makePresetWire('w2', 'swA', 'Q', 'g_and', 'A', [{ x: 120, y: 120 }, { x: 180, y: 120 }, { x: 180, y: 220 }, { x: 220, y: 220 }], 'other');
  const w3 = makePresetWire('w3', 'swB', 'Q', 'g_xor', 'B', [{ x: 120, y: 240 }, { x: 180, y: 240 }, { x: 180, y: 140 }, { x: 220, y: 140 }], 'other');
  const w4 = makePresetWire('w4', 'swB', 'Q', 'g_and', 'B', [{ x: 120, y: 240 }, { x: 180, y: 240 }, { x: 180, y: 260 }, { x: 220, y: 260 }], 'other');
  const w5 = makePresetWire('w5', 'g_xor', 'Y', 'led_sum', 'in', [{ x: 300, y: 120 }, { x: 400, y: 120 }], 'other');
  const w6 = makePresetWire('w6', 'g_and', 'Y', 'led_carry', 'in', [{ x: 300, y: 240 }, { x: 400, y: 240 }], 'other');

  return { components: [swA, swB, gXor, gAnd, ledSum, ledCarry], wires: [w1, w2, w3, w4, w5, w6], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (D3): Bỏ phiếu đa số 3 người (Majority Voting): Y = A·B + B·C + C·A
export function createPresetLogicD3(): CircuitState {
  const swA: ComponentInstance = { id: 'swA', type: 'logic_switch', x: 80, y: 80, rot: 0, flip: false, label: 'A', props: { state: false, label: 'A' } };
  const swB: ComponentInstance = { id: 'swB', type: 'logic_switch', x: 80, y: 180, rot: 0, flip: false, label: 'B', props: { state: false, label: 'B' } };
  const swC: ComponentInstance = { id: 'swC', type: 'logic_switch', x: 80, y: 280, rot: 0, flip: false, label: 'C', props: { state: false, label: 'C' } };

  const gAb: ComponentInstance = { id: 'g_ab', type: 'logic_gate', x: 260, y: 80, rot: 0, flip: false, label: 'A·B', props: { gateType: 'AND', inputsCount: 2 } };
  const gBc: ComponentInstance = { id: 'g_bc', type: 'logic_gate', x: 260, y: 180, rot: 0, flip: false, label: 'B·C', props: { gateType: 'AND', inputsCount: 2 } };
  const gCa: ComponentInstance = { id: 'g_ca', type: 'logic_gate', x: 260, y: 280, rot: 0, flip: false, label: 'C·A', props: { gateType: 'AND', inputsCount: 2 } };

  const gOr: ComponentInstance = { id: 'g_or', type: 'logic_gate', x: 440, y: 180, rot: 0, flip: false, label: 'OR', props: { gateType: 'OR', inputsCount: 3 } };
  const ledOut: ComponentInstance = { id: 'led_out', type: 'logic_led', x: 580, y: 180, rot: 0, flip: false, label: 'Đa số (Y)', props: { color: '#10B981' } };

  const w1 = makePresetWire('w1', 'swA', 'Q', 'g_ab', 'A', [{ x: 120, y: 80 }, { x: 220, y: 60 }], 'other');
  const w2 = makePresetWire('w2', 'swB', 'Q', 'g_ab', 'B', [{ x: 120, y: 180 }, { x: 180, y: 180 }, { x: 180, y: 100 }, { x: 220, y: 100 }], 'other');

  const w3 = makePresetWire('w3', 'swB', 'Q', 'g_bc', 'A', [{ x: 120, y: 180 }, { x: 220, y: 160 }], 'other');
  const w4 = makePresetWire('w4', 'swC', 'Q', 'g_bc', 'B', [{ x: 120, y: 280 }, { x: 180, y: 280 }, { x: 180, y: 200 }, { x: 220, y: 200 }], 'other');

  const w5 = makePresetWire('w5', 'swC', 'Q', 'g_ca', 'A', [{ x: 120, y: 280 }, { x: 220, y: 260 }], 'other');
  const w6 = makePresetWire('w6', 'swA', 'Q', 'g_ca', 'B', [{ x: 120, y: 80 }, { x: 160, y: 80 }, { x: 160, y: 300 }, { x: 220, y: 300 }], 'other');

  const w7 = makePresetWire('w7', 'g_ab', 'Y', 'g_or', 'A', [{ x: 300, y: 80 }, { x: 360, y: 80 }, { x: 360, y: 160 }, { x: 400, y: 160 }], 'other');
  const w8 = makePresetWire('w8', 'g_bc', 'Y', 'g_or', 'B', [{ x: 300, y: 180 }, { x: 400, y: 180 }], 'other');
  const w9 = makePresetWire('w9', 'g_ca', 'Y', 'g_or', 'C', [{ x: 300, y: 280 }, { x: 360, y: 280 }, { x: 360, y: 200 }, { x: 400, y: 200 }], 'other');

  const w10 = makePresetWire('w10', 'g_or', 'Y', 'led_out', 'in', [{ x: 480, y: 180 }, { x: 540, y: 180 }], 'other');

  return { components: [swA, swB, swC, gAb, gBc, gCa, gOr, ledOut], wires: [w1, w2, w3, w4, w5, w6, w7, w8, w9, w10], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

// Preset (D4): Điều khiển bơm an toàn (Nước thấp VÀ KHÔNG quá nhiệt)
export function createPresetLogicD4(): CircuitState {
  const swA: ComponentInstance = { id: 'swA', type: 'logic_switch', x: 80, y: 120, rot: 0, flip: false, label: 'Mực nước thấp (A)', props: { state: false, label: 'A' } };
  const swB: ComponentInstance = { id: 'swB', type: 'logic_switch', x: 80, y: 220, rot: 0, flip: false, label: 'Quá nhiệt (B)', props: { state: false, label: 'B' } };
  const gNot: ComponentInstance = { id: 'g_not', type: 'logic_gate', x: 240, y: 220, rot: 0, flip: false, label: 'NOT', props: { gateType: 'NOT', inputsCount: 1 } };
  const gAnd: ComponentInstance = { id: 'g_and', type: 'logic_gate', x: 380, y: 150, rot: 0, flip: false, label: 'AND', props: { gateType: 'AND', inputsCount: 2 } };
  const ledPump: ComponentInstance = { id: 'led_pump', type: 'logic_led', x: 520, y: 150, rot: 0, flip: false, label: 'Máy bơm', props: { color: '#3B82F6' } };

  const w1 = makePresetWire('w1', 'swB', 'Q', 'g_not', 'A', [{ x: 120, y: 220 }, { x: 200, y: 220 }], 'other');
  const w2 = makePresetWire('w2', 'swA', 'Q', 'g_and', 'A', [{ x: 120, y: 120 }, { x: 300, y: 120 }, { x: 300, y: 130 }, { x: 340, y: 130 }], 'other');
  const w3 = makePresetWire('w3', 'g_not', 'Y', 'g_and', 'B', [{ x: 280, y: 220 }, { x: 320, y: 220 }, { x: 320, y: 170 }, { x: 340, y: 170 }], 'other');
  const w4 = makePresetWire('w4', 'g_and', 'Y', 'led_pump', 'in', [{ x: 420, y: 150 }, { x: 480, y: 150 }], 'other');

  return { components: [swA, swB, gNot, gAnd, ledPump], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
}

export const DIGITAL_LOGIC_PRESETS: Preset[] = [
  // --- Nhóm: Cổng logic cơ bản (L12) ---
  {
    id: 'logic_d1',
    group: 'Cổng logic cơ bản (L12)',
    grade: 'L12',
    title: 'D1) 2 công tắc → 1 cổng (đổi loại trong Thuộc tính) → LED',
    description: 'Khảo sát hoạt động của cổng logic cơ bản với 2 đầu vào điều khiển 1 LED ngõ ra.',
    expectation: 'Kì vọng: LED chỉ sáng khi ngõ ra cổng ở mức 1; thử đổi loại cổng (AND, OR, NAND, NOR, XOR, XNOR) trong bảng Thuộc tính.',
    state: createPresetLogicD1(),
  },

  // --- Nhóm: Mạch tổ hợp (L12) ---
  {
    id: 'logic_d2',
    group: 'Mạch tổ hợp (L12)',
    grade: 'L12',
    title: 'D2) Nửa cộng: XOR + AND, hai LED "Tổng" và "Nhớ"',
    description: 'Mạch cộng 1 bit cơ bản (Half Adder): tính tổng S (qua cổng XOR) và số nhớ C (qua cổng AND).',
    expectation: 'Kì vọng: 0+0=00, 0+1=10, 1+0=10, 1+1=01 (Tổng=0, Nhớ=1).',
    state: createPresetLogicD2(),
  },
  {
    id: 'logic_d3',
    group: 'Mạch tổ hợp (L12)',
    grade: 'L12',
    title: 'D3) Bỏ phiếu đa số 3 người: Y = A·B + B·C + C·A',
    description: 'Mạch ra quyết định theo đa số cho 3 người A, B, C; ngõ ra bằng 1 khi có ít nhất 2 người chọn mức 1.',
    expectation: 'Kì vọng: Bất kì khi nào có ≥ 2 công tắc bật (mức 1), LED Đa số lập tức sáng.',
    state: createPresetLogicD3(),
  },
  {
    id: 'logic_d4',
    group: 'Mạch tổ hợp (L12)',
    grade: 'L12',
    title: 'D4) Điều khiển bơm: bơm (LED) chạy khi mực nước thấp VÀ KHÔNG quá nhiệt',
    description: 'Mạch an toàn bảo vệ động cơ bơm nước: Bơm chỉ chạy khi thiếu nước (A=1) và nhiệt độ an toàn (B=0).',
    expectation: 'Kì vọng: Bơm chạy khi Nước thấp = 1 và Quá nhiệt = 0; nếu Quá nhiệt = 1 thì bơm ngắt ngay lập tức.',
    state: createPresetLogicD4(),
  },
];

