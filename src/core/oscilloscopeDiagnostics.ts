import { createPresetElectronicsV, createPresetElectronicsX } from './presets';
import { SimulationService } from './simulationService';
import { oscilloscopeService } from './oscilloscopeService';
import { extractNetlist } from './netlist';
import { COMPONENT_MAP } from './registry';

export interface OscDiagnosticsData {
  d1: { t: number; expected: number; actual: number; passed: boolean }[];
  d1Passed: boolean;
  d2: { targetT: number; sampleT: number; v1: number; passed: boolean }[];
  d2Passed: boolean;
  d3: {
    sampleCount: number;
    timeSpanCovered: string;
    sampleIntervalMs: number;
    netCh1: string;
    netCapPos: string;
    netsMatch: boolean;
    firstT: number;
    lastT: number;
  };
  d4: {
    points: { t: number; v: number; x: number; y: number }[];
    minY: number;
    maxY: number;
    passed: boolean;
  };
  d5: { tMs: number; expected: number; actual: number; passed: boolean }[];
  d5Passed: boolean;
  d6: { step: number; t: number; dt: number; isMonotonic: boolean }[];
  d6Passed: boolean;
  conclusion: string;
  conclusionType: 'success' | 'solver_error' | 'sample_error' | 'render_error';
  rawText: string;
}

export function runOscilloscopeDiagnostics(): OscDiagnosticsData {
  // ==========================================
  // D1 & D2 & D3 & D4: Mẫu (v) nạp tụ RC chạy 1s
  // ==========================================
  const circV = createPresetElectronicsV();
  const simV = new SimulationService();
  simV.compile(circV, 'dc');
  oscilloscopeService.clear();
  oscilloscopeService.setHeld(false);
  simV.reset();

  const d1Expected: Record<number, number> = {
    0: 0,
    0.05: 1.97,
    0.1: 3.16,
    0.2: 4.32,
    0.5: 4.97,
    1.0: 5.00,
  };
  const targetTimes = [0, 0.05, 0.1, 0.2, 0.5, 1.0];

  const d1SnapshotVoltages: Record<number, number> = {};
  const snap0 = simV.step(0);
  d1SnapshotVoltages[0] = snap0.solverResult?.componentVoltages?.['c1'] ?? 0;

  const dt = 0.001; // 1 ms
  const totalSteps = 1000;
  for (let s = 1; s <= totalSteps; s++) {
    const snap = simV.step(dt);
    const tRounded = Math.round(s * dt * 10000) / 10000;
    if (targetTimes.includes(tRounded)) {
      d1SnapshotVoltages[tRounded] = snap.solverResult?.componentVoltages?.['c1'] ?? 0;
    }
  }

  // D1 table
  const d1: OscDiagnosticsData['d1'] = targetTimes.map((t) => {
    const exp = d1Expected[t];
    const act = d1SnapshotVoltages[t] ?? 0;
    // Tolerance ±3% of 5V (±0.15 V)
    const passed = Math.abs(act - exp) <= 0.15;
    return { t, expected: exp, actual: Math.round(act * 100) / 100, passed };
  });
  const d1Passed = d1.every((item) => item.passed);

  // D2 table (from oscilloscope samples)
  const samplesV = oscilloscopeService.getSamples();
  const d2: OscDiagnosticsData['d2'] = targetTimes.map((targetT) => {
    let closest = samplesV[0];
    let minDiff = Infinity;
    for (const s of samplesV) {
      const diff = Math.abs(s.t - targetT);
      if (diff < minDiff) {
        minDiff = diff;
        closest = s;
      }
    }
    const sampleT = closest ? Math.round(closest.t * 1000) / 1000 : 0;
    const v1 = closest ? Math.round(closest.v1 * 100) / 100 : 0;
    const exp = d1Expected[targetT];
    const passed = Math.abs(v1 - exp) <= 0.15;
    return { targetT, sampleT, v1, passed };
  });
  const d2Passed = d2.every((item) => item.passed);

  // D3: Buffer metadata & netlist check
  const netlist = extractNetlist(circV.components, circV.wires, circV.junctions, COMPONENT_MAP);
  const netCh1 = netlist.pinToNetId.get('osc1:ch1') || 'Không kết nối';
  const netCapPos = netlist.pinToNetId.get('c1:pos') || 'Không kết nối';
  const netsMatch = netCh1 === netCapPos && netCh1 !== 'Không kết nối';
  const firstT = samplesV[0]?.t ?? 0;
  const lastT = samplesV[samplesV.length - 1]?.t ?? 0;

  const d3: OscDiagnosticsData['d3'] = {
    sampleCount: samplesV.length,
    timeSpanCovered: `${firstT.toFixed(3)} s – ${lastT.toFixed(3)} s (${((lastT - firstT) * 1000).toFixed(0)} ms)`,
    sampleIntervalMs: 1.0,
    netCh1,
    netCapPos,
    netsMatch,
    firstT: Math.round(firstT * 1000) / 1000,
    lastT: Math.round(lastT * 1000) / 1000,
  };

  // D4: Drawing calculations (100 ms/div × 10 divs = 1.0 s window)
  const timeDiv = 0.1; // 100 ms/div
  const tSpan = 10 * timeDiv; // 1.0 s
  const tStart = 0;
  const width = 500;
  const height = 300;
  const rows = 8;
  const dy = height / rows; // 37.5 px
  const yMid = height / 2; // 150 px
  const vDiv = 1.0; // 1 V/div
  const offset = 0;

  const points: { t: number; v: number; x: number; y: number }[] = [];
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < samplesV.length; i++) {
    const s = samplesV[i];
    if (s.t < tStart || s.t > tStart + tSpan) continue;
    const x = Math.round((((s.t - tStart) / tSpan) * width) * 10) / 10;
    const y = Math.round((yMid - offset * dy - (s.v1 / vDiv) * dy) * 10) / 10;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (points.length < 10) {
      points.push({ t: Math.round(s.t * 10000) / 10000, v: Math.round(s.v1 * 100) / 100, x, y });
    }
  }

  // Expectation: at t=0, V=0 -> y=150. At t=1.0, V=5.0 -> y = 150 - 5 * 37.5 = -37.5 (or offset)
  // Check that minY < maxY and points show a monotonically decreasing y (since higher voltage is higher on screen)
  const d4Passed = minY < maxY && points.length >= 10 && points[points.length - 1].y < points[0].y;
  const d4: OscDiagnosticsData['d4'] = {
    points,
    minY: Math.round(minY * 10) / 10,
    maxY: Math.round(maxY * 10) / 10,
    passed: d4Passed,
  };

  // ==========================================
  // D5: Nguồn xoay chiều 5V đỉnh 50 Hz chạy 60 ms
  // ==========================================
  const circX = createPresetElectronicsX();
  const simX = new SimulationService();
  simX.compile(circX, 'dc');
  oscilloscopeService.clear();
  oscilloscopeService.setHeld(false);
  simX.reset();

  const d5Targets = [0, 0.005, 0.010, 0.015, 0.020];
  const d5Expected: Record<number, number> = {
    0: 0,
    0.005: 5.0,
    0.010: 0,
    0.015: -5.0,
    0.020: 0,
  };

  const d5Voltages: Record<number, number> = {};
  const snapX0 = simX.step(0);
  const oscCompX0 = circX.components.find((c) => c.id === 'osc1');
  d5Voltages[0] = Number(oscCompX0?.props._vCh1 ?? 0);

  const dtX = 0.0002; // 0.2 ms
  const totalStepsX = 300; // 60 ms
  for (let s = 1; s <= totalStepsX; s++) {
    simX.step(dtX);
    const tRounded = Math.round(s * dtX * 10000) / 10000;
    if (d5Targets.includes(tRounded)) {
      const osc = circX.components.find((c) => c.id === 'osc1');
      d5Voltages[tRounded] = Number(osc?.props._vCh1 ?? 0);
    }
  }

  const d5: OscDiagnosticsData['d5'] = d5Targets.map((tSec) => {
    const tMs = Math.round(tSec * 1000);
    const exp = d5Expected[tSec];
    const act = d5Voltages[tSec] ?? 0;
    const passed = Math.abs(act - exp) <= 0.15;
    return { tMs, expected: exp, actual: Math.round(act * 100) / 100, passed };
  });
  const d5Passed = d5.every((item) => item.passed);

  // ==========================================
  // D6: Kiểm tra t tăng đơn điệu qua 5 bước liên tiếp
  // ==========================================
  const simD6 = new SimulationService();
  simD6.compile(circV, 'dc');
  simD6.reset();

  const d6: OscDiagnosticsData['d6'] = [];
  let prevT = -1;
  let allMonotonic = true;
  const testDt = 0.002;
  for (let s = 1; s <= 5; s++) {
    simD6.step(testDt);
    const curT = simD6.getSimTime();
    const isMono = curT > prevT;
    if (!isMono) allMonotonic = false;
    d6.push({
      step: s,
      t: Math.round(curT * 10000) / 10000,
      dt: testDt,
      isMonotonic: isMono,
    });
    prevT = curT;
  }
  const d6Passed = allMonotonic;

  // ==========================================
  // Kết luận tự động
  // ==========================================
  let conclusion = '';
  let conclusionType: OscDiagnosticsData['conclusionType'] = 'success';

  if (!d1Passed) {
    conclusion = 'Lỗi ở bộ giải/cập nhật trạng thái';
    conclusionType = 'solver_error';
  } else if (!d2Passed) {
    conclusion = 'Lỗi ở khâu ghi mẫu';
    conclusionType = 'sample_error';
  } else if (!d4Passed) {
    conclusion = 'Lỗi ở khâu vẽ';
    conclusionType = 'render_error';
  } else {
    conclusion = 'Tất cả các khâu (Bộ giải, Ghi mẫu, Khâu vẽ) đều hoạt động chuẩn xác!';
    conclusionType = 'success';
  }

  // Raw text export for Copy button
  const rawLines: string[] = [
    '=== BÁO CÁO KIỂM TRA DAO ĐỘNG KÍ ẢO (D1 – D6) ===',
    `Kết luận tự động: ${conclusion}`,
    '',
    '--- D1: ĐIỆN ÁP TRÊN TỤ (SNAPSHOT BỘ GIẢI) ---',
    'Thời điểm t (s) | Kì vọng (V) | Thực tế (V) | Kết quả',
    ...d1.map((item) => `${item.t.toFixed(2)} s | ${item.expected.toFixed(2)} V | ${item.actual.toFixed(2)} V | ${item.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`),
    '',
    '--- D2: GIÁ TRỊ KÊNH CH1 TRONG BỘ ĐỆM DAO ĐỘNG KÍ ---',
    'Mục tiêu t | Mẫu t thực | CH1 (V) | Kết quả',
    ...d2.map((item) => `${item.targetT.toFixed(2)} s | ${item.sampleT.toFixed(3)} s | ${item.v1.toFixed(2)} V | ${item.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`),
    '',
    '--- D3: THÔNG TIN BỘ ĐỆM ---',
    `• Số mẫu mỗi kênh: ${d3.sampleCount} mẫu`,
    `• Thời gian mô phỏng bao phủ: ${d3.timeSpanCovered}`,
    `• Khoảng lấy mẫu: ${d3.sampleIntervalMs} ms`,
    `• Nút chân CH1: ${d3.netCh1} | Nút chân dương tụ (+): ${d3.netCapPos}`,
    `• Trùng nút kết nối: ${d3.netsMatch ? 'ĐÚNG (Trùng khớp)' : 'SAI (Lệch nút)'}`,
    `• t đầu tiên: ${d3.firstT} s | t cuối cùng: ${d3.lastT} s`,
    '',
    '--- D4: KHÂU VẼ (CỬA SỔ 100 ms/ô × 10 ô) ---',
    `• y pixel nhỏ nhất: ${d4.minY} px | y pixel lớn nhất: ${d4.maxY} px`,
    '10 điểm đầu của đường vẽ (t, V, x px, y px):',
    ...d4.points.map((p, idx) => `  [${idx + 1}] t=${p.t.toFixed(4)}s, V=${p.v.toFixed(2)}V -> (${p.x}px, ${p.y}px)`),
    '',
    '--- D5: NGUỒN XOAY CHIỀU 5V ĐỈNH 50 Hz TRÊN DAO ĐỘNG KÍ ---',
    'Thời điểm t (ms) | Kì vọng (V) | Thực tế (V) | Kết quả',
    ...d5.map((item) => `${item.tMs} ms | ${item.expected >= 0 ? '+' : ''}${item.expected.toFixed(1)} V | ${item.actual >= 0 ? '+' : ''}${item.actual.toFixed(2)} V | ${item.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`),
    '',
    '--- D6: KIỂM TRA t TĂNG ĐƠN ĐIỆU ---',
    ...d6.map((item) => `  Bước ${item.step}: t = ${item.t.toFixed(4)} s (dt = ${item.dt} s) -> ${item.isMonotonic ? 'TĂNG ĐƠN ĐIỆU (ĐẠT)' : 'KHÔNG TĂNG'}`),
  ];

  return {
    d1,
    d1Passed,
    d2,
    d2Passed,
    d3,
    d4,
    d5,
    d5Passed,
    d6,
    d6Passed,
    conclusion,
    conclusionType,
    rawText: rawLines.join('\n'),
  };
}
