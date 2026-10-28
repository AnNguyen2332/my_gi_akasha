# GI Akasha UI

Giao diện web để build & showcase nhân vật Genshin Impact, dùng Google Sheet
[`Database_GI_v1`](https://docs.google.com/spreadsheets/d/1IeaYRmGEPS-rU_Uvy0J9pqcdAivPh__rhHxHMTeYacc/edit) làm database.

Thuần HTML/CSS/JS, không cần build — mở `index.html` là chạy.

## Chức năng

| Tab | Tương ứng trong sheet | Mô tả |
|---|---|---|
| **Showcase** | `Showcase` + `Thánh_Di_Vật` | Chọn nhân vật, cấp, cung mệnh, vũ khí + tinh luyện, 5 món thánh di vật (bộ, dòng chính, 4 dòng phụ với gợi ý giá trị hợp lệ), đội hình 4 người. Tự tính chỉ số cuối, bộ đang kích hoạt, cộng hưởng nguyên tố, chỉ số cộng thêm, CV. Nhấn vào từng chỉ số để xem nguồn. |
| **✦ Gợi ý** (trong Showcase) | — | Khi chọn nhân vật: gợi ý bộ thánh di vật (xếp hạng, 4 món hoặc 2+2), dòng chính Cát/Ly/Nón và 2 đội hình. Bấm “Áp dụng” để điền thẳng vào build. Dữ liệu ở `js/recommendations.js`. |
| **Nhân Vật** | `Nhân_Vật_Database` | Tra cứu, lọc theo nguyên tố / vũ khí / quốc gia / độ hiếm, xem chỉ số căn bản & đột phá. |
| **Vũ Khí** | `Vũ_Khí_Database` | Bảng vũ khí, lọc theo loại / độ hiếm, nội tại R1→R5. |
| **Thánh Di Vật** | `Thánh_Di_Vật_Database` | Các bộ, hiệu ứng 2 món, bảng dòng chính & giá trị dòng phụ. |
| **Build đã lưu** | — | Lưu nhiều build (localStorage), mở lại, xuất / nhập JSON. |

## Chạy

```bash
npx http-server -p 5173 -c-1
```

Hoặc mở thẳng `index.html` bằng trình duyệt.

## Dữ liệu

- `data/snapshot.js` là bản chụp dữ liệu từ sheet, dùng khi mở app lần đầu / offline.
- Nút **⟳ Đồng bộ Sheet** trên app tải trực tiếp dữ liệu mới nhất (sheet cần chia sẻ “Bất kỳ ai có đường liên kết”) và lưu cache trong trình duyệt.
- Cập nhật snapshot trong repo:

```bash
node scripts/sync-data.mjs
```

## Cấu trúc

```
index.html
css/style.css
js/data.js     # đọc CSV từ sheet, chuẩn hoá dữ liệu
js/recommendations.js # gợi ý bộ thánh di vật, dòng chính, đội hình
js/calc.js     # công thức tính chỉ số (chuyển từ công thức LET trong sheet Showcase)
js/app.js      # giao diện
data/snapshot.js
scripts/sync-data.mjs
```

## Khác biệt so với công thức trong sheet

`js/calc.js` cho ra kết quả giống sheet với build mặc định (Vodyanitsa / Thánh Ca Vòng Xoáy:
HP 33 675, ATK 1 241, DEF 484). Có vài chỗ được sửa so với sheet:

- Nội tại vũ khí được đọc theo **tên cột tiêu đề** của `Vũ_Khí_Database`. Công thức trong sheet đang lệch 1 cột ở
  các dòng %HP / %Tấn Công / %Phòng Ngự / Tinh Thông / Bạo kích / Nạp (vd. đọc cột `%Tấn Công` làm `%HP`),
  và ST Băng đọc nhầm cột ST Hỏa.
- `ST Tất Cả Nguyên Tố` của vũ khí được cộng vào cả 7 loại ST nguyên tố (sheet bỏ qua cột này).
- Bộ `Xà Cừ Đại Dương`, `Khúc Ca Ngày Cũ` có +15% Trị Liệu (2 món). Bộ `Thợ Săn Marechaussee` được cộng cả
  ST Tấn Công Thường (sheet đang đếm ở hàng 21 nên không bao giờ kích hoạt).

Có thể chỉnh hiệu ứng bộ trong `SET_BONUS` và danh sách vũ khí đặc biệt trong `SPECIAL_WEAPONS` (`js/calc.js`).
