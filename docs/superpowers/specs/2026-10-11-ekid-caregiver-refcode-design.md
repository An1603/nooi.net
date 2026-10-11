# eKid v2.5 — Thêm người giám sát bằng mã giới thiệu (ref code)

**Mục tiêu (Ngài An):** thêm người giám sát theo flow: **Nhập quan hệ → nhập mã giới thiệu (ref code) → hiện tên người dùng → gắn quyền → thêm**.

## Khảo sát (đã có)
- `profiles.ref_code` là mã giới thiệu unique của mỗi user (vd `AN` = Nguyễn Văn An), sinh tự động từ tên (`generate_ref_code`).
- `src/lib/referral.ts`: `lookupRefCode(code)` (RPC `lookup_ref_code`), `getRefCodeOwnerInfo(code)` → `{ full_name, ref_code, user_id }`.

## Flow mới (thay luồng mã mời ngẫu nhiên)
1. Owner chọn **quan hệ** (bố/mẹ/ông/bà/người giám hộ).
2. Nhập **mã giới thiệu (ref code)** của người đó.
3. Tra cứu → **hiện tên người dùng** tương ứng để xác nhận đúng người.
4. Chọn **quyền** (Quản lý / Xem).
5. **Thêm** → tạo liên kết **linked ngay** (không cần bước accept, vì owner đã xác định đích danh).

## API
- `POST /api/ekid/caregivers/resolve-ref` — auth; body `{ ref_code }` → tra `profiles.ref_code` (khớp chính xác, không phân biệt hoa/thường) → `{ user_id, full_name, ref_code }`; 404 nếu không có. (Không lộ toàn bộ user — chỉ khớp mã chính xác.)
- `POST /api/ekid/caregivers` (mở rộng) — **chỉ OWNER**: body `{ kid_id, ref_code, role, permission }` → resolve ref → `caregiver_user_id`; chặn thêm chính mình (400) + trùng người giám sát (409); insert `{ status:'linked', role, permission }`.

## UI (RelativesTab)
- Thay khối "Tạo mã mời" bằng form: select quan hệ + input mã giới thiệu + nút **Tra cứu** (hiện tên) + select quyền + nút **Thêm giám sát**.
- Giữ danh sách hiện tại (quan hệ/quyền/trạng thái) + các nút đổi quyền/đổi quan hệ/gỡ của owner (từ v2.4).

## Ngoài phạm vi
- Luồng "nhập mã liên kết" (accept) cũ — giữ lại cho các lời mời pending tồn đọng, không mở rộng mới.

## Ràng buộc
- Nhánh `dev`; production = `main`; KHÔNG cần migration mới (dùng `profiles.ref_code` có sẵn).
- TS strict; tiếng Việt; NOOI tokens.