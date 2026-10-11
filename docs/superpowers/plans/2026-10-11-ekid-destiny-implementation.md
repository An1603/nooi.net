# eKid v2.6 — Bản đồ số mệnh + tinh chỉnh UX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Spec:** `docs/superpowers/specs/2026-10-11-ekid-destiny-design.md`

## Global Constraints
- Nhánh `dev`; production = `main`; KHÔNG migration. TS strict; tiếng Việt; NOOI tokens.

---

### Task 1: API `/api/ekid/kids/[kidId]/destiny`
**Files:** `src/app/api/ekid/kids/[kidId]/destiny/route.ts` (mới).
- [ ] GET: auth 401; resolve kid (admin client) + quyền owner/admin-caregiver/viewer-caregiver (tái dùng helper phân quyền hiện có ở `[kidId]/route.ts` — hoặc nhân bản logic `requireOwner`/`isAdminCaregiver` + thêm viewer: `ekid_caregivers status='linked'` bất kể permission). Không có quyền → 404/403.
- [ ] Parse: `fullName=name`, `dateOfBirth=date_of_birth`, `gioSinh = birth_time ? parseInt(birth_time) : 12`, `phutSinh = birth_time ? parseInt(min) : 0`, `gioiTinh = gender ?? 'nam'`, `noiSinh=birth_place`, coords mặc định HN.
- [ ] Tính 3 bản đồ (từng phần try/catch độc lập): numerology (sync), tuvi (sync), astrology (await). Trả `{ kid, missing:{gio_sinh,noi_sinh}, numerology, tuvi, astrology }`.
- [ ] `npx tsc --noEmit` + `npm run test` + lint sạch. Commit.

---

### Task 2: Tab Bản đồ số mệnh + tinh chỉnh UX
**Files:** `src/app/(dashboard)/app/ekid/[kidId]/KidConsole.tsx`, `.../[kidId]/DestinyTab.tsx` (mới), `.../[kidId]/RelativesTab.tsx`, `src/app/(dashboard)/app/ekid/page.tsx`.
- [ ] **DestinyTab**: thêm tab thứ 5 `?tab=destiny`; fetch `/api/ekid/kids/[kidId]/destiny`; 3 thẻ Thần số học/Tử vi/Chiêm tinh render tóm tắt tiếng Việt có cấu trúc (đọc types.ts của từng lib để lấy đúng field). Cảnh báo khi thiếu giờ sinh/nơi sinh + gợi ý bổ sung ở tab Tài khoản. Loading/error rõ.
- [ ] **RelativesTab** (tra cứu mã): sau resolve trả `user_id`, so với danh sách caregivers đang tải → nếu `caregiver_user_id` đã tồn tại: set cảnh báo đỏ "Đã thêm người này làm người giám sát" + `disabled` nút Thêm.
- [ ] **page.tsx**: đổi "Thêm con" → "Thêm học sinh".
- [ ] `npx tsc --noEmit` + test + lint + `npm run build` PASS. Commit.

---

### Task 3: Build, deploy, verify
- [ ] `npm run build` PASS; merge `dev`→`main` + `bash deploy.sh "..."`.
- [ ] Verify: `/app/ekid` 307; `/api/ekid/kids/[id]/destiny` 401 anon; service active; nooi.net 200.
- [ ] Repo sạch, push.

## Kiểm thử (Ngài An)
1. Con → tab **Bản đồ số mệnh** → 3 bản đồ hiện (nếu thiếu giờ sinh → cảnh báo, vẫn hiện dùng 12:00).
2. Con (Sam) đã có giờ/nơi sinh nếu đã nhập → bản đồ chính xác hơn.
3. Thêm học sinh → nhập mã giới thiệu đã có → báo đỏ + mờ nút Thêm.