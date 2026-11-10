import React, { useState } from 'react';
import { Home, Plus, Trash2, Edit3, Check, MousePointer } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { FloorDoor } from '../../core/model';

export const FloorPlanModal: React.FC = () => {
  const {
    circuit,
    floorPlanModalOpen,
    setFloorPlanModalOpen,
    updateFloorPlan,
    addFloorDoor,
    removeFloorDoor,
    removeFloorWall,
    drawingWall,
    setDrawingWall,
    selectedWallId,
    setSelectedWallId,
  } = useWorkspaceStore();

  const floorPlan = circuit.floorPlan || {
    name: 'MẶT BẰNG PHÒNG',
    widthM: 5,
    lengthM: 4,
    x: 80,
    y: 80,
    doors: [{ id: 'door1', wall: 'bottom', offset: 1.0, width: 0.9 }],
    partitionWalls: [],
  };

  // Local state for adding a new door
  const [newDoorWall, setNewDoorWall] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const [newDoorOffset, setNewDoorOffset] = useState<number>(1.0);
  const [newDoorWidth, setNewDoorWidth] = useState<number>(0.9);

  const handleAddDoor = () => {
    const door: FloorDoor = {
      id: `door_${Date.now()}`,
      wall: newDoorWall,
      offset: Math.max(0.1, Math.min(newDoorOffset, (newDoorWall === 'left' || newDoorWall === 'right' ? floorPlan.lengthM : floorPlan.widthM) - 0.5)),
      width: Math.max(0.4, newDoorWidth),
    };
    addFloorDoor(door);
  };

  return (
    <NeoModal
      isOpen={floorPlanModalOpen}
      onClose={() => setFloorPlanModalOpen(false)}
      title="CẤU HÌNH MẶT BẰNG PHÒNG"
      maxWidthClass="max-w-2xl"
      footerActions={
        <NeoButton
          variant="primary"
          onClick={() => setFloorPlanModalOpen(false)}
          icon={<Check size={14} strokeWidth={3} />}
          className="!h-[32px] !px-4 font-black"
        >
          XONG
        </NeoButton>
      }
    >
      <div className="space-y-5 text-sm">
        {/* Info Banner */}
        <div className="p-3 bg-[#EEF2FF] border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Home size={18} className="text-[#4169E1] shrink-0" strokeWidth={2.5} />
            <div className="text-xs text-gray-800 font-bold">
              Tỉ lệ cố định: <strong>1 m = 100 px</strong> (lưới 10 cm = 10 px). Đổi kích thước chỉ đổi khung phòng, không làm dịch chuyển thiết bị đã bố trí.
            </div>
          </div>
        </div>

        {/* 1. Tên phòng & Kích thước */}
        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0_#000] space-y-3">
          <div className="font-black text-xs uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 flex justify-between items-center">
            <span>1. Thông tin & Kích thước phòng</span>
            <span className="font-mono text-[11px] text-[#4169E1]">
              {(floorPlan.widthM * floorPlan.lengthM).toFixed(1)} m²
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-600 mb-1">Tên phòng / Nhãn</label>
              <input
                type="text"
                value={floorPlan.name}
                onChange={(e) => updateFloorPlan({ name: e.target.value })}
                className="w-full h-8 px-2 border-2 border-black font-bold text-xs bg-[#F8FAFC] focus:bg-white focus:outline-none"
                placeholder="VD: PHÒNG KHÁCH"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-600 mb-1">
                Chiều rộng (m, 1 - 20)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={20}
                  step={0.1}
                  value={floorPlan.widthM}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 1;
                    updateFloorPlan({ widthM: Math.max(1, Math.min(20, Math.round(val * 10) / 10)) });
                  }}
                  className="w-full h-8 px-2 border-2 border-black font-bold text-xs bg-[#F8FAFC] focus:bg-white focus:outline-none"
                />
                <span className="text-xs font-black text-gray-700">m</span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-600 mb-1">
                Chiều dài (m, 1 - 20)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={20}
                  step={0.1}
                  value={floorPlan.lengthM}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 1;
                    updateFloorPlan({ lengthM: Math.max(1, Math.min(20, Math.round(val * 10) / 10)) });
                  }}
                  className="w-full h-8 px-2 border-2 border-black font-bold text-xs bg-[#F8FAFC] focus:bg-white focus:outline-none"
                />
                <span className="text-xs font-black text-gray-700">m</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Cửa đi (Doors) */}
        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0_#000] space-y-3">
          <div className="font-black text-xs uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 flex justify-between items-center">
            <span>2. Danh sách cửa ra vào ({floorPlan.doors.length})</span>
          </div>

          {floorPlan.doors.length === 0 ? (
            <div className="text-xs text-gray-500 italic p-2 border border-dashed border-gray-300 text-center">
              Chưa có cửa nào. Thêm cửa bên dưới.
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {floorPlan.doors.map((door, idx) => {
                const wallNames: Record<string, string> = {
                  top: 'Cạnh trên',
                  bottom: 'Cạnh dưới',
                  left: 'Cạnh trái',
                  right: 'Cạnh phải',
                };
                return (
                  <div
                    key={door.id || idx}
                    className="flex items-center justify-between p-2 bg-[#F8FAFC] border border-black text-xs font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#FFD84D] border border-black flex items-center justify-center font-black text-[10px]">
                        {idx + 1}
                      </span>
                      <span>
                        {wallNames[door.wall] || door.wall}: cách đầu cạnh {door.offset.toFixed(1)} m, rộng {door.width.toFixed(1)} m
                      </span>
                    </div>
                    <button
                      onClick={() => removeFloorDoor(door.id)}
                      className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                      title="Xóa cửa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Form thêm cửa */}
          <div className="p-2 bg-[#FAFAFA] border border-black grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-600 mb-0.5">Cạnh tường</label>
              <select
                value={newDoorWall}
                onChange={(e) => setNewDoorWall(e.target.value as any)}
                className="w-full h-7 px-1 border border-black text-xs font-bold bg-white"
              >
                <option value="bottom">Dưới</option>
                <option value="top">Trên</option>
                <option value="left">Trái</option>
                <option value="right">Phải</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-600 mb-0.5">Vị trí (m)</label>
              <input
                type="number"
                min={0}
                max={20}
                step={0.1}
                value={newDoorOffset}
                onChange={(e) => setNewDoorOffset(parseFloat(e.target.value) || 0)}
                className="w-full h-7 px-1 border border-black text-xs font-bold bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-600 mb-0.5">Rộng (m)</label>
              <input
                type="number"
                min={0.4}
                max={3}
                step={0.1}
                value={newDoorWidth}
                onChange={(e) => setNewDoorWidth(parseFloat(e.target.value) || 0.9)}
                className="w-full h-7 px-1 border border-black text-xs font-bold bg-white"
              />
            </div>
            <div>
              <NeoButton
                variant="secondary"
                onClick={handleAddDoor}
                icon={<Plus size={12} strokeWidth={3} />}
                className="w-full !h-7 !text-[11px] font-black"
              >
                THÊM CỬA
              </NeoButton>
            </div>
          </div>
        </div>

        {/* 3. Tường ngăn (Partition Walls) */}
        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0_#000] space-y-3">
          <div className="font-black text-xs uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 flex justify-between items-center">
            <span>3. Tường ngăn nội bộ ({floorPlan.partitionWalls?.length || 0})</span>
            {selectedWallId && (
              <span className="text-[10px] bg-[#FFD84D] px-1.5 py-0.5 border border-black font-black">
                Đang chọn 1 tường
              </span>
            )}
          </div>

          <div className="text-xs text-gray-700">
            Tường ngăn vẽ tự do bằng 2 điểm (bám lưới 10 cm, nét 4px). Bấm chuột trực tiếp vào tường trên bản vẽ để chọn và xóa.
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NeoButton
              variant={drawingWall ? 'primary' : 'secondary'}
              onClick={() => {
                setDrawingWall(!drawingWall);
                if (!drawingWall) {
                  // Close modal so user can click on canvas to draw
                  setFloorPlanModalOpen(false);
                }
              }}
              icon={<Edit3 size={13} strokeWidth={2.5} />}
              className="!h-8 !px-3 font-black text-xs"
            >
              {drawingWall ? 'ĐANG CHẾ ĐỘ VẼ TƯỜNG (BẤM ĐỂ HỦY)' : 'VẼ TƯỜNG TRÊN KHUNG'}
            </NeoButton>

            <NeoButton
              variant="danger"
              disabled={!selectedWallId}
              onClick={() => {
                if (selectedWallId) {
                  removeFloorWall(selectedWallId);
                  setSelectedWallId(null);
                }
              }}
              icon={<Trash2 size={13} strokeWidth={2.5} />}
              className="!h-8 !px-3 font-black text-xs disabled:opacity-40"
            >
              XÓA TƯỜNG ĐANG CHỌN
            </NeoButton>

            {floorPlan.partitionWalls && floorPlan.partitionWalls.length > 0 && (
              <span className="text-[11px] text-gray-500 font-bold ml-auto">
                {floorPlan.partitionWalls.length} đoạn tường
              </span>
            )}
          </div>
        </div>
      </div>
    </NeoModal>
  );
};
