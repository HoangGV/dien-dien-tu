import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCw,
  ArrowLeft,
  Eye,
  Zap,
  ShieldCheck,
  Cpu,
  Info,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Gauge,
  Flame,
  Layers,
  Activity,
} from 'lucide-react';
import { ALL_SOLVER_TEST_CASES, SolverTestCase, SolverTestGroup } from '../core/testCircuits';
import { runOscilloscopeDiagnostics, OscDiagnosticsData } from '../core/oscilloscopeDiagnostics';
import { NeoButton } from '../components/common/NeoButton';

interface TestResult {
  actualStr: string;
  passed: boolean;
  details?: string;
}

const GROUPS: { key: SolverTestGroup; label: string; icon: React.FC<{ size: number; className?: string }> }[] = [
  { key: 'Bộ giải', label: 'Bộ giải', icon: Cpu },
  { key: 'Aptomat – cầu chì – sự cố', label: 'Aptomat – cầu chì – sự cố', icon: Flame },
  { key: 'PE – rò vỏ', label: 'PE – rò vỏ', icon: ShieldCheck },
  { key: 'Dụng cụ đo – công tơ', label: 'Dụng cụ đo – công tơ', icon: Gauge },
  { key: 'Mạch mẫu', label: 'Mạch mẫu', icon: Layers },
];

export const SolverTestView: React.FC = () => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runningGroup, setRunningGroup] = useState<string | null>(null);
  const [onlyFailed, setOnlyFailed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Oscilloscope Diagnostics D1-D6 state
  const [oscDiag, setOscDiag] = useState<OscDiagnosticsData | null>(null);
  const [oscCopied, setOscCopied] = useState<boolean>(false);
  const [oscCollapsed, setOscCollapsed] = useState<boolean>(false);

  // Group accordion open/collapsed state (default all open)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const runOscTest = () => {
    try {
      const data = runOscilloscopeDiagnostics();
      setOscDiag(data);
    } catch (e) {
      console.error('Lỗi kiểm tra dao động kí:', e);
    }
  };

  const handleCopyOscResults = () => {
    if (!oscDiag) return;
    navigator.clipboard.writeText(oscDiag.rawText).then(() => {
      setOscCopied(true);
      setTimeout(() => setOscCopied(false), 2500);
    });
  };

  const runAllTests = () => {
    setIsRunning(true);
    setRunningGroup(null);
    runOscTest();
    const newResults: Record<string, TestResult> = {};
    for (const testCase of ALL_SOLVER_TEST_CASES) {
      try {
        const res = testCase.evaluate();
        newResults[testCase.id] = res;
      } catch (err: any) {
        newResults[testCase.id] = {
          actualStr: `Lỗi: ${err?.message || 'Không xác định'}`,
          passed: false,
          details: String(err),
        };
      }
    }
    setResults(newResults);
    setIsRunning(false);
  };

  const runGroupTests = (groupKey: SolverTestGroup) => {
    setIsRunning(true);
    setRunningGroup(groupKey);
    const targetCases = ALL_SOLVER_TEST_CASES.filter(tc => tc.group === groupKey);
    const newResults = { ...results };
    for (const tc of targetCases) {
      try {
        newResults[tc.id] = tc.evaluate();
      } catch (err: any) {
        newResults[tc.id] = {
          actualStr: `Lỗi: ${err?.message || 'Không xác định'}`,
          passed: false,
          details: String(err),
        };
      }
    }
    setResults(newResults);
    setIsRunning(false);
    setRunningGroup(null);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const totalTests = ALL_SOLVER_TEST_CASES.length;
  const passedCount = ALL_SOLVER_TEST_CASES.filter(
    (tc) => results[tc.id]?.passed
  ).length;
  const failedCount = totalTests - passedCount;
  const allPassed = totalTests > 0 && passedCount === totalTests;

  const handleViewOnCanvas = (testCase: SolverTestCase) => {
    try {
      const state = testCase.createCircuit();
      sessionStorage.setItem('circuit__thu', JSON.stringify(state));
      sessionStorage.setItem('circuit__thu_title', testCase.name);
      window.location.hash = '#/mo-phong/_thu';
    } catch (e) {
      console.error('Không thể nạp mạch thử:', e);
      alert('Không thể nạp mạch thử lên khung vẽ.');
    }
  };

  // Requirement 3: Sao chép kết quả gọn (STT | tên | mong đợi | thực tế | ĐẠT/KHÔNG ĐẠT)
  // Nếu có ca KHÔNG ĐẠT thì chỉ gồm các ca đó
  const handleCopyResults = () => {
    const failedCases = ALL_SOLVER_TEST_CASES.filter(tc => results[tc.id] && !results[tc.id].passed);
    const casesToExport = failedCases.length > 0 ? failedCases : ALL_SOLVER_TEST_CASES;

    const lines = casesToExport.map(tc => {
      const res = results[tc.id];
      const statusStr = res?.passed ? 'ĐẠT' : 'KHÔNG ĐẠT';
      const actualStr = res ? res.actualStr : 'Chưa tính';
      return `${tc.stt} | ${tc.name} | ${tc.expectedStr} | ${actualStr} | ${statusStr}`;
    });

    const header = failedCases.length > 0
      ? `=== CÁC CA THỬ KHÔNG ĐẠT (${failedCases.length}/${totalTests}) ===\n`
      : `=== TẤT CẢ CA THỬ ĐỀU ĐẠT (${passedCount}/${totalTests}) ===\n`;

    const textToCopy = header + lines.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-[#EEF2FF] text-black flex flex-col font-sans select-text">
      {/* 1. Header Banner */}
      <header className="bg-white border-b-2 border-black px-4 py-3 sticky top-0 z-30 shadow-[0_2px_0_#000]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <NeoButton
              variant="secondary"
              onClick={() => {
                window.location.hash = '#/mo-phong/mang-dien-trong-nha';
              }}
              icon={<ArrowLeft size={14} strokeWidth={3} />}
              className="!h-[32px] !px-3 font-black text-xs"
            >
              QUAY LẠI KHUNG VẼ
            </NeoButton>

            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#4169E1] text-white text-[10px] font-black px-1.5 py-0.5 border border-black uppercase tracking-wider">
                  SOLVER TEST SUITE
                </span>
                <h1 className="text-base font-black uppercase tracking-tight text-black">
                  TRANG TỰ KIỂM TRA BỘ GIẢI ĐIỆN HỌC
                </h1>
              </div>
              <p className="text-xs text-gray-700 font-bold mt-0.5">
                Kiểm chứng tính toán MNA chuẩn xác qua 5 nhóm chuyên đề (Tổng cộng {totalTests} ca thử nghiệm).
              </p>
            </div>
          </div>

          {/* Action & Stats summary */}
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`px-3 py-1.5 border-2 border-black text-xs font-black flex items-center gap-2 shadow-[2px_2px_0_#000] ${
                allPassed
                  ? 'bg-[#2DB84D] text-white'
                  : 'bg-[#E5322D] text-white'
              }`}
            >
              {allPassed ? (
                <CheckCircle2 size={16} strokeWidth={3} />
              ) : (
                <XCircle size={16} strokeWidth={3} />
              )}
              <span>
                KẾT QUẢ: {passedCount}/{totalTests} CA ĐẠT ({totalTests > 0 ? Math.round((passedCount / totalTests) * 100) : 0}%)
              </span>
            </div>

            {/* Requirement 3: Nút Sao chép kết quả */}
            <NeoButton
              variant="secondary"
              onClick={handleCopyResults}
              icon={copied ? <Check size={14} strokeWidth={3} className="text-[#2DB84D]" /> : <Copy size={14} strokeWidth={3} />}
              className="!h-[34px] !px-3 font-black text-xs"
              title="Sao chép kết quả các ca thử ra văn bản gọn (nếu có ca hỏng thì chỉ sao chép các ca đó)"
            >
              {copied ? 'ĐÃ SAO CHÉP!' : 'SAO CHÉP KẾT QUẢ'}
            </NeoButton>

            {/* Requirement 2: Nút Chạy tất cả */}
            <NeoButton
              variant="primary"
              onClick={runAllTests}
              disabled={isRunning}
              icon={<RotateCw size={14} className={isRunning && !runningGroup ? 'animate-spin' : ''} strokeWidth={3} />}
              className="!h-[34px] !px-3 font-black text-xs"
            >
              CHẠY TẤT CẢ
            </NeoButton>
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="max-w-7xl mx-auto w-full p-4 flex-1 space-y-4">
        {/* Controls Bar */}
        <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0_#000] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Requirement 2: Ô chọn "Chỉ hiện ca KHÔNG ĐẠT" */}
            <label className="flex items-center gap-2 text-xs font-black uppercase text-black cursor-pointer bg-[#F8FAFC] px-2.5 py-1.5 border-2 border-black shadow-[1px_1px_0_#000] hover:bg-[#EEF2FF]">
              <input
                type="checkbox"
                checked={onlyFailed}
                onChange={(e) => setOnlyFailed(e.target.checked)}
                className="w-4 h-4 accent-[#E5322D] cursor-pointer"
              />
              <span>Chỉ hiện ca KHÔNG ĐẠT {failedCount > 0 ? `(${failedCount})` : ''}</span>
            </label>

            {/* Quick summary counters */}
            <div className="flex items-center gap-2 flex-wrap">
              {GROUPS.map((g) => {
                const groupCases = ALL_SOLVER_TEST_CASES.filter((tc) => tc.group === g.key);
                const groupPassed = groupCases.filter((tc) => results[tc.id]?.passed).length;
                const isGroupAllPassed = groupPassed === groupCases.length && groupCases.length > 0;

                return (
                  <span
                    key={g.key}
                    className={`text-[11px] font-black px-2 py-1 border border-black flex items-center gap-1 ${
                      isGroupAllPassed
                        ? 'bg-[#ECFDF5] text-[#065F46]'
                        : 'bg-[#FEF2F2] text-[#991B1B]'
                    }`}
                  >
                    <g.icon size={12} />
                    {g.label}: {groupPassed}/{groupCases.length}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-gray-700 flex items-center gap-1.5 font-bold">
            <Info size={14} className="text-[#4169E1] shrink-0" />
            <span>
              Mọi ca thử đều dựng bằng code tự động. Bấm <strong>[XEM MẠCH]</strong> để mở trên khung vẽ thử nghiệm riêng.
            </span>
          </div>
        </div>

        {/* Oscilloscope Diagnostics Section (D1 - D6) */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_#000] overflow-hidden">
          <div
            onClick={() => setOscCollapsed(!oscCollapsed)}
            className="bg-[#1A1A1A] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-[#2A2A2A] transition-colors border-b-2 border-black"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-white hover:text-[#FFD84D] transition-colors"
                title={oscCollapsed ? 'Mở rộng' : 'Thu gọn'}
              >
                {oscCollapsed ? (
                  <ChevronRight size={18} strokeWidth={3} />
                ) : (
                  <ChevronDown size={18} strokeWidth={3} />
                )}
              </button>
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[#FFD84D]" strokeWidth={2.5} />
                <span className="font-black text-sm uppercase tracking-wide">
                  PHÂN TÍCH QUÁ ĐỘ (TRANSIENT ANALYSIS) — SỐ LIỆU THÔ
                </span>
                {oscDiag && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-[11px] font-black border border-black ${
                      oscDiag.conclusionType === 'success'
                        ? 'bg-[#2DB84D] text-white'
                        : 'bg-[#E5322D] text-white'
                    }`}
                  >
                    {oscDiag.conclusionType === 'success' ? 'TẤT CẢ A & B ĐẠT' : 'CÓ LỖI CHẨN ĐOÁN'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <NeoButton
                variant="secondary"
                onClick={handleCopyOscResults}
                icon={oscCopied ? <Check size={13} strokeWidth={3} className="text-[#2DB84D]" /> : <Copy size={13} strokeWidth={3} />}
                className="!h-[28px] !px-2.5 font-black text-[11px] bg-white text-black hover:bg-[#FFD84D]"
                title="Sao chép toàn bộ kết quả phân tích quá độ ra clipboard"
              >
                {oscCopied ? 'ĐÃ SAO CHÉP KẾT QUẢ!' : 'SAO CHÉP KẾT QUẢ'}
              </NeoButton>
              <NeoButton
                variant="primary"
                onClick={runOscTest}
                icon={<RotateCw size={13} strokeWidth={3} />}
                className="!h-[28px] !px-2.5 font-black text-[11px] bg-[#FFD84D] text-black hover:bg-[#ffe270]"
              >
                CHẠY LẠI CHẨN ĐOÁN
              </NeoButton>
            </div>
          </div>

          {!oscCollapsed && oscDiag && (
            <div className="p-4 space-y-4 bg-[#F8FAFC]">
              {/* Conclusion Callout Banner */}
              <div
                className={`p-3 border-2 border-black shadow-[2px_2px_0_#000] flex items-start gap-3 ${
                  oscDiag.conclusionType === 'success' ? 'bg-[#ECFDF5] border-[#065F46]' : 'bg-[#FEF2F2] border-[#991B1B]'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {oscDiag.conclusionType === 'success' ? (
                    <CheckCircle2 size={18} className="text-[#059669]" strokeWidth={3} />
                  ) : (
                    <XCircle size={18} className="text-[#DC2626]" strokeWidth={3} />
                  )}
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-black">
                    KẾT LUẬN TỰ ĐỘNG CHẨN ĐOÁN:
                  </div>
                  <div
                    className={`text-sm font-bold mt-0.5 ${
                      oscDiag.conclusionType === 'success' ? 'text-[#065F46]' : 'text-[#991B1B]'
                    }`}
                  >
                    {oscDiag.conclusion}
                  </div>
                </div>
              </div>

              {/* SECTION A: Direct runTransient Calls */}
              <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0_#000]">
                <div className="text-xs font-black uppercase text-black border-b-2 border-black pb-1.5 mb-3 flex items-center justify-between">
                  <span>A. GỌI TRỰC TIẾP runTransient (Không qua giao diện)</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 border border-black ${
                    oscDiag.a1Passed && oscDiag.a2Passed && oscDiag.a3Passed && oscDiag.a4Passed
                      ? 'bg-[#2DB84D] text-white' : 'bg-[#E5322D] text-white'
                  }`}>
                    {oscDiag.a1Passed && oscDiag.a2Passed && oscDiag.a3Passed && oscDiag.a4Passed ? 'ĐẠT (A1 - A4)' : 'CÓ LỖI'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* A1: RC */}
                  <div className="border border-black p-2 bg-[#F8FAFC]">
                    <div className="flex items-center justify-between pb-1 border-b border-black text-xs font-bold">
                      <span>A1. Nạp tụ RC (5V + 1kΩ + 100µF, 1s)</span>
                      <span className={oscDiag.a1Passed ? 'text-[#059669]' : 'text-[#DC2626]'}>
                        {oscDiag.a1Passed ? '✓ ĐẠT' : '✗ KHÔNG ĐẠT'}
                      </span>
                    </div>
                    <table className="w-full text-xs font-mono mt-1 border-collapse">
                      <thead>
                        <tr className="bg-[#E2E8F0] text-left text-[10px]">
                          <th className="p-0.5">t (s)</th>
                          <th className="p-0.5">Kì vọng</th>
                          <th className="p-0.5">Thực tế</th>
                          <th className="p-0.5 text-center">KQ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {oscDiag.a1.map((item, i) => (
                          <tr key={i} className="border-b border-gray-200">
                            <td className="p-0.5">{item.t}</td>
                            <td className="p-0.5">{item.expected.toFixed(2)} V</td>
                            <td className="p-0.5 font-bold">{item.actual.toFixed(2)} V</td>
                            <td className="p-0.5 text-center font-bold">
                              {item.passed ? <span className="text-[#059669]">✓</span> : <span className="text-[#DC2626]">✗</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* A2: SIN */}
                  <div className="border border-black p-2 bg-[#F8FAFC]">
                    <div className="flex items-center justify-between pb-1 border-b border-black text-xs font-bold">
                      <span>A2. Nguồn xoay chiều sin (5V đỉnh, 50Hz, 20ms)</span>
                      <span className={oscDiag.a2Passed ? 'text-[#059669]' : 'text-[#DC2626]'}>
                        {oscDiag.a2Passed ? '✓ ĐẠT' : '✗ KHÔNG ĐẠT'}
                      </span>
                    </div>
                    <table className="w-full text-xs font-mono mt-1 border-collapse">
                      <thead>
                        <tr className="bg-[#E2E8F0] text-left text-[10px]">
                          <th className="p-0.5">t (ms)</th>
                          <th className="p-0.5">Kì vọng</th>
                          <th className="p-0.5">Thực tế</th>
                          <th className="p-0.5 text-center">KQ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {oscDiag.a2.map((item, i) => (
                          <tr key={i} className="border-b border-gray-200">
                            <td className="p-0.5">{item.tMs}</td>
                            <td className="p-0.5">{item.expected.toFixed(1)} V</td>
                            <td className="p-0.5 font-bold">{item.actual.toFixed(2)} V</td>
                            <td className="p-0.5 text-center font-bold">
                              {item.passed ? <span className="text-[#059669]">✓</span> : <span className="text-[#DC2626]">✗</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* A3: Rectifier */}
                  <div className="border border-black p-2 bg-[#F8FAFC]">
                    <div className="flex items-center justify-between pb-1 border-b border-black text-xs font-bold">
                      <span>A3. Chỉnh lưu nửa chu kì (40ms)</span>
                      <span className={oscDiag.a3Passed ? 'text-[#059669]' : 'text-[#DC2626]'}>
                        {oscDiag.a3Passed ? '✓ ĐẠT' : '✗ KHÔNG ĐẠT'}
                      </span>
                    </div>
                    <div className="mt-1 space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span>V_max tải:</span>
                        <span className="font-bold">{oscDiag.a3.maxV} V (kì vọng ≈ 4.3 V)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>V_min tải:</span>
                        <span className="font-bold">{oscDiag.a3.minV} V (kì vọng ≥ -0.05 V)</span>
                      </div>
                    </div>
                  </div>

                  {/* A4: Time steps */}
                  <div className="border border-black p-2 bg-[#F8FAFC]">
                    <div className="flex items-center justify-between pb-1 border-b border-black text-xs font-bold">
                      <span>A4. Bước thời gian t và dt</span>
                      <span className={oscDiag.a4Passed ? 'text-[#059669]' : 'text-[#DC2626]'}>
                        {oscDiag.a4Passed ? '✓ ĐẠT' : '✗ KHÔNG ĐẠT'}
                      </span>
                    </div>
                    <div className="mt-1 space-y-1 text-xs font-mono">
                      <div>dt = <strong>{(oscDiag.a4.dt * 1e6).toFixed(1)} µs</strong></div>
                      <div>t[0] = <strong>{oscDiag.a4.samples[0]?.t} s</strong> (bắt đầu từ 0)</div>
                      <div>5 mẫu đầu: [{oscDiag.a4.samples.map(s => (s.t * 1000).toFixed(2) + 'ms').join(', ')}]</div>
                      <div>Tăng đơn điệu: <strong>{oscDiag.a4.isMonotonic ? 'CÓ (t_{k+1} > t_k)' : 'KHÔNG'}</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: Through UI Pipeline on Presets */}
              <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0_#000]">
                <div className="text-xs font-black uppercase text-black border-b-2 border-black pb-1.5 mb-3 flex items-center justify-between">
                  <span>B. QUA ĐƯỜNG ỐNG GIAO DIỆN CỦA MẪU MẠCH (v), (x), (y)</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 border border-black ${
                    oscDiag.bPassed ? 'bg-[#2DB84D] text-white' : 'bg-[#E5322D] text-white'
                  }`}>
                    {oscDiag.bPassed ? 'ĐẠT (B1 - B3)' : 'CÓ LỖI'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* B1: Preset v */}
                  <div className="border border-black p-2 bg-[#F8FAFC] text-xs font-mono space-y-1">
                    <div className="font-bold border-b border-black pb-1 flex justify-between">
                      <span>B1. Mẫu (v) nạp RC</span>
                      <span className={oscDiag.b1.passed ? 'text-[#059669]' : 'text-[#DC2626]'}>
                        {oscDiag.b1.passed ? '✓ ĐẠT' : '✗'}
                      </span>
                    </div>
                    <div>V(0.1s): <strong>{oscDiag.b1.vAt01} V</strong> (exp 3.16V)</div>
                    <div>Nút CH1: <strong>{oscDiag.b1.netCh1}</strong></div>
                    <div>Nút Tụ(+): <strong>{oscDiag.b1.netCapPos}</strong></div>
                    <div>Khớp nút: <strong className={oscDiag.b1.netsMatch ? 'text-[#059669]' : 'text-[#DC2626]'}>
                      {oscDiag.b1.netsMatch ? 'TRÙNG' : 'LỆCH'}
                    </strong></div>
                  </div>

                  {/* B2: Preset x */}
                  <div className="border border-black p-2 bg-[#F8FAFC] text-xs font-mono space-y-1">
                    <div className="font-bold border-b border-black pb-1 flex justify-between">
                      <span>B2. Mẫu (x) Nguồn sin</span>
                      <span className={oscDiag.b2.passed ? 'text-[#059669]' : 'text-[#DC2626]'}>
                        {oscDiag.b2.passed ? '✓ ĐẠT' : '✗'}
                      </span>
                    </div>
                    <div>V(5ms): <strong>{oscDiag.b2.vAt5ms} V</strong> (exp 5.0V)</div>
                    <div>Nút CH1: <strong>{oscDiag.b2.netCh1}</strong></div>
                    <div>Nút Nguồn(+): <strong>{oscDiag.b2.netSrcPos}</strong></div>
                    <div>Khớp nút: <strong className={oscDiag.b2.netsMatch ? 'text-[#059669]' : 'text-[#DC2626]'}>
                      {oscDiag.b2.netsMatch ? 'TRÙNG' : 'LỆCH'}
                    </strong></div>
                  </div>

                  {/* B3: Preset y */}
                  <div className="border border-black p-2 bg-[#F8FAFC] text-xs font-mono space-y-1">
                    <div className="font-bold border-b border-black pb-1 flex justify-between">
                      <span>B3. Mẫu (y) Chỉnh lưu</span>
                      <span className={oscDiag.b3.passed ? 'text-[#059669]' : 'text-[#DC2626]'}>
                        {oscDiag.b3.passed ? '✓ ĐẠT' : '✗'}
                      </span>
                    </div>
                    <div>V_max CH2: <strong>{oscDiag.b3.maxV} V</strong> (exp ~4.3V)</div>
                    <div>V_min CH2: <strong>{oscDiag.b3.minV} V</strong> (exp ≥ -0.05V)</div>
                    <div>Nút CH2: <strong>{oscDiag.b3.netCh2}</strong></div>
                    <div>Nút Tải(+): <strong>{oscDiag.b3.netLoadPos}</strong></div>
                    <div>Khớp nút: <strong className={oscDiag.b3.netsMatch ? 'text-[#059669]' : 'text-[#DC2626]'}>
                      {oscDiag.b3.netsMatch ? 'TRÙNG' : 'LỆCH'}
                    </strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Collapsible Group Sections */}
        <div className="space-y-4">
          {GROUPS.map((group) => {
            const isCollapsed = Boolean(collapsedGroups[group.key]);
            const groupCases = ALL_SOLVER_TEST_CASES.filter((tc) => tc.group === group.key);
            const displayedCases = onlyFailed
              ? groupCases.filter((tc) => results[tc.id] && !results[tc.id].passed)
              : groupCases;

            const groupPassed = groupCases.filter((tc) => results[tc.id]?.passed).length;
            const isGroupAllPassed = groupPassed === groupCases.length && groupCases.length > 0;
            const isRunningThisGroup = isRunning && runningGroup === group.key;

            return (
              <div
                key={group.key}
                className="bg-white border-2 border-black shadow-[4px_4px_0_#000] overflow-hidden"
              >
                {/* Group Collapsible Header */}
                <div
                  onClick={() => toggleGroup(group.key)}
                  className="bg-[#1A1A1A] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-[#2A2A2A] transition-colors border-b-2 border-black"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-white hover:text-[#FFD84D] transition-colors"
                      title={isCollapsed ? 'Mở rộng nhóm' : 'Thu gọn nhóm'}
                    >
                      {isCollapsed ? (
                        <ChevronRight size={18} strokeWidth={3} />
                      ) : (
                        <ChevronDown size={18} strokeWidth={3} />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <group.icon size={16} className="text-[#FFD84D]" />
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">
                        {group.label}
                      </h2>
                    </div>

                    <span className="text-[10px] font-black px-2 py-0.5 bg-gray-800 text-gray-200 border border-gray-600 rounded">
                      {groupCases.length} ca
                    </span>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 border border-black uppercase flex items-center gap-1 ${
                        isGroupAllPassed
                          ? 'bg-[#2DB84D] text-white'
                          : 'bg-[#E5322D] text-white'
                      }`}
                    >
                      {isGroupAllPassed ? (
                        <CheckCircle2 size={11} strokeWidth={3} />
                      ) : (
                        <XCircle size={11} strokeWidth={3} />
                      )}
                      {groupPassed}/{groupCases.length} ĐẠT
                    </span>
                  </div>

                  {/* Requirement 2: Nút [CHẠY NHÓM NÀY] */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => runGroupTests(group.key)}
                      disabled={isRunning}
                      className="px-3 py-1 bg-[#FFD84D] hover:bg-[#FFE37A] text-black border-2 border-black text-xs font-black uppercase shadow-[1px_1px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title={`Chạy riêng ${groupCases.length} ca thử trong nhóm ${group.label}`}
                    >
                      <RotateCw
                        size={12}
                        strokeWidth={3}
                        className={isRunningThisGroup ? 'animate-spin' : ''}
                      />
                      CHẠY NHÓM NÀY
                    </button>
                  </div>
                </div>

                {/* Group Body: Table of Test Cases */}
                {!isCollapsed && (
                  <div>
                    {displayedCases.length === 0 ? (
                      <div className="p-6 text-center text-xs font-bold text-gray-600 bg-[#F8FAFC]">
                        {onlyFailed ? (
                          <div className="flex items-center justify-center gap-2 text-[#065F46]">
                            <CheckCircle2 size={16} strokeWidth={3} className="text-[#2DB84D]" />
                            <span>Tất cả {groupCases.length} ca trong nhóm <strong>{group.label}</strong> đều ĐẠT tiêu chuẩn.</span>
                          </div>
                        ) : (
                          <span>Không có ca thử nào trong nhóm này.</span>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#F1F5F9] text-black text-[11px] font-black uppercase tracking-wider border-b-2 border-black">
                              <th className="py-2.5 px-3 w-12 text-center border-r border-black/20">STT</th>
                              <th className="py-2.5 px-3 min-w-[260px] border-r border-black/20">Tên ca thử nghiệm</th>
                              <th className="py-2.5 px-3 min-w-[200px] border-r border-black/20">Giá trị mong đợi</th>
                              <th className="py-2.5 px-3 min-w-[220px] border-r border-black/20">Giá trị bộ giải tính</th>
                              <th className="py-2.5 px-3 w-24 text-center border-r border-black/20">Sai số</th>
                              <th className="py-2.5 px-3 w-28 text-center border-r border-black/20">Kết quả</th>
                              <th className="py-2.5 px-3 w-28 text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-2 divide-black/10">
                            {displayedCases.map((tc) => {
                              const res = results[tc.id];
                              const passed = res?.passed ?? false;
                              const actualText = res ? res.actualStr : 'Đang tính...';

                              return (
                                <tr
                                  key={tc.id}
                                  className={`transition-colors font-medium ${
                                    passed
                                      ? 'bg-[#ECFDF5] hover:bg-[#D1FAE5]'
                                      : 'bg-[#FEF2F2] hover:bg-[#FEE2E2]'
                                  }`}
                                >
                                  {/* STT */}
                                  <td className="py-2.5 px-3 font-mono font-black text-center border-r border-black/10 text-gray-700">
                                    {tc.stt}
                                  </td>

                                  {/* Name */}
                                  <td className="py-2.5 px-3 border-r border-black/10">
                                    <span className="font-black text-black block">{tc.name}</span>
                                    {res?.details && (
                                      <span className="text-[10px] text-gray-600 block mt-0.5 font-normal">
                                        {res.details}
                                      </span>
                                    )}
                                  </td>

                                  {/* Expected */}
                                  <td className="py-2.5 px-3 font-mono font-bold text-gray-900 border-r border-black/10">
                                    {tc.expectedStr}
                                  </td>

                                  {/* Actual */}
                                  <td className="py-2.5 px-3 font-mono font-black border-r border-black/10">
                                    <span
                                      className={passed ? 'text-[#065F46]' : 'text-[#991B1B]'}
                                    >
                                      {actualText}
                                    </span>
                                  </td>

                                  {/* Tolerance */}
                                  <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-700 border-r border-black/10">
                                    {tc.toleranceStr}
                                  </td>

                                  {/* Status */}
                                  <td className="py-2.5 px-3 text-center border-r border-black/10">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-black text-[11px] font-black uppercase ${
                                        passed
                                          ? 'bg-[#2DB84D] text-white shadow-[1px_1px_0_#000]'
                                          : 'bg-[#E5322D] text-white shadow-[1px_1px_0_#000]'
                                      }`}
                                    >
                                      {passed ? (
                                        <>
                                          <CheckCircle2 size={12} strokeWidth={3} />
                                          ĐẠT
                                        </>
                                      ) : (
                                        <>
                                          <XCircle size={12} strokeWidth={3} />
                                          K. ĐẠT
                                        </>
                                      )}
                                    </span>
                                  </td>

                                  {/* Action */}
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      onClick={() => handleViewOnCanvas(tc)}
                                      className="px-2 py-1 bg-white hover:bg-[#FFD84D] text-black border-2 border-black text-[10px] font-black uppercase shadow-[1px_1px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                      title="Xem mạch trên khung vẽ thử nghiệm riêng"
                                    >
                                      <Eye size={12} strokeWidth={2.5} />
                                      XEM MẠCH
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 4. Technical Reference Note */}
        <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0_#000] space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#4169E1]">
            <Zap size={14} strokeWidth={3} />
            <span>GHI CHÚ KỸ THUẬT &amp; CƠ SỞ BỘ GIẢI MODIFIED NODAL ANALYSIS (MNA)</span>
          </div>
          <div className="text-xs text-gray-800 font-medium leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p>
                <strong>• Thuật toán:</strong> Ma trận dẫn nạp nút MNA giải hệ phương trình tuyến tính Gaussian elimination với partial pivoting.
              </p>
              <p className="mt-1">
                <strong>• Thiết bị đo:</strong> Ampe kế nội trở 1 mΩ (siêu nhỏ không làm sụt áp), Vôn kế nội trở 10 MΩ (cực lớn không ăn dòng tải), Ôm kế đo thụ động 2 cực, Oát kế 4 cực.
              </p>
              <p className="mt-1">
                <strong>• Đèn / Quạt / Tải:</strong> Điện trở tương đương R = U² / P. Quạt và đèn sáng xanh khi hoạt động theo công suất tiêu thụ định mức.
              </p>
            </div>
            <div>
              <p>
                <strong>• An toàn điện &amp; PE:</strong> Vỏ thiết bị có điện trở rò 10 Ω khi xảy ra sự cố. Người chạm vỏ có điện trở R_người = 1000 Ω. Cọc tiếp địa chuẩn R_đất = 4 Ω.
              </p>
              <p className="mt-1">
                <strong>• Aptomat &amp; ELCB:</strong> Aptomat không bao giờ cháy hỏng, chỉ nhảy ngắt mạch; giữ nhiệt dư h khi đóng lại. ELCB ngắt dòng rò định mức I_Δn = 30 mA.
              </p>
              <p className="mt-1">
                <strong>• Workspace thử:</strong> Sử dụng slug <code>_thu</code> lưu tạm trong <code>sessionStorage</code>, giữ nguyên vẹn 100% dữ liệu thiết kế trên IndexedDB/localStorage.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
