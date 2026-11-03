/**
 * Workspace Registry & Configurations
 */

import { WorkspaceConfig } from './model';

export const WORKSPACE_HOUSEHOLD: WorkspaceConfig = {
  slug: 'mang-dien-trong-nha',
  title: 'Mạng điện trong nhà',
  grades: 'Lớp 8, 9, 12',
  description: 'Mô phỏng mạng điện dân dụng 220 V (RMS): nguồn điện pha A - trung tính O, aptomat CB 1/2/3 cực, cầu dao, cầu chì, công tắc 2 cực, công tắc 3 cực cầu thang, bóng đèn, đèn huỳnh quang, quạt trần, chuông điện, ổ cắm, công tơ kWh, dụng cụ đo A/V/W/Ω theo chuẩn TCVN và SGK GDPT 2018.',
  mode: 'rms',
  paletteIds: [
    'ac_source',
    'cb',
    'knife_switch',
    'fuse',
    'switch_2p',
    'switch_3p',
    'lamp',
    'lamp_fluorescent',
    'ceiling_fan',
    'electric_bell',
    'socket',
    'kwh_meter',
    'appliance_generic',
    'ammeter',
    'voltmeter',
    'wattmeter',
    'ohmmeter',
  ],
  presets: [],
  helpText: `HƯỚNG DẪN MẠNG ĐIỆN DÂN DỤNG (TCVN & CHƯƠNG TRÌNH GDPT 2018):
• Kí hiệu quy chuẩn SGK:
  - Nguồn điện xoay chiều: Dây pha A (đỏ) và Dây trung tính O (xanh dương).
  - Dây nối đất bảo vệ PE: Màu vàng - xanh lá.
  - Aptomat (MCB 1P, 2P, 3P): Kí hiệu tiếp điểm nghiêng kèm dấu × bảo vệ quá dòng.
  - Cầu chì: Hình chữ nhật dài có đường nét xuyên dọc giữa.
  - Cầu dao: Tiếp điểm đóng cắt kép với nét đứt liên động cơ khí.
  - Đèn chiếu sáng: Vòng tròn có dấu ×; Đèn huỳnh quang: Hình chữ nhật bo tròn có dấu × ở giữa.
  - Quạt trần: Hình cánh quạt 2 tam giác đối đỉnh có tâm tròn (3 chân: A, O, PE).
  - Chuông điện: Vòm chuông úp, đáy phẳng.`,
  defaultSpecs: {
    voltage: 220,
    frequency: 50,
  },
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
  ],
  presets: [],
  helpText: `HƯỚNG DẪN MẠCH ĐIỆN TỬ CƠ BẢN (GDPT 2018):
• Nguồn một chiều (DC): Pin / Acquy / Nguồn tổ ong (1.5 V – 24 V).
• Định luật Ohm: I = U / R. Điện trở vẽ hình chữ nhật rỗng chuẩn TCVN/IEC.
• LED (Điot phát quang): Kí hiệu tam giác tiếp giáp vạch thẳng kèm 2 mũi tên phát xạ ra ngoài. Màu phát quang chọn linh hoạt trong bảng Thuộc tính.
• Tụ điện phân cực: Cực dương (+) phải nối về phía điện thế cao hơn.
• Transistor BJT (NPN/PNP): Dùng dòng điều khiển cực B (Ib) để đóng cắt hoặc khuếch đại dòng cực C (Ic = β · Ib).`,
  defaultSpecs: {
    voltage: 9,
  },
};

export const WORKSPACE_REGISTRY: WorkspaceConfig[] = [
  WORKSPACE_HOUSEHOLD,
  WORKSPACE_ELECTRONICS,
];

export function getAllWorkspaces(): WorkspaceConfig[] {
  return WORKSPACE_REGISTRY;
}

export function getWorkspaceBySlug(slug: string): WorkspaceConfig | undefined {
  return WORKSPACE_REGISTRY.find(w => w.slug === slug);
}
