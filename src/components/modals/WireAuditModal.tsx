import React, { useState, useMemo } from 'react';
import { ShieldAlert, Check, RefreshCw, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { generateAuditReport } from '../../core/ampacity';

export const WireAuditModal: React.FC = () => {
  const {
    circuit,
    wireAuditModalOpen,
    setWireAuditModalOpen,
    selectWire,
    selectComponent,
    updateViewport,
    simulationSnapshot,
  } = useWorkspaceStore();

  const [auditMode, setAuditMode] = useState<'current' | 'all_switches_closed'>('current');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Extract component currents from live simulation if running
  const liveComponentCurrents = useMemo(() => {
    const currentsObj = simulationSnapshot?.solverResult?.componentCurrents;
    if (!currentsObj) return undefined;
    const currents: Record<string, number> = {};
    for (const [id, val] of Object.entries(currentsObj)) {
      currents[id] = typeof val === 'number' ? Math.abs(val) : 0;
    }
    return currents;
  }, [simulationSnapshot?.solverResult?.componentCurrents]);

  const report = useMemo(() => {
    return generateAuditReport(circuit, auditMode, liveComponentCurrents);
  }, [circuit, auditMode, liveComponentCurrents, refreshTrigger]);

  const handleSelectWireRow = (wireId: string) => {
    selectWire(wireId);
    const wire = circuit.wires.find((w) => w.id === wireId);
    if (wire && wire.points.length > 0) {
      const mid = wire.points[Math.floor(wire.points.length / 2)];
      updateViewport({ x: Math.round(400 - mid.x), y: Math.round(250 - mid.y) });
    }
  };

  const handleSelectCompRow = (compId: string) => {
    selectComponent(compId, false);
    const comp = circuit.components.find((c) => c.id === compId);
    if (comp) {
      updateViewport({ x: Math.round(400 - comp.x), y: Math.round(250 - comp.y) });
    }
  };

  return (
    <NeoModal
      isOpen={wireAuditModalOpen}
      onClose={() => setWireAuditModalOpen(false)}
      title="KIỂM TRA DÂY VÀ BẢO VỆ (AMPACITY & PHỐI HỢP)"
      maxWidthClass="max-w-4xl"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-gray-600 font-bold italic">
            * Ghi chú: Dòng cho phép là giá trị gần đúng dạy học (theo chuẩn giáo dục mạng điện).
          </div>
          <NeoButton
            variant="primary"
            onClick={() => setWireAuditModalOpen(false)}
            icon={<Check size={14} strokeWidth={3} />}
            className="!h-[32px] !px-4 font-black"
          >
            ĐÓNG
          </NeoButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Mode selector & Refresh header */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#F8FAFC] border-2 border-black shadow-[2px_2px_0_#000]">
          <div className="flex items-center gap-3">
            <span className="font-black text-gray-800 uppercase text-[11px]">Chế độ tính toán:</span>
            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
              <input
                type="radio"
                name="auditMode"
                value="current"
                checked={auditMode === 'current'}
                onChange={() => setAuditMode('current')}
                className="accent-[#4169E1]"
              />
              <span>Theo trạng thái hiện tại</span>
            </label>
            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
              <input
                type="radio"
                name="auditMode"
                value="all_switches_closed"
                checked={auditMode === 'all_switches_closed'}
                onChange={() => setAuditMode('all_switches_closed')}
                className="accent-[#4169E1]"
              />
              <span>Giả sử mọi công tắc đóng</span>
            </label>
          </div>
          <NeoButton
            variant="secondary"
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            icon={<RefreshCw size={12} strokeWidth={2.5} />}
            className="!h-7 !px-2.5 font-black text-[11px]"
          >
            LÀM MỚI
          </NeoButton>
        </div>

        {/* Section 1: Wires Table */}
        <div className="border-2 border-black bg-white shadow-[2px_2px_0_#000] overflow-hidden">
          <div className="p-2 bg-[#1A1A1A] text-white font-black text-xs uppercase flex justify-between items-center">
            <span>BẢNG 1: DÂY DẪN & MỨC TẢI ({report.wireRows.length} DÂY)</span>
            <span className="text-[10px] text-gray-300 font-normal">Bấm hàng để định vị trên khung vẽ</span>
          </div>

          {report.wireRows.length === 0 ? (
            <div className="p-4 text-center text-gray-500 italic">Mạch chưa có dây dẫn nào.</div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full font-mono text-[11px] border-collapse">
                <thead className="bg-[#F1F5F9] border-b-2 border-black text-left font-black sticky top-0">
                  <tr>
                    <th className="p-1.5">Tên / Loại dây</th>
                    <th className="p-1.5 text-center">Tiết diện</th>
                    <th className="p-1.5 text-right">Dòng tính (A)</th>
                    <th className="p-1.5 text-right">Dòng cho phép</th>
                    <th className="p-1.5 text-center">Mức tải</th>
                    <th className="p-1.5">Kết luận & Gợi ý</th>
                  </tr>
                </thead>
                <tbody>
                  {report.wireRows.map((row, i) => {
                    const isDanger = row.statusLevel === 'danger';
                    const isWarning = row.statusLevel === 'warning';

                    const badgeBg = isDanger
                      ? 'bg-red-100 text-red-800 border-red-500'
                      : isWarning
                      ? 'bg-amber-100 text-amber-800 border-amber-500'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-500';

                    return (
                      <tr
                        key={row.wireId}
                        onClick={() => handleSelectWireRow(row.wireId)}
                        className={`border-b border-gray-200 cursor-pointer hover:bg-[#EEF2FF] transition-colors ${
                          i % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                        }`}
                      >
                        <td className="p-1.5 font-bold font-sans">{row.name}</td>
                        <td className="p-1.5 text-center font-bold">{row.crossSection.toFixed(1)} mm²</td>
                        <td className="p-1.5 text-right font-black">
                          {row.calculatedCurrent.toFixed(2).replace('.', ',')} A
                        </td>
                        <td className="p-1.5 text-right text-gray-600 font-bold">{row.allowableCurrent} A</td>
                        <td className="p-1.5 text-center">
                          <span className={`inline-block px-1.5 py-0.5 border font-black text-[10px] ${badgeBg}`}>
                            {row.loadPct.toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-1.5 font-sans font-bold">
                          <div className="flex items-center gap-1.5">
                            {isDanger ? (
                              <AlertOctagon size={13} className="text-red-600 shrink-0" />
                            ) : isWarning ? (
                              <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                            ) : (
                              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                            )}
                            <span className={isDanger ? 'text-red-700 font-black' : isWarning ? 'text-amber-800' : 'text-emerald-700'}>
                              {row.conclusion}
                            </span>
                            {row.suggestion && (
                              <span className="text-[#4169E1] font-black underline text-[10px] ml-1">
                                [{row.suggestion}]
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Protection Coordination Table */}
        <div className="border-2 border-black bg-white shadow-[2px_2px_0_#000] overflow-hidden">
          <div className="p-2 bg-[#1A1A1A] text-white font-black text-xs uppercase flex justify-between items-center">
            <span>BẢNG 2: PHỐI HỢP THIẾT BỊ BẢO VỆ (APTOMAT / CẦU CHÌ) ({report.protectionRows.length})</span>
            <span className="text-[10px] text-gray-300 font-normal">Bấm hàng để định vị trên khung vẽ</span>
          </div>

          {report.protectionRows.length === 0 ? (
            <div className="p-4 text-center text-gray-500 italic">
              Mạch chưa có thiết bị bảo vệ (Aptomat / Cầu chì).
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto">
              <table className="w-full font-mono text-[11px] border-collapse">
                <thead className="bg-[#F1F5F9] border-b-2 border-black text-left font-black sticky top-0">
                  <tr>
                    <th className="p-1.5">Thiết bị bảo vệ</th>
                    <th className="p-1.5 text-center">Định mức In</th>
                    <th className="p-1.5 text-right">Dòng tính (A)</th>
                    <th className="p-1.5 text-center">Dây ngay sau nó</th>
                    <th className="p-1.5">Đánh giá phối hợp</th>
                  </tr>
                </thead>
                <tbody>
                  {report.protectionRows.map((row, i) => {
                    const isDanger = row.statusLevel === 'danger';
                    const isWarning = row.statusLevel === 'warning';

                    return (
                      <tr
                        key={row.compId}
                        onClick={() => handleSelectCompRow(row.compId)}
                        className={`border-b border-gray-200 cursor-pointer hover:bg-[#EEF2FF] transition-colors ${
                          i % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                        }`}
                      >
                        <td className="p-1.5 font-bold font-sans">
                          {row.compName} ({row.type})
                        </td>
                        <td className="p-1.5 text-center font-black text-[#4169E1]">{row.inA} A</td>
                        <td className="p-1.5 text-right font-black">
                          {row.calculatedCurrent.toFixed(2).replace('.', ',')} A
                        </td>
                        <td className="p-1.5 text-center font-bold">
                          {row.downstreamMinCrossSection !== null
                            ? `${row.downstreamMinCrossSection.toFixed(1)} mm² (${row.downstreamAllowableCurrent} A)`
                            : 'Không xác định'}
                        </td>
                        <td className="p-1.5 font-sans font-bold">
                          <div className="flex items-center gap-1.5">
                            {isDanger ? (
                              <AlertOctagon size={13} className="text-red-600 shrink-0" />
                            ) : isWarning ? (
                              <ShieldAlert size={13} className="text-amber-600 shrink-0" />
                            ) : (
                              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                            )}
                            <span
                              className={
                                isDanger
                                  ? 'text-red-700 font-black'
                                  : isWarning
                                  ? 'text-amber-800'
                                  : 'text-emerald-700'
                              }
                            >
                              {row.conclusion}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </NeoModal>
  );
};
