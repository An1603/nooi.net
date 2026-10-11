# eKid v2.6 — Bản đồ số mệnh + tinh chỉnh UX

**Goal (Ngài An):**
1. Tra cứu mã giới thiệu: nếu người đó **đã trong danh sách liên kết** → báo đỏ "đã thêm" + **mờ nút "Thêm giám sát"**.
2. Đổi chữ **"Thêm con" → "Thêm học sinh"**.
3. Trong console mỗi con thêm **tab "Bản đồ số mệnh"** → xem 3 bản đồ: **Thần số học** · **Tử vi** · **Chiêm tinh**.

## Dữ liệu & hàm tính (đã có sẵn)
- Kid: `name` (họ tên), `date_of_birth` (YYYY-MM-DD), `birth_time` ("HH:MM"|null), `gender` ('nam'|'nu'|null), `birth_place` (text|null).
- `calculateNumerology({ fullName, dateOfBirth })` — sync (`src/lib/numerology`).
- `calculateTuVi({ fullName, ngaySinh, gioSinh:number, gioiTinh })` — sync (`src/lib/tuvi`).
- `calculateAstrology({ fullName, ngaySinh, gioSinh:number, phutSinh?, noiSinh?, viDo?, kinhDo? })` — **async** (`src/lib/astrology`).
- `birth_time "HH:MM"` → `gioSinh = parseInt(hour)`; `phutSinh = parseInt(min)`; `gioiTinh = gender ?? 'nam'`.

## API
- `GET /api/ekid/kids/[kidId]/destiny` — auth; quyền = owner HOẶC caregiver (admin/viewer) linked. Đọc kid → parse dữ liệu → tính 3 bản đồ (numerology, tuvi sync; astrology await). Trả:
```json
{ "kid": {name, date_of_birth, birth_time, gender, birth_place},
  "missing": { "gio_sinh": bool, "noi_sinh": bool },
  "numerology": {...}, "tuvi": {...}, "astrology": {...} }
```
  - Nếu thiếu `birth_time` → `missing.gio_sinh=true`, vẫn tính bằng `gioSinh=12` (mặc định) để bản đồ có dữ liệu, UI hiện cảnh báo "Cần bổ sung giờ sinh để chính xác".
  - Địa điểm chiêm tinh: dùng `birth_place` (nếu có, coords mặc định Hà Nội); thiếu → `missing.noi_sinh=true`.
- Xử lý lỗi tính từng phần độc lập (1 bản đồ lỗi không chặn 2 bản đồ còn lại).

## UI
- Tab **Bản đồ số mệnh** (`?tab=destiny`) trong KidConsole: 3 thẻ (Thần số học / Tử vi / Chiêm tinh), mỗi thẻ hiển thị **tóm tắt có cấu trúc** (nhãn tiếng Việt) từ result object — KHÔNG dump JSON thô. Đọc `src/lib/{numerology,tuvi,astrology}/types.ts` để render đúng field (vd numerology: core numbers; tuvi: Mệnh/Cục/Cung Mệnh/Sao chủ; astrology: Mặt Trời/Mặt Trăng/Thiên Đỉnh/cung Hoàng Đạo).
- Hiện cảnh báo nhẹ khi `missing.gio_sinh`/`missing.noi_sinh` + gợi ý bổ sung ở tab Tài khoản.
- Quyền đọc giống Báo cáo (owner/admin/viewer đều xem).

## Tinh chỉnh UX
- RelativesTab (tra cứu mã giới thiệu): sau khi resolve ra `user_id`, kiểm trùng với danh sách caregivers hiện có → nếu đã có: hiện **cảnh báo đỏ "Đã thêm người này làm người giám sát"** + **`disabled` nút "Thêm giám sát"**.
- `/app/ekid/page.tsx`: đổi nhãn "Thêm con" → **"Thêm học sinh"** (nút + bất cứ chỗ nào hiện "Thêm con").

## Ràng buộc
- Nhánh `dev`; production = `main`; KHÔNG migration mới. TS strict; tiếng Việt; NOOI tokens (giám sát).
- Không phá API cũ; tab Báo cáo/Cài đặt giữ nguyên.