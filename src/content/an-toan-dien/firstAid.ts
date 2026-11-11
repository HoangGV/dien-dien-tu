import { FirstAidStep, ShouldOrNotQuestion } from './types';

export const FIRST_AID_HEADER_WARNING =
  'Đây là bài ôn thứ tự các bước. Không thay thế thực hành với người hướng dẫn. Luôn đảm bảo an toàn cho bản thân trước. Gọi cấp cứu 115.';

export const CORRECT_FIRST_AID_STEPS: FirstAidStep[] = [
  {
    id: 'step_1_disconnect',
    stepNumber: 1,
    title: 'Bước 1: Tách nạn nhân ra khỏi nguồn điện an toàn',
    content: 'Nhanh chóng ngắt nguồn điện (ngắt Aptomat, cầu dao tổng hoặc rút phích cắm). Nếu không với tới cầu dao, đứng trên ván gỗ khô/thảm cao su và dùng vật liệu cách điện khô ráo (gậy tre khô, chổi gỗ khô) để gạt dây điện ra khỏi người nạn nhân. TUYỆT ĐỐI KHÔNG chạm trực tiếp vào nạn nhân bằng tay trần khi nguồn điện chưa được ngắt.',
    explanation: 'Nguyên tắc sống còn: Phải tách nguồn điện trước tiên. Nếu chạm vào nạn nhân khi chưa ngắt điện, người cứu hộ sẽ lập tức bị điện giật thành nạn nhân thứ hai.',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'step_2_call_115',
    stepNumber: 2,
    title: 'Bước 2: Gọi cấp cứu y tế 115 hoặc nhờ người gọi',
    content: 'Hô to báo động cho những người xung quanh biết để trợ giúp và gọi ngay Tổng đài Cấp cứu Y tế 115 (hoặc cơ sở y tế gần nhất).',
    explanation: 'Gọi cấp cứu chuyên nghiệp càng sớm thì cơ hội sống sót của nạn nhân ngừng tim, ngừng thở càng cao.',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'step_3_check_consciousness',
    stepNumber: 3,
    title: 'Bước 3: Đưa tới nơi thoáng khí, kiểm tra ý thức & thở',
    content: 'Đặt nạn nhân nằm ngửa trên mặt phẳng cứng, thoáng khí, nới lỏng cổ áo và thắt lưng. Vỗ nhẹ vào vai, gọi to để kiểm tra phản ứng (tri giác); ghé sát tai vào mũi miệng nạn nhân để nghe, nhìn lồng ngực có phập phồng hay không (kiểm tra hô hấp trong 10 giây).',
    explanation: 'Cần đánh giá nhanh xem nạn nhân còn tỉnh hay đã hôn mê, còn tự thở được hay đã ngừng tim, ngừng thở để áp dụng biện pháp hồi sức kịp thời.',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'step_4_cpr',
    stepNumber: 4,
    title: 'Bước 4: Ép tim ngoài lồng ngực & Hô hấp nhân tạo',
    content: 'Nếu nạn nhân ngừng thở hoặc thở ngáp cá, ngừng tim: Lập tức thực hiện hồi sinh tim phổi (CPR) gồm ép tim ngoài lồng ngực liên tục (tần số 100–120 lần/phút, độ sâu 5 cm) kết hợp thổi ngạt theo chu kì 30 lần ép tim : 2 lần thổi ngạt. Duy trì liên tục không gián đoạn cho đến khi nạn nhân tự thở lại hoặc nhân viên y tế 115 tiếp quản.',
    explanation: 'Mỗi phút trôi qua khi não thiếu oxy cơ hội cứu sống giảm đi 10%. Ép tim đúng kỹ thuật giúp duy trì tuần hoàn máu nhân tạo nuôi não và tim.',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'step_5_warm_hospital',
    stepNumber: 5,
    title: 'Bước 5: Giữ ấm, theo dõi và chuyển tới cơ sở y tế',
    content: 'Đắp chăn hoặc áo ấm giữ ấm cho nạn nhân, đặt nạn nhân ở tư thế nằm nghiêng an toàn (nếu đã tỉnh và tự thở). Nhanh chóng chuyển nạn nhân đến bệnh viện để bác sĩ theo dõi tim mạch (kể cả khi nạn nhân có vẻ đã hoàn toàn bình phục).',
    explanation: 'Điện giật có thể gây rối loạn nhịp tim muộn, bỏng sâu bên trong nội tạng hoặc sốc sau tai nạn mà mắt thường không thấy được.',
    reviewStatus: 'cần GV đối chiếu',
  },
];

export const SHOULD_OR_NOT_QUESTIONS: ShouldOrNotQuestion[] = [
  {
    id: 'should_pull_bare_hands',
    situation: 'Dùng tay trần nắm lấy tay hoặc chân nạn nhân để kéo họ ra khỏi dây điện đang chập cháy.',
    correctAction: 'khong-nen',
    explanation: 'KHÔNG ĐƯỢC LÀM: Cơ thể nạn nhân đang bị nhiễm điện áp 220 V. Nếu dùng tay không chạm vào, dòng điện sẽ giật truyền thẳng sang người cứu hộ gây tử vong cả hai người.',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'should_dry_wooden_stick',
    situation: 'Đứng trên nền khô và dùng một cây gậy tre khô hoặc cán chổi gỗ khô để gạt sợi dây điện ra xa người nạn nhân.',
    correctAction: 'nen',
    explanation: 'NÊN LÀM: Gỗ khô, tre khô, ống nhựa là những vật liệu cách điện tốt, giúp tách sợi dây điện mang điện ra khỏi nạn nhân một cách an toàn.',
    reviewStatus: 'cần GV đối chiếu',
  },
  {
    id: 'should_pour_water',
    situation: 'Dội một xô nước lạnh lên người nạn nhân đang dính vào dây điện để làm mát và đánh thức nạn nhân dậy.',
    correctAction: 'khong-nen',
    explanation: 'CỰC KỲ NGUY HIỂM: Nước là chất dẫn điện rất tốt; dội nước sẽ làm dòng điện lan khắp mặt sàn gây giật chết tất cả những người xung quanh và làm nạn nhân bị co giật bỏng nặng hơn.',
    reviewStatus: 'cần GV đối chiếu',
  },
];
