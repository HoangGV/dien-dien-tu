import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { NeoButton } from '../common/NeoButton';
import { NeoModal } from '../common/NeoModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, don't show
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <NeoButton
        variant="warning"
        onClick={install}
        icon={<Download size={18} strokeWidth={3} />}
      >
        CÀI ĐẶT ỨNG DỤNG
      </NeoButton>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <NeoButton
          variant="warning"
          onClick={() => setShowIOSGuide(true)}
          icon={<Smartphone size={18} strokeWidth={3} />}
        >
          CÀI ĐẶT (IOS)
        </NeoButton>

        <NeoModal
          isOpen={showIOSGuide}
          onClose={() => setShowIOSGuide(false)}
          title="CÀI ĐẶT TRÊN IPHONE / IPAD"
          footerActions={
            <NeoButton variant="primary" onClick={() => setShowIOSGuide(false)}>
              ĐÃ HIỂU
            </NeoButton>
          }
        >
          <div className="space-y-3 font-bold text-black">
            <p>Để cài đặt ứng dụng chạy ngoại tuyến (offline) trên thiết bị iOS (Safari):</p>
            <ol className="list-decimal list-inside space-y-2 bg-[#EEF2FF] p-4 border-2 border-black">
              <li>Nhấn vào nút <strong>Chia sẻ (Share)</strong> ở thanh dưới của trình duyệt Safari.</li>
              <li>Cuộn danh sách xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.</li>
              <li>Nhấn <strong>Thêm (Add)</strong> ở góc trên bên phải để hoàn tất.</li>
            </ol>
            <p className="text-xs text-gray-700">Ứng dụng sẽ xuất hiện trên màn hình chính như một ứng dụng độc lập không cần thanh địa chỉ.</p>
          </div>
        </NeoModal>
      </>
    );
  }

  return null;
};
