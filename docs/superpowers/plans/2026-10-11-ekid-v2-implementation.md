# eKid v2 — Phân hệ học riêng ekid.nooi.net — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Tách phân hệ học cho con ra **ekid.nooi.net** (đăng nhập username+password), mô hình nhiều-nhiều giám sát↔con, thêm thưởng + thư viện ôn + thi lại.

**Architecture:** Traefik thêm router `ekid.nooi.net` → cùng service Next.js; middleware phân nhánh theo `host` (như `admin.nooi.net`). Con là user Supabase Auth với email nội bộ `<username>@ekid.nooi.net`. Phân hệ giám sát giữ trong `nooi.net/app/ekid`.

**Tech Stack:** Next.js 15 App Router, Supabase (Auth admin API + Postgres + RLS), Tailwind v4 + NOOI tokens, Vitest, Traefik (file provider).

**Spec:** `docs/superpowers/specs/2026-10-11-ekid-child-subsystem-design.md`

## Global Constraints

- **Nhánh:** làm trên `dev`; deploy = `git checkout main && git merge --ff-only dev && bash deploy.sh "..."` (production = `main`).
- **Supabase project:** `gsnuqrutiauhnsacgzym`. Migration áp qua Management API: `POST https://api.supabase.com/v1/projects/gsnuqrutiauhnsacgzym/database/query`, header `Authorization: Bearer <token>`; **token = DÒNG CUỐI** của `~/.hermes/.env` (dòng đầu invalid).
- **Email nội bộ của con:** `<username>@ekid.nooi.net`. Hằng số dùng chung: `CHILD_EMAIL_DOMAIN = "ekid.nooi.net"`.
- **Auth admin:** `createAdminClient().auth.admin.createUser({ email, password, email_confirm: true })`.
- **Traefik config:** `/docker/traefik/config/nooi.yml` (sửa cần `sudo`; `--providers.file.watch=true` tự nạp lại).
- **UI:** NOOI tokens (`bg-background/bg-card/bg-glass/border-border/text-foreground/text-muted-foreground/text-primary/text-n-green`), nền page inline `#1a0a2e`, mobile `px-2`, tiếng Việt có dấu, `"use client"` cho component tương tác, TS strict (`err: unknown`).
- **Test:** `npm run test` (vitest). **Build verify:** `.next/BUILD_ID` tồn tại. **Lint:** `npm run lint` không lỗi ở file đã sửa.
- **Username con:** regex `^[a-z0-9._]{3,20}$` (lưu lowercase). **Mật khẩu con:** ≥ 6 ký tự.
- **Huy hiệu:** mốc 3/5/10 bài "đạt" (điểm ≥ 70). **Điểm:** mỗi lần thi cộng `max(0, round(score/10))` điểm (0-10).

---

## File Structure

**Mới — lib/DB:**
- `supabase/migrations/20261011000010_ekid_v2.sql` — ALTER + 2 bảng mới + RLS
- `src/lib/ekid/ekid-system.ts` (bổ sung) — normalizeUsername, isValidUsername, childEmail, pointsForScore, badgesForProgress
- `__tests__/ekid-v2.test.ts`

**Mới — middleware:**
- `src/lib/supabase/middleware.ts` (bổ sung helper) hoặc logic trong `src/middleware.ts`

**Mới — API:**
- `src/app/api/ekid/kids/route.ts` (sửa POST để tạo auth user con)
- `src/app/api/ekid/kids/reset-password/route.ts`
- `src/app/api/ekid/library/route.ts`
- `src/app/api/ekid/quiz/route.ts`
- `src/app/api/ekid/rewards/route.ts`

**Mới — phân hệ con `src/app/ekid/`:**
- `layout.tsx` (tối giản, không sidebar), `login/page.tsx`, `page.tsx` (thư viện), `hoc/[lessonId]/page.tsx`, `thi/[lessonId]/page.tsx`, `thuong/page.tsx`
- components: `src/components/ekid/child/ChildShell.tsx`, `LessonCard.tsx`, `QuizRunner.tsx`, `RewardBoard.tsx`

**Sửa — phân hệ giám sát:**
- `src/app/(dashboard)/app/ekid/page.tsx` (form tạo con có username+password)
- `src/app/(dashboard)/app/ekid/report/page.tsx` (hiện điểm/thưởng/bài đã học)

**Hạ tầng:**
- `/docker/traefik/config/nooi.yml` (thêm host ekid)

---

## Interfaces (dùng chung)

```typescript
// src/lib/ekid/ekid-system.ts (bổ sung)
export const CHILD_EMAIL_DOMAIN = "ekid.nooi.net";
export function normalizeUsername(raw: string): string;      // trim + lowercase
export function isValidUsername(u: string): boolean;         // ^[a-z0-9._]{3,20}$
export function childEmail(username: string): string;        // `${normalizeUsername}@ekid.nooi.net`
export function pointsForScore(score: number): number;       // max(0, round(score/10))
export function badgesForProgress(passedLessons: number): { code: string; label: string }[];
// passedLessons = số bài đạt (best_score>=70). Mốc 3/5/10.
```

---

### Task 1: Migration v2

**Files:** Create `supabase/migrations/20261011000010_ekid_v2.sql`; apply qua Management API.

- [ ] **Step 1: Viết SQL**

```sql
-- eKid v2: tài khoản con + thưởng + tiến độ bài học
ALTER TABLE public.ekid_kids
  ADD COLUMN IF NOT EXISTS child_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ekid_kids_username ON public.ekid_kids(lower(username)) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ekid_kids_child_user ON public.ekid_kids(child_user_id) WHERE child_user_id IS NOT NULL;

ALTER TABLE public.ekid_lessons
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.ekid_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('diem','huy-hieu','sticker')),
  code TEXT,
  label TEXT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ekid_rewards_kid ON public.ekid_rewards(kid_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ekid_progress (
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.ekid_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'chua-hoc' CHECK (status IN ('chua-hoc','da-hoc','da-thi')),
  best_score INT,
  attempts INT NOT NULL DEFAULT 0,
  last_at TIMESTAMPTZ,
  PRIMARY KEY (kid_id, lesson_id)
);

ALTER TABLE public.ekid_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_progress ENABLE ROW LEVEL SECURITY;

-- helper: user hiện tại có phải là CON sở hữu kid_id không
CREATE OR REPLACE FUNCTION public.ekid_is_child_of(p_kid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.ekid_kids k WHERE k.id = p_kid AND k.child_user_id = auth.uid());
$$;
GRANT EXECUTE ON FUNCTION public.ekid_is_child_of(uuid) TO authenticated;

DROP POLICY IF EXISTS "ekid_rewards_read" ON public.ekid_rewards;
CREATE POLICY "ekid_rewards_read" ON public.ekid_rewards
  FOR SELECT TO authenticated USING (
    public.ekid_is_child_of(kid_id) OR public.ekid_owns_kid(kid_id) OR public.ekid_is_caregiver(kid_id)
  );
DROP POLICY IF EXISTS "ekid_progress_read" ON public.ekid_progress;
CREATE POLICY "ekid_progress_read" ON public.ekid_progress
  FOR SELECT TO authenticated USING (
    public.ekid_is_child_of(kid_id) OR public.ekid_owns_kid(kid_id) OR public.ekid_is_caregiver(kid_id)
  );
```

- [ ] **Step 2: Áp migration** (python3, token dòng cuối) — verify `is_nullable`/cột/bảng tồn tại.
- [ ] **Step 3: Commit** `feat(ekid): migration v2 — tài khoản con + thưởng + tiến độ`.

---

### Task 2: Lib ekid-system v2 (TDD)

**Files:** Modify `src/lib/ekid/ekid-system.ts`; Create `__tests__/ekid-v2.test.ts`.

**Interfaces:** Produces `CHILD_EMAIL_DOMAIN, normalizeUsername, isValidUsername, childEmail, pointsForScore, badgesForProgress`.

- [ ] **Step 1: Test thất bại**

```typescript
import { describe, it, expect } from "vitest";
import { normalizeUsername, isValidUsername, childEmail, pointsForScore, badgesForProgress } from "@/lib/ekid/ekid-system";

describe("ekid v2 — username", () => {
  it("normalize → trim + lowercase", () => { expect(normalizeUsername("  BeBo  ")).toBe("bebo"); });
  it("hợp lệ 3-20 ký tự a-z0-9._", () => {
    expect(isValidUsername("bebo")).toBe(true);
    expect(isValidUsername("be.bo_1")).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("BeBo")).toBe(false);
    expect(isValidUsername("be- bo")).toBe(false);
  });
  it("childEmail ghép domain nội bộ", () => { expect(childEmail("BeBo")).toBe("bebo@ekid.nooi.net"); });
});
describe("ekid v2 — điểm & huy hiệu", () => {
  it("pointsForScore", () => { expect(pointsForScore(100)).toBe(10); expect(pointsForScore(0)).toBe(0); expect(pointsForScore(-5)).toBe(0); });
  it("badgesForProgress mốc 3/5/10", () => {
    expect(badgesForProgress(0).length).toBe(0);
    expect(badgesForProgress(3).length).toBe(1);
    expect(badgesForProgress(5).length).toBe(2);
    expect(badgesForProgress(10).length).toBe(3);
  });
});
```

- [ ] **Step 2:** Run `npm run test -- ekid-v2` → FAIL (chưa có hàm).
- [ ] **Step 3: Implement**

```typescript
export const CHILD_EMAIL_DOMAIN = "ekid.nooi.net";
export function normalizeUsername(raw: string): string { return raw.trim().toLowerCase(); }
export function isValidUsername(u: string): boolean { return /^[a-z0-9._]{3,20}$/.test(normalizeUsername(u)); }
export function childEmail(username: string): string { return `${normalizeUsername(username)}@${CHILD_EMAIL_DOMAIN}`; }
export function pointsForScore(score: number): number { return Math.max(0, Math.round((Number.isFinite(score) ? score : 0) / 10)); }
const BADGE_MILESTONES = [
  { at: 3, code: "hoc-sinh-cham-chi", label: "Chăm chỉ (3 bài đạt)" },
  { at: 5, code: "hoc-sinh-gioi", label: "Giỏi giang (5 bài đạt)" },
  { at: 10, code: "hoc-sinh-xuat-sac", label: "Xuất sắc (10 bài đạt)" },
];
export function badgesForProgress(passedLessons: number): { code: string; label: string }[] {
  return BADGE_MILESTONES.filter((m) => passedLessons >= m.at).map((m) => ({ code: m.code, label: m.label }));
}
```

- [ ] **Step 4:** Run test → PASS. **Step 5: Commit** `feat(ekid): lib v2 username/điểm/huy hiệu (TDD)`.

---

### Task 3: API tạo tài khoản con + reset mật khẩu

**Files:** Modify `src/app/api/ekid/kids/route.ts`; Create `src/app/api/ekid/kids/reset-password/route.ts`.

**Interfaces:** Consumes `normalizeUsername`, `isValidUsername`, `childEmail`, `createAdminClient`.

- [ ] **Step 1: Sửa POST `/api/ekid/kids`** — nhận `{ name, date_of_birth, username, password, avatar_emoji? }`:
  - validate name/dob/username/password (≥6). Nếu thiếu → 400.
  - `normalizeUsername`; nếu !isValidUsername → 400 "Tên đăng nhập không hợp lệ".
  - kiểm username chưa tồn tại (SELECT ekid_kids where lower(username)=...). Trùng → 409.
  - `const created = await admin.auth.admin.createUser({ email: childEmail(username), password, email_confirm: true })`; nếu lỗi → 500 kèm message.
  - insert `ekid_kids { user_id: user.id, child_user_id: created.data.user.id, username, name, date_of_birth, avatar_emoji, placement_age_band, placement_level }`.
  - Nếu insert lỗi → xóa auth user vừa tạo (rollback) rồi 500.
  - Trả `{ kid }`.
- [ ] **Step 2: Tạo reset-password** — `POST { kid_id, password }`: verify kid thuộc user (owner) → `admin.auth.admin.updateUserById(child_user_id, { password })`. Trả `{ ok: true }`.
- [ ] **Step 3:** `npx tsc --noEmit` sạch. **Step 4: Commit** `feat(ekid): API tạo tài khoản con (username/password) + reset mật khẩu`.

---

### Task 4: API library / quiz / rewards

**Files:** Create `src/app/api/ekid/library/route.ts`, `src/app/api/ekid/quiz/route.ts`, `src/app/api/ekid/rewards/route.ts`.

**Interfaces:** Consumes `pointsForScore`, `badgesForProgress`.

- [ ] **Step 1: `GET /api/ekid/library?kid_id=`** — verify quyền (owner | caregiver linked | child); trả `{ kid, lessons: [{...lesson, progress:{status,best_score,attempts}}] }` cho đúng band của bé, order `sort_order, difficulty`.
- [ ] **Step 2: `POST /api/ekid/quiz`** — body `{ kid_id, lesson_id, answers: number[] }`:
  - verify quyền (owner | child); lấy lesson.exercises để chấm: `score = round(correct/total*100)`.
  - upsert `ekid_progress { kid_id, lesson_id, status:'da-thi', best_score: greatest(cũ, score), attempts+1, last_at: now }`.
  - insert `ekid_sessions { kid_id, lesson_id, ended_at, duration_min: 0, transcript: [], exercises_done, score }`.
  - thưởng: `pts = pointsForScore(score)`; insert `ekid_rewards {kid_id, kind:'diem', label:'Điểm bài thi', points: pts}`. Đếm số bài đạt (best_score>=70) → badges mới so với badges đã có → insert `ekid_rewards {kind:'huy-hieu', code, label}`.
  - trả `{ score, best_score, points_awarded, new_badges, passed_lessons }`.
- [ ] **Step 3: `GET /api/ekid/rewards?kid_id=`** — verify quyền; trả `{ total_points, badges: [...], recent: [...] }`.
- [ ] **Step 4:** tsc sạch. **Step 5: Commit** `feat(ekid): API library + quiz + rewards`.

---

### Task 5: Middleware phân nhánh theo host

**Files:** Modify `src/middleware.ts` (+ helper trong `src/lib/supabase/middleware.ts` nếu cần).

**Interfaces:** Consumes bảng `ekid_kids.child_user_id`.

- [ ] **Step 1: Thêm hằng + helper**
```typescript
const EKID_HOST = "ekid.nooi.net";
function isEkidHost(host: string) { return host === EKID_HOST; }
// Kiểm tra user hiện tại có phải tài khoản CON không:
async function isChildUser(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from("ekid_kids").select("id").eq("child_user_id", userId).maybeSingle();
  return !!data;
}
```
- [ ] **Step 2: Nhánh host ekid** (đặt trước nhánh admin/main):
  - `host === EKID_HOST`:
    - nếu pathname bắt đầu `/ekid` → để nguyên (đã đúng path).
    - nếu `/login` → cho qua.
    - nếu chưa login → redirect `/ekid/login`.
    - nếu user là CON → **rewrite** `new URL('/ekid' + (pathname === '/' ? '' : pathname), request.url)` (để mọi path trên host ekid phục vụ dưới `/ekid/*`).
    - nếu là NGƯỜI LỚN → redirect `https://nooi.net/app/ekid`.
- [ ] **Step 3: Nhánh host nooi (main)** — nếu user là CON → redirect `https://ekid.nooi.net` (con không vào app người lớn). Thêm sau guard admin.
- [ ] **Step 4:** `npx tsc --noEmit` + `npm run lint` sạch. **Step 5: Commit** `feat(ekid): middleware tách phân hệ con theo host ekid.nooi.net`.

---

### Task 6: Traefik route ekid.nooi.net

**Files:** Modify `/docker/traefik/config/nooi.yml` (sudo).

- [ ] **Step 1: Sửa rule** — thêm `` || Host(`ekid.nooi.net`) `` vào CẢ `nooi-http` và `nooi-https` (giữ service `nooi-web`, tls letsencrypt).
- [ ] **Step 2: Verify Traefik tự reload** (file watch): `curl -s -o /dev/null -w "%{http_code}" https://ekid.nooi.net` → không còn 404 (kỳ vọng 307/200). Nếu chưa, `sudo docker restart traefik-traefik-1`.
- [ ] **Step 3:** Ghi chú thay đổi (không vào git repo nooi.net). (Không commit — file ngoài repo.)

---

### Task 7: Phân hệ con — layout + login

**Files:** Create `src/app/ekid/layout.tsx`, `src/app/ekid/login/page.tsx`.

- [ ] **Step 1: layout.tsx** — tối giản: nền `#1a0a2e`, header nhỏ (logo eKid + tên bé nếu có + nút Đăng xuất), `<main>{children}</main>`. KHÔNG Sidebar/Topbar người lớn.
- [ ] **Step 2: login/page.tsx** — form: input **username** + input **password** (type=password) + nút to "Vào học 🚀". Submit: `supabase.auth.signInWithPassword({ email: `<username>@ekid.nooi.net`, password })` (dùng `createClient()` browser) → thành công `router.push('/ekid')` + reload; lỗi → thông báo tiếng Việt thân thiện. Giao diện trẻ em (chữ to, màu vui).
- [ ] **Step 3:** tsc/lint sạch. **Step 4: Commit** `feat(ekid): phân hệ con — layout tối giản + đăng nhập username/password`.

---

### Task 8: Phân hệ con — thư viện / học / thi / thưởng

**Files:** Create `src/app/ekid/page.tsx`, `src/app/ekid/hoc/[lessonId]/page.tsx`, `src/app/ekid/thi/[lessonId]/page.tsx`, `src/app/ekid/thuong/page.tsx`, components `src/components/ekid/child/{LessonCard,QuizRunner,RewardBoard}.tsx`.

- [ ] **Step 1: `/ekid` (Thư viện)** — fetch `/api/ekid/library` (kid = con đang đăng nhập; lấy kid_id từ `/api/ekid/kids` trả con này) → lưới **LessonCard** (ô lớn, emoji, tên bài, trạng thái: Chưa học / Đã học / Đã thi · điểm). Có ô tìm theo tên + nhóm. Nút "🏆 Thưởng" → `/ekid/thuong`.
- [ ] **Step 2: `/ekid/hoc/[lessonId]`** — hiện **video hướng dẫn** nếu `video_url` (iframe YouTube, tái dùng pattern có sẵn) + `EkidVoiceSession` (AI voice luyện tập). Nút "Làm bài thi →" → `/ekid/thi/[lessonId]`.
- [ ] **Step 3: `/ekid/thi/[lessonId]`** — `QuizRunner`: hiện lần lượt câu hỏi (options, nút to), thu `answers[]` → POST `/api/ekid/quiz` → hiện điểm + điểm thưởng + huy hiệu mới + nút "Thi lại" / "Về thư viện".
- [ ] **Step 4: `/ekid/thuong`** — `RewardBoard`: fetch `/api/ekid/rewards` → tổng điểm, các huy hiệu (sáng nếu đạt), sticker.
- [ ] **Step 5:** tsc/lint sạch. **Step 6: Commit** `feat(ekid): phân hệ con — thư viện/học/thi/thưởng`.

---

### Task 9: Cập nhật phân hệ giám sát

**Files:** Modify `src/app/(dashboard)/app/ekid/page.tsx`, `src/app/(dashboard)/app/ekid/report/page.tsx`.

- [ ] **Step 1:** Form tạo con (ở `/app/ekid`) thêm 2 ô: **Tên đăng nhập (username)** + **Mật khẩu** (≥6). POST `/api/ekid/kids` kèm `{name, date_of_birth, username, password}`. Hiển thị lỗi rõ (trùng username/không hợp lệ). Sau khi tạo, hiện nhắc "Đưa tên đăng nhập + mật khẩu này cho con để vào ekid.nooi.net".
- [ ] **Step 2:** `/app/ekid/report` thêm hiển thị **điểm tổng + huy hiệu + danh sách bài (đã học/điểm)** cho từng con (fetch `/api/ekid/rewards` + `/api/ekid/library`).
- [ ] **Step 3:** tsc/lint sạch. **Step 4: Commit** `feat(ekid): phân hệ giám sát — tạo tài khoản con + báo cáo điểm/thưởng`.

---

### Task 10: Build, deploy, verify

- [ ] **Step 1:** `rm -rf .next && npm run build` → `EXIT 0`, `.next/BUILD_ID` tồn tại. Verify route `/ekid/*` + `/api/ekid/*` đã đăng ký.
- [ ] **Step 2:** `git checkout main && git merge --ff-only dev && bash deploy.sh "feat(ekid-v2): phân hệ học riêng ekid.nooi.net + tài khoản con + thưởng"`.
- [ ] **Step 3: Verify production:**
  - `curl -s -o /dev/null -w "%{http_code}" https://ekid.nooi.net` → kỳ vọng 307 (redirect login) — **không còn 404**.
  - `curl https://ekid.nooi.net/ekid/login` → 200.
  - `curl https://nooi.net/app/ekid` → 307.
  - `sudo systemctl is-active nooi.service` → active.
- [ ] **Step 4:** Đảm bảo repo sạch, `main` đã push.

---

## Kiểm thử thủ công (cuối, Ngài An)

1. Đăng nhập `nooi.net` → `/app/ekid` → tạo con với username+password.
2. Mở `ekid.nooi.net` (ẩn danh) → đăng nhập bằng username+password của con → thấy thư viện bài → học → thi → xem thưởng.
3. Quay lại `nooi.net/app/ekid/report` → thấy điểm/huy hiệu của con.