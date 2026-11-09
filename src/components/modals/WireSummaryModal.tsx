import React from 'react';
import { FileSpreadsheet, Check, Ruler } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { aggregateWireSummary } from '../../core/installWiring';

export interface WireSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WireSummaryModal: React.FC<WireSummaryModalProps> = ({ isOpen, onClose }) => {
  const { circuit } = useWorkspaceStore();
  const summary = aggregateWireSummary(circuit, 100);

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title="TỔNG HỢP DÂY DẪN (MẶT BẰNG LẮP ĐẶT)"
      maxWidthClass="max-w-2xl"
      footerActions={
        <NeoButton
          variant="primary"
          onClick={onClose}
          icon={<Check size={14} strokeWidth={3} />}
          className="!h-[32px] !px-4 font-black"
        >
          ĐÓNG
        </NeoButton>
      }
    >
      <div className="space-y-4">
        {/* Info Banner */}
        <div className="p-3 bg-[#EEF2FF] border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Ruler size={18} className="text-[#4169E1] shrink-0" strokeWidth={2.5} />
            <div className="text-xs text-gray-800 font-bold">
              Tỉ lệ bản vẽ mặt bằng: <strong>1 m = 100 px</strong>. Chiều dài được tự động tính theo đường đi vuông góc giữa các chân thiết bị.
            </div>
          </div>
          <div className="bg-[#FFD84D] px-2.5 py-1 border border-black font-black text-xs shrink-0 text-black">
            Tổng: {summary.grandTotalMeters.toFixed(2).replace('.', ',')} m
          </div>
        </div>

        {/* Table */}
        {summary.rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-bold border-2 border-dashed border-gray-300">
            Mạch điện hiện chưa có dây dẫn nào được nối.
          </div>
        ) : (
          <div className="border-2 border-black shadow-[3px_3px_0_#000] overflow-hidden">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] text-white border-b-2 border-black text-left font-black">
                  <th className="p-2">Tiết diện</th>
                  <th className="p-2">Loại dây</th>
                  <th className="p-2 text-center">Màu sắc</th>
                  <th className="p-2 text-center">Số đoạn</th>
                  <th className="p-2 text-right">Tổng chiều dài</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-200 hover:bg-[#F8FAFC] ${
                      i % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                    }`}
                  >
                    <td className="p-2 font-bold">{row.crossSection.toFixed(1)} mm²</td>
                    <td className="p-2 font-bold font-sans">{row.typeNameVi}</td>
                    <td className="p-2 text-center">
                      <span
                        className="inline-block w-5 h-4 border border-black align-middle"
                        style={{ backgroundColor: row.color }}
                        title={row.color}
                      />
                    </td>
                    <td className="p-2 text-center">{row.wireCount}</td>
                    <td className="p-2 text-right font-black text-sm text-[#4169E1]">
                      {row.totalLengthMeters.toFixed(2).replace('.', ',')} m
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F1F5F9] border-t-2 border-black font-black text-xs">
                  <td colSpan={3} className="p-2 uppercase font-sans">
                    Tổng cộng toàn bộ mạng điện
                  </td>
                  <td className="p-2 text-center">{summary.totalWires}</td>
                  <td className="p-2 text-right text-base text-[#B45309]">
                    {summary.grandTotalMeters.toFixed(2).replace('.', ',')} m
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </NeoModal>
  );
};
