import React, { useState } from 'react';
import { Layers, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { getWorkspacePaletteItems } from '../../core/registry';

export const Palette: React.FC = () => {
  const {
    config,
    leftPanelOpen,
    toggleLeftPanel,
    setPlacingType,
    placingType,
    placingPresetProps,
  } = useWorkspaceStore();
  const [searchTerm, setSearchTerm] = useState('');

  const paletteItems = getWorkspacePaletteItems(config.paletteIds, searchTerm);

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
        {paletteItems.map((item, idx) => {
          const prevGroup = idx > 0 ? paletteItems[idx - 1].groupTitle : undefined;
          const nextGroup = idx < paletteItems.length - 1 ? paletteItems[idx + 1].groupTitle : undefined;
          const showGroupHeader = item.groupTitle && item.groupTitle !== prevGroup;
          const showGroupFooterDivider = item.groupTitle && item.groupTitle !== nextGroup && idx < paletteItems.length - 1;

          const isPlacingThis =
            placingType === item.type &&
            (item.presetProps
              ? JSON.stringify(placingPresetProps || {}) === JSON.stringify(item.presetProps)
              : !placingPresetProps);

          const mockComp = {
            id: 'preview',
            type: item.type,
            x: 0,
            y: 0,
            rot: 0 as const,
            flip: false,
            label: '',
            props: { ...(item.def.defaultProps || {}), ...(item.presetProps || {}) },
          };

          return (
            <React.Fragment key={item.key}>
              {showGroupHeader && (
                <div className="col-span-full flex items-center justify-between px-1 pt-1 pb-0.5 mt-0.5 border-b border-black/30 bg-[#EEF2FF]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#4169E1]">
                    {item.groupTitle}
                  </span>
                </div>
              )}

              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.type);
                  if (item.presetProps) {
                    e.dataTransfer.setData('application/x-preset-props', JSON.stringify(item.presetProps));
                  }
                  setPlacingType(item.type, item.presetProps);
                }}
                onClick={() => {
                  if (isPlacingThis) {
                    setPlacingType(null);
                  } else {
                    setPlacingType(item.type, item.presetProps);
                  }
                }}
                className={`w-full min-w-0 h-[68px] border-2 border-black flex flex-col items-center justify-between p-1 cursor-grab active:cursor-grabbing hover:bg-[#EEF2FF] transition-transform ${
                  isPlacingThis
                    ? 'bg-[#FFD84D] shadow-[2px_2px_0_#000] scale-[0.98]'
                    : 'bg-white shadow-[1px_1px_0_#000]'
                }`}
                title={`Kéo thả hoặc bấm để đặt: ${item.groupTitle ? `${item.groupTitle} ${item.label}` : item.label}`}
              >
                {/* Mini SVG Symbol preview */}
                <div className="w-full flex-1 flex items-center justify-center overflow-hidden pointer-events-none">
                  <svg
                    viewBox="-45 -45 90 90"
                    className="w-[44px] h-[36px] max-w-full max-h-full"
                  >
                    <item.def.symbol comp={mockComp} />
                  </svg>
                </div>

                {/* Label with word wrap and no overflow */}
                <span className="text-[10px] font-black leading-[11px] text-center w-full text-black line-clamp-2 break-words">
                  {item.label}
                </span>
              </div>

              {showGroupFooterDivider && (
                <div className="col-span-full border-t border-black/25 my-0.5" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </aside>
  );
};
