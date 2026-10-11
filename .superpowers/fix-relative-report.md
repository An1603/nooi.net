# Báo cáo — Hoàn thiện luồng liên kết người thân eKid

Ngày: 2026-10-11 · Nhánh: `dev` (không đổi nhánh, không push)

## Vấn đề ban đầu
Luồng LIÊN KẾT người thân chưa dùng được:
- Có nút tạo mã nhưng KHÔNG có ô nhập mã cho người nhận.
- Kết quả tìm kiếm hiển thị nhưng không bấm được (không có nút liên kết).
- Không hiển thị danh sách người thân hiện tại.
- `ekid_caregivers.caregiver_user_id` là `NOT NULL` → không thể tạo lời mời chờ bằng mã.

## Thay đổi

### 1) Migration `supabase/migrations/20261011000003_ekid_caregiver_null.sql`
- `ALTER TABLE public.ekid_caregivers ALTER COLUMN caregiver_user_id DROP NOT NULL;`
- Đã áp qua Supabase Management API (project `gsnuqrutiauhnsacgzym`) và **verify**: cột `caregiver_user_id` → `is_nullable = YES`.
- Lý do: chủ hồ sơ tạo LỜI MỜI bằng mã trước khi biết người nhận. UNIQUE(kid_id, caregiver_user_id) vẫn an toàn vì Postgres coi NULL là khác nhau.

### 2) API `src/app/api/ekid/caregivers/route.ts`
- **POST dạng `{ code }`** (người nhận nhập mã tự liên kết):
  - Tìm dòng có `link_code` + `status='pending'` + `caregiver_user_id IS NULL`.
  - Gán `caregiver_user_id = user.id`, `status='linked'`. Update có điều kiện `.is(NULL).eq('pending')` chống race ghi đè; 23505 → 409.
  - Mã sai → 404; mã đã dùng → 409.
- **POST dạng `{ kid_id, caregiver_user_id?, role }`** (chủ hồ sơ mời): giữ IDOR check; nếu `caregiver_user_id` rỗng → insert NULL + sinh `link_code` (lời mời chờ) thay vì gán chính mình.
- **GET không tham số**: trả lời mời/liên kết gửi ĐẾN user (`caregiver_user_id = user.id`), kèm `kid_name` → người nhận thấy và Chấp nhận/Từ chối.
- **GET `?kid_id=`**: cho chủ hồ sơ HOẶC người thân đã `linked` đọc; kèm `kid_name`.
- **PATCH**: giữ nguyên (owner hoặc người được mời).

### 3) Component `src/components/ekid/RelativeLink.tsx` (viết lại)
Props `{ kidId: string | null }`, 3 khối:
- **(K1) Nhập mã liên kết** — input + nút Liên kết → POST `{code}`; LUÔN hiển thị.
- **(K2) Mời người thân** — CHỈ khi `kidId != null`: select vai trò + ô tìm tên + nút Tìm → kết quả có nút "Liên kết"; nút "Tạo mã mời" → hiện mã 6 ký tự.
- **(K3) Người thân hiện tại** — GET `?kid_id=` + GET không tham số; hiện tên/vai trò/trạng thái + nút Chấp nhận/Từ chối cho lời mời của chính user.
- Mọi fetch có try/catch + kiểm `r.ok`; dùng NOOI tokens (`text-foreground`, `bg-card`, `border-border`, `text-primary`, `bg-glass`...); text tiếng Việt có dấu; TS strict.

### 4) Trang `src/app/(dashboard)/app/ekid/relatives/page.tsx`
- Cho phép `kidId` null; LUÔN render `RelativeLink` (kể cả người thân không sở hữu hồ sơ nào vẫn nhập được mã).

### 5) Helper + test
- Thêm `normalizeLinkCode()` vào `src/lib/ekid/ekid-system.ts` (trim + viết hoa), dùng trong route; thêm test.

## Kiểm chứng (tất cả PASS)
- `npx tsc --noEmit` → sạch (exit 0).
- `npm run lint` → exit 0; chỉ còn warning cũ ở file KHÔNG liên quan (telegram, voice, astrology, tuvi). Không có lỗi/warning ở file đã sửa.
- `npm run test` → 2 file, 41 test PASS.
- `npm run build` → thành công, sinh `.next/BUILD_ID` = `q0TH-nsRJzEXYlv5hf1xx`.

## Concerns
- Chưa có test tích hợp cho route (project chưa có hạ tầng mock Supabase); logic route mới chỉ được xác minh qua tsc/lint/build + test helper thuần. Khuyến nghị test thủ công 2 tài khoản thật: tài khoản A tạo mã → tài khoản B nhập mã.
- GET `?kid_id=` nay cho người thân đã `linked` đọc danh sách — chấp nhận được về nghiệp vụ (họ đã là người thân) nhưng là nới quyền so với bản cũ (chỉ owner).
- `link_code` chưa có UNIQUE index; mã trùng (xác suất cực thấp với 6 ký tự) khi nhập sẽ khớp dòng pending đầu tiên. Có thể bổ sung unique sau nếu cần.
