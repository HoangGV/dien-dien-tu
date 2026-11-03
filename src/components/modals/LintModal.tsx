import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { useWorkspaceStore } from '../../store/workspaceStore';

export interface LintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LintModal: React.FC<LintModalProps> = ({ isOpen, onClose }) => {
  const { lintWarnings, selectComponent, selectWire } = useWorkspaceStore();

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title="KIỂM TRA QUY TẮC MẠCH ĐIỆN (LINT)"
      maxWidthClass="max-w-lg"
      footerActions={
        <NeoButton variant="primary" onClick={onClose}>
          ĐÓNG
        </NeoButton>
      }
    >
      <div className="space-y-3 font-bold text-xs">
        {lintWarnings.length === 0 ? (
          <div className="p-4 bg-[#EAFFEA] border-2 border-[#2DB84D] flex items-center gap-3 text-[#2DB84D]">
            <CheckCircle2 size={24} strokeWidth={3} />
            <div>
              <div className="font-black text-sm">MẠCH ĐIỆN HỢP LỆ!</div>
              <div className="text-[11px] text-gray-700 font-bold">
                Không phát hiện lỗi hở mạch, chập linh kiện hoặc thiếu điểm tham chiếu.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-700">
              Phát hiện {lintWarnings.length} vấn đề cần lưu ý trước khi chạy mô phỏng:
            </p>
            {lintWarnings.map((w) => (
              <div
                key={w.id}
                onClick={() => {
                  if (w.targetCompId) selectComponent(w.targetCompId, false);
                  if (w.targetWireId) selectWire(w.targetWireId, false);
                  onClose();
                }}
                className={`p-2.5 border-2 border-black flex items-start gap-2 cursor-pointer hover:bg-[#EEF2FF] transition-colors ${
                  w.type === 'error' ? 'bg-[#FFEAEA] text-[#E5322D]' : 'bg-[#FFFDE6] text-black'
                }`}
              >
                <AlertTriangle size={16} strokeWidth={3} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-black">{w.message}</div>
                  <span className="text-[10px] text-gray-600 block mt-0.5">
                    (Bấm vào đây để chọn đối tượng trên bảng vẽ)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </NeoModal>
  );
};
