import React, { useState } from 'react';
import { Layers, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { COMPONENT_DEFINITIONS, COMPONENT_MAP } from '../../core/registry';
import { ComponentDef } from '../../core/model';

export const Palette: React.FC = () => {
  const { config, leftPanelOpen, toggleLeftPanel, setPlacingType, placingType } =
    useWorkspaceStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter components relevant to this workspace: ensure boundary & textbox are always at the bottom
  const workspaceDefs = COMPONENT_DEFINITIONS.filter(def =>
    config.paletteIds.includes(def.type)
  ).filter(def =>
    searchTerm ? def.nameVi.toLowerCase().includes(searchTerm.toLowerCase()) : true
  ).sort((a, b) => {
    const isAnnotationA = a.type === 'boundary' || a.type === 'textbox' || a.category === 'annotation';
    const isAnnotationB = b.type === 'boundary' || b.type === 'textbox' || b.category === 'annotation';
    if (isAnnotationA && !isAnnotationB) return 1;
    if (!isAnnotationA && isAnnotationB) return -1;
    return 0;
  });

  if (!leftPanelOpen) {
    return (
      <div
        onClick={toggleLeftPanel}
        className="w-[20px] h-full bg-white border-r-2 border-black flex flex-col items-center justify-center cursor-pointer hover:bg-[#EEF2FF] select-none shadow-[1px_0_0_#000] z-20 shrink-0"
        title="Mở danh mục linh kiện"
      >
        <span
          className="font-black text-[10px] tracking-wider uppercase text-black rotate-90 whitespace-nowrap mb-4"
          style={{ writingMode: 'vertical-rl' }}
        >
          LINH KIỆN ▸
        </span>
      </div>
    );
  }

  return (
    <aside className="w-[176px] h-full bg-white border-r-2 border-black flex flex-col z-20 shadow-[2px_0_0_#000] select-none shrink-0">
      {/* Header (22px high, 12px font) */}
      <div className="h-[22px] bg-[#4169E1] text-white px-2 flex items-center justify-between border-b-2 border-black shrink-0">
        <span className="font-extrabold text-[12px] uppercase tracking-wider flex items-center gap-1">
          <Layers size={13} strokeWidth={3} />
          Linh kiện
        </span>
        <button
          onClick={toggleLeftPanel}
          className="w-[18px] h-[18px] bg-white text-black border border-black flex items-center justify-center hover:bg-[#FFD84D]"
          title="Thu gọn"
        >
          <ChevronLeft size={12} strokeWidth={3} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-1 border-b border-black bg-[#EEF2FF] shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[22px] px-1.5 text-[11px] font-bold border border-black bg-white outline-none focus:ring-1 focus:ring-[#FFD84D]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-1 text-xs text-gray-500 hover:text-black font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Responsive Grid with repeat(auto-fill, minmax(76px, 1fr)) */}
      <div
        className="flex-1 overflow-y-auto p-1 gap-1 content-start"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
        }}
      >
        {workspaceDefs.map((def) => {
          const isPlacingThis = placingType === def.type;
          const mockComp = {
            id: 'preview',
            type: def.type,
            x: 0,
            y: 0,
            rot: 0 as const,
            flip: false,
            label: '',
            props: def.defaultProps || {},
          };

          return (
            <div
              key={def.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', def.type);
                setPlacingType(def.type);
              }}
              onClick={() => {
                if (isPlacingThis) {
                  setPlacingType(null);
                } else {
                  setPlacingType(def.type);
                }
              }}
              className={`w-full min-w-0 h-[68px] border-2 border-black flex flex-col items-center justify-between p-1 cursor-grab active:cursor-grabbing hover:bg-[#EEF2FF] transition-transform ${
                isPlacingThis
                  ? 'bg-[#FFD84D] shadow-[2px_2px_0_#000] scale-[0.98]'
                  : 'bg-white shadow-[1px_1px_0_#000]'
              }`}
              title={`Kéo thả hoặc bấm để đặt: ${def.nameVi}`}
            >
              {/* Mini SVG Symbol preview */}
              <div className="w-full flex-1 flex items-center justify-center overflow-hidden pointer-events-none">
                <svg
                  viewBox="-45 -45 90 90"
                  className="w-[44px] h-[36px] max-w-full max-h-full"
                >
                  <def.symbol comp={mockComp} />
                </svg>
              </div>

              {/* Label with word wrap and no overflow */}
              <span className="text-[10px] font-black leading-[11px] text-center w-full text-black line-clamp-2 break-words">
                {def.nameVi}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
