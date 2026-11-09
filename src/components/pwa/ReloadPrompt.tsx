import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { NeoButton } from '../common/NeoButton';

export const ReloadPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Service worker registered successfully
    },
    onRegisterError(error) {
      console.warn('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed top-12 right-4 z-50 flex items-center gap-3 bg-white border-[3px] border-black p-3 shadow-[4px_4px_0_#000] select-none animate-bounce">
      <div className="flex items-center gap-2">
        <RefreshCw size={18} strokeWidth={3} className="text-[#4169E1] animate-spin" />
        <span className="font-black text-xs uppercase text-black">
          Có phiên bản mới
        </span>
      </div>

      <NeoButton
        variant="primary"
        onClick={() => updateServiceWorker(true)}
        className="!min-h-[28px] !h-[28px] !px-3 text-xs"
      >
        TẢI LẠI
      </NeoButton>

      <button
        onClick={() => setNeedRefresh(false)}
        className="text-black hover:text-[#E5322D] p-1 cursor-pointer"
        title="Đóng thông báo"
      >
        <X size={16} strokeWidth={3} />
      </button>
    </div>
  );
};
