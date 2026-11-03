import React, { useRef, useState } from 'react';
import { Download, Upload, Image, FileJson, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { useWorkspaceStore } from '../../store/workspaceStore';
import {
  downloadJsonFile,
  createWorkspaceExportPackage,
  createBulkExportPackage,
  validateCircuitJson,
  exportSvgToPng,
} from '../../core/io';
import { StorageService } from '../../core/storage';
import { getAllWorkspaces } from '../../core/workspaces';

export interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  svgRef,
}) => {
  const { activeSlug, config, circuit, setCircuit, loadWorkspace, refreshStorageStats } =
    useWorkspaceStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [slugMismatchInfo, setSlugMismatchInfo] = useState<{
    targetSlug: string;
    rawText: string;
  } | null>(null);

  const resetStatus = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSlugMismatchInfo(null);
  };

  // Export current workspace
  const handleExportCurrent = () => {
    resetStatus();
    const pkg = createWorkspaceExportPackage(activeSlug, config.title, circuit);
    const filename = `mach-dien-${activeSlug}-${Date.now()}.json`;
    downloadJsonFile(filename, JSON.stringify(pkg, null, 2));
    setSuccessMsg(`Đã xuất tệp mạch "${filename}" thành công.`);
  };

  // Export all workspaces
  const handleExportAll = async () => {
    resetStatus();
    const storage = StorageService.getInstance();
    const all = getAllWorkspaces();
    const backupData: Record<string, any> = {};

    for (const ws of all) {
      const state = await storage.loadCircuit(ws.slug);
      if (state) {
        backupData[ws.slug] = state;
      }
    }
    // Also include currently loaded workspace in memory
    backupData[activeSlug] = circuit;

    const bulkPkg = createBulkExportPackage(backupData);
    const filename = `sao-luu-tat-ca-mach-dien-${Date.now()}.json`;
    downloadJsonFile(filename, JSON.stringify(bulkPkg, null, 2));
    setSuccessMsg(`Đã xuất toàn bộ dữ liệu ứng dụng (${Object.keys(backupData).length} không gian).`);
  };

  // Export PNG
  const handleExportPng = async () => {
    resetStatus();
    if (!svgRef?.current) {
      setErrorMsg('Không tìm thấy vùng vẽ mạch để xuất ảnh.');
      return;
    }
    const success = await exportSvgToPng(
      svgRef.current,
      `mach-dien-${activeSlug}-${Date.now()}`
    );
    if (success) {
      setSuccessMsg('Đã xuất sơ đồ mạch sang định dạng ảnh PNG.');
    } else {
      setErrorMsg('Không thể xuất ảnh PNG sơ đồ mạch. Vui lòng thử lại.');
    }
  };

  // File import handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetStatus();
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setErrorMsg('Tệp tin rỗng hoặc không thể đọc được nội dung.');
        return;
      }

      const res = validateCircuitJson(text, activeSlug);
      if (!res.valid) {
        setErrorMsg(`LỖI NHẬP DỮ LIỆU: ${res.error}`);
        return;
      }

      // Check if it's a Bulk package
      if (res.data && 'isBulk' in res.data && res.data.isBulk) {
        const storage = StorageService.getInstance();
        let restoredCount = 0;
        for (const [s, st] of Object.entries(res.data.workspaces)) {
          await storage.saveCircuit(s, st as any);
          restoredCount++;
        }
        await loadWorkspace(activeSlug);
        await refreshStorageStats();
        setSuccessMsg(`Đã khôi phục thành công ${restoredCount} không gian làm việc từ bản sao lưu.`);
        return;
      }

      // Single workspace package
      const singlePkg = res.data as any;
      if (singlePkg.slug !== activeSlug) {
        setSlugMismatchInfo({
          targetSlug: singlePkg.slug,
          rawText: text,
        });
        return;
      }

      // Exact slug match, apply to circuit
      setCircuit(singlePkg.state, true);
      setSuccessMsg(`Đã nhập thành công sơ đồ mạch "${singlePkg.title}".`);
    };
    reader.readAsText(file);
    // Reset input value to allow re-uploading same file
    e.target.value = '';
  };

  const handleSwitchAndImport = async () => {
    if (!slugMismatchInfo) return;
    const { targetSlug, rawText } = slugMismatchInfo;
    const res = validateCircuitJson(rawText, targetSlug);
    if (!res.valid || !res.data) {
      setErrorMsg(res.error || 'Lỗi khi nhập');
      return;
    }
    const singlePkg = res.data as any;
    const storage = StorageService.getInstance();
    await storage.saveCircuit(targetSlug, singlePkg.state);
    window.location.hash = `#/mo-phong/${targetSlug}`;
    await loadWorkspace(targetSlug);
    setSlugMismatchInfo(null);
    setSuccessMsg(`Đã chuyển sang không gian "${targetSlug}" và nhập mạch thành công.`);
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={() => {
        resetStatus();
        onClose();
      }}
      title="NHẬP / XUẤT SƠ ĐỒ MẠCH"
      maxWidthClass="max-w-2xl"
      footerActions={
        <NeoButton variant="secondary" onClick={onClose}>
          ĐÓNG
        </NeoButton>
      }
    >
      <div className="space-y-4">
        {/* Alerts */}
        {errorMsg && (
          <div className="bg-[#FFEAEA] border-[3px] border-[#E5322D] p-3 text-[#E5322D] font-extrabold flex items-start gap-2">
            <AlertTriangle className="shrink-0 mt-0.5" size={20} />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="bg-[#EAFFEA] border-[3px] border-[#2DB84D] p-3 text-[#2DB84D] font-extrabold flex items-start gap-2">
            <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
            <div>{successMsg}</div>
          </div>
        )}

        {/* Slug Mismatch Warning & Confirmation */}
        {slugMismatchInfo && (
          <div className="bg-[#FFD84D] border-[3px] border-black p-4 font-black space-y-3">
            <div className="flex items-center gap-2 text-black">
              <AlertTriangle size={24} />
              <span>KHÁC KHÔNG GIAN LÀM VIỆC:</span>
            </div>
            <p className="text-xs text-black">
              Tệp tin sơ đồ bạn tải lên thuộc không gian <strong>"{slugMismatchInfo.targetSlug}"</strong>, trong khi bạn đang ở không gian <strong>"{activeSlug}"</strong>.
            </p>
            <div className="flex gap-2">
              <NeoButton variant="primary" onClick={handleSwitchAndImport}>
                CHUYỂN SANG "{slugMismatchInfo.targetSlug.toUpperCase()}" VÀ MỞ MẠCH
              </NeoButton>
              <NeoButton variant="secondary" onClick={() => setSlugMismatchInfo(null)}>
                HỦY BỎ
              </NeoButton>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,application/json"
          className="hidden"
        />

        {/* Section 1: Export */}
        <div className="border-[3px] border-black p-4 bg-white">
          <h3 className="font-black text-sm uppercase mb-3 text-[#4169E1] flex items-center gap-2">
            <Download size={20} strokeWidth={3} />
            Xuất dữ liệu & sơ đồ
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NeoButton
              variant="primary"
              onClick={handleExportCurrent}
              icon={<FileJson size={18} strokeWidth={3} />}
            >
              XUẤT MẠCH HIỆN TẠI (.JSON)
            </NeoButton>

            <NeoButton
              variant="secondary"
              onClick={handleExportPng}
              icon={<Image size={18} strokeWidth={3} />}
            >
              XUẤT ẢNH SƠ ĐỒ (.PNG)
            </NeoButton>
          </div>
        </div>

        {/* Section 2: Import */}
        <div className="border-[3px] border-black p-4 bg-white">
          <h3 className="font-black text-sm uppercase mb-3 text-[#4169E1] flex items-center gap-2">
            <Upload size={20} strokeWidth={3} />
            Nhập dữ liệu vào mạch
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <NeoButton
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              icon={<FileJson size={18} strokeWidth={3} />}
              className="w-full sm:w-auto"
            >
              CHỌN TỆP .JSON ĐỂ NHẬP
            </NeoButton>
            <span className="text-xs text-gray-700 font-bold">
              (Tự động kiểm tra tính hợp lệ và toàn vẹn của mạch)
            </span>
          </div>
        </div>

        {/* Section 3: Bulk Backup */}
        <div className="border-[3px] border-black p-4 bg-[#EEF2FF]">
          <h3 className="font-black text-sm uppercase mb-2 text-black">
            Sao lưu toàn bộ (Tất cả không gian)
          </h3>
          <p className="text-xs text-gray-700 font-bold mb-3">
            Tải về gói sao lưu chứa toàn bộ mạch điện đã lưu trên tất cả các không gian làm việc.
          </p>
          <div className="flex gap-3">
            <NeoButton
              variant="secondary"
              onClick={handleExportAll}
              icon={<Download size={18} strokeWidth={3} />}
            >
              XUẤT TẤT CẢ DỮ LIỆU (.JSON)
            </NeoButton>
          </div>
        </div>
      </div>
    </NeoModal>
  );
};
