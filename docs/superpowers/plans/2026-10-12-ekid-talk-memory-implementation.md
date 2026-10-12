# eKid v3.0 — Lưu & biên tập hội thoại thành bộ nhớ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Spec:** `docs/superpowers/specs/2026-10-12-ekid-talk-memory-design.md`

## Global Constraints
- Nhánh `dev`; production = `main`. TS strict; tiếng Việt; NOOI tokens.
- Migration Supabase qua **Management API** (dòng CUỐI `SUPABASE_ACCESS_TOKEN` trong `~/.hermes/.env`).
- Best-effort: lỗi lưu/LLM KHÔNG được chặn phần nói chuyện.

---

### Task 1: Migration + API lưu/biên tập bộ nhớ
**Files:** `supabase/migrations/20261012000001_ekid_kid_memory.sql` (mới), `src/app/api/ekid/kids/[kidId]/memory/route.ts` (mới), `src/app/api/ekid/library/route.ts`.
- [ ] Migration: `ALTER TABLE ekid_kids ADD COLUMN IF NOT EXISTS memory text;` — áp bằng Management API, verify live.
- [ ] `POST /api/ekid/kids/[kidId]/memory`: auth 401; quyền chủ hồ sơ HOẶC `child_user_id=user.id` (khác caregiver) → 403 nếu không. Body `{ turns: {role,text}[], duration_min?, lesson_id?, exercises_done? }`. Chèn `ekid_sessions` (transcript=turns, duration, score như session route), cộng `ekid_daily` (mốc `vnDayString`). Gọi `gemini-2.5-flash` (GEMINI_API_KEY, `GoogleGenAI`) với prompt biên tập tiếng Việt → `ai_notes` + memory mới; update `ekid_kids.memory`. Trả `{ ok, ai_notes }`. (Nếu turns rỗng → bỏ qua, trả ok.)
- [ ] `GET /api/ekid/library`: thêm `memory` vào `safeKid` trả về.
- [ ] tsc + test + lint sạch. Commit.

---

### Task 2: Thu thập hội thoại + lưu khi kết thúc (frontend)
**Files:** `src/components/voice/useVoiceAssistant.ts`, `src/components/voice/VoiceAssistant.tsx`, `src/components/ekid/child/EkidTalkCard.tsx`, `src/components/ekid/EkidVoiceSession.tsx`, `src/components/ekid/child/types.ts` (nếu cần `memory`).
- [ ] `useVoiceAssistant`: tích luỹ `turns: {role,text}[]` (commit lượt user khi AI bắt đầu trả lời; commit lượt AI khi kết thúc/đổi lượt); trả về `turns`.
- [ ] `VoiceAssistant`: prop `onTurnsChange?: (turns: {role:"user"|"ai";text:string}[]) => void` — gọi khi `turns` đổi.
- [ ] `EkidTalkCard`: nhận thêm `kid.id` + `memory`; truyền `recentNotes: memory` vào `buildSystemInstruction`; lưu turns; khi `visibilitychange`→hidden/`pagehide` → `fetch('/api/ekid/kids/'+kid.id+'/memory', {method:'POST', keepalive:true, ...})` gửi toàn bộ turns + minutes (một lần). Im lặng nếu lỗi.
- [ ] `EkidVoiceSession.finish()`: gửi **transcript thật** (turns) thay `[]` (dùng endpoint session hiện có hoặc memory route).
- [ ] `src/app/ekid/page.tsx`: truyền `id` + `memory` cho `EkidTalkCard`.
- [ ] tsc + test + lint + `npm run build` sạch. Commit.

---

### Task 3: Build, deploy, verify
- [ ] `npm run build` PASS; merge `dev`→`main` + `bash deploy.sh "..."`.
- [ ] Verify: `/api/ekid/kids/[id]/memory` 401 anon; `ekid.nooi.net` 200/307; service active.
- [ ] Repo sạch, push.