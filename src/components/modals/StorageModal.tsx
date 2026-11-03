import React, { useEffect, useState } from 'react';
import { Database, Trash2, HardDrive, RefreshCw } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { StorageService, StorageStats } from '../../core/storage';

export interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageModal: React.FC<StorageModalProps> = ({ isOpen, onClose }) => {
  const { activeSlug, config, clearWorkspaceCircuit, refreshStorageStats, storageStats } =
    useWorkspaceStore();

  const [stats, setStats] = useState<StorageStats | null>(storageStats);
  const [confirmClearCurrent, setConfirmClearCurrent] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const loadStats = async () => {
    const s = await StorageService.getInstance().getStorageStats();
    setStats(s);
    refreshStorageStats();
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
      setConfirmClearCurrent(false);
      setConfirmClearAll(false);
    }
  }, [isOpen]);

  const handleClearCurrent = async () => {
    await clearWorkspaceCircuit();
    setConfirmClearCurrent(false);
    await loadStats();
  };

  const handleClearAll = async () => {
    await StorageService.getInstance().clearAllWorkspaces();
    await clearWorkspaceCircuit();
    setConfirmClearAll(false);
    await loadStats();
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title="QUẢN LÝ DỮ LIỆU & BỘ NHỚ"
      maxWidthClass="max-w-xl"
      footerActions={
        <NeoButton variant="secondary" onClick={onClose}>
          ĐÓNG
        </NeoButton>
      }
    >
      <div className="space-y-4">
        {/* Storage stats card */}
        <div className="border-[3px] border-black p-4 bg-[#EEF2FF] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-black text-sm uppercase flex items-center gap-2">
              <HardDrive size={20} strokeWidth={3} className="text-[#4169E1]" />
              Dung lượng đã sử dụng:
            </span>
            <span className="bg-white border-2 border-black px-3 py-1 font-black text-sm text-[#4169E1]">
              {stats?.formattedSize || '0 B'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-800 font-bold">
            <span>Số mục lưu trữ cục bộ:</span>
            <span>{stats?.itemCount || 0} mục</span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-800 font-bold">
            <span>Chế độ lưu bền vững (Persistent):</span>
            <span className={stats?.hasPersistentStorage ? 'text-[#2DB84D]' : 'text-[#E5322D]'}>
              {stats?.hasPersistentStorage ? 'ĐÃ KÍCH HOẠT' : 'TIÊU CHUẨN'}
            </span>
          </div>
        </div>

        {/* Clear current workspace */}
        <div className="border-[3px] border-black p-4 bg-white space-y-2">
          <h3 className="font-black text-sm text-black uppercase">
            Xóa dữ liệu không gian hiện tại ({config.title})
          </h3>
          <p className="text-xs text-gray-700 font-bold">
            Xóa trắng bảng vẽ và dữ liệu đã lưu của không gian làm việc này. Các không gian khác không bị ảnh hưởng.
          </p>

          {!confirmClearCurrent ? (
            <NeoButton
              variant="danger"
              onClick={() => setConfirmClearCurrent(true)}
              icon={<Trash2 size={16} strokeWidth={3} />}
            >
              XÓA MẠCH HIỆN TẠI
            </NeoButton>
          ) : (
            <div className="bg-[#FFEAEA] border-2 border-[#E5322D] p-3 flex items-center justify-between gap-2">
              <span className="text-xs font-black text-[#E5322D]">
                Bạn có chắc chắn muốn xóa không?
              </span>
              <div className="flex gap-2">
                <NeoButton variant="danger" onClick={handleClearCurrent} className="!min-h-[36px] !py-1 text-xs">
                  XÁC NHẬN XÓA
                </NeoButton>
                <NeoButton
                  variant="secondary"
                  onClick={() => setConfirmClearCurrent(false)}
                  className="!min-h-[36px] !py-1 text-xs"
                >
                  HỦY
                </NeoButton>
              </div>
            </div>
          )}
        </div>

        {/* Reset all data */}
        <div className="border-[3px] border-black p-4 bg-white space-y-2">
          <h3 className="font-black text-sm text-[#E5322D] uppercase">
            Đặt lại toàn bộ ứng dụng (Xóa tất cả)
          </h3>
          <p className="text-xs text-gray-700 font-bold">
            Xóa toàn bộ các mạch đã vẽ trong cả 2 không gian và khôi phục cài đặt mặc định ban đầu.
          </p>

          {!confirmClearAll ? (
            <NeoButton
              variant="danger"
              onClick={() => setConfirmClearAll(true)}
              icon={<Trash2 size={16} strokeWidth={3} />}
            >
              XÓA TOÀN BỘ DỮ LIỆU
            </NeoButton>
          ) : (
            <div className="bg-[#FFEAEA] border-2 border-[#E5322D] p-3 flex items-center justify-between gap-2">
              <span className="text-xs font-black text-[#E5322D]">
                CẢNH BÁO: Hành động này không thể hoàn tác!
              </span>
              <div className="flex gap-2">
                <NeoButton variant="danger" onClick={handleClearAll} className="!min-h-[36px] !py-1 text-xs">
                  XÓA HẾT
                </NeoButton>
                <NeoButton
                  variant="secondary"
                  onClick={() => setConfirmClearAll(false)}
                  className="!min-h-[36px] !py-1 text-xs"
                >
                  HỦY
                </NeoButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </NeoModal>
  );
};
