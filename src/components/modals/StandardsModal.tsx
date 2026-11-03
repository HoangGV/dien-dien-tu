import React from 'react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { COMPONENT_MAP } from '../../core/registry';
import { ComponentInstance } from '../../core/model';

export interface StandardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StandardRow {
  name: string;
  standard: string;
  symbolCompType?: string;
  customSvg?: React.ReactNode;
  mockProps?: Record<string, any>;
  description: string;
}

export const StandardsModal: React.FC<StandardsModalProps> = ({ isOpen, onClose }) => {
  const standardRows: StandardRow[] = [
    {
      name: 'Nguồn điện xoay chiều (Lưới 220V)',
      standard: 'SGK Công nghệ 12 / TCVN',
      symbolCompType: 'ac_source',
      description: 'Chân cắm A (pha) và O (trung tính), có tên cực và mũi tên hướng xuống.',
    },
    {
      name: 'Aptomat một cực, hai cực, ba cực (MCB)',
      standard: 'SGK Công nghệ 12 (KNTT) / TCVN',
      symbolCompType: 'cb',
      mockProps: { poles: 2 },
      description: 'Khung hộp chữ nhật có tiếp điểm ngang tròn o--/--o và mũi tên liên động thẳng đứng ở giữa chỉ lên.',
    },
    {
      name: 'Cầu dao hai cực, ba cực',
      standard: 'SGK Công nghệ 12 (KNTT) / TCVN',
      symbolCompType: 'knife_switch',
      mockProps: { poles: 2 },
      description: 'Tiếp điểm đóng cắt thẳng đứng với các chấm tròn cực và mũi tên liên động đâm xuyên ngang qua các lưỡi dao.',
    },
    {
      name: 'Cầu chì 1 cực, 2 cực, 3 cực',
      standard: 'TCVN 1623-75 / SGK',
      symbolCompType: 'fuse',
      mockProps: { poles: 2 },
      description: 'Hình chữ nhật dài nằm ngang có dây dẫn xuyên tâm; hỗ trợ 1, 2 hoặc 3 cực song song.',
    },
    {
      name: 'Công tắc hai cực',
      standard: 'TCVN 1615-75 / SGK',
      symbolCompType: 'switch_spst',
      description: 'Vòng tròn có 2 tiếp điểm chấm tròn nhỏ và lưỡi đóng cắt nghiêng.',
    },
    {
      name: 'Công tắc ba cực (công tắc cầu thang)',
      standard: 'TCVN 1615-75 / SGK',
      symbolCompType: 'switch_spdt',
      description: 'Vòng tròn có 1 tiếp điểm chung và 2 tiếp điểm chuyển mạch đối diện.',
    },
    {
      name: 'Bóng đèn chiếu sáng (sợi đốt)',
      standard: 'TCVN 1622-75 / SGK',
      symbolCompType: 'lamp',
      mockProps: { lampType: 'incandescent' },
      description: 'Vòng tròn có dấu gạch chéo × lớn bên trong, 2 đầu ra dây.',
    },
    {
      name: 'Đèn huỳnh quang',
      standard: 'SGK Công nghệ 9, 12',
      symbolCompType: 'lamp_fluorescent',
      description: 'Hình chữ nhật dài bo tròn hai đầu có dấu × ở giữa (gồm cả chấn lưu & tắc te).',
    },
    {
      name: 'Quạt trần',
      standard: 'TCVN 1619-75 / SGK',
      symbolCompType: 'ceiling_fan',
      description: '2 tam giác đối đỉnh tạo cánh quạt, ở giữa có vòng tròn tâm nhỏ (2 chân A, O).',
    },
    {
      name: 'Chuông điện',
      standard: 'TCVN / SGK',
      symbolCompType: 'electric_bell',
      description: 'Nửa hình tròn vòm chuông úp, đáy phẳng có 2 chân nối điện.',
    },
    {
      name: 'Ổ lấy điện (Ổ cắm)',
      standard: 'TCVN / SGK',
      symbolCompType: 'socket',
      description: 'Vòng tròn có 2 lỗ cắm tròn nhỏ o o bên trong.',
    },
    {
      name: 'Công tơ điện',
      standard: 'TCVN / SGK',
      symbolCompType: 'kwh_meter',
      description: 'Khung chữ nhật có chữ kWh ở giữa, tiếp điểm thẳng hàng với Aptomat.',
    },
    {
      name: 'Dụng cụ đo (Ampe kế, Vôn kế, Oát kế, Ôm kế)',
      standard: 'TCVN / SGK',
      symbolCompType: 'ammeter',
      description: 'Vòng tròn có chữ cái ký hiệu đơn vị đo ở giữa (A, V, W, Ω).',
    },
    {
      name: 'Dây pha (A)',
      standard: 'TCVN / SGK',
      customSvg: (
        <svg viewBox="-40 -20 80 40" className="w-[60px] h-[30px]">
          <line x1={-35} y1={0} x2={35} y2={0} stroke="#E5322D" strokeWidth={3} />
        </svg>
      ),
      description: 'Dây dẫn điện nét liền màu đỏ đặc trưng cho dây pha A.',
    },
    {
      name: 'Dây trung tính (O)',
      standard: 'TCVN / SGK',
      customSvg: (
        <svg viewBox="-40 -20 80 40" className="w-[60px] h-[30px]">
          <line x1={-35} y1={0} x2={35} y2={0} stroke="#4169E1" strokeWidth={3} />
        </svg>
      ),
      description: 'Dây dẫn điện nét liền màu xanh dương đặc trưng cho dây trung tính O.',
    },
    {
      name: 'Hai dây nối nhau (Mối nối)',
      standard: 'TCVN / SGK',
      customSvg: (
        <svg viewBox="-30 -30 60 60" className="w-[50px] h-[50px]">
          <line x1={-25} y1={0} x2={25} y2={0} stroke="#000" strokeWidth={2} />
          <line x1={0} y1={-25} x2={0} y2={25} stroke="#000" strokeWidth={2} />
          <circle cx={0} cy={0} r={4.5} fill="#000" stroke="#FFF" strokeWidth={1.5} />
        </svg>
      ),
      description: 'Chấm tròn đen đặc tại giao điểm mối nối (Junction).',
    },
    {
      name: 'Hai dây chéo nhau',
      standard: 'TCVN / SGK',
      customSvg: (
        <svg viewBox="-30 -30 60 60" className="w-[50px] h-[50px]">
          <line x1={-25} y1={0} x2={25} y2={0} stroke="#000" strokeWidth={2} />
          <line x1={0} y1={-25} x2={0} y2={25} stroke="#000" strokeWidth={2} />
        </svg>
      ),
      description: 'Hai đường cắt nhau thẳng góc KHÔNG có chấm tròn (không tiếp xúc điện).',
    },
    {
      name: 'Điện trở',
      standard: 'TCVN / IEC',
      symbolCompType: 'resistor',
      description: 'Hình chữ nhật rỗng chuẩn TCVN/IEC (tuyệt đối không dùng hình zic-zắc ANSI).',
    },
    {
      name: 'LED đơn (6 màu)',
      standard: 'TCVN / IEC',
      symbolCompType: 'led',
      mockProps: { color: 'red' },
      description: 'Tam giác tiếp giáp vạch thẳng kèm 2 mũi tên phát xạ quang.',
    },
    {
      name: 'Transistor BJT (NPN / PNP)',
      standard: 'TCVN / IEC',
      symbolCompType: 'npn',
      description: 'Vòng tròn 3 cực B, C, E với mũi tên định chiều dòng điện ở cực E.',
    },
    {
      name: 'Nguồn dương (+VCC)',
      standard: 'Kĩ thuật Điện tử / SGK Công nghệ 12',
      symbolCompType: 'vcc',
      description: 'Mũi tên tam giác hướng lên kèm nhãn +VCC, chân cắm ở dưới để cấp nguồn dương.',
    },
  ];

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title="BẢNG ĐỐI CHIẾU KÍ HIỆU SƠ ĐỒ THEO TCVN & SGK GDPT 2018"
      maxWidthClass="max-w-4xl"
      footerActions={
        <NeoButton variant="primary" onClick={onClose}>
          ĐÓNG BẢNG KÍ HIỆU
        </NeoButton>
      }
    >
      <div className="space-y-3 text-black text-xs font-bold">
        <p className="text-gray-800">
          Kí hiệu trong ứng dụng được vẽ theo chuẩn Tiêu chuẩn Việt Nam (TCVN 1613-75, 1615-75, 1619-75, 1622-75, 1623-75) và sách giáo khoa môn Công nghệ – bộ sách <em>&ldquo;Kết nối tri thức với cuộc sống&rdquo;</em> (Chương trình GDPT 2018):
        </p>

        <div className="border-2 border-black overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#4169E1] text-white border-b-2 border-black text-[11px] uppercase tracking-wide">
                <th className="p-2 border-r border-black w-1/4">Tên thiết bị / Linh kiện</th>
                <th className="p-2 border-r border-black w-24 text-center">Kí hiệu</th>
                <th className="p-2 border-r border-black w-1/4">Tiêu chuẩn</th>
                <th className="p-2">Quy cách & Đặc điểm sư phạm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/30">
              {standardRows.map((row, idx) => {
                const def = row.symbolCompType ? COMPONENT_MAP.get(row.symbolCompType) : null;
                const mockComp: ComponentInstance = {
                  id: `preview_${idx}`,
                  type: row.symbolCompType || '',
                  x: 0,
                  y: 0,
                  rot: 0,
                  flip: false,
                  label: '',
                  props: row.mockProps || def?.defaultProps || {},
                };

                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#EEF2FF]'}>
                    <td className="p-2 border-r border-black font-extrabold text-black">
                      {row.name}
                    </td>
                    <td className="p-1 border-r border-black text-center align-middle">
                      <div className="flex items-center justify-center">
                        {row.customSvg ? (
                          row.customSvg
                        ) : def ? (
                          <svg viewBox="-45 -45 90 90" className="w-[50px] h-[40px]">
                            <def.symbol comp={mockComp} />
                          </svg>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-2 border-r border-black text-gray-700 font-mono text-[11px]">
                      {row.standard}
                    </td>
                    <td className="p-2 text-gray-800 text-[11px] leading-snug">
                      {row.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </NeoModal>
  );
};
