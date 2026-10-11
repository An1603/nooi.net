# eKid v2.2 — Trung tâm quản lý mỗi con (Guardian Console)

**Mục tiêu (Ngài An):** ở `nooi.net/app/ekid`, mỗi con là một hồ sơ trung tâm với đầy đủ: **tài khoản (tạo/sửa/khóa/xóa)**, **người thân**, **báo cáo (level, tiến độ, bài học)**, và **cài đặt riêng (nguyên tắc, môn học, phần thưởng)**.

## Hiện trạng (đã khảo sát)
- `/app/ekid`: form tạo con (username/password) + link tới `/app/ekid/report` và `/app/ekid/relatives` (tách rời, không theo mỗi con).
- Chỉ có **tạo**; chưa có sửa/khóa/xóa. Chưa có cài đặt riêng.
- Bảng: `ekid_kids` (name, date_of_birth, avatar_emoji, favorite_voice, placement_age_band, level, placement_level, daily_limit_min, child_user_id, username). Bài học: 9 bài, mỗi bài có `core_topic` (nhóm) + `part` (chung/riêng). Thưởng: `ekid_rewards`. Tiến độ: `ekid_progress`.

## Thiết kế

### Điều hướng
- `/app/ekid` → **danh sách con** (thẻ: avatar, tên, lứa, level, trạng thái) + nút **Thêm con** (form hiện có).
- `/app/ekid/[kidId]` → **console của con**, 4 tab: **Tài khoản · Người thân · Báo cáo · Cài đặt**.

### Tab 1 — Tài khoản (CRUD đầy đủ)
- **Sửa**: tên, ngày sinh, biểu tượng, giới hạn phút/ngày, (thông tin bổ sung cho Bản đồ số mệnh sau này: giờ sinh, giới tính, nơi sinh).
- **Đổi mật khẩu con** (đã có API).
- **Khóa / Mở khóa**: `ekid_kids.status = 'khoa'` → con không đăng nhập được (hiện trang "tài khoản tạm khóa"), dữ liệu giữ nguyên.
- **Xóa**: xóa hồ sơ con (cascade: progress/rewards/sessions/caregivers) + xóa auth user của con. Có xác nhận.

### Tab 2 — Người thân
- Danh sách người theo dõi của **con này** (n-n) + vai trò (cha/mẹ/người giám hộ).
- Thêm bằng **mã mời** hoặc **tìm theo tên** (tái dùng `RelativeLink` hiện có, nhưng đặt trong ngữ cảnh từng con) + xóa liên kết.

### Tab 3 — Báo cáo
- **Level** hiện tại + lứa tuổi (placement).
- **Tiến độ**: mỗi bài (nhóm/trạng thái/điểm cao nhất/số lần thi).
- **Thời gian học**: phút đã dùng hôm nay / giới hạn; tổng phút gần đây.
- **Thưởng**: tổng điểm, huy hiệu đã đạt, hoạt động gần đây.

### Tab 4 — Cài đặt (JSONB `ekid_kids.settings`)
- **Nguyên tắc**: giới hạn phút/ngày; khung giờ được học (từ–đến); số bài tối đa/ngày; yêu cầu **thi đạt mới sang bài mới**.
- **Môn học**: chọn **nhóm bài (core_topic)** con tập trung — checkbox theo lứa; mặc định = tất cả nhóm của lứa.
- **Phần thưởng**: điểm cho mỗi bài đạt; mốc huy hiệu (mặc định 3/5/10); **phần thưởng tùy chỉnh** (tên + điểm quy đổi, do cha/mẹ đặt).

## Schema (migration mới `20261011000020_ekid_v22.sql`)
```sql
ALTER TABLE public.ekid_kids
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','khoa')),
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS birth_time TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('nam','nu')),
  ADD COLUMN IF NOT EXISTS birth_place TEXT;
```
`settings` mặc định `{}`; API trả giá trị đã chuẩn hoá (rules/subjects/rewards) kèm default.

## API
- `GET /api/ekid/kids` — giữ (danh sách).
- `POST /api/ekid/kids` — giữ (tạo, có username/password).
- `GET /api/ekid/kids/[kidId]` — chi tiết 1 con (owner hoặc caregiver linked đọc).
- `PATCH /api/ekid/kids/[kidId]` — sửa profile + `status` (khóa/mở) + `settings` (chỉ OWNER).
- `DELETE /api/ekid/kids/[kidId]` — xóa (chỉ OWNER; xóa auth user con).
- `POST /api/ekid/kids/[kidId]/reset-password` — (chuyển từ route cũ, giữ tương thích).

## Thực thi nguyên tắc (server-side)
- **Khóa**: middleware host ekid — nếu con đang đăng nhập mà `status='khoa'` → chuyển trang `/khoa`.
- **Giới hạn phút/ngày**: `canStartSession` (đã có) dùng `daily_limit_min`.
- **Khung giờ + số bài tối đa/ngày**: kiểm trong `/api/ekid/session` (POST) — từ chối nếu ngoài giờ / vượt số bài.
- **Thi đạt mới sang bài**: `library` đánh dấu bài bị khóa; UI con ẩn nút học.

## Ngoài phạm vi
- Bản đồ số mệnh (phase sau) — nhưng v2.2 đã thu thập sẵn `birth_time`/`gender`/`birth_place`.

## Ràng buộc
- Nhánh `dev`; production = `main`. Migration áp TRƯỚC deploy.
- Chỉ OWNER sửa/khóa/xóa/cài đặt; caregiver linked CHỈ ĐỌC.
- NOOI tokens cho phân hệ giám sát (người lớn) — KHÔNG đổi sang tông trẻ em.
- TS strict; tiếng Việt; mobile-first.
