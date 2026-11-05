import React, { useState } from 'react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { Copy, Check, Activity, Cpu, GitBranch, Terminal, Zap } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { simulationService } from '../../core/simulationService';
import { formatMeasure } from '../../core/measureFormat';

export interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ isOpen, onClose }) => {
  const { isSimulating, simulationSnapshot } = useWorkspaceStore();
  const [copied, setCopied] = useState(false);
  const [, setTick] = useState(0);

  const handleRefresh = () => {
    setTick(t => t + 1);
  };

  const diag = simulationSnapshot?.diagnostics || simulationService.getSnapshot()?.diagnostics;
  const snapshot = simulationSnapshot || simulationService.getSnapshot();

  const handleCopyLogs = () => {
    if (!diag) return;
    const text = [
      '=== CHẨN ĐOÁN MÔ PHỎNG MẠCH ĐIỆN ===',
      `Thời gian: ${snapshot?.time?.toFixed(2) || 0} s`,
      `Trạng thái: ${isSimulating ? 'Đang chạy' : 'Đã dừng'}`,
      `Số phần tử: ${diag.numElements} | Số nút: ${diag.numNodes} | Số nhánh: ${diag.numBranches}`,
      `Thời gian tính toán bước (solveTime): ${diag.solveTimeMs?.toFixed(2) || 0} ms`,
      `Hội tụ: ${diag.converged ? 'ĐẠT' : 'KHÔNG HỘI TỤ'}`,
      '',
      '--- NHẬT KÝ MÔ PHỎNG (50 DÒNG GẦN NHẤT) ---',
      ...(diag.logs || []),
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <NeoModal isOpen={isOpen} onClose={onClose} title="CHẨN ĐOÁN MÔ PHỎNG (C-2 DIAGNOSTICS)" maxWidthClass="max-w-3xl">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-black font-sans text-xs">
        {/* Header overview banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#EEF2FF] border-2 border-black p-3 shadow-[2px_2px_0_#000]">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-500 block">Trạng thái</span>
            <span className={`font-black text-sm ${isSimulating ? 'text-[#2DB84D]' : 'text-gray-700'}`}>
              {isSimulating ? '● ĐANG CHẠY' : '○ ĐÃ DỪNG'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-500 block">Thời gian bước giải</span>
            <span className={`font-black text-sm ${(diag?.solveTimeMs || 0) <= 8 ? 'text-[#2DB84D]' : 'text-[#E5322D]'}`}>
              {(diag?.solveTimeMs || 0).toFixed(2).replace('.', ',')} ms <span className="text-[10px] text-gray-500">(≤ 8 ms)</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-500 block">Cờ hội tụ MNA</span>
            <span className={`font-black text-sm ${diag?.converged !== false ? 'text-[#2DB84D]' : 'text-[#E5322D]'}`}>
              {diag?.converged !== false ? '✓ HỘI TỤ TỐT' : '✗ KHÔNG HỘI TỤ'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-500 block">Kích thước mạch</span>
            <span className="font-black text-sm text-black">
              {diag?.numNodes || 0} nút • {diag?.numBranches || 0} nhánh
            </span>
          </div>
        </div>

        {/* 1. Kết quả biên dịch mạch */}
        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0_#000]">
          <h4 className="font-black text-sm uppercase flex items-center gap-1.5 mb-2 pb-1 border-b border-black">
            <Cpu size={16} className="text-[#4169E1]" />
            1. Kết quả biên dịch (Compile Pipeline)
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-600 block">Tổng số phần tử giải:</span>
              <strong className="font-mono text-sm">{diag?.numElements || 0}</strong>
            </div>
            <div>
              <span className="text-gray-600 block">Số nút điện tích (Node):</span>
              <strong className="font-mono text-sm">{diag?.numNodes || 0}</strong>
            </div>
            <div>
              <span className="text-gray-600 block">Số nhánh dòng (Branch):</span>
              <strong className="font-mono text-sm">{diag?.numBranches || 0}</strong>
            </div>
          </div>
        </div>

        {/* 2. Bảng chân -> Nút */}
        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0_#000]">
          <h4 className="font-black text-sm uppercase flex items-center gap-1.5 mb-2 pb-1 border-b border-black">
            <GitBranch size={16} className="text-[#4169E1]" />
            2. Bảng ánh xạ Chân linh kiện → Nút mạch (Pin to Net)
          </h4>
          {diag?.pinNetMap && Object.keys(diag.pinNetMap).length > 0 ? (
            <div className="max-h-36 overflow-y-auto border border-black">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-[#FFD84D] border-b border-black sticky top-0 font-black">
                  <tr>
                    <th className="p-1 border-r border-black">Mã chân (Linh kiện : Chân)</th>
                    <th className="p-1">Chỉ số nút (Net ID)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-mono">
                  {Object.entries(diag.pinNetMap).map(([pinKey, netId]) => (
                    <tr key={pinKey} className="hover:bg-[#EEF2FF]">
                      <td className="p-1 border-r border-black">{pinKey}</td>
                      <td className="p-1 font-bold">
                        {String(netId) === '0' ? 'Nút 0 (GND / Trung tính)' : `Nút ${netId}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">Chưa có thông tin chân/nút. Hãy nối dây và bấm CHẠY.</p>
          )}
        </div>

        {/* 3. Bảng điện áp nút và dòng điện nhánh */}
        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0_#000]">
          <h4 className="font-black text-sm uppercase flex items-center gap-1.5 mb-2 pb-1 border-b border-black">
            <Zap size={16} className="text-[#4169E1]" />
            3. Bảng điện áp nút & Số đo phần tử
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="font-black text-[11px] uppercase block mb-1">Điện áp tại các nút:</span>
              <div className="max-h-36 overflow-y-auto border border-black">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-gray-100 border-b border-black font-black sticky top-0">
                    <tr>
                      <th className="p-1 border-r border-black">Nút</th>
                      <th className="p-1">Điện áp V</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-mono">
                    {diag?.nodeVoltages && Object.keys(diag.nodeVoltages).length > 0 ? (
                      Object.entries(diag.nodeVoltages).map(([nodeId, v]) => (
                        <tr key={nodeId} className="hover:bg-[#EEF2FF]">
                          <td className="p-1 border-r border-black font-bold">Nút {nodeId} {nodeId === '0' ? '(GND)' : ''}</td>
                          <td className="p-1">{formatMeasure(Number(v), 'voltage')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={2} className="p-1 text-gray-500 italic">Không có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <span className="font-black text-[11px] uppercase block mb-1">Dòng điện & công suất linh kiện:</span>
              <div className="max-h-36 overflow-y-auto border border-black">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-gray-100 border-b border-black font-black sticky top-0">
                    <tr>
                      <th className="p-1 border-r border-black">Mã LK</th>
                      <th className="p-1 border-r border-black">Dòng I</th>
                      <th className="p-1">Công suất P</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-mono">
                    {snapshot?.elementMeasures && Object.keys(snapshot.elementMeasures).length > 0 ? (
                      Object.entries(snapshot.elementMeasures).map(([compId, m]) => (
                        <tr key={compId} className="hover:bg-[#EEF2FF]">
                          <td className="p-1 border-r border-black font-bold">{compId}</td>
                          <td className="p-1 border-r border-black">{formatMeasure(m.current, 'current')}</td>
                          <td className="p-1">{formatMeasure(m.power, 'power')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="p-1 text-gray-500 italic">Không có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Nhật ký mô phỏng (50 dòng gần nhất) */}
        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0_#000]">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-black">
            <h4 className="font-black text-sm uppercase flex items-center gap-1.5">
              <Terminal size={16} className="text-[#4169E1]" />
              4. Nhật ký mô phỏng (50 dòng gần nhất)
            </h4>
            <div className="flex items-center gap-1.5">
              <NeoButton
                variant="secondary"
                onClick={handleRefresh}
                className="!h-[24px] !px-2 text-[10px]"
                title="Làm mới số liệu chẩn đoán"
              >
                LÀM MỚI
              </NeoButton>
              <NeoButton
                variant="secondary"
                onClick={handleCopyLogs}
                icon={copied ? <Check size={12} className="text-[#2DB84D]" /> : <Copy size={12} />}
                className="!h-[24px] !px-2 text-[10px]"
              >
                {copied ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP NHẬT KÝ'}
              </NeoButton>
            </div>
          </div>

          <div className="bg-black text-[#2DB84D] font-mono text-[11px] p-2.5 border-2 border-black h-40 overflow-y-auto leading-relaxed select-text">
            {diag?.logs && diag.logs.length > 0 ? (
              diag.logs.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap hover:text-white">
                  {line}
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic">Nhật ký trống. Hãy bấm CHẠY để khởi động bộ giải mô phỏng.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t-2 border-black flex justify-end">
        <NeoButton variant="primary" onClick={onClose} className="!h-[30px] !px-4">
          ĐÓNG
        </NeoButton>
      </div>
    </NeoModal>
  );
};
