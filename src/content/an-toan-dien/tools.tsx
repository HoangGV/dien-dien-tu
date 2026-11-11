import React from 'react';
import { SafetyTool } from './types';

export const ALL_SAFETY_TOOLS: SafetyTool[] = [
  {
    id: 'dung_cu_gang_tay',
    name: 'Găng tay cách điện',
    reviewStatus: 'cần GV đối chiếu',
    tacDung: 'Bảo vệ đôi bàn tay của người thợ khi thao tác sửa chữa mạch điện, ngăn chặn dòng điện truyền qua tay vào cơ thể.',
    cachDung: 'Đeo găng tay vừa vặn, ôm sát các ngón tay; kéo cổ găng tay phủ kín qua cổ tay áo bảo hộ trước khi thao tác tiếp xúc với thiết bị.',
    kiemTra: 'Kiểm tra kĩ găng tay không bị thủng, rách hay nứt nẻ; có thể cuộn chặt găng tay từ cổ lên để dồn không khí vào các ngón tay, ngâm vào nước xem có bọt khí xì ra hay không; đảm bảo găng tay hoàn toàn khô ráo trước khi dùng.',
    renderSVG: () => (
      <svg viewBox="0 0 160 140" className="w-full h-auto select-none">
        <g stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Glove body */}
          <path
            d="M 50 120 L 50 70 C 50 60, 40 50, 45 40 C 48 35, 55 35, 58 42 L 62 60 L 65 30 C 66 22, 75 22, 76 30 L 78 58 L 83 25 C 85 18, 93 18, 94 25 L 95 60 L 100 35 C 102 28, 110 30, 110 38 L 105 85 C 105 100, 110 110, 110 120 Z"
            fill="#FBBF24"
          />
          {/* Cuff band */}
          <rect x="48" y="115" width="64" height="15" rx="3" fill="#D97706" />
          <line x1="55" y1="90" x2="100" y2="90" stroke="#B45309" strokeDasharray="2 2" />
        </g>
      </svg>
    ),
  },
  {
    id: 'dung_cu_ung_cach_dien',
    name: 'Ủng cách điện',
    reviewStatus: 'cần GV đối chiếu',
    tacDung: 'Cách ly hoàn toàn đôi chân của người làm việc với mặt đất ẩm hoặc sàn nhà nhiễm điện, ngăn dòng điện chạy từ chân xuống đất (chống điện áp bước và điện áp tiếp xúc).',
    cachDung: 'Đi ủng kèm tất sạch, kéo ống quần gọn gàng vào bên trong cổ ủng; đi đứng cẩn thận trên mặt phẳng, tránh dẫm lên vật sắc nhọn.',
    kiemTra: 'Quan sát mặt ngoài và đế ủng xem có vết nứt, đinh găm hay mòn rách đế không; kiểm tra bên trong ủng phải khô ráo, không dính bùn đất ẩm ướt hay đọng nước.',
    renderSVG: () => (
      <svg viewBox="0 0 160 140" className="w-full h-auto select-none">
        <g stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Boot shape */}
          <path
            d="M 50 25 L 90 25 L 85 75 C 85 85, 95 90, 115 95 C 125 98, 125 115, 115 115 L 45 115 C 40 115, 40 95, 45 75 Z"
            fill="#3B82F6"
          />
          {/* Thick sole */}
          <rect x="40" y="115" width="80" height="12" rx="2" fill="#1E293B" />
          <line x1="55" y1="120" x2="55" y2="127" stroke="#94A3B8" />
          <line x1="75" y1="120" x2="75" y2="127" stroke="#94A3B8" />
          <line x1="95" y1="120" x2="95" y2="127" stroke="#94A3B8" />
          {/* Yellow rim */}
          <rect x="50" y="25" width="40" height="8" rx="2" fill="#FACC15" />
        </g>
      </svg>
    ),
  },
  {
    id: 'dung_cu_tham_cach_dien',
    name: 'Thảm cao su cách điện',
    reviewStatus: 'cần GV đối chiếu',
    tacDung: 'Trải dưới sàn nhà tại vị trí đứng thao tác trước tủ điện, bàn thí nghiệm để tạo mặt phẳng đệm cách điện an toàn tuyệt đối với mặt đất.',
    cachDung: 'Trải phẳng thảm trên nền nhà khô ráo; đứng trọn vẹn hai chân trên bề mặt thảm trong suốt quá trình thao tác với bảng điện.',
    kiemTra: 'Kiểm tra bề mặt thảm không bị thủng, rách, nứt chân chim hoặc dính dầu mỡ, hóa chất ăn mòn; vệ sinh sạch sẽ bụi bẩn và lau khô thảm trước khi đứng lên.',
    renderSVG: () => (
      <svg viewBox="0 0 160 140" className="w-full h-auto select-none">
        <g stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Perspective rubber mat */}
          <polygon points="30,40 130,40 150,110 10,110" fill="#EF4444" />
          {/* Anti-slip diamond/grid pattern */}
          <line x1="45" y1="50" x2="115" y2="50" stroke="#7F1D1D" strokeWidth="1.5" />
          <line x1="35" y1="70" x2="125" y2="70" stroke="#7F1D1D" strokeWidth="1.5" />
          <line x1="25" y1="90" x2="135" y2="90" stroke="#7F1D1D" strokeWidth="1.5" />
          <line x1="50" y1="40" x2="30" y2="110" stroke="#7F1D1D" strokeWidth="1.5" />
          <line x1="80" y1="40" x2="80" y2="110" stroke="#7F1D1D" strokeWidth="1.5" />
          <line x1="110" y1="40" x2="130" y2="110" stroke="#7F1D1D" strokeWidth="1.5" />
        </g>
      </svg>
    ),
  },
  {
    id: 'dung_cu_kim_tua_vit',
    name: 'Kìm & Tua vít cán cách điện',
    reviewStatus: 'cần GV đối chiếu',
    tacDung: 'Dùng để cắt dây, tuốt vỏ, siết ốc vít các mối nối điện mà không sợ tay chạm vào phần kim loại dẫn điện khi thao tác lắp ráp.',
    cachDung: 'Cầm gọn tay vào phần chuôi bọc nhựa cách điện, không để ngón tay trượt vượt qua gờ bảo vệ chạm vào phần kim loại trần phía mũi kìm.',
    kiemTra: 'Kiểm tra lớp vỏ bọc nhựa ở cán không bị nứt vỡ, lỏng lẻo hay tụt chuôi; lưỡi kìm sắc bén, mũi tua vít không bị toét đầu cong vênh.',
    renderSVG: () => (
      <svg viewBox="0 0 160 140" className="w-full h-auto select-none">
        <g stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Screwdriver shaft */}
          <rect x="75" y="15" width="10" height="45" fill="#94A3B8" />
          <polygon points="73,15 87,15 80,8" fill="#475569" />
          {/* Insulated handle with protective stop ring */}
          <ellipse cx="80" cy="62" rx="14" ry="4" fill="#DC2626" />
          <rect x="70" y="65" width="20" height="55" rx="6" fill="#EF4444" />
          <line x1="75" y1="75" x2="75" y2="110" stroke="#991B1B" strokeWidth="1.5" />
          <line x1="85" y1="75" x2="85" y2="110" stroke="#991B1B" strokeWidth="1.5" />
        </g>
      </svg>
    ),
  },
  {
    id: 'dung_cu_but_thu_dien',
    name: 'Bút thử điện thông dụng',
    reviewStatus: 'cần GV đối chiếu',
    tacDung: 'Kiểm tra nhanh xem dây dẫn, ổ cắm hoặc vỏ thiết bị kim loại có đang mang điện áp (dây pha / điện rò) hay không trước khi chạm tay vào sửa chữa.',
    cachDung: 'Đặt đầu kim loại của bút vào điểm cần thử; một ngón tay áp chặt vào chốt kim loại ở đỉnh chuôi bút; mắt quan sát bóng đèn neon bên trong thân bút: đèn sáng là có điện, đèn không sáng là không có điện (hoặc dây nguội/trung tính).',
    kiemTra: 'Bắt buộc thử bút trước vào một ổ cắm chắc chắn có điện để xác nhận bóng đèn neon còn hoạt động tốt; thân bút bằng nhựa trong suốt không bị nứt vỡ, khô ráo tuyệt đối.',
    renderSVG: () => (
      <svg viewBox="0 0 160 140" className="w-full h-auto select-none">
        <g stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Metal probe tip */}
          <polygon points="76,15 84,15 80,8" fill="#64748B" />
          <rect x="77" y="15" width="6" height="30" fill="#CBD5E1" />
          {/* Transparent plastic barrel */}
          <rect x="71" y="45" width="18" height="60" rx="3" fill="#E0F2FE" fillOpacity="0.8" />
          {/* Resistor inside */}
          <rect x="74" y="52" width="12" height="12" fill="#F59E0B" />
          {/* Neon lamp (Glowing) */}
          <circle cx="80" cy="78" r="5" fill="#EF4444" />
          <line x1="80" y1="70" x2="80" y2="74" stroke="#000" strokeWidth="1" />
          <line x1="80" y1="82" x2="80" y2="86" stroke="#000" strokeWidth="1" />
          {/* Metal clip / end cap */}
          <rect x="71" y="105" width="18" height="12" rx="2" fill="#94A3B8" />
          <path d="M 89 108 L 98 108 L 98 70 L 89 70" fill="none" stroke="#64748B" strokeWidth="2" />
        </g>
      </svg>
    ),
  },
];
