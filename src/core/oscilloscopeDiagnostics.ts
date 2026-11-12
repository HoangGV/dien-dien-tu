/**
 * Transient Analysis Diagnostics (for Self-Test View)
 * Prints raw numerical values for Section 3:
 * A. Direct calls to runTransient (pure math/solver check)
 * B. Through the exact UI pipeline on presets (v), (x), (y)
 */

import {
  createPresetElectronicsV,
  createPresetElectronicsX,
  createPresetElectronicsY,
} from './presets';
import { runTransient } from './solver/transient';
import { extractNetlist } from './netlist';
import { COMPONENT_MAP } from './registry';

export interface OscDiagnosticsData {
  a1: { t: number; expected: number; actual: number; passed: boolean }[];
  a1Passed: boolean;

  a2: { tMs: number; expected: number; actual: number; passed: boolean }[];
  a2Passed: boolean;

  a3: {
    maxV: number;
    minV: number;
    maxExpected: number;
    minExpected: number;
    passed: boolean;
  };
  a3Passed: boolean;

  a4: {
    samples: { step: number; t: number }[];
    dt: number;
    isMonotonic: boolean;
    t0IsZero: boolean;
    passed: boolean;
  };
  a4Passed: boolean;

  b1: {
    vAt01: number;
    expected: number;
    netCh1: string;
    netCapPos: string;
    netsMatch: boolean;
    passed: boolean;
  };

  b2: {
    vAt5ms: number;
    expected: number;
    netCh1: string;
    netSrcPos: string;
    netsMatch: boolean;
    passed: boolean;
  };

  b3: {
    maxV: number;
    minV: number;
    netCh2: string;
    netLoadPos: string;
    netsMatch: boolean;
    passed: boolean;
  };
  bPassed: boolean;

  conclusion: string;
  conclusionType: 'success' | 'solver_rc_error' | 'solver_ac_error' | 'pipeline_error';
  rawText: string;
}

export function runOscilloscopeDiagnostics(): OscDiagnosticsData {
  // ==========================================
  // PHẦN A: GỌI TRỰC TIẾP runTransient
  // ==========================================

  // A1: Mạch RC (Nguồn 5V + R=1k + C=100uF, tStop 1s)
  const rcCirc = createPresetElectronicsV();
  const resA1 = runTransient(rcCirc, { tStop: 1.0, probes: ['c1:pos'] });

  const a1Expected: Record<number, number> = {
    0: 0,
    0.05: 1.97,
    0.1: 3.16,
    0.2: 4.32,
    0.5: 4.97,
  };
  const a1Times = [0, 0.05, 0.1, 0.2, 0.5];
  const a1 = a1Times.map((t) => {
    const idx = Math.min(resA1.t.length - 1, Math.round(t / resA1.dt));
    const actual = Math.round((resA1.v[0]?.[idx] ?? 0) * 100) / 100;
    const exp = a1Expected[t];
    // Tolerance ±3% of 5V (±0.15 V)
    const passed = Math.abs(actual - exp) <= 0.15;
    return { t, expected: exp, actual, passed };
  });
  const a1Passed = a1.every((item) => item.passed);

  // A2: Nguồn xoay chiều sin 5 V đỉnh 50 Hz đo trực tiếp, tStop 20 ms
  const sinCirc = createPresetElectronicsX();
  const resA2 = runTransient(sinCirc, { tStop: 0.02, probes: ['src1:pos'] });

  const a2Expected: Record<number, number> = {
    0: 0,
    5: 5.0,
    10: 0,
    15: -5.0,
    20: 0,
  };
  const a2TimesMs = [0, 5, 10, 15, 20];
  const a2 = a2TimesMs.map((tMs) => {
    const tSec = tMs / 1000;
    const idx = Math.min(resA2.t.length - 1, Math.round(tSec / resA2.dt));
    const actual = Math.round((resA2.v[0]?.[idx] ?? 0) * 100) / 100;
    const exp = a2Expected[tMs];
    const passed = Math.abs(actual - exp) <= 0.15;
    return { tMs, expected: exp, actual, passed };
  });
  const a2Passed = a2.every((item) => item.passed);

  // A3: Mạch chỉnh lưu nửa chu kì (Nguồn 5V đỉnh 50 Hz -> Diode -> 1k, 40 ms)
  const rectCirc = createPresetElectronicsY();
  const resA3 = runTransient(rectCirc, { tStop: 0.04, probes: ['r1:1'] });
  let a3Max = -Infinity;
  let a3Min = Infinity;
  if (resA3.v[0]) {
    for (let i = 0; i < resA3.v[0].length; i++) {
      const v = resA3.v[0][i];
      if (v > a3Max) a3Max = v;
      if (v < a3Min) a3Min = v;
    }
  }
  const a3MaxR = Math.round(a3Max * 100) / 100;
  const a3MinR = Math.round(a3Min * 100) / 100;
  const a3Passed = Math.abs(a3MaxR - 4.3) <= 0.15 && a3MinR >= -0.05;
  const a3 = {
    maxV: a3MaxR,
    minV: a3MinR,
    maxExpected: 4.3,
    minExpected: -0.05,
    passed: a3Passed,
  };

  // A4: Kiểm tra thời gian t của 5 mẫu đầu và dt
  const a4Samples: { step: number; t: number }[] = [];
  let isMonotonic = true;
  for (let k = 0; k < Math.min(5, resA1.t.length); k++) {
    a4Samples.push({ step: k, t: resA1.t[k] });
    if (k > 0 && resA1.t[k] <= resA1.t[k - 1]) {
      isMonotonic = false;
    }
  }
  const t0IsZero = resA1.t[0] === 0;
  const a4Passed = t0IsZero && isMonotonic && resA1.dt > 0;
  const a4 = {
    samples: a4Samples,
    dt: resA1.dt,
    isMonotonic,
    t0IsZero,
    passed: a4Passed,
  };

  // ==========================================
  // PHẦN B: QUA ĐÚNG ĐƯỜNG ỐNG GIAO DIỆN CỦA MẪU (v), (x), (y)
  // ==========================================

  // B1: Mẫu (v) nạp tụ RC qua dao động kí
  const presetV = createPresetElectronicsV();
  const netlistV = extractNetlist(presetV.components, presetV.wires, presetV.junctions, COMPONENT_MAP);
  const netCh1_V = netlistV.pinToNetId.get('osc1:ch1') || '';
  const netCapPos_V = netlistV.pinToNetId.get('c1:pos') || '';
  const netsMatchV = Boolean(netCh1_V && netCapPos_V && netCh1_V === netCapPos_V);

  const resB1 = runTransient(presetV, { tStop: 1.0, probes: ['osc1:ch1', 'osc1:ch2'] });
  const idx01 = Math.min(resB1.t.length - 1, Math.round(0.1 / resB1.dt));
  const vAt01 = Math.round((resB1.v[0]?.[idx01] ?? 0) * 100) / 100;
  const b1Passed = netsMatchV && Math.abs(vAt01 - 3.16) <= 0.15;
  const b1 = {
    vAt01,
    expected: 3.16,
    netCh1: netCh1_V,
    netCapPos: netCapPos_V,
    netsMatch: netsMatchV,
    passed: b1Passed,
  };

  // B2: Mẫu (x) nguồn sin qua dao động kí
  const presetX = createPresetElectronicsX();
  const netlistX = extractNetlist(presetX.components, presetX.wires, presetX.junctions, COMPONENT_MAP);
  const netCh1_X = netlistX.pinToNetId.get('osc1:ch1') || '';
  const netSrcPos_X = netlistX.pinToNetId.get('src1:pos') || '';
  const netsMatchX = Boolean(netCh1_X && netSrcPos_X && netCh1_X === netSrcPos_X);

  const resB2 = runTransient(presetX, { tStop: 0.02, probes: ['osc1:ch1', 'osc1:ch2'] });
  const idx5ms = Math.min(resB2.t.length - 1, Math.round(0.005 / resB2.dt));
  const vAt5ms = Math.round((resB2.v[0]?.[idx5ms] ?? 0) * 100) / 100;
  const b2Passed = netsMatchX && Math.abs(vAt5ms - 5.0) <= 0.15;
  const b2 = {
    vAt5ms,
    expected: 5.0,
    netCh1: netCh1_X,
    netSrcPos: netSrcPos_X,
    netsMatch: netsMatchX,
    passed: b2Passed,
  };

  // B3: Mẫu (y) chỉnh lưu qua dao động kí
  const presetY = createPresetElectronicsY();
  const netlistY = extractNetlist(presetY.components, presetY.wires, presetY.junctions, COMPONENT_MAP);
  const netCh2_Y = netlistY.pinToNetId.get('osc1:ch2') || '';
  const netLoadPos_Y = netlistY.pinToNetId.get('r1:1') || '';
  const netsMatchY = Boolean(netCh2_Y && netLoadPos_Y && netCh2_Y === netLoadPos_Y);

  const resB3 = runTransient(presetY, { tStop: 0.04, probes: ['osc1:ch1', 'osc1:ch2'] });
  let b3Max = -Infinity;
  let b3Min = Infinity;
  if (resB3.v[1]) {
    for (let i = 0; i < resB3.v[1].length; i++) {
      const v = resB3.v[1][i];
      if (v > b3Max) b3Max = v;
      if (v < b3Min) b3Min = v;
    }
  }
  const b3MaxR = Math.round(b3Max * 100) / 100;
  const b3MinR = Math.round(b3Min * 100) / 100;
  const b3Passed = netsMatchY && Math.abs(b3MaxR - 4.3) <= 0.15 && b3MinR >= -0.05;
  const b3 = {
    maxV: b3MaxR,
    minV: b3MinR,
    netCh2: netCh2_Y,
    netLoadPos: netLoadPos_Y,
    netsMatch: netsMatchY,
    passed: b3Passed,
  };

  const bPassed = b1Passed && b2Passed && b3Passed;

  // ==========================================
  // DÒNG KẾT LUẬN TỰ ĐỘNG
  // ==========================================
  let conclusion = '';
  let conclusionType: OscDiagnosticsData['conclusionType'] = 'success';

  if (!a1Passed) {
    conclusion = 'Lỗi ở mô hình tụ hoặc bước thời gian trong bộ giải';
    conclusionType = 'solver_rc_error';
  } else if (!a2Passed) {
    conclusion = 'Lỗi ở nguồn xoay chiều hoặc cách truyền thời gian t';
    conclusionType = 'solver_ac_error';
  } else if (a1Passed && a2Passed && a3Passed && !bPassed) {
    conclusion = 'Lỗi ở khâu biên dịch/đọc nút CH hoặc dữ liệu mẫu';
    conclusionType = 'pipeline_error';
  } else {
    conclusion = 'Bộ giải và đường ống đúng; nếu đồ thị vẫn sai thì lỗi ở khâu vẽ';
    conclusionType = 'success';
  }

  // Raw text export for clipboard
  const rawTextLines = [
    '=== KIỂM TRA PHÂN TÍCH QUÁ ĐỘ (TRANSIENT ANALYSIS) ===',
    '[A. GỌI TRỰC TIẾP runTransient]',
    'A1 (RC 1s): ' + a1.map((x) => `t=${x.t}s: ${x.actual}V (exp ${x.expected}V)`).join(', ') + ` -> ${a1Passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`,
    'A2 (SIN 20ms): ' + a2.map((x) => `t=${x.tMs}ms: ${x.actual}V (exp ${x.expected}V)`).join(', ') + ` -> ${a2Passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`,
    `A3 (CHỈNH LƯU 40ms): max=${a3.maxV}V (exp ~4.3V), min=${a3.minV}V (exp >= -0.05V) -> ${a3Passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`,
    `A4 (THỜI GIAN): dt=${(a4.dt * 1e6).toFixed(1)} µs, t[0]=${a4.samples[0]?.t}s, tăng đơn điệu=${a4.isMonotonic} -> ${a4Passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`,
    '',
    '[B. QUA ĐƯỜNG ỐNG GIAO DIỆN]',
    `B1 (Mẫu v - RC): V(0.1s)=${b1.vAt01}V (exp 3.16V), nút CH1=${b1.netCh1}, nút tụ(+)=${b1.netCapPos}, trùng=${b1.netsMatch} -> ${b1.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`,
    `B2 (Mẫu x - SIN): V(5ms)=${b2.vAt5ms}V (exp 5.0V), nút CH1=${b2.netCh1}, nút nguồn(+)=${b2.netSrcPos}, trùng=${b2.netsMatch} -> ${b2.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`,
    `B3 (Mẫu y - RECT): max=${b3.maxV}V, min=${b3.minV}V, nút CH2=${b3.netCh2}, nút tải(+)=${b3.netLoadPos}, trùng=${b3.netsMatch} -> ${b3.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`,
    '',
    `KẾT LUẬN: ${conclusion}`,
  ];

  return {
    a1,
    a1Passed,
    a2,
    a2Passed,
    a3,
    a3Passed,
    a4,
    a4Passed,
    b1,
    b2,
    b3,
    bPassed,
    conclusion,
    conclusionType,
    rawText: rawTextLines.join('\n'),
  };
}
