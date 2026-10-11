# eKid v2.5 — Thêm người giám sát bằng mã giới thiệu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** thêm người giám sát theo ref code (tra cứu → hiện tên → gắn quyền → thêm linked).

**Spec:** `docs/superpowers/specs/2026-10-11-ekid-caregiver-refcode-design.md`

## Global Constraints
- Nhánh `dev`; production = `main`; KHÔNG migration mới. TS strict; tiếng Việt; NOOI tokens.

---

### Task 1: API resolve-ref + thêm bởi ref (owner)
**Files:** `src/app/api/ekid/caregivers/resolve-ref/route.ts` (mới), `src/app/api/ekid/caregivers/route.ts`.
- [ ] `POST /resolve-ref`: auth 401 nếu chưa login; `{ ref_code }` → trim; tra `profiles` bằng `.ilike("ref_code", code)` limit 1 (dùng server client; profiles cho authenticated đọc full_name/ref_code/user_id). Không có → 404 `"Không tìm thấy mã giới thiệu"`. Trả `{ user_id, full_name, ref_code }`.
- [ ] `POST /api/ekid/caregivers` thêm nhánh ref: body `{ kid_id, ref_code, role, permission }` → **chỉ OWNER** (`kid.user_id === user.id`): resolve ref → `refUserId`; nếu `refUserId === user.id` → 400; kiểm trùng caregiver (kid_id + caregiver_user_id) → 409; insert `{ kid_id, caregiver_user_id: refUserId, role, permission, status: 'linked' }`. Validate role ∈ cha/me/ong/ba/nguoi-giam-ho, permission ∈ admin/viewer.
- [ ] Luồng mã mời/accept cũ giữ nguyên (nhánh theo body).
- [ ] tsc + test + lint sạch. Commit.

---

### Task 2: UI RelativesTab — form thêm theo ref code
**Files:** `src/app/(dashboard)/app/ekid/[kidId]/RelativesTab.tsx`.
- [ ] Form: select **quan hệ** + input **mã giới thiệu** + nút **Tra cứu** (POST resolve-ref → hiện `full_name`) + select **quyền** (Quản lý/Xem) + nút **Thêm giám sát** (POST caregivers với ref_code → thêm → refresh danh sách).
- [ ] Chỉ hiện với owner (`isOwner`).
- [ ] Báo lỗi 404 "Không tìm thấy mã", 409 "đã là người giám sát", 400 rõ ràng.
- [ ] tsc + test + lint + build sạch. Commit.

---

### Task 3: Build, deploy, verify
- [ ] `npm run build` PASS.
- [ ] `git checkout main && git merge --ff-only dev` + `bash deploy.sh "..."`.
- [ ] Verify: `/ap/ekid` 307; resolve-ref 401 anon; service active; nooi.net 200.
- [ ] Repo sạch, push.

## Kiểm thử (Ngài An)
1. Con → tab Người thân → chọn quan hệ (vd "Ông") → nhập mã giới thiệu (vd `AN`) → **Tra cứu** → hiện tên (vd "Nguyễn Văn An") → chọn quyền **Xem** → **Thêm** → hiện trong danh sách.