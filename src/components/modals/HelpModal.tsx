import React from 'react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { useWorkspaceStore } from '../../store/workspaceStore';

export interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { config } = useWorkspaceStore();

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title={`TRỢ GIÚP & HƯỚNG DẪN: ${config.title.toUpperCase()}`}
      maxWidthClass="max-w-3xl"
      footerActions={
        <NeoButton variant="primary" onClick={onClose}>
          ĐÓNG HƯỚNG DẪN
        </NeoButton>
      }
    >
      <div className="space-y-4 text-black text-sm font-bold">
        {/* Workspace specific guide */}
        <div className="bg-[#EEF2FF] border-[3px] border-black p-4">
          <div className="text-base text-[#4169E1] font-black mb-2 uppercase">
            Kiến thức trọng tâm ({config.grades})
          </div>
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-gray-900">
            {config.helpText}
          </pre>
        </div>

        {/* Editor controls instructions */}
        <div className="border-[3px] border-black p-4 bg-white">
          <h3 className="font-black text-sm mb-2 text-[#4169E1] uppercase">
            Phím tắt và Thao tác soạn mạch
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-2 border-2 border-black bg-[#EEF2FF]">
              <span className="font-black text-black">Thêm linh kiện:</span> Kéo thả từ cột Linh kiện hoặc Bấm vào thẻ linh kiện rồi bấm vị trí trên bảng vẽ.
            </div>
            <div className="p-2 border-2 border-black bg-[#EEF2FF]">
              <span className="font-black text-black">Đi dây (bẻ góc):</span> Nhấn vào chân linh kiện, di chuột và bấm chuột trái để đặt điểm bẻ góc. Nhấn phím <kbd className="bg-white border px-1">Space</kbd> để đổi hướng ngang/dọc.
            </div>
            <div className="p-2 border-2 border-black bg-[#EEF2FF]">
              <span className="font-black text-black">Xoay & Lật:</span> Chọn linh kiện rồi nhấn <kbd className="bg-white border px-1">R</kbd> để xoay 90°, phím <kbd className="bg-white border px-1">F</kbd> để lật.
            </div>
            <div className="p-2 border-2 border-black bg-[#EEF2FF]">
              <span className="font-black text-black">Xóa:</span> Chọn linh kiện hoặc đoạn dây rồi nhấn phím <kbd className="bg-white border px-1">Delete</kbd> hoặc <kbd className="bg-white border px-1">Backspace</kbd>.
            </div>
            <div className="p-2 border-2 border-black bg-[#EEF2FF]">
              <span className="font-black text-black">Hoàn tác / Làm lại:</span> <kbd className="bg-white border px-1">Ctrl+Z</kbd> để hoàn tác, <kbd className="bg-white border px-1">Ctrl+Y</kbd> hoặc <kbd className="bg-white border px-1">Ctrl+Shift+Z</kbd> để làm lại.
            </div>
            <div className="p-2 border-2 border-black bg-[#EEF2FF]">
              <span className="font-black text-black">Thu phóng / Di chuyển:</span> Cuộn chuột để Phóng to/Thu nhỏ, giữ phím <kbd className="bg-white border px-1">Space</kbd> hoặc chọn công cụ Bàn tay để kéo trượt vùng nhìn.
            </div>
          </div>
        </div>

        {/* Safety & Education note */}
        <div className="bg-[#FFD84D] border-[3px] border-black p-3 text-xs">
          <strong>LƯU Ý AN TOÀN SƯ PHẠM:</strong> Mọi thông số và hiện tượng mô phỏng (chập cháy, nổ tụ, dòng rò qua cơ thể) được thiết kế phục vụ mục đích giáo dục môn Công nghệ GDPT 2018 nhằm giúp học sinh hiểu nguyên lí và biết cách phòng tránh tai nạn điện trong thực tế.
        </div>
      </div>
    </NeoModal>
  );
};
