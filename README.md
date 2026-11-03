# Mạch điện – Điện tử (GDPT 2018)

Ứng dụng web tiến bộ (PWA) mô phỏng mạch điện và điện tử dành cho học sinh THCS và THPT (Lớp 8, 9, 12) theo Chương trình Giáo dục phổ thông 2018 môn Công nghệ.

---

## 1. Cài đặt và Chạy thử nghiệm (Dev & Build)

### Chạy chế độ phát triển (Development):
```bash
npm install
npm run dev
```
Truy cập tại: `http://localhost:3000`

### Kiểm tra cú pháp (Lint) & Chạy kiểm thử tự động (Test):
```bash
npm run lint
npm run test
```

### Đóng gói sản phẩm (Production Build):
```bash
npm run build
npm run preview
```

---

## 2. Triển khai lên GitHub Pages (GitHub Actions)

Quy trình tự động hóa đã được thiết lập sẵn tại `.github/workflows/deploy.yml`:
1. Đẩy mã nguồn lên nhánh `main` trên GitHub.
2. Vào **Repository Settings** > **Pages** > **Build and deployment**: chọn **Source: GitHub Actions**.
3. Mỗi khi push code lên `main`, GitHub Actions sẽ tự động biên dịch với biến môi trường `BASE_URL` tương ứng tên repository và phát hành webapp tĩnh lên GitHub Pages.

---

## 3. Checklist 5 Bước Thêm Không Gian Làm Việc Mới (Modular Workspaces)

Kiến trúc của ứng dụng cho phép bổ sung không gian làm việc chuyên đề mới (ví dụ: *Cảm biến & Tự động hóa*, *Điện tử số Logic*, *Vi điều khiển STEM*) mà không sửa đổi cấu trúc lõi:

1. **Bước 1 — Định nghĩa cấu hình không gian**: Trong thư mục `src/core/workspaces.ts`, tạo đối tượng cấu hình mới tuân thủ interface `WorkspaceConfig`:
   ```typescript
   export const WORKSPACE_SENSORS: WorkspaceConfig = {
     slug: 'mach-cam-bien',
     title: 'Mạch cảm biến & Tự động hóa',
     grades: 'Lớp 11, 12',
     description: 'Mô phỏng cảm biến ánh sáng (LDR), nhiệt độ (NTC), độ ẩm đất điều khiển rơle...',
     mode: 'dc',
     paletteIds: ['dc_source', 'ldr', 'ntc', 'relay', 'potentiometer', 'transistor_npn'],
     presets: [],
     helpText: 'HƯỚNG DẪN CẢM BIẾN:...',
   };
   ```
2. **Bước 2 — Đăng ký vào Registry**: Thêm cấu hình vừa tạo vào mảng `WORKSPACE_REGISTRY`:
   ```typescript
   export const WORKSPACE_REGISTRY = [
     WORKSPACE_HOUSEHOLD,
     WORKSPACE_ELECTRONICS,
     WORKSPACE_SENSORS, // Thêm tại đây
   ];
   ```
3. **Bước 3 — Bổ sung linh kiện mới (nếu có)**: Thêm các định nghĩa linh kiện và kí hiệu TCVN trong `src/components/symbols/`.
4. **Bước 4 — Bổ sung thông số linh kiện**: Khai báo dòng định mức, công suất, điện áp quá tải trong `src/core/componentSpecs.ts`.
5. **Bước 5 — Kiểm tra độc lập**: Mở định tuyến `#/mo-phong/mach-cam-bien`. Dữ liệu lưu trữ, xuất nhập tệp JSON và undo/redo sẽ tự động hoạt động độc lập theo tiền tố `cn-dien:v1:mach-cam-bien`.

---

## 4. Cách Thay Đổi Biểu Tượng Ứng Dụng (PWA Icons)

1. Chuẩn bị file thiết kế vector chuẩn tại `public/icon.svg`.
2. Thay thế các tệp hình ảnh PNG kích thước tương ứng trong thư mục `public/`:
   - `public/pwa-192x192.png`: 192 × 192 px (icon hiển thị màn hình chính)
   - `public/pwa-512x512.png`: 512 × 512 px (splash screen khi khởi động)
   - `public/pwa-maskable-512x512.png`: 512 × 512 px có khoảng an toàn (safe-zone padding 15% xung quanh viền)
   - `public/apple-touch-icon.png`: 180 × 180 px cho iOS Safari
   - `public/favicon.ico`: Biểu tượng tab trình duyệt
3. Hoặc chỉnh sửa mã nguồn script tự động tạo ảnh `scripts/generate-icons.js` và chạy `node scripts/generate-icons.js`.

---

## 5. Quy Chuẩn Giao Diện Neo-Brutalism & Thiết Kế Đáp Ứng (Responsive)

- Màu sắc: `--blue` #4169E1, `--blue-dark` #2F4FC0, `--ink` #000000, `--paper` #FFFFFF, `--bg` #EEF2FF, `--yellow` #FFD84D, `--red` #E5322D, `--green` #2DB84D.
- Viền đen 2px/3px, bóng cứng 2px/4px 4px 0 #000 (không blur), bo góc 0 (radius 0).
- Nút bấm là khối hộp nổi rõ ràng, có chữ tiếng Việt đầy đủ, hiệu ứng thụt xuống khi bấm.

### 3 Cấp độ hiển thị đáp ứng (Responsive Tiers):
1. **Tier 1 — Máy tính để bàn (≥ 1100px)**: Cột linh kiện (176px), cột công cụ (44px), khung vẽ trung tâm (tối đa diện tích), bảng thuộc tính (224px).
2. **Tier 2 — Máy tính bảng (700px – 1099px)**: Bảng linh kiện và bảng thuộc tính hoạt động dưới dạng lớp phủ (overlay), giới hạn tối đa `min(260px, 85vw)`.
3. **Tier 3 — Điện thoại di động (< 700px)**: Bảng thuộc tính chuyển thành ngăn kéo trượt từ đáy (Bottom Sheet) với chiều cao tối đa `50dvh`.
4. **Chế độ kiểm tra ranh giới khung**: Thêm tham số `?layout=debug` vào URL để bật đường viền nét đứt kiểm tra viền khung màn hình.

---

## 6. Tiêu Chuẩn Kí Hiệu Mạch Điện TCVN & SGK GDPT 2018

Toàn bộ kí hiệu được đối chiếu và vẽ chuẩn xác theo:
- **TCVN 1613-75, TCVN 1615-75, TCVN 1619-75, TCVN 1622-75, TCVN 1623-75**.
- Sách giáo khoa Công nghệ lớp 8, 9, 12 bộ *Kết nối tri thức với cuộc sống*.
- Tra cứu bảng chi tiết tại menu **TRỢ GIÚP ▾** > **Bảng kí hiệu TCVN & SGK GDPT** hoặc tệp `src/symbols/STANDARDS.md`.

