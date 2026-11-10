/**
 * Workspace Registry & Configurations
 */

import { WorkspaceConfig } from './model';
import { HOUSEHOLD_PRESETS, ELECTRONICS_PRESETS, SENSOR_PRESETS, DIGITAL_LOGIC_PRESETS } from './presets';

export const WORKSPACE_HOUSEHOLD: WorkspaceConfig = {
  slug: 'mang-dien-trong-nha',
  title: 'Mạng điện trong nhà',
  grades: 'Lớp 8, 9, 12',
  description: 'Mô phỏng mạng điện dân dụng 220 V (RMS): nguồn điện nét chấm mảnh (A, O), aptomat MCB 2P/3P, aptomat hộp CB, cầu chì, công tắc 2 cực, công tắc 3 cực cầu thang, bóng đèn, đèn huỳnh quang, quạt trần, chuông điện, ổ cắm, công tơ kWh, dụng cụ đo A/V/W/Ω theo chuẩn TCVN và SGK GDPT 2018.',
  mode: 'rms',
  paletteIds: [
    'ac_source',
    'knife_switch',
    'cb',
    'fuse',
    'switch_2p',
    'switch_3p',
    'lamp',
    'lamp_fluorescent',
    'ceiling_fan',
    'electric_bell',
    'socket',
    'earth_ground',
    'kwh_meter',
    'appliance_generic',
    'ammeter',
    'voltmeter',
    'wattmeter',
    'ohmmeter',
    'boundary',
    'textbox',
  ],
  presets: HOUSEHOLD_PRESETS,
  helpText: `HƯỚNG DẪN MẠNG ĐIỆN DÂN DỤNG (TCVN & CHƯƠNG TRÌNH GDPT 2018):
• Kí hiệu quy chuẩn SGK:
  - Nguồn điện xoay chiều: Đặt trong khung hộp nét chấm mảnh, gồm 2 điểm A (pha) và O (trung tính).
  - Aptomat (MCB 2P, 3P): 2 đường line xiên từ circle phía (1) và (2) xiên lên circle phía (1') và (2'), có mũi tên ngang xuyên qua các lưỡi dao.
  - Aptomat dạng hộp (CB): Khung hộp chữ nhật có tiếp điểm ngang và mũi tên liên động cơ khí thẳng đứng.
  - Cầu chì: Hình chữ nhật dài có đường nét xuyên dọc giữa (1, 2, 3 cực).
  - Đèn chiếu sáng: Vòng tròn có dấu ×; Đèn huỳnh quang: Hình chữ nhật bo tròn có dấu × ở giữa.
  - Quạt trần: Hình cánh quạt 2 tam giác đối đỉnh có tâm tròn (2 chân A, O).
  - Chuông điện: Vòm chuông úp, đáy phẳng.`,
  defaultSpecs: {
    voltage: 220,
    frequency: 50,
  },
  installView: true,
};

export const WORKSPACE_ELECTRONICS: WorkspaceConfig = {
  slug: 'mach-dien-tu-co-ban',
  title: 'Mạch điện tử cơ bản',
  grades: 'Lớp 9, 12',
  description: 'Mô phỏng mạch điện tử một chiều (DC): nguồn pin/DC, điện trở TCVN chữ nhật, biến trở, tụ điện không phân cực, tụ hóa có cực, diode, LED thống nhất chọn 6 màu phát quang, transistor BJT NPN/PNP, nút nhấn nhả, dụng cụ đo.',
  mode: 'dc',
  paletteIds: [
    'vcc',
    'dc_source',
    'ac_source',
    'gnd',
    'resistor',
    'potentiometer',
    'capacitor_ceramic',
    'capacitor_electrolytic',
    'diode',
    'led',
    'transistor_npn',
    'transistor_pnp',
    'switch_2p',
    'push_button',
    'ammeter',
    'voltmeter',
    'ohmmeter',
    'oscilloscope',
    'boundary',
    'textbox',
  ],
  presets: ELECTRONICS_PRESETS,
  helpText: `HƯỚNG DẪN MẠNG ĐIỆN TỬ CƠ BẢN (GDPT 2018):
• Nguồn một chiều (DC): Pin / Acquy / Nguồn tổ ong (1.5 V – 24 V).
• Định luật Ohm: I = U / R. Điện trở vẽ hình chữ nhật rỗng chuẩn TCVN/IEC.
• LED (Điot phát quang): Kí hiệu tam giác tiếp giáp vạch thẳng kèm 2 mũi tên phát xạ ra ngoài. Màu phát quang chọn linh hoạt trong bảng Thuộc tính.
• Tụ điện phân cực: Cực dương (+) phải nối về phía điện thế cao hơn.
• Transistor BJT (NPN/PNP): Dùng dòng điều khiển cực B (Ib) để đóng cắt hoặc khuếch đại dòng cực C (Ic = β · Ib).`,
  defaultSpecs: {
    voltage: 9,
  },
};

export const WORKSPACE_TEST: WorkspaceConfig = {
  slug: '_thu',
  title: 'Khung vẽ thử nghiệm ca kiểm tra',
  grades: 'Tất cả khối lớp',
  description: 'Khung vẽ chuyên dụng để xem và kiểm tra trực quan các ca thử nghiệm bộ giải C-1/PE. Dữ liệu lưu trong sessionStorage, không làm ảnh hưởng hay ghi đè mạch chính của bạn.',
  mode: 'rms',
  paletteIds: [
    'ac_source',
    'dc_source',
    'gnd',
    'vcc',
    'knife_switch',
    'cb',
    'fuse',
    'switch_2p',
    'switch_3p',
    'lamp',
    'lamp_fluorescent',
    'ceiling_fan',
    'resistor',
    'led',
    'capacitor_ceramic',
    'capacitor_electrolytic',
    'earth_ground',
    'appliance_generic',
    'ammeter',
    'voltmeter',
    'boundary',
    'textbox',
  ],
  presets: [],
  helpText: 'Khung vẽ chuyên dụng để xem và kiểm tra trực quan các ca thử nghiệm bộ giải C-1/PE. Dữ liệu lưu trong sessionStorage, không làm ảnh hưởng hay ghi đè mạch chính của bạn.',
  defaultSpecs: {
    voltage: 220,
    frequency: 50,
  },
};

export const WORKSPACE_SENSOR_CONTROL: WorkspaceConfig = {
  slug: 'mach-dieu-khien-cam-bien',
  title: 'Mạch điều khiển cảm biến',
  grades: 'Lớp 8, 9, 10',
  description: 'Mô phỏng mạch điều khiển tự động sử dụng mô-đun cảm biến (ánh sáng, nhiệt độ, độ ẩm) và mô-đun rơ le đóng ngắt tải điện một chiều (DC 5 V).',
  mode: 'dc',
  paletteIds: [
    'dc_source',
    'gnd',
    'switch_2p',
    'push_button',
    'resistor',
    'led',
    'lamp_dc',
    'electric_bell',
    'ammeter',
    'voltmeter',
    'ohmmeter',
    'oscilloscope',
    'sensor_module',
    'relay_module_1ch',
    'time_relay',
    'boundary',
    'textbox',
  ],
  presets: SENSOR_PRESETS,
  helpText: `HƯỚNG DẪN MẠCH ĐIỀU KHIỂN CẢM BIẾN (LỚP 8, 9, 10):
• Mô-đun cảm biến: Cấp nguồn VCC (3–5 V) và GND.
  - Chân DO (Digital Output): Mức logic CAO (xấp xỉ VCC qua trở 100 Ω) hoặc THẤP (xấp xỉ 0 V).
  - Chân AO (Analog Output): Điện áp tỉ lệ tuyến tính theo giá trị môi trường.
  - Ngưỡng tác động và chế độ (khi < ngưỡng hoặc > ngưỡng) chỉnh linh hoạt trong panel Thuộc tính.
• Mô-đun rơ le 1 kênh: Kích mức cao.
  - Hút khi VCC ≥ 3.5 V và chân IN ≥ 0.6·VCC; Nhả khi IN ≤ 0.3·VCC.
  - Tiếp điểm cách ly: COM nối NO khi hút, nối NC khi nhả.`,
  defaultSpecs: {
    voltage: 5,
  },
};

export const WORKSPACE_DIGITAL_LOGIC: WorkspaceConfig = {
  slug: 'dien-tu-so',
  title: 'Điện tử số',
  grades: 'Lớp 12',
  description: 'Mô phỏng mạch điện tử số: cổng logic cơ bản (AND, OR, NOT, NAND, NOR, XOR, XNOR), mạch dãy (Flip-flop D/JK/T, bộ đếm, thanh ghi dịch), máy phát xung, LED 7 đoạn, tự sinh bảng chân trị.',
  mode: 'logic',
  paletteIds: [
    'logic_switch',
    'logic_push_button',
    'logic_high',
    'logic_low',
    'logic_gate',
    'logic_flip_flop',
    'logic_clock',
    'logic_7segment',
    'logic_led',
    'boundary',
    'textbox',
  ],
  presets: DIGITAL_LOGIC_PRESETS,
  helpText: `HƯỚNG DẪN ĐIỆN TỬ SỐ & MẠCH TỔ HỢP - MẠCH DÃY (LỚP 12):
• Cổng logic cơ bản: AND, OR, NOT, NAND, NOR, XOR, XNOR.
• Mạch dãy & Flip-Flop:
  - D: Chốt dữ liệu ngõ vào D tại cạnh kích.
  - T: Đảo trạng thái Q khi T = 1 tại cạnh kích (chia đôi tần số).
  - JK: Đa năng (00 giữ, 01 về 0, 10 lên 1, 11 đảo).
  - Chân CLR: Mức 0 xóa Q về 0 tức thời.
• Máy phát xung: Tần số 0,5–10 Hz (bật Chạy để phát xung).
• LED 7 đoạn BCD: Hiển thị 0–9 từ 4 ngõ vào D0..D3.
• Bảng chân trị tự sinh: Bấm nút [BẢNG CHÂN TRỊ] trên thanh trên.`,
};

export const WORKSPACE_REGISTRY: WorkspaceConfig[] = [
  WORKSPACE_HOUSEHOLD,
  WORKSPACE_ELECTRONICS,
  WORKSPACE_SENSOR_CONTROL,
  WORKSPACE_DIGITAL_LOGIC,
  WORKSPACE_TEST,
];

export function getAllWorkspaces(): WorkspaceConfig[] {
  return WORKSPACE_REGISTRY.filter(w => w.slug !== '_thu');
}

export function getWorkspaceBySlug(slug: string): WorkspaceConfig | undefined {
  if (slug === '_thu') return WORKSPACE_TEST;
  return WORKSPACE_REGISTRY.find(w => w.slug === slug);
}

