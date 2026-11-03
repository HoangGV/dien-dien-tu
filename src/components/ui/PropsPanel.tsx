import React, { useState, useEffect } from 'react';
import {
  Sliders,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  Copy,
  Sparkles,
  GitCommit,
  X,
  Zap,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { COMPONENT_MAP } from '../../core/registry';
import { NeoButton } from '../common/NeoButton';
import { WireType } from '../../core/model';

export interface PropsPanelProps {
  isBottomSheet?: boolean;
}

export const PropsPanel: React.FC<PropsPanelProps> = ({ isBottomSheet = false }) => {
  const {
    circuit,
    selectedComponentIds,
    selectedWireIds,
    rightPanelOpen,
    toggleRightPanel,
    closeRightPanel,
    updateComponentProp,
    updateComponentLabel,
    setComponentRotation,
    flipSelected,
    deleteSelected,
    duplicateSelected,
    restoreAllDamaged,
    updateWireProps,
    setWireType,
    rerouteWireAuto,
  } = useWorkspaceStore();

  const selectedComp =
    selectedComponentIds.length === 1
      ? circuit.components.find((c) => c.id === selectedComponentIds[0])
      : null;

  const selectedWire =
    selectedWireIds.length === 1
      ? circuit.wires.find((w) => w.id === selectedWireIds[0])
      : null;

  const def = selectedComp ? COMPONENT_MAP.get(selectedComp.type) : null;

  // Local state for label and rotation input to avoid jitter
  const [localLabel, setLocalLabel] = useState('');
  const [localRot, setLocalRot] = useState('0');

  useEffect(() => {
    if (selectedComp) {
      setLocalLabel(selectedComp.label || '');
      setLocalRot(String(Math.round(selectedComp.rot * 10) / 10));
    }
  }, [selectedComp?.id, selectedComp?.rot, selectedComp?.label]);

  if (!rightPanelOpen) {
    return null;
  }

  const panelContainerClass = isBottomSheet
    ? 'w-full max-h-[50dvh] bg-white border-t-2 border-black flex flex-col z-30 shadow-[0_-3px_0_#000] select-none text-black'
    : 'w-[224px] max-w-[85vw] h-full bg-white border-l-2 border-black flex flex-col z-20 shadow-[-2px_0_0_#000] select-none shrink-0 text-black';

  return (
    <aside className={panelContainerClass}>
      {/* Header (22px high, 12px font) */}
      <div className="h-[22px] bg-[#4169E1] text-white px-2 flex items-center justify-between border-b-2 border-black shrink-0">
        <span className="font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1 truncate">
          <Sliders size={12} strokeWidth={3} />
          Thuộc tính
        </span>
        <button
          onClick={closeRightPanel}
          className="w-[18px] h-[18px] bg-white text-black border border-black flex items-center justify-center hover:bg-[#FFD84D] active:translate-y-0.5 cursor-pointer"
          title="Đóng bảng thuộc tính"
        >
          <X size={12} strokeWidth={3} />
        </button>
      </div>

      {/* Body: Scrollable with 4 clean groups */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 font-bold text-xs">
        {/* CASE 1: COMPONENT SELECTED */}
        {selectedComp && def && (
          <div className="space-y-3">
            {/* NHÓM 1: CHUNG */}
            <div className="border border-black bg-[#EEF2FF] p-2 space-y-2">
              <div className="text-[10px] font-black uppercase text-[#4169E1] tracking-wider border-b border-black/20 pb-0.5">
                1. Thông tin chung
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-gray-700">Loại:</span>
                <span className="text-[11px] font-black text-black truncate max-w-[120px]" title={def.nameVi}>
                  {def.nameVi}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1">
                <label className="text-[10px] text-gray-700">Kí hiệu:</label>
                <input
                  type="text"
                  value={localLabel}
                  onChange={(e) => setLocalLabel(e.target.value)}
                  onBlur={() => updateComponentLabel(selectedComp.id, localLabel)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateComponentLabel(selectedComp.id, localLabel);
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-20 h-[22px] px-1 border border-black text-[11px] font-black bg-white outline-none focus:bg-[#FFD84D]/30"
                />
              </div>

              {selectedComp.isDamaged && (
                <div className="p-1 bg-[#E5322D] text-white border border-black text-[10px] font-black text-center">
                  Linh kiện đang bị chập / hỏng!
                </div>
              )}
            </div>

            {/* NHÓM 2: THÔNG SỐ (DYNAMIC SCHEMA) */}
            <div className="border border-black bg-white p-2 space-y-2">
              <div className="text-[10px] font-black uppercase text-[#4169E1] tracking-wider border-b border-black/20 pb-0.5">
                2. Thông số kĩ thuật
              </div>

              {/* Special LED Color Picker */}
              {selectedComp.type === 'led' && (
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-700">Màu phát sáng:</div>
                  <div className="grid grid-cols-6 gap-1">
                    {[
                      { id: 'red', hex: '#E5322D', title: 'Đỏ' },
                      { id: 'yellow', hex: '#FFD84D', title: 'Vàng' },
                      { id: 'green', hex: '#2DB84D', title: 'Xanh lá' },
                      { id: 'blue', hex: '#4169E1', title: 'Xanh dương' },
                      { id: 'white', hex: '#FFFFFF', title: 'Trắng' },
                      { id: 'orange', hex: '#FF8C00', title: 'Cam' },
                    ].map((col) => {
                      const isCur = (selectedComp.props.color || 'red') === col.id;
                      return (
                        <button
                          key={col.id}
                          onClick={() => updateComponentProp(selectedComp.id, 'color', col.id)}
                          className={`h-5 border-2 border-black flex items-center justify-center cursor-pointer ${
                            isCur ? 'ring-2 ring-black scale-110 shadow-[1px_1px_0_#000]' : ''
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.title}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Property Schema Fields */}
              {def.propsSchema &&
                def.propsSchema.map((schema) => {
                  if (selectedComp.type === 'led' && schema.key === 'color') return null;
                  const currentVal = selectedComp.props[schema.key] ?? schema.default;

                  return (
                    <div key={schema.key} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-700">{schema.label}:</span>
                        {schema.unit && <span className="text-gray-500 font-mono">({schema.unit})</span>}
                      </div>

                      {schema.kind === 'select' && schema.options && (
                        <select
                          value={currentVal}
                          onChange={(e) => {
                            const val = isNaN(Number(e.target.value))
                              ? e.target.value
                              : Number(e.target.value);
                            updateComponentProp(selectedComp.id, schema.key, val);
                          }}
                          className="w-full h-[24px] px-1 border border-black text-[11px] font-bold bg-white outline-none cursor-pointer"
                        >
                          {schema.options.map((opt) => (
                            <option key={String(opt.value)} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {schema.kind === 'number' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={schema.min}
                            max={schema.max}
                            step={schema.step || 1}
                            value={currentVal}
                            onChange={(e) =>
                              updateComponentProp(
                                selectedComp.id,
                                schema.key,
                                parseFloat(e.target.value) || schema.default
                              )
                            }
                            className="w-full h-[24px] px-1 border border-black text-[11px] font-black bg-white"
                          />
                        </div>
                      )}

                      {schema.kind === 'text' && (
                        <input
                          type="text"
                          value={currentVal}
                          onChange={(e) => updateComponentProp(selectedComp.id, schema.key, e.target.value)}
                          className="w-full h-[24px] px-1 border border-black text-[11px] font-bold bg-white"
                        />
                      )}

                      {schema.kind === 'bool' && (
                        <button
                          onClick={() => updateComponentProp(selectedComp.id, schema.key, !currentVal)}
                          className={`w-full h-[24px] border border-black text-[10px] font-black uppercase cursor-pointer transition-colors ${
                            currentVal ? 'bg-[#2DB84D] text-white' : 'bg-gray-200 text-black'
                          }`}
                        >
                          {currentVal ? 'BẬT / ĐÓNG' : 'TẮT / NGẮT'}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* NHÓM 3: VỊ TRÍ & HƯỚNG */}
            <div className="border border-black bg-white p-2 space-y-2">
              <div className="text-[10px] font-black uppercase text-[#4169E1] tracking-wider border-b border-black/20 pb-0.5">
                3. Hướng xoay & Lật
              </div>

              {/* Exact angle input */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-gray-700">Góc xoay (°):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="359.9"
                    step="1"
                    value={localRot}
                    onChange={(e) => setLocalRot(e.target.value)}
                    onBlur={() => {
                      const deg = parseFloat(localRot);
                      if (!isNaN(deg)) setComponentRotation(selectedComp.id, deg);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const deg = parseFloat(localRot);
                        if (!isNaN(deg)) setComponentRotation(selectedComp.id, deg);
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-16 h-[22px] px-1 border border-black text-[11px] font-black bg-white text-right"
                  />
                  <span className="text-[11px] font-black">°</span>
                </div>
              </div>

              {/* 4 quick degree buttons */}
              <div className="grid grid-cols-4 gap-1">
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => setComponentRotation(selectedComp.id, deg)}
                    className={`h-[22px] border border-black text-[10px] font-black ${
                      Math.round(selectedComp.rot) === deg
                        ? 'bg-[#FFD84D]'
                        : 'bg-white hover:bg-[#EEF2FF]'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>

              {/* Flip X and Flip Y */}
              <div className="flex items-center gap-1 pt-1">
                <NeoButton
                  variant="secondary"
                  onClick={() => flipSelected('x')}
                  icon={<FlipHorizontal size={12} strokeWidth={3} />}
                  className={`flex-1 !h-[24px] !text-[9px] !px-1 ${
                    selectedComp.flip ? '!bg-[#FFD84D]' : ''
                  }`}
                  title="Lật theo trục ngang (F)"
                >
                  LẬT NGANG
                </NeoButton>
                <NeoButton
                  variant="secondary"
                  onClick={() => flipSelected('y')}
                  icon={<FlipVertical size={12} strokeWidth={3} />}
                  className={`flex-1 !h-[24px] !text-[9px] !px-1 ${
                    selectedComp.flipY ? '!bg-[#FFD84D]' : ''
                  }`}
                  title="Lật theo trục dọc"
                >
                  LẬT DỌC
                </NeoButton>
              </div>
            </div>

            {/* NHÓM 4: HÀNH ĐỘNG */}
            <div className="border border-black bg-[#EEF2FF] p-2 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-[#4169E1] tracking-wider border-b border-black/20 pb-0.5">
                4. Thao tác
              </div>

              <div className="flex items-center gap-1">
                <NeoButton
                  variant="secondary"
                  onClick={duplicateSelected}
                  icon={<Copy size={12} strokeWidth={3} />}
                  className="flex-1 !h-[26px] !text-[10px]"
                  title="Nhân đôi linh kiện (Ctrl+D)"
                >
                  NHÂN ĐÔI
                </NeoButton>

                <NeoButton
                  variant="danger"
                  onClick={deleteSelected}
                  icon={<Trash2 size={12} strokeWidth={3} />}
                  className="!h-[26px] !text-[10px] !px-2"
                  title="Xóa linh kiện (Delete)"
                >
                  XÓA
                </NeoButton>
              </div>

              <NeoButton
                variant="secondary"
                onClick={restoreAllDamaged}
                icon={<Sparkles size={12} strokeWidth={3} />}
                className="w-full !h-[26px] !text-[10px]"
                title="Thay thế linh kiện mới (hồi phục hỏng)"
              >
                THAY LINH KIỆN MỚI
              </NeoButton>
            </div>
          </div>
        )}

        {/* CASE 2: WIRE SELECTED */}
        {selectedWire && (
          <div className="space-y-3">
            <div className="border border-black bg-[#EEF2FF] p-2 space-y-2">
              <div className="text-[10px] font-black uppercase text-[#4169E1] tracking-wider border-b border-black/20 pb-0.5 flex items-center gap-1">
                <GitCommit size={12} strokeWidth={3} />
                Dây dẫn điện
              </div>

              {/* Wire Type Selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-700">Loại dây:</label>
                <select
                  value={selectedWire.wireType || 'phase'}
                  onChange={(e) => setWireType(selectedWire.id, e.target.value as WireType)}
                  className="w-full h-[26px] px-1 border border-black text-[11px] font-black bg-white"
                >
                  <option value="phase">Dây pha (A) - Màu đỏ</option>
                  <option value="neutral">Dây trung tính (O) - Xanh</option>
                  <option value="ground">Dây nối đất (PE) - Vàng-Xanh</option>
                  <option value="other">Dây khác / Tùy chỉnh</option>
                </select>
              </div>

              {/* Wire Color */}
              <div className="space-y-1">
                <div className="text-[10px] text-gray-700">Màu dây:</div>
                <div className="flex items-center gap-1">
                  {[
                    { hex: '#E5322D', label: 'Đỏ (A)' },
                    { hex: '#4169E1', label: 'Xanh (O)' },
                    { hex: '#2DB84D', label: 'Lá (PE)' },
                    { hex: '#000000', label: 'Đen' },
                    { hex: '#FFD84D', label: 'Vàng' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      onClick={() =>
                        updateWireProps(selectedWire.id, c.hex, selectedWire.crossSection)
                      }
                      className={`w-6 h-5 border-2 border-black ${
                        selectedWire.color === c.hex ? 'ring-2 ring-black scale-110' : ''
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Wire Cross Section */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-700">Tiết diện (mm²):</label>
                <select
                  value={selectedWire.crossSection}
                  onChange={(e) =>
                    updateWireProps(
                      selectedWire.id,
                      selectedWire.color,
                      parseFloat(e.target.value) || 2.5
                    )
                  }
                  className="w-full h-[24px] px-1 border border-black text-[11px] font-bold bg-white"
                >
                  <option value={1.5}>1.5 mm² (Đèn chiếu sáng)</option>
                  <option value={2.5}>2.5 mm² (Ổ cắm thông thường)</option>
                  <option value={4.0}>4.0 mm² (Bếp / Bình nóng lạnh)</option>
                  <option value={6.0}>6.0 mm² (Dây dẫn trục chính)</option>
                </select>
              </div>

              <div className="text-[10px] text-gray-600 pt-1">
                Số đoạn gấp khúc: {selectedWire.points.length - 1}
              </div>
            </div>

            {/* Wire Actions */}
            <div className="space-y-1.5">
              <NeoButton
                variant="secondary"
                onClick={() => rerouteWireAuto(selectedWire.id)}
                icon={<Zap size={12} strokeWidth={3} />}
                className="w-full !h-[26px] !text-[10px]"
                title="Tự động vẽ lại dây theo đường vuông góc tối ưu"
              >
                ĐI LẠI TỰ ĐỘNG
              </NeoButton>

              <NeoButton
                variant="danger"
                onClick={deleteSelected}
                icon={<Trash2 size={12} strokeWidth={3} />}
                className="w-full !h-[26px] !text-[10px]"
                title="Xóa đoạn dây này"
              >
                XÓA DÂY
              </NeoButton>
            </div>
          </div>
        )}

        {/* CASE 3: NO SELECTION OR MULTIPLE */}
        {!selectedComp && !selectedWire && (
          <div className="p-3 border-2 border-dashed border-gray-400 bg-gray-50 text-center text-gray-500 text-[11px] space-y-2 mt-4">
            <p>Bấm chọn 1 linh kiện hoặc 1 đoạn dây trên khung vẽ để xem & chỉnh sửa thuộc tính.</p>
            <p className="text-[10px] text-gray-400">
              Mẹo: Giữ Shift để chọn nhiều đối tượng; nhấn R để xoay nhanh, phím F để lật.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
