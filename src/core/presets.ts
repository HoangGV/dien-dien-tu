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

export const HOUSEHOLD_PRESETS: Preset[] = [
  {
    id: 'hh_a',
    title: 'a) Nguồn lưới → Aptomat 1P 16A → Ampe kế → Quạt trần 60W',
    description: 'Mạch khép kín đầy đủ dây về O, đo dòng tiêu thụ qua quạt trần 60 W (I ≈ 0.273 A).',
    state: createPresetHouseholdA(),
  },
  {
    id: 'hh_b',
    title: 'b) Mạch (a) có thêm Vôn kế song song quạt',
    description: 'Đo đồng thời điện áp 220 V trên tải bằng Vôn kế và dòng điện qua mạch bằng Ampe kế.',
    state: createPresetHouseholdB(),
  },
  {
    id: 'hh_c',
    title: 'c) Sự cố rò vỏ: Chân PE TẮT, có người chạm vào vỏ',
    description: 'Minh họa sự cố nguy hiểm: điện áp vỏ 217.8 V, dòng qua người 217.8 mA gây nguy hiểm đến tính mạng.',
    state: createPresetHouseholdC(),
  },
  {
    id: 'hh_d',
    title: 'd) Sự cố rò vỏ: Chân PE nối Cọc tiếp địa 4 Ω, có người chạm',
    description: 'Bảo vệ tiếp địa: dòng sự cố đi vào cọc đất, điện áp tiếp xúc giảm từ 218 V xuống 62.7 V.',
    state: createPresetHouseholdD(),
  },
  {
    id: 'hh_e',
    title: 'e) Mạch (d) có thêm Aptomat chống rò (ELCB 30 mA)',
    description: 'Aptomat chống rò phát hiện chênh lệch dòng pha và trung tính (> 30 mA) và nhảy ngắt mạch tức thì.',
    state: createPresetHouseholdE(),
  },
  {
    id: 'hh_j',
    title: 'j) Quá tải: Nguồn lưới 220V → MCB 10A → Tải 3000W',
    description: 'Dòng tải I ≈ 13.6 A vượt quá định mức 10 A. Aptomat tích lũy nhiệt và nhảy sau khoảng 8 s.',
    state: createPresetHouseholdJ(),
  },
  {
    id: 'hh_k',
    title: 'k) Chập mạch: Nối tắt A với O qua MCB 16A',
    description: 'Dòng ngắn mạch cực lớn (vượt quá 5·In), cuộn điện từ của aptomat tác động nhảy tức thì (≤ 20 ms).',
    state: createPresetHouseholdK(),
  },
  {
    id: 'hh_l',
    title: 'l) Chập mạch không có Aptomat: Dây 1.5 mm²',
    description: 'Chập trực tiếp dây pha A và trung tính O không qua thiết bị bảo vệ; dây dẫn bốc khói và cháy đứt.',
    state: createPresetHouseholdL(),
  },
  {
    id: 'hh_m',
    title: 'm) Chọn sai dây dẫn: MCB 20A + Dây 1.0 mm² + Tải 3300W',
    description: 'Tải 15 A vượt quá khả năng chịu tải 10 A của dây 1.0 mm² nhưng nhỏ hơn MCB 20A; dây dẫn cháy trước khi aptomat nhảy!',
    state: createPresetHouseholdM(),
  },
  {
    id: 'hh_n',
    title: 'n) Cầu chì 5A + Tải 2000W (Quá tải)',
    description: 'Dòng tải I ≈ 9.1 A vượt quá định mức cầu chì 5 A; dây chì nóng chảy và đứt sau ~2 s kèm tiếng tạch.',
    state: createPresetHouseholdN(),
  },
  {
    id: 'hh_o',
    title: 'o) Rò vỏ nguy hiểm có ELCB 30mA bảo vệ',
    description: 'Tải bị rò pha ra vỏ khi không có dây PE, người chạm vào vỏ tạo dòng rò đất ~218 mA làm ELCB nhảy ngay.',
    state: createPresetHouseholdO(),
  },
  {
    id: 'hh_p',
    title: 'p) Đo công suất: Oát kế 4 chân + Đèn 60W',
    description: 'Cuộn dòng (I+, I-) nối tiếp với đèn, cuộn áp (U+, U-) nối song song giữa pha và trung tính; oát kế đo đúng 60 W.',
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

export const ELECTRONICS_PRESETS: Preset[] = [
  {
    id: 'el_f',
    title: 'f) Pin 9 V + Điện trở 470 Ω + LED đỏ',
    description: 'Mạch chiếu sáng LED cơ bản có trở hạn dòng (I ≈ 14.6 mA, điện áp LED ≈ 2.0 V).',
    state: createPresetElectronicsF(),
  },
  {
    id: 'el_g',
    title: 'g) LED nối thẳng pin 9 V (không trở hạn dòng)',
    description: 'Mạch báo động quá dòng: dòng điện chạy thẳng qua LED mà không có điện trở cản trở.',
    state: createPresetElectronicsG(),
  },
  {
    id: 'el_h',
    title: 'h) Mạch RC: 1 kΩ + 100 µF + Công tắc',
    description: 'Khảo sát nạp xả tụ điện: công tắc đóng cấp nguồn nạp điện áp 9 V lên tụ.',
    state: createPresetElectronicsH(),
  },
  {
    id: 'el_i',
    title: 'i) Tụ hóa 16 V đấu ngược cực',
    description: 'Cực dương nguồn 9 V đấu vào cực âm (−) của tụ hóa, phát tín hiệu cảnh báo đấu ngược cực.',
    state: createPresetElectronicsI(),
  },
  {
    id: 'el_q',
    title: 'q) Đo điện trở: Ôm kế 2 chân + Cụm 1 kΩ nối tiếp 2 kΩ',
    description: 'Ôm kế bơm dòng thử đo chính xác tổng trở tương đương 3,00 kΩ khi mạch không có nguồn điện.',
    state: createPresetElectronicsQ(),
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
  {
    id: 'sn_r',
    title: 'r) Đèn tự bật khi trời tối (Cảm biến ánh sáng + Rơ le + Đèn nhỏ 5 V)',
    description: 'Trời tối (ánh sáng < ngưỡng 50%): ngõ ra DO lên mức cao (5 V), kích rơ le hút đóng tiếp điểm COM–NO cấp điện cho đèn nhỏ 5 V sáng.',
    state: createPresetSensorR(),
  },
  {
    id: 'sn_s',
    title: 's) Bật tải khi nóng (Cảm biến nhiệt độ + Rơ le + Tải)',
    description: 'Nhiệt độ môi trường vượt ngưỡng 35 °C: ngõ ra DO lên mức cao, kích rơ le đóng mạch cấp nguồn cho tải hoạt động.',
    state: createPresetSensorS(),
  },
  {
    id: 'sn_t',
    title: 't) Báo cháy / rò gas (Cảm biến gas + Rơ le + Chuông điện)',
    description: 'Nồng độ gas vượt ngưỡng 300 ppm: DO lên mức cao (5 V), kích rơ le hút đóng tiếp điểm COM–NO cấp điện cho chuông reo.',
    expectation: 'Kì vọng: kéo nồng độ vượt ngưỡng thì chuông chạy (xanh); giảm xuống thì tắt.',
    state: createPresetSensorT(),
  },
  {
    id: 'sn_u',
    title: 'u) Đèn hành lang tự tắt sau thời gian T (Cảm biến hồng ngoại + Rơ le thời gian + Đèn nhỏ)',
    description: 'Phát hiện chuyển động: DO lên cao, rơ le thời gian hút bật đèn ngay. Khi hết chuyển động: rơ le vẫn giữ hút và đếm lùi 10 s rồi mới nhả tắt đèn.',
    expectation: "Kì vọng: bật 'Có chuyển động' thì đèn sáng; tắt chuyển động thì đèn vẫn sáng thêm 10 s rồi tắt.",
    state: createPresetSensorU(),
  },
];

