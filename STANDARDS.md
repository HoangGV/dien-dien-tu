# QUY CHUẨN KÍ HIỆU VÀ MÔ HÌNH KĨ THUẬT ĐIỆN – ĐIỆN TỬ
Theo Chương trình Giáo dục Phổ thông 2018 (Bộ GD&ĐT) & Tiêu chuẩn TCVN / IEC

## 1. MẠNG ĐIỆN TRONG NHÀ (220 V RMS, 50 Hz)
- **Nguồn điện xoay chiều**: 
  - Đặt trong khung hộp nét đứt mảnh chuẩn tủ điện.
  - 2 cực cơ bản: Pha (A - màu đỏ) và Trung tính (O - màu xanh dương).
  - Tùy chọn cực nối đất bảo vệ PE (khi bật): nối về trung tính nguồn qua điện trở $0{,}1\,\Omega$ (mô hình tiếp địa tại trạm biến áp / tủ phân phối tổng).
- **Aptomat (MCB)**:
  - Aptomat hộp CB và Aptomat SGK (MCB 1P, 2P, 3P).
  - Khả năng bảo vệ quá tải: đường đặc tính nhiệt $t_{trip} = \frac{8}{(I / I_n)^2 - 1}$.
  - Aptomat chống giật / chống dòng rò (ELCB / RCD): nhảy khi dòng rò đất $|I_{pha} - I_{trung\_tính}| > 30\,\text{mA}$.
- **Cọc nối đất (đất)**:
  - Kí hiệu nối đất theo kiểu quen thuộc: đường thẳng đứng xuống rồi 3 vạch ngang ngắn dần (*cần GV đối chiếu*).
  - Điện trở nối đất $R_{đất}$ mặc định $4\,\Omega$ (TCVN 9358:2012 quy định điện trở nối đất an toàn sinh hoạt $\le 4\,\Omega$).
- **Thiết bị có vỏ kim loại (Quạt trần, Đèn huỳnh quang, Thiết bị điện khác)**:
  - Có nút vỏ nội bộ. Khi bật chân PE, vỏ nối với chân PE qua $1\,\text{m}\Omega$.
  - Khi có rò điện ra vỏ ($10\,\Omega$ từ pha A tới vỏ):
    - Nếu không nối đất (PE tắt): Người chạm vào vỏ chịu điện áp $V_{vỏ} \approx 217{,}8\,\text{V}$ và dòng $I_{người} \approx 217{,}8\,\text{mA}$ (nguy hiểm tính mạng).
    - Nếu có nối đất $R_{đất} = 4\,\Omega$: Điện áp vỏ giảm còn $\approx 62{,}7\,\text{V}$, bảo vệ an toàn cho người và tạo dòng sự cố lớn làm nhảy Aptomat / ELCB.
- **Ổ cắm điện**:
  - Mặc định 2 lỗ cắm A và O.
  - Tùy chọn chân nối đất PE: Khi bật, có chân PE đầu vào và lỗ cắm PE phía phích cắm, nối thông nhau bên trong ($1\,\text{m}\Omega$).
- **Dây dẫn điện**:
  - Dây pha (A): Đỏ (`#E5322D`).
  - Dây trung tính (O): Xanh dương (`#4169E1`).
  - Dây nối đất bảo vệ (PE): Xanh lá – Vàng (`#10B981` / `#FACC15`), có thẻ chữ PE.

## 2. GHI CHÚ ĐỐI VỚI GIÁO VIÊN VÀ HỌC SINH
- Các thông số về điện trở người ($1000\,\Omega$) và ngưỡng dòng điện an toàn ($< 10\,\text{mA}$ an toàn/tê nhẹ; $10-30\,\text{mA}$ co giật; $> 30\,\text{mA}$ nguy hiểm) mang tính chất minh họa giáo dục theo SGK Công nghệ lớp 8, 9, 12.

## 3. ĐIỆN TỬ SỐ (MỨC LOGIC 0 / 1 / X)
- **Cổng logic cơ bản**: Kí hiệu nét 2px theo hình dạng riêng (AND nửa tròn bên phải; OR cung lõm; NOT tam giác + vòng tròn; NAND/NOR/XNOR thêm vòng tròn ở ngõ ra; XOR/XNOR thêm cung kép ở ngõ vào), chân trên lưới (*cần GV đối chiếu*).
- **Mức logic**: Mức 1 (xanh lá), Mức 0 (xám đậm), Mức X (vàng nét đứt - chưa xác định / hở mạch), Xung đột (đỏ - khi hai nguồn 0 và 1 cùng đẩy vào một net).
- **Bảng chân trị**: Tự động sinh đầy đủ $2^n$ tổ hợp cho mạch tổ hợp không nhớ, hỗ trợ trích xuất biểu thức logic $Y = f(A, B, \dots)$.
