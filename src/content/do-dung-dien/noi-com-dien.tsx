import React from 'react';
import { DoDungDienDef } from './types';

export const NOI_COM_DIEN: DoDungDienDef = {
  id: 'noi-com-dien',
  ten: 'Nồi cơm điện',
  moTaNgan: 'Thiết bị nấu cơm tự động bằng nhiệt điện với cảm biến nhiệt tự ngắt khi cạn nước.',
  reviewStatus: 'cần GV đối chiếu',
  boPhan: [
    {
      id: 'vo_noi',
      ten: 'Vỏ nồi',
      chucNang: 'Bảo vệ các bộ phận bên trong, cách nhiệt và tạo thẩm mĩ, giữ an toàn tránh chạm gián tiếp vào điện.',
      viTri: 'ngoai',
      hotspot: { id: 'vo_noi', type: 'rect', x: 70, y: 130, width: 260, height: 160 },
    },
    {
      id: 'nap_noi',
      ten: 'Nắp nồi',
      chucNang: 'Đậy kín giữ nhiệt và áp suất hơi nước giúp cơm chín đều; có van thoát hơi nước chống tràn.',
      viTri: 'ngoai',
      hotspot: { id: 'nap_noi', type: 'rect', x: 80, y: 70, width: 240, height: 60 },
    },
    {
      id: 'cong_tac',
      ten: 'Công tắc (nút gạt nấu)',
      chucNang: 'Nút gạt cơ học điều khiển đóng tiếp điểm cấp điện công suất cao cho mâm nhiệt hoạt động.',
      viTri: 'ngoai',
      hotspot: { id: 'cong_tac', type: 'rect', x: 180, y: 240, width: 40, height: 26 },
    },
    {
      id: 'den_bao',
      ten: 'Đèn báo (Cook / Warm)',
      chucNang: 'Đèn LED hiển thị trạng thái hoạt động: đỏ (Nấu - Cook) và vàng/cam (Ủ ấm - Warm).',
      viTri: 'ngoai',
      hotspot: { id: 'den_bao', type: 'rect', x: 175, y: 200, width: 50, height: 30 },
    },
    {
      id: 'day_nguon',
      ten: 'Dây nguồn & phích cắm',
      chucNang: 'Dẫn điện xoay chiều 220 V từ ổ cắm mạng điện gia đình vào nồi cơm điện.',
      viTri: 'ngoai',
      hotspot: { id: 'day_nguon', type: 'rect', x: 330, y: 250, width: 60, height: 40 },
    },
    {
      id: 'noi_nau',
      ten: 'Nồi nấu (soong)',
      chucNang: 'Chứa gạo và nước để nấu cơm, làm bằng hợp kim nhôm truyền nhiệt nhanh, lòng nồi phủ men chống dính.',
      viTri: 'trong',
      hotspot: { id: 'noi_nau', type: 'rect', x: 100, y: 120, width: 200, height: 110 },
    },
    {
      id: 'mam_nhiet',
      ten: 'Mâm nhiệt (điện trở nung)',
      chucNang: 'Chuyển điện năng thành nhiệt năng, truyền nhiệt lượng trực tiếp nung nóng đáy nồi nấu.',
      viTri: 'trong',
      hotspot: { id: 'mam_nhiet', type: 'rect', x: 110, y: 236, width: 180, height: 24 },
    },
    {
      id: 'cam_bien_nhiet',
      ten: 'Bộ phận cảm biến nhiệt',
      chucNang: 'Đặt ở chính giữa mâm nhiệt tiếp xúc đáy soong, tự động nhả công tắc ngắt chế độ nấu khi cạn nước (khoảng 105 °C).',
      viTri: 'trong',
      hotspot: { id: 'cam_bien_nhiet', type: 'rect', x: 185, y: 242, width: 30, height: 26 },
    },
  ],
  khoi: [
    { id: 'k_nguon', ten: 'Nguồn điện (220 V)', chucNang: 'Cấp điện năng từ mạng điện gia đình vào nồi', x: 60, y: 80 },
    { id: 'k_dieukhien', ten: 'Bộ điều khiển (Nút nấu / Rơ le)', chucNang: 'Đóng/ngắt dòng điện và chuyển trạng thái Nấu ↔ Ủ', x: 220, y: 80 },
    { id: 'k_bienthu', ten: 'Mâm nhiệt (Biến đổi điện năng)', chucNang: 'Chuyển hóa điện năng thành nhiệt năng', x: 390, y: 80 },
    { id: 'k_noinau', ten: 'Nồi nấu & Cơm chín', chucNang: 'Hấp thụ nhiệt lượng, đun sôi nước và làm chín hạt gạo', x: 560, y: 80 },
    { id: 'k_cambien', ten: 'Cảm biến nhiệt độ', chucNang: 'Đo nhiệt đáy soong, nhận biết cạn nước để ngắt về giữ ấm', x: 390, y: 190 },
  ],
  mui_ten: [
    { id: 'mt_1', tu: 'k_nguon', den: 'k_dieukhien', nhan: 'Cấp điện' },
    { id: 'mt_2', tu: 'k_dieukhien', den: 'k_bienthu', nhan: 'Dòng điện nấu' },
    { id: 'mt_3', tu: 'k_bienthu', den: 'k_noinau', nhan: 'Truyền nhiệt' },
    { id: 'mt_4', tu: 'k_noinau', den: 'k_cambien', nhan: 'Nhiệt độ đáy' },
    { id: 'mt_5', tu: 'k_cambien', den: 'k_dieukhien', nhan: 'Tác động ngắt (105 °C)' },
  ],
  buoc: [
    {
      tieuDe: '1. Chuẩn bị & bật công tắc nấu',
      noiDung: 'Cắm dây nguồn và gạt nút công tắc nấu xuống chế độ Cook; đèn báo Cook sáng, mạch điện cấp vào mâm nhiệt đóng kín.',
      sangBoPhan: ['day_nguon', 'cong_tac', 'den_bao'],
      sangKhoi: ['k_nguon', 'k_dieukhien'],
      sangMuiTen: ['mt_1'],
    },
    {
      tieuDe: '2. Mâm nhiệt phát nhiệt mạnh',
      noiDung: 'Dòng điện xoay chiều chạy qua dây điện trở đúc kín trong mâm nhiệt, chuyển hóa điện năng thành nhiệt lượng lớn làm mâm nhiệt nóng dần.',
      sangBoPhan: ['mam_nhiet'],
      sangKhoi: ['k_bienthu'],
      sangMuiTen: ['mt_2'],
    },
    {
      tieuDe: '3. Truyền nhiệt đun sôi nước',
      noiDung: 'Nhiệt lượng từ mâm nhiệt truyền trực tiếp qua đáy nồi nấu nhôm, nước sôi ở 100 °C, hạt gạo hút nước và hấp thụ nhiệt nở chín đều.',
      sangBoPhan: ['noi_nau', 'nap_noi'],
      sangKhoi: ['k_noinau'],
      sangMuiTen: ['mt_3'],
    },
    {
      tieuDe: '4. Cạn nước & tăng nhiệt đáy',
      noiDung: 'Khi nước trong nồi cạn hết, hạt gạo chuyển thành cơm chín; nhiệt độ đáy soong không còn bị giữ ở 100 °C mà tăng nhanh vượt ngưỡng 105 °C.',
      sangBoPhan: ['noi_nau', 'cam_bien_nhiet'],
      sangKhoi: ['k_noinau', 'k_cambien'],
      sangMuiTen: ['mt_4'],
    },
    {
      tieuDe: '5. Cảm biến nhiệt tự động ngắt',
      noiDung: 'Bộ cảm biến nhiệt giữa mâm nhiệt phát hiện nhiệt độ vượt quá 105 °C, nam châm nhả lẫy cơ học đẩy nút gạt bật lên nấc trên.',
      sangBoPhan: ['cam_bien_nhiet', 'cong_tac'],
      sangKhoi: ['k_cambien', 'k_dieukhien'],
      sangMuiTen: ['mt_5'],
    },
    {
      tieuDe: '6. Chuyển sang giữ ấm (Warm)',
      noiDung: 'Đèn báo chuyển sang màu vàng (Warm), mạch chuyển sang bộ điện trở ủ công suất nhỏ để giữ cơm luôn ấm nóng mà không bị cháy khê.',
      sangBoPhan: ['den_bao', 'vo_noi'],
      sangKhoi: ['k_dieukhien', 'k_noinau'],
      sangMuiTen: ['mt_2'],
    },
  ],
  thongSo: [
    { ten: 'Điện áp định mức', giaTri: '220 V' },
    { ten: 'Tần số định mức', giaTri: '50 Hz' },
    { ten: 'Công suất nấu (Cook)', giaTri: '500 – 700 W' },
    { ten: 'Công suất giữ ấm (Warm)', giaTri: '30 – 45 W' },
    { ten: 'Dung tích lòng nồi', giaTri: '1,2 – 1,8 L (3–6 người ăn)' },
    { ten: 'Vật liệu lòng nồi', giaTri: 'Hợp kim nhôm phủ chống dính' },
  ],
  anToan: [
    'Lau khô sạch mặt ngoài và đáy nồi nấu (soong) bằng khăn mềm trước khi đặt vào vỏ nồi.',
    'Không dùng tay hoặc để mặt gần lỗ thoát hơi trên nắp khi nồi đang nấu sôi.',
    'Không dùng các vật nhọn, sắc hoặc bùi nhùi thép để cọ rửa lòng nồi làm xước men chống dính.',
    'Rút phích cắm khỏi ổ điện khi không sử dụng hoặc trước khi vệ sinh thân nồi.',
  ],
  tietKiem: [
    'Chọn dung tích nồi phù hợp với số lượng người ăn trong gia đình (1,2 L cho 2–3 người; 1,8 L cho 4–6 người).',
    'Ngâm gạo trước khi nấu khoảng 15–30 phút giúp cơm chín nhanh hơn và tiết kiệm điện.',
    'Hạn chế mở nắp nồi liên tục trong khi cơm đang sôi để tránh thất thoát nhiệt lượng.',
    'Thường xuyên vệ sinh sạch sẽ mặt mâm nhiệt để khả năng tiếp xúc và truyền nhiệt sang đáy soong luôn tối ưu.',
  ],
  hinhSVG: {
    viewBox: '0 0 400 320',
    ngoai: (highlightIds, selectedId, onSelect) => (
      <g className="select-none">
        {/* Nền bệ đỡ */}
        <ellipse cx="200" cy="295" rx="140" ry="12" fill="#E2E8F0" />

        {/* Vỏ ngoài */}
        <rect
          x="70"
          y="130"
          width="260"
          height="150"
          rx="25"
          fill={highlightIds.includes('vo_noi') ? '#BBF7D0' : selectedId === 'vo_noi' ? '#FEF08A' : '#F8FAFC'}
          stroke="#000000"
          strokeWidth={highlightIds.includes('vo_noi') || selectedId === 'vo_noi' ? 3 : 2}
          className="cursor-pointer transition-colors"
          onClick={() => onSelect('vo_noi')}
        />
        {/* Quai xách thân */}
        <path d="M 60 170 L 70 170 L 70 200 L 60 200 Z" fill="#334155" stroke="#000" strokeWidth="2" />
        <path d="M 330 170 L 340 170 L 340 200 L 330 200 Z" fill="#334155" stroke="#000" strokeWidth="2" />

        {/* Nắp nồi */}
        <path
          d="M 80 130 C 80 80, 320 80, 320 130 Z"
          fill={highlightIds.includes('nap_noi') ? '#BBF7D0' : selectedId === 'nap_noi' ? '#FEF08A' : '#E2E8F0'}
          stroke="#000000"
          strokeWidth={highlightIds.includes('nap_noi') || selectedId === 'nap_noi' ? 3 : 2}
          className="cursor-pointer transition-colors"
          onClick={() => onSelect('nap_noi')}
        />
        {/* Tay cầm nắp & van thoát hơi */}
        <rect x="175" y="65" width="50" height="20" rx="6" fill="#334155" stroke="#000" strokeWidth="2" />
        <circle cx="270" cy="100" r="7" fill="#64748B" stroke="#000" strokeWidth="1.5" />

        {/* Bảng điều khiển mặt trước */}
        <rect x="160" y="180" width="80" height="90" rx="8" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />

        {/* Đèn báo Cook / Warm */}
        <g
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onSelect('den_bao'); }}
        >
          <rect
            x="168"
            y="190"
            width="64"
            height="36"
            rx="4"
            fill={highlightIds.includes('den_bao') ? '#BBF7D0' : selectedId === 'den_bao' ? '#FEF08A' : '#F1F5F9'}
            stroke="#000"
            strokeWidth={highlightIds.includes('den_bao') || selectedId === 'den_bao' ? 2.5 : 1}
          />
          {/* Đèn Cook đỏ */}
          <circle cx="182" cy="202" r="5" fill="#EF4444" stroke="#000" strokeWidth="1" />
          <text x="192" y="205" fontSize="8" fontWeight="bold">COOK</text>
          {/* Đèn Warm vàng */}
          <circle cx="182" cy="217" r="5" fill="#EAB308" stroke="#000" strokeWidth="1" />
          <text x="192" y="220" fontSize="8" fontWeight="bold">WARM</text>
        </g>

        {/* Công tắc (Cần gạt nấu) */}
        <rect
          x="180"
          y="238"
          width="40"
          height="24"
          rx="4"
          fill={highlightIds.includes('cong_tac') ? '#BBF7D0' : selectedId === 'cong_tac' ? '#FEF08A' : '#3B82F6'}
          stroke="#000000"
          strokeWidth={highlightIds.includes('cong_tac') || selectedId === 'cong_tac' ? 3 : 2}
          className="cursor-pointer transition-colors"
          onClick={(e) => { e.stopPropagation(); onSelect('cong_tac'); }}
        />
        <text x="200" y="254" textAnchor="middle" fontSize="9" fontWeight="900" fill="#FFF">NẤU</text>

        {/* Dây nguồn */}
        <g
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onSelect('day_nguon'); }}
        >
          <path
            d="M 325 260 C 350 260, 360 275, 385 275"
            fill="none"
            stroke={highlightIds.includes('day_nguon') || selectedId === 'day_nguon' ? '#10B981' : '#000000'}
            strokeWidth={highlightIds.includes('day_nguon') || selectedId === 'day_nguon' ? 5 : 3.5}
          />
          <rect x="375" y="265" width="20" height="18" rx="3" fill="#1E293B" stroke="#000" strokeWidth="1.5" />
        </g>

        {/* Nhãn chính */}
        <text x="200" y="160" textAnchor="middle" fontSize="12" fontWeight="900" fill="#475569">
          NỒI CƠM ĐIỆN (MẶT NGOÀI)
        </text>
      </g>
    ),
    trong: (highlightIds, selectedId, onSelect) => (
      <g className="select-none">
        {/* Vỏ nồi cắt lớp mỏng viền ngoài */}
        <path
          d="M 70 130 L 70 280 Q 200 295 330 280 L 330 130"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="6"
          strokeDasharray="4 3"
        />

        {/* Khoang cách nhiệt */}
        <path
          d="M 85 130 L 85 270 Q 200 285 315 270 L 315 130 Z"
          fill="#F8FAFC"
          stroke="#000"
          strokeWidth="1.5"
        />

        {/* Nồi nấu (Soong nhôm bên trong) */}
        <path
          d="M 105 125 L 115 230 Q 200 245 285 230 L 295 125 Z"
          fill={highlightIds.includes('noi_nau') ? '#BBF7D0' : selectedId === 'noi_nau' ? '#FEF08A' : '#CBD5E1'}
          stroke="#000000"
          strokeWidth={highlightIds.includes('noi_nau') || selectedId === 'noi_nau' ? 3.5 : 2}
          className="cursor-pointer transition-colors"
          onClick={() => onSelect('noi_nau')}
        />
        {/* Lòng soong (gạo và nước) */}
        <path
          d="M 118 190 Q 200 200 282 190 L 280 228 Q 200 242 120 228 Z"
          fill="#FEF3C7"
          stroke="#D97706"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <text x="200" y="215" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#B45309">
          Gạo & Nước
        </text>

        {/* Mâm nhiệt (Đế đúc điện trở nung đáy) */}
        <path
          d="M 115 240 Q 200 252 285 240 L 285 258 Q 200 268 115 258 Z"
          fill={highlightIds.includes('mam_nhiet') ? '#F87171' : selectedId === 'mam_nhiet' ? '#FEF08A' : '#DC2626'}
          stroke="#000000"
          strokeWidth={highlightIds.includes('mam_nhiet') || selectedId === 'mam_nhiet' ? 3.5 : 2}
          className="cursor-pointer transition-colors"
          onClick={() => onSelect('mam_nhiet')}
        />
        <text x="145" y="253" fontSize="9" fontWeight="900" fill="#FFFFFF">
          MÂM NHIỆT
        </text>

        {/* Cảm biến nhiệt (Lò xo nam châm nhiệt ở chính giữa mâm) */}
        <g
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onSelect('cam_bien_nhiet'); }}
        >
          <rect
            x="185"
            y="238"
            width="30"
            height="32"
            rx="3"
            fill={highlightIds.includes('cam_bien_nhiet') ? '#BBF7D0' : selectedId === 'cam_bien_nhiet' ? '#FEF08A' : '#F59E0B'}
            stroke="#000000"
            strokeWidth={highlightIds.includes('cam_bien_nhiet') || selectedId === 'cam_bien_nhiet' ? 3 : 2}
          />
          {/* Lò xo cảm ứng */}
          <line x1="190" y1="248" x2="210" y2="248" stroke="#000" strokeWidth="2" />
          <line x1="190" y1="256" x2="210" y2="256" stroke="#000" strokeWidth="2" />
          <line x1="190" y1="264" x2="210" y2="264" stroke="#000" strokeWidth="2" />
        </g>

        {/* Nắp mở hé trên */}
        <path
          d="M 85 110 C 85 60, 315 60, 315 110 Z"
          fill={highlightIds.includes('nap_noi') ? '#BBF7D0' : selectedId === 'nap_noi' ? '#FEF08A' : '#E2E8F0'}
          stroke="#000000"
          strokeWidth={highlightIds.includes('nap_noi') || selectedId === 'nap_noi' ? 3 : 2}
          className="cursor-pointer transition-colors"
          onClick={() => onSelect('nap_noi')}
        />
        <rect x="180" y="55" width="40" height="15" rx="4" fill="#334155" stroke="#000" strokeWidth="1.5" />

        {/* Nhãn cắt lớp */}
        <text x="200" y="30" textAnchor="middle" fontSize="12" fontWeight="900" fill="#475569">
          CẤU TẠO BÊN TRONG (CẮT LỚP)
        </text>
      </g>
    ),
  },
};
