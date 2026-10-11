# eKid v2.4 — Quản trị người thân & phân quyền

**Mục tiêu (Ngài An):** phần liên kết người thân → bỏ "tìm theo tên" (dễ lộ thông tin); người tạo hồ sơ là **quản trị cao nhất** → thêm/xóa bố-mẹ-ông-bà vào giám sát con bằng **mã giới thiệu**; đổi được **quyền** cho từng người giám sát (Quản lý / Xem).

## Quyết định (đã chốt)
- **Mời bằng mã giới thiệu** (`link_code`) — an toàn, không lộ danh tính. **Bỏ tìm theo tên.**
- **Phân quyền 3 cấp:**

| Cấp | Ai | Quyền |
|---|---|---|
| **Chủ (owner)** | Người tạo hồ sơ (`ekid_kids.user_id`) | Toàn quyền: thêm/xóa người giám sát · đổi quyền từng người · sửa/khóa/xóa con |
| **Quản lý (admin)** | Người giám sát được trao quyền | Sửa hồ sơ + cài đặt + bài học của con (KHÔNG quản lý người giám sát, KHÔNG khóa/xóa con) |
| **Xem (viewer)** | Người thân mặc định | Chỉ đọc báo cáo/tiến độ/điểm |

- **Quan hệ mở rộng:** `cha`, `me`, **`ong`**, **`ba`**, `nguoi-giam-ho`.
- Người được mời **mặc định = viewer**; chủ nâng lên admin.

## Schema (migration `20261011000021_ekid_caregiver_permission.sql`)
```sql
ALTER TABLE public.ekid_caregivers DROP CONSTRAINT IF EXISTS ekid_caregivers_role_check;
ALTER TABLE public.ekid_caregivers ADD CONSTRAINT ekid_caregivers_role_check
  CHECK (role IN ('cha','me','ong','ba','nguoi-giam-ho'));
ALTER TABLE public.ekid_caregivers
  ADD COLUMN IF NOT EXISTS permission TEXT NOT NULL DEFAULT 'viewer'
  CHECK (permission IN ('admin','viewer'));
```

## API / quyền
- **Owner** = `kid.user_id`. **Admin caregiver** = `ekid_caregivers.caregiver_user_id = uid AND status='linked' AND permission='admin'`.
- `POST /api/ekid/kids` (tạo), `DELETE /api/ekid/kids/[kidId]`, và **quản lý người giám sát** (thêm/xóa/đổi quyền) → **chỉ OWNER**.
- `PATCH /api/ekid/kids/[kidId]` → **OWNER hoặc ADMIN caregiver**; nhưng admin caregiver KHÔNG được đổi `status` (khóa/mở) — chỉ owner.
- **Bỏ "tìm theo tên"**: xóa chức năng search user (`?q=`) khỏi `/api/ekid/caregivers` (không lộ danh tính), chỉ còn **mã mời**.
- Caregiver API: thêm `PATCH` để owner **đổi `permission`** của một liên kết (admin/viewer) + set `role`.

## UI (RelativesTab)
- Danh sách người giám sát: tên/họ? (hiện tên + role + permission + trạng thái).
- Owner: nút **"Tạo mã mời"** (hiện mã 6 ký tự) + mỗi dòng có **đổi quyền** (Quản lý ↔ Xem) + **gỡ liên kết** + **đổi quan hệ** (bố/mẹ/ông/bà/giám hộ).
- Non-owner (được mời): chỉ thấy danh sách + (nếu có mã) **"Nhập mã liên kết"** để tự nhận lời mời.
- **Bỏ hoàn toàn ô tìm kiếm theo tên.**

## Ngoài phạm vi
- Bản đồ số mệnh (phase sau).
- Cho admin caregiver sửa "bài học" ở mức chi tiết (global catalog) — hiện chỉ áp cho hồ sơ/cài đặt con.

## Ràng buộc
- Nhánh `dev`; production = `main`; migration áp TRƯỚC deploy.
- Không hồi quy: viewer caregiver vẫn chỉ đọc; phân hệ con ekid.nooi.net không đổi.
- TS strict; tiếng Việt; NOOI tokens (giám sát) + kid-theme (con).