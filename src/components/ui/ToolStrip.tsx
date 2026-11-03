import React from 'react';
import { MousePointer, GitCommit, Trash2, Hand } from 'lucide-react';
import { useWorkspaceStore, ActiveTool } from '../../store/workspaceStore';

export const ToolStrip: React.FC = () => {
  const { activeTool, setTool, fullFrameMode } = useWorkspaceStore();

  if (fullFrameMode) return null;

  const tools: { id: ActiveTool; label: string; icon: React.ReactNode; tooltip: string }[] = [
    {
      id: 'select',
      label: 'CHỌN',
      icon: <MousePointer size={16} strokeWidth={3} />,
      tooltip: 'Công cụ Chọn & Di chuyển (V)',
    },
    {
      id: 'wire',
      label: 'DÂY',
      icon: <GitCommit size={16} strokeWidth={3} />,
      tooltip: 'Công cụ Đi dây bẻ góc (W)',
    },
    {
      id: 'delete',
      label: 'XÓA',
      icon: <Trash2 size={16} strokeWidth={3} />,
      tooltip: 'Công cụ Xóa nhanh (X / Del)',
    },
    {
      id: 'pan',
      label: 'TAY',
      icon: <Hand size={16} strokeWidth={3} />,
      tooltip: 'Công cụ Trượt khung vẽ (H / Giữ Space)',
    },
  ];

  return (
    <div className="w-[44px] h-full bg-white border-r-2 border-black flex flex-col items-center py-2 gap-1.5 select-none shadow-[2px_0_0_#000] z-20 shrink-0">
      {tools.map((t) => {
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={`w-[40px] h-[40px] border-2 border-black flex flex-col items-center justify-center transition-transform active:translate-y-0.5 ${
              isActive
                ? 'bg-[#4169E1] text-white shadow-[2px_2px_0_#000]'
                : 'bg-white text-black hover:bg-[#EEF2FF]'
            }`}
            title={t.tooltip}
          >
            {t.icon}
            <span className="text-[10px] font-black leading-none mt-1">
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
