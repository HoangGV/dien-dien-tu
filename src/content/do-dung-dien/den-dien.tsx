import React from 'react';
import { DoDungDienDef } from './types';

// ==========================================
// 1. ĐÈN SỢI ĐỐT
// ==========================================
export const DEN_SOI_DOT: DoDungDienDef = {
  id: 'den-dien',
  subType: 'soi-dot',
  subTypeName: 'Sợi đốt',
  ten: 'Đèn sợi đốt',
  moTaNgan: 'Đèn phát sáng bằng cách nung nóng dây tóc vonfram đến nhiệt độ cao nhờ tác dụng nhiệt của dòng điện.',
  reviewStatus: 'cần GV đối chiếu',
  boPhan: [
    {
      id: 'bong_thuy_tinh',
      ten: 'Bóng thủy tinh',
      chucNang: 'Bảo vệ sợi đốt, bên trong hút chân không hoặc bơm khí trơ (agon, nitơ) để sợi đốt không bị oxi hóa ở nhiệt độ cao.',
      viTri: 'ngoai',
      hotspot: { id: 'bong_thuy_tinh', type: 'circle', cx: 200, cy: 150, r: 70 },
    },
    {
      id: 'dui_den',
      ten: 'Đui đèn & cực tiếp xúc',
      chucNang: 'Gắn bóng đèn vào chuôi đèn để cấp nguồn điện 220 V cho hai đầu sợi đốt (đui xoáy E27 hoặc đui gài).',
      viTri: 'ngoai',
      hotspot: { id: 'dui_den', type: 'rect', x: 175, y: 220, width: 50, height: 60 },
    },
    {
      id: 'soi_toc',
      ten: 'Sợi đốt (dây tóc vonfram)',
      chucNang: 'Làm bằng kim loại vonfram chịu nhiệt độ cao (>2500°C), xoắn lò xo, phát sáng khi có dòng điện chạy qua.',
      viTri: 'trong',
      hotspot: { id: 'soi_toc', type: 'rect', x: 185, y: 135, width: 30, height: 25 },
    },
    {
      id: 'gia_do',
      ten: 'Giá đỡ & dây dẫn',
      chucNang: 'Dây kim loại cứng giữ cố định sợi đốt ở tâm bầu thủy tinh và dẫn điện từ đui lên sợi tóc.',
      viTri: 'trong',
      hotspot: { id: 'gia_do', type: 'rect', x: 188, y: 160, width: 24, height: 60 },
    },
  ],
  khoi: [
    { id: 'nguon', ten: 'Nguồn điện 220 V', chucNang: 'Cung cấp năng lượng điện xoay chiều', x: 40, y: 70 },
    { id: 'dui', ten: 'Đui đèn tiếp xúc', chucNang: 'Dẫn điện vào bên trong bóng đèn', x: 170, y: 70 },
    { id: 'soi_toc_k', ten: 'Sợi đốt vonfram', chucNang: 'Điện trở nung nóng đỏ phát quang', x: 300, y: 70 },
    { id: 'anh_sang_k', ten: 'Quang năng & Nhiệt', chucNang: 'Phát sáng (~5%) và tỏa nhiệt lớn (~95%)', x: 440, y: 70 },
  ],
  mui_ten: [
    { id: 'mt_1', tu: 'nguon', den: 'dui', nhan: 'Dòng điện' },
    { id: 'mt_2', tu: 'dui', den: 'soi_toc_k', nhan: 'Cấp điện' },
    { id: 'mt_3', tu: 'soi_toc_k', den: 'anh_sang_k', nhan: 'Phát xạ nhiệt' },
  ],
  buoc: [
    {
      tieuDe: 'Bước 1: Cấp nguồn điện vào đui đèn',
      noiDung: 'Đóng công tắc, điện áp 220 V từ lưới điện đi qua đui đèn và dây dẫn đưa dòng điện vào sợi đốt vonfram.',
      sangBoPhan: ['dui_den', 'gia_do'],
      sangKhoi: ['nguon', 'dui'],
      sangMuiTen: ['mt_1'],
    },
    {
      tieuDe: 'Bước 2: Dây tóc vonfram nóng đỏ',
      noiDung: 'Dòng điện chạy qua dây tóc có điện trở cao làm dây tóc nóng lên đến trên 2500 °C trong môi trường khí trơ.',
      sangBoPhan: ['soi_toc'],
      sangKhoi: ['soi_toc_k'],
      sangMuiTen: ['mt_2'],
    },
    {
      tieuDe: 'Bước 3: Phát sáng và tỏa nhiệt',
      noiDung: 'Sợi đốt phát ra ánh sáng vàng ấm qua vỏ thủy tinh, đồng thời tỏa ra lượng nhiệt rất lớn (hiệu suất phát quang chỉ khoảng 5%).',
      sangBoPhan: ['bong_thuy_tinh', 'soi_toc'],
      sangKhoi: ['soi_toc_k', 'anh_sang_k'],
      sangMuiTen: ['mt_3'],
    },
  ],
  thongSo: [
    { ten: 'Điện áp định mức', giaTri: '220 V', chuThich: 'Mạng điện gia đình' },
    { ten: 'Công suất định mức', giaTri: '40 W – 100 W', chuThich: 'Thông dụng nhất là 60 W' },
    { ten: 'Hiệu suất phát quang', giaTri: '10 – 15 lm/W', chuThich: 'Rất thấp (tiêu tốn nhiều nhiệt)' },
    { ten: 'Tuổi thọ trung bình', giaTri: '1.000 giờ', chuThich: 'Dây tóc dễ đứt do nhiệt độ cao' },
  ],
  anToan: [
    'Tuyệt đối không chạm tay vào bóng đèn khi đang sáng hoặc vừa tắt vì bóng rất nóng, dễ gây bỏng nặng.',
    'Ngắt nguồn điện (tắt công tắc hoặc cầu dao) trước khi tháo lắp, thay thế bóng đèn.',
    'Không lắp đèn sợi đốt gần rèm cửa, giấy, xốp hoặc các vật liệu dễ bắt cháy do bức xạ nhiệt cao.',
  ],
  tietKiem: [
    'Hạn chế sử dụng đèn sợi đốt cho thắp sáng sinh hoạt; nên thay thế bằng đèn LED để tiết kiệm đến 85% điện năng.',
    'Chỉ sử dụng đèn sợi đốt khi cần sưởi ấm (ủ ấm gia cầm, cây trồng mùa lạnh) vì đặc tính tỏa nhiều nhiệt.',
    'Tắt đèn ngay khi rời khỏi phòng.',
  ],
  hinhSVG: {
    viewBox: '0 0 400 320',
    ngoai: (highlightIds, selectedId, onSelect) => {
      const isHl = (id: string) => highlightIds.includes(id) || selectedId === id;
      return (
        <g stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Bulb Outer Glass */}
          <circle
            cx="200"
            cy="150"
            r="65"
            fill={isHl('bong_thuy_tinh') ? '#fef08a' : '#f8fafc'}
            strokeWidth={isHl('bong_thuy_tinh') ? 3 : 2}
            className="cursor-pointer transition-colors"
            onClick={() => onSelect('bong_thuy_tinh')}
          />
          {/* Glass neck */}
          <path
            d="M 175 198 L 180 220 L 220 220 L 225 198 Z"
            fill={isHl('bong_thuy_tinh') ? '#fef08a' : '#f8fafc'}
            className="cursor-pointer"
            onClick={() => onSelect('bong_thuy_tinh')}
          />
          {/* Screw base (Đui đèn) */}
          <rect
            x="178"
            y="220"
            width="44"
            height="35"
            rx="3"
            fill={isHl('dui_den') ? '#60a5fa' : '#cbd5e1'}
            strokeWidth={isHl('dui_den') ? 3 : 2}
            className="cursor-pointer transition-colors"
            onClick={() => onSelect('dui_den')}
          />
          <line x1="180" y1="228" x2="220" y2="228" />
          <line x1="180" y1="236" x2="220" y2="236" />
          <line x1="180" y1="244" x2="220" y2="244" />
          {/* Bottom contact pin */}
          <path
            d="M 190 255 L 200 265 L 210 255 Z"
            fill={isHl('dui_den') ? '#2563eb' : '#475569'}
            className="cursor-pointer"
            onClick={() => onSelect('dui_den')}
          />
          {/* Glow rays */}
          {highlightIds.includes('bong_thuy_tinh') && (
            <g stroke="#f59e0b" strokeWidth="2">
              <line x1="200" y1="65" x2="200" y2="45" strokeDasharray="3 3" />
              <line x1="120" y1="100" x2="105" y2="85" strokeDasharray="3 3" />
              <line x1="280" y1="100" x2="295" y2="85" strokeDasharray="3 3" />
              <line x1="110" y1="160" x2="90" y2="160" strokeDasharray="3 3" />
              <line x1="290" y1="160" x2="310" y2="160" strokeDasharray="3 3" />
            </g>
          )}
        </g>
      );
    },
    trong: (highlightIds, selectedId, onSelect) => {
      const isHl = (id: string) => highlightIds.includes(id) || selectedId === id;
      return (
        <g stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Transparent Glass outline */}
          <circle
            cx="200"
            cy="150"
            r="65"
            fill={isHl('bong_thuy_tinh') ? '#fef9c3' : '#f1f5f9'}
            fillOpacity="0.4"
            strokeDasharray="4 2"
            className="cursor-pointer"
            onClick={() => onSelect('bong_thuy_tinh')}
          />
          {/* Glass Stem */}
          <path d="M 190 220 L 194 175 L 206 175 L 210 220 Z" fill="#e2e8f0" />
          {/* Lead wires / Support wires */}
          <path
            d="M 196 175 L 192 145 M 204 175 L 208 145"
            stroke={isHl('gia_do') ? '#2563eb' : '#475569'}
            strokeWidth={isHl('gia_do') ? 3 : 2}
            className="cursor-pointer"
            onClick={() => onSelect('gia_do')}
          />
          {/* Support struts */}
          <line
            x1="200"
            y1="175"
            x2="200"
            y2="140"
            stroke={isHl('gia_do') ? '#2563eb' : '#64748b'}
            className="cursor-pointer"
            onClick={() => onSelect('gia_do')}
          />
          {/* Filament (Sợi tóc xoắn) */}
          <path
            d="M 192 145 Q 195 138 200 138 Q 205 138 208 145"
            fill="none"
            stroke={isHl('soi_toc') ? '#ef4444' : '#b45309'}
            strokeWidth={isHl('soi_toc') ? 4 : 3}
            className="cursor-pointer transition-all"
            onClick={() => onSelect('soi_toc')}
          />
          {/* Hot radiance rings */}
          {isHl('soi_toc') && (
            <circle cx="200" cy="140" r="14" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeDasharray="2 2" />
          )}
          {/* Screw Base */}
          <rect
            x="178"
            y="220"
            width="44"
            height="35"
            rx="3"
            fill={isHl('dui_den') ? '#60a5fa' : '#cbd5e1'}
            className="cursor-pointer"
            onClick={() => onSelect('dui_den')}
          />
          <line x1="180" y1="230" x2="220" y2="230" />
          <line x1="180" y1="240" x2="220" y2="240" />
          <path d="M 190 255 L 200 265 L 210 255 Z" fill="#475569" />
        </g>
      );
    },
  },
};

// ==========================================
// 2. ĐÈN HUỲNH QUANG
// ==========================================
export const DEN_HUYNH_QUANG: DoDungDienDef = {
  id: 'den-dien',
  subType: 'huynh-quang',
  subTypeName: 'Huỳnh quang',
  ten: 'Đèn huỳnh quang (ống tuýp)',
  moTaNgan: 'Đèn phóng điện qua hơi thủy ngân phát tia tử ngoại, kích thích lớp bột huỳnh quang mặt trong phát sáng.',
  reviewStatus: 'cần GV đối chiếu',
  boPhan: [
    {
      id: 'ong_thuy_tinh',
      ten: 'Ống thủy tinh & bột huỳnh quang',
      chucNang: 'Ống kín chứa khí trơ (agon) và một lượng nhỏ hơi thủy ngân; mặt trong phủ lớp bột huỳnh quang hấp thụ tia tử ngoại phát ánh sáng trắng.',
      viTri: 'ngoai',
      hotspot: { id: 'ong_thuy_tinh', type: 'rect', x: 70, y: 120, width: 260, height: 40 },
    },
    {
      id: 'hai_dau_den',
      ten: 'Đầu đèn & chân cắm (tiếp điện)',
      chucNang: 'Hai đầu bọc kim loại gắn các chân tiếp điện cắm vào máng đèn để nối với mạch điện.',
      viTri: 'ngoai',
      hotspot: { id: 'hai_dau_den', type: 'rect', x: 50, y: 115, width: 300, height: 50 },
    },
    {
      id: 'dien_cuc',
      ten: 'Điện cực vonfram',
      chucNang: 'Hai đầu có sợi dây vonfram tráng oxit kiềm đất, nung nóng phát xạ electron để duy trì sự phóng điện qua khí.',
      viTri: 'trong',
      hotspot: { id: 'dien_cuc', type: 'rect', x: 80, y: 130, width: 240, height: 20 },
    },
    {
      id: 'chan_luu',
      ten: 'Chấn lưu (Ballast)',
      chucNang: 'Tạo sức điện động tự cảm lớn để tạo xung mồi phóng điện lúc khởi động, và hạn chế dòng điện ổn định khi đèn đã sáng.',
      viTri: 'trong',
      hotspot: { id: 'chan_luu', type: 'rect', x: 120, y: 220, width: 100, height: 40 },
    },
    {
      id: 'tac_te',
      ten: 'Tắc te (Starter)',
      chucNang: 'Rơ le nhiệt tự động đóng rồi ngắt mạch sợi đốt để chấn lưu phát sinh xung điện áp cao phóng điện.',
      viTri: 'trong',
      hotspot: { id: 'tac_te', type: 'rect', x: 250, y: 220, width: 40, height: 40 },
    },
  ],
  khoi: [
    { id: 'nguon_k', ten: 'Nguồn điện 220 V', chucNang: 'Mạng điện xoay chiều', x: 30, y: 70 },
    { id: 'chan_luu_k', ten: 'Chấn lưu', chucNang: 'Tạo xung mồi & giới hạn dòng', x: 150, y: 70 },
    { id: 'tac_te_k', ten: 'Tắc te', chucNang: 'Tự ngắt mồi phóng điện', x: 260, y: 70 },
    { id: 'dien_cuc_k', ten: 'Điện cực', chucNang: 'Phát xạ electron', x: 360, y: 70 },
    { id: 'phat_quang_k', ten: 'Bột huỳnh quang', chucNang: 'Chuyển tử ngoại thành ánh sáng', x: 470, y: 70 },
  ],
  mui_ten: [
    { id: 'mt_1', tu: 'nguon_k', den: 'chan_luu_k', nhan: 'Cấp điện' },
    { id: 'mt_2', tu: 'chan_luu_k', den: 'tac_te_k', nhan: 'Mồi nhiệt' },
    { id: 'mt_3', tu: 'tac_te_k', den: 'dien_cuc_k', nhan: 'Xung cao áp' },
    { id: 'mt_4', tu: 'dien_cuc_k', den: 'phat_quang_k', nhan: 'Tia UV' },
  ],
  buoc: [
    {
      tieuDe: 'Bước 1: Khởi động qua chấn lưu và tắc te',
      noiDung: 'Bật điện, dòng điện đi qua chấn lưu làm sáng tắc te nhiệt, thanh lưỡng kim uốn lại nối mạch nung nóng điện cực.',
      sangBoPhan: ['chan_luu', 'tac_te'],
      sangKhoi: ['nguon_k', 'chan_luu_k', 'tac_te_k'],
      sangMuiTen: ['mt_1', 'mt_2'],
    },
    {
      tieuDe: 'Bước 2: Xung cao áp phóng điện',
      noiDung: 'Thanh lưỡng kim tắc te nguội ngắt đột ngột, chấn lưu cảm ứng một xung điện áp cao (~1000 V) giữa hai điện cực.',
      sangBoPhan: ['chan_luu', 'dien_cuc'],
      sangKhoi: ['chan_luu_k', 'dien_cuc_k'],
      sangMuiTen: ['mt_3'],
    },
    {
      tieuDe: 'Bước 3: Phóng điện qua hơi thủy ngân sinh tia UV',
      noiDung: 'Xung điện kích thích dòng electron phóng qua lớp khí trơ và hơi thủy ngân, phát ra bức xạ tử ngoại (tia UV) vô hình.',
      sangBoPhan: ['dien_cuc', 'ong_thuy_tinh'],
      sangKhoi: ['dien_cuc_k', 'phat_quang_k'],
      sangMuiTen: ['mt_4'],
    },
    {
      tieuDe: 'Bước 4: Bột huỳnh quang phát sáng trắng',
      noiDung: 'Tia tử ngoại va chạm vào lớp bột huỳnh quang phủ mặt trong ống thủy tinh, chuyển hóa thành ánh sáng trắng nhìn thấy chiếu ra phòng.',
      sangBoPhan: ['ong_thuy_tinh'],
      sangKhoi: ['phat_quang_k'],
      sangMuiTen: ['mt_4'],
    },
  ],
  thongSo: [
    { ten: 'Điện áp định mức', giaTri: '220 V', chuThich: 'Mạng điện gia đình' },
    { ten: 'Công suất định mức', giaTri: '18 W – 36 W', chuThich: 'Đèn dài 0,6 m (18W) hoặc 1,2 m (36W)' },
    { ten: 'Hiệu suất phát quang', giaTri: '50 – 70 lm/W', chuThich: 'Gấp khoảng 4-5 lần đèn sợi đốt' },
    { ten: 'Tuổi thọ trung bình', giaTri: '8.000 – 10.000 giờ', chuThich: 'Bền hơn nhiều so với đèn sợi đốt' },
  ],
  anToan: [
    'Bên trong bóng có chứa một lượng hơi thủy ngân. Nếu bóng bị vỡ, không được dùng máy hút bụi; mở toang cửa sổ thông gió và dọn dẹp cẩn thận bằng găng tay.',
    'Tránh bật/tắt liên tục nhiều lần trong thời gian ngắn vì làm giảm tuổi thọ điện cực và tắc te nhanh chóng.',
    'Thay thế chấn lưu hỏng khi có hiện tượng kêu rè rè hoặc nhấp nháy liên tục không sáng.',
  ],
  tietKiem: [
    'Sử dụng máng đèn có chao phản quang để ánh sáng chiếu tập trung xuống khu vực làm việc.',
    'Vệ sinh định kỳ bụi bám ngoài ống đèn để ánh sáng thoát ra tối đa.',
    'Cân nhắc nâng cấp sang đèn LED tube cùng kích thước (không cần chấn lưu/tắc te) giúp tiết kiệm thêm 50% điện năng.',
  ],
  hinhSVG: {
    viewBox: '0 0 400 320',
    ngoai: (highlightIds, selectedId, onSelect) => {
      const isHl = (id: string) => highlightIds.includes(id) || selectedId === id;
      return (
        <g stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Main Glass Tube */}
          <rect
            x="80"
            y="130"
            width="240"
            height="40"
            rx="4"
            fill={isHl('ong_thuy_tinh') ? '#e0f2fe' : '#ffffff'}
            strokeWidth={isHl('ong_thuy_tinh') ? 3 : 2}
            className="cursor-pointer transition-colors"
            onClick={() => onSelect('ong_thuy_tinh')}
          />
          {/* Left Endcap */}
          <rect
            x="60"
            y="130"
            width="20"
            height="40"
            rx="2"
            fill={isHl('hai_dau_den') ? '#60a5fa' : '#cbd5e1'}
            className="cursor-pointer"
            onClick={() => onSelect('hai_dau_den')}
          />
          <line x1="50" y1="140" x2="60" y2="140" strokeWidth="3" />
          <line x1="50" y1="160" x2="60" y2="160" strokeWidth="3" />
          {/* Right Endcap */}
          <rect
            x="320"
            y="130"
            width="20"
            height="40"
            rx="2"
            fill={isHl('hai_dau_den') ? '#60a5fa' : '#cbd5e1'}
            className="cursor-pointer"
            onClick={() => onSelect('hai_dau_den')}
          />
          <line x1="340" y1="140" x2="350" y2="140" strokeWidth="3" />
          <line x1="340" y1="160" x2="350" y2="160" strokeWidth="3" />
          {/* Light emission beams */}
          {highlightIds.includes('ong_thuy_tinh') && (
            <g stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3">
              <line x1="120" y1="110" x2="120" y2="90" />
              <line x1="200" y1="110" x2="200" y2="90" />
              <line x1="280" y1="110" x2="280" y2="90" />
              <line x1="120" y1="190" x2="120" y2="210" />
              <line x1="200" y1="190" x2="200" y2="210" />
              <line x1="280" y1="190" x2="280" y2="210" />
            </g>
          )}
        </g>
      );
    },
    trong: (highlightIds, selectedId, onSelect) => {
      const isHl = (id: string) => highlightIds.includes(id) || selectedId === id;
      return (
        <g stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Transparent tube */}
          <rect
            x="80"
            y="110"
            width="240"
            height="40"
            rx="4"
            fill={isHl('ong_thuy_tinh') ? '#e0f2fe' : '#f8fafc'}
            strokeDasharray="4 2"
            className="cursor-pointer"
            onClick={() => onSelect('ong_thuy_tinh')}
          />
          {/* Internal filament electrodes */}
          <path
            d="M 75 125 L 95 125 M 95 125 Q 100 130 95 135 M 95 135 L 75 135"
            stroke={isHl('dien_cuc') ? '#ef4444' : '#b45309'}
            strokeWidth={isHl('dien_cuc') ? 3 : 2}
            fill="none"
            className="cursor-pointer"
            onClick={() => onSelect('dien_cuc')}
          />
          <path
            d="M 325 125 L 305 125 M 305 125 Q 300 130 305 135 M 305 135 L 325 135"
            stroke={isHl('dien_cuc') ? '#ef4444' : '#b45309'}
            strokeWidth={isHl('dien_cuc') ? 3 : 2}
            fill="none"
            className="cursor-pointer"
            onClick={() => onSelect('dien_cuc')}
          />
          {/* Gas discharge stream */}
          <path
            d="M 105 130 Q 150 126 200 130 T 295 130"
            stroke="#a855f7"
            strokeWidth="3"
            strokeDasharray="3 3"
            fill="none"
          />
          {/* Ballast (Chấn lưu) */}
          <rect
            x="110"
            y="210"
            width="100"
            height="40"
            rx="4"
            fill={isHl('chan_luu') ? '#60a5fa' : '#94a3b8'}
            strokeWidth={isHl('chan_luu') ? 3 : 2}
            className="cursor-pointer"
            onClick={() => onSelect('chan_luu')}
          />
          <text x="160" y="235" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0f172a" stroke="none">
            Chấn lưu
          </text>
          {/* Starter (Tắc te) */}
          <rect
            x="250"
            y="210"
            width="40"
            height="40"
            rx="20"
            fill={isHl('tac_te') ? '#facc15' : '#e2e8f0'}
            strokeWidth={isHl('tac_te') ? 3 : 2}
            className="cursor-pointer"
            onClick={() => onSelect('tac_te')}
          />
          <text x="270" y="235" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a" stroke="none">
            Tắc te
          </text>
          {/* Connecting schematic wires */}
          <path d="M 60 125 L 40 125 L 40 230 L 110 230" fill="none" stroke="#64748b" />
          <path d="M 210 230 L 250 230" fill="none" stroke="#64748b" />
          <path d="M 290 230 L 360 230 L 360 125 L 340 125" fill="none" stroke="#64748b" />
        </g>
      );
    },
  },
};

// ==========================================
// 3. ĐÈN LED
// ==========================================
export const DEN_LED: DoDungDienDef = {
  id: 'den-dien',
  subType: 'led',
  subTypeName: 'LED',
  ten: 'Đèn LED (búp trụ / tròn)',
  moTaNgan: 'Đèn sử dụng chip bán dẫn LED phát quang trực tiếp hiệu suất cao, kèm bộ nguồn Driver biến đổi dòng xoay chiều.',
  reviewStatus: 'cần GV đối chiếu',
  boPhan: [
    {
      id: 'chao_tan_quang',
      ten: 'Vỏ tán quang (bầu nhựa)',
      chucNang: 'Chụp hình vòm bằng nhựa PC hoặc mica trắng đục, khuếch tán chùm sáng đều không gây chói mắt và bảo vệ chip LED.',
      viTri: 'ngoai',
      hotspot: { id: 'chao_tan_quang', type: 'circle', cx: 200, cy: 120, r: 60 },
    },
    {
      id: 'de_tan_nhiet',
      ten: 'Thân tản nhiệt (vỏ nhôm / nhựa)',
      chucNang: 'Hấp thụ và truyền nhiệt từ bảng chip LED ra không khí bên ngoài, giữ cho chip LED không bị quá nhiệt giảm tuổi thọ.',
      viTri: 'ngoai',
      hotspot: { id: 'de_tan_nhiet', type: 'rect', x: 170, y: 170, width: 60, height: 45 },
    },
    {
      id: 'dui_den_led',
      ten: 'Đui đèn (E27 tiêu chuẩn)',
      chucNang: 'Ren xoáy kết nối bóng đèn vào mạng điện 220 V sinh hoạt tiện lợi.',
      viTri: 'ngoai',
      hotspot: { id: 'dui_den_led', type: 'rect', x: 178, y: 215, width: 44, height: 40 },
    },
    {
      id: 'chip_led',
      ten: 'Bảng chip LED bán dẫn',
      chucNang: 'Gồm nhiều điốt phát quang (SMD LED) gắn trên đế nhôm, biến đổi trực tiếp năng lượng điện thành photon ánh sáng.',
      viTri: 'trong',
      hotspot: { id: 'chip_led', type: 'rect', x: 160, y: 155, width: 80, height: 16 },
    },
    {
      id: 'driver_led',
      ten: 'Mạch nguồn Driver (chấn lưu điện tử)',
      chucNang: 'Chuyển đổi dòng điện xoay chiều AC 220 V thành dòng điện một chiều DC điện áp thấp (12V–48V) ổn định cho chip LED.',
      viTri: 'trong',
      hotspot: { id: 'driver_led', type: 'rect', x: 175, y: 175, width: 50, height: 35 },
    },
  ],
  khoi: [
    { id: 'nguon_ac', ten: 'Nguồn xoay chiều 220 V', chucNang: 'Mạng điện gia đình', x: 30, y: 70 },
    { id: 'driver_k', ten: 'Mạch nguồn Driver', chucNang: 'Chỉnh lưu & hạ áp AC -> DC', x: 170, y: 70 },
    { id: 'chip_led_k', ten: 'Bảng chip LED', chucNang: 'Phát quang tiếp giáp p-n', x: 320, y: 70 },
    { id: 'chao_k', ten: 'Quang năng ra phòng', chucNang: 'Tán quang dịu mắt, hiệu suất cao', x: 460, y: 70 },
  ],
  mui_ten: [
    { id: 'mt_1', tu: 'nguon_ac', den: 'driver_k', nhan: 'AC 220V' },
    { id: 'mt_2', tu: 'driver_k', den: 'chip_led_k', nhan: 'DC ổn định' },
    { id: 'mt_3', tu: 'chip_led_k', den: 'chao_k', nhan: 'Ánh sáng' },
  ],
  buoc: [
    {
      tieuDe: 'Bước 1: Nguồn AC 220 V cấp vào Driver',
      noiDung: 'Dòng điện xoay chiều 220 V đi qua đui đèn vào bảng mạch nguồn Driver nằm bên trong thân tản nhiệt.',
      sangBoPhan: ['dui_den_led', 'driver_led'],
      sangKhoi: ['nguon_ac', 'driver_k'],
      sangMuiTen: ['mt_1'],
    },
    {
      tieuDe: 'Bước 2: Driver hạ áp và chỉnh lưu sang DC',
      noiDung: 'Driver biến đổi AC thành dòng một chiều DC điện áp thấp với dòng điện cố định, lọc phẳng xung nhiễu.',
      sangBoPhan: ['driver_led'],
      sangKhoi: ['driver_k', 'chip_led_k'],
      sangMuiTen: ['mt_2'],
    },
    {
      tieuDe: 'Bước 3: Chip LED phát quang tiếp giáp p-n',
      noiDung: 'Dòng điện DC chạy qua các điốt bán dẫn LED; electron tái hợp với lỗ trống giải phóng photon ánh sáng tức thì (không cần thời gian chờ nung).',
      sangBoPhan: ['chip_led'],
      sangKhoi: ['chip_led_k'],
      sangMuiTen: ['mt_2', 'mt_3'],
    },
    {
      tieuDe: 'Bước 4: Tán quang và tản nhiệt ra ngoài',
      noiDung: 'Ánh sáng truyền qua bầu tán quang trắng đục tỏa đều khắp phòng; nhiệt lượng sinh ra được thân nhôm tản nhanh ra môi trường.',
      sangBoPhan: ['chao_tan_quang', 'de_tan_nhiet'],
      sangKhoi: ['chao_k'],
      sangMuiTen: ['mt_3'],
    },
  ],
  thongSo: [
    { ten: 'Điện áp định mức', giaTri: '220 V (150–250 V)', chuThich: 'Driver dải rộng không sợ sụt áp' },
    { ten: 'Công suất định mức', giaTri: '5 W – 20 W', chuThich: 'Đèn búp tròn thông dụng 9 W' },
    { ten: 'Hiệu suất phát quang', giaTri: '90 – 120 lm/W', chuThich: 'Rất cao (gấp 8-10 lần đèn sợi đốt)' },
    { ten: 'Tuổi thọ trung bình', giaTri: '25.000 – 30.000 giờ', chuThich: 'Gấp ~25 lần sợi đốt, bền bỉ' },
  ],
  anToan: [
    'Đèn LED không chứa kim loại nặng thủy ngân độc hại và không phát tia cực tím (UV), rất an toàn cho mắt và môi trường.',
    'Chỉ tháo lắp khi đã ngắt công tắc điện để tránh nguy cơ điện giật.',
    'Tránh lắp đèn trong môi trường kín nhiệt độ cao hoặc ẩm ướt vượt quá chỉ số bảo vệ của đèn.',
  ],
  tietKiem: [
    'Đèn LED 9 W cho độ sáng tương đương đèn sợi đốt 60 W, tiết kiệm đến 85% điện năng tiêu thụ.',
    'Tuổi thọ rất dài giúp tiết kiệm chi phí mua sắm và công thay thế bóng đèn định kỳ.',
    'Bật tắt tức thì không hao phí điện năng khởi động, thích hợp lắp ở mọi vị trí trong nhà.',
  ],
  hinhSVG: {
    viewBox: '0 0 400 320',
    ngoai: (highlightIds, selectedId, onSelect) => {
      const isHl = (id: string) => highlightIds.includes(id) || selectedId === id;
      return (
        <g stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Bulb Dome (Chao tán quang) */}
          <path
            d="M 145 150 C 145 80, 255 80, 255 150 Z"
            fill={isHl('chao_tan_quang') ? '#e0f2fe' : '#f8fafc'}
            strokeWidth={isHl('chao_tan_quang') ? 3 : 2}
            className="cursor-pointer transition-colors"
            onClick={() => onSelect('chao_tan_quang')}
          />
          {/* Heatsink Body (Đế tản nhiệt) */}
          <path
            d="M 150 150 L 165 215 L 235 215 L 250 150 Z"
            fill={isHl('de_tan_nhiet') ? '#93c5fd' : '#e2e8f0'}
            strokeWidth={isHl('de_tan_nhiet') ? 3 : 2}
            className="cursor-pointer transition-colors"
            onClick={() => onSelect('de_tan_nhiet')}
          />
          <line x1="175" y1="165" x2="180" y2="205" stroke="#94a3b8" />
          <line x1="200" y1="165" x2="200" y2="205" stroke="#94a3b8" />
          <line x1="225" y1="165" x2="220" y2="205" stroke="#94a3b8" />
          {/* E27 Base (Đui đèn) */}
          <rect
            x="178"
            y="215"
            width="44"
            height="35"
            rx="3"
            fill={isHl('dui_den_led') ? '#60a5fa' : '#cbd5e1'}
            className="cursor-pointer"
            onClick={() => onSelect('dui_den_led')}
          />
          <line x1="180" y1="224" x2="220" y2="224" />
          <line x1="180" y1="233" x2="220" y2="233" />
          <line x1="180" y1="242" x2="220" y2="242" />
          <path d="M 190 250 L 200 260 L 210 250 Z" fill="#475569" />
          {/* Glow rays */}
          {highlightIds.includes('chao_tan_quang') && (
            <g stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3">
              <line x1="200" y1="75" x2="200" y2="55" />
              <line x1="130" y1="100" x2="110" y2="85" />
              <line x1="270" y1="100" x2="290" y2="85" />
            </g>
          )}
        </g>
      );
    },
    trong: (highlightIds, selectedId, onSelect) => {
      const isHl = (id: string) => highlightIds.includes(id) || selectedId === id;
      return (
        <g stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Transparent Dome outline */}
          <path
            d="M 145 150 C 145 80, 255 80, 255 150 Z"
            fill={isHl('chao_tan_quang') ? '#e0f2fe' : '#f1f5f9'}
            fillOpacity="0.3"
            strokeDasharray="4 2"
            className="cursor-pointer"
            onClick={() => onSelect('chao_tan_quang')}
          />
          {/* LED Plate (Bảng nhôm chip LED) */}
          <rect
            x="155"
            y="145"
            width="90"
            height="8"
            rx="2"
            fill={isHl('chip_led') ? '#facc15' : '#cbd5e1'}
            strokeWidth={isHl('chip_led') ? 3 : 2}
            className="cursor-pointer"
            onClick={() => onSelect('chip_led')}
          />
          {/* Individual LED chips (nhỏ) */}
          {[165, 180, 195, 210, 225].map((cx) => (
            <rect
              key={cx}
              x={cx}
              y="140"
              width="8"
              height="5"
              fill={isHl('chip_led') ? '#ef4444' : '#eab308'}
              stroke="#0f172a"
              strokeWidth="1"
              className="cursor-pointer"
              onClick={() => onSelect('chip_led')}
            />
          ))}
          {/* Cutaway Body */}
          <path
            d="M 150 150 L 165 215 L 235 215 L 250 150 Z"
            fill={isHl('de_tan_nhiet') ? '#bfdbfe' : '#f8fafc'}
            strokeDasharray="4 2"
            className="cursor-pointer"
            onClick={() => onSelect('de_tan_nhiet')}
          />
          {/* Driver circuit board inside */}
          <rect
            x="175"
            y="170"
            width="50"
            height="35"
            rx="3"
            fill={isHl('driver_led') ? '#22c55e' : '#15803d'}
            strokeWidth={isHl('driver_led') ? 3 : 2}
            className="cursor-pointer"
            onClick={() => onSelect('driver_led')}
          />
          <text x="200" y="192" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ffffff" stroke="none">
            Driver
          </text>
          {/* Base */}
          <rect x="178" y="215" width="44" height="35" rx="3" fill="#cbd5e1" />
          <line x1="180" y1="225" x2="220" y2="225" />
          <line x1="180" y1="235" x2="220" y2="235" />
          <path d="M 190 250 L 200 260 L 210 250 Z" fill="#475569" />
        </g>
      );
    },
  },
};

export const DEN_DIEN_SUBTYPES: Record<string, DoDungDienDef> = {
  'soi-dot': DEN_SOI_DOT,
  'huynh-quang': DEN_HUYNH_QUANG,
  led: DEN_LED,
};
