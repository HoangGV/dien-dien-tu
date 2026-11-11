import React from 'react';
import { BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { useWorkspaceStore } from '../../store/workspaceStore';

export interface CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WorkspaceCurriculumInfo {
  title: string;
  grades: string;
  coveredPoints: {
    gradeTag: string;
    topic: string;
    items: string[];
  }[];
  unsupportedPoints: string[];
}

const CURRICULUM_DATA: Record<string, WorkspaceCurriculumInfo> = {
  'mang-dien-trong-nha': {
    title: 'Mạng điện trong nhà',
    grades: 'Lớp 8, 9, 12',
    coveredPoints: [
      {
        gradeTag: 'Lớp 8',
        topic: 'An toàn điện & Phòng tránh tai nạn điện',
        items: [
          'Nhận biết nguyên nhân gây tai nạn điện do chạm trực tiếp vào dây pha hoặc chạm gián tiếp qua vỏ kim loại thiết bị rò điện.',
          'Hiểu nguyên lí và tác dụng bảo vệ an toàn của hệ thống dây nối đất (PE) nối cọc tiếp địa.',
          'Nguyên lí làm việc của aptomat chống rò (ELCB/RCBO 30 mA) tự động ngắt nguồn khi có dòng rò nguy hiểm qua người xuống đất.',
        ],
      },
      {
        gradeTag: 'Lớp 9',
        topic: 'Lắp đặt mạng điện sinh hoạt & Đo lường điện',
        items: [
          'Đọc hiểu và thiết kế sơ đồ nguyên lí, sơ đồ lắp đặt mạng điện trong nhà theo chuẩn kí hiệu TCVN và SGK GDPT 2018.',
          'Lắp đặt mạch điều khiển 1 đèn bằng 1 công tắc 2 cực (1 cực đóng cắt) có aptomat bảo vệ.',
          'Lắp đặt mạch đèn cầu thang: 1 đèn điều khiển độc lập từ hai nơi bằng 2 công tắc 3 cực.',
          'Lắp đặt mạch phân phối song song gồm ổ cắm lấy điện, quạt trần, bóng đèn và chuông điện.',
          'Sử dụng và đọc số đo các dụng cụ đo điện: Ampe kế đo dòng điện, Vôn kế đo điện áp, Oát kế đo công suất P, Công tơ điện 1 pha đo điện năng kWh.',
        ],
      },
      {
        gradeTag: 'Lớp 12',
        topic: 'Thiết kế mạng điện dân dụng & Bảo vệ chọn lọc',
        items: [
          'Phân chia mạng điện một phòng thành các nhánh độc lập: nhánh chiếu sáng (MCB 6A) và nhánh ổ cắm (MCB 16A) sau ELCB tổng.',
          'Khảo sát cơ chế bảo vệ quá tải nhiệt (bimetal tích lũy nhiệt) và ngắn mạch điện từ (nhảy tức thì ≤ 20 ms) của Aptomat MCB.',
          'Phân tích sự cố chọn sai tiết diện dây dẫn (dây bốc khói/cháy trước khi aptomat nhảy khi chọn dây nhỏ hơn dòng tải).',
          'Khảo sát bảo vệ quá tải bằng cầu chì dây chảy.',
        ],
      },
    ],
    unsupportedPoints: [
      'Lưới điện xoay chiều 3 pha 380 V và động cơ không đồng bộ 3 pha công nghiệp (phần mềm chuyên biệt cho điện áp 220 V 1 pha dân dụng).',
      'Mô hình vật lí 3D luồn dây ống nẹp PVC âm tường (phần mềm hỗ trợ sơ đồ nguyên lí và sơ đồ lắp đặt 2D chuẩn kỹ thuật).',
      'Khởi động từ Contactor, rơ le nhiệt công nghiệp và biến tần công suất lớn.',
    ],
  },
  'mach-dien-tu-co-ban': {
    title: 'Mạch điện tử cơ bản',
    grades: 'Lớp 9, 12',
    coveredPoints: [
      {
        gradeTag: 'Lớp 9',
        topic: 'Linh kiện thụ động, bán dẫn cơ bản & Định luật Ohm',
        items: [
          'Nhận biết, đọc thông số và kí hiệu quy ước của linh kiện thụ động: điện trở, biến trở con chạy, tụ gốm, tụ hóa phân cực.',
          'Kiểm chứng định luật Ohm (I = U/R) và công thức chia điện áp bằng Ôm kế và Vôn kế.',
          'Khảo sát đặc tính LED phát quang, xác định cực Anode – Cathode và vai trò sống còn của điện trở hạn dòng (tránh cháy LED).',
          'Sử dụng biến trở điều chỉnh phân áp để thay đổi dòng điện và độ sáng của LED.',
          'Ứng dụng Transistor BJT (NPN) làm khóa điện tử (công tắc bán dẫn) điều khiển đóng ngắt LED qua nút nhấn.',
        ],
      },
      {
        gradeTag: 'Lớp 12',
        topic: 'Mạch chỉnh lưu, mạch RC & Dao động kí ảo',
        items: [
          'Khảo sát đặc tính Diode bán dẫn (1N4007) và mạch chỉnh lưu nửa chu kì biến đổi AC thành DC.',
          'Khảo sát quá trình nạp và xả của tụ điện qua điện trở trong mạch RC (hằng số thời gian τ = R·C).',
          'Vận hành Dao động kí ảo (Oscilloscope) 2 kênh đo điện áp tức thời, quan sát dạng sóng sin AC, đo biên độ đỉnh và chu kì tần số.',
          'Cảnh báo và mô phỏng sự cố đấu ngược cực tính tụ hóa 16 V trên nguồn điện một chiều.',
        ],
      },
    ],
    unsupportedPoints: [
      'Vi điều khiển lập trình nhúng (Arduino, STM32, PIC, ESP32) và IC logic số chuyên dụng 74xx/40xx.',
      'Mạch khuếch đại thuật toán (Op-amp đa tầng phức tạp) hoặc IC định thời 555 đa hài.',
      'Hiện tượng bức xạ điện từ cao tần MHz/GHz và điện dung kí sinh vi dải mạch in PCB.',
    ],
  },
  'mach-dieu-khien-cam-bien': {
    title: 'Mạch điều khiển cảm biến',
    grades: 'Lớp 8, 9, 10',
    coveredPoints: [
      {
        gradeTag: 'Lớp 8',
        topic: 'Mạch điều khiển tự động cơ bản',
        items: [
          'Nắm vững cấu trúc 3 khối cơ bản của mạch điều khiển: Khối thu nhận (Cảm biến) → Khối xử lí/khuếch đại → Khối chấp hành (Rơ le, Đèn, Còi).',
          'Mạch tự động bật đèn chiếu sáng khi trời tối sử dụng mô-đun cảm biến quang trở (ánh sáng) kết hợp mô-đun rơ le 1 kênh.',
          'Mạch tự động bật quạt tản nhiệt khi nhiệt độ môi trường vượt ngưỡng cài đặt sử dụng cảm biến nhiệt độ (NTC).',
          'Nguyên lí cách li điện an toàn giữa mạch điều khiển DC 5 V và mạch động lực tải thông qua tiếp điểm COM–NO/NC của rơ le.',
        ],
      },
      {
        gradeTag: 'Lớp 9, 10',
        topic: 'Nhà thông minh – Hệ thống an ninh, an toàn & Định thời',
        items: [
          'Hệ thống an ninh báo cháy / cảnh báo rò rỉ khí gas: Cảm biến gas phát hiện nồng độ vượt ngưỡng kích rơ le bật chuông điện báo động.',
          'Hệ thống chiếu sáng thông minh hành lang: Cảm biến hồng ngoại chuyển động (PIR) kết hợp rơ le thời gian trễ ngắt (Off-delay) tự tắt sau T giây.',
          'Phân biệt chức năng ngõ ra số DO (Digital Output đóng/cắt) và ngõ ra tương tự AO (Analog Output điện áp tỉ lệ).',
          'Điều chỉnh ngưỡng tác động (threshold) và cơ chế trễ (hysteresis ±2%) chống rung chập chờn tiếp điểm.',
        ],
      },
    ],
    unsupportedPoints: [
      'Giao tiếp số hóa chuẩn công nghiệp (I2C, SPI, UART, Modbus, 4–20 mA).',
      'Động cơ bước điều khiển góc quay chính xác hoặc servo RC PWM.',
      'Mô phỏng trường vật lí môi trường 3D liên tục (luồng khí đối lưu, áp suất thủy lực động).',
    ],
  },
  'dien-tu-so': {
    title: 'Điện tử số',
    grades: 'Lớp 12',
    coveredPoints: [
      {
        gradeTag: 'Lớp 12',
        topic: 'Điện tử số & Mạch xử lí tín hiệu',
        items: [
          'Trình bày nội dung cơ bản về tín hiệu, mạch xử lí tín hiệu (mạch tổ hợp, mạch dãy).',
          'Vẽ kí hiệu, nêu công dụng, nhận biết cổng logic cơ bản (AND, OR, NOT, NAND, NOR, XOR, XNOR).',
          'Lắp ráp, kiểm tra mạch điện tử số đơn giản dùng các cổng logic cơ bản.',
          'Phần tử nhớ Flip-Flop (D, JK, T): lưu trữ trạng thái 1 bit, kích theo cạnh xung (cạnh lên / cạnh xuống) và chân xóa CLR tức thời.',
          'Lắp ráp mạch dãy cơ bản: chia tần số, bộ đếm nhị phân nối tiếp, bộ đếm 0–9 hiển thị LED 7 đoạn BCD, thanh ghi dịch.',
        ],
      },
    ],
    unsupportedPoints: [
      'Chưa hỗ trợ: bộ nhớ, thanh ghi vào song song, mạch dãy phức tạp.',
    ],
  },
  'do-dung-dien-gia-dinh': {
    title: 'Đồ dùng điện trong gia đình',
    grades: 'Lớp 6',
    coveredPoints: [
      {
        gradeTag: 'Lớp 6',
        topic: 'Đồ dùng điện trong gia đình (Chủ đề 4 - Công nghệ 6)',
        items: [
          'Kể tên, nêu được chức năng các bộ phận chính của một số đồ dùng điện phổ biến trong gia đình (Nồi cơm điện, Quạt điện, Đèn điện sợi đốt / huỳnh quang / LED).',
          'Trình bày và giải thích được sơ đồ khối, nguyên lí làm việc của nồi cơm điện, quạt điện và các loại đèn điện.',
          'Đọc và giải thích được ý nghĩa các thông số kĩ thuật cơ bản ghi trên nhãn đồ dùng điện (điện áp định mức, công suất định mức, dung tích, tốc độ...).',
          'Thực hiện các nguyên tắc sử dụng đồ dùng điện đúng cách, an toàn phòng tránh điện giật, cháy nổ và tiết kiệm năng lượng.',
          'Tính toán được điện năng tiêu thụ của các đồ dùng điện trong gia đình theo công thức E = P · t / 1000 (với P tính bằng W, t tính bằng giờ).',
        ],
      },
    ],
    unsupportedPoints: [
      'Thao tác tháo lắp sửa chữa cơ khí trực tiếp (phần mềm tập trung mô phỏng cấu tạo sư phạm cắt lớp, sơ đồ khối và tính toán).',
      'Đồ dùng điện 3 pha hoặc thiết bị công nghiệp nặng.',
    ],
  },
};

export const CurriculumModal: React.FC<CurriculumModalProps> = ({ isOpen, onClose }) => {
  const { config } = useWorkspaceStore();

  const curInfo = CURRICULUM_DATA[config.slug] || CURRICULUM_DATA['mang-dien-trong-nha'];

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title="YÊU CẦU CẦN ĐẠT (CHƯƠNG TRÌNH GDPT 2018)"
      maxWidthClass="max-w-3xl"
      footerActions={
        <NeoButton variant="primary" onClick={onClose}>
          ĐÓNG BẢNG YÊU CẦU
        </NeoButton>
      }
    >
      <div className="space-y-4 text-black text-sm">
        {/* Header summary badge */}
        <div className="bg-[#EEF2FF] border-[3px] border-black p-3 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-black text-gray-600">Không gian hiện tại:</div>
            <div className="text-base font-black text-[#4169E1] uppercase">{curInfo.title}</div>
          </div>
          <span className="bg-[#FFD84D] text-black font-black text-xs px-2.5 py-1 border-2 border-black">
            {curInfo.grades}
          </span>
        </div>

        {/* Section 1: Covered Requirements */}
        <div className="border-[3px] border-black p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="text-[#2DB84D]" size={18} strokeWidth={3} />
            <h3 className="font-black text-sm uppercase text-black tracking-tight">
              1. Nội dung chương trình liên quan (Đã hỗ trợ mô phỏng)
            </h3>
          </div>

          <div className="space-y-3">
            {curInfo.coveredPoints.map((cp, idx) => (
              <div key={idx} className="border-2 border-black p-3 bg-[#FAFAFA]">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-[#4169E1] text-white text-[11px] font-black px-1.5 py-0.5 border border-black">
                    {cp.gradeTag}
                  </span>
                  <span className="font-black text-xs uppercase text-gray-900">{cp.topic}</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-800 font-bold ml-1">
                  {cp.items.map((item, iIdx) => (
                    <li key={iIdx} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Unsupported Features */}
        <div className="border-[3px] border-black p-4 bg-[#FFFBEB]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-[#F59E0B]" size={18} strokeWidth={3} />
            <h3 className="font-black text-sm uppercase text-black tracking-tight">
              2. Chưa hỗ trợ trong phần mềm
            </h3>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-800 font-bold ml-1">
            {curInfo.unsupportedPoints.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </NeoModal>
  );
};
