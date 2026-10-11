# eKid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây module eKid tại `/app/ekid` — AI live voice (Gemini Live) cho trẻ em, có hồ sơ tài khoản trẻ riêng, định vị cấp độ động (tuổi + test đầu vào + kết quả học), lưu lịch sử, giới hạn 25 phút/ngày, và liên kết người thân (cha/mẹ/người giám hộ).

**Architecture:** Tái sử dụng 100% hạ tầng Gemini Live có sẵn (`/api/voice/token`, `useVoiceAssistant`, `VoiceAssistant`, `VoiceVisualizer`, `gemini-live.ts`). Thêm 6 bảng Supabase + API routes + UI trang eKid. Bố cục: component `VoiceAssistant` nhận `systemInstruction` soạn theo định vị của trẻ; trang hiển thị `ExerciseCard` để bé chạm/nói đáp án.

**Tech Stack:** Next.js 15 (App Router), TypeScript strict, Supabase (Postgres + RLS), `@google/genai` (Gemini Live), Tailwind v4 + NOOI design tokens, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-11-ekid-design.md`

## Global Constraints

- **Nhánh:** làm việc trên nhánh `dev`, KHÔNG trực tiếp `main`. `git checkout dev && git pull origin dev`.
- **Supabase project ref:** `gsnuqrutiauhnsacgzym` (từ `.env.local`).
- **Migration:** áp dụng qua Supabase Management API — `POST https://api.supabase.com/v1/projects/gsnuqrutiauhnsacgzym/database/query`, header `Authorization: Bearer $SUPABASE_ACCESS_TOKEN` (đọc từ `~/.hermes/.env`). KHÔNG dùng CLI (VPS không có Docker).
- **Env vars:** `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` đã có trong `~/nooi.net/.env.local`. Không thêm env mới → không cần sửa `ecosystem.config.js`.
- **Font/UI:** KHÔNG dùng Tailwind generic colors (`bg-slate-*`, `text-white`) — dùng NOOI tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-glass`, `border-border`, `text-primary`). Nền page inline `style={{ background: '#1a0a2e' }}` vì Tailwind v4 bg-* có thể không resolve trên production.
- **Mobile:** lề 8px (`px-2`), nút hành động xếp dọc (`flex-col`) trên mobile.
- **TypeScript strict:** Record indexing dùng `as keyof typeof`; catch dùng `err: unknown`; `@ts-ignore` → `@ts-expect-error`.
- **Test:** `npm run test` (vitest, jsdom, setup `__tests__/setup.ts`, alias `@` → `./src`). Lint: `npm run lint`.
- **Build verify:** sau `npm run build` phải có `.next/BUILD_ID` (exit code 0 có thể vẫn fail).
- **Deploy:** `bash deploy.sh "msg"` (build → commit → push → `sudo systemctl restart nooi.service` → health check → purge CF cache). Verify cuối: `curl -s -o /dev/null -w "%{http_code}" https://nooi.net/ekid` = 200.
- **Ngôn ngữ:** mọi text UI + comment tiếng Việt. KHÔNG dùng ký tự Trung/Anh xen kẽ trong text hiển thị.

---

## File Structure

**Mới — DB/lib:**
- `supabase/migrations/20261011000001_ekid.sql` — 6 bảng + RLS + index
- `src/lib/ekid/ekid-system.ts` — logic thuần: tính tuổi→band, định vị động, giới hạn phút, mã liên kết, soạn system prompt
- `__tests__/ekid.test.ts` — test logic thuần của `ekid-system.ts`

**Mới — API routes:**
- `src/app/api/ekid/kids/route.ts` — GET (list con của user) / POST (tạo hồ sơ con) / PATCH (sửa) / DELETE
- `src/app/api/ekid/assessments/route.ts` — POST (lưu test đầu vào/hàng ngày → cập nhật placement)
- `src/app/api/ekid/session/route.ts` — POST (lưu phiên: transcript, exercises, cập nhật `ekid_daily`, checkout giới hạn phút)
- `src/app/api/ekid/lessons/route.ts` — GET (lesson active theo band)
- `src/app/api/ekid/caregivers/route.ts` — POST (tạo mã liên kết) / GET (tìm user theo tên/email + list người thân) / PATCH (accept/reject)

**Mới — Components:**
- `src/components/ekid/KidAvatar.tsx`
- `src/components/ekid/ExerciseCard.tsx`
- `src/components/ekid/DailyLimitBadge.tsx`
- `src/components/ekid/KidProgress.tsx`
- `src/components/ekid/RelativeLink.tsx`
- `src/components/ekid/EkidVoiceSession.tsx` — ghép `VoiceAssistant` + `ExerciseCard` + logic lưu phiên

**Mới — Pages:**
- `src/app/(dashboard)/app/ekid/page.tsx` — chọn con + phiên voice
- `src/app/(dashboard)/app/ekid/report/page.tsx` — báo cáo tiến độ
- `src/app/(dashboard)/app/ekid/relatives/page.tsx` — liên kết người thân

**Sửa:**
- `src/components/layout/Sidebar.tsx:22` — thêm link `{ label: 'eKid', href: '/app/ekid', icon: ... }`
- `src/app/(dashboard)/app/setup/page.tsx` — thêm bước "Tạo tài khoản cho con"

---

## Interfaces (dùng chung giữa các task)

```typescript
// src/lib/ekid/ekid-system.ts
export type AgeBand = "mam-non" | "tieu-hoc" | "thieu-nien";

export interface Placement {
  ageBand: AgeBand;      // định vị band HIỆN TẠI
  level: number;         // 1..N trong band
}

/** Tính tuổi từ ngày sinh (làm tròn xuống theo năm). */
export function calcAge(dob: string | Date, now?: Date): number;

/** Band khởi đầu theo tuổi (tuổi nhập), trước khi test chỉnh. */
export function initialBand(age: number): AgeBand;

/** Định vị động: kết hợp tuổi + điểm test đầu vào + lịch sử phiên. */
export function resolvePlacement(input: {
  dob: string | Date;
  entryTestPct?: number | null;   // 0..100 điểm test đầu vào
  recentGoodSessions?: number;    // số phiên điểm cao liên tiếp gần đây
}): Placement;

/** Còn bao nhiêu phút được học hôm nay. */
export function remainingMinutes(limitMin: number, usedMin: number): number;

/** Có được bắt đầu phiên mới không. */
export function canStartSession(limitMin: number, usedMin: number): boolean;

/** Mã liên kết 6 ký tự (A-Z0-9, bỏ ký tự dễ nhầm). */
export function generateLinkCode(): string;

/** System instruction cho Gemini Live theo trẻ. */
export function buildSystemInstruction(params: {
  kidName: string;
  placement: Placement;
  lessonTopic?: string | null;
  recentNotes?: string | null;    // ai_notes phiên gần nhất
  exercises?: EkidExercise[];
}): string;

export interface EkidExercise {
  question: string;
  image_url?: string | null;
  options: string[];
  answer_index: number;
  type: "chon-hinh" | "nghe-chon" | "dem" | "ke-chuyen";
}
```

**Giọng theo band (dùng `VoiceOption` từ `@/lib/voice/gemini-live`):**

```typescript
export const BAND_VOICE: Record<AgeBand, VoiceOption> = {
  "mam-non": "Leda",    // nữ ấm áp, trẻ trung
  "tieu-hoc": "Puck",   // nam vui tươi
  "thieu-nien": "Charon", // nam trầm ấm, tin cậy
};
```

---

### Task 1: Migration 6 bảng eKid + RLS

**Files:**
- Create: `supabase/migrations/20261011000001_ekid.sql`
- Verify: query Management API

**Interfaces:**
- Produces: bảng `ekid_kids`, `ekid_assessments`, `ekid_caregivers`, `ekid_lessons`, `ekid_sessions`, `ekid_daily` (schema theo spec mục 3).

- [ ] **Step 1: Viết file migration**

```sql
-- eKid: AI live voice cho trẻ em
CREATE TABLE IF NOT EXISTS public.ekid_kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '🦊',
  favorite_voice TEXT DEFAULT 'Leda',
  placement_age_band TEXT CHECK (placement_age_band IN ('mam-non','tieu-hoc','thieu-nien')),
  level INT NOT NULL DEFAULT 1,
  placement_level INT DEFAULT 1,
  daily_limit_min INT NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ekid_kids_user ON public.ekid_kids(user_id);

CREATE TABLE IF NOT EXISTS public.ekid_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('dau-vao','ngay')),
  band TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  band_after JSONB,
  kid_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ekid_assessments_kid ON public.ekid_assessments(kid_id);

CREATE TABLE IF NOT EXISTS public.ekid_caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  caregiver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('cha','me','nguoi-giam-ho')),
  status TEXT NOT NULL DEFAULT 'pending',
  link_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kid_id, caregiver_user_id)
);
CREATE INDEX IF NOT EXISTS idx_ekid_caregivers_kid ON public.ekid_caregivers(kid_id);

CREATE TABLE IF NOT EXISTS public.ekid_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age_band TEXT NOT NULL CHECK (age_band IN ('mam-non','tieu-hoc','thieu-nien')),
  title TEXT NOT NULL,
  part TEXT CHECK (part IN ('chung','rieng')),
  core_topic TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  difficulty INT DEFAULT 1,
  status TEXT DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS idx_ekid_lessons_band ON public.ekid_lessons(age_band, status);

CREATE TABLE IF NOT EXISTS public.ekid_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.ekid_lessons(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_min INT,
  transcript JSONB NOT NULL DEFAULT '[]',
  exercises_done JSONB NOT NULL DEFAULT '[]',
  score INT,
  ai_notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_ekid_sessions_kid ON public.ekid_sessions(kid_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.ekid_daily (
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  minutes_used INT NOT NULL DEFAULT 0,
  PRIMARY KEY (kid_id, day)
);

-- RLS
ALTER TABLE public.ekid_kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ekid_kids_owner" ON public.ekid_kids;
CREATE POLICY "ekid_kids_owner" ON public.ekid_kids
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ekid_lessons_read" ON public.ekid_lessons;
CREATE POLICY "ekid_lessons_read" ON public.ekid_lessons
  FOR SELECT TO authenticated USING (true);

-- caregiver đã linked đọc được dữ liệu con
DROP POLICY IF EXISTS "ekid_kids_caregiver_read" ON public.ekid_kids;
CREATE POLICY "ekid_kids_caregiver_read" ON public.ekid_kids
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.ekid_caregivers c
            WHERE c.kid_id = ekid_kids.id AND c.caregiver_user_id = auth.uid() AND c.status = 'linked')
  );
DROP POLICY IF EXISTS "ekid_sessions_access" ON public.ekid_sessions;
CREATE POLICY "ekid_sessions_access" ON public.ekid_sessions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.ekid_kids k WHERE k.id = ekid_sessions.kid_id AND k.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.ekid_caregivers c
               WHERE c.kid_id = ekid_sessions.kid_id AND c.caregiver_user_id = auth.uid() AND c.status = 'linked')
  );
DROP POLICY IF EXISTS "ekid_daily_access" ON public.ekid_daily;
CREATE POLICY "ekid_daily_access" ON public.ekid_daily
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.ekid_kids k WHERE k.id = ekid_daily.kid_id AND k.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.ekid_caregivers c
               WHERE c.kid_id = ekid_daily.kid_id AND c.caregiver_user_id = auth.uid() AND c.status = 'linked')
  );
DROP POLICY IF EXISTS "ekid_assessments_access" ON public.ekid_assessments;
CREATE POLICY "ekid_assessments_access" ON public.ekid_assessments
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.ekid_kids k WHERE k.id = ekid_assessments.kid_id AND k.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.ekid_caregivers c
               WHERE c.kid_id = ekid_assessments.kid_id AND c.caregiver_user_id = auth.uid() AND c.status = 'linked')
  );
-- caregivers: trẻ (chủ) và người thân liên quan đọc; ghi qua admin client
DROP POLICY IF EXISTS "ekid_caregivers_owner" ON public.ekid_caregivers;
CREATE POLICY "ekid_caregivers_owner" ON public.ekid_caregivers
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.ekid_kids k WHERE k.id = ekid_caregivers.kid_id AND k.user_id = auth.uid())
    OR caregiver_user_id = auth.uid()
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.ekid_kids k WHERE k.id = ekid_caregivers.kid_id AND k.user_id = auth.uid())
  );
```

- [ ] **Step 2: Áp dụng migration qua Management API**

```bash
cd ~/nooi.net
export $(grep -E '^SUPABASE_ACCESS_TOKEN' ~/.hermes/.env | xargs)
SQL=$(cat supabase/migrations/20261011000001_ekid.sql)
curl -s -X POST "https://api.supabase.com/v1/projects/gsnuqrutiauhnsacgzym/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data "$(python3 -c "import json,sys;print(json.dumps({'query':open('supabase/migrations/20261011000001_ekid.sql').read()}))")" | head -c 500
```
Expected: JSON không có `"message"` lỗi (trả `[]` hoặc kết quả rỗng).

- [ ] **Step 3: Verify bảng tồn tại**

```bash
export $(grep -E '^SUPABASE_ACCESS_TOKEN' ~/.hermes/.env | xargs)
curl -s -X POST "https://api.supabase.com/v1/projects/gsnuqrutiauhnsacgzym/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  --data '{"query":"SELECT table_name FROM information_schema.tables WHERE table_name LIKE '\''ekid%'\'' ORDER BY 1"}'
```
Expected: 6 bảng `ekid_assessments, ekid_caregivers, ekid_daily, ekid_kids, ekid_lessons, ekid_sessions`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20261011000001_ekid.sql
git commit -m "feat(ekid): migration 6 bảng + RLS"
```

---

### Task 2: Logic thuần `ekid-system.ts` (TDD)

**Files:**
- Create: `src/lib/ekid/ekid-system.ts`
- Test: `__tests__/ekid.test.ts`

**Interfaces:**
- Produces: `calcAge`, `initialBand`, `resolvePlacement`, `remainingMinutes`, `canStartSession`, `generateLinkCode`, `buildSystemInstruction`, `BAND_VOICE`, types `AgeBand`, `Placement`, `EkidExercise`.

- [ ] **Step 1: Viết test thất bại**

```typescript
import { describe, it, expect } from "vitest";
import {
  calcAge, initialBand, resolvePlacement, remainingMinutes,
  canStartSession, generateLinkCode, BAND_VOICE,
} from "@/lib/ekid/ekid-system";

describe("ekid — calcAge", () => {
  it("tính tuổi theo năm", () => {
    expect(calcAge("2019-05-01", new Date("2026-10-11"))).toBe(7);
  });
  it("chưa tới sinh nhật thì trừ 1", () => {
    expect(calcAge("2019-12-01", new Date("2026-10-11"))).toBe(6);
  });
});

describe("ekid — initialBand", () => {
  it("3-5 tuổi → mầm non", () => { expect(initialBand(4)).toBe("mam-non"); });
  it("6-10 tuổi → tiểu học", () => { expect(initialBand(8)).toBe("tieu-hoc"); });
  it("11-15 tuổi → thiếu niên", () => { expect(initialBand(13)).toBe("thieu-nien"); });
});

describe("ekid — resolvePlacement (định vị động)", () => {
  it("điểm test đầu vào cao → nâng band", () => {
    const p = resolvePlacement({ dob: "2019-05-01", entryTestPct: 95 });
    expect(p.ageBand).toBe("tieu-hoc");
    expect(p.level).toBeGreaterThan(1);
  });
  it("điểm test thấp → giữ band thấp hơn", () => {
    const p = resolvePlacement({ dob: "2019-05-01", entryTestPct: 20 });
    expect(p.ageBand).toBe("mam-non");
  });
  it("không có test → band theo tuổi", () => {
    expect(resolvePlacement({ dob: "2019-05-01" }).ageBand).toBe("tieu-hoc");
  });
});

describe("ekid — giới hạn phút", () => {
  it("remainingMinutes", () => { expect(remainingMinutes(25, 10)).toBe(15); });
  it("không âm", () => { expect(remainingMinutes(25, 40)).toBe(0); });
  it("canStartSession", () => {
    expect(canStartSession(25, 20)).toBe(true);
    expect(canStartSession(25, 25)).toBe(false);
  });
});

describe("ekid — generateLinkCode", () => {
  it("6 ký tự, chỉ A-Z0-9, không ký tự dễ nhầm", () => {
    const code = generateLinkCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
});

describe("ekid — BAND_VOICE", () => {
  it("có giọng cho cả 3 band", () => {
    expect(BAND_VOICE["mam-non"]).toBeTruthy();
    expect(BAND_VOICE["tieu-hoc"]).toBeTruthy();
    expect(BAND_VOICE["thieu-nien"]).toBeTruthy();
  });
});
```

- [ ] **Step 2: Chạy test cho chắc chắn fail**

Run: `npm run test -- ekid`
Expected: FAIL — "Cannot find module '@/lib/ekid/ekid-system'".

- [ ] **Step 3: Viết implementation tối thiểu**

```typescript
import type { VoiceOption } from "@/lib/voice/gemini-live";

export type AgeBand = "mam-non" | "tieu-hoc" | "thieu-nien";

export interface Placement {
  ageBand: AgeBand;
  level: number;
}

export interface EkidExercise {
  question: string;
  image_url?: string | null;
  options: string[];
  answer_index: number;
  type: "chon-hinh" | "nghe-chon" | "dem" | "ke-chuyen";
}

export const BAND_VOICE: Record<AgeBand, VoiceOption> = {
  "mam-non": "Leda",
  "tieu-hoc": "Puck",
  "thieu-nien": "Charon",
};

export const BAND_LABEL: Record<AgeBand, string> = {
  "mam-non": "Mầm non",
  "tieu-hoc": "Tiểu học",
  "thieu-nien": "Thiếu niên",
};

function asDate(d: string | Date): Date {
  return d instanceof Date ? d : new Date(d + "T00:00:00Z");
}

export function calcAge(dob: string | Date, now: Date = new Date()): number {
  const b = asDate(dob);
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export function initialBand(age: number): AgeBand {
  if (age <= 5) return "mam-non";
  if (age <= 10) return "tieu-hoc";
  return "thieu-nien";
}

const BAND_ORDER: AgeBand[] = ["mam-non", "tieu-hoc", "thieu-nien"];

export function resolvePlacement(input: {
  dob: string | Date;
  entryTestPct?: number | null;
  recentGoodSessions?: number;
}): Placement {
  const age = calcAge(input.dob);
  let idx = BAND_ORDER.indexOf(initialBand(age));

  // Test đầu vào chỉnh định vị (chỉ khi có điểm)
  if (input.entryTestPct != null) {
    if (input.entryTestPct >= 85 && idx < BAND_ORDER.length - 1) idx += 1; // vượt trội → lên band
    else if (input.entryTestPct < 30 && idx > 0) idx -= 1;                // yếu → xuống band
  }

  // Kết quả học gần đây
  let level = 1;
  const good = input.recentGoodSessions ?? 0;
  level += Math.floor(good / 3); // cứ 3 phiên tốt +1 level

  return { ageBand: BAND_ORDER[idx], level: Math.max(1, level) };
}

export function remainingMinutes(limitMin: number, usedMin: number): number {
  return Math.max(0, limitMin - usedMin);
}

export function canStartSession(limitMin: number, usedMin: number): boolean {
  return remainingMinutes(limitMin, usedMin) > 0;
}

export function generateLinkCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ I,O,0,1
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function buildSystemInstruction(params: {
  kidName: string;
  placement: Placement;
  lessonTopic?: string | null;
  recentNotes?: string | null;
  exercises?: EkidExercise[];
}): string {
  const { kidName, placement, lessonTopic, recentNotes, exercises } = params;
  const band = BAND_LABEL[placement.ageBand];
  const exLines = (exercises ?? [])
    .map((e, i) => `${i + 1}. ${e.question} (đáp án: ${e.options[e.answer_index]})`)
    .join("\n");

  return [
    `Bạn là "eKid" — người bạn AI thân thiết, vui vẻ của bé ${kidName}.`,
    `Bé đang ở trình độ: ${band}, cấp ${placement.level}.`,
    `Luôn nói tiếng Việt, giọng ấm áp, câu ngắn, dùng từ đơn giản phù hợp lứa tuổi.`,
    `Bạn CHỦ ĐỘNG trò chuyện: chào bé, hỏi bé muốn học gì, rồi mời bé làm bài tập.`,
    `Khen ngợi cụ thể khi bé đúng, động viên nhẹ nhàng khi bé sai, KHÔNG chê.`,
    lessonTopic ? `Chủ đề hôm nay: ${lessonTopic}.` : "",
    exLines ? `Các bài tập sẽ hiện trên màn hình (đọc câu hỏi cho bé nghe):\n${exLines}` : "",
    recentNotes ? `Ghi chú về bé từ buổi trước: ${recentNotes}` : "",
    `Mỗi khi ra bài, đọc to câu hỏi và các lựa chọn để bé chọn hoặc nói đáp án.`,
  ].filter(Boolean).join("\n");
}
```

- [ ] **Step 4: Chạy test cho pass**

Run: `npm run test -- ekid`
Expected: PASS toàn bộ.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ekid/ekid-system.ts __tests__/ekid.test.ts
git commit -m "feat(ekid): logic định vị động + system prompt + giới hạn phút (TDD)"
```

---

### Task 3: API `/api/ekid/kids`

**Files:**
- Create: `src/app/api/ekid/kids/route.ts`

**Interfaces:**
- Consumes: `createAdminClient()` từ `@/lib/supabase/admin`, `createClient()` từ `@/lib/supabase/server`.
- Produces: `GET` → `{ kids: EkidKid[] }`; `POST` body `{ name, date_of_birth, avatar_emoji?, favorite_voice? }` → `{ kid }`; `PATCH` body `{ id, ...fields }`; `DELETE` body `{ id }`.

- [ ] **Step 1: Viết route**

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { initialBand, resolvePlacement } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ekid_kids").select("*").eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kids: data ?? [] });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const body = await req.json();
  const { name, date_of_birth, avatar_emoji, favorite_voice } = body ?? {};
  if (!name || !date_of_birth) {
    return NextResponse.json({ error: "Thiếu tên hoặc ngày sinh" }, { status: 400 });
  }
  const placement = resolvePlacement({ dob: date_of_birth });
  const admin = createAdminClient();
  const { data, error } = await admin.from("ekid_kids").insert({
    user_id: user.id,
    name,
    date_of_birth,
    avatar_emoji: avatar_emoji || "🦊",
    favorite_voice: favorite_voice || null,
    placement_age_band: placement.ageBand,
    placement_level: placement.level,
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kid: data });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  delete fields.user_id;
  if (fields.date_of_birth) {
    const p = resolvePlacement({ dob: fields.date_of_birth });
    fields.placement_age_band = p.ageBand;
    fields.placement_level = p.level;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ekid_kids").update(fields).eq("id", id).eq("user_id", user.id)
    .select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kid: data });
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { id } = await req.json();
  const admin = createAdminClient();
  const { error } = await admin.from("ekid_kids").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

> Ghi chú: `createClient()` từ `@/lib/supabase/server` cần `await` (đọc lại file `src/lib/supabase/server.ts` để chắc chắn). Nếu repo trả về client đồng bộ, bỏ `await`.

- [ ] **Step 2: Lint + build kiểm tra type**

Run: `npm run lint 2>&1 | grep -i "ekid/kids" || echo "OK"`
Expected: OK (không lỗi ở file này).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ekid/kids/route.ts
git commit -m "feat(ekid): API CRUD hồ sơ trẻ"
```

---

### Task 4: API `/api/ekid/lessons` + seed bài mẫu

**Files:**
- Create: `src/app/api/ekid/lessons/route.ts`
- Create: `supabase/seed-ekid-lessons.sql`

**Interfaces:**
- Produces: `GET ?band=mam-non` → `{ lessons }`; seed 9 bài (3 band × 3).

- [ ] **Step 1: Viết route**

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const band = searchParams.get("band");
  const admin = createAdminClient();
  let q = admin.from("ekid_lessons").select("*").eq("status", "active")
    .order("difficulty", { ascending: true });
  if (band) q = q.eq("age_band", band);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lessons: data ?? [] });
}
```

- [ ] **Step 2: Viết file seed SQL (9 bài mẫu)**

```sql
INSERT INTO public.ekid_lessons (age_band, title, part, core_topic, system_prompt, exercises, difficulty)
VALUES
('mam-non','Bảng chữ cái A Ă Â','chung','Nhận biết chữ cái','Dạy bé nhận mặt chữ A, Ă, Â qua hình ảnh.',
 '[{"question":"Đây là chữ gì?","options":["A","B","C","D"],"answer_index":0,"type":"chon-hinh"},{"question":"Chữ nào có dấu mũ?","options":["A","Ă","E","I"],"answer_index":1,"type":"chon-hinh"}]',1),
('mam-non','Đếm số 1-5','chung','Đếm số lượng','Dạy bé đếm từ 1 đến 5 qua đồ vật.',
 '[{"question":"Có mấy quả táo?","options":["2","3","4","5"],"answer_index":2,"type":"dem"},{"question":"Số nào sau số 2?","options":["1","3","4","5"],"answer_index":1,"type":"nghe-chon"}]',1),
('tieu-hoc','Cộng trừ trong phạm vi 20','chung','Toán cơ bản','Dạy bé cộng trừ đơn giản.',
 '[{"question":"5 + 7 = ?","options":["11","12","13","10"],"answer_index":1,"type":"nghe-chon"},{"question":"15 - 6 = ?","options":["8","9","10","7"],"answer_index":1,"type":"nghe-chon"}]',2),
('tieu-hoc','Đọc hiểu đoạn ngắn','chung','Đọc hiểu','Đọc đoạn ngắn rồi hỏi nội dung.',
 '[{"question":"Con mèo trong bài màu gì?","options":["Đen","Trắng","Vàng","Xám"],"answer_index":1,"type":"chon-hinh"}]',2),
('thieu-nien','Tư duy logic','chung','Suy luận','Bài đố logic đơn giản cho thiếu niên.',
 '[{"question":"Nếu hôm nay thứ 3, 2 ngày nữa là thứ mấy?","options":["Thứ 4","Thứ 5","Thứ 6","Thứ 7"],"answer_index":1,"type":"nghe-chon"}]',3);
-- (mở rộng thêm bài cho đủ 3 band × 3 khi cần; tối thiểu 5 bài chạy được)
```

- [ ] **Step 3: Áp dụng seed qua Management API** (như Task 1 Step 2, đổi file sang seed).

- [ ] **Step 4: Verify**

```bash
export $(grep -E '^SUPABASE_ACCESS_TOKEN' ~/.hermes/.env | xargs)
curl -s -X POST "https://api.supabase.com/v1/projects/gsnuqrutiauhnsacgzym/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  --data '{"query":"SELECT age_band, count(*) FROM ekid_lessons GROUP BY 1 ORDER BY 1"}'
```
Expected: ≥3 nhóm band có bài.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ekid/lessons/route.ts supabase/seed-ekid-lessons.sql
git commit -m "feat(ekid): API lessons + seed bài mẫu"
```

---

### Task 5: API `/api/ekid/session` (lưu phiên + đối chiếu giới hạn phút)

**Files:**
- Create: `src/app/api/ekid/session/route.ts`

**Interfaces:**
- Consumes: `remainingMinutes`, `canStartSession` (Task 2).
- Produces: `POST` body `{ kid_id, lesson_id?, transcript, exercises_done, duration_min, ai_notes? }` → lưu `ekid_sessions` + cộng `ekid_daily.minutes_used`, trả `{ ok, minutes_used, remaining }`. `GET ?kid_id=` → trả phiên gần đây + số phút còn lại hôm nay.

- [ ] **Step 1: Viết route**

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { remainingMinutes } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

async function ownsKid(userId: string, kidId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("ekid_kids").select("id, daily_limit_min")
    .eq("id", kidId).eq("user_id", userId).maybeSingle();
  return data;
}

function todayStr() { return new Date().toISOString().split("T")[0]; }

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const kidId = new URL(req.url).searchParams.get("kid_id");
  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });
  const kid = await ownsKid(user.id, kidId);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  const admin = createAdminClient();
  const [{ data: sessions }, { data: daily }] = await Promise.all([
    admin.from("ekid_sessions").select("*").eq("kid_id", kidId)
      .order("started_at", { ascending: false }).limit(20),
    admin.from("ekid_daily").select("minutes_used").eq("kid_id", kidId).eq("day", todayStr()).maybeSingle(),
  ]);
  const used = daily?.minutes_used ?? 0;
  return NextResponse.json({
    sessions: sessions ?? [],
    minutes_used: used,
    remaining: remainingMinutes(kid.daily_limit_min, used),
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const body = await req.json();
  const { kid_id, lesson_id, transcript, exercises_done, duration_min, ai_notes } = body ?? {};
  if (!kid_id) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });
  const kid = await ownsKid(user.id, kid_id);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const admin = createAdminClient();
  const dur = Math.max(0, Math.round(duration_min ?? 0));

  // Cập nhật daily trước (upsert)
  const day = todayStr();
  const { data: existing } = await admin.from("ekid_daily")
    .select("minutes_used").eq("kid_id", kid_id).eq("day", day).maybeSingle();
  const newUsed = (existing?.minutes_used ?? 0) + dur;
  await admin.from("ekid_daily").upsert(
    { kid_id, day, minutes_used: newUsed }, { onConflict: "kid_id,day" }
  );

  const done = Array.isArray(exercises_done) ? exercises_done : [];
  const correct = done.filter((d: { correct?: boolean }) => d?.correct).length;
  const score = done.length ? Math.round((correct / done.length) * 100) : null;

  const { data, error } = await admin.from("ekid_sessions").insert({
    kid_id, lesson_id: lesson_id ?? null, ended_at: new Date().toISOString(),
    duration_min: dur, transcript: transcript ?? [], exercises_done: done, score, ai_notes: ai_notes ?? null,
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true, session: data, minutes_used: newUsed,
    remaining: remainingMinutes(kid.daily_limit_min, newUsed),
  });
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint 2>&1 | grep -i "ekid/session" || echo "OK"`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ekid/session/route.ts
git commit -m "feat(ekid): API lưu phiên học + giới hạn phút/ngày"
```

---

### Task 6: API `/api/ekid/assessments` + `/api/ekid/caregivers`

**Files:**
- Create: `src/app/api/ekid/assessments/route.ts`
- Create: `src/app/api/ekid/caregivers/route.ts`

**Interfaces:**
- Consumes: `resolvePlacement`, `generateLinkCode` (Task 2).
- Produces: assessments `POST { kid_id, step, items, score_pct }` → cập nhật placement, trả `{ placement }`. caregivers `POST { kid_id }` → tạo `link_code`; `GET ?q=` → tìm user; `PATCH { id, status }` → accept/reject.

- [ ] **Step 1: assessments route**

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolvePlacement } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { kid_id, step, items, score_pct } = await req.json();
  if (!kid_id || !step) return NextResponse.json({ error: "Thiếu kid_id/step" }, { status: 400 });
  const admin = createAdminClient();
  const { data: kid } = await admin.from("ekid_kids").select("*")
    .eq("id", kid_id).eq("user_id", user.id).maybeSingle();
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const placement = resolvePlacement({
    dob: kid.date_of_birth,
    entryTestPct: step === "dau-vao" ? (score_pct ?? null) : undefined,
    recentGoodSessions: step === "ngay" ? Math.max(0, kid.placement_level - 1) * 3 + 1 : undefined,
  });

  await admin.from("ekid_assessments").insert({
    kid_id, step, items: items ?? [],
    band_after: { ageBand: placement.ageBand, level: placement.level },
    kid_result: { score_pct: score_pct ?? null },
  });
  await admin.from("ekid_kids").update({
    placement_age_band: placement.ageBand, placement_level: placement.level,
  }).eq("id", kid_id);

  return NextResponse.json({ placement });
}
```

- [ ] **Step 2: caregivers route**

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateLinkCode } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const kidId = searchParams.get("kid_id");
  const q = searchParams.get("q");
  const admin = createAdminClient();

  if (q) {
    // tìm user theo tên/email (profiles + auth metadata)
    const { data: profiles } = await admin.from("profiles").select("user_id, full_name")
      .ilike("full_name", `%${q}%`).limit(10);
    return NextResponse.json({ users: profiles ?? [] });
  }
  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });
  const { data } = await admin.from("ekid_caregivers").select("*").eq("kid_id", kidId);
  return NextResponse.json({ caregivers: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { kid_id, caregiver_user_id, role } = await req.json();
  const admin = createAdminClient();
  const { data: kid } = await admin.from("ekid_kids").select("id")
    .eq("id", kid_id).eq("user_id", user.id).maybeSingle();
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  const { data, error } = await admin.from("ekid_caregivers").insert({
    kid_id,
    caregiver_user_id: caregiver_user_id ?? user.id,
    role: role || "nguoi-giam-ho",
    status: "pending",
    link_code: generateLinkCode(),
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ caregiver: data });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { id, status } = await req.json();
  const admin = createAdminClient();
  const { data, error } = await admin.from("ekid_caregivers")
    .update({ status: status === "linked" ? "linked" : "rejected" }).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ caregiver: data });
}
```

- [ ] **Step 3: Lint + Commit**

```bash
npm run lint 2>&1 | grep -i "ekid/assess\|ekid/careg" || echo "OK"
git add src/app/api/ekid/assessments/route.ts src/app/api/ekid/caregivers/route.ts
git commit -m "feat(ekid): API test định vị + liên kết người thân"
```

---

### Task 7: Components (KidAvatar, ExerciseCard, DailyLimitBadge, KidProgress, RelativeLink)

**Files:**
- Create: `src/components/ekid/KidAvatar.tsx`
- Create: `src/components/ekid/ExerciseCard.tsx`
- Create: `src/components/ekid/DailyLimitBadge.tsx`
- Create: `src/components/ekid/KidProgress.tsx`
- Create: `src/components/ekid/RelativeLink.tsx`

**Interfaces:**
- Consumes: `EkidExercise`, `AgeBand`, `BAND_LABEL` (Task 2).
- Produces: `KidAvatar({ emoji, size? })`; `ExerciseCard({ exercise, onAnswer, index })` gọi `onAnswer(correct: boolean)` khi bé chọn; `DailyLimitBadge({ remaining, limit })`; `KidProgress({ sessions })`; `RelativeLink({ kidId })`.

- [ ] **Step 1: KidAvatar**

```typescript
"use client";
export function KidAvatar({ emoji, size = 56 }: { emoji: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border border-border"
      style={{ width: size, height: size, fontSize: size * 0.55, background: "rgba(255,255,255,0.05)" }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
```

- [ ] **Step 2: ExerciseCard (bài tập hiển thị, bé chạm đáp án)**

```typescript
"use client";
import { useState } from "react";
import type { EkidExercise } from "@/lib/ekid/ekid-system";

export function ExerciseCard({
  exercise, index, onAnswer,
}: { exercise: EkidExercise; index: number; onAnswer: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  function choose(i: number) {
    if (done) return;
    setPicked(i);
    setDone(true);
    onAnswer(i === exercise.answer_index);
  }

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md p-4 sm:p-5">
      <p className="text-xs text-muted-foreground mb-1">Bài {index + 1}</p>
      <p className="text-base sm:text-lg font-medium text-foreground mb-3">{exercise.question}</p>
      {exercise.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={exercise.image_url} alt="" className="w-full max-w-xs rounded-xl mb-3 opacity-95" />
      )}
      <div className="grid grid-cols-2 gap-2">
        {exercise.options.map((opt, i) => {
          const isAns = i === exercise.answer_index;
          const bg = !done ? "bg-glass hover:bg-glass-hover"
            : isAns ? "bg-n-green/20 border-n-green/50"
            : i === picked ? "bg-destructive/20 border-destructive/50" : "bg-glass";
          return (
            <button key={i} onClick={() => choose(i)}
              className={`rounded-xl border border-border px-3 py-4 text-base font-medium text-foreground transition-colors ${bg}`}>
              {opt}
            </button>
          );
        })}
      </div>
      {done && (
        <p className={`mt-3 text-sm ${picked === exercise.answer_index ? "text-n-green" : "text-primary"}`}>
          {picked === exercise.answer_index ? "🌟 Giỏi quá! Chính xác rồi!" : `💛 Chưa đúng — đáp án là "${exercise.options[exercise.answer_index]}". Thử lại nhé!`}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: DailyLimitBadge**

```typescript
"use client";
export function DailyLimitBadge({ remaining, limit }: { remaining: number; limit: number }) {
  const low = remaining <= 5;
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${low ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground"}`}>
      <span aria-hidden>⏳</span>
      <span>Còn {remaining}/{limit} phút hôm nay</span>
    </div>
  );
}
```

- [ ] **Step 4: KidProgress**

```typescript
"use client";
export interface EkidSessionLite {
  id: string; started_at: string; duration_min: number | null;
  score: number | null; ai_notes: string | null;
}
export function KidProgress({ sessions }: { sessions: EkidSessionLite[] }) {
  if (!sessions.length) {
    return <p className="text-sm text-muted-foreground">Chưa có buổi học nào. Hãy bắt đầu nào!</p>;
  }
  return (
    <ul className="space-y-2">
      {sessions.map((s) => (
        <li key={s.id} className="rounded-xl border border-border bg-glass px-3 py-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{new Date(s.started_at).toLocaleDateString("vi-VN")}</span>
            <span>{s.duration_min ?? 0} phút{s.score != null ? ` · ${s.score}%` : ""}</span>
          </div>
          {s.ai_notes && <p className="text-foreground mt-1">{s.ai_notes}</p>}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: RelativeLink**

```typescript
"use client";
import { useState } from "react";
export function RelativeLink({ kidId }: { kidId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ user_id: string; full_name: string }[]>([]);
  const [role, setRole] = useState("cha");

  async function makeCode() {
    const r = await fetch("/api/ekid/caregivers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kid_id: kidId, role }),
    });
    const d = await r.json();
    if (d.caregiver?.link_code) setCode(d.caregiver.link_code);
  }
  async function search() {
    const r = await fetch(`/api/ekid/caregivers?q=${encodeURIComponent(q)}&kid_id=${kidId}`);
    const d = await r.json();
    setResults(d.users ?? []);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <select value={role} onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
          <option value="cha">Cha</option><option value="me">Mẹ</option><option value="nguoi-giam-ho">Người giám hộ</option>
        </select>
        <button onClick={makeCode} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          Tạo mã liên kết
        </button>
      </div>
      {code && (
        <p className="text-lg font-semibold text-primary">Mã liên kết: <span className="tracking-widest">{code}</span></p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên người thân..."
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
        <button onClick={search} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground">Tìm</button>
      </div>
      <ul className="space-y-1">
        {results.map((u) => (
          <li key={u.user_id} className="rounded-lg border border-border bg-glass px-3 py-2 text-sm text-foreground">
            {u.full_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: Lint + Commit**

```bash
npm run lint 2>&1 | grep -i "components/ekid" || echo "OK"
git add src/components/ekid/
git commit -m "feat(ekid): components (avatar, bài tập, giới hạn phút, tiến độ, liên kết người thân)"
```

---

### Task 8: Component `EkidVoiceSession` (ghép voice + bài tập + lưu phiên)

**Files:**
- Create: `src/components/ekid/EkidVoiceSession.tsx`

**Interfaces:**
- Consumes: `VoiceAssistant` (`@/components/voice/VoiceAssistant`), types từ Task 2, API `/api/ekid/session`.
- Produces: `EkidVoiceSession({ kid, lesson?, remaining, onFinish })`.

- [ ] **Step 1: Viết component**

```typescript
"use client";
import { useMemo, useState } from "react";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import { ExerciseCard } from "./ExerciseCard";
import type { VoiceOption } from "@/lib/voice/gemini-live";
import type { AgeBand, EkidExercise } from "@/lib/ekid/ekid-system";
import { BAND_VOICE, buildSystemInstruction } from "@/lib/ekid/ekid-system";

export interface EkidKidLite {
  id: string; name: string; favorite_voice: string | null;
  placement_age_band: AgeBand | null; placement_level: number | null;
}
export interface EkidLessonLite {
  id: string; core_topic: string; exercises: EkidExercise[]; system_prompt: string;
}

export function EkidVoiceSession({
  kid, lesson, remaining,
}: { kid: EkidKidLite; lesson?: EkidLessonLite; remaining: number }) {
  const exercises: EkidExercise[] = lesson?.exercises ?? [];
  const [results, setResults] = useState<{ i: number; correct: boolean }[]>([]);
  const startedRef = useMemo(() => Date.now(), []);

  const voice = (kid.favorite_voice as VoiceOption) || BAND_VOICE[kid.placement_age_band ?? "mam-non"];
  const systemInstruction = useMemo(() => buildSystemInstruction({
    kidName: kid.name,
    placement: { ageBand: kid.placement_age_band ?? "mam-non", level: kid.placement_level ?? 1 },
    lessonTopic: lesson?.core_topic,
    exercises,
  }), [kid, lesson, exercises]);

  function onAnswer(i: number, correct: boolean) {
    setResults((prev) => [...prev, { i, correct }]);
  }

  async function finish() {
    const duration = Math.round((Date.now() - startedRef) / 60000);
    await fetch("/api/ekid/session", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kid_id: kid.id, lesson_id: lesson?.id ?? null, duration_min: duration,
        transcript: [], exercises_done: results.map((r) => ({ exercise_id: r.i, correct: r.correct })),
      }),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <VoiceAssistant voice={voice} systemInstruction={systemInstruction} title={`Cùng học với ${kid.name}`} />
      {remaining <= 0 && (
        <p className="text-sm text-destructive">Hôm nay bé đã học đủ thời gian. Hẹn bé ngày mai nhé! 🌙</p>
      )}
      {exercises.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {exercises.map((ex, i) => (
            <ExerciseCard key={i} exercise={ex} index={i} onAnswer={(c) => onAnswer(i, c)} />
          ))}
        </div>
      )}
      <button onClick={finish} className="self-start rounded-xl bg-primary px-5 py-2.5 text-sm text-primary-foreground">
        Kết thúc buổi học
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Lint + Commit**

```bash
npm run lint 2>&1 | grep -i "EkidVoiceSession" || echo "OK"
git add src/components/ekid/EkidVoiceSession.tsx
git commit -m "feat(ekid): ghép phiên voice + bài tập + lưu phiên"
```

---

### Task 9: Page `/app/ekid` (chọn con + phiên học)

**Files:**
- Create: `src/app/(dashboard)/app/ekid/page.tsx`

**Interfaces:**
- Consumes: `/api/ekid/kids`, `/api/ekid/lessons`, `/api/ekid/session`, `EkidVoiceSession` (Task 8), `KidAvatar`, `DailyLimitBadge`.

- [ ] **Step 1: Viết page**

```typescript
"use client";
import { useEffect, useState } from "react";
import { KidAvatar } from "@/components/ekid/KidAvatar";
import { DailyLimitBadge } from "@/components/ekid/DailyLimitBadge";
import { EkidVoiceSession, type EkidKidLite, type EkidLessonLite } from "@/components/ekid/EkidVoiceSession";

export default function EkidPage() {
  const [kids, setKids] = useState<EkidKidLite[]>([]);
  const [selected, setSelected] = useState<EkidKidLite | null>(null);
  const [lesson, setLesson] = useState<EkidLessonLite | null>(null);
  const [remaining, setRemaining] = useState(25);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/ekid/kids");
      const d = await r.json();
      setKids(d.kids ?? []);
      setLoading(false);
    })();
  }, []);

  async function pick(kid: EkidKidLite) {
    setSelected(kid);
    const [l, s] = await Promise.all([
      fetch(`/api/ekid/lessons?band=${kid.placement_age_band ?? "mam-non"}`).then((r) => r.json()),
      fetch(`/api/ekid/session?kid_id=${kid.id}`).then((r) => r.json()),
    ]);
    setLesson((l.lessons ?? [])[0] ?? null);
    setRemaining(s.remaining ?? 25);
  }

  if (loading) return <div className="p-4 text-muted-foreground">Đang tải...</div>;

  if (!kids.length) {
    return (
      <div className="p-4" style={{ background: "#1a0a2e" }}>
        <h1 className="text-lg font-semibold text-foreground">eKid — Học cùng AI</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chưa có hồ sơ bé nào. Tạo tài khoản cho con trong phần Thiết lập hồ sơ.
        </p>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 space-y-4" style={{ background: "#1a0a2e" }}>
      <h1 className="text-lg font-semibold text-foreground">eKid — Học cùng AI</h1>
      {!selected ? (
        <div className="flex flex-wrap gap-3">
          {kids.map((k) => (
            <button key={k.id} onClick={() => pick(k)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card/70 px-5 py-4">
              <KidAvatar emoji="🦊" />
              <span className="text-sm font-medium text-foreground">{k.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <DailyLimitBadge remaining={remaining} limit={25} />
          <EkidVoiceSession kid={selected} lesson={lesson ?? undefined} remaining={remaining} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(dashboard)/app/ekid/page.tsx"
git commit -m "feat(ekid): trang chọn con + phiên học voice"
```

---

### Task 10: Page report + relatives + Sidebar link + mở rộng setup

**Files:**
- Create: `src/app/(dashboard)/app/ekid/report/page.tsx`
- Create: `src/app/(dashboard)/app/ekid/relatives/page.tsx`
- Modify: `src/components/layout/Sidebar.tsx:22`
- Modify: `src/app/(dashboard)/app/setup/page.tsx`

- [ ] **Step 1: report page**

```typescript
"use client";
import { useEffect, useState } from "react";
import { KidProgress, type EkidSessionLite } from "@/components/ekid/KidProgress";

export default function EkidReportPage() {
  const [sessions, setSessions] = useState<EkidSessionLite[]>([]);
  const [kidId, setKidId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const kr = await fetch("/api/ekid/kids").then((r) => r.json());
      const kid = (kr.kids ?? [])[0];
      if (!kid) return;
      setKidId(kid.id);
      const sr = await fetch(`/api/ekid/session?kid_id=${kid.id}`).then((r) => r.json());
      setSessions(sr.sessions ?? []);
    })();
  }, []);

  return (
    <div className="p-2 md:p-4 space-y-4" style={{ background: "#1a0a2e" }}>
      <h1 className="text-lg font-semibold text-foreground">Tiến độ học của bé</h1>
      <KidProgress sessions={sessions} />
      {kidId && (
        <a href="/app/ekid/relatives" className="text-sm text-primary underline">Liên kết người thân →</a>
      )}
    </div>
  );
}
```

- [ ] **Step 2: relatives page**

```typescript
"use client";
import { useEffect, useState } from "react";
import { RelativeLink } from "@/components/ekid/RelativeLink";

export default function EkidRelativesPage() {
  const [kidId, setKidId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const kr = await fetch("/api/ekid/kids").then((r) => r.json());
      setKidId((kr.kids ?? [])[0]?.id ?? null);
    })();
  }, []);
  return (
    <div className="p-2 md:p-4 space-y-4" style={{ background: "#1a0a2e" }}>
      <h1 className="text-lg font-semibold text-foreground">Liên kết người thân</h1>
      <p className="text-sm text-muted-foreground">Tạo mã liên kết gửi cho cha/mẹ/người giám hộ, hoặc tìm theo tên.</p>
      {kidId ? <RelativeLink kidId={kidId} /> : <p className="text-sm text-muted-foreground">Chưa có hồ sơ bé.</p>}
    </div>
  );
}
```

- [ ] **Step 3: Thêm link Sidebar**

Sửa `src/components/layout/Sidebar.tsx` — thêm dòng sau dòng `'/app/hoc-tap'`:
```typescript
{ label: 'eKid', href: '/app/ekid', icon: GraduationCap },
```
Thêm `GraduationCap` vào import từ `lucide-react` cùng chỗ các icon khác.

- [ ] **Step 4: Mở rộng `/app/setup`** — thêm khối "Tạo tài khoản cho con" vào cuối form (sau khi lưu profile người lớn thành công, hoặc thêm section riêng với nút POST `/api/ekid/kids`). Tối thiểu: thêm 3 trường (tên con, ngày sinh con, emoji) + nút gọi `POST /api/ekid/kids`.

```typescript
// trong component, thêm state và handler:
const [kidName, setKidName] = useState("");
const [kidDob, setKidDob] = useState("");
async function createKid() {
  const r = await fetch("/api/ekid/kids", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: kidName, date_of_birth: kidDob }),
  });
  const d = await r.json();
  if (d.kid) { setKidName(""); setKidDob(""); }
}
```
UI: 2 `<Input>` (tên con, ngày sinh) + `<Button onClick={createKid}>Tạo hồ sơ bé</Button>` — đặt trong khối mới ở trang `step === "done"`.

- [ ] **Step 5: Lint + Commit**

```bash
npm run lint 2>&1 | grep -iE "ekid|Sidebar|setup" || echo "OK"
git add "src/app/(dashboard)/app/ekid/" src/components/layout/Sidebar.tsx "src/app/(dashboard)/app/setup/page.tsx"
git commit -m "feat(ekid): trang report + liên kết người thân + link sidebar + setup tạo hồ sơ con"
```

---

### Task 11: Build, deploy, verify production

**Files:** none (verification)

- [ ] **Step 1: Full build — verify BUILD_ID**

```bash
cd ~/nooi.net && rm -rf .next && npm run build; echo "EXIT: $?"; ls .next/BUILD_ID && echo "BUILD OK" || echo "BUILD FAILED"
```
Expected: `EXIT: 0`, `BUILD OK`. Nếu có "Failed to compile" → sửa hết ESLint/TS error rồi build lại.

- [ ] **Step 2: Deploy**

```bash
bash deploy.sh "feat(ekid): module AI live voice cho trẻ — Gemini Live"
```
Expected: local HTTP 200 + production HTTP 200 + CF purge OK.

- [ ] **Step 3: Verify production**

```bash
curl -s -o /dev/null -w "nooi.net/ekid: %{http_code}\n" https://nooi.net/ekid
sudo systemctl is-active nooi.service
```
Expected: `200` và `active`.

- [ ] **Step 4: Verify API trả dữ liệu** (đăng nhập bằng account test rồi mở `/app/ekid`, hoặc kiểm tra route trả 401 khi chưa login):

```bash
curl -s -o /dev/null -w "api/kids: %{http_code}\n" https://nooi.net/api/ekid/kids
```
Expected: `401` (chưa đăng nhập) — xác nhận route tồn tại và auth guard hoạt động.

- [ ] **Step 5: Commit (nếu còn file dư) + verify repo sạch**

```bash
git status --short
git add -A && git commit -m "chore(ekid): hoàn tất triển khai" || true
git push
```

---

## Lưu ý thực thi

- **Nhánh:** mọi task chạy trên `dev`; merge `dev`→`main` chỉ khi Ngài An xác nhận (hoặc deploy theo pattern repo: deploy.sh đẩy thẳng — kiểm tra thói quen repo trước).
- **Ngài An KHÔNG nhận file đính kèm trong chat** — chỉ báo đường dẫn tài liệu trong vault/repo.
- **RLS:** server routes dùng `createAdminClient()` để tránh RLS trap khi query cross-user; client pages dùng API routes (không query Supabase trực tiếp cho dữ liệu nhạy cảm).
- **Chi phí:** mỗi phiên 25 phút ≈ $0.02 — trong ngân sách $100/tháng.
