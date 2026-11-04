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
} from 'lucide-react';
import { ALL_SOLVER_TEST_CASES, SolverTestCase } from '../core/testCircuits';
import { NeoButton } from '../components/common/NeoButton';

interface TestResult {
  actualStr: string;
  passed: boolean;
  details?: string;
}

export const SolverTestView: React.FC = () => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [filterGroup, setFilterGroup] = useState<'all' | 'C-1' | 'PE'>('all');

  const runAllTests = () => {
    setIsRunning(true);
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

  useEffect(() => {
    runAllTests();
  }, []);

  const totalTests = ALL_SOLVER_TEST_CASES.length;
  const passedCount = ALL_SOLVER_TEST_CASES.filter(
    (tc) => results[tc.id]?.passed
  ).length;
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

  const filteredCases = ALL_SOLVER_TEST_CASES.filter((tc) => {
    if (filterGroup === 'all') return true;
    return tc.group === filterGroup;
  });

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
                  Giai đoạn C-1
                </span>
                <h1 className="text-base font-black uppercase tracking-tight text-black">
                  TRANG TỰ KIỂM TRA BỘ GIẢI ĐIỆN HỌC (SOLVER TEST SUITE)
                </h1>
              </div>
              <p className="text-xs text-gray-700 font-bold mt-0.5">
                Kiểm chứng tính toán MNA chuẩn xác: 8 ca tải cơ bản &amp; 10 ca an toàn điện (PE / cọc đất / rò vỏ).
              </p>
            </div>
          </div>

          {/* Action & Stats summary */}
          <div className="flex items-center gap-3">
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
                KẾT QUẢ: {passedCount}/{totalTests} CA ĐẠT ({Math.round((passedCount / totalTests) * 100)}%)
              </span>
            </div>

            <NeoButton
              variant="primary"
              onClick={runAllTests}
              disabled={isRunning}
              icon={<RotateCw size={14} className={isRunning ? 'animate-spin' : ''} strokeWidth={3} />}
              className="!h-[34px] !px-3 font-black text-xs"
            >
              CHẠY LẠI KIỂM TRA
            </NeoButton>
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="max-w-7xl mx-auto w-full p-4 flex-1 space-y-4">
        {/* Filter Bar & Notice */}
        <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0_#000] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-gray-700">Lọc ca thử:</span>
            <button
              onClick={() => setFilterGroup('all')}
              className={`px-2.5 py-1 text-xs font-black border-2 border-black cursor-pointer transition-colors ${
                filterGroup === 'all' ? 'bg-[#4169E1] text-white shadow-[1px_1px_0_#000]' : 'bg-gray-100 hover:bg-white'
              }`}
            >
              TẤT CẢ (18)
            </button>
            <button
              onClick={() => setFilterGroup('C-1')}
              className={`px-2.5 py-1 text-xs font-black border-2 border-black cursor-pointer transition-colors flex items-center gap-1 ${
                filterGroup === 'C-1' ? 'bg-[#4169E1] text-white shadow-[1px_1px_0_#000]' : 'bg-gray-100 hover:bg-white'
              }`}
            >
              <Cpu size={12} strokeWidth={2.5} />
              C-1: TẢI &amp; MẠCH CƠ BẢN (8)
            </button>
            <button
              onClick={() => setFilterGroup('PE')}
              className={`px-2.5 py-1 text-xs font-black border-2 border-black cursor-pointer transition-colors flex items-center gap-1 ${
                filterGroup === 'PE' ? 'bg-[#4169E1] text-white shadow-[1px_1px_0_#000]' : 'bg-gray-100 hover:bg-white'
              }`}
            >
              <ShieldCheck size={12} strokeWidth={2.5} />
              PE: AN TOÀN ĐIỆN &amp; RÒ VỎ (10)
            </button>
          </div>

          <div className="text-xs text-gray-700 flex items-center gap-1.5 font-bold">
            <Info size={14} className="text-[#4169E1]" />
            <span>
              Mọi ca thử đều được dựng tự động bằng code. Nhấn nút <strong>[XEM TRÊN KHUNG VẼ]</strong> để mở mạch trên khung nhìn tách biệt.
            </span>
          </div>
        </div>

        {/* 3. Table of Test Cases */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_#000] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-wider border-b-2 border-black">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-gray-700">STT</th>
                  <th className="py-2.5 px-3 w-20 border-r border-gray-700 text-center">Nhóm</th>
                  <th className="py-2.5 px-3 min-w-[240px] border-r border-gray-700">Tên ca thử nghiệm</th>
                  <th className="py-2.5 px-3 min-w-[200px] border-r border-gray-700">Giá trị mong đợi</th>
                  <th className="py-2.5 px-3 min-w-[220px] border-r border-gray-700">Giá trị bộ giải tính</th>
                  <th className="py-2.5 px-3 w-24 text-center border-r border-gray-700">Sai số</th>
                  <th className="py-2.5 px-3 w-28 text-center border-r border-gray-700">Kết quả</th>
                  <th className="py-2.5 px-3 w-32 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {filteredCases.map((tc) => {
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

                      {/* Group */}
                      <td className="py-2.5 px-3 text-center border-r border-black/10">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 border border-black uppercase ${
                            tc.group === 'PE'
                              ? 'bg-[#2DB84D] text-white'
                              : 'bg-[#4169E1] text-white'
                          }`}
                        >
                          {tc.group}
                        </span>
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

          {/* Table Footer */}
          <div className="bg-[#F8FAFC] border-t-2 border-black p-3 flex flex-wrap items-center justify-between text-xs font-black">
            <span className="text-gray-700">
              Tổng số ca kiểm tra: {ALL_SOLVER_TEST_CASES.length} | Đạt: {passedCount} | Chưa đạt: {totalTests - passedCount}
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-[#ECFDF5] border border-black" />
              <span className="text-[11px] text-gray-600 font-bold">Xanh: Đạt tiêu chuẩn</span>
              <span className="inline-block w-3 h-3 bg-[#FEF2F2] border border-black ml-2" />
              <span className="text-[11px] text-gray-600 font-bold">Đỏ: Không đạt sai số</span>
            </div>
          </div>
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
                <strong>• Thiết bị đo:</strong> Ampe kế nội trở 1 mΩ (siêu nhỏ không làm sụt áp), Vôn kế nội trở 10 MΩ (cực lớn không ăn dòng tải).
              </p>
              <p className="mt-1">
                <strong>• Đèn / Quạt / Tải:</strong> Điện trở tương đương R = U² / P. Quạt 60 W: R = 806.7 Ω; Đèn sợi đốt 60 W: R = 806.7 Ω; Đèn huỳnh quang 36 W: R = 1344.4 Ω.
              </p>
            </div>
            <div>
              <p>
                <strong>• An toàn điện &amp; PE:</strong> Vỏ thiết bị có điện trở rò 10 Ω khi xảy ra sự cố. Người chạm vỏ có điện trở R_người = 1000 Ω. Cọc tiếp địa chuẩn R_đất = 4 Ω.
              </p>
              <p className="mt-1">
                <strong>• ELCB / RCBO:</strong> Cắt dòng rò định mức I_Δn = 30 mA, thời gian tác động ngắt mạch tức thì.
              </p>
              <p className="mt-1">
                <strong>• Workspace thử:</strong> Sử dụng slug <code>_thu</code> lưu tạm trong <code>sessionStorage</code>, giữ nguyên vẹn 100% dữ liệu thiết kế trên IndexedDB/localStorage của bạn.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
