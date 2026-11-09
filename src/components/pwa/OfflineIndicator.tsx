import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from './useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-[#FFD84D] border-[3px] border-black px-4 py-2 font-black text-xs text-black shadow-[4px_4px_0_#000]">
      <WifiOff size={18} strokeWidth={3} className="text-[#E5322D]" />
      <span>CHẾ ĐỘ NGOẠI TUYẾN (OFFLINE) — DỮ LIỆU ĐANG ĐƯỢC LƯU CỤC BỘ</span>
    </div>
  );
};
