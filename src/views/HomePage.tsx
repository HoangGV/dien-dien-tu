import React, { useEffect, useState } from 'react';
import {
  Zap,
  Cpu,
  ArrowRight,
  Trash2,
  HardDrive,
  Download,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { getAllWorkspaces } from '../core/workspaces';
import { StorageService, StorageStats } from '../core/storage';
import { NeoButton } from '../components/common/NeoButton';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
import { ImportExportModal } from '../components/modals/ImportExportModal';
import { StorageModal } from '../components/modals/StorageModal';

export const HomePage: React.FC = () => {
  const workspaces = getAllWorkspaces();
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [ioOpen, setIoOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  const [confirmClearSlug, setConfirmClearSlug] = useState<string | null>(null);

  const checkStatus = async () => {
    const storage = StorageService.getInstance();
    const statusMap: Record<string, boolean> = {};
    for (const ws of workspaces) {
      statusMap[ws.slug] = await storage.hasSavedCircuit(ws.slug);
    }
    setSavedStatus(statusMap);
    const stats = await storage.getStorageStats();
    setStorageStats(stats);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleClearWorkspaceData = async (slug: string) => {
    await StorageService.getInstance().clearWorkspace(slug);
    setConfirmClearSlug(null);
    await checkStatus();
  };

  const handleOpenWorkspace = (slug: string) => {
    window.location.hash = `#/mo-phong/${slug}`;
  };

  return (
    <div className="min-h-screen bg-[#EEF2FF] flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b-2 border-black p-3 shadow-[0_2px_0_#000]">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#4169E1] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
              <Zap size={20} className="text-[#FFD84D]" strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-black leading-none">
                MẠCH ĐIỆN – ĐIỆN TỬ
              </h1>
              <p className="text-[11px] font-extrabold text-[#4169E1] mt-0.5">
                MÔ PHỎNG THỰC HÀNH CÔNG NGHỆ GDPT 2018 (TCVN/IEC)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <PWAInstallButton />
            <NeoButton
              variant="secondary"
              onClick={() => setStorageOpen(true)}
              icon={<HardDrive size={14} strokeWidth={3} />}
              className="!h-[28px] !text-xs"
            >
              BỘ NHỚ: {storageStats?.formattedSize || '0 B'}
            </NeoButton>
            <NeoButton
              variant="primary"
              onClick={() => setIoOpen(true)}
              icon={<Download size={14} strokeWidth={3} />}
              className="!h-[28px] !text-xs"
            >
              SAO LƯU / NHẬP
            </NeoButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 w-full flex-1">
        {/* Intro banner */}
        <div className="bg-[#FFD84D] border-2 border-black p-3.5 shadow-[3px_3px_0_#000] mb-5">
          <div className="flex items-start gap-2.5">
            <Sparkles size={22} strokeWidth={3} className="text-black shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase text-black">
                MÔ PHỎNG MẠCH ĐIỆN – ĐIỆN TỬ THEO CHUẨN TCVN / IEC
              </h2>
              <p className="text-xs font-bold text-black mt-0.5 leading-relaxed">
                Kéo thả linh kiện, tự đi dây bẻ góc thông minh, kiểm tra quy tắc mạch điện và mô phỏng thực hành môn Công nghệ lớp 8–12.
              </p>
            </div>
          </div>
        </div>

        {/* Section title */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-1.5">
            <BookOpen size={18} strokeWidth={3} className="text-[#4169E1]" />
            CHỌN KHÔNG GIAN LÀM VIỆC
          </h3>
          <span className="text-[11px] font-black bg-white border border-black px-2 py-0.5 shadow-[1px_1px_0_#000]">
            {workspaces.length} KHÔNG GIAN SẴN SÀNG
          </span>
        </div>

        {/* Compact Workspace Cards Grid (~240px wide) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {workspaces.map((ws) => {
            const hasData = savedStatus[ws.slug];
            const isHousehold = ws.slug === 'mang-dien-trong-nha';

            return (
              <div
                key={ws.slug}
                className="bg-white border-2 border-black shadow-[3px_3px_0_#000] flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-3 border-b-2 border-black bg-[#EEF2FF]">
                  <div className="flex items-start gap-2.5 mb-1.5">
                    <div
                      className={`w-9 h-9 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000] ${
                        isHousehold ? 'bg-[#4169E1] text-white' : 'bg-[#FFD84D] text-black'
                      }`}
                    >
                      {isHousehold ? (
                        <Zap size={20} strokeWidth={3} />
                      ) : (
                        <Cpu size={20} strokeWidth={3} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase text-black leading-tight">
                        {ws.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="bg-black text-white text-[10px] font-black px-1.5 py-0.2">
                          {ws.grades}
                        </span>
                        <span className="bg-white border border-black text-[#4169E1] text-[10px] font-black px-1.5 py-0.2">
                          {ws.mode === 'rms' ? '220 V RMS' : 'DC MỘT CHIỀU'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <p className="text-xs font-bold text-gray-800 leading-normal line-clamp-3">
                    {ws.description}
                  </p>

                  {/* Status indicator */}
                  <div>
                    {hasData ? (
                      <div className="inline-flex items-center gap-1.5 bg-[#EAFFEA] border border-[#2DB84D] px-2 py-0.5 font-black text-[10px] text-[#2DB84D]">
                        <span className="w-2 h-2 bg-[#2DB84D] rounded-full animate-pulse" />
                        ĐÃ CÓ DỮ LIỆU LƯU
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-gray-400 px-2 py-0.5 font-bold text-[10px] text-gray-600">
                        CHƯA CÓ DỮ LIỆU
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions (MỞ button 28px height) */}
                <div className="p-2.5 border-t-2 border-black bg-white flex items-center gap-1.5">
                  <NeoButton
                    variant="primary"
                    onClick={() => handleOpenWorkspace(ws.slug)}
                    icon={<ArrowRight size={14} strokeWidth={3} />}
                    className="flex-1 !h-[28px] !min-h-[28px] !text-xs !py-0"
                  >
                    MỞ
                  </NeoButton>

                  {hasData && (
                    confirmClearSlug === ws.slug ? (
                      <div className="flex gap-1">
                        <NeoButton
                          variant="danger"
                          onClick={() => handleClearWorkspaceData(ws.slug)}
                          className="!h-[28px] !min-h-[28px] !text-[10px] !px-1.5 !py-0"
                        >
                          XÓA!
                        </NeoButton>
                        <NeoButton
                          variant="secondary"
                          onClick={() => setConfirmClearSlug(null)}
                          className="!h-[28px] !min-h-[28px] !text-[10px] !px-1.5 !py-0"
                        >
                          HỦY
                        </NeoButton>
                      </div>
                    ) : (
                      <NeoButton
                        variant="danger"
                        onClick={() => setConfirmClearSlug(ws.slug)}
                        icon={<Trash2 size={13} strokeWidth={3} />}
                        title="Xóa dữ liệu lưu"
                        className="!h-[28px] !min-h-[28px] !px-2 !py-0"
                      >
                        XÓA
                      </NeoButton>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modular note */}
        <div className="mt-6 border-2 border-black p-3 bg-white shadow-[2px_2px_0_#000]">
          <h4 className="font-black text-[11px] uppercase text-gray-700 mb-0.5">
            KIẾN TRÚC MỞ RỘNG MODULAR:
          </h4>
          <p className="text-[11px] font-bold text-gray-600 leading-normal">
            Bổ sung thêm không gian làm việc chuyên đề mới (Cảm biến & Tự động hóa, Điện tử tương tự, Vi điều khiển STEM) bằng cách thêm 1 tệp cấu hình không gian trong <code className="bg-gray-100 px-1 border border-gray-300">src/core/workspaces.ts</code>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-black p-2.5 text-center select-none shadow-[0_-2px_0_#000]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] font-extrabold text-black">
          <span>MÔ HÌNH MÔ PHỎNG DẠY HỌC — CÔNG NGHỆ GDPT 2018</span>
          <span className="bg-[#4169E1] text-white px-2 py-0.2 border border-black">
            PWA STANDALONE OFFLINE
          </span>
        </div>
      </footer>

      <ImportExportModal
        isOpen={ioOpen}
        onClose={() => {
          setIoOpen(false);
          checkStatus();
        }}
      />
      <StorageModal
        isOpen={storageOpen}
        onClose={() => {
          setStorageOpen(false);
          checkStatus();
        }}
      />
    </div>
  );
};
