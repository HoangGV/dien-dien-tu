# Mạch điện – Điện tử

Ứng dụng web tiến bộ (PWA) mô phỏng hệ thống mạch điện và điện tử phục vụ giảng dạy và học tập môn Công nghệ (Lớp 8, 9, 12) theo Chương trình Giáo dục phổ thông 2018 (GDPT 2018).

Ứng dụng tuân thủ tiêu chuẩn kí hiệu TCVN/IEC, chạy hoàn toàn trên trình duyệt, không gửi dữ liệu ra ngoài và hỗ trợ hoạt động offline 100%.

---

## 1. Danh Sách Không Gian Làm Việc (Workspaces)

1. **Mạng điện trong nhà (`mang-dien-trong-nha`)**
   - **Cấp học**: Lớp 8, Lớp 9, Lớp 12
   - **Mô tả**: Nguồn xoay chiều 220 V / 50 Hz, aptomat (MCB), aptomat chống giật/rò (RCCB), cầu chì, công tắc 2 cực, công tắc 3 cực (cầu thang), ổ cắm, bóng đèn, quạt trần, chuông điện, ampe kế, vôn kế, oát kế 4 chân, công tơ điện và hệ thống bảo vệ nối đất PE.
   - **Tính năng nổi bật**: Tính toán dòng rò, rò vỏ thiết bị khi mất tiếp địa, mô phỏng quá tải nhiệt và ngắn mạch cắt tức thời.

2. **Mạch điện tử cơ bản (`mach-dien-tu-co-ban`)**
   - **Cấp học**: Lớp 9, Lớp 12
   - **Mô tả**: Nguồn một chiều DC (pin/ắc quy), nguồn xoay chiều AC tín hiệu nhỏ, điện trở, tụ điện, cuộn cảm, biến trở, điốt thường, điốt phát quang (LED), transistor lưỡng cực (NPN/PNP), rơ le điện cơ và dao động kí ảo 2 kênh.
   - **Tính năng nổi bật**: Khảo sát mạch chỉnh lưu nửa chu kì / toàn chu kì, mạch RC nạp xả, phân cực transistor, dao động kí đo dạng sóng điện áp tức thời.

3. **Mạch điều khiển cảm biến (`mach-dieu-khien-cam-bien`)**
   - **Cấp học**: Lớp 8, Lớp 9
   - **Mô tả**: Mô-đun cảm biến đa năng (Ánh sáng LDR, Nhiệt độ NTC, Khí gas, Khói, Hồng ngoại chuyển động PIR, Siêu âm khoảng cách), rơ le thời gian trễ bật/tắt, còi báo động, quạt thông gió, đèn chiếu sáng, công tắc và nguồn cấp.
   - **Tính năng nổi bật**: Ứng dụng điều khiển tự động trong Nhà thông minh (Smart Home), cảnh báo cháy nổ, chiếu sáng tự động theo chuyển động và ánh sáng môi trường.

---

## 2. Hướng Dẫn Chạy Cục Bộ (Dev & Build)

### Yêu cầu môi trường:
- Node.js phiên bản LTS (khuyến nghị v18 hoặc v20+)
- Trình quản lý gói npm

### Cài đặt và khởi chạy dev server:
```bash
# Cài đặt thư viện
npm install

# Khởi chạy máy chủ phát triển (cổng 3000)
npm run dev
```
Mở trình duyệt tại: `http://localhost:3000`

### Biên dịch sản phẩm (Production Build):
```bash
# Đóng gói tối ưu hóa cho môi trường xuất bản
npm run build

# Xem thử bản đóng gói cục bộ
npm run preview
```

### Kiểm tra cú pháp (Lint) & Bộ kiểm thử:
```bash
npm run lint
npm run test
```

---

## 3. Hướng Dẫn Đưa Lên GitHub Pages Từng Bước

Quy trình triển khai tự động hóa đã được định cấu hình bằng GitHub Actions tại `.github/workflows/deploy.yml`.

### Các bước thực hiện:
1. **Khởi tạo và đẩy mã nguồn lên GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: release version 1.0.0"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan>/<ten-repo>.git
   git push -u origin main
   ```
2. **Kích hoạt tính năng GitHub Pages**:
   - Truy cập vào trang GitHub của repository: `https://github.com/<tai-khoan>/<ten-repo>`.
   - Vào mục **Settings** > **Pages** (ở cột bên trái).
   - Tại mục **Build and deployment** > **Source**, chọn: **GitHub Actions**.
3. **Quá trình triển khai tự động**:
   - Workflow `.github/workflows/deploy.yml` sẽ tự động kích hoạt.
   - Script tự động thiết lập biến môi trường `VITE_BASE="/<ten-repo>/"` khớp chính xác với đường dẫn của GitHub Pages.
   - Nhờ sử dụng Hash Routing (`#/`), bạn không cần lo lắng về lỗi 404 khi người dùng tải lại trang. Tệp `public/404.html` sẽ chuyển hướng dự phòng an toàn về trang chủ.
4. **Truy cập ứng dụng**:
   - Sau 1–2 phút, ứng dụng sẽ hoạt động tại địa chỉ: `https://<tai-khoan>.github.io/<ten-repo>/`.

---

## 4. Checklist Thêm Linh Kiện & Không Gian Làm Việc Mới

Khi cần mở rộng thêm linh kiện hoặc không gian làm việc chuyên đề mới (ví dụ: *Điện tử số Logic*, *Năng lượng tái tạo*):

### Checklist thêm Linh kiện mới:
- [ ] **Bước 1**: Khai báo loại linh kiện (`ComponentType`) trong `src/core/circuitModel.ts`.
- [ ] **Bước 2**: Định nghĩa thông số định mức, quá tải và giới hạn hoạt động trong `src/core/componentSpecs.ts`.
- [ ] **Bước 3**: Vẽ biểu tượng hiển thị SVG theo chuẩn TCVN trong thư mục `src/components/symbols/`.
- [ ] **Bước 4**: Bổ sung mô hình toán học giải thuật nút (MNA / Norton equivalent) vào bộ giải trong `src/core/solver.ts` hoặc `src/core/solverAc.ts`.
- [ ] **Bước 5**: Khai báo chân cực (terminals) và các thuộc tính điều chỉnh (properties) trong `src/core/circuitModel.ts` để hiển thị trong Bảng Thuộc Tính.
- [ ] **Bước 6**: Bổ sung linh kiện vào danh sách palette của workspace mong muốn trong `src/core/workspaces.ts`.
- [ ] **Bước 7**: Viết ca kiểm thử tự động trong `src/tests/solverTestSuite.ts` để đảm bảo mạch hoạt động chính xác.

### Checklist thêm Không gian làm việc (Workspace) mới:
- [ ] **Bước 1**: Tạo cấu hình mới tuân thủ interface `WorkspaceConfig` trong `src/core/workspaces.ts` (đặt slug, tiêu đề, lớp học, chế độ giải ac/dc, danh sách paletteIds, mạch mẫu presets).
- [ ] **Bước 2**: Đăng ký cấu hình vào mảng `WORKSPACE_REGISTRY` trong `src/core/workspaces.ts`.
- [ ] **Bước 3**: Tạo mạch mẫu sư phạm minh họa (presets) với đầy đủ ghi chú kì vọng sư phạm.
- [ ] **Bước 4**: Kiểm tra lưu trữ độc lập theo khóa tiền tố `cn-dien:v1:<slug>`.

---

## 5. Cách Thay Đổi Biểu Tượng Ứng Dụng (PWA Icons)

1. Thiết kế biểu tượng vector chuẩn tại tệp `public/icon.svg`:
   - Kích thước chuẩn tỉ lệ 1:1 (khuyên dùng `viewBox="0 0 512 512"`).
   - Nền vòng tròn màu `#4169E1` viền đen, biểu tượng nét trắng đậm có khoảng an toàn (safe zone) 15–20% ở các mép.
2. Chạy lệnh sinh tự động toàn bộ kích thước PNG và favicon:
   ```bash
   npm run gen-icons
   ```
   Lệnh trên sẽ tự động kết xuất các tệp:
   - `public/pwa-192x192.png` (192 × 192 px)
   - `public/pwa-512x512.png` (512 × 512 px)
   - `public/pwa-maskable-512x512.png` (512 × 512 px maskable cho Android)
   - `public/apple-touch-icon.png` (180 × 180 px cho iOS Safari)
   - `public/favicon.ico` (biểu tượng tab trình duyệt)

---

## 6. Bảng Kiểm Thử Thực Tế Trên Thiết Bị Di Động (Mobile Test Checklist)

Trước khi nghiệm thu triển khai, hãy đối chiếu trên thiết bị di động (Android / iOS):

| STT | Hạng mục kiểm tra | Thao tác thực tế | Kết quả mong đợi |
|-----|-------------------|------------------|------------------|
| 1 | Cài đặt ứng dụng PWA | Bấm banner cài đặt hoặc "Thêm vào MH chính" | Cài đặt thành công, xuất hiện icon tròn #4169E1 trên màn hình |
| 2 | Khởi động độc lập (Standalone) | Nhấn mở icon từ màn hình chính | Khởi động không có thanh địa chỉ trình duyệt, splash screen hiển thị icon |
| 3 | Hoạt động Offline | Bật "Chế độ máy bay", tắt Wi-Fi và 4G, mở lại app | Ứng dụng nạp bình thường, chuyển workspace mượt mà, mô phỏng chạy tốt |
| 4 | Chỉ báo mạng | Tắt / bật Wi-Fi khi đang mở app | Thanh trạng thái hiển thị "Đang offline" / "Đang online" ngay tức thì |
| 5 | Xoay màn hình | Xoay dọc ↔ xoay ngang điện thoại | Giao diện tự động co dãn, thanh công cụ chuyển đổi vị trí hợp lý |
| 6 | Thao tác cảm ứng (Touch) | Chạm kéo di chuyển linh kiện, nối dây | Kéo thả mượt mà, không kích hoạt nhầm thao tác bật/tắt công tắc |
| 7 | Bảng thuộc tính (Bottom Sheet) | Bấm vào linh kiện trên điện thoại | Bảng thuộc tính trượt lên từ đáy màn hình, không che khuất toàn bộ mạch |
| 8 | Thu phóng (Pinch Zoom & Pan) | Dùng 2 ngón tay thu phóng và rê khung nhìn | Khung vẽ SVG phóng to / thu nhỏ mượt mà theo tâm ngón tay |
| 9 | Mạch mẫu & Khôi phục | Nạp mạch mẫu có sự cố nổ cầu chì / nhảy aptomat | Linh kiện báo đỏ nét viền, bấm "Hồi phục" linh kiện trở lại bình thường |
| 10 | Sao lưu & Khôi phục dữ liệu | Vào TRỢ GIÚP ▾ > Giới thiệu > [XUẤT TẤT CẢ] | Tải về tệp JSON chứa toàn bộ mạch đã lưu trên máy |

---

## 7. Tiêu Chuẩn Tham Chiếu

- **TCVN 1613-75 đến 1623-75**: Tiêu chuẩn Quốc gia về kí hiệu quy ước trên sơ đồ mạch điện.
- **SGK Công nghệ 8, 9, 12**: Bộ sách Kết nối tri thức với cuộc sống & Cánh Diều.
- **Quy tắc an toàn**: Tiêu chuẩn an toàn điện hạ áp dân dụng IEC 60364.
