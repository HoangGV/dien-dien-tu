import React from 'react';
import { BookOpen, FolderOpen } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Preset } from '../../core/types';

export interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({ isOpen, onClose }) => {
  const { config, setCircuit } = useWorkspaceStore();

  const handleApplyPreset = (preset: Preset) => {
    setCircuit(preset.state, true);
    onClose();
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title={`MẠCH MẪU THỰC HÀNH: ${config.title.toUpperCase()}`}
      maxWidthClass="max-w-2xl"
      footerActions={
        <NeoButton variant="secondary" onClick={onClose}>
          ĐÓNG
        </NeoButton>
      }
    >
      <div className="space-y-3">
        {config.presets && config.presets.length > 0 ? (
          config.presets.map((preset, idx) => (
            <div
              key={preset.id || idx}
              className="border-[3px] border-black p-4 bg-white flex items-center justify-between gap-4"
            >
              <div>
                <h4 className="font-black text-sm uppercase text-black">{preset.title}</h4>
                <p className="text-xs text-gray-700 font-bold mt-1">{preset.description}</p>
              </div>
              <NeoButton
                variant="primary"
                onClick={() => handleApplyPreset(preset)}
                icon={<FolderOpen size={16} strokeWidth={3} />}
                className="shrink-0"
              >
                TẢI MẪU
              </NeoButton>
            </div>
          ))
        ) : (
          <div className="border-[3px] border-black p-6 bg-[#EEF2FF] text-center space-y-2">
            <BookOpen size={36} strokeWidth={2.5} className="mx-auto text-[#4169E1]" />
            <p className="font-black text-sm">CÁC MẠCH MẪU CHUẨN ĐANG ĐƯỢC CHUẨN BỊ</p>
            <p className="text-xs text-gray-700 font-bold">
              Các bài thực hành thí nghiệm chuẩn SGK Công nghệ 2018 (đèn cầu thang, ELCB chống rò, LED hạn dòng, nạp xả RC) sẽ được tích hợp ở Giai đoạn D.
            </p>
          </div>
        )}
      </div>
    </NeoModal>
  );
};
