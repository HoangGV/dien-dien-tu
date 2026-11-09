import React, { useState, useRef } from 'react';
import { Info, Download, Upload, Trash2, ExternalLink, ShieldCheck, Database, Calendar, Tag } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { StorageService } from '../../core/storage';
import { getAllWorkspaces } from '../../core/workspaces';
import { createBulkExportPackage, downloadJsonFile, validateCircuitJson } from '../../core/io';
import { ExportPackage } from '../../core/types';

export interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStandards?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onOpenStandards,
}) => {
  const { loadWorkspace, clearWorkspaceCircuit } = useWorkspaceStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // App version and build date
  const appVersion = '1.0.0';
  const buildDate = '09/11/2026';

  // Export all workspaces
  const handleExportAll = async () => {
    setStatusMsg(null);
    try {
      const storage = StorageService.getInstance();
      const all = getAllWorkspaces();
      const backupData: Record<string, any> = {};

      for (const ws of all) {
        const state = await storage.loadCircuit(ws.slug);
        if (state) {
          backupData[ws.slug] = state;
        }
      }

      const pkg = createBulkExportPackage(backupData);
      const filename = `mach-dien-tat-ca-khong-gian-${Date.now()}.json`;
      downloadJsonFile(filename, JSON.stringify(pkg, null, 2));
      setStatusMsg({ text: `Đã xuất tất cả không gian vào "${filename}" thành công.`, type: 'success' });
    } catch {
      setStatusMsg({ text: 'Có lỗi xảy ra khi sao lưu dữ liệu.', type: 'error' });
    }
  };

  // Import all workspaces
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = validateCircuitJson(text);
      if (!res.valid || !res.data) {
        setStatusMsg({ text: res.error || 'Tập tin không hợp lệ.', type: 'error' });
        return;
      }

      const storage = StorageService.getInstance();
      if ('isBulk' in res.data && res.data.isBulk) {
        const workspacesData = res.data.workspaces;
        for (const [slug, circState] of Object.entries(workspacesData)) {
          await storage.saveCircuit(slug, circState as any);
        }
        await loadWorkspace(useWorkspaceStore.getState().activeSlug);
        setStatusMsg({ text: 'Đã nhập thành công toàn bộ dữ liệu ứng dụng.', type: 'success' });
      } else {
        // Single workspace package
        const single = res.data as ExportPackage;
        await storage.saveCircuit(single.slug, single.state);
        await loadWorkspace(single.slug);
        setStatusMsg({ text: `Đã nhập mạch thành công cho không gian "${single.slug}".`, type: 'success' });
      }
    } catch {
      setStatusMsg({ text: 'Không thể đọc hoặc giải mã tệp dữ liệu.', type: 'error' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Clear all data
  const handleClearAll = async () => {
    try {
      await StorageService.getInstance().clearAllWorkspaces();
      await clearWorkspaceCircuit();
      localStorage.clear();
      setConfirmClearAll(false);
      setStatusMsg({ text: 'Đã xóa toàn bộ dữ liệu ứng dụng. Hệ thống đã được đặt lại ban đầu.', type: 'success' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      setStatusMsg({ text: 'Không thể xóa toàn bộ dữ liệu.', type: 'error' });
    }
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title="GIỚI THIỆU ỨNG DỤNG"
      maxWidthClass="max-w-2xl"
      footerActions={
        <NeoButton variant="secondary" onClick={onClose}>
          ĐÓNG
        </NeoButton>
      }
    >
      <div className="space-y-4 text-black text-sm">
        {/* App Info Banner */}
        <div className="bg-[#EEF2FF] border-[3px] border-black p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black uppercase text-[#4169E1] tracking-tight">
              Mạch điện – Điện tử
            </h2>
            <p className="text-xs font-bold text-gray-700 mt-0.5">
              Phần mềm mô phỏng hệ thống điện và điện tử chuẩn TCVN / GDPT 2018
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="bg-[#FFD84D] text-black font-black text-xs px-2.5 py-1 border-2 border-black flex items-center gap-1">
              <Tag size={12} strokeWidth={3} /> v{appVersion}
            </span>
            <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
              <Calendar size={11} strokeWidth={2.5} /> {buildDate}
            </span>
          </div>
        </div>

        {/* Notices and Pedagogical Guidance */}
        <div className="border-[3px] border-black p-4 bg-white space-y-3 font-bold text-xs text-gray-800">
          <div className="flex items-start gap-2.5">
            <Info size={16} strokeWidth={3} className="text-[#4169E1] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Mô phỏng mang tính minh họa dạy học;</strong> ngưỡng cháy nổ và thông số linh kiện là gần đúng theo mô hình chuẩn sư phạm Công nghệ GDPT 2018.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck size={16} strokeWidth={3} className="text-[#2DB84D] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span>Kí hiệu theo TCVN/IEC, cần giáo viên đối chiếu với thiết bị thực tế. </span>
              {onOpenStandards && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenStandards();
                  }}
                  className="inline-flex items-center gap-1 text-[#4169E1] font-black underline hover:text-[#2F4FC0] cursor-pointer ml-1"
                >
                  [Mở Bảng kí hiệu TCVN]
                  <ExternalLink size={12} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Database size={16} strokeWidth={3} className="text-[#4169E1] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Dữ liệu lưu trên trình duyệt của bạn, không gửi đi đâu.</strong> Mọi sơ đồ mạch đều được lưu trữ hoàn toàn cục bộ trong bộ nhớ trình duyệt (LocalStorage & IndexedDB) trên thiết bị của bạn.
            </p>
          </div>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div
            className={`border-2 border-black p-3 font-black text-xs flex items-center gap-2 ${
              statusMsg.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
            }`}
          >
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Action Buttons: Export All & Import All */}
        <div className="border-[3px] border-black p-4 bg-[#FAFAFA] space-y-3">
          <div className="font-black text-xs uppercase text-gray-900">
            Sao lưu & Khôi phục toàn bộ ứng dụng
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NeoButton
              variant="primary"
              onClick={handleExportAll}
              icon={<Download size={15} strokeWidth={3} />}
              className="flex-1 min-w-[160px]"
            >
              XUẤT TẤT CẢ
            </NeoButton>

            <NeoButton
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload size={15} strokeWidth={3} />}
              className="flex-1 min-w-[160px]"
            >
              NHẬP TẤT CẢ
            </NeoButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Reset All Data (Danger) */}
        <div className="border-[3px] border-black p-4 bg-white space-y-2.5">
          <div className="font-black text-xs uppercase text-[#E5322D]">
            Vùng nguy hiểm: Xóa toàn bộ dữ liệu
          </div>
          <p className="text-xs text-gray-700 font-bold">
            Xóa toàn bộ các mạch điện đã vẽ ở tất cả không gian và khôi phục về trạng thái trắng ban đầu.
          </p>

          {!confirmClearAll ? (
            <NeoButton
              variant="danger"
              onClick={() => setConfirmClearAll(true)}
              icon={<Trash2 size={15} strokeWidth={3} />}
            >
              XÓA TOÀN BỘ DỮ LIỆU ỨNG DỤNG
            </NeoButton>
          ) : (
            <div className="bg-[#FFF1F2] border-2 border-[#E5322D] p-3.5 space-y-2">
              <div className="text-xs font-black text-[#E5322D]">
                CẢNH BÁO: Thao tác này sẽ xóa vĩnh viễn mọi sơ đồ mạch đã lưu ở tất cả không gian làm việc và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục không?
              </div>
              <div className="flex gap-2">
                <NeoButton
                  variant="danger"
                  onClick={handleClearAll}
                  className="!min-h-[34px] !py-1 text-xs"
                >
                  XÁC NHẬN XÓA HẾT
                </NeoButton>
                <NeoButton
                  variant="secondary"
                  onClick={() => setConfirmClearAll(false)}
                  className="!min-h-[34px] !py-1 text-xs"
                >
                  HỦY BỎ
                </NeoButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </NeoModal>
  );
};
