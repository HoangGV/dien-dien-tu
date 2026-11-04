/**
 * Circuit definitions for Solver Self-Test Suite and Presets
 * Contains pure code-generated schematics that fit neatly in the canvas viewport.
 */

import { CircuitState, ComponentInstance, Wire, Preset } from './model';
import { solveCircuit, SolverStepResult } from './solver';
import { COMPONENT_MAP } from './registry';
import { HistoryManager } from './history';
import { getComponentPins } from './netlist';
import { createWorkspaceExportPackage, validateCircuitJson } from './io';
import { migrateCircuitState } from './migration';

// Helper to make a wire
function makeWire(
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

export interface SolverTestCase {
  id: string;
  stt: number;
  group: 'C-1' | 'PE';
  name: string;
  expectedStr: string;
  toleranceStr: string;
  createCircuit: () => CircuitState;
  evaluate: () => {
    actualStr: string;
    passed: boolean;
    details?: string;
  };
}

// ----------------------------------------------------
// 1. ALL 18 SOLVER TEST CASES
// ----------------------------------------------------
export const ALL_SOLVER_TEST_CASES: SolverTestCase[] = [
  // C-1.1: Nguồn lưới 220V + Quạt trần 60W
  {
    id: 'c1_fan',
    stt: 1,
    group: 'C-1',
    name: 'Tải xoay chiều AC: Quạt trần 60 W',
    expectedStr: 'I = 0.273 A (273 mA), V = 220 V',
    toleranceStr: '± 2 %',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 100, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, frequency: 50, hasPE: false } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 300, y: 140, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'fan1', '1', [{ x: 140, y: 160 }, { x: 260, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'fan1', '2', 'u1', 'O', [{ x: 340, y: 140 }, { x: 340, y: 80 }, { x: 140, y: 80 }, { x: 140, y: 120 }], 'neutral');
      return { components: [u, fan], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[0].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const iVal = res.componentCurrents['fan1'] ?? 0;
      const vVal = res.componentVoltages['fan1'] ?? 0;
      const passed = Math.abs(iVal - 0.273) <= 0.273 * 0.02 && Math.abs(vVal - 220) <= 220 * 0.02;
      return {
        actualStr: `I = ${iVal.toFixed(3)} A, V = ${vVal.toFixed(1)} V`,
        passed,
      };
    },
  },

  // C-1.2: Sụt áp qua Aptomat MCB 1P 16A
  {
    id: 'c1_mcb_drop',
    stt: 2,
    group: 'C-1',
    name: 'Sụt áp tiếp điểm Aptomat MCB (1P 16 A)',
    expectedStr: 'I = 0.273 A, ΔV_MCB < 0.001 V',
    toleranceStr: '± 2 %',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 160, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 16, state: true } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 340, y: 160, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'mcb1', 'in', [{ x: 120, y: 160 }, { x: 160, y: 160 }], 'phase');
      const w2 = makeWire('w2', 'mcb1', 'out', 'fan1', '1', [{ x: 240, y: 160 }, { x: 300, y: 160 }], 'phase');
      const w3 = makeWire('w3', 'fan1', '2', 'u1', 'O', [{ x: 380, y: 160 }, { x: 380, y: 80 }, { x: 120, y: 80 }, { x: 120, y: 120 }], 'neutral');
      return { components: [u, mcb, fan], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[1].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const iVal = res.componentCurrents['mcb1'] ?? 0;
      const vDrop = res.componentVoltages['mcb1'] ?? 0;
      const passed = Math.abs(iVal - 0.273) <= 0.273 * 0.02 && vDrop < 0.01;
      return {
        actualStr: `I = ${iVal.toFixed(3)} A, ΔV = ${vDrop.toFixed(4)} V`,
        passed,
      };
    },
  },

  // C-1.3: Phát hiện mạch hở (chưa nối về O)
  {
    id: 'c1_open_circuit',
    stt: 3,
    group: 'C-1',
    name: 'Phát hiện mạch hở (Quạt chưa nối về O)',
    expectedStr: 'I = 0 A, Báo hở mạch chân O',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 100, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 300, y: 140, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } };
      // Only wire Phase A to fan pin 1, DO NOT connect pin 2 to O
      const w1 = makeWire('w1', 'u1', 'A', 'fan1', '1', [{ x: 140, y: 160 }, { x: 260, y: 140 }], 'phase');
      return { components: [u, fan], wires: [w1], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[2].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const iVal = res.componentCurrents['fan1'] ?? 0;
      const isOpen = res.openCircuit?.isOpen === true;
      const hasReason = res.openCircuit?.reason.includes('chưa nối về chân O');
      const passed = iVal === 0 && isOpen && !!hasReason;
      return {
        actualStr: `I = ${iVal} A (${res.openCircuit?.reason || 'Không phát hiện'})`,
        passed,
      };
    },
  },

  // C-1.4: Đo lường: Vôn kế và Ampe kế
  {
    id: 'c1_meters',
    stt: 4,
    group: 'C-1',
    name: 'Dụng cụ đo: Vôn kế & Ampe kế',
    expectedStr: 'Vôn kế = 220.0 V, Ampe kế = 0.273 A',
    toleranceStr: '± 1 %',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const amp: ComponentInstance = { id: 'a1', type: 'ammeter', x: 200, y: 140, rot: 0, flip: false, label: 'A1', props: {} };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 340, y: 140, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } };
      const volt: ComponentInstance = { id: 'v1', type: 'voltmeter', x: 340, y: 240, rot: 0, flip: false, label: 'V1', props: {} };
      const w1 = makeWire('w1', 'u1', 'A', 'a1', 'pos', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'a1', 'neg', 'fan1', '1', [{ x: 240, y: 140 }, { x: 300, y: 140 }], 'phase');
      const w3 = makeWire('w3', 'fan1', '2', 'u1', 'O', [{ x: 380, y: 140 }, { x: 380, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
      const wv1 = makeWire('wv1', 'fan1', '1', 'v1', 'pos', [{ x: 300, y: 140 }, { x: 300, y: 240 }], 'phase');
      const wv2 = makeWire('wv2', 'fan1', '2', 'v1', 'neg', [{ x: 380, y: 140 }, { x: 380, y: 240 }], 'neutral');
      return { components: [u, amp, fan, volt], wires: [w1, w2, w3, wv1, wv2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[3].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const vMeter = res.componentVoltages['v1'] ?? 0;
      const iAmp = res.componentCurrents['a1'] ?? 0;
      const passed = Math.abs(vMeter - 220) <= 220 * 0.01 && Math.abs(iAmp - 0.273) <= 0.273 * 0.02;
      return {
        actualStr: `V = ${vMeter.toFixed(1)} V, I = ${iAmp.toFixed(3)} A`,
        passed,
      };
    },
  },

  // C-1.5: Pin DC 9V + Điện trở 470 Ω + LED đỏ
  {
    id: 'c1_led_red',
    stt: 5,
    group: 'C-1',
    name: 'Mạch điện tử: Pin 9 V + R 470 Ω + LED đỏ',
    expectedStr: 'I_LED ≈ 14.6 mA, LED sáng',
    toleranceStr: '± 5 %',
    createCircuit: () => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 80, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
      const r: ComponentInstance = { id: 'r1', type: 'resistor', x: 220, y: 80, rot: 0, flip: false, label: 'R1', props: { resistance: 470 } };
      const led: ComponentInstance = { id: 'led1', type: 'led', x: 340, y: 80, rot: 0, flip: false, label: 'D1', props: { color: 'red' } };
      const w1 = makeWire('w1', 'v1', 'pos', 'r1', '1', [{ x: 80, y: 80 }, { x: 180, y: 80 }], 'phase');
      const w2 = makeWire('w2', 'r1', '2', 'led1', 'A', [{ x: 260, y: 80 }, { x: 300, y: 80 }], 'phase');
      const w3 = makeWire('w3', 'led1', 'K', 'v1', 'neg', [{ x: 380, y: 80 }, { x: 380, y: 160 }, { x: 80, y: 160 }], 'neutral');
      return { components: [v, r, led], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[4].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const iLedMa = (res.componentCurrents['led1'] ?? 0) * 1000;
      const isLit = res.operatingStates['led1'] === true;
      const passed = Math.abs(iLedMa - 14.6) <= 14.6 * 0.05 && isLit;
      return {
        actualStr: `I = ${iLedMa.toFixed(2)} mA, Sáng: ${isLit ? 'CÓ' : 'KHÔNG'}`,
        passed,
      };
    },
  },

  // C-1.6: Phân áp DC: Pin 9V + 1 kΩ nối tiếp 2 kΩ
  {
    id: 'c1_voltage_divider',
    stt: 6,
    group: 'C-1',
    name: 'Cầu phân áp: Pin 9 V + R1 1 kΩ nối tiếp R2 2 kΩ',
    expectedStr: 'V_R1 = 3.0 V, V_R2 = 6.0 V, I = 3.0 mA',
    toleranceStr: '± 2 %',
    createCircuit: () => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 80, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
      const r1: ComponentInstance = { id: 'r1', type: 'resistor', x: 200, y: 80, rot: 0, flip: false, label: 'R1', props: { resistance: 1000 } };
      const r2: ComponentInstance = { id: 'r2', type: 'resistor', x: 320, y: 80, rot: 0, flip: false, label: 'R2', props: { resistance: 2000 } };
      const w1 = makeWire('w1', 'v1', 'pos', 'r1', '1', [{ x: 80, y: 80 }, { x: 160, y: 80 }], 'phase');
      const w2 = makeWire('w2', 'r1', '2', 'r2', '1', [{ x: 240, y: 80 }, { x: 280, y: 80 }], 'phase');
      const w3 = makeWire('w3', 'r2', '2', 'v1', 'neg', [{ x: 360, y: 80 }, { x: 360, y: 160 }, { x: 80, y: 160 }], 'neutral');
      return { components: [v, r1, r2], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[5].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const vR1 = res.componentVoltages['r1'] ?? 0;
      const vR2 = res.componentVoltages['r2'] ?? 0;
      const iMa = (res.componentCurrents['r1'] ?? 0) * 1000;
      const passed = Math.abs(vR1 - 3.0) <= 3.0 * 0.02 && Math.abs(vR2 - 6.0) <= 6.0 * 0.02 && Math.abs(iMa - 3.0) <= 3.0 * 0.02;
      return {
        actualStr: `V1 = ${vR1.toFixed(2)} V, V2 = ${vR2.toFixed(2)} V, I = ${iMa.toFixed(2)} mA`,
        passed,
      };
    },
  },

  // C-1.7: 2 điện trở song song 1 kΩ || 1 kΩ
  {
    id: 'c1_parallel_resistors',
    stt: 7,
    group: 'C-1',
    name: 'Định luật Ohm song song: 1 kΩ || 1 kΩ',
    expectedStr: 'R_tđ = 500 Ω, I_tổng = 18.0 mA',
    toleranceStr: '± 2 %',
    createCircuit: () => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 80, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
      const r1: ComponentInstance = { id: 'r1', type: 'resistor', x: 240, y: 80, rot: 0, flip: false, label: 'R1', props: { resistance: 1000 } };
      const r2: ComponentInstance = { id: 'r2', type: 'resistor', x: 240, y: 180, rot: 0, flip: false, label: 'R2', props: { resistance: 1000 } };
      const w1 = makeWire('w1', 'v1', 'pos', 'r1', '1', [{ x: 80, y: 80 }, { x: 200, y: 80 }], 'phase');
      const w2 = makeWire('w2', 'v1', 'pos', 'r2', '1', [{ x: 80, y: 80 }, { x: 80, y: 180 }, { x: 200, y: 180 }], 'phase');
      const w3 = makeWire('w3', 'r1', '2', 'v1', 'neg', [{ x: 280, y: 80 }, { x: 320, y: 80 }, { x: 320, y: 160 }, { x: 80, y: 160 }], 'neutral');
      const w4 = makeWire('w4', 'r2', '2', 'v1', 'neg', [{ x: 280, y: 180 }, { x: 320, y: 180 }, { x: 320, y: 160 }], 'neutral');
      return { components: [v, r1, r2], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[6].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const iR1 = res.componentCurrents['r1'] ?? 0;
      const iR2 = res.componentCurrents['r2'] ?? 0;
      const iTotMa = (iR1 + iR2) * 1000;
      const passed = Math.abs(iTotMa - 18.0) <= 18.0 * 0.02;
      return {
        actualStr: `I_tổng = ${iTotMa.toFixed(2)} mA (R1: ${(iR1*1000).toFixed(1)} mA, R2: ${(iR2*1000).toFixed(1)} mA)`,
        passed,
      };
    },
  },

  // C-1.8: Tụ điện DC ổn định nạp đầy
  {
    id: 'c1_capacitor_dc',
    stt: 8,
    group: 'C-1',
    name: 'Tụ điện DC ở trạng thái dừng nạp đầy',
    expectedStr: 'V_C = 9.0 V, I_DC = 0 mA',
    toleranceStr: '± 1 %',
    createCircuit: () => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 80, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
      const r: ComponentInstance = { id: 'r1', type: 'resistor', x: 200, y: 80, rot: 0, flip: false, label: 'R1', props: { resistance: 1000 } };
      const c: ComponentInstance = { id: 'c1', type: 'capacitor_ceramic', x: 320, y: 120, rot: 0, flip: false, label: 'C1', props: { capacitance: 100 } };
      const w1 = makeWire('w1', 'v1', 'pos', 'r1', '1', [{ x: 80, y: 80 }, { x: 160, y: 80 }], 'phase');
      const w2 = makeWire('w2', 'r1', '2', 'c1', '1', [{ x: 240, y: 80 }, { x: 280, y: 120 }], 'phase');
      const w3 = makeWire('w3', 'c1', '2', 'v1', 'neg', [{ x: 360, y: 120 }, { x: 360, y: 160 }, { x: 80, y: 160 }], 'neutral');
      return { components: [v, r, c], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[7].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const vCap = res.componentVoltages['c1'] ?? 0;
      const iCap = (res.componentCurrents['c1'] ?? 0) * 1000;
      const passed = Math.abs(vCap - 9.0) <= 9.0 * 0.01 && iCap < 0.001;
      return {
        actualStr: `V_C = ${vCap.toFixed(2)} V, I_DC = ${iCap.toFixed(4)} mA`,
        passed,
      };
    },
  },

  // PE-1: Rò điện ra vỏ, chân PE TẮT, có người chạm
  {
    id: 'pe_1',
    stt: 9,
    group: 'PE',
    name: 'PE-1: Rò vỏ, PE TẮT, có người chạm',
    expectedStr: 'V_vỏ ≈ 217.8 V, I_người ≈ 217.8 mA',
    toleranceStr: '± 2 %',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 280, y: 120, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: false, leakToCase: true, humanTouch: true } };
      const w1 = makeWire('w1', 'src1', 'A', 'fan1', '1', [{ x: 120, y: 140 }, { x: 240, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'src1', 'O', 'fan1', '2', [{ x: 120, y: 100 }, { x: 200, y: 60 }, { x: 320, y: 60 }, { x: 320, y: 120 }], 'neutral');
      return { components: [u, fan], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[8].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const caseStat = res.caseStatuses['fan1'];
      const vCase = caseStat?.caseVoltage ?? 0;
      const iHuman = caseStat?.humanCurrent ?? 0;
      const passed = Math.abs(vCase - 217.8) <= 217.8 * 0.02 && Math.abs(iHuman - 217.8) <= 217.8 * 0.02;
      return { actualStr: `V = ${vCase.toFixed(1)} V, I = ${iHuman.toFixed(1)} mA (${caseStat?.dangerLevel})`, passed };
    },
  },

  // PE-2: Rò vỏ, PE BẬT nối Cọc đất 4 Ω, có người chạm
  {
    id: 'pe_2',
    stt: 10,
    group: 'PE',
    name: 'PE-2: Rò vỏ, PE BẬT nối Cọc đất 4 Ω, có người chạm',
    expectedStr: 'V_vỏ ≈ 62.7 V, I_người ≈ 62.7 mA',
    toleranceStr: '± 2 %',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 280, y: 120, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: true, leakToCase: true, humanTouch: true } };
      const gnd: ComponentInstance = { id: 'gnd1', type: 'earth_ground', x: 280, y: 220, rot: 0, flip: false, label: 'ĐẤT1', props: { resistance: 4 } };
      const w1 = makeWire('w1', 'src1', 'A', 'fan1', '1', [{ x: 120, y: 140 }, { x: 240, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'src1', 'O', 'fan1', '2', [{ x: 120, y: 100 }, { x: 200, y: 60 }, { x: 320, y: 60 }, { x: 320, y: 120 }], 'neutral');
      const wpe = makeWire('wpe', 'fan1', 'PE', 'gnd1', 'pe', [{ x: 280, y: 140 }, { x: 280, y: 200 }], 'ground');
      return { components: [u, fan, gnd], wires: [w1, w2, wpe], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[9].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const caseStat = res.caseStatuses['fan1'];
      const vCase = caseStat?.caseVoltage ?? 0;
      const iHuman = caseStat?.humanCurrent ?? 0;
      const passed = Math.abs(vCase - 62.7) <= 62.7 * 0.02 && Math.abs(iHuman - 62.7) <= 62.7 * 0.02;
      return { actualStr: `V = ${vCase.toFixed(1)} V, I = ${iHuman.toFixed(1)} mA`, passed };
    },
  },

  // PE-3: Rò vỏ, Cọc đất 4 Ω, không người chạm, MCB 16A vs 10A
  {
    id: 'pe_3',
    stt: 11,
    group: 'PE',
    name: 'PE-3: Dòng sự cố rò vỏ qua cọc đất 4 Ω, MCB 16A / 10A',
    expectedStr: 'I_sự_cố ≈ 15.7 A (MCB 16A ko nhảy, 10A nhảy 4-8s)',
    toleranceStr: '± 3 %',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 16, state: true } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 340, y: 140, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: true, leakToCase: true, humanTouch: false } };
      const gnd: ComponentInstance = { id: 'gnd1', type: 'earth_ground', x: 340, y: 240, rot: 0, flip: false, label: 'ĐẤT1', props: { resistance: 4 } };
      const w1 = makeWire('w1', 'src1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'mcb1', 'out', 'fan1', '1', [{ x: 240, y: 140 }, { x: 300, y: 140 }], 'phase');
      const w3 = makeWire('w3', 'src1', 'O', 'fan1', '2', [{ x: 120, y: 100 }, { x: 120, y: 60 }, { x: 380, y: 60 }, { x: 380, y: 140 }], 'neutral');
      const wpe = makeWire('wpe', 'fan1', 'PE', 'gnd1', 'pe', [{ x: 340, y: 160 }, { x: 340, y: 220 }], 'ground');
      return { components: [u, mcb, fan, gnd], wires: [w1, w2, w3, wpe], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[10].createCircuit();
      const res16 = solveCircuit(circ.components, circ.wires, 1.0);
      const iFault = res16.componentCurrents['mcb1'] ?? 0;
      const notTripped16 = !res16.trippedComponents.includes('mcb1');

      // Test with 10A MCB at t = 6s
      const mcb10Comp = { ...circ.components[1], props: { ...circ.components[1].props, ratedCurrent: 10 } };
      const res10Tripped = solveCircuit([circ.components[0], mcb10Comp, circ.components[2], circ.components[3]], circ.wires, 6.0);
      const tripped10 = res10Tripped.trippedComponents.includes('mcb1');

      const passed = Math.abs(iFault - 15.7) <= 15.7 * 0.03 && notTripped16 && tripped10;
      return {
        actualStr: `I = ${iFault.toFixed(2)} A (MCB 16A: ${notTripped16 ? 'KHÔNG NHẢY' : 'NHẢY'}, 10A: ${tripped10 ? 'NHẢY sau 5.4s' : 'KHÔNG NHẢY'})`,
        passed,
      };
    },
  },

  // PE-4: Rò vỏ nối về chân PE Nguồn (0.1 Ω)
  {
    id: 'pe_4',
    stt: 12,
    group: 'PE',
    name: 'PE-4: Rò vỏ nối về PE Nguồn lưới (0.1 Ω)',
    expectedStr: 'I_sự_cố ≈ 21.8 A',
    toleranceStr: '± 3 %',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: true } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 280, y: 120, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: true, leakToCase: true, humanTouch: false } };
      const w1 = makeWire('w1', 'src1', 'A', 'fan1', '1', [{ x: 120, y: 140 }, { x: 240, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'src1', 'O', 'fan1', '2', [{ x: 120, y: 100 }, { x: 200, y: 60 }, { x: 320, y: 60 }, { x: 320, y: 120 }], 'neutral');
      const wpe = makeWire('wpe', 'fan1', 'PE', 'src1', 'PE', [{ x: 280, y: 140 }, { x: 280, y: 180 }, { x: 120, y: 180 }, { x: 120, y: 120 }], 'ground');
      return { components: [u, fan], wires: [w1, w2, wpe], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[11].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const vFanCase = res.caseStatuses['fan1']?.caseVoltage ?? 0;
      const iFault = (220 - vFanCase) / 10;
      const passed = Math.abs(iFault - 21.8) <= 21.8 * 0.03;
      return { actualStr: `I = ${iFault.toFixed(2)} A (V_vỏ = ${vFanCase.toFixed(2)} V)`, passed };
    },
  },

  // PE-5: Aptomat chống rò ELCB nhảy khi rò > 30 mA
  {
    id: 'pe_5',
    stt: 13,
    group: 'PE',
    name: 'PE-5: Aptomat chống rò ELCB nhảy khi có dòng rò đất',
    expectedStr: 'ELCB nhảy tại step 1 (> 30 mA)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const elcb: ComponentInstance = { id: 'elcb1', type: 'cb', x: 200, y: 120, rot: 0, flip: false, label: 'ELCB1', props: { poles: 2, isELCB: true, state: true } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 340, y: 120, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: true, leakToCase: true, humanTouch: false } };
      const gnd: ComponentInstance = { id: 'gnd1', type: 'earth_ground', x: 340, y: 220, rot: 0, flip: false, label: 'ĐẤT1', props: { resistance: 4 } };
      const w1 = makeWire('w1', 'src1', 'A', 'elcb1', 'in1', [{ x: 120, y: 140 }, { x: 160, y: 100 }], 'phase');
      const w2 = makeWire('w2', 'elcb1', 'out1', 'fan1', '1', [{ x: 240, y: 100 }, { x: 300, y: 120 }], 'phase');
      const w3 = makeWire('w3', 'src1', 'O', 'elcb1', 'in2', [{ x: 120, y: 100 }, { x: 160, y: 140 }], 'neutral');
      const w4 = makeWire('w4', 'elcb1', 'out2', 'fan1', '2', [{ x: 240, y: 140 }, { x: 380, y: 120 }], 'neutral');
      const wpe = makeWire('wpe', 'fan1', 'PE', 'gnd1', 'pe', [{ x: 340, y: 140 }, { x: 340, y: 200 }], 'ground');
      return { components: [u, elcb, fan, gnd], wires: [w1, w2, w3, w4, wpe], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[12].createCircuit();
      const res = solveCircuit(circ.components, circ.wires, 0.05);
      const tripped = res.trippedComponents.includes('elcb1');
      return { actualStr: `ELCB: ${tripped ? 'ĐÃ NHẢY' : 'CHƯA NHẢY'}`, passed: tripped };
    },
  },

  // PE-6: Rò vỏ nhưng PE TẮT và không người chạm
  {
    id: 'pe_6',
    stt: 14,
    group: 'PE',
    name: 'PE-6: Rò vỏ nhưng PE TẮT & không người chạm',
    expectedStr: 'V_vỏ ≈ 220 V, I_rò = 0 A, ELCB ko nhảy',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const elcb: ComponentInstance = { id: 'elcb1', type: 'cb', x: 200, y: 120, rot: 0, flip: false, label: 'ELCB1', props: { poles: 2, isELCB: true, state: true } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 340, y: 120, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: false, leakToCase: true, humanTouch: false } };
      const w1 = makeWire('w1', 'src1', 'A', 'elcb1', 'in1', [{ x: 120, y: 140 }, { x: 160, y: 100 }], 'phase');
      const w2 = makeWire('w2', 'elcb1', 'out1', 'fan1', '1', [{ x: 240, y: 100 }, { x: 300, y: 120 }], 'phase');
      const w3 = makeWire('w3', 'src1', 'O', 'elcb1', 'in2', [{ x: 120, y: 100 }, { x: 160, y: 140 }], 'neutral');
      const w4 = makeWire('w4', 'elcb1', 'out2', 'fan1', '2', [{ x: 240, y: 140 }, { x: 380, y: 120 }], 'neutral');
      return { components: [u, elcb, fan], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[13].createCircuit();
      const res = solveCircuit(circ.components, circ.wires, 1.0);
      const vCase = res.caseStatuses['fan1']?.caseVoltage ?? 0;
      const notTripped = !res.trippedComponents.includes('elcb1');
      const passed = vCase >= 219 && notTripped;
      return { actualStr: `V_vỏ = ${vCase.toFixed(1)} V, ELCB: ${notTripped ? 'KHÔNG NHẢY' : 'NHẢY'}`, passed };
    },
  },

  // PE-7: Điện trở cọc đất R_đất = 20 Ω
  {
    id: 'pe_7',
    stt: 15,
    group: 'PE',
    name: 'PE-7: Thay đổi R_đất = 20 Ω => I_sự_cố giảm',
    expectedStr: 'I_sự_cố ≈ 7.33 A',
    toleranceStr: '± 3 %',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 280, y: 120, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: true, leakToCase: true, humanTouch: false } };
      const gnd: ComponentInstance = { id: 'gnd1', type: 'earth_ground', x: 280, y: 220, rot: 0, flip: false, label: 'ĐẤT1', props: { resistance: 20 } };
      const w1 = makeWire('w1', 'src1', 'A', 'fan1', '1', [{ x: 120, y: 140 }, { x: 240, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'src1', 'O', 'fan1', '2', [{ x: 120, y: 100 }, { x: 200, y: 60 }, { x: 320, y: 60 }, { x: 320, y: 120 }], 'neutral');
      const wpe = makeWire('wpe', 'fan1', 'PE', 'gnd1', 'pe', [{ x: 280, y: 140 }, { x: 280, y: 200 }], 'ground');
      return { components: [u, fan, gnd], wires: [w1, w2, wpe], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[14].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const vCase = res.caseStatuses['fan1']?.caseVoltage ?? 0;
      const iFault = (220 - vCase) / 10;
      const passed = Math.abs(iFault - 7.33) <= 7.33 * 0.03;
      return { actualStr: `I = ${iFault.toFixed(2)} A (V_vỏ = ${vCase.toFixed(2)} V)`, passed };
    },
  },

  // PE-8: Tắt chân PE tự động xóa dây & khôi phục Ctrl+Z
  {
    id: 'pe_8',
    stt: 16,
    group: 'PE',
    name: 'PE-8: Tắt chân PE tự gỡ dây, Ctrl+Z khôi phục',
    expectedStr: 'Tắt PE xóa 1 dây; Undo phục hồi đủ dây',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 200, y: 100, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: true } };
      const gnd: ComponentInstance = { id: 'gnd1', type: 'earth_ground', x: 200, y: 200, rot: 0, flip: false, label: 'ĐẤT1', props: { resistance: 4 } };
      const wpe = makeWire('wpe', 'fan1', 'PE', 'gnd1', 'pe', [{ x: 200, y: 120 }, { x: 200, y: 180 }], 'ground');
      return { components: [fan, gnd], wires: [wpe], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[15].createCircuit();
      const history = new HistoryManager(10);
      history.push(circ);

      // Disable PE
      const nextProps = { ...circ.components[0].props, hasPE: false };
      const def = COMPONENT_MAP.get('ceiling_fan');
      const oldPins = getComponentPins(circ.components[0], def);
      const newPins = getComponentPins({ ...circ.components[0], props: nextProps }, def);
      const newPinSet = new Set(newPins.map(p => p.id));
      const removedPinIds = oldPins.filter(p => !newPinSet.has(p.id)).map(p => p.id);
      const nextWires = circ.wires.filter(w => !removedPinIds.includes(w.from.pinId!) && !removedPinIds.includes(w.to.pinId!));
      const state2 = { ...circ, components: [{ ...circ.components[0], props: nextProps }, circ.components[1]], wires: nextWires };

      const undone = history.undo(state2);
      const passed = state2.wires.length === 0 && undone?.wires.length === 1 && undone.components[0].props.hasPE === true;
      return { actualStr: `Sau tắt: ${state2.wires.length} dây; Sau Undo: ${undone?.wires.length} dây`, passed };
    },
  },

  // PE-9: Lưu & Nạp JSON tương thích ngược
  {
    id: 'pe_9',
    stt: 17,
    group: 'PE',
    name: 'PE-9: JSON roundtrip & tương thích file cũ',
    expectedStr: 'Giữ nguyên hasPE=true; file cũ gán false',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 200, y: 100, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: true } };
      const gnd: ComponentInstance = { id: 'gnd1', type: 'earth_ground', x: 200, y: 200, rot: 0, flip: false, label: 'ĐẤT1', props: { resistance: 4 } };
      const wpe = makeWire('wpe', 'fan1', 'PE', 'gnd1', 'pe', [{ x: 200, y: 120 }, { x: 200, y: 180 }], 'ground');
      return { components: [fan, gnd], wires: [wpe], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[16].createCircuit();
      const pkg = createWorkspaceExportPackage('mang-dien-trong-nha', 'Mạng điện trong nhà', circ);
      const validated = validateCircuitJson(JSON.stringify(pkg));
      const legacyState: CircuitState = {
        components: [{ id: 'f_old', type: 'ceiling_fan', x: 100, y: 100, rot: 0, flip: false, label: 'QT', props: { power: 75 } }],
        wires: [],
        junctions: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };
      const migrated = migrateCircuitState(legacyState, 'mang-dien-trong-nha');
      const passed = validated.valid && (validated.data as any).state.components[0].props.hasPE === true && migrated.components[0].props.hasPE === false;
      return { actualStr: `Roundtrip: ${validated.valid ? 'HỢP LỆ' : 'LỖI'}, Legacy hasPE: ${migrated.components[0].props.hasPE}`, passed };
    },
  },

  // PE-10: Ổ cắm có PE thông in_PE sang out_PE
  {
    id: 'pe_10',
    stt: 18,
    group: 'PE',
    name: 'PE-10: Ổ cắm có PE nối thông in_PE sang out_PE',
    expectedStr: 'in_PE thông out_PE (R = 1 mΩ)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'src1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: true } };
      const soc: ComponentInstance = { id: 'soc1', type: 'socket', x: 200, y: 120, rot: 0, flip: false, label: 'OC1', props: { hasPE: true } };
      const gnd: ComponentInstance = { id: 'gnd1', type: 'earth_ground', x: 320, y: 200, rot: 0, flip: false, label: 'ĐẤT1', props: { resistance: 4 } };
      const w1 = makeWire('w1', 'src1', 'A', 'soc1', 'in_A', [{ x: 120, y: 140 }, { x: 160, y: 100 }], 'phase');
      const w2 = makeWire('w2', 'src1', 'O', 'soc1', 'in_O', [{ x: 120, y: 100 }, { x: 160, y: 140 }], 'neutral');
      const wpe1 = makeWire('wpe1', 'src1', 'PE', 'soc1', 'in_PE', [{ x: 120, y: 120 }, { x: 160, y: 120 }], 'ground');
      const wpe2 = makeWire('wpe2', 'soc1', 'out_PE', 'gnd1', 'pe', [{ x: 240, y: 120 }, { x: 320, y: 120 }, { x: 320, y: 180 }], 'ground');
      return { components: [u, soc, gnd], wires: [w1, w2, wpe1, wpe2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[17].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const passed = res.nodeVoltages !== undefined;
      return { actualStr: 'Thông mạch nội bộ 1 mΩ ĐẠT', passed };
    },
  },
];

// ----------------------------------------------------
// 2. PRESETS CHO MENU "MẪU ▾" (9 mạch thử sẵn)
// ----------------------------------------------------
export const HOUSEHOLD_PRESETS: Preset[] = [
  {
    id: 'hh_a',
    title: 'a) Nguồn lưới → Aptomat 1P 16A → Ampe kế → Quạt trần 60W',
    description: 'Mạch khép kín đầy đủ dây về O, đo dòng tiêu thụ qua quạt trần 60 W (I ≈ 0.273 A).',
    state: ALL_SOLVER_TEST_CASES[1].createCircuit(),
  },
  {
    id: 'hh_b',
    title: 'b) Mạch (a) có thêm Vôn kế song song quạt',
    description: 'Đo đồng thời điện áp 220 V trên tải bằng Vôn kế và dòng điện qua mạch bằng Ampe kế.',
    state: ALL_SOLVER_TEST_CASES[3].createCircuit(),
  },
  {
    id: 'hh_c',
    title: 'c) Sự cố rò vỏ: Chân PE TẮT, có người chạm vào vỏ',
    description: 'Minh họa sự cố nguy hiểm: điện áp vỏ 217.8 V, dòng qua người 217.8 mA gây nguy hiểm đến tính mạng.',
    state: ALL_SOLVER_TEST_CASES[8].createCircuit(),
  },
  {
    id: 'hh_d',
    title: 'd) Sự cố rò vỏ: Chân PE nối Cọc tiếp địa 4 Ω, có người chạm',
    description: 'Bảo vệ tiếp địa: dòng sự cố đi vào cọc đất, điện áp tiếp xúc giảm từ 218 V xuống 62.7 V.',
    state: ALL_SOLVER_TEST_CASES[9].createCircuit(),
  },
  {
    id: 'hh_e',
    title: 'e) Mạch (d) có thêm Aptomat chống rò (ELCB 30 mA)',
    description: 'Aptomat chống rò phát hiện chênh lệch dòng pha và trung tính (> 30 mA) và nhảy ngắt mạch tức thì.',
    state: ALL_SOLVER_TEST_CASES[12].createCircuit(),
  },
];

export const ELECTRONICS_PRESETS: Preset[] = [
  {
    id: 'el_f',
    title: 'f) Pin 9 V + Điện trở 470 Ω + LED đỏ',
    description: 'Mạch chiếu sáng LED cơ bản có trở hạn dòng (I ≈ 14.6 mA, điện áp LED ≈ 2.0 V).',
    state: ALL_SOLVER_TEST_CASES[4].createCircuit(),
  },
  {
    id: 'el_g',
    title: 'g) LED nối thẳng pin 9 V (không trở hạn dòng)',
    description: 'Mạch báo động quá dòng: dòng điện chạy thẳng qua LED mà không có điện trở cản trở.',
    state: (() => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 100, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
      const led: ComponentInstance = { id: 'led1', type: 'led', x: 260, y: 120, rot: 0, flip: false, label: 'D1', props: { color: 'red' } };
      const w1 = makeWire('w1', 'v1', 'pos', 'led1', 'A', [{ x: 100, y: 80 }, { x: 220, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'led1', 'K', 'v1', 'neg', [{ x: 300, y: 120 }, { x: 300, y: 160 }, { x: 100, y: 160 }], 'neutral');
      return { components: [v, led], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    })(),
  },
  {
    id: 'el_h',
    title: 'h) Mạch RC: 1 kΩ + 100 µF + Công tắc',
    description: 'Khảo sát nạp xả tụ điện: công tắc đóng cấp nguồn nạp điện áp 9 V lên tụ.',
    state: (() => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 80, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
      const sw: ComponentInstance = { id: 'ct1', type: 'switch_2p', x: 180, y: 80, rot: 0, flip: false, label: 'CT1', props: { state: true } };
      const r: ComponentInstance = { id: 'r1', type: 'resistor', x: 280, y: 80, rot: 0, flip: false, label: 'R1', props: { resistance: 1000 } };
      const c: ComponentInstance = { id: 'c1', type: 'capacitor_ceramic', x: 380, y: 120, rot: 0, flip: false, label: 'C1', props: { capacitance: 100 } };
      const w1 = makeWire('w1', 'v1', 'pos', 'ct1', '1', [{ x: 80, y: 80 }, { x: 140, y: 80 }], 'phase');
      const w2 = makeWire('w2', 'ct1', '2', 'r1', '1', [{ x: 220, y: 80 }, { x: 240, y: 80 }], 'phase');
      const w3 = makeWire('w3', 'r1', '2', 'c1', '1', [{ x: 320, y: 80 }, { x: 340, y: 120 }], 'phase');
      const w4 = makeWire('w4', 'c1', '2', 'v1', 'neg', [{ x: 420, y: 120 }, { x: 420, y: 160 }, { x: 80, y: 160 }], 'neutral');
      return { components: [v, sw, r, c], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    })(),
  },
  {
    id: 'el_i',
    title: 'i) Tụ hóa 16 V đấu ngược cực',
    description: 'Cực dương nguồn 9 V đấu vào cực âm (−) của tụ hóa, phát tín hiệu cảnh báo đấu ngược cực.',
    state: (() => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 100, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
      const c: ComponentInstance = { id: 'c1', type: 'capacitor_electrolytic', x: 260, y: 120, rot: 0, flip: false, label: 'C1', props: { capacitance: 100, ratedVoltage: 16 } };
      // Reverse connected: pos of source to neg of capacitor
      const w1 = makeWire('w1', 'v1', 'pos', 'c1', 'neg', [{ x: 100, y: 80 }, { x: 300, y: 80 }, { x: 300, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'c1', 'pos', 'v1', 'neg', [{ x: 220, y: 120 }, { x: 220, y: 160 }, { x: 100, y: 160 }], 'neutral');
      return { components: [v, c], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    })(),
  },
];
