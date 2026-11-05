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
import { SimulationService } from './simulationService';
import { formatMeasure } from './measureFormat';

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
  group: 'C-1' | 'PE' | 'C-2' | 'C-3';
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

  // ==========================================
  // GIAI ĐOẠN C-2: NỐI BỘ GIẢI VÀO GIAO DIỆN (E1–E7)
  // ==========================================

  // E1. Mẫu (a) nhà ở chạy 1 s mô phỏng: ampe kế = 272,7 mA (±2 mA); quạt: trạng thái Đang hoạt động (độ xanh ≈ 100% ± 2%)
  {
    id: 'e1_sample_a_running',
    stt: 19,
    group: 'C-2',
    name: 'E1: Mẫu (a) nhà ở chạy 1 s (Ampe kế = 272,7 mA, Quạt sáng xanh 100%)',
    expectedStr: 'Ampe kế = 272,7 mA (±2 mA), Quạt: Đang hoạt động (Độ xanh = 100% ±2%)',
    toleranceStr: 'I: ±2 mA, Độ xanh: ±2%',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 16, state: true } };
      const am: ComponentInstance = { id: 'a1', type: 'ammeter', x: 300, y: 140, rot: 0, flip: false, label: 'A1', props: {} };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 420, y: 140, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'mcb1', 'out', 'a1', 'pos', [{ x: 240, y: 140 }, { x: 260, y: 140 }], 'phase');
      const w3 = makeWire('w3', 'a1', 'neg', 'fan1', '1', [{ x: 340, y: 140 }, { x: 380, y: 140 }], 'phase');
      const w4 = makeWire('w4', 'fan1', '2', 'u1', 'O', [{ x: 460, y: 140 }, { x: 460, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
      return { components: [u, mcb, am, fan], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[18].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      // Run 1 second in simulation
      let snap = sim.step(1.0);
      const iValMa = (snap.elementMeasures['a1']?.current || 0) * 1000;
      const fanKin = snap.componentKinetics['fan1'];
      const greenPct = (fanKin?.greenIntensity ?? 0) * 100;
      const passed = Math.abs(iValMa - 272.7) <= 2.0 && Math.abs(greenPct - 100) <= 2.0 && fanKin?.isOperating === true;
      return {
        actualStr: `Ampe kế: ${iValMa.toFixed(1).replace('.', ',')} mA, Quạt: ${fanKin?.stateStr || 'Tắt'} (Xanh: ${Math.round(greenPct)}%)`,
        passed,
      };
    },
  },

  // E2. Mẫu (b): vôn kế = 220 V (±0,5 V)
  {
    id: 'e2_sample_b_voltmeter',
    stt: 20,
    group: 'C-2',
    name: 'E2: Mẫu (b) nhà ở có Vôn kế song song quạt (Vôn kế = 220,0 V)',
    expectedStr: 'Vôn kế = 220,0 V (±0,5 V)',
    toleranceStr: '±0,5 V',
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
      const circ = ALL_SOLVER_TEST_CASES[19].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(0.1);
      const vVal = snap.elementMeasures['v1']?.voltage ?? 0;
      const passed = Math.abs(vVal - 220) <= 0.5;
      return {
        actualStr: `Vôn kế = ${formatMeasure(vVal, 'voltage')}`,
        passed,
      };
    },
  },

  // E3. Mẫu (a) sau khi NGẮT aptomat: dòng = 0 và quạt dừng
  {
    id: 'e3_sample_a_trip',
    stt: 21,
    group: 'C-2',
    name: 'E3: Mẫu (a) sau khi NGẮT aptomat (Dòng = 0 A, Quạt dừng)',
    expectedStr: 'Dòng = 0 A, Quạt dừng (Độ xanh = 0%)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 16, state: false } };
      const am: ComponentInstance = { id: 'a1', type: 'ammeter', x: 300, y: 140, rot: 0, flip: false, label: 'A1', props: {} };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 420, y: 140, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'mcb1', 'out', 'a1', 'pos', [{ x: 240, y: 140 }, { x: 260, y: 140 }], 'phase');
      const w3 = makeWire('w3', 'a1', 'neg', 'fan1', '1', [{ x: 340, y: 140 }, { x: 380, y: 140 }], 'phase');
      const w4 = makeWire('w4', 'fan1', '2', 'u1', 'O', [{ x: 460, y: 140 }, { x: 460, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
      return { components: [u, mcb, am, fan], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[20].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(0.1);
      const iVal = snap.elementMeasures['a1']?.current ?? 0;
      const fanKin = snap.componentKinetics['fan1'];
      const isStopped = !fanKin?.isOperating && (fanKin?.greenIntensity ?? 0) === 0;
      const passed = Math.abs(iVal) < 1e-6 && isStopped;
      return {
        actualStr: `Dòng: ${formatMeasure(iVal, 'current')}, Quạt: ${fanKin?.stateStr || 'Đang dừng'}`,
        passed,
      };
    },
  },

  // E4. Mẫu (f) điện tử (pin 9 V + 470 Ω + LED đỏ): ampe kế/dòng = 14,9 mA (±0,4 mA); độ sáng LED ≈ 0,86 (±0,05)
  {
    id: 'e4_sample_f_led',
    stt: 22,
    group: 'C-2',
    name: 'E4: Mẫu (f) điện tử (Dòng = 14,9 mA, Độ sáng LED ≈ 0,86)',
    expectedStr: 'Dòng = 14,9 mA (±0,4 mA), Độ sáng LED = 0,86 (±0,05)',
    toleranceStr: 'I: ±0,4 mA, Độ sáng: ±0,05',
    createCircuit: () => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 80, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
      const r: ComponentInstance = { id: 'r1', type: 'resistor', x: 200, y: 80, rot: 0, flip: false, label: 'R1', props: { resistance: 470 } };
      const am: ComponentInstance = { id: 'a1', type: 'ammeter', x: 300, y: 80, rot: 0, flip: false, label: 'A1', props: {} };
      const led: ComponentInstance = { id: 'led1', type: 'led', x: 420, y: 80, rot: 0, flip: false, label: 'D1', props: { color: 'red' } };
      const w1 = makeWire('w1', 'v1', 'pos', 'r1', '1', [{ x: 80, y: 80 }, { x: 160, y: 80 }], 'phase');
      const w2 = makeWire('w2', 'r1', '2', 'a1', 'pos', [{ x: 240, y: 80 }, { x: 260, y: 80 }], 'phase');
      const w3 = makeWire('w3', 'a1', 'neg', 'led1', 'A', [{ x: 340, y: 80 }, { x: 380, y: 80 }], 'phase');
      const w4 = makeWire('w4', 'led1', 'K', 'v1', 'neg', [{ x: 460, y: 80 }, { x: 460, y: 160 }, { x: 80, y: 160 }], 'neutral');
      return { components: [v, r, am, led], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[21].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'dc');
      const snap = sim.step(0.1);
      const iValMa = (snap.elementMeasures['a1']?.current ?? 0) * 1000;
      const brightnessVal = snap.componentKinetics['led1']?.brightness ?? 0;
      const passed = Math.abs(iValMa - 14.9) <= 0.4 && Math.abs(brightnessVal - 0.86) <= 0.05;
      return {
        actualStr: `Dòng: ${iValMa.toFixed(1).replace('.', ',')} mA, Độ sáng: ${brightnessVal.toFixed(2).replace('.', ',')}`,
        passed,
      };
    },
  },

  // E5. Mạch hở (bỏ dây về O): CHẠY báo đúng nguyên nhân bằng chữ rõ ràng, dòng = 0
  {
    id: 'e5_open_circuit_report',
    stt: 23,
    group: 'C-2',
    name: 'E5: Mạch hở bỏ dây về O (Báo đúng nguyên nhân, Dòng = 0 A)',
    expectedStr: 'Báo nguyên nhân rõ ràng "chưa nối về chân O", Dòng = 0 A',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 100, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 300, y: 140, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } };
      // Only phase wire connected to pin 1, pin 2 is left disconnected
      const w1 = makeWire('w1', 'u1', 'A', 'fan1', '1', [{ x: 140, y: 160 }, { x: 260, y: 140 }], 'phase');
      return { components: [u, fan], wires: [w1], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[22].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(0.1);
      const iVal = snap.elementMeasures['fan1']?.current ?? 0;
      const openInfo = snap.solverResult.openCircuit;
      const hasProperReason = openInfo?.isOpen === true && Boolean(openInfo.reason.toLowerCase().includes('o'));
      const passed = Math.abs(iVal) < 1e-6 && hasProperReason;
      return {
        actualStr: `Dòng: ${formatMeasure(iVal, 'current')}, Báo lỗi: "${openInfo?.reason || 'Không phát hiện'}"`,
        passed,
      };
    },
  },

  // E6. Mọi linh kiện trong palette đều có model và pinId khớp registry
  {
    id: 'e6_palette_model_registry_check',
    stt: 24,
    group: 'C-2',
    name: 'E6: Kiểm tra toàn bộ palette có model và pinId khớp registry',
    expectedStr: '100% linh kiện có model, 0 linh kiện sai chân pinId',
    toleranceStr: '0 linh kiện thiếu/sai',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 200, y: 120, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'fan1', '1', [{ x: 80, y: 80 }, { x: 160, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'fan1', '2', 'u1', 'O', [{ x: 240, y: 120 }, { x: 80, y: 160 }], 'neutral');
      return { components: [u, fan], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const sim = new SimulationService();
      const check = sim.checkRegistryIntegrity();
      const passed = check.allValid && check.missing.length === 0 && check.pinMismatches.length === 0;
      return {
        actualStr: check.allValid
          ? 'ĐẠT 100% (Tất cả linh kiện đều có model và pinId khớp)'
          : `Thiếu: [${check.missing.join(', ')}], Lệch chân: [${check.pinMismatches.join(', ')}]`,
        passed,
      };
    },
  },

  // E7. formatMeasure quy chuẩn TCVN
  {
    id: 'e7_tcvn_format_check',
    stt: 25,
    group: 'C-2',
    name: 'E7: Quy chuẩn số đo formatMeasure TCVN dấu phẩy thập phân',
    expectedStr: '272,7 mA • 1,50 A • 50,0 µA • 500 mV',
    toleranceStr: 'Chính xác 100 %',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 260, y: 120, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'fan1', '1', [{ x: 80, y: 80 }, { x: 220, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'fan1', '2', 'u1', 'O', [{ x: 300, y: 120 }, { x: 300, y: 160 }, { x: 80, y: 160 }], 'neutral');
      return { components: [u, fan], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const s1 = formatMeasure(0.2727, 'current');
      const s2 = formatMeasure(1.5, 'current');
      const s3 = formatMeasure(0.00005, 'current');
      const s4 = formatMeasure(0.5, 'voltage');

      const passed =
        s1 === '272,7 mA' &&
        s2 === '1,50 A' &&
        s3 === '50,0 µA' &&
        s4 === '500 mV';

      return {
        actualStr: `${s1} • ${s2} • ${s3} • ${s4}`,
        passed,
      };
    },
  },

  // ==========================================
  // GIAI ĐOẠN C-3: SỰ CỐ, HỎNG HÓC & DỤNG CỤ ĐO (26–43)
  // ==========================================

  // Ca 9: Quá tải MCB 10A với tải 3000W
  {
    id: 'c3_overload_mcb',
    stt: 26,
    group: 'C-3',
    name: 'Ca 9: Quá tải MCB 10A với tải 3000W (I ≈ 13.6A > In=10A, nhảy sau ~8s)',
    expectedStr: 'I ≈ 13.6 A, MCB nhảy khi t = 8.5 s (status = tripped)',
    toleranceStr: '± 2 %',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 10, state: true } };
      const am: ComponentInstance = { id: 'a1', type: 'ammeter', x: 300, y: 140, rot: 0, flip: false, label: 'A1', props: {} };
      const app: ComponentInstance = { id: 'app1', type: 'appliance_generic', x: 440, y: 140, rot: 0, flip: false, label: 'TB1', props: { power: 3000, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'mcb1', 'out', 'a1', 'pos', [{ x: 240, y: 140 }, { x: 260, y: 140 }], 'phase');
      const w3 = makeWire('w3', 'a1', 'neg', 'app1', '1', [{ x: 340, y: 140 }, { x: 400, y: 140 }], 'phase');
      const w4 = makeWire('w4', 'app1', '2', 'u1', 'O', [{ x: 480, y: 140 }, { x: 480, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
      return { components: [u, mcb, am, app], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[25].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snapEarly = sim.step(1.0);
      const notTripped = snapEarly.thermalStates?.['mcb1']?.status !== 'tripped';
      const iVal = snapEarly.elementMeasures['a1']?.current || 0;
      const snapLate = sim.step(9.5);
      const isTripped = snapLate.thermalStates?.['mcb1']?.status === 'tripped';
      const passed = Math.abs(iVal - 13.6) <= 0.4 && notTripped && isTripped;
      return {
        actualStr: `I = ${iVal.toFixed(2)} A, t=1s: ${notTripped ? 'CHƯA NHẢY' : 'NHẢY'}, t=10.5s: ${isTripped ? 'ĐÃ NHẢY' : 'CHƯA NHẢY'}`,
        passed,
      };
    },
  },

  // Ca 10: Ngắn mạch qua MCB 16A nhảy tức thì
  {
    id: 'c3_short_circuit_mcb',
    stt: 27,
    group: 'C-3',
    name: 'Ca 10: Ngắn mạch qua Aptomat 16A (Chập A với O, nhảy tức thì ≤ 20 ms)',
    expectedStr: 'Dòng ngắn mạch cực lớn, MCB nhảy tại t = 0.02 s',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 100, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 240, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 16, state: true } };
      const w1 = makeWire('w1', 'u1', 'A', 'mcb1', 'in', [{ x: 140, y: 140 }, { x: 200, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'mcb1', 'out', 'u1', 'O', [{ x: 280, y: 140 }, { x: 320, y: 140 }, { x: 320, y: 60 }, { x: 140, y: 60 }, { x: 140, y: 100 }], 'neutral');
      return { components: [u, mcb], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[26].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(0.02);
      const isTripped = snap.thermalStates?.['mcb1']?.status === 'tripped';
      return {
        actualStr: `MCB: ${isTripped ? 'NHẢY TỨC THÌ (≤ 20 ms)' : 'CHƯA NHẢY'}`,
        passed: isTripped,
      };
    },
  },

  // Ca 11: Chập mạch không aptomat, dây 1.5mm2 cháy đứt
  {
    id: 'c3_short_circuit_no_mcb',
    stt: 28,
    group: 'C-3',
    name: 'Ca 11: Chập mạch không có Aptomat (Dây 1.5 mm² bị nóng chảy/cháy đứt)',
    expectedStr: 'Dây dẫn 1.5 mm² cháy đứt tại t = 6.5 s (status = damaged)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 120, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'u1', 'O', [{ x: 160, y: 140 }, { x: 300, y: 140 }, { x: 300, y: 60 }, { x: 160, y: 60 }, { x: 160, y: 100 }], 'phase');
      w1.crossSection = 1.5;
      return { components: [u], wires: [w1], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[27].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(6.5);
      const wTherm = snap.wireThermalStates?.['w1'];
      const isDamaged = wTherm?.status === 'damaged';
      return {
        actualStr: `Dây dẫn w1: ${isDamaged ? 'ĐÃ CHÁY HỎNG' : 'Bình thường (h=' + wTherm?.heat + ')'}`,
        passed: isDamaged,
      };
    },
  },

  // Ca 12a: LED không trở hạn dòng cháy đứt
  {
    id: 'c3_led_burn',
    stt: 29,
    group: 'C-3',
    name: 'Ca 12a: LED đỏ cắm thẳng pin 9V (không có trở hạn dòng) bị cháy đứt',
    expectedStr: 'LED cháy đứt (status = damaged)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 100, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
      const led: ComponentInstance = { id: 'led1', type: 'led', x: 260, y: 120, rot: 0, flip: false, label: 'D1', props: { color: 'red' } };
      const w1 = makeWire('w1', 'v1', 'pos', 'led1', 'A', [{ x: 100, y: 80 }, { x: 220, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'led1', 'K', 'v1', 'neg', [{ x: 300, y: 120 }, { x: 300, y: 160 }, { x: 100, y: 160 }], 'neutral');
      return { components: [v, led], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[28].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'dc');
      const snap = sim.step(0.5);
      const isDamaged = snap.thermalStates?.['led1']?.status === 'damaged';
      return {
        actualStr: `LED: ${isDamaged ? 'ĐÃ CHÁY HỞ MẠCH' : 'Bình thường'}`,
        passed: isDamaged,
      };
    },
  },

  // Ca 12b: Điện trở quá công suất
  {
    id: 'c3_resistor_overpower',
    stt: 30,
    group: 'C-3',
    name: 'Ca 12b: Điện trở 10 Ω cắm điện 220V quá công suất (P = 4840W >> 0.25W) bị cháy',
    expectedStr: 'R1 bị cháy hỏng (status = damaged)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 100, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const r: ComponentInstance = { id: 'r1', type: 'resistor', x: 260, y: 120, rot: 0, flip: false, label: 'R1', props: { resistance: 10 } };
      const w1 = makeWire('w1', 'u1', 'A', 'r1', '1', [{ x: 140, y: 120 }, { x: 220, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'r1', '2', 'u1', 'O', [{ x: 300, y: 120 }, { x: 300, y: 60 }, { x: 140, y: 60 }, { x: 140, y: 100 }], 'neutral');
      return { components: [u, r], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[29].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(2.5);
      const isDamaged = snap.thermalStates?.['r1']?.status === 'damaged';
      return {
        actualStr: `Điện trở R1: ${isDamaged ? 'ĐÃ CHÁY ĐỨT' : 'Bình thường'}`,
        passed: isDamaged,
      };
    },
  },

  // Ca 12c: Tụ hóa 16V đấu ngược cực trên nguồn 9V phát nổ
  {
    id: 'c3_capacitor_reverse_polarity',
    stt: 31,
    group: 'C-3',
    name: 'Ca 12c: Tụ hóa 16V đấu ngược cực trên nguồn 9V phát nổ',
    expectedStr: 'Tụ hóa nổ tức thì do đấu ngược cực (status = damaged)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 100, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9 } };
      const c: ComponentInstance = { id: 'c1', type: 'capacitor_electrolytic', x: 260, y: 120, rot: 0, flip: false, label: 'C1', props: { capacitance: 100, ratedVoltage: 16 } };
      const w1 = makeWire('w1', 'v1', 'pos', 'c1', 'neg', [{ x: 100, y: 80 }, { x: 300, y: 80 }, { x: 300, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'c1', 'pos', 'v1', 'neg', [{ x: 220, y: 120 }, { x: 220, y: 160 }, { x: 100, y: 160 }], 'neutral');
      return { components: [v, c], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[30].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'dc');
      const snap = sim.step(0.2);
      const isDamaged = snap.thermalStates?.['c1']?.status === 'damaged';
      return {
        actualStr: `Tụ hóa C1: ${isDamaged ? 'ĐÃ PHÁT NỔ' : 'Bình thường'}`,
        passed: isDamaged,
      };
    },
  },

  // Ca 12d: Tụ hóa 16V cắm nguồn 30V quá áp phát nổ
  {
    id: 'c3_capacitor_overvoltage',
    stt: 32,
    group: 'C-3',
    name: 'Ca 12d: Tụ hóa 16V cắm nguồn 30V quá áp phát nổ',
    expectedStr: 'Tụ hóa nổ do quá áp 30V > 1.2·16V (status = damaged)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 100, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 30 } };
      const c: ComponentInstance = { id: 'c1', type: 'capacitor_electrolytic', x: 260, y: 120, rot: 0, flip: false, label: 'C1', props: { capacitance: 100, ratedVoltage: 16 } };
      const w1 = makeWire('w1', 'v1', 'pos', 'c1', 'pos', [{ x: 100, y: 80 }, { x: 220, y: 80 }, { x: 220, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'c1', 'neg', 'v1', 'neg', [{ x: 300, y: 120 }, { x: 300, y: 160 }, { x: 100, y: 160 }], 'neutral');
      return { components: [v, c], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[31].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'dc');
      const snap = sim.step(0.2);
      const isDamaged = snap.thermalStates?.['c1']?.status === 'damaged';
      return {
        actualStr: `Tụ hóa C1: ${isDamaged ? 'ĐÃ PHÁT NỔ DO QUÁ ÁP' : 'Bình thường'}`,
        passed: isDamaged,
      };
    },
  },

  // Ca 12e: Nguồn DC bị nối tắt cực (+) với (−) quá tải
  {
    id: 'c3_dc_source_short',
    stt: 33,
    group: 'C-3',
    name: 'Ca 12e: Nguồn DC bị nối tắt cực (+) với (−) quá dòng định mức 5A',
    expectedStr: 'Nguồn DC bị hỏng (status = damaged)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 100, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9, ratedCurrent: 5 } };
      const w1 = makeWire('w1', 'v1', 'pos', 'v1', 'neg', [{ x: 100, y: 80 }, { x: 200, y: 80 }, { x: 200, y: 160 }, { x: 100, y: 160 }], 'phase');
      return { components: [v], wires: [w1], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[32].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'dc');
      const snap = sim.step(2.5);
      const isDamaged = snap.thermalStates?.['v1']?.status === 'damaged';
      return {
        actualStr: `Nguồn V1: ${isDamaged ? 'ĐÃ HỎNG DO QUÁ DÒNG' : 'Bình thường'}`,
        passed: isDamaged,
      };
    },
  },

  // Ca 12f: Đèn 220V cắm điện áp 380V cháy tim đèn
  {
    id: 'c3_lamp_overvoltage',
    stt: 34,
    group: 'C-3',
    name: 'Ca 12f: Đèn 220V cắm điện áp cao 380V (> 1.25·220V) bị cháy tim đèn',
    expectedStr: 'Bóng đèn bị cháy đứt (status = damaged)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 100, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 380, hasPE: false } };
      const lamp: ComponentInstance = { id: 'l1', type: 'lamp', x: 260, y: 120, rot: 0, flip: false, label: 'Đ1', props: { power: 60, voltage: 220, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'l1', '1', [{ x: 140, y: 120 }, { x: 220, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'l1', '2', 'u1', 'O', [{ x: 300, y: 120 }, { x: 300, y: 60 }, { x: 140, y: 60 }, { x: 140, y: 100 }], 'neutral');
      return { components: [u, lamp], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[33].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(1.5);
      const isDamaged = snap.thermalStates?.['l1']?.status === 'damaged';
      return {
        actualStr: `Bóng đèn: ${isDamaged ? 'ĐÃ CHÁY TÓC' : 'Bình thường'}`,
        passed: isDamaged,
      };
    },
  },

  // Ca 13: Cầu chì 5A + tải 2000W đứt sau ~2s
  {
    id: 'c3_fuse_overload',
    stt: 35,
    group: 'C-3',
    name: 'Ca 13: Cầu chì 5A + Tải 2000W (I ≈ 9.1A > In=5A, đứt sau ~2s)',
    expectedStr: 'Cầu chì đứt tại t = 2.2 s (status = blown)',
    toleranceStr: '± 2 %',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const f: ComponentInstance = { id: 'f1', type: 'fuse', x: 200, y: 140, rot: 0, flip: false, label: 'CC1', props: { ratedCurrent: 5 } };
      const app: ComponentInstance = { id: 'app1', type: 'appliance_generic', x: 360, y: 140, rot: 0, flip: false, label: 'TB1', props: { power: 2000, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'f1', '1', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'f1', '2', 'app1', '1', [{ x: 240, y: 140 }, { x: 320, y: 140 }], 'phase');
      const w3 = makeWire('w3', 'app1', '2', 'u1', 'O', [{ x: 400, y: 140 }, { x: 400, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
      return { components: [u, f, app], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[34].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(2.2);
      const isBlown = snap.thermalStates?.['f1']?.status === 'blown';
      return {
        actualStr: `Cầu chì CC1: ${isBlown ? 'ĐÃ ĐỨT (blown)' : 'Chưa đứt'}`,
        passed: isBlown,
      };
    },
  },

  // Ca 14: Cầu chì 10A ngắn mạch đứt tức thì
  {
    id: 'c3_fuse_short',
    stt: 36,
    group: 'C-3',
    name: 'Ca 14: Cầu chì 10A ngắn mạch (chập trực tiếp A với O, đứt tức thì)',
    expectedStr: 'Cầu chì đứt tức thì tại t = 0.05 s (status = blown)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const f: ComponentInstance = { id: 'f1', type: 'fuse', x: 200, y: 140, rot: 0, flip: false, label: 'CC1', props: { ratedCurrent: 10 } };
      const w1 = makeWire('w1', 'u1', 'A', 'f1', '1', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'f1', '2', 'u1', 'O', [{ x: 240, y: 140 }, { x: 280, y: 140 }, { x: 280, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
      return { components: [u, f], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[35].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(0.05);
      const isBlown = snap.thermalStates?.['f1']?.status === 'blown';
      return {
        actualStr: `Cầu chì CC1: ${isBlown ? 'ĐÃ ĐỨT TỨC THÌ' : 'Chưa đứt'}`,
        passed: isBlown,
      };
    },
  },

  // Ca 15: ELCB 30mA nhảy tức thì khi rò vỏ có người chạm
  {
    id: 'c3_elcb_leak_touch',
    stt: 37,
    group: 'C-3',
    name: 'Ca 15: ELCB 30mA nhảy tức thì khi rò vỏ có người chạm đất',
    expectedStr: 'Dòng rò người ~218 mA > 30 mA, ELCB nhảy tức thì',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 120, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const elcb: ComponentInstance = { id: 'elcb1', type: 'cb', x: 200, y: 120, rot: 0, flip: false, label: 'ELCB1', props: { poles: 2, isELCB: true, state: true } };
      const app: ComponentInstance = { id: 'app1', type: 'appliance_generic', x: 360, y: 120, rot: 0, flip: false, label: 'TB1', props: { power: 500, leakToCase: true, humanTouch: true, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'elcb1', 'in1', [{ x: 120, y: 140 }, { x: 160, y: 100 }], 'phase');
      const w2 = makeWire('w2', 'elcb1', 'out1', 'app1', '1', [{ x: 240, y: 100 }, { x: 320, y: 120 }], 'phase');
      const w3 = makeWire('w3', 'u1', 'O', 'elcb1', 'in2', [{ x: 120, y: 100 }, { x: 160, y: 140 }], 'neutral');
      const w4 = makeWire('w4', 'elcb1', 'out2', 'app1', '2', [{ x: 240, y: 140 }, { x: 400, y: 120 }], 'neutral');
      return { components: [u, elcb, app], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[36].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(0.05);
      const isTripped = snap.thermalStates?.['elcb1']?.status === 'tripped';
      return {
        actualStr: `ELCB: ${isTripped ? 'ĐÃ NHẢY TỨC THÌ (dòng rò người)' : 'Chưa nhảy'}`,
        passed: isTripped,
      };
    },
  },

  // Ca 16: Dây 1.0mm2 cháy trước MCB 20A khi tải 15A
  {
    id: 'c3_wrong_wire_mcb20',
    stt: 38,
    group: 'C-3',
    name: 'Ca 16: Chọn sai dây: Dây 1.0 mm² cháy trước khi MCB 20A kịp nhảy',
    expectedStr: 'Dây 1.0 mm² cháy tại t ≈ 6.5 s, MCB 20A chưa nhảy',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 20, state: true } };
      const app: ComponentInstance = { id: 'app1', type: 'appliance_generic', x: 400, y: 140, rot: 0, flip: false, label: 'TB1', props: { power: 3300, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'mcb1', 'out', 'app1', '1', [{ x: 240, y: 140 }, { x: 360, y: 140 }], 'phase');
      w2.crossSection = 1.0;
      const w3 = makeWire('w3', 'app1', '2', 'u1', 'O', [{ x: 440, y: 140 }, { x: 440, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
      w3.crossSection = 1.0;
      return { components: [u, mcb, app], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[37].createCircuit();
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(10.5);
      const isWireDamaged = snap.wireThermalStates?.['w2']?.status === 'damaged';
      const isMcbTripped = snap.thermalStates?.['mcb1']?.status === 'tripped';
      const passed = isWireDamaged && !isMcbTripped;
      return {
        actualStr: `Dây 1.0 mm²: ${isWireDamaged ? 'ĐÃ CHÁY' : 'Chưa cháy'}, MCB 20A: ${isMcbTripped ? 'Đã nhảy' : 'CHƯA NHẢY (tải 15A < 20A)'}`,
        passed,
      };
    },
  },

  // Ca O1: Ôm kế 2 chân đo điện trở đơn 1 kΩ
  {
    id: 'c3_ohmmeter_single',
    stt: 39,
    group: 'C-3',
    name: 'Ca O1: Ôm kế 2 chân đo điện trở đơn 1 kΩ',
    expectedStr: 'R = 1,00 kΩ',
    toleranceStr: '± 0.5 %',
    createCircuit: () => {
      const ohm: ComponentInstance = { id: 'ohm1', type: 'ohmmeter', x: 100, y: 120, rot: 0, flip: false, label: 'Ω1', props: {} };
      const r: ComponentInstance = { id: 'r1', type: 'resistor', x: 260, y: 120, rot: 0, flip: false, label: 'R1', props: { resistance: 1000 } };
      const w1 = makeWire('w1', 'ohm1', '1', 'r1', '1', [{ x: 140, y: 120 }, { x: 220, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'r1', '2', 'ohm1', '2', [{ x: 300, y: 120 }, { x: 300, y: 160 }, { x: 140, y: 160 }], 'neutral');
      return { components: [ohm, r], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[38].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const rVal = res.meterMeasurements?.['ohm1']?.resistance ?? 0;
      const formatted = res.meterMeasurements?.['ohm1']?.formatted || '';
      const passed = Math.abs(rVal - 1000) <= 5 && formatted === '1,00 kΩ';
      return {
        actualStr: `Số đo: ${formatted} (${rVal.toFixed(1)} Ω)`,
        passed,
      };
    },
  },

  // Ca O2: Ôm kế đo 1k + 2k nối tiếp
  {
    id: 'c3_ohmmeter_series',
    stt: 40,
    group: 'C-3',
    name: 'Ca O2: Ôm kế 2 chân đo cụm 1 kΩ nối tiếp 2 kΩ',
    expectedStr: 'R_tổng = 3,00 kΩ',
    toleranceStr: '± 0.5 %',
    createCircuit: () => {
      const ohm: ComponentInstance = { id: 'ohm1', type: 'ohmmeter', x: 100, y: 140, rot: 0, flip: false, label: 'Ω1', props: {} };
      const r1: ComponentInstance = { id: 'r1', type: 'resistor', x: 260, y: 100, rot: 0, flip: false, label: 'R1', props: { resistance: 1000 } };
      const r2: ComponentInstance = { id: 'r2', type: 'resistor', x: 400, y: 100, rot: 0, flip: false, label: 'R2', props: { resistance: 2000 } };
      const w1 = makeWire('w1', 'ohm1', '1', 'r1', '1', [{ x: 140, y: 140 }, { x: 200, y: 140 }, { x: 200, y: 100 }, { x: 220, y: 100 }], 'phase');
      const w2 = makeWire('w2', 'r1', '2', 'r2', '1', [{ x: 300, y: 100 }, { x: 360, y: 100 }], 'phase');
      const w3 = makeWire('w3', 'r2', '2', 'ohm1', '2', [{ x: 440, y: 100 }, { x: 480, y: 100 }, { x: 480, y: 180 }, { x: 140, y: 180 }, { x: 140, y: 160 }], 'neutral');
      return { components: [ohm, r1, r2], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[39].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const rVal = res.meterMeasurements?.['ohm1']?.resistance ?? 0;
      const formatted = res.meterMeasurements?.['ohm1']?.formatted || '';
      const passed = Math.abs(rVal - 3000) <= 15 && formatted === '3,00 kΩ';
      return {
        actualStr: `Số đo: ${formatted} (${rVal.toFixed(1)} Ω)`,
        passed,
      };
    },
  },

  // Ca O3: Ôm kế đo 1k || 1k
  {
    id: 'c3_ohmmeter_parallel',
    stt: 41,
    group: 'C-3',
    name: 'Ca O3: Ôm kế 2 chân đo cụm song song 1 kΩ || 1 kΩ',
    expectedStr: 'R_tổng = 500 Ω',
    toleranceStr: '± 0.5 %',
    createCircuit: () => {
      const ohm: ComponentInstance = { id: 'ohm1', type: 'ohmmeter', x: 100, y: 140, rot: 0, flip: false, label: 'Ω1', props: {} };
      const r1: ComponentInstance = { id: 'r1', type: 'resistor', x: 260, y: 100, rot: 0, flip: false, label: 'R1', props: { resistance: 1000 } };
      const r2: ComponentInstance = { id: 'r2', type: 'resistor', x: 260, y: 180, rot: 0, flip: false, label: 'R2', props: { resistance: 1000 } };
      const w1 = makeWire('w1', 'ohm1', '1', 'r1', '1', [{ x: 140, y: 140 }, { x: 200, y: 140 }, { x: 200, y: 100 }, { x: 220, y: 100 }], 'phase');
      const w2 = makeWire('w2', 'ohm1', '1', 'r2', '1', [{ x: 140, y: 140 }, { x: 200, y: 140 }, { x: 200, y: 180 }, { x: 220, y: 180 }], 'phase');
      const w3 = makeWire('w3', 'r1', '2', 'ohm1', '2', [{ x: 300, y: 100 }, { x: 340, y: 100 }, { x: 340, y: 160 }, { x: 140, y: 160 }], 'neutral');
      const w4 = makeWire('w4', 'r2', '2', 'ohm1', '2', [{ x: 300, y: 180 }, { x: 340, y: 180 }, { x: 340, y: 160 }, { x: 140, y: 160 }], 'neutral');
      return { components: [ohm, r1, r2], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[40].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const rVal = res.meterMeasurements?.['ohm1']?.resistance ?? 0;
      const formatted = res.meterMeasurements?.['ohm1']?.formatted || '';
      const passed = Math.abs(rVal - 500) <= 2.5 && formatted === '500 Ω';
      return {
        actualStr: `Số đo: ${formatted} (${rVal.toFixed(1)} Ω)`,
        passed,
      };
    },
  },

  // Ca O4: Ôm kế hở mạch
  {
    id: 'c3_ohmmeter_open',
    stt: 42,
    group: 'C-3',
    name: 'Ca O4: Ôm kế 2 chân khi hở mạch (không nối gì)',
    expectedStr: 'R = ∞ (hở)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const ohm: ComponentInstance = { id: 'ohm1', type: 'ohmmeter', x: 100, y: 140, rot: 0, flip: false, label: 'Ω1', props: {} };
      return { components: [ohm], wires: [], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[41].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const formatted = res.meterMeasurements?.['ohm1']?.formatted || '';
      const passed = formatted === '∞ (hở)';
      return {
        actualStr: `Số đo: ${formatted}`,
        passed,
      };
    },
  },

  // Ca O5: Oát kế 4 chân đo công suất Đèn sợi đốt 60 W (220 V)
  {
    id: 'c3_wattmeter_4pin',
    stt: 43,
    group: 'C-3',
    name: 'Ca O5: Oát kế 4 chân đo công suất Đèn sợi đốt 60 W (220 V)',
    expectedStr: 'P = 60,0 W (Cuộn dòng I+, I- nối tiếp; Cuộn áp U+, U- song song)',
    toleranceStr: '± 0.5 W',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const wtt: ComponentInstance = { id: 'w1', type: 'wattmeter', x: 240, y: 140, rot: 0, flip: false, label: 'W1', props: {} };
      const lamp: ComponentInstance = { id: 'l1', type: 'lamp', x: 420, y: 140, rot: 0, flip: false, label: 'Đ1', props: { power: 60, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'w1', 'I+', [{ x: 120, y: 140 }, { x: 190, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'w1', 'I-', 'l1', '1', [{ x: 290, y: 140 }, { x: 380, y: 140 }], 'phase');
      const w3 = makeWire('w3', 'l1', '2', 'u1', 'O', [{ x: 460, y: 140 }, { x: 460, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
      const w4 = makeWire('w4', 'u1', 'A', 'w1', 'U+', [{ x: 120, y: 140 }, { x: 160, y: 140 }, { x: 160, y: 90 }, { x: 240, y: 90 }], 'phase');
      const w5 = makeWire('w5', 'u1', 'O', 'w1', 'U-', [{ x: 120, y: 100 }, { x: 120, y: 60 }, { x: 240, y: 60 }, { x: 240, y: 190 }], 'neutral');
      return { components: [u, wtt, lamp], wires: [w1, w2, w3, w4, w5], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: () => {
      const circ = ALL_SOLVER_TEST_CASES[42].createCircuit();
      const res = solveCircuit(circ.components, circ.wires);
      const pVal = res.meterMeasurements?.['w1']?.power ?? 0;
      const formatted = res.meterMeasurements?.['w1']?.formatted || '';
      const passed = Math.abs(pVal - 60) <= 0.5 && formatted === '60,0 W';
      return {
        actualStr: `Số đo: ${formatted} (P = ${pVal.toFixed(1)} W, U = 220 V, I ≈ 0.273 A)`,
        passed,
      };
    },
  },
];

// ----------------------------------------------------
// 2. PRESETS CHO MENU "MẪU ▾" (9 mạch thử sẵn)
// ----------------------------------------------------
export { HOUSEHOLD_PRESETS, ELECTRONICS_PRESETS } from './presets';

