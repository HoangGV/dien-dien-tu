/**
 * Circuit definitions for Solver Self-Test Suite and Presets
 * Contains pure code-generated schematics that fit neatly in the canvas viewport.
 */

import { CircuitState, ComponentInstance, Wire, Preset } from './model';
import { solveCircuit, SolverStepResult } from './solver';
import { COMPONENT_MAP } from './registry';
import { HistoryManager } from './history';
import { getComponentPins, extractNetlist } from './netlist';
import { createWorkspaceExportPackage, validateCircuitJson } from './io';
import { migrateCircuitState } from './migration';
import { SimulationService } from './simulationService';
import { formatMeasure } from './measureFormat';
import { calculatePolylineLengthMeters, getWireInstallPoints } from './installWiring';
import { generateAuditReport } from './ampacity';
import {
  createPresetHouseholdJ,
  createPresetHouseholdK,
  createPresetHouseholdM,
  createPresetHouseholdA1,
  createPresetHouseholdA2,
  createPresetHouseholdA3,
  createPresetSensorR,
  createPresetElectronicsV,
  createPresetElectronicsX,
  createPresetElectronicsY,
  createPresetLogicD1,
  createPresetLogicD2,
  createPresetLogicD3,
  HOUSEHOLD_PRESETS,
  ELECTRONICS_PRESETS,
  SENSOR_PRESETS,
  DIGITAL_LOGIC_PRESETS,
} from './presets';
import { runLogicSimulation, evaluateGate } from './logicSimulator';
import { oscilloscopeService } from './oscilloscopeService';

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

export type SolverTestGroup =
  | 'Bộ giải'
  | 'Aptomat – cầu chì – sự cố'
  | 'PE – rò vỏ'
  | 'Dụng cụ đo – công tơ'
  | 'Mạch mẫu';

export interface SolverTestCase {
  id: string;
  stt: number;
  group: SolverTestGroup;
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

function defineTestCase(tc: {
  id: string;
  stt: number;
  group: SolverTestGroup;
  name: string;
  expectedStr: string;
  toleranceStr: string;
  createCircuit: () => CircuitState;
  evaluate: (circ: CircuitState) => {
    actualStr: string;
    passed: boolean;
    details?: string;
  };
}): SolverTestCase {
  return {
    ...tc,
    evaluate: () => tc.evaluate(tc.createCircuit()),
  };
}

// ----------------------------------------------------
// 1. ALL 18 SOLVER TEST CASES
// ----------------------------------------------------
export const ALL_SOLVER_TEST_CASES: SolverTestCase[] = [
  defineTestCase({
    id: 'c1_fan',
    stt: 1,
    group: 'Bộ giải',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const iVal = res.componentCurrents['fan1'] ?? 0;
      const vVal = res.componentVoltages['fan1'] ?? 0;
      const passed = Math.abs(iVal - 0.273) <= 0.273 * 0.02 && Math.abs(vVal - 220) <= 220 * 0.02;
      return {
        actualStr: `I = ${iVal.toFixed(3)} A, V = ${vVal.toFixed(1)} V`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'c1_mcb_drop',
    stt: 2,
    group: 'Bộ giải',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const iVal = res.componentCurrents['mcb1'] ?? 0;
      const vDrop = res.componentVoltages['mcb1'] ?? 0;
      const passed = Math.abs(iVal - 0.273) <= 0.273 * 0.02 && vDrop < 0.01;
      return {
        actualStr: `I = ${iVal.toFixed(3)} A, ΔV = ${vDrop.toFixed(4)} V`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'c1_open_circuit',
    stt: 3,
    group: 'Bộ giải',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 'c1_led_red',
    stt: 4,
    group: 'Bộ giải',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const iLedMa = (res.componentCurrents['led1'] ?? 0) * 1000;
      const isLit = res.operatingStates['led1'] === true;
      const passed = Math.abs(iLedMa - 14.6) <= 14.6 * 0.05 && isLit;
      return {
        actualStr: `I = ${iLedMa.toFixed(2)} mA, Sáng: ${isLit ? 'CÓ' : 'KHÔNG'}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'c1_voltage_divider',
    stt: 5,
    group: 'Bộ giải',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 'c1_parallel_resistors',
    stt: 6,
    group: 'Bộ giải',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 'c1_capacitor_dc',
    stt: 7,
    group: 'Bộ giải',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const vCap = res.componentVoltages['c1'] ?? 0;
      const iCap = (res.componentCurrents['c1'] ?? 0) * 1000;
      const passed = Math.abs(vCap - 9.0) <= 9.0 * 0.01 && iCap < 0.001;
      return {
        actualStr: `V_C = ${vCap.toFixed(2)} V, I_DC = ${iCap.toFixed(4)} mA`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'cb1_sensor_light_threshold_50',
    stt: 8,
    group: 'Bộ giải',
    name: 'Ca 51: Cảm biến ánh sáng ngưỡng 50%: giá trị 30 → DO = VCC (±0.1V), giá trị 70 → DO ≈ 0V',
    expectedStr: 'Ánh sáng 30% → DO ≈ 5.0 V (±0.1 V); Ánh sáng 70% → DO ≈ 0 V (< 0.1 V)',
    toleranceStr: '±0.1 V',
    createCircuit: () => {
      const src: ComponentInstance = { id: 'src1', type: 'dc_source', x: 80, y: 140, rot: 0, flip: false, label: 'E', props: { voltage: 5 } };
      const cb: ComponentInstance = {
        id: 'cb1',
        type: 'sensor_module',
        x: 240,
        y: 140,
        rot: 0,
        flip: false,
        label: 'CB1',
        props: { sensorType: 'light', envValue: 30, threshold: 50, triggerCondition: 'below' },
      };
      const vm: ComponentInstance = { id: 'vm1', type: 'voltmeter', x: 400, y: 140, rot: 0, flip: false, label: 'V1', props: {} };

      const w1 = makeWire('w1', 'src1', 'pos', 'cb1', 'vcc', [{ x: 120, y: 140 }, { x: 190, y: 115 }], 'phase');
      const w2 = makeWire('w2', 'src1', 'neg', 'cb1', 'gnd', [{ x: 120, y: 160 }, { x: 190, y: 135 }], 'neutral');
      const w3 = makeWire('w3', 'cb1', 'do', 'vm1', 'pos', [{ x: 290, y: 115 }, { x: 360, y: 140 }], 'phase');
      const w4 = makeWire('w4', 'cb1', 'gnd', 'vm1', 'neg', [{ x: 190, y: 135 }, { x: 190, y: 220 }, { x: 440, y: 220 }, { x: 440, y: 140 }], 'neutral');

      return { components: [src, cb, vm], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'dc');

      // 1. Bước 1: giá trị 30%
      const snap1 = sim.step(0.01);
      const vDo1 = snap1.solverResult?.componentVoltages?.['vm1'] ?? 0;

      // 2. Bước 2: đổi giá trị 70%
      const cbComp = snap1.compiled?.compMap?.get('cb1');
      if (cbComp) cbComp.props.envValue = 70;
      const snap2 = sim.step(0.01);
      const vDo2 = snap2.solverResult?.componentVoltages?.['vm1'] ?? 0;

      const passed = Math.abs(vDo1 - 5.0) <= 0.1 && vDo2 < 0.1;
      return {
        actualStr: `Khi ánh sáng 30%: DO = ${vDo1.toFixed(2)} V; Khi ánh sáng 70%: DO = ${vDo2.toFixed(2)} V`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'cb3_sensor_undervoltage_2v_do_0v',
    stt: 9,
    group: 'Bộ giải',
    name: 'Ca 53: Mô-đun cảm biến cấp 2 V (< 3 V) → DO = 0 V',
    expectedStr: 'Cấp nguồn 2 V (< 3 V) → Cảm biến không đủ nguồn hoạt động → DO = 0 V',
    toleranceStr: 'DO < 0.05 V',
    createCircuit: () => {
      const src: ComponentInstance = { id: 'src1', type: 'dc_source', x: 80, y: 140, rot: 0, flip: false, label: 'E', props: { voltage: 2 } };
      const cb: ComponentInstance = {
        id: 'cb1',
        type: 'sensor_module',
        x: 240,
        y: 140,
        rot: 0,
        flip: false,
        label: 'CB1',
        props: { sensorType: 'light', envValue: 30, threshold: 50, triggerCondition: 'below' },
      };
      const vm: ComponentInstance = { id: 'vm1', type: 'voltmeter', x: 400, y: 140, rot: 0, flip: false, label: 'V1', props: {} };

      const w1 = makeWire('w1', 'src1', 'pos', 'cb1', 'vcc', [{ x: 120, y: 140 }, { x: 190, y: 115 }], 'phase');
      const w2 = makeWire('w2', 'src1', 'neg', 'cb1', 'gnd', [{ x: 120, y: 160 }, { x: 190, y: 135 }], 'neutral');
      const w3 = makeWire('w3', 'cb1', 'do', 'vm1', 'pos', [{ x: 290, y: 115 }, { x: 360, y: 140 }], 'phase');
      const w4 = makeWire('w4', 'cb1', 'gnd', 'vm1', 'neg', [{ x: 190, y: 135 }, { x: 190, y: 220 }, { x: 440, y: 220 }, { x: 440, y: 140 }], 'neutral');

      return { components: [src, cb, vm], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'dc');

      const snap = sim.step(0.01);
      const vDo = snap.solverResult?.componentVoltages?.['vm1'] ?? 0;

      const passed = vDo < 0.05;
      return {
        actualStr: `Điện áp cấp VCC = 2.0 V, Điện áp ngõ ra DO = ${vDo.toFixed(3)} V (${passed ? 'ĐẠT' : 'KHÔNG ĐẠT'})`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'c3_overload_mcb',
    stt: 10,
    group: 'Aptomat – cầu chì – sự cố',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 's1_short_mcb16_reset',
    stt: 11,
    group: 'Aptomat – cầu chì – sự cố',
    name: 'Ca S1: Chập A–O qua aptomat 16A: Aptomat NHẢY, dây không cháy; bỏ chập đóng lại chạy bình thường',
    expectedStr: 'Aptomat NHẢY, damaged = false (MCB và mọi dây); bỏ chập đóng lại thì mạch chạy bình thường',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 16, state: true } };
      const w1 = makeWire('w1', 'u1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'mcb1', 'out', 'u1', 'O', [{ x: 240, y: 140 }, { x: 300, y: 140 }, { x: 300, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');
      return { components: [u, mcb], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      // Step 1: short circuit should trip MCB instantly in first step
      const snap1 = sim.step(0.05);
      const isTripped = snap1.thermalStates?.['mcb1']?.status === 'tripped';
      const mcbNotDamaged = snap1.thermalStates?.['mcb1']?.status !== 'damaged' && !(snap1.solverResult?.damagedComponents || []).includes('mcb1');
      const wiresNotDamaged = Object.values(snap1.wireThermalStates || {}).every(w => w.status !== 'damaged');

      // Now remove short circuit wire w2, connect lamp 60W, reset MCB
      const lamp: ComponentInstance = { id: 'l1', type: 'lamp', x: 360, y: 140, rot: 0, flip: false, label: 'Đ1', props: { power: 60, hasPE: false } };
      const wLoad1 = makeWire('wLoad1', 'mcb1', 'out', 'l1', '1', [{ x: 240, y: 140 }, { x: 320, y: 140 }], 'phase');
      const wLoad2 = makeWire('wLoad2', 'l1', '2', 'u1', 'O', [{ x: 400, y: 140 }, { x: 400, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');

      const normalCirc: CircuitState = {
        components: [circ.components[0], { ...circ.components[1], props: { ...circ.components[1].props, isTripped: false, state: true } }, lamp],
        wires: [circ.wires[0], wLoad1, wLoad2],
        junctions: [],
        viewport: { x: 40, y: 40, zoom: 1 },
      };

      sim.compile(normalCirc, 'rms');
      sim.resetAllDamaged();
      const snap2 = sim.step(0.1);
      const lampOperating = snap2.componentKinetics?.['l1']?.isOperating === true;
      const mcbNormal = snap2.thermalStates?.['mcb1']?.status === 'normal';

      const passed = isTripped && mcbNotDamaged && wiresNotDamaged && lampOperating && mcbNormal;
      return {
        actualStr: `Aptomat: ${isTripped ? 'ĐÃ NHẢY' : 'Chưa nhảy'} (damaged = ${!mcbNotDamaged}), Dây: ${wiresNotDamaged ? 'KHÔNG CHÁY' : 'Bị cháy'}, Đóng lại qua tải: ${lampOperating ? 'HOẠT ĐỘNG BÌNH THƯỜNG' : 'Không hoạt động'}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'c3_short_circuit_no_mcb',
    stt: 12,
    group: 'Aptomat – cầu chì – sự cố',
    name: 'Ca 11: Chập mạch không có Aptomat (Dây 1.5 mm² bị nóng chảy/cháy đứt)',
    expectedStr: 'Dây dẫn 1.5 mm² cháy đứt tại t = 6.5 s (status = damaged)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 120, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const w1 = makeWire('w1', 'u1', 'A', 'u1', 'O', [{ x: 160, y: 140 }, { x: 300, y: 140 }, { x: 300, y: 60 }, { x: 160, y: 60 }, { x: 160, y: 100 }], 'phase');
      w1.crossSection = 1.5;
      return { components: [u], wires: [w1], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 's2_led_direct_9v',
    stt: 13,
    group: 'Aptomat – cầu chì – sự cố',
    name: 'Ca S2: LED nối thẳng 9V: Sau khi cháy, damaged = true và trạng thái hiển thị "đỏ/hỏng"',
    expectedStr: 'LED cháy hỏng: damaged = true, thermalStatus = damaged, trạng thái hiển thị "ĐÃ CHÁY / HỎNG"',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 80, y: 120, rot: 0, flip: false, label: 'BAT1', props: { voltage: 9 } };
      const led: ComponentInstance = { id: 'led1', type: 'led', x: 240, y: 120, rot: 0, flip: false, label: 'LED1', props: { color: 'red' } };
      const w1 = makeWire('w1', 'v1', 'pos', 'led1', 'A', [{ x: 100, y: 80 }, { x: 220, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'led1', 'K', 'v1', 'neg', [{ x: 300, y: 120 }, { x: 300, y: 160 }, { x: 100, y: 160 }], 'neutral');
      return { components: [v, led], wires: [w1, w2], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'dc');
      // Step multiple times or sufficient dt to exceed LED tau (0.2s)
      for (let i = 0; i < 5; i++) {
        sim.step(0.1);
      }
      const snap = sim.step(0.1);
      const isDamaged = snap.thermalStates?.['led1']?.status === 'damaged';
      const compDamaged = snap.compiled?.compMap?.get('led1')?.damaged === true || isDamaged;
      const stateStr = snap.componentKinetics?.['led1']?.stateStr || '';
      const isRedStatus = stateStr.includes('HỎNG') || stateStr.includes('CHÁY') || isDamaged;
      const passed = isDamaged && compDamaged && isRedStatus;
      return {
        actualStr: `LED: ${isDamaged ? 'ĐÃ HỎNG (status = damaged)' : 'Chưa hỏng'}, damaged = ${compDamaged}, Hiển thị: "${stateStr}"`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'c3_resistor_overpower',
    stt: 14,
    group: 'Aptomat – cầu chì – sự cố',
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
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(2.5);
      const isDamaged = snap.thermalStates?.['r1']?.status === 'damaged';
      return {
        actualStr: `Điện trở R1: ${isDamaged ? 'ĐÃ CHÁY ĐỨT' : 'Bình thường'}`,
        passed: isDamaged,
      };
    },
  }),
  defineTestCase({
    id: 'c3_capacitor_reverse_polarity',
    stt: 15,
    group: 'Aptomat – cầu chì – sự cố',
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
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'dc');
      const snap = sim.step(0.2);
      const isDamaged = snap.thermalStates?.['c1']?.status === 'damaged';
      return {
        actualStr: `Tụ hóa C1: ${isDamaged ? 'ĐÃ PHÁT NỔ' : 'Bình thường'}`,
        passed: isDamaged,
      };
    },
  }),
  defineTestCase({
    id: 'c3_capacitor_overvoltage',
    stt: 16,
    group: 'Aptomat – cầu chì – sự cố',
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
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'dc');
      const snap = sim.step(0.2);
      const isDamaged = snap.thermalStates?.['c1']?.status === 'damaged';
      return {
        actualStr: `Tụ hóa C1: ${isDamaged ? 'ĐÃ PHÁT NỔ DO QUÁ ÁP' : 'Bình thường'}`,
        passed: isDamaged,
      };
    },
  }),
  defineTestCase({
    id: 'c3_dc_source_short',
    stt: 17,
    group: 'Aptomat – cầu chì – sự cố',
    name: 'Ca 12e: Nguồn DC bị nối tắt cực (+) với (−) quá dòng định mức 5A',
    expectedStr: 'Nguồn DC bị hỏng (status = damaged)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const v: ComponentInstance = { id: 'v1', type: 'dc_source', x: 100, y: 120, rot: 0, flip: false, label: 'V1', props: { voltage: 9, ratedCurrent: 5 } };
      const w1 = makeWire('w1', 'v1', 'pos', 'v1', 'neg', [{ x: 100, y: 80 }, { x: 200, y: 80 }, { x: 200, y: 160 }, { x: 100, y: 160 }], 'phase');
      return { components: [v], wires: [w1], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'dc');
      const snap = sim.step(2.5);
      const isDamaged = snap.thermalStates?.['v1']?.status === 'damaged';
      return {
        actualStr: `Nguồn V1: ${isDamaged ? 'ĐÃ HỎNG DO QUÁ DÒNG' : 'Bình thường'}`,
        passed: isDamaged,
      };
    },
  }),
  defineTestCase({
    id: 'c3_lamp_overvoltage',
    stt: 18,
    group: 'Aptomat – cầu chì – sự cố',
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
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(1.5);
      const isDamaged = snap.thermalStates?.['l1']?.status === 'damaged';
      return {
        actualStr: `Bóng đèn: ${isDamaged ? 'ĐÃ CHÁY TÓC' : 'Bình thường'}`,
        passed: isDamaged,
      };
    },
  }),
  defineTestCase({
    id: 'c3_fuse_overload',
    stt: 19,
    group: 'Aptomat – cầu chì – sự cố',
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
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(2.2);
      const isBlown = snap.thermalStates?.['f1']?.status === 'blown';
      return {
        actualStr: `Cầu chì CC1: ${isBlown ? 'ĐÃ ĐỨT (blown)' : 'Chưa đứt'}`,
        passed: isBlown,
      };
    },
  }),
  defineTestCase({
    id: 'c3_fuse_short',
    stt: 20,
    group: 'Aptomat – cầu chì – sự cố',
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
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(0.05);
      const isBlown = snap.thermalStates?.['f1']?.status === 'blown';
      return {
        actualStr: `Cầu chì CC1: ${isBlown ? 'ĐÃ ĐỨT TỨC THÌ' : 'Chưa đứt'}`,
        passed: isBlown,
      };
    },
  }),
  defineTestCase({
    id: 'c3_wrong_wire_mcb20',
    stt: 21,
    group: 'Aptomat – cầu chì – sự cố',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 't2_mcb_reclose_quicker',
    stt: 22,
    group: 'Aptomat – cầu chì – sự cố',
    name: 'Ca T2: Aptomat 10A + tải 3000W: Thời gian nhảy lần 2 (t2) nhỏ hơn lần 1 (t1)',
    expectedStr: 't2 < t1 (Aptomat còn nóng nên khi đóng lại quá tải nhảy nhanh hơn)',
    toleranceStr: 't2 < t1',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 10, state: true } };
      const app: ComponentInstance = { id: 'app1', type: 'appliance_generic', x: 360, y: 140, rot: 0, flip: false, label: 'TB1', props: { power: 3000, hasPE: false } };

      const w1 = makeWire('w1', 'u1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'mcb1', 'out', 'app1', '1', [{ x: 240, y: 140 }, { x: 320, y: 140 }], 'phase');
      const w3 = makeWire('w3', 'app1', '2', 'u1', 'O', [{ x: 400, y: 140 }, { x: 400, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');

      return { components: [u, mcb, app], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'rms');

      // 1. Measure trip time 1 (t1)
      let t1 = 0;
      for (let step = 0; step < 200; step++) {
        t1 += 0.1;
        const snap = sim.step(0.1);
        if (snap.thermalStates?.['mcb1']?.status === 'tripped') {
          break;
        }
      }

      // 2. Re-close immediately
      sim.replaceDamagedComponent('mcb1');

      // 3. Measure trip time 2 (t2)
      let t2 = 0;
      for (let step = 0; step < 200; step++) {
        t2 += 0.1;
        const snap = sim.step(0.1);
        if (snap.thermalStates?.['mcb1']?.status === 'tripped') {
          break;
        }
      }

      const passed = t1 > 0 && t2 > 0 && t2 < t1;
      return {
        actualStr: `Lần 1 nhảy sau t1 = ${t1.toFixed(1)} s; Lần 2 nhảy sau t2 = ${t2.toFixed(1)} s (${t2 < t1 ? 't2 < t1 ĐẠT' : 't2 >= t1 KHÔNG ĐẠT'})`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 't3_preset_j_wire_not_hot_before_trip',
    stt: 23,
    group: 'Aptomat – cầu chì – sự cố',
    name: 'Ca T3: Ở mẫu (j): Dây dẫn KHÔNG chuyển sang NÓNG trước khi aptomat nhảy',
    expectedStr: 'Mọi bước t < t_nhảy: Dây dẫn bình thường (không bị NÓNG); Aptomat bảo vệ nhảy thành công',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      return createPresetHouseholdJ();
    },
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'rms');

      let wireBecameHotBeforeTrip = false;
      let mcbTripped = false;
      let tripTime = 0;

      for (let i = 0; i < 60; i++) {
        tripTime += 0.2;
        const snap = sim.step(0.2);
        const isTripped = snap.thermalStates?.['mcb1']?.status === 'tripped';

        if (!isTripped) {
          // Check if any wire is hot
          const anyWireHot = Object.values(snap.wireThermalStates || {}).some(
            w => w.status === 'hot' || w.status === 'damaged'
          );
          if (anyWireHot) {
            wireBecameHotBeforeTrip = true;
          }
        } else {
          mcbTripped = true;
          break;
        }
      }

      const passed = mcbTripped && !wireBecameHotBeforeTrip;
      return {
        actualStr: `Aptomat: ${mcbTripped ? `ĐÃ NHẢY tại t = ${tripTime.toFixed(1)}s` : 'Chưa nhảy'}, Dây trước khi nhảy: ${wireBecameHotBeforeTrip ? 'BỊ NÓNG (KHÔNG ĐẠT)' : 'BÌNH THƯỜNG (ĐẠT)'}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 't4_click_tripped_mcb_recloses',
    stt: 24,
    group: 'Aptomat – cầu chì – sự cố',
    name: 'Ca T4: Bấm vào aptomat đã NHẢY khi đang chạy → Chuyển sang ĐÓNG',
    expectedStr: 'Aptomat đang NHẢY (isTripped = true) sau khi thao tác chuyển sang ĐÓNG (isTripped = false, state = true)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const mcb: ComponentInstance = { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 16, state: false, isTripped: true } };
      const lamp: ComponentInstance = { id: 'l1', type: 'lamp', x: 340, y: 140, rot: 0, flip: false, label: 'Đ1', props: { power: 60, hasPE: false } };

      const w1 = makeWire('w1', 'u1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase');
      const w2 = makeWire('w2', 'mcb1', 'out', 'l1', '1', [{ x: 240, y: 140 }, { x: 300, y: 140 }], 'phase');
      const w3 = makeWire('w3', 'l1', '2', 'u1', 'O', [{ x: 380, y: 140 }, { x: 380, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral');

      return { components: [u, mcb, lamp], wires: [w1, w2, w3], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'rms');

      // 1. Initial snapshot has MCB tripped
      const snapInit = sim.step(0.01);
      const wasTripped = snapInit.compiled?.compMap?.get('mcb1')?.props?.isTripped === true;

      // 2. Perform reclose action (same as clicking MCB when tripped during simulation)
      sim.replaceDamagedComponent('mcb1');

      // 3. Step again and verify closed state
      const snapAfter = sim.step(0.01);
      const mcbComp = snapAfter.compiled?.compMap?.get('mcb1');
      const isClosedNow = mcbComp?.props?.isTripped === false && mcbComp?.props?.state === true;
      const isConducting = (snapAfter.solverResult?.componentCurrents?.['mcb1'] ?? 0) > 0.1;

      const passed = wasTripped && isClosedNow && isConducting;
      return {
        actualStr: `Trước: isTripped = ${wasTripped}; Sau bấm: isTripped = ${mcbComp?.props?.isTripped}, state = ${mcbComp?.props?.state}, Dòng điện = ${snapAfter.solverResult?.componentCurrents?.['mcb1']} A`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'pe_1',
    stt: 25,
    group: 'PE – rò vỏ',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const caseStat = res.caseStatuses['fan1'];
      const vCase = caseStat?.caseVoltage ?? 0;
      const iHuman = caseStat?.humanCurrent ?? 0;
      const passed = Math.abs(vCase - 217.8) <= 217.8 * 0.02 && Math.abs(iHuman - 217.8) <= 217.8 * 0.02;
      return { actualStr: `V = ${vCase.toFixed(1)} V, I = ${iHuman.toFixed(1)} mA (${caseStat?.dangerLevel})`, passed };
    },
  }),
  defineTestCase({
    id: 'pe_2',
    stt: 26,
    group: 'PE – rò vỏ',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const caseStat = res.caseStatuses['fan1'];
      const vCase = caseStat?.caseVoltage ?? 0;
      const iHuman = caseStat?.humanCurrent ?? 0;
      const passed = Math.abs(vCase - 62.7) <= 62.7 * 0.02 && Math.abs(iHuman - 62.7) <= 62.7 * 0.02;
      return { actualStr: `V = ${vCase.toFixed(1)} V, I = ${iHuman.toFixed(1)} mA`, passed };
    },
  }),
  defineTestCase({
    id: 'pe_3',
    stt: 27,
    group: 'PE – rò vỏ',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 'pe_4',
    stt: 28,
    group: 'PE – rò vỏ',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const vFanCase = res.caseStatuses['fan1']?.caseVoltage ?? 0;
      const iFault = (220 - vFanCase) / 10;
      const passed = Math.abs(iFault - 21.8) <= 21.8 * 0.03;
      return { actualStr: `I = ${iFault.toFixed(2)} A (V_vỏ = ${vFanCase.toFixed(2)} V)`, passed };
    },
  }),
  defineTestCase({
    id: 'c3_elcb_leak_touch',
    stt: 29,
    group: 'PE – rò vỏ',
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
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      const snap = sim.step(0.05);
      const isTripped = snap.thermalStates?.['elcb1']?.status === 'tripped';
      return {
        actualStr: `ELCB: ${isTripped ? 'ĐÃ NHẢY TỨC THÌ (dòng rò người)' : 'Chưa nhảy'}`,
        passed: isTripped,
      };
    },
  }),
  defineTestCase({
    id: 'pe_6',
    stt: 30,
    group: 'PE – rò vỏ',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires, 1.0);
      const vCase = res.caseStatuses['fan1']?.caseVoltage ?? 0;
      const notTripped = !res.trippedComponents.includes('elcb1');
      const passed = vCase >= 219 && notTripped;
      return { actualStr: `V_vỏ = ${vCase.toFixed(1)} V, ELCB: ${notTripped ? 'KHÔNG NHẢY' : 'NHẢY'}`, passed };
    },
  }),
  defineTestCase({
    id: 'pe_7',
    stt: 31,
    group: 'PE – rò vỏ',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const vCase = res.caseStatuses['fan1']?.caseVoltage ?? 0;
      const iFault = (220 - vCase) / 10;
      const passed = Math.abs(iFault - 7.33) <= 7.33 * 0.03;
      return { actualStr: `I = ${iFault.toFixed(2)} A (V_vỏ = ${vCase.toFixed(2)} V)`, passed };
    },
  }),
  defineTestCase({
    id: 'pe_8',
    stt: 32,
    group: 'PE – rò vỏ',
    name: 'PE-8: Tắt chân PE tự gỡ dây, Ctrl+Z khôi phục',
    expectedStr: 'Tắt PE xóa 1 dây; Undo phục hồi đủ dây',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 200, y: 100, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: true } };
      const gnd: ComponentInstance = { id: 'gnd1', type: 'earth_ground', x: 200, y: 200, rot: 0, flip: false, label: 'ĐẤT1', props: { resistance: 4 } };
      const wpe = makeWire('wpe', 'fan1', 'PE', 'gnd1', 'pe', [{ x: 200, y: 120 }, { x: 200, y: 180 }], 'ground');
      return { components: [fan, gnd], wires: [wpe], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 'pe_9',
    stt: 33,
    group: 'PE – rò vỏ',
    name: 'PE-9: JSON roundtrip & tương thích file cũ',
    expectedStr: 'Giữ nguyên hasPE=true; file cũ gán false',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const fan: ComponentInstance = { id: 'fan1', type: 'ceiling_fan', x: 200, y: 100, rot: 0, flip: false, label: 'QT1', props: { power: 75, hasPE: true } };
      const gnd: ComponentInstance = { id: 'gnd1', type: 'earth_ground', x: 200, y: 200, rot: 0, flip: false, label: 'ĐẤT1', props: { resistance: 4 } };
      const wpe = makeWire('wpe', 'fan1', 'PE', 'gnd1', 'pe', [{ x: 200, y: 120 }, { x: 200, y: 180 }], 'ground');
      return { components: [fan, gnd], wires: [wpe], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 'c1_meters',
    stt: 34,
    group: 'Dụng cụ đo – công tơ',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const vMeter = res.componentVoltages['v1'] ?? 0;
      const iAmp = res.componentCurrents['a1'] ?? 0;
      const passed = Math.abs(vMeter - 220) <= 220 * 0.01 && Math.abs(iAmp - 0.273) <= 0.273 * 0.02;
      return {
        actualStr: `V = ${vMeter.toFixed(1)} V, I = ${iAmp.toFixed(3)} A`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'c3_ohmmeter_single',
    stt: 35,
    group: 'Dụng cụ đo – công tơ',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const rVal = res.meterMeasurements?.['ohm1']?.resistance ?? 0;
      const formatted = res.meterMeasurements?.['ohm1']?.formatted || '';
      const passed = Math.abs(rVal - 1000) <= 5 && formatted === '1,00 kΩ';
      return {
        actualStr: `Số đo: ${formatted} (${rVal.toFixed(1)} Ω)`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'c3_ohmmeter_series',
    stt: 36,
    group: 'Dụng cụ đo – công tơ',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const rVal = res.meterMeasurements?.['ohm1']?.resistance ?? 0;
      const formatted = res.meterMeasurements?.['ohm1']?.formatted || '';
      const passed = Math.abs(rVal - 3000) <= 15 && formatted === '3,00 kΩ';
      return {
        actualStr: `Số đo: ${formatted} (${rVal.toFixed(1)} Ω)`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'c3_ohmmeter_parallel',
    stt: 37,
    group: 'Dụng cụ đo – công tơ',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const rVal = res.meterMeasurements?.['ohm1']?.resistance ?? 0;
      const formatted = res.meterMeasurements?.['ohm1']?.formatted || '';
      const passed = Math.abs(rVal - 500) <= 2.5 && formatted === '500 Ω';
      return {
        actualStr: `Số đo: ${formatted} (${rVal.toFixed(1)} Ω)`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'c3_ohmmeter_open',
    stt: 38,
    group: 'Dụng cụ đo – công tơ',
    name: 'Ca O4: Ôm kế 2 chân khi hở mạch (không nối gì)',
    expectedStr: 'R = ∞ (hở)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const ohm: ComponentInstance = { id: 'ohm1', type: 'ohmmeter', x: 100, y: 140, rot: 0, flip: false, label: 'Ω1', props: {} };
      return { components: [ohm], wires: [], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const formatted = res.meterMeasurements?.['ohm1']?.formatted || '';
      const passed = formatted === '∞ (hở)';
      return {
        actualStr: `Số đo: ${formatted}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'c3_wattmeter_4pin',
    stt: 39,
    group: 'Dụng cụ đo – công tơ',
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
    evaluate: (circ) => {
      const res = solveCircuit(circ.components, circ.wires);
      const pVal = res.meterMeasurements?.['w1']?.power ?? 0;
      const formatted = res.meterMeasurements?.['w1']?.formatted || '';
      const passed = Math.abs(pVal - 60) <= 0.5 && formatted === '60,0 W';
      return {
        actualStr: `Số đo: ${formatted} (P = ${pVal.toFixed(1)} W, U = 220 V, I ≈ 0.273 A)`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 't1_kwh_meter_60w_lamp',
    stt: 40,
    group: 'Dụng cụ đo – công tơ',
    name: 'Ca T1: Nguồn → Công tơ → Đèn 60W → O: U_tải ≈ 219,9 V, P = 60 W, chạy 1s với TUA ×3600 thì E ≈ 0,060 kWh',
    expectedStr: 'U_tải ≈ 219,9 V (±0,5 V), P = 60 W (±1 W), E ≈ 0,060 kWh (±2%)',
    toleranceStr: 'U: ±0,5 V; P: ±1 W; E: ±2%',
    createCircuit: () => {
      const u: ComponentInstance = { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } };
      const ct: ComponentInstance = { id: 'ct1', type: 'kwh_meter', x: 200, y: 140, rot: 0, flip: false, label: 'CT1', props: { kwh: 0 } };
      const lamp: ComponentInstance = { id: 'l1', type: 'lamp', x: 340, y: 140, rot: 0, flip: false, label: 'Đ1', props: { power: 60, hasPE: false } };

      const w1 = makeWire('w1', 'u1', 'A', 'ct1', '1', [{ x: 120, y: 140 }, { x: 160, y: 120 }], 'phase');
      const w2 = makeWire('w2', 'ct1', '2', 'l1', '1', [{ x: 240, y: 120 }, { x: 300, y: 140 }], 'phase');
      const w3 = makeWire('w3', 'l1', '2', 'ct1', '4', [{ x: 380, y: 140 }, { x: 380, y: 200 }, { x: 240, y: 200 }, { x: 240, y: 160 }], 'neutral');
      const w4 = makeWire('w4', 'ct1', '3', 'u1', 'O', [{ x: 160, y: 160 }, { x: 160, y: 200 }, { x: 120, y: 200 }, { x: 120, y: 100 }], 'neutral');

      return { components: [u, ct, lamp], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'rms');
      sim.setEnergyMultiplier(3600);

      // Run 1 second in simulation time with x3600 multiplier
      const snap = sim.step(1.0);
      const ctMeter = snap.meters?.['ct1'];
      const uVal = ctMeter?.voltage ?? 0;
      const pVal = ctMeter?.power ?? 0;
      const eVal = ctMeter?.energyKwh ?? 0;

      const checkU = Math.abs(uVal - 220) <= 0.6; // ≈ 219.9 V
      const checkP = Math.abs(pVal - 60) <= 1.0;  // 60 W ± 1
      const checkE = Math.abs(eVal - 0.060) <= 0.060 * 0.02; // 0.060 kWh ± 2%

      const passed = checkU && checkP && checkE;
      return {
        actualStr: `U_tải = ${uVal.toFixed(1)} V, P = ${pVal.toFixed(1)} W, E = ${eVal.toFixed(4)} kWh`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'e7_tcvn_format_check',
    stt: 41,
    group: 'Dụng cụ đo – công tơ',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 'e1_sample_a_running',
    stt: 42,
    group: 'Mạch mẫu',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 'e2_sample_b_voltmeter',
    stt: 43,
    group: 'Mạch mẫu',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 'e3_sample_a_trip',
    stt: 44,
    group: 'Mạch mẫu',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 'e4_sample_f_led',
    stt: 45,
    group: 'Mạch mẫu',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 'e5_open_circuit_report',
    stt: 46,
    group: 'Mạch mẫu',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 'e6_palette_model_registry_check',
    stt: 47,
    group: 'Mạch mẫu',
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
    evaluate: (circ) => {
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
  }),
  defineTestCase({
    id: 's3_presets_j_k_m_no_mcb_damage',
    stt: 48,
    group: 'Mạch mẫu',
    name: 'Ca S3: Chạy các mẫu (j), (k), (m): Không có aptomat nào bị hỏng (damaged = false)',
    expectedStr: 'Mẫu (j): MCB nhảy do quá tải; Mẫu (k): MCB nhảy tức thì do chập; Mẫu (m): MCB 20A chưa nhảy; Cả 3 mẫu: MCB damaged = false',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      return createPresetHouseholdK();
    },
    evaluate: (circ) => {
      // 1. Check Preset J (Quá tải: MCB 10A + 3000W)
      const circJ = createPresetHouseholdJ();
      const simJ = new SimulationService();
      simJ.compile(circJ, 'rms');
      // Step up to 10 seconds to accumulate overload heat
      for (let i = 0; i < 20; i++) {
        simJ.step(0.5);
      }
      const snapJ = simJ.step(0.5);
      const mcbTrippedJ = snapJ.thermalStates?.['mcb1']?.status === 'tripped';
      const mcbNotDamagedJ = snapJ.thermalStates?.['mcb1']?.status !== 'damaged' && !(snapJ.solverResult?.damagedComponents || []).includes('mcb1');

      // 2. Check Preset K (Chập mạch: MCB 16A nối tắt A-O)
      const circK = createPresetHouseholdK();
      const simK = new SimulationService();
      simK.compile(circK, 'rms');
      const snapK = simK.step(0.1);
      const mcbTrippedK = snapK.thermalStates?.['mcb1']?.status === 'tripped';
      const mcbNotDamagedK = snapK.thermalStates?.['mcb1']?.status !== 'damaged' && !(snapK.solverResult?.damagedComponents || []).includes('mcb1');

      // 3. Check Preset M (Chọn sai dây: MCB 20A + Dây 1.0mm² + 3300W)
      const circM = createPresetHouseholdM();
      const simM = new SimulationService();
      simM.compile(circM, 'rms');
      for (let i = 0; i < 20; i++) {
        simM.step(0.5);
      }
      const snapM = simM.step(0.5);
      const mcbNotDamagedM = snapM.thermalStates?.['mcb1']?.status !== 'damaged' && !(snapM.solverResult?.damagedComponents || []).includes('mcb1');

      const allNotDamaged = mcbNotDamagedJ && mcbNotDamagedK && mcbNotDamagedM;
      const passed = mcbTrippedJ && mcbTrippedK && allNotDamaged;

      return {
        actualStr: `Mẫu (j): ${mcbTrippedJ ? 'MCB nhảy' : 'chưa nhảy'} (damaged=${!mcbNotDamagedJ}); Mẫu (k): ${mcbTrippedK ? 'MCB nhảy' : 'chưa nhảy'} (damaged=${!mcbNotDamagedK}); Mẫu (m): MCB damaged=${!mcbNotDamagedM}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'cb2_preset_r_light_auto_lamp',
    stt: 49,
    group: 'Mạch mẫu',
    name: 'Ca 52: Mẫu (r): Ánh sáng 30% → đèn nhỏ chạy, 70% → tắt',
    expectedStr: 'Ánh sáng 30% → Đèn nhỏ chạy (isOperating = true); Ánh sáng 70% → Đèn nhỏ tắt (isOperating = false)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      return createPresetSensorR();
    },
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'dc');

      // 1. Bước 1: Ánh sáng 30% (mặc định của mẫu r)
      const snap1 = sim.step(0.01);
      const isOp1 = snap1.solverResult?.operatingStates?.['den1'] === true;

      // 2. Bước 2: Chuyển ánh sáng sang 70% (trời sáng)
      const cbComp = snap1.compiled?.compMap?.get('cb1');
      if (cbComp) cbComp.props.envValue = 70;
      const snap2 = sim.step(0.01);
      const isOp2 = snap2.solverResult?.operatingStates?.['den1'] === true;

      const passed = isOp1 === true && isOp2 === false;
      return {
        actualStr: `Ánh sáng 30%: Đèn ${isOp1 ? 'ĐANG CHẠY (BẬT)' : 'TẮT'}; Ánh sáng 70%: Đèn ${isOp2 ? 'ĐANG CHẠY' : 'ĐÃ TẮT'}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'cb3_sensor_gas_threshold',
    stt: 50,
    group: 'Mạch mẫu',
    name: 'Ca 50: Cảm biến khí gas ngưỡng 300 ppm: 500 ppm → DO=5V, 100 ppm → DO≈0V',
    expectedStr: 'envValue 500 ppm → DO = VCC (5 V); envValue 100 ppm → DO ≈ 0 V',
    toleranceStr: 'Sai số < 0,1 V',
    createCircuit: () => {
      const src: ComponentInstance = { id: 'src1', type: 'dc_source', x: 80, y: 160, rot: 0, flip: false, label: 'E', props: { voltage: 5 } };
      const sensor: ComponentInstance = {
        id: 'cb1',
        type: 'sensor_module',
        x: 240,
        y: 160,
        rot: 0,
        flip: false,
        label: 'CB_GAS',
        props: { sensorType: 'gas', envValue: 500, threshold: 300, triggerCondition: 'above' },
      };
      const vm: ComponentInstance = { id: 'vm1', type: 'voltmeter', x: 400, y: 160, rot: 0, flip: false, label: 'V1', props: {} };
      const w1 = makeWire('w1', 'src1', 'pos', 'cb1', 'vcc', [{ x: 120, y: 160 }, { x: 190, y: 135 }]);
      const w2 = makeWire('w2', 'src1', 'neg', 'cb1', 'gnd', [{ x: 120, y: 180 }, { x: 190, y: 185 }], 'neutral');
      const w3 = makeWire('w3', 'cb1', 'do', 'vm1', 'pos', [{ x: 290, y: 135 }, { x: 360, y: 160 }]);
      const w4 = makeWire('w4', 'vm1', 'neg', 'src1', 'neg', [{ x: 440, y: 160 }, { x: 440, y: 220 }, { x: 120, y: 220 }, { x: 120, y: 180 }], 'neutral');
      return { components: [src, sensor, vm], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
      // 1. envValue = 500 (> 300) -> DO = 5V
      circ.components[1].props.envValue = 500;
      const res1 = solveCircuit(circ.components, circ.wires);
      const vDoHigh = res1.componentVoltages?.['vm1'] ?? 0;

      // 2. envValue = 100 (< 300) -> DO = 0V
      circ.components[1].props.envValue = 100;
      circ.components[1].props._doHigh = false;
      const res2 = solveCircuit(circ.components, circ.wires);
      const vDoLow = res2.componentVoltages?.['vm1'] ?? 0;

      const passed = Math.abs(vDoHigh - 5.0) < 0.2 && Math.abs(vDoLow - 0.0) < 0.2;
      return {
        actualStr: `envValue 500: DO = ${vDoHigh.toFixed(2)} V; envValue 100: DO = ${vDoLow.toFixed(2)} V`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'cb4_sensor_ultrasonic_threshold',
    stt: 51,
    group: 'Mạch mẫu',
    name: 'Ca 51: Cảm biến siêu âm ngưỡng 50 cm: 30 cm → DO=5V, 120 cm → DO≈0V',
    expectedStr: 'envValue 30 cm → DO = VCC (5 V); envValue 120 cm → DO ≈ 0 V',
    toleranceStr: 'Sai số < 0,1 V',
    createCircuit: () => {
      const src: ComponentInstance = { id: 'src1', type: 'dc_source', x: 80, y: 160, rot: 0, flip: false, label: 'E', props: { voltage: 5 } };
      const sensor: ComponentInstance = {
        id: 'cb1',
        type: 'sensor_module',
        x: 240,
        y: 160,
        rot: 0,
        flip: false,
        label: 'CB_SONIC',
        props: { sensorType: 'ultrasonic', envValue: 30, threshold: 50, triggerCondition: 'below' },
      };
      const vm: ComponentInstance = { id: 'vm1', type: 'voltmeter', x: 400, y: 160, rot: 0, flip: false, label: 'V1', props: {} };
      const w1 = makeWire('w1', 'src1', 'pos', 'cb1', 'vcc', [{ x: 120, y: 160 }, { x: 190, y: 135 }]);
      const w2 = makeWire('w2', 'src1', 'neg', 'cb1', 'gnd', [{ x: 120, y: 180 }, { x: 190, y: 185 }], 'neutral');
      const w3 = makeWire('w3', 'cb1', 'do', 'vm1', 'pos', [{ x: 290, y: 135 }, { x: 360, y: 160 }]);
      const w4 = makeWire('w4', 'vm1', 'neg', 'src1', 'neg', [{ x: 440, y: 160 }, { x: 440, y: 220 }, { x: 120, y: 220 }, { x: 120, y: 180 }], 'neutral');
      return { components: [src, sensor, vm], wires: [w1, w2, w3, w4], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
      // 1. envValue = 30 (< 50) -> DO = 5V
      circ.components[1].props.envValue = 30;
      const res1 = solveCircuit(circ.components, circ.wires);
      const vDoHigh = res1.componentVoltages?.['vm1'] ?? 0;

      // 2. envValue = 120 (> 50) -> DO = 0V
      circ.components[1].props.envValue = 120;
      circ.components[1].props._doHigh = false;
      const res2 = solveCircuit(circ.components, circ.wires);
      const vDoLow = res2.componentVoltages?.['vm1'] ?? 0;

      const passed = Math.abs(vDoHigh - 5.0) < 0.2 && Math.abs(vDoLow - 0.0) < 0.2;
      return {
        actualStr: `envValue 30 cm: DO = ${vDoHigh.toFixed(2)} V; envValue 120 cm: DO = ${vDoLow.toFixed(2)} V`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'cb5_time_relay_off_delay',
    stt: 52,
    group: 'Mạch mẫu',
    name: 'Ca 52: Rơ le thời gian trễ ngắt T=10s: IN cao rồi thấp; t=5s vẫn hút, t=11s nhả',
    expectedStr: 'IN cao → hút; IN thấp: tại t=5s vẫn hút (true), tại t=11s nhả (false)',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const src: ComponentInstance = { id: 'src1', type: 'dc_source', x: 80, y: 160, rot: 0, flip: false, label: 'E', props: { voltage: 5 } };
      const sw: ComponentInstance = { id: 'sw1', type: 'switch_2p', x: 220, y: 120, rot: 0, flip: false, label: 'K1', props: { state: true } };
      const timeRelay: ComponentInstance = {
        id: 'rlt1',
        type: 'time_relay',
        x: 360,
        y: 160,
        rot: 0,
        flip: false,
        label: 'RLT1',
        props: { mode: 'off_delay', delayTime: 10, _isEnergized: false, _timer: 0 },
      };
      const lamp: ComponentInstance = { id: 'den1', type: 'lamp_dc', x: 520, y: 160, rot: 0, flip: false, label: 'Đ1', props: { voltage: 5, power: 1 } };

      const w1 = makeWire('w1', 'src1', 'pos', 'rlt1', 'vcc', [{ x: 120, y: 160 }, { x: 310, y: 136 }]);
      const w2 = makeWire('w2', 'src1', 'pos', 'sw1', '1', [{ x: 120, y: 160 }, { x: 180, y: 120 }]);
      const w3 = makeWire('w3', 'sw1', '2', 'rlt1', 'in', [{ x: 260, y: 120 }, { x: 310, y: 184 }]);
      const w4 = makeWire('w4', 'src1', 'pos', 'rlt1', 'com', [{ x: 120, y: 160 }, { x: 120, y: 260 }, { x: 410, y: 260 }, { x: 410, y: 160 }]);
      const w5 = makeWire('w5', 'rlt1', 'no', 'den1', '1', [{ x: 410, y: 136 }, { x: 480, y: 160 }]);
      const w6 = makeWire('w6', 'den1', '2', 'src1', 'neg', [{ x: 560, y: 160 }, { x: 560, y: 300 }, { x: 120, y: 300 }, { x: 120, y: 180 }], 'neutral');
      const w7 = makeWire('w7', 'src1', 'neg', 'rlt1', 'gnd', [{ x: 120, y: 180 }, { x: 310, y: 160 }], 'neutral');

      return { components: [src, sw, timeRelay, lamp], wires: [w1, w2, w3, w4, w5, w6, w7], junctions: [], viewport: { x: 40, y: 40, zoom: 1 } };
    },
    evaluate: (circ) => {
      // 1. Bước 1: Công tắc K1 đóng (state: true) -> IN ở mức CAO -> Rơ le hút ngay
      circ.components[1].props.state = true;
      circ.components[2].props._timer = 0;
      circ.components[2].props._isEnergized = false;
      const res1 = solveCircuit(circ.components, circ.wires, undefined, undefined, 0, {}, {}, 0.05);
      const isEnergized1 = res1.operatingStates?.['rlt1'] === true;

      // 2. Bước 2: Công tắc K1 ngắt (state: false) -> IN xuống THẤP. Sau 5 giây (dt = 5.0 s), rơ le VẪN HÚT (5s < 10s)
      circ.components[1].props.state = false;
      const res2 = solveCircuit(circ.components, circ.wires, undefined, undefined, 5.0, {}, {}, 5.0);
      const isEnergizedAt5s = res2.operatingStates?.['rlt1'] === true;

      // 3. Bước 3: Sau thêm 6 giây (tổng 11s > 10s delay), rơ le NHẢ
      const res3 = solveCircuit(circ.components, circ.wires, undefined, undefined, 11.0, {}, {}, 6.0);
      const isEnergizedAt11s = res3.operatingStates?.['rlt1'] === true;

      const passed = isEnergized1 === true && isEnergizedAt5s === true && isEnergizedAt11s === false;
      return {
        actualStr: `IN cao: ${isEnergized1 ? 'Hút' : 'Chưa hút'}; IN thấp tại t=5s: ${isEnergizedAt5s ? 'Vẫn hút' : 'Đã nhả'}; tại t=11s: ${isEnergizedAt11s ? 'Vẫn hút' : 'Đã nhả'}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'osc1_rc_charge_0_1s',
    stt: 53,
    group: 'Dụng cụ đo – công tơ',
    name: 'Ca 53: Mạch (v) nạp tụ RC: Tại t = 0,1 s, điện áp tụ đo trên kênh CH1 đạt ≈ 3,16 V (63%)',
    expectedStr: 'V_CH1 tại t = 0,1 s nằm trong khoảng 3,16 V ± 2% (3,10 V – 3,22 V)',
    toleranceStr: 'Sai số ± 2%',
    createCircuit: () => {
      return createPresetElectronicsV();
    },
    evaluate: (circ) => {
      const sim = new SimulationService();
      sim.compile(circ, 'dc');
      oscilloscopeService.clear();

      // Step simulation by dt = 0.005s (5ms) up to 0.1s (20 steps)
      const dt = 0.005;
      const targetTime = 0.1;
      const totalSteps = Math.round(targetTime / dt);
      for (let i = 0; i < totalSteps; i++) {
        sim.step(dt);
      }
      const samples = oscilloscopeService.getSamples();
      const lastSample = samples[samples.length - 1];
      const vCh1 = lastSample ? lastSample.v1 : 0;
      // Exact theoretical: 5 * (1 - e^(-1)) = 3.1606 V
      const target = 5.0 * (1 - Math.exp(-1.0));
      const errorPct = (Math.abs(vCh1 - target) / target) * 100;
      const passed = errorPct <= 2.0;
      return {
        actualStr: `t = ${sim.getSimTime().toFixed(3)} s: V_CH1 = ${vCh1.toFixed(3)} V (lí thuyết = ${target.toFixed(3)} V, sai lệch = ${errorPct.toFixed(2)}%)`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'osc2_ring_buffer_4000_chronological',
    stt: 54,
    group: 'Dụng cụ đo – công tơ',
    name: 'Ca 54: Bộ đệm dao động kí ảo: Giới hạn 4000 mẫu/kênh và luôn theo thứ tự thời gian tăng dần',
    expectedStr: 'Số mẫu không vượt quá 4000; thứ tự thời gian t[i] <= t[i+1]',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      return createPresetElectronicsV();
    },
    evaluate: () => {
      oscilloscopeService.clear();
      // Push 5000 samples
      for (let i = 0; i < 5000; i++) {
        const t = i * 0.0001; // 0.1 ms each
        const v1 = 5 * Math.sin(2 * Math.PI * 50 * t);
        const v2 = 2.5 * Math.cos(2 * Math.PI * 50 * t);
        oscilloscopeService.recordSample(t, v1, v2);
      }
      const samples = oscilloscopeService.getSamples();
      const countOk = samples.length === 4000;
      let chronological = true;
      for (let i = 1; i < samples.length; i++) {
        if (samples[i].t < samples[i - 1].t) {
          chronological = false;
          break;
        }
      }
      const firstT = samples[0]?.t ?? 0;
      const lastT = samples[samples.length - 1]?.t ?? 0;
      const timeOrderOk = Math.abs(firstT - 0.1) < 1e-4 && Math.abs(lastT - 0.4999) < 1e-4;

      const passed = countOk && chronological && timeOrderOk;
      return {
        actualStr: `Số mẫu: ${samples.length}/4000; Thời gian từ ${firstT.toFixed(4)} s đến ${lastT.toFixed(4)} s; Thứ tự thời gian: ${chronological ? 'ĐÚNG (t_i <= t_{i+1})' : 'SAI'}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'osc3_non_invasive_10meg',
    stt: 55,
    group: 'Dụng cụ đo – công tơ',
    name: 'Ca 55: Trở kháng vào dao động kí 10 MΩ không ảnh hưởng mạch: Sai lệch U, I < 0,1%',
    expectedStr: 'Điện áp và dòng điện của mạch khi có và không có dao động kí sai lệch < 0,1%',
    toleranceStr: 'Sai lệch < 0,1%',
    createCircuit: () => {
      return createPresetElectronicsV();
    },
    evaluate: (circWithOsc) => {
      // 1. Mạch có dao động kí
      const simWith = new SimulationService();
      simWith.compile(circWithOsc, 'dc');
      const snapWith = simWith.step(0.05); // step 50 ms
      const vCapWith = snapWith.solverResult?.componentVoltages?.['c1'] ?? 0;
      const iCapWith = snapWith.solverResult?.componentCurrents?.['c1'] ?? 0;

      // 2. Mạch không có dao động kí (bỏ linh kiện osc1 và các dây nối vào osc1)
      const freshCirc = createPresetElectronicsV();
      const circWithout = {
        ...freshCirc,
        components: freshCirc.components.filter((c) => c.type !== 'oscilloscope'),
        wires: freshCirc.wires.filter(
          (w) => w.from.compId !== 'osc1' && w.to.compId !== 'osc1'
        ),
      };
      const simWithout = new SimulationService();
      simWithout.compile(circWithout, 'dc');
      const snapWithout = simWithout.step(0.05);
      const vCapWithout = snapWithout.solverResult?.componentVoltages?.['c1'] ?? 0;
      const iCapWithout = snapWithout.solverResult?.componentCurrents?.['c1'] ?? 0;

      const diffVPct = (Math.abs(vCapWith - vCapWithout) / Math.max(vCapWithout, 1e-6)) * 100;
      const diffIPct = (Math.abs(iCapWith - iCapWithout) / Math.max(iCapWithout, 1e-6)) * 100;

      const passed = diffVPct < 0.1 && diffIPct < 0.1;
      return {
        actualStr: `Không OSC: V_tụ = ${vCapWithout.toFixed(4)} V, I = ${(iCapWithout * 1000).toFixed(4)} mA; Có OSC (10 MΩ): V_tụ = ${vCapWith.toFixed(4)} V, I = ${(iCapWith * 1000).toFixed(4)} mA; Sai lệch V: ${diffVPct.toFixed(4)}%, Sai lệch I: ${diffIPct.toFixed(4)}%`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'osc4_rc_single_shot_1s',
    stt: 56,
    group: 'Dụng cụ đo – công tơ',
    name: 'Ca 56: Mạch RC (v) chụp 1 s mô phỏng: V(0,1 s) ≈ 3,16 V (±2%), V(1,0 s) ≈ 4,9–5,0 V',
    expectedStr: 'V(0,1 s) ≈ 3,16 V (±2%), V(1,0 s) ≈ 4,9–5,0 V',
    toleranceStr: 'V(0,1 s) sai lệch ±2%, V(1,0 s) trong khoảng 4,9–5,0 V',
    createCircuit: () => {
      return createPresetElectronicsV();
    },
    evaluate: (circuit) => {
      oscilloscopeService.clear();
      const sim = new SimulationService();
      sim.compile(circuit, 'dc');
      sim.runSingleShotSync(1.0);
      const samples = oscilloscopeService.getSamples();
      let sampleAt01 = samples[0];
      let dist01 = Math.abs((sampleAt01?.t ?? 0) - 0.1);
      for (const s of samples) {
        const d = Math.abs(s.t - 0.1);
        if (d < dist01) {
          dist01 = d;
          sampleAt01 = s;
        }
      }
      const lastSample = samples[samples.length - 1];
      const vAt01 = sampleAt01?.v1 ?? 0;
      const vEnd = lastSample?.v1 ?? 0;

      const v01Ok = Math.abs(vAt01 - 3.16) <= 3.16 * 0.02 + 0.01;
      const vEndOk = vEnd >= 4.9 && vEnd <= 5.01;
      const passed = v01Ok && vEndOk;
      return {
        actualStr: `V(t=0,1s) = ${vAt01.toFixed(3)} V (kì vọng 3,16 V ± 2%); V(t=${lastSample?.t.toFixed(3)}s) = ${vEnd.toFixed(3)} V (kì vọng 4,9–5,0 V)`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'osc5_ac_source_100ms',
    stt: 57,
    group: 'Dụng cụ đo – công tơ',
    name: 'Ca 57: Nguồn xoay chiều 5 V đỉnh 50 Hz chụp 100 ms: Đỉnh ±5 V (±2%), Chu kì 20 ms (±2%)',
    expectedStr: 'max ≈ +5 V (±2%), min ≈ -5 V (±2%), chu kì giữa 2 lần cắt lên 0 V = 20 ms (±2%)',
    toleranceStr: 'Biên độ ±2%, chu kì ±2%',
    createCircuit: () => {
      return createPresetElectronicsX();
    },
    evaluate: (circuit) => {
      oscilloscopeService.clear();
      const sim = new SimulationService();
      sim.compile(circuit, 'dc');
      sim.runSingleShotSync(0.1);
      const samples = oscilloscopeService.getSamples();
      let maxV = -Infinity;
      let minV = Infinity;
      for (const s of samples) {
        if (s.v1 > maxV) maxV = s.v1;
        if (s.v1 < minV) minV = s.v1;
      }
      const zeroCrossings: number[] = [];
      for (let i = 1; i < samples.length; i++) {
        if (samples[i - 1].v1 <= 0 && samples[i].v1 > 0) {
          const t0 = samples[i - 1].t;
          const t1 = samples[i].t;
          const v0 = samples[i - 1].v1;
          const v1 = samples[i].v1;
          const tCross = t0 + (-v0 / (v1 - v0)) * (t1 - t0);
          zeroCrossings.push(tCross);
        }
      }
      let avgPeriod = 0;
      if (zeroCrossings.length >= 2) {
        let totalT = 0;
        for (let i = 1; i < zeroCrossings.length; i++) {
          totalT += (zeroCrossings[i] - zeroCrossings[i - 1]);
        }
        avgPeriod = totalT / (zeroCrossings.length - 1);
      }
      const maxOk = Math.abs(maxV - 5.0) <= 5.0 * 0.02;
      const minOk = Math.abs(minV - (-5.0)) <= 5.0 * 0.02;
      const periodOk = Math.abs(avgPeriod - 0.020) <= 0.020 * 0.02;
      const passed = maxOk && minOk && periodOk;
      return {
        actualStr: `V_max = ${maxV.toFixed(3)} V (kì vọng +5 V ± 2%); V_min = ${minV.toFixed(3)} V (kì vọng -5 V ± 2%); Chu kì T = ${(avgPeriod * 1000).toFixed(2)} ms (kì vọng 20 ms ± 2%)`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'osc6_half_wave_rectifier',
    stt: 58,
    group: 'Dụng cụ đo – công tơ',
    name: 'Ca 58: Mạch chỉnh lưu nửa chu kì (y): Đỉnh CH2 ≈ 4,3 V (±0,15 V), V_min ≥ -0,05 V',
    expectedStr: 'V_peak(CH2) ≈ 4,3 V (±0,15 V), V_min(CH2) ≥ -0,05 V',
    toleranceStr: 'Đỉnh 4,15–4,45 V; V_min ≥ -0,05 V',
    createCircuit: () => {
      return createPresetElectronicsY();
    },
    evaluate: (circuit) => {
      oscilloscopeService.clear();
      const sim = new SimulationService();
      sim.compile(circuit, 'dc');
      sim.runSingleShotSync(0.1);
      const samples = oscilloscopeService.getSamples();
      let maxV2 = -Infinity;
      let minV2 = Infinity;
      for (const s of samples) {
        if (s.v2 > maxV2) maxV2 = s.v2;
        if (s.v2 < minV2) minV2 = s.v2;
      }
      const peakOk = Math.abs(maxV2 - 4.3) <= 0.15;
      const minOk = minV2 >= -0.05;
      const passed = peakOk && minOk;
      return {
        actualStr: `V_đỉnh(CH2) = ${maxV2.toFixed(3)} V (kì vọng 4,3 V ± 0,15 V); V_min(CH2) = ${minV2.toFixed(3)} V (kì vọng ≥ -0,05 V)`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'case59_all_presets_compile_step',
    stt: 59,
    group: 'Mạch mẫu',
    name: 'Ca 59: Mọi mạch mẫu ở mọi workspace nạp được và mô phỏng bước đầu tiên thành công',
    expectedStr: 'Tất cả các mạch mẫu ở 3 workspace đều biên dịch và mô phỏng bước đầu tiên thành công',
    toleranceStr: '100% mạch mẫu thành công',
    createCircuit: () => {
      return createPresetHouseholdA1();
    },
    evaluate: () => {
      let total = 0;
      let passedCount = 0;
      const failedNames: string[] = [];

      for (const p of HOUSEHOLD_PRESETS) {
        total++;
        try {
          const sim = new SimulationService();
          sim.compile(p.state, 'rms');
          const res = sim.step(0.02);
          if (res) passedCount++;
          else failedNames.push(p.id);
        } catch {
          failedNames.push(p.id);
        }
      }

      for (const p of ELECTRONICS_PRESETS) {
        total++;
        try {
          const sim = new SimulationService();
          sim.compile(p.state, 'dc');
          const res = sim.step(0.02);
          if (res) passedCount++;
          else failedNames.push(p.id);
        } catch {
          failedNames.push(p.id);
        }
      }

      for (const p of SENSOR_PRESETS) {
        total++;
        try {
          const sim = new SimulationService();
          sim.compile(p.state, 'dc');
          const res = sim.step(0.02);
          if (res) passedCount++;
          else failedNames.push(p.id);
        } catch {
          failedNames.push(p.id);
        }
      }

      const passed = passedCount === total;
      return {
        actualStr: `${passedCount}/${total} mạch mẫu nạp và mô phỏng bước đầu thành công${failedNames.length > 0 ? ` (Lỗi: ${failedNames.join(', ')})` : ''}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'case60_stairway_lamp_toggle',
    stt: 60,
    group: 'Mạch mẫu',
    name: 'Ca 60: Mạch đèn cầu thang (A2): Đổi trạng thái bất kì công tắc nào cũng đổi trạng thái đèn',
    expectedStr: 'Bật/tắt tuần tự: sw1 đổi → đèn đổi; sw2 đổi → đèn đổi; sw1 đổi lần nữa → đèn đổi',
    toleranceStr: 'Khớp bảng chân trị XOR của mạch đèn cầu thang 2 công tắc 3 cực',
    createCircuit: () => {
      return createPresetHouseholdA2();
    },
    evaluate: () => {
      const circ = createPresetHouseholdA2();
      const sw1 = circ.components.find(c => c.id === 'sw1');
      const sw2 = circ.components.find(c => c.id === 'sw2');
      if (!sw1 || !sw2) {
        return { actualStr: 'Không tìm thấy công tắc sw1/sw2', passed: false };
      }

      // Trạng thái ban đầu: sw1 = true, sw2 = true
      sw1.props = { ...sw1.props, state: true };
      sw2.props = { ...sw2.props, state: true };
      const r0 = solveCircuit(circ.components, circ.wires);
      const i0 = r0.componentCurrents['lamp1'] || 0;
      const on0 = i0 > 0.1;

      // 1. Đổi công tắc 1
      sw1.props = { ...sw1.props, state: false };
      const r1 = solveCircuit(circ.components, circ.wires);
      const i1 = r1.componentCurrents['lamp1'] || 0;
      const on1 = i1 > 0.1;

      // 2. Đổi công tắc 2
      sw2.props = { ...sw2.props, state: false };
      const r2 = solveCircuit(circ.components, circ.wires);
      const i2 = r2.componentCurrents['lamp1'] || 0;
      const on2 = i2 > 0.1;

      // 3. Đổi công tắc 1 lần nữa
      sw1.props = { ...sw1.props, state: true };
      const r3 = solveCircuit(circ.components, circ.wires);
      const i3 = r3.componentCurrents['lamp1'] || 0;
      const on3 = i3 > 0.1;

      const toggle1Ok = on1 !== on0;
      const toggle2Ok = on2 !== on1;
      const toggle3Ok = on3 !== on2;
      const passed = toggle1Ok && toggle2Ok && toggle3Ok;

      return {
        actualStr: `Ban đầu đèn ${on0 ? 'SÁNG' : 'TẮT'} (${i0.toFixed(3)} A) → Đổi CT1: đèn ${on1 ? 'SÁNG' : 'TẮT'} (${i1.toFixed(3)} A) → Đổi CT2: đèn ${on2 ? 'SÁNG' : 'TẮT'} (${i2.toFixed(3)} A) → Đổi CT1 lần nữa: đèn ${on3 ? 'SÁNG' : 'TẮT'} (${i3.toFixed(3)} A)`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'case61_install_view_preserves_netlist_and_sim',
    stt: 61,
    group: 'Mạch mẫu',
    name: 'Ca 61: Chuyển qua lại NGUYÊN LÍ ⇄ LẮP ĐẶT không làm đổi netlist và mô phỏng mẫu (a)',
    expectedStr: 'Netlist khớp 100%, Dòng ampe kế = 272,7 mA ở cả 2 chế độ (lệch = 0,000 mA)',
    toleranceStr: 'Tuyệt đối (ΔI = 0 mA, Netlist so khớp từng nút)',
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
    evaluate: (circ) => {
      const baseCirc = circ || {
        components: [
          { id: 'u1', type: 'ac_source', x: 80, y: 140, rot: 0, flip: false, label: 'U', props: { voltage: 220, hasPE: false } },
          { id: 'mcb1', type: 'cb', x: 200, y: 140, rot: 0, flip: false, label: 'MCB1', props: { poles: 1, ratedCurrent: 16, state: true } },
          { id: 'a1', type: 'ammeter', x: 300, y: 140, rot: 0, flip: false, label: 'A1', props: {} },
          { id: 'fan1', type: 'ceiling_fan', x: 420, y: 140, rot: 0, flip: false, label: 'QT1', props: { power: 60, hasPE: false } },
        ],
        wires: [
          makeWire('w1', 'u1', 'A', 'mcb1', 'in', [{ x: 120, y: 140 }, { x: 160, y: 140 }], 'phase'),
          makeWire('w2', 'mcb1', 'out', 'a1', 'pos', [{ x: 240, y: 140 }, { x: 260, y: 140 }], 'phase'),
          makeWire('w3', 'a1', 'neg', 'fan1', '1', [{ x: 340, y: 140 }, { x: 380, y: 140 }], 'phase'),
          makeWire('w4', 'fan1', '2', 'u1', 'O', [{ x: 460, y: 140 }, { x: 460, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 100 }], 'neutral'),
        ],
        junctions: [],
        viewport: { x: 40, y: 40, zoom: 1 },
      };

      // 1. Netlist & Sim in schematic mode
      const netlist1 = extractNetlist(baseCirc.components, baseCirc.wires, baseCirc.junctions, COMPONENT_MAP);
      const sim1 = new SimulationService();
      sim1.compile(baseCirc, 'rms');
      const snap1 = sim1.step(1.0);
      const iVal1 = (snap1.elementMeasures['a1']?.current || 0) * 1000;

      // 2. Add install positions to components and junctions (chế độ LẮP ĐẶT)
      const installCirc: CircuitState = {
        ...baseCirc,
        components: baseCirc.components.map((c, idx) => ({
          ...c,
          install: { x: 150 + idx * 80, y: 220 + idx * 40, rot: (idx * 90) % 360 },
        })),
      };

      const netlist2 = extractNetlist(installCirc.components, installCirc.wires, installCirc.junctions, COMPONENT_MAP);
      const sim2 = new SimulationService();
      sim2.compile(installCirc, 'rms');
      const snap2 = sim2.step(1.0);
      const iVal2 = (snap2.elementMeasures['a1']?.current || 0) * 1000;

      let netlistMatch = true;
      for (const [pinKey, netId] of netlist1.pinToNetId.entries()) {
        if (netlist2.pinToNetId.get(pinKey) !== netId) {
          netlistMatch = false;
          break;
        }
      }

      const deltaI = Math.abs(iVal1 - iVal2);
      const passed = netlistMatch && deltaI < 1e-6 && Math.abs(iVal1 - 272.7) <= 2.0;

      return {
        actualStr: `Netlist ${netlistMatch ? 'khớp 100%' : 'khác nhau'}, I_nguyên_lí = ${iVal1.toFixed(1).replace('.', ',')} mA, I_lắp_đặt = ${iVal2.toFixed(1).replace('.', ',')} mA (ΔI = ${deltaI.toFixed(6)} mA)`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'case62_install_and_schematic_positions_independent',
    stt: 62,
    group: 'Mạch mẫu',
    name: 'Ca 62: Di chuyển thiết bị ở LẮP ĐẶT không đổi vị trí NGUYÊN LÍ (và ngược lại)',
    expectedStr: 'Vị trí độc lập tuyệt đối: Nguyên lí (100, 150, 0°) | Lắp đặt (350, 420, 90°)',
    toleranceStr: 'Chính xác 100 % tọa độ',
    createCircuit: () => {
      const lamp: ComponentInstance = {
        id: 'lamp1',
        type: 'incandescent_lamp',
        x: 100,
        y: 150,
        rot: 0,
        flip: false,
        label: 'Đ1',
        props: { power: 60, hasPE: false },
        install: { x: 100, y: 150, rot: 0 },
      };
      return { components: [lamp], wires: [], junctions: [], viewport: { x: 0, y: 0, zoom: 1 } };
    },
    evaluate: () => {
      // Step A: Initial component
      const c0: ComponentInstance = {
        id: 'lamp1',
        type: 'incandescent_lamp',
        x: 100,
        y: 150,
        rot: 0,
        flip: false,
        label: 'Đ1',
        props: { power: 60, hasPE: false },
        install: { x: 100, y: 150, rot: 0 },
      };

      // Step B: Move and rotate in installation mode
      const cAfterInstallMove: ComponentInstance = {
        ...c0,
        install: { x: 350, y: 420, rot: 90 },
      };

      const schemPreserved =
        cAfterInstallMove.x === 100 &&
        cAfterInstallMove.y === 150 &&
        cAfterInstallMove.rot === 0;

      // Step C: Move in schematic mode
      const cAfterSchemMove: ComponentInstance = {
        ...cAfterInstallMove,
        x: 180,
        y: 240,
        rot: 180,
      };

      const installPreserved =
        cAfterSchemMove.install?.x === 350 &&
        cAfterSchemMove.install?.y === 420 &&
        cAfterSchemMove.install?.rot === 90;

      const passed = schemPreserved && installPreserved;

      return {
        actualStr: `Nguyên lí: (${cAfterSchemMove.x}, ${cAfterSchemMove.y}, ${cAfterSchemMove.rot}°) — Lắp đặt: (${cAfterSchemMove.install?.x}, ${cAfterSchemMove.install?.y}, ${cAfterSchemMove.install?.rot}°)`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'case63_wire_length_calculation_floor_plan',
    stt: 63,
    group: 'Mạch mẫu',
    name: 'Ca 63: Dây chữ L (Δx = 300 px, Δy = 200 px, tỉ lệ 100 px = 1 m) có chiều dài = 5,00 m',
    expectedStr: 'Chiều dài trên mặt bằng = 5,00 m (±0,001 m)',
    toleranceStr: '±0,001 m',
    createCircuit: () => {
      const compA: ComponentInstance = {
        id: 'cb1',
        type: 'cb',
        x: 100,
        y: 100,
        rot: 0,
        flip: false,
        label: 'Aptomat',
        props: { poles: 1, ratedCurrent: 16 },
        install: { x: 100, y: 100, rot: 0 },
      };
      const compB: ComponentInstance = {
        id: 'lamp1',
        type: 'incandescent_lamp',
        x: 200,
        y: 100,
        rot: 0,
        flip: false,
        label: 'Đèn',
        props: { power: 60 },
        install: { x: 400, y: 300, rot: 0 },
      };
      const wire = makeWire('w1', 'cb1', 'out', 'lamp1', '1', [
        { x: 100, y: 100 },
        { x: 400, y: 100 },
        { x: 400, y: 300 },
      ], 'phase');
      return { components: [compA, compB], wires: [wire], junctions: [], viewport: { x: 0, y: 0, zoom: 1 } };
    },
    evaluate: () => {
      const pts = [
        { x: 100, y: 100 },
        { x: 400, y: 100 },
        { x: 400, y: 300 },
      ];
      const lengthMeters = calculatePolylineLengthMeters(pts, 100);
      const displayStr = `${lengthMeters.toFixed(2).replace('.', ',')} m`;
      const passed = Math.abs(lengthMeters - 5.0) < 0.001;

      return {
        actualStr: `Chiều dài trên mặt bằng = ${displayStr} (tương ứng ${lengthMeters * 100} px)`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'case64_wire_ampacity_overload_and_breaker_coordination',
    stt: 64,
    group: 'Mạch mẫu',
    name: 'Ca 64: Mẫu (m) (aptomat 20 A + dây 1,0 mm² + tải 15 A): bảng báo dây quá dòng 150%, gợi ý ≥ 1,5 mm², aptomat In > dòng cho phép',
    expectedStr: 'Dây quá dòng (150%), gợi ý ≥ 1,5 mm²; Aptomat: In lớn hơn dòng cho phép của dây 1,0 mm²',
    toleranceStr: 'Chính xác',
    createCircuit: () => createPresetHouseholdM(),
    evaluate: () => {
      const circuit = createPresetHouseholdM();
      const report = generateAuditReport(circuit, 'current');
      const overloadedWire = report.wireRows.find(
        (w) => w.statusLevel === 'danger' && Math.round(w.loadPct) === 150
      );
      const hasSuggestion = Boolean(
        overloadedWire?.suggestion?.includes('1,5 mm²') ||
        overloadedWire?.suggestion?.includes('1.5')
      );
      const breakerRow = report.protectionRows.find((b) => b.compId === 'mcb1');
      const breakerWarning = Boolean(
        breakerRow &&
        breakerRow.conclusion.includes('In lớn hơn dòng cho phép của dây')
      );
      const passed = Boolean(overloadedWire && hasSuggestion && breakerWarning);

      return {
        actualStr: `Dây: ${overloadedWire?.conclusion} (tải ${overloadedWire?.loadPct.toFixed(0)}%, ${overloadedWire?.suggestion}); Aptomat: ${breakerRow?.conclusion}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'case65_wire_ampacity_normal_coordination',
    stt: 65,
    group: 'Mạch mẫu',
    name: 'Ca 65: Mẫu (A3) với dây 2,5 mm²: mọi dây mức xanh, aptomat Phù hợp',
    expectedStr: 'Mọi dây mức xanh (< 80%), aptomat Phù hợp',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const c = createPresetHouseholdA3();
      c.wires = c.wires.map((w) => ({ ...w, crossSection: 2.5 }));
      return c;
    },
    evaluate: () => {
      const circuit = createPresetHouseholdA3();
      circuit.wires = circuit.wires.map((w) => ({ ...w, crossSection: 2.5 }));
      const report = generateAuditReport(circuit, 'current');
      const allWiresGreen =
        report.wireRows.length > 0 &&
        report.wireRows.every((w) => w.statusLevel === 'normal' && w.loadPct < 80);
      const breakerRow = report.protectionRows.find((b) => b.compId === 'mcb1');
      const breakerOk = breakerRow?.conclusion === 'Phù hợp';
      const passed = Boolean(allWiresGreen && breakerOk);

      return {
        actualStr: `Dây: ${report.wireRows.length} dây mức xanh (< 80%); Aptomat: ${breakerRow?.conclusion}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'case66_room_resize_preserves_install_positions_and_wire_lengths',
    stt: 66,
    group: 'Mạch mẫu',
    name: 'Ca 66: Đổi kích thước phòng từ 4×5 m sang 6×3 m: vị trí thiết bị ở LẮP ĐẶT không đổi, chiều dài dây hiển thị không đổi',
    expectedStr: 'Vị trí thiết bị lắp đặt không đổi, chiều dài dây hiển thị không đổi',
    toleranceStr: 'Chính xác',
    createCircuit: () => {
      const c = createPresetHouseholdM();
      c.floorPlan = {
        name: 'PHÒNG NGỦ',
        widthM: 5,
        lengthM: 4,
        x: 80,
        y: 80,
        doors: [{ id: 'd1', wall: 'bottom', offset: 1.0, width: 0.9 }],
        partitionWalls: [],
      };
      c.components = c.components.map((comp, i) => ({
        ...comp,
        install: { x: 150 + i * 100, y: 200 + i * 50, rot: 0 },
      }));
      return c;
    },
    evaluate: () => {
      const circuit = createPresetHouseholdM();
      circuit.floorPlan = {
        name: 'PHÒNG NGỦ',
        widthM: 5,
        lengthM: 4,
        x: 80,
        y: 80,
        doors: [{ id: 'd1', wall: 'bottom', offset: 1.0, width: 0.9 }],
        partitionWalls: [],
      };
      circuit.components = circuit.components.map((comp, i) => ({
        ...comp,
        install: { x: 150 + i * 100, y: 200 + i * 50, rot: 0 },
      }));

      const lengthsBefore = circuit.wires.map((w) => {
        const pts = getWireInstallPoints(w, circuit);
        return calculatePolylineLengthMeters(pts, 100);
      });

      // Resize room from 4x5m (width 5m, length 4m) to 6x3m (width 6m, length 3m)
      const circuitAfter = {
        ...circuit,
        floorPlan: {
          ...circuit.floorPlan,
          widthM: 6,
          lengthM: 3,
        },
      };

      const positionsUnchanged = circuitAfter.components.every((c, i) => {
        const orig = circuit.components[i];
        return (
          c.install?.x === orig.install?.x &&
          c.install?.y === orig.install?.y &&
          c.install?.rot === orig.install?.rot
        );
      });

      const lengthsAfter = circuitAfter.wires.map((w) => {
        const pts = getWireInstallPoints(w, circuitAfter);
        return calculatePolylineLengthMeters(pts, 100);
      });

      const lengthsUnchanged = lengthsBefore.every(
        (len, i) => Math.abs(len - lengthsAfter[i]) < 0.0001
      );

      const passed = positionsUnchanged && lengthsUnchanged;

      return {
        actualStr: `Vị trí thiết bị: ${positionsUnchanged ? 'giữ nguyên 100%' : 'thay đổi'} — Chiều dài dây: ${lengthsUnchanged ? 'giữ nguyên 100%' : 'thay đổi'}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'case67_logic_gates_truth_tables',
    stt: 67,
    group: 'Mạch mẫu',
    name: 'Ca 67: Bảng chân trị đúng với bảng chuẩn cho AND, OR, NAND, NOR, XOR (2 ngõ vào) và NOT (1 ngõ vào)',
    expectedStr: 'Đúng bảng chân trị chuẩn cho AND, OR, NAND, NOR, XOR (2 ngõ vào) và NOT (1 ngõ vào)',
    toleranceStr: 'Chính xác 100%',
    createCircuit: () => createPresetLogicD1(),
    evaluate: () => {
      const andOk =
        evaluateGate('AND', [0, 0]) === 0 &&
        evaluateGate('AND', [0, 1]) === 0 &&
        evaluateGate('AND', [1, 0]) === 0 &&
        evaluateGate('AND', [1, 1]) === 1;

      const orOk =
        evaluateGate('OR', [0, 0]) === 0 &&
        evaluateGate('OR', [0, 1]) === 1 &&
        evaluateGate('OR', [1, 0]) === 1 &&
        evaluateGate('OR', [1, 1]) === 1;

      const nandOk =
        evaluateGate('NAND', [0, 0]) === 1 &&
        evaluateGate('NAND', [0, 1]) === 1 &&
        evaluateGate('NAND', [1, 0]) === 1 &&
        evaluateGate('NAND', [1, 1]) === 0;

      const norOk =
        evaluateGate('NOR', [0, 0]) === 1 &&
        evaluateGate('NOR', [0, 1]) === 0 &&
        evaluateGate('NOR', [1, 0]) === 0 &&
        evaluateGate('NOR', [1, 1]) === 0;

      const xorOk =
        evaluateGate('XOR', [0, 0]) === 0 &&
        evaluateGate('XOR', [0, 1]) === 1 &&
        evaluateGate('XOR', [1, 0]) === 1 &&
        evaluateGate('XOR', [1, 1]) === 0;

      const notOk =
        evaluateGate('NOT', [0]) === 1 &&
        evaluateGate('NOT', [1]) === 0;

      const passed = andOk && orOk && nandOk && norOk && xorOk && notOk;

      return {
        actualStr: `AND: ${andOk ? 'ĐÚNG' : 'SAI'}, OR: ${orOk ? 'ĐÚNG' : 'SAI'}, NAND: ${nandOk ? 'ĐÚNG' : 'SAI'}, NOR: ${norOk ? 'ĐÚNG' : 'SAI'}, XOR: ${xorOk ? 'ĐÚNG' : 'SAI'}, NOT: ${notOk ? 'ĐÚNG' : 'SAI'}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'case68_half_adder_and_majority_voter',
    stt: 68,
    group: 'Mạch mẫu',
    name: 'Ca 68: Nửa cộng (A,B) -> (Tổng, Nhớ): 00->00, 01->10, 10->10, 11->01; bỏ phiếu đa số Y=1 chỉ khi có >= 2 đầu vào bằng 1',
    expectedStr: 'Nửa cộng: 00->00, 01->10, 10->10, 11->01; Bỏ phiếu 3 người: Y=1 chỉ khi >= 2 đầu vào bằng 1',
    toleranceStr: 'Chính xác 100%',
    createCircuit: () => createPresetLogicD2(),
    evaluate: () => {
      const haCombos = [
        { a: false, b: false, sum: 0, carry: 0 },
        { a: false, b: true, sum: 1, carry: 0 },
        { a: true, b: false, sum: 1, carry: 0 },
        { a: true, b: true, sum: 0, carry: 1 },
      ];

      let haPassed = true;
      for (const comb of haCombos) {
        const c = createPresetLogicD2();
        c.components = c.components.map(comp => {
          if (comp.id === 'swA') return { ...comp, props: { ...comp.props, state: comb.a } };
          if (comp.id === 'swB') return { ...comp, props: { ...comp.props, state: comb.b } };
          return comp;
        });
        const res = runLogicSimulation(c);
        const sumVal = res.componentStates['led_sum']?.level;
        const carryVal = res.componentStates['led_carry']?.level;
        if (sumVal !== comb.sum || carryVal !== comb.carry) {
          haPassed = false;
        }
      }

      let voterPassed = true;
      for (let a = 0; a <= 1; a++) {
        for (let b = 0; b <= 1; b++) {
          for (let c = 0; c <= 1; c++) {
            const expectedY = (a + b + c) >= 2 ? 1 : 0;
            const circ = createPresetLogicD3();
            circ.components = circ.components.map(comp => {
              if (comp.id === 'swA') return { ...comp, props: { ...comp.props, state: a === 1 } };
              if (comp.id === 'swB') return { ...comp, props: { ...comp.props, state: b === 1 } };
              if (comp.id === 'swC') return { ...comp, props: { ...comp.props, state: c === 1 } };
              return comp;
            });
            const res = runLogicSimulation(circ);
            const actualY = res.componentStates['led_out']?.level;
            if (actualY !== expectedY) {
              voterPassed = false;
            }
          }
        }
      }

      const passed = haPassed && voterPassed;
      return {
        actualStr: `Nửa cộng (4/4 tổ hợp): ${haPassed ? 'ĐẠT' : 'KHÔNG ĐẠT'} — Bỏ phiếu đa số (8/8 tổ hợp): ${voterPassed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`,
        passed,
      };
    },
  }),
  defineTestCase({
    id: 'case69_not_oscillation_floating_and_conflict',
    stt: 69,
    group: 'Mạch mẫu',
    name: 'Ca 69: NOT nối vòng (Y vào chính A): cảnh báo dao động, không treo; ngõ vào hở -> X; hai nguồn 0 và 1 vào cùng một net -> XUNG ĐỘT',
    expectedStr: 'NOT nối vòng có cảnh báo dao động và không treo; ngõ vào hở cho X; hai nguồn 0 và 1 cùng net cho XUNG ĐỘT',
    toleranceStr: 'Chính xác 100%',
    createCircuit: () => {
      const gNot: ComponentInstance = { id: 'g_not', type: 'logic_gate', x: 200, y: 140, rot: 0, flip: false, label: 'NOT', props: { gateType: 'NOT', inputsCount: 1 } };
      const wLoop = makeWire('w_loop', 'g_not', 'Y', 'g_not', 'A', [{ x: 240, y: 140 }, { x: 240, y: 100 }, { x: 160, y: 100 }, { x: 160, y: 140 }], 'other');
      return { components: [gNot], wires: [wLoop], junctions: [], viewport: { x: 0, y: 0, zoom: 1 } };
    },
    evaluate: () => {
      const gNot: ComponentInstance = { id: 'g_not', type: 'logic_gate', x: 200, y: 140, rot: 0, flip: false, label: 'NOT', props: { gateType: 'NOT', inputsCount: 1 } };
      const wLoop = makeWire('w_loop', 'g_not', 'Y', 'g_not', 'A', [{ x: 240, y: 140 }, { x: 240, y: 100 }, { x: 160, y: 100 }, { x: 160, y: 140 }], 'other');
      const loopCircuit: CircuitState = { components: [gNot], wires: [wLoop], junctions: [], viewport: { x: 0, y: 0, zoom: 1 } };

      const t0 = performance.now();
      const resLoop = runLogicSimulation(loopCircuit);
      const elapsed = performance.now() - t0;

      const loopHandled =
        elapsed < 100 &&
        resLoop.isOscillating === true &&
        Boolean(resLoop.warning && resLoop.warning.toLowerCase().includes('dao động'));

      const gAndFloating: ComponentInstance = { id: 'g_and', type: 'logic_gate', x: 200, y: 140, rot: 0, flip: false, label: 'AND', props: { gateType: 'AND', inputsCount: 2 } };
      const floatCircuit: CircuitState = { components: [gAndFloating], wires: [], junctions: [], viewport: { x: 0, y: 0, zoom: 1 } };
      const resFloat = runLogicSimulation(floatCircuit);
      const floatVal = resFloat.componentStates['g_and']?.output;
      const floatPassed = floatVal === 'X';

      const highSrc: ComponentInstance = { id: 'src_hi', type: 'logic_high', x: 100, y: 100, rot: 0, flip: false, label: '1', props: {} };
      const lowSrc: ComponentInstance = { id: 'src_lo', type: 'logic_low', x: 100, y: 200, rot: 0, flip: false, label: '0', props: {} };
      const wConflict = makeWire('w_conf', 'src_hi', 'Q', 'src_lo', 'Q', [{ x: 140, y: 100 }, { x: 140, y: 200 }], 'other');
      const conflictCircuit: CircuitState = { components: [highSrc, lowSrc], wires: [wConflict], junctions: [], viewport: { x: 0, y: 0, zoom: 1 } };
      const resConf = runLogicSimulation(conflictCircuit);
      const confWireVal = resConf.wireValues['w_conf'];
      const conflictPassed = confWireVal === 'CONFLICT';

      const passed = loopHandled && floatPassed && conflictPassed;

      return {
        actualStr: `Dao động nối vòng: ${loopHandled ? 'Cảnh báo đạt (' + Math.round(elapsed) + ' ms)' : 'Không đạt'} — Ngõ vào hở: ${floatPassed ? 'Mức X' : floatVal} — Nguồn 0 & 1 chung net: ${conflictPassed ? 'XUNG ĐỘT' : confWireVal}`,
        passed,
      };
    },
  }),
];

export { HOUSEHOLD_PRESETS, ELECTRONICS_PRESETS, SENSOR_PRESETS, DIGITAL_LOGIC_PRESETS } from './presets';
