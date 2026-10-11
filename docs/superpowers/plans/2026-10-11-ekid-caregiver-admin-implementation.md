# eKid v2.4 — Quản trị người thân & phân quyền — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Bỏ tìm-tên; thêm phân quyền `permission` (admin/viewer) cho người giám sát; mời bằng mã giới thiệu; mở rộng quan hệ ong/ba.

**Spec:** `docs/superpowers/specs/2026-10-11-ekid-caregiver-admin-design.md`

## Global Constraints
- Nhánh `dev`; production = `main`; migration áp TRƯỚC deploy (Management API, token = dòng CUỐI `SUPABASE_ACCESS_TOKEN` trong `~/.hermes/.env`).
- Owner = `ekid_kids.user_id`; admin caregiver = `ekid_caregivers(caregiver_user_id=uid, status='linked', permission='admin')`; viewer = read-only.
- TS strict; tiếng Việt; NOOI tokens (giám sát) + kid-theme (con). Không phá API cũ trừ việc bỏ `?q=` search.

---

### Task 1: Migration (role + permission)
**Files:** `supabase/migrations/20261011000021_ekid_caregiver_permission.sql`; áp qua Management API.
- [ ] SQL: DROP/ADD CONSTRAINT role (`cha,me,ong,ba,nguoi-giam-ho`) + `ADD COLUMN permission text NOT NULL DEFAULT 'viewer' CHECK (permission IN ('admin','viewer'))`.
- [ ] Verify cột + constraint tồn tại. Commit.

---

### Task 2: Helper phân quyền + API con
**Files:** `src/lib/ekid/ekid-system.ts` (thêm helper thuần nếu cần), `src/app/api/ekid/kids/[kidId]/route.ts`.
- [ ] Helper `isAdminCaregiver(adminClient, userId, kidId)` → boolean (dùng admin client + query ekid_caregivers).
- [ ] `requireCanEdit`: trả kid nếu **owner HOẶC admin caregiver** (cho PATCH). `requireOwner` giữ cho DELETE.
- [ ] `PATCH`: owner → đổi được cả `status`; **admin caregiver → được sửa hồ sơ/settings nhưng KHÔNG được đổi `status`** (bỏ qua trường status, hoặc 403). Vẫn deep-merge settings + validate daily_limit_min.
- [ ] `npx tsc --noEmit` + `npm run test` pass. Commit.

---

### Task 3: API caregivers — bỏ tìm tên + đổi quyền
**Files:** `src/app/api/ekid/caregivers/route.ts`.
- [ ] **Bỏ hoàn toàn search `?q=`** (không lộ danh tính); GET chỉ trả danh sách người giám sát của hồ sơ (owner/admin/self).
- [ ] Thêm **PATCH** `/api/ekid/caregivers?id=` → **chỉ OWNER**: đổi `permission` ('admin'|'viewer') hoặc `role` ('cha','me','ong','ba','nguoi-giam-ho').
- [ ] POST (tạo mã mời / mời) — giữ nguyên, nhưng role mới cho phép 'ong','ba'.
- [ ] DELETE giữ. Validate permission/role đúng enum. Commit.

---

### Task 4: RelativesTab — mã mời + phân quyền
**Files:** `src/app/(dashboard)/app/ekid/[kidId]/RelativesTab.tsx`; `src/components/ekid/RelativeLink.tsx` (bỏ tìm tên).
- [ ] **Bỏ ô tìm theo tên** trong RelativeLink (chỉ còn mã mời).
- [ ] Danh sách người giám sát: hiện **quan hệ (bố/mẹ/ông/bà/giám hộ) + quyền (Quản lý / Xem) + trạng thái**.
- [ ] Owner: mỗi dòng có **đổi quyền** (toggle Quản lý↔Xem) + **đổi quan hệ** (select) + **gỡ**; nút **Tạo mã mời**.
- [ ] Non-owner: thấy danh sách + (nếu có) nhập mã liên kết.
- [ ] `npx tsc --noEmit` + lint + `npm run build` sạch. Commit.

---

### Task 5: Build, deploy, verify
- [ ] `npm run build` PASS.
- [ ] `git checkout main && git merge --ff-only dev` + `bash deploy.sh "..."`.
- [ ] Verify: `/app/ekid` 307; caregiver API không còn `?q=`; service active; nooi.net 200.
- [ ] Repo sạch, push.

## Kiểm thử thủ công (Ngài An)
1. `nooi.net/app/ekid` → con → tab **Người thân**: không còn ô tìm tên.
2. **Tạo mã mời** → đưa cho ông/bà → họ nhập mã (trong tài khoản nooi.net của họ) → hiện trong danh sách với quyền **Xem**.
3. Chủ **đổi quyền → Quản lý** cho một người → người đó vào sửa được hồ sơ con (nhưng không thấy nút Khóa/Xóa/quản lý người giám sát).