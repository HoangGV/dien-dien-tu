import React from 'react';
import { SafetyHazard, SafetySceneDef } from './types';

export const ALL_SAFETY_HAZARDS: SafetyHazard[] = [
  // Scene 1: Phòng khách (4 hazards)
  {
    id: 'pk_overload',
    name: 'Ổ cắm cắm quá nhiều thiết bị (Quá tải)',
    sceneId: 'phong-khach',
    hotspot: { x: 310, y: 220, width: 45, height: 45, label: 'Ổ cắm quá tải' },
    nguyenNhan: 'Cắm đồng thời quá nhiều thiết bị điện công suất lớn (lò sưởi, bàn là, ấm nước) vào cùng một ổ cắm chia hoặc ổ cắm kéo dài.',
    hauQua: 'Dòng điện tổng vượt quá dòng định mức của ổ cắm và dây dẫn, làm dây nóng ran, chảy lớp vỏ cách điện và gây cháy nổ hỏa hoạn.',
    phongTranh: 'Phân chia tải cắm sang các ổ cắm riêng biệt; chọn aptomat (MCB) đúng công suất định mức để tự động ngắt khi quá tải.',
    simulationPresetId: 'hh_j',
    simulationTitle: 'Mô phỏng Quá tải mạng điện dân dụng (Preset j)',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'pk_exposed_wire',
    name: 'Dây điện bị tróc hở vỏ cách điện',
    sceneId: 'phong-khach',
    hotspot: { x: 230, y: 240, width: 45, height: 35, label: 'Dây hở cách điện' },
    nguyenNhan: 'Dây dẫn điện bị chuột gặm nhấm, vật nặng đè lên cọ xát lâu ngày hoặc bị lão hóa giòn gãy làm lộ ruột đồng dẫn điện.',
    hauQua: 'Người vô tình chạm phải ruột đồng bị điện giật nguy hiểm; nếu hai lõi dây chạm nhau sẽ gây ngắn mạch phát nổ tóe lửa bốc cháy.',
    phongTranh: 'Ngắt nguồn điện ngay lập tức; dùng băng keo cách điện chuyên dụng quấn kín nhiều lớp hoặc thay thế đoạn dây mới an toàn.',
    simulationPresetId: 'hh_k',
    simulationTitle: 'Mô phỏng Chập mạch ngắn mạch (Preset k)',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'pk_casing_leak',
    name: 'Vỏ thiết bị kim loại rò điện không nối đất',
    sceneId: 'phong-khach',
    hotspot: { x: 90, y: 150, width: 55, height: 75, label: 'Vỏ kim loại rò điện' },
    nguyenNhan: 'Lớp cách điện bên trong thiết bị (quạt điện, máy sưởi) bị ẩm ướt hoặc hỏng, khiến dây pha chạm vào vỏ kim loại nhưng không có dây tiếp đất PE.',
    hauQua: 'Vỏ thiết bị mang điện áp 220 V. Khi con người chạm tay vào vỏ kim loại, dòng điện nguy hiểm sẽ truyền qua cơ thể xuống đất gây giật co giật tử vong.',
    phongTranh: 'Luôn nối vỏ kim loại của thiết bị với hệ thống dây tiếp đất PE; lắp aptomat chống dòng rò (ELCB) để bảo vệ con người.',
    simulationPresetId: 'hh_c',
    simulationTitle: 'Mô phỏng Sự cố rò điện vỏ kim loại không tiếp địa (Preset c)',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'pk_no_cover_socket',
    name: 'Ổ cắm điện không có nắp che trong tầm với trẻ em',
    sceneId: 'phong-khach',
    hotspot: { x: 190, y: 220, width: 35, height: 35, label: 'Ổ cắm thấp hở lỗ' },
    nguyenNhan: 'Ổ cắm điện gắn tường ở vị trí quá thấp (dưới 1,2 m) nhưng không có nắp che an toàn hoặc không cắm nút bịt bảo vệ.',
    hauQua: 'Trẻ nhỏ hiếu động có thể chọc que sắt, chìa khóa, que kim loại hoặc ngón tay vào lỗ ổ cắm dẫn đến tai nạn điện giật thương tâm.',
    phongTranh: 'Lắp ổ cắm trên cao (> 1,4 m); sử dụng ổ cắm có màn che tự đóng hoặc dùng nút bịt ổ cắm chuyên dụng để ngăn chặn trẻ nhỏ tiếp cận.',
    reviewStatus: 'cần GV đối chiếu',
  },

  // Scene 2: Bếp và phòng tắm (4 hazards)
  {
    id: 'bpt_wet_hands',
    name: 'Dùng tay ướt cắm / rút phích cắm điện',
    sceneId: 'bep-phong-tam',
    hotspot: { x: 80, y: 140, width: 45, height: 45, label: 'Tay ướt cắm điện' },
    nguyenNhan: 'Vừa rửa tay, tắm giặt xong khi tay còn đẫm nước đã vội vàng cắm hoặc rút phích cắm điện vào ổ điện.',
    hauQua: 'Nước làm giảm điện trở tiếp xúc của da xuống hàng chục lần và dẫn điện trực tiếp từ chân phích cắm vào người gây điện giật cấp tính.',
    phongTranh: 'Luôn lau khô tay bằng khăn sạch trước khi chạm vào phích cắm, công tắc hoặc bất kì thiết bị điện nào.',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'bpt_outlet_near_sink',
    name: 'Ổ cắm đặt sát vòi nước / bồn rửa',
    sceneId: 'bep-phong-tam',
    hotspot: { x: 175, y: 155, width: 40, height: 40, label: 'Ổ cắm sát vòi nước' },
    nguyenNhan: 'Ổ cắm gắn quá gần mép bồn rửa bát hoặc bồn rửa mặt mà không có hộp chụp chống tia nước văng (chỉ số chống nước IP).',
    hauQua: 'Nước rửa bắn tung tóe chui vào lỗ ổ cắm gây chập điện nổ ổ cắm, hoặc truyền điện ra toàn bộ khu vực bồn nước ướt.',
    phongTranh: 'Lắp ổ cắm cách xa mép vòi nước tối thiểu 60 cm; trang bị nắp chụp đậy kín chống nước văng chuyên dụng cho nhà tắm và bếp.',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'bpt_water_heater_no_elcb',
    name: 'Bình nước nóng tắm không có aptomat chống rò',
    sceneId: 'bep-phong-tam',
    hotspot: { x: 290, y: 65, width: 65, height: 60, label: 'Bình nóng lạnh rò điện' },
    nguyenNhan: 'Bình nóng lạnh bị thủng thanh đốt rò điện ra dòng nước tắm nhưng không được gắn aptomat chống rò ELCB (hoặc ELCB bị đấu tắt).',
    hauQua: 'Dòng điện 220 V truyền theo dòng nước chảy khắp cơ thể người đang tắm ướt sũng, nguy cơ tử vong gần như 100% nếu không ngắt điện kịp thời.',
    phongTranh: 'Bắt buộc lắp aptomat chống rò ELCB/RCBO 30 mA ngay đầu nguồn bình nóng lạnh; tắt aptomat bình trước khi bước vào tắm.',
    simulationPresetId: 'hh_o',
    simulationTitle: 'Mô phỏng Bảo vệ rò điện bằng Aptomat ELCB (Preset o)',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'bpt_pinched_cord',
    name: 'Dây nguồn bị kẹp dập hoặc gập gãy',
    sceneId: 'bep-phong-tam',
    hotspot: { x: 215, y: 245, width: 45, height: 35, label: 'Dây bị kẹp cửa tủ' },
    nguyenNhan: 'Dây dẫn điện của nồi cơm/bếp từ bị cánh cửa tủ bếp kẹp dập nát nhiều lần hoặc bị gập góc nhọn 90° liên tục.',
    hauQua: 'Lõi đồng bên trong bị đứt sợi cục bộ làm nóng cục bộ gây bốc khói cháy nẹp, hoặc hai dây chập vào nhau phát nổ ngắn mạch.',
    phongTranh: 'Đi dây điện thẳng thớm, tránh để dây bị chèn ép dưới chân bàn, mép cửa; thay dây mới ngay khi thấy dấu hiệu bẹp dập.',
    reviewStatus: 'cần GV đối chiếu',
  },

  // Scene 3: Ngoài trời (4 hazards)
  {
    id: 'nt_kite_flying',
    name: 'Thả diều gần đường dây điện trên cao',
    sceneId: 'ngoai-troi',
    hotspot: { x: 70, y: 60, width: 55, height: 50, label: 'Thả diều gần dây điện' },
    nguyenNhan: 'Thả diều, bóng bay tráng kim loại ở khu vực gần đường dây điện cao thế hoặc trung thế trần đi qua cánh đồng/khu dân cư.',
    hauQua: 'Diều mắc vào đường dây gây phóng điện hồ quang làm đứt dây điện, dòng điện cao thế truyền theo dây diều ẩm giật chết người thả diều.',
    phongTranh: 'Tuyệt đối không thả diều gần hành lang bảo vệ đường dây điện; chỉ thả diều ở bãi đất trống, công viên cách xa lưới điện tối thiểu 100 m.',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'nt_broken_wire',
    name: 'Dây điện bị đứt rơi xuống mặt đường',
    sceneId: 'ngoai-troi',
    hotspot: { x: 200, y: 230, width: 60, height: 40, label: 'Dây đứt rơi xuống đất' },
    nguyenNhan: 'Cây ngã đổ trong giông bão đè đứt đường dây điện làm đầu dây còn mang điện rơi lòng thòng xuống mặt đường hoặc vũng nước.',
    hauQua: 'Tạo vùng điện trường nguy hiểm (điện áp bước) quanh điểm rơi; người đi bộ hoặc xe máy lại gần trong bán kính 10 m bị điện giật ngã gục.',
    phongTranh: 'Giữ khoảng cách an toàn tối thiểu 10 mét; hô hoán cảnh báo người xung quanh và gọi ngay điện lực qua số 1900 khẩn cấp.',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'nt_under_tree_rain',
    name: 'Đứng trú mưa dưới gốc cây gần đường dây điện',
    sceneId: 'ngoai-troi',
    hotspot: { x: 290, y: 140, width: 60, height: 70, label: 'Trú mưa gốc cây to' },
    nguyenNhan: 'Trời mưa giông to đứng nép dưới gốc cây cổ thụ to nằm ngay cạnh đường dây tải điện trên cao.',
    hauQua: 'Sét đánh trúng ngọn cây truyền dòng điện cực lớn xuống đất, hoặc cành cây ướt nghiêng chạm vào dây điện truyền điện giật người bên dưới.',
    phongTranh: 'Không bao giờ trú mưa dưới gốc cây to, cột điện hoặc hàng rào kim loại; nhanh chóng tìm nhà kiên cố có mái che kín để trú ngụ.',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'nt_fishing_rod',
    name: 'Dùng cần câu kim loại / carbon gần đường dây điện',
    sceneId: 'ngoai-troi',
    hotspot: { x: 130, y: 160, width: 55, height: 50, label: 'Cần câu vung sát dây' },
    nguyenNhan: 'Cầm cần câu cá bằng sợi carbon hoặc kim loại vung cần câu cá ở hồ, kênh rạch nằm dưới hoặc sát hành lang đường dây điện cao thế.',
    hauQua: 'Điện cao thế có thể phóng điện qua không khí dù cần câu chưa chạm vào dây; dòng điện phóng qua cần câu gây bỏng nặng và tử vong tại chỗ.',
    phongTranh: 'Luôn quan sát không gian phía trên trước khi vung cần câu; cấm câu cá ở tất cả các khu vực có đường dây điện chạy qua.',
    reviewStatus: 'cần GV đối chiếu',
  },
];

// Helper to render interactive hotspot ring & click trigger
function renderHotspotCircle(
  hazard: SafetyHazard,
  selectedHazardId: string | null,
  discoveredHazardIds: string[],
  hintHazardId: string | null,
  onSelectHazard: (id: string) => void
) {
  const isSelected = selectedHazardId === hazard.id;
  const isDiscovered = discoveredHazardIds.includes(hazard.id);
  const isHint = hintHazardId === hazard.id;

  const { x, y, width, height } = hazard.hotspot;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const r = Math.max(width, height) / 2 + 3;

  return (
    <g
      key={hazard.id}
      className="cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onSelectHazard(hazard.id);
      }}
    >
      {/* Outer pulsing ring for hint */}
      {isHint && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 8}
          fill="none"
          stroke="#EF4444"
          strokeWidth="3"
          strokeDasharray="4 3"
          className="animate-ping origin-center"
        />
      )}

      {/* Hotspot bounding boundary */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="4"
        fill={isSelected ? '#FDE047' : isDiscovered ? '#DCFCE7' : '#FEF3C7'}
        fillOpacity={isSelected ? 0.7 : 0.4}
        stroke={isSelected ? '#2563EB' : isDiscovered ? '#16A34A' : isHint ? '#DC2626' : '#D97706'}
        strokeWidth={isSelected || isHint ? 3 : 2}
        strokeDasharray={isDiscovered ? 'none' : '3 2'}
        className="transition-all hover:fill-opacity-80"
      />

      {/* Hazard badge icon */}
      <circle
        cx={cx}
        cy={cy}
        r="11"
        fill={isSelected ? '#2563EB' : isDiscovered ? '#16A34A' : '#DC2626'}
        stroke="#000000"
        strokeWidth="1.5"
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fill="#FFFFFF"
        pointerEvents="none"
      >
        {isDiscovered ? '✓' : '!'}
      </text>
    </g>
  );
}

export const SAFETY_SCENES: SafetySceneDef[] = [
  // 1. PHÒNG KHÁCH
  {
    id: 'phong-khach',
    name: 'Phòng khách gia đình',
    description: 'Quan sát các thiết bị điện trong phòng khách: ổ cắm điện, dây nối, quạt sưởi vỏ kim loại và khu vực sinh hoạt của trẻ nhỏ.',
    reviewStatus: 'cần GV đối chiếu',
    renderSVG: (hazards, selectedHazardId, discoveredHazardIds, hintHazardId, onSelectHazard) => {
      const sceneHazards = hazards.filter((h) => h.sceneId === 'phong-khach');
      return (
        <svg viewBox="0 0 400 300" className="w-full h-auto select-none">
          {/* Background wall & floor */}
          <rect x="0" y="0" width="400" height="210" fill="#F8FAFC" stroke="#000000" strokeWidth="2" />
          <line x1="0" y1="210" x2="400" y2="210" stroke="#000000" strokeWidth="2.5" />
          <rect x="0" y="210" width="400" height="90" fill="#F1F5F9" />

          {/* Window */}
          <rect x="30" y="30" width="90" height="70" fill="#E0F2FE" stroke="#000" strokeWidth="2" />
          <line x1="75" y1="30" x2="75" y2="100" stroke="#000" strokeWidth="1.5" />
          <line x1="30" y1="65" x2="120" y2="65" stroke="#000" strokeWidth="1.5" />

          {/* Picture frame */}
          <rect x="250" y="35" width="60" height="40" fill="#FEF3C7" stroke="#000" strokeWidth="2" />
          <circle cx="280" cy="55" r="8" fill="#F59E0B" />

          {/* Sofa */}
          <rect x="150" y="110" width="130" height="70" rx="8" fill="#93C5FD" stroke="#000" strokeWidth="2" />
          <rect x="160" y="140" width="110" height="40" rx="4" fill="#60A5FA" stroke="#000" strokeWidth="1.5" />

          {/* Metallic Fan / Heater on floor (pk_casing_leak) */}
          <g>
            <circle cx="115" cy="170" r="22" fill="#E2E8F0" stroke="#000" strokeWidth="2" />
            <line x1="115" y1="148" x2="115" y2="192" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="93" y1="170" x2="137" y2="170" stroke="#94A3B8" strokeWidth="1.5" />
            <rect x="110" y="192" width="10" height="25" fill="#64748B" stroke="#000" strokeWidth="1.5" />
            <ellipse cx="115" cy="220" rx="20" ry="6" fill="#334155" stroke="#000" strokeWidth="1.5" />
          </g>

          {/* Low Wall Outlet without cover (pk_no_cover_socket) */}
          <g>
            <rect x="195" y="222" width="25" height="30" rx="2" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
            <circle cx="203" cy="235" r="2" fill="#000" />
            <circle cx="213" cy="235" r="2" fill="#000" />
          </g>

          {/* Exposed Cord on floor (pk_exposed_wire) */}
          <path
            d="M 115 220 C 140 240, 180 255, 235 250 C 265 245, 290 240, 315 240"
            fill="none"
            stroke="#000000"
            strokeWidth="3.5"
          />
          {/* Copper spark highlight */}
          <path d="M 245 248 L 255 249" stroke="#EA580C" strokeWidth="5" />
          <line x1="250" y1="243" x2="250" y2="238" stroke="#EF4444" strokeWidth="2" />

          {/* Overloaded Power Strip (pk_overload) */}
          <g>
            <rect x="315" y="225" width="38" height="36" rx="4" fill="#F87171" stroke="#000" strokeWidth="2" />
            <rect x="320" y="230" width="8" height="6" fill="#1E293B" />
            <rect x="335" y="230" width="8" height="6" fill="#1E293B" />
            <rect x="320" y="245" width="8" height="6" fill="#1E293B" />
            <rect x="335" y="245" width="8" height="6" fill="#1E293B" />
            {/* multiple cords plugged in */}
            <line x1="324" y1="230" x2="310" y2="215" stroke="#000" strokeWidth="2" />
            <line x1="339" y1="230" x2="350" y2="215" stroke="#000" strokeWidth="2" />
            <line x1="324" y1="251" x2="310" y2="270" stroke="#000" strokeWidth="2" />
            <line x1="339" y1="251" x2="355" y2="270" stroke="#000" strokeWidth="2" />
          </g>

          {/* Render 4 Interactive Hazard Hotspots */}
          {sceneHazards.map((h) =>
            renderHotspotCircle(h, selectedHazardId, discoveredHazardIds, hintHazardId, onSelectHazard)
          )}
        </svg>
      );
    },
  },

  // 2. BẾP VÀ PHÒNG TẮM
  {
    id: 'bep-phong-tam',
    name: 'Khu vực Bếp & Phòng tắm',
    description: 'Khu vực có độ ẩm cao và tiếp xúc thường xuyên với nguồn nước: bồn rửa, vòi nước, bình tắm nước nóng và phích cắm điện.',
    reviewStatus: 'cần GV đối chiếu',
    renderSVG: (hazards, selectedHazardId, discoveredHazardIds, hintHazardId, onSelectHazard) => {
      const sceneHazards = hazards.filter((h) => h.sceneId === 'bep-phong-tam');
      return (
        <svg viewBox="0 0 400 300" className="w-full h-auto select-none">
          {/* Tiles wall */}
          <rect x="0" y="0" width="400" height="200" fill="#F0FDFA" stroke="#000" strokeWidth="2" />
          <line x1="0" y1="200" x2="400" y2="200" stroke="#000" strokeWidth="2.5" />
          <rect x="0" y="200" width="400" height="100" fill="#E2E8F0" />

          {/* Kitchen counter with cabinet door */}
          <rect x="20" y="170" width="220" height="90" fill="#CBD5E1" stroke="#000" strokeWidth="2" />
          {/* Cabinet door line (bpt_pinched_cord) */}
          <rect x="30" y="195" width="90" height="60" fill="#E2E8F0" stroke="#000" strokeWidth="1.5" />
          <rect x="135" y="195" width="90" height="60" fill="#E2E8F0" stroke="#000" strokeWidth="1.5" />

          {/* Sink and Faucet (bpt_outlet_near_sink) */}
          <rect x="130" y="165" width="90" height="15" rx="3" fill="#94A3B8" stroke="#000" strokeWidth="1.5" />
          {/* Faucet pipe */}
          <path d="M 155 165 L 155 135 Q 155 125 165 125 L 175 125 L 175 140" fill="none" stroke="#475569" strokeWidth="4" />
          {/* Water drips */}
          <line x1="175" y1="145" x2="175" y2="160" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 2" />

          {/* Outlet placed directly beside faucet */}
          <rect x="185" y="160" width="22" height="25" rx="2" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
          <circle cx="192" cy="172" r="2" fill="#000" />
          <circle cx="200" cy="172" r="2" fill="#000" />

          {/* Pinched cord under cabinet door */}
          <path d="M 235 170 L 235 220 L 225 250 L 250 280" fill="none" stroke="#000" strokeWidth="3" />
          <line x1="220" y1="245" x2="230" y2="255" stroke="#EF4444" strokeWidth="2.5" />

          {/* Wet Hands Plugging in (bpt_wet_hands) */}
          <g>
            <rect x="85" y="145" width="22" height="25" rx="2" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
            <circle cx="92" cy="157" r="2" fill="#000" />
            <circle cx="100" cy="157" r="2" fill="#000" />
            {/* Hand with water drops */}
            <path d="M 60 170 C 70 155, 80 155, 90 155" fill="none" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
            <circle cx="75" cy="165" r="2" fill="#38BDF8" />
            <circle cx="85" cy="168" r="2" fill="#38BDF8" />
          </g>

          {/* Electric Water Heater on Wall (bpt_water_heater_no_elcb) */}
          <g>
            <rect x="290" y="55" width="65" height="75" rx="10" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
            <rect x="305" y="70" width="35" height="15" rx="2" fill="#F87171" stroke="#000" strokeWidth="1" />
            <circle cx="322" cy="77" r="4" fill="#EF4444" />
            {/* Pipes down to shower */}
            <line x1="305" y1="130" x2="305" y2="170" stroke="#38BDF8" strokeWidth="3" />
            <line x1="340" y1="130" x2="340" y2="170" stroke="#EF4444" strokeWidth="3" />
            {/* Shower head */}
            <path d="M 340 170 Q 360 170 365 185" fill="none" stroke="#64748B" strokeWidth="3" />
            <ellipse cx="365" cy="190" rx="12" ry="5" fill="#94A3B8" stroke="#000" strokeWidth="1" />
            {/* Shower water spray */}
            <line x1="360" y1="195" x2="355" y2="230" stroke="#38BDF8" strokeDasharray="3 2" />
            <line x1="365" y1="195" x2="365" y2="235" stroke="#38BDF8" strokeDasharray="3 2" />
            <line x1="370" y1="195" x2="375" y2="230" stroke="#38BDF8" strokeDasharray="3 2" />
          </g>

          {/* Render 4 Interactive Hazard Hotspots */}
          {sceneHazards.map((h) =>
            renderHotspotCircle(h, selectedHazardId, discoveredHazardIds, hintHazardId, onSelectHazard)
          )}
        </svg>
      );
    },
  },

  // 3. NGOÀI TRỜI
  {
    id: 'ngoai-troi',
    name: 'Môi trường Ngoài trời & Lưới điện',
    description: 'Quan sát hành lang an toàn lưới điện cao thế/trung thế trên cao, cây cối, thời tiết mưa bão và hoạt động vui chơi giải trí.',
    reviewStatus: 'cần GV đối chiếu',
    renderSVG: (hazards, selectedHazardId, discoveredHazardIds, hintHazardId, onSelectHazard) => {
      const sceneHazards = hazards.filter((h) => h.sceneId === 'ngoai-troi');
      return (
        <svg viewBox="0 0 400 300" className="w-full h-auto select-none">
          {/* Sky background with rainy cloud */}
          <rect x="0" y="0" width="400" height="220" fill="#E0F2FE" stroke="#000" strokeWidth="2" />
          <line x1="0" y1="220" x2="400" y2="220" stroke="#000" strokeWidth="2.5" />
          <rect x="0" y="220" width="400" height="80" fill="#BBF7D0" />
          {/* Road / Pond */}
          <path d="M 80 220 L 140 300 L 270 300 L 220 220 Z" fill="#94A3B8" stroke="#000" strokeWidth="1.5" />

          {/* Rain Cloud */}
          <path
            d="M 230 40 C 230 25, 260 20, 275 30 C 290 20, 320 25, 320 40 C 330 45, 330 65, 315 70 L 240 70 C 220 70, 220 45, 230 40 Z"
            fill="#64748B"
            stroke="#000"
            strokeWidth="1.5"
          />
          {/* Rain lines */}
          <line x1="250" y1="75" x2="245" y2="95" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="280" y1="75" x2="275" y2="95" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="310" y1="75" x2="305" y2="95" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />

          {/* Electric Utility Pole */}
          <g>
            <line x1="160" y1="30" x2="160" y2="240" stroke="#000" strokeWidth="5" />
            <line x1="120" y1="50" x2="200" y2="50" stroke="#000" strokeWidth="3" />
            <circle cx="130" cy="50" r="4" fill="#3B82F6" stroke="#000" />
            <circle cx="160" cy="50" r="4" fill="#3B82F6" stroke="#000" />
            <circle cx="190" cy="50" r="4" fill="#3B82F6" stroke="#000" />
          </g>

          {/* High voltage power lines overhead */}
          <line x1="0" y1="40" x2="130" y2="50" stroke="#000" strokeWidth="2" />
          <line x1="190" y1="50" x2="400" y2="40" stroke="#000" strokeWidth="2" />
          <line x1="0" y1="60" x2="130" y2="50" stroke="#000" strokeWidth="2" />
          <line x1="190" y1="50" x2="400" y2="60" stroke="#000" strokeWidth="2" />

          {/* Flying Kite entangled in lines (nt_kite_flying) */}
          <g>
            {/* Diamond kite */}
            <polygon points="95,45 110,65 95,85 80,65" fill="#EF4444" stroke="#000" strokeWidth="1.5" />
            <line x1="95" y1="45" x2="95" y2="85" stroke="#000" strokeWidth="1" />
            <line x1="80" y1="65" x2="110" y2="65" stroke="#000" strokeWidth="1" />
            {/* String to ground */}
            <path d="M 95 85 Q 70 120 50 180" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 2" />
          </g>

          {/* Broken Wire on Ground (nt_broken_wire) */}
          <g>
            <path d="M 160 50 Q 210 120 225 240 Q 235 255 210 260" fill="none" stroke="#000" strokeWidth="3" />
            {/* Spark & Puddle */}
            <ellipse cx="230" cy="255" rx="22" ry="8" fill="#38BDF8" fillOpacity="0.5" stroke="#0284C7" strokeWidth="1" />
            <circle cx="215" cy="250" r="3" fill="#EF4444" />
          </g>

          {/* Large Tree near lines (nt_under_tree_rain) */}
          <g>
            {/* Trunk */}
            <rect x="310" y="140" width="20" height="90" fill="#78350F" stroke="#000" strokeWidth="2" />
            {/* Foliage touching wire */}
            <circle cx="320" cy="115" r="45" fill="#15803D" stroke="#000" strokeWidth="2" />
            {/* Person standing under tree */}
            <circle cx="305" cy="190" r="6" fill="#FBBF24" stroke="#000" strokeWidth="1.5" />
            <line x1="305" y1="196" x2="305" y2="215" stroke="#000" strokeWidth="2" />
          </g>

          {/* Person with Metal Fishing Rod (nt_fishing_rod) */}
          <g>
            <circle cx="155" cy="190" r="6" fill="#FBBF24" stroke="#000" strokeWidth="1.5" />
            <line x1="155" y1="196" x2="155" y2="225" stroke="#000" strokeWidth="2" />
            {/* Long metal pole held high near wires */}
            <line x1="152" y1="205" x2="140" y2="70" stroke="#64748B" strokeWidth="2.5" />
            <circle cx="140" cy="70" r="3" fill="#EF4444" />
          </g>

          {/* Render 4 Interactive Hazard Hotspots */}
          {sceneHazards.map((h) =>
            renderHotspotCircle(h, selectedHazardId, discoveredHazardIds, hintHazardId, onSelectHazard)
          )}
        </svg>
      );
    },
  },
];
