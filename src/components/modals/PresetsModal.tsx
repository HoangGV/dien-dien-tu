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
  const { config, setCircuit, setStatusMessage } = useWorkspaceStore();

  const handleApplyPreset = (preset: Preset) => {
    setCircuit(preset.state, true);
    if (preset.expectation) {
      setStatusMessage(preset.expectation);
    }
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
      <div className="space-y-4">
        {config.presets && config.presets.length > 0 ? (
          (() => {
            const grouped: Record<string, Preset[]> = {};
            for (const p of config.presets) {
              const grp = p.group || 'Mạch mẫu';
              if (!grouped[grp]) grouped[grp] = [];
              grouped[grp].push(p);
            }
            return Object.entries(grouped).map(([grpName, pList]) => (
              <div key={grpName} className="space-y-2">
                <div className="bg-[#EEF2FF] border-2 border-black px-3 py-1 font-black text-xs uppercase text-[#4169E1]">
                  {grpName}
                </div>
                <div className="space-y-2">
                  {pList.map((preset) => (
                    <div
                      key={preset.id}
                      className="border-[3px] border-black p-3.5 bg-white flex items-center justify-between gap-3 shadow-[2px_2px_0_#000]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm uppercase text-black">{preset.title}</h4>
                          {preset.grade && (
                            <span className="bg-[#FFD84D] text-black font-black text-[10px] px-1.5 py-0.5 border border-black">
                              {preset.grade}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 font-bold">{preset.description}</p>
                        {preset.expectation && (
                          <div className="text-[11px] font-bold text-[#4169E1] bg-[#F0F4FF] px-2 py-0.5 border border-dashed border-[#4169E1] inline-block">
                            {preset.expectation}
                          </div>
                        )}
                      </div>
                      <NeoButton
                        variant="primary"
                        onClick={() => handleApplyPreset(preset)}
                        icon={<FolderOpen size={15} strokeWidth={3} />}
                        className="shrink-0"
                      >
                        TẢI MẪU
                      </NeoButton>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()
        ) : (
          <div className="border-[3px] border-black p-6 bg-[#EEF2FF] text-center space-y-2">
            <BookOpen size={36} strokeWidth={2.5} className="mx-auto text-[#4169E1]" />
            <p className="font-black text-sm">CHƯA CÓ MẠCH MẪU CHO KHÔNG GIAN NÀY</p>
          </div>
        )}
      </div>
    </NeoModal>
  );
};
