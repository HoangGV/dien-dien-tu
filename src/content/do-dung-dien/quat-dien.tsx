import React from 'react';
import { DoDungDienDef } from './types';

export const QUAT_DIEN: DoDungDienDef = {
  id: 'quat-dien',
  ten: 'Quạt điện',
  moTaNgan: 'Đồ dùng loại điện - cơ biến đổi điện năng thành cơ năng làm quay cánh quạt tạo luồng gió mát.',
  reviewStatus: 'cần GV đối chiếu',
  boPhan: [
    {
      id: 'long_quat',
      ten: 'Lồng bảo vệ',
      chucNang: 'Bảo vệ cánh quạt khỏi va chạm và đảm bảo an toàn cho người dùng không chạm vào cánh quạt đang quay.',
      viTri: 'ngoai',
      hotspot: { id: 'long_quat', type: 'circle', cx: 200, cy: 110, r: 80 },
    },
    {
      id: 'canh_quat',
      ten: 'Cánh quạt',
      chucNang: 'Gắn liền với trục động cơ; khi quay với góc nghiêng sẽ đẩy không khí về phía trước tạo luồng gió làm mát.',
      viTri: 'ngoai',
      hotspot: { id: 'canh_quat', type: 'circle', cx: 200, cy: 110, r: 65 },
    },
    {
      id: 'dong_co',
      ten: 'Động cơ điện (stato & rôto)',
      chucNang: 'Biến đổi điện năng thành cơ năng quay; stato có cuộn dây sinh từ trường quay, rôto lồng sóc quay theo từ trường kéo trục quạt.',
      viTri: 'trong',
      hotspot: { id: 'dong_co', type: 'rect', x: 170, y: 85, width: 60, height: 50 },
    },
    {
      id: 'tu_dien',
      ten: 'Tụ điện khởi động',
      chucNang: 'Tạo góc lệch pha dòng điện giữa cuộn khởi động và cuộn làm việc, giúp động cơ 1 pha tự sinh từ trường quay để quay được.',
      viTri: 'trong',
      hotspot: { id: 'tu_dien', type: 'rect', x: 215, y: 75, width: 20, height: 18 },
    },
    {
      id: 'tuoc_nang',
      ten: 'Bộ chuyển hướng (tuốc-năng)',
      chucNang: 'Cơ cấu bánh răng ăn khớp với trục động cơ giúp thân quạt quay đảo qua lại sang hai bên mở rộng vùng làm mát.',
      viTri: 'ngoai',
      hotspot: { id: 'tuoc_nang', type: 'rect', x: 193, y: 65, width: 14, height: 20 },
    },
    {
      id: 'than_quat',
      ten: 'Thân và chân đế',
      chucNang: 'Nâng đỡ động cơ và lồng quạt, giữ quạt đứng vững chắc chắn trên sàn nhà hoặc mặt bàn.',
      viTri: 'ngoai',
      hotspot: { id: 'than_quat', type: 'rect', x: 130, y: 190, width: 140, height: 110 },
    },
    {
      id: 'bo_dieu_toc',
      ten: 'Bộ điều tốc & Phím bấm',
      chucNang: 'Bật/tắt quạt và thay đổi tốc độ gió (thường gồm phím 0-Tắt, 1-Nhẹ, 2-Vừa, 3-Mạnh).',
      viTri: 'ngoai',
      hotspot: { id: 'bo_dieu_toc', type: 'rect', x: 155, y: 245, width: 90, height: 35 },
    },
    {
      id: 'day_nguon',
      ten: 'Dây nguồn & phích cắm',
      chucNang: 'Dẫn điện từ mạng điện gia đình 220 V cấp vào mạch điều khiển quạt.',
      viTri: 'ngoai',
      hotspot: { id: 'day_nguon', type: 'rect', x: 250, y: 270, width: 60, height: 35 },
    },
  ],
  khoi: [
    { id: 'k_nguon', ten: 'Nguồn điện (220 V)', chucNang: 'Cấp điện áp xoay chiều vào quạt', x: 60, y: 80 },
    { id: 'k_dieukhien', ten: 'Bộ điều tốc (Phím bấm)', chucNang: 'Đóng/ngắt và điều chỉnh tốc độ quay', x: 220, y: 80 },
    { id: 'k_dongco', ten: 'Động cơ điện (Điện-Cơ)', chucNang: 'Biến đổi điện năng thành cơ năng quay trục', x: 390, y: 80 },
    { id: 'k_canhquat', ten: 'Cánh quạt & Gió mát', chucNang: 'Quay đẩy không khí tạo ra luồng gió làm mát', x: 560, y: 80 },
    { id: 'k_tuocnang', ten: 'Bộ chuyển hướng', chucNang: 'Truyền động cơ khí đảo hướng gió 90°', x: 390, y: 190 },
  ],
  mui_ten: [
    { id: 'mt_1', tu: 'k_nguon', den: 'k_dieukhien', nhan: 'Cấp điện' },
    { id: 'mt_2', tu: 'k_dieukhien', den: 'k_dongco', nhan: 'Dòng điện theo số' },
    { id: 'mt_3', tu: 'k_dongco', den: 'k_canhquat', nhan: 'Quay trục cánh' },
    { id: 'mt_4', tu: 'k_dongco', den: 'k_tuocnang', nhan: 'Bánh răng kéo' },
  ],
  buoc: [
    {
      tieuDe: '1. Cắm điện và chọn tốc độ',
      noiDung: 'Cắm phích cắm vào nguồn 220 V và bấm phím số (1, 2 hoặc 3); dòng điện đi qua bộ điều tốc cấp vào cuộn dây động cơ.',
      sangBoPhan: ['day_nguon', 'bo_dieu_toc'],
      sangKhoi: ['k_nguon', 'k_dieukhien'],
      sangMuiTen: ['mt_1'],
    },
    {
      tieuDe: '2. Tụ điện tạo góc lệch pha',
      noiDung: 'Tụ điện phối hợp với cuộn khởi động tạo góc lệch pha 90° so với cuộn làm việc, giúp stato sinh ra từ trường quay liên tục.',
      sangBoPhan: ['tu_dien', 'dong_co'],
      sangKhoi: ['k_dieukhien', 'k_dongco'],
      sangMuiTen: ['mt_2'],
    },
    {
      tieuDe: '3. Rôto quay với tốc độ cao',
      noiDung: 'Từ trường quay tác dụng lực điện từ kéo các thanh dẫn rôto lồng sóc quay tròn, làm trục động cơ quay đều đặn.',
      sangBoPhan: ['dong_co'],
      sangKhoi: ['k_dongco'],
      sangMuiTen: ['mt_2'],
    },
    {
      tieuDe: '4. Cánh quạt quay tạo gió mát',
      noiDung: 'Trục động cơ kéo 3 cánh quạt quay với tốc độ cao; biên dạng nghiêng của cánh liên tục đẩy khối không khí về phía trước tạo luồng gió mát.',
      sangBoPhan: ['canh_quat', 'long_quat'],
      sangKhoi: ['k_canhquat'],
      sangMuiTen: ['mt_3'],
    },
    {
      tieuDe: '5. Tuốc-năng quay đảo hướng',
      noiDung: 'Khi ấn núm tuốc-năng, trục vít ở đuôi động cơ truyền động qua bánh răng làm cả cụm quạt quay đảo qua lại sang hai bên mở rộng vùng làm mát.',
      sangBoPhan: ['tuoc_nang', 'than_quat'],
      sangKhoi: ['k_tuocnang'],
      sangMuiTen: ['mt_4'],
    },
  ],
  thongSo: [
    { ten: 'Điện áp định mức', giaTri: '220 V' },
    { ten: 'Tần số định mức', giaTri: '50 Hz' },
    { ten: 'Công suất tiêu thụ', giaTri: '45 – 65 W' },
    { ten: 'Đường kính cánh quạt', giaTri: '350 – 400 mm' },
    { ten: 'Số cấp tốc độ gió', giaTri: '3 cấp (1: Nhẹ, 2: Vừa, 3: Mạnh)' },
    { ten: 'Góc quay đảo gió', giaTri: 'Khoảng 80° – 90°' },
  ],
  anToan: [
    'Không bao giờ thò ngón tay, bút viết hay que gậy qua khe lồng bảo vệ khi quạt đang quay.',
    'Luôn rút phích cắm điện trước khi tháo lồng quạt để vệ sinh, lau chùi hoặc bảo dưỡng tra dầu.',
    'Đặt quạt ở vị trí bằng phẳng, chắc chắn trên sàn hoặc mặt bàn để quạt không bị rung lắc đổ ngã.',
    'Không để nước hoặc độ ẩm ngấm vào bầu động cơ gây chập điện hoặc rò rỉ điện ra vỏ.',
  ],
  tietKiem: [
    'Bật quạt ở tốc độ vừa đủ mát theo nhu cầu (số nhỏ 1 tiêu thụ ít điện hơn đáng kể so với số 3).',
    'Tắt quạt ngay khi rời khỏi phòng để tránh lãng phí điện năng.',
    'Thường xuyên lau chùi bụi bẩn bám trên cánh quạt và lồng quạt để quạt quay êm, nhẹ và gió thoáng mát hơn.',
    'Định kì tra vài giọt dầu máy chuyên dụng vào ổ trục bạc để giảm ma sát, giúp động cơ chạy bền bỉ và không bị nóng.',
  ],
  hinhSVG: {
    viewBox: '0 0 400 320',
    ngoai: (highlightIds, selectedId, onSelect) => (
      <g className="select-none">
        {/* Nền chân đế */}
        <ellipse cx="200" cy="295" rx="70" ry="15" fill="#E2E8F0" />

        {/* Chân đế quạt */}
        <path
          d="M 140 285 C 140 250, 260 250, 260 285 Z"
          fill={highlightIds.includes('than_quat') ? '#BBF7D0' : selectedId === 'than_quat' ? '#FEF08A' : '#F1F5F9'}
          stroke="#000000"
          strokeWidth={highlightIds.includes('than_quat') || selectedId === 'than_quat' ? 3 : 2}
          className="cursor-pointer transition-colors"
          onClick={() => onSelect('than_quat')}
        />

        {/* Bảng phím bấm tốc độ */}
        <g
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onSelect('bo_dieu_toc'); }}
        >
          <rect
            x="160"
            y="262"
            width="80"
            height="20"
            rx="4"
            fill={highlightIds.includes('bo_dieu_toc') ? '#BBF7D0' : selectedId === 'bo_dieu_toc' ? '#FEF08A' : '#FFFFFF'}
            stroke="#000"
            strokeWidth={highlightIds.includes('bo_dieu_toc') || selectedId === 'bo_dieu_toc' ? 2.5 : 1.5}
          />
          {/* 4 nút: 0 1 2 3 */}
          <rect x="165" y="265" width="14" height="14" rx="2" fill="#E2E8F0" stroke="#000" strokeWidth="1" />
          <text x="172" y="275" textAnchor="middle" fontSize="8" fontWeight="bold">0</text>
          <rect x="183" y="265" width="14" height="14" rx="2" fill="#93C5FD" stroke="#000" strokeWidth="1" />
          <text x="190" y="275" textAnchor="middle" fontSize="8" fontWeight="bold">1</text>
          <rect x="201" y="265" width="14" height="14" rx="2" fill="#60A5FA" stroke="#000" strokeWidth="1" />
          <text x="208" y="275" textAnchor="middle" fontSize="8" fontWeight="bold">2</text>
          <rect x="219" y="265" width="14" height="14" rx="2" fill="#2563EB" stroke="#000" strokeWidth="1" />
          <text x="226" y="275" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FFF">3</text>
        </g>

        {/* Thân quạt (cột đứng) */}
        <rect
          x="193"
          y="180"
          width="14"
          height="75"
          fill="#64748B"
          stroke="#000000"
          strokeWidth="2"
          className="cursor-pointer"
          onClick={() => onSelect('than_quat')}
        />

        {/* Bầu quạt & Tuốc năng */}
        <rect x="175" y="100" width="50" height="40" rx="8" fill="#E2E8F0" stroke="#000" strokeWidth="2" />
        {/* Núm tuốc năng */}
        <g
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onSelect('tuoc_nang'); }}
        >
          <rect
            x="195"
            y="78"
            width="10"
            height="22"
            rx="2"
            fill={highlightIds.includes('tuoc_nang') ? '#BBF7D0' : selectedId === 'tuoc_nang' ? '#FEF08A' : '#EF4444'}
            stroke="#000"
            strokeWidth={highlightIds.includes('tuoc_nang') || selectedId === 'tuoc_nang' ? 2.5 : 1.5}
          />
        </g>

        {/* Lồng bảo vệ ngoài (hình tròn lớn) */}
        <circle
          cx="200"
          cy="110"
          r="80"
          fill="none"
          stroke={highlightIds.includes('long_quat') ? '#10B981' : selectedId === 'long_quat' ? '#EAB308' : '#000000'}
          strokeWidth={highlightIds.includes('long_quat') || selectedId === 'long_quat' ? 3.5 : 2}
          className="cursor-pointer transition-colors"
          onClick={() => onSelect('long_quat')}
        />
        {/* Nan lồng quạt */}
        <circle cx="200" cy="110" r="55" fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="200" y1="30" x2="200" y2="190" stroke="#94A3B8" strokeWidth="1" />
        <line x1="120" y1="110" x2="280" y2="110" stroke="#94A3B8" strokeWidth="1" />
        <line x1="143" y1="53" x2="257" y2="167" stroke="#94A3B8" strokeWidth="1" />
        <line x1="143" y1="167" x2="257" y2="53" stroke="#94A3B8" strokeWidth="1" />

        {/* Cánh quạt (3 cánh cong) */}
        <g
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onSelect('canh_quat'); }}
        >
          {/* Cánh 1: hướng lên */}
          <path
            d="M 200 110 C 185 80, 180 50, 200 45 C 220 50, 215 80, 200 110 Z"
            fill={highlightIds.includes('canh_quat') ? '#34D399' : selectedId === 'canh_quat' ? '#FDE047' : '#38BDF8'}
            stroke="#000"
            strokeWidth="1.5"
          />
          {/* Cánh 2: hướng góc 120° */}
          <path
            d="M 200 110 C 225 120, 255 135, 255 155 C 245 168, 215 155, 200 110 Z"
            fill={highlightIds.includes('canh_quat') ? '#34D399' : selectedId === 'canh_quat' ? '#FDE047' : '#38BDF8'}
            stroke="#000"
            strokeWidth="1.5"
          />
          {/* Cánh 3: hướng góc 240° */}
          <path
            d="M 200 110 C 175 120, 145 135, 145 155 C 155 168, 185 155, 200 110 Z"
            fill={highlightIds.includes('canh_quat') ? '#34D399' : selectedId === 'canh_quat' ? '#FDE047' : '#38BDF8'}
            stroke="#000"
            strokeWidth="1.5"
          />
          {/* Trục tâm cánh quạt */}
          <circle cx="200" cy="110" r="16" fill="#1E293B" stroke="#000" strokeWidth="2" />
          <circle cx="200" cy="110" r="6" fill="#FFFFFF" />
        </g>

        {/* Dây nguồn */}
        <g
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onSelect('day_nguon'); }}
        >
          <path
            d="M 255 280 C 280 280, 290 290, 320 290"
            fill="none"
            stroke={highlightIds.includes('day_nguon') || selectedId === 'day_nguon' ? '#10B981' : '#000000'}
            strokeWidth={highlightIds.includes('day_nguon') || selectedId === 'day_nguon' ? 5 : 3}
          />
          <rect x="310" y="282" width="18" height="15" rx="3" fill="#1E293B" stroke="#000" strokeWidth="1.5" />
        </g>

        <text x="200" y="22" textAnchor="middle" fontSize="12" fontWeight="900" fill="#475569">
          QUẠT ĐIỆN (MẶT NGOÀI)
        </text>
      </g>
    ),
    trong: (highlightIds, selectedId, onSelect) => (
      <g className="select-none">
        {/* Lồng và thân mờ */}
        <circle cx="200" cy="110" r="80" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="3 3" />
        <rect x="193" y="180" width="14" height="75" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
        <ellipse cx="200" cy="285" rx="60" ry="12" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />

        {/* Bầu quạt cắt lớp mờ */}
        <rect x="150" y="70" width="100" height="85" rx="12" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" strokeDasharray="4 2" />

        {/* Động cơ điện (Stato & Cuộn dây đồng) */}
        <g
          className="cursor-pointer"
          onClick={() => onSelect('dong_co')}
        >
          {/* Lõi thép stato */}
          <rect
            x="165"
            y="85"
            width="70"
            height="55"
            rx="4"
            fill={highlightIds.includes('dong_co') ? '#BBF7D0' : selectedId === 'dong_co' ? '#FEF08A' : '#94A3B8'}
            stroke="#000000"
            strokeWidth={highlightIds.includes('dong_co') || selectedId === 'dong_co' ? 3 : 2}
          />
          {/* Cuộn dây stato (màu đồng) */}
          <rect x="168" y="90" width="16" height="45" rx="2" fill="#D97706" stroke="#000" strokeWidth="1" />
          <rect x="216" y="90" width="16" height="45" rx="2" fill="#D97706" stroke="#000" strokeWidth="1" />

          {/* Rôto lồng sóc quay */}
          <rect x="187" y="94" width="26" height="37" rx="3" fill="#475569" stroke="#000" strokeWidth="1.5" />
          {/* Rãnh rôto xiên */}
          <line x1="192" y1="96" x2="194" y2="129" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="200" y1="96" x2="202" y2="129" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="208" y1="96" x2="210" y2="129" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Trục quay động cơ vươn ra trước */}
          <rect x="140" y="108" width="50" height="5" fill="#CBD5E1" stroke="#000" strokeWidth="1.5" />
        </g>

        {/* Tụ điện khởi động (hộp đen bên cạnh) */}
        <g
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onSelect('tu_dien'); }}
        >
          <rect
            x="215"
            y="70"
            width="28"
            height="20"
            rx="3"
            fill={highlightIds.includes('tu_dien') ? '#BBF7D0' : selectedId === 'tu_dien' ? '#FEF08A' : '#1E293B'}
            stroke="#000"
            strokeWidth={highlightIds.includes('tu_dien') || selectedId === 'tu_dien' ? 3 : 1.5}
          />
          <text x="229" y="83" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#FFF">C</text>
          <line x1="222" y1="90" x2="222" y2="98" stroke="#000" strokeWidth="1.5" />
          <line x1="232" y1="90" x2="232" y2="98" stroke="#000" strokeWidth="1.5" />
        </g>

        {/* Bộ tuốc-năng bánh răng phía đuôi */}
        <g
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onSelect('tuoc_nang'); }}
        >
          <rect x="235" y="102" width="16" height="20" rx="3" fill="#CBD5E1" stroke="#000" strokeWidth="1.5" />
          <circle cx="243" cy="112" r="5" fill="#EF4444" stroke="#000" strokeWidth="1" />
          <line x1="243" y1="85" x2="243" y2="102" stroke="#000" strokeWidth="2" />
          <circle cx="243" cy="83" r="3" fill="#EF4444" stroke="#000" strokeWidth="1" />
        </g>

        {/* Nhãn chú thích */}
        <text x="200" y="155" textAnchor="middle" fontSize="10" fontWeight="900" fill="#000000">
          ĐỘNG CƠ ĐIỆN (STATO & RÔTO)
        </text>
        <text x="200" y="30" textAnchor="middle" fontSize="12" fontWeight="900" fill="#475569">
          CẤU TẠO ĐỘNG CƠ BÊN TRONG (CẮT LỚP)
        </text>
      </g>
    ),
  },
};
