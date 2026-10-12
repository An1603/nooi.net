# eKid v3.2 — Bố cục sân khấu + voice gọn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Spec:** `docs/superpowers/specs/2026-10-12-ekid-stage-layout-design.md`

## Global Constraints
- Nhánh `dev`; production = `main`; KHÔNG migration. TS strict; tiếng Việt; tông sáng khu con.

---

### Task 1: Sân khấu chủ đạo + voice dock gọn + tách trang bài học
**Files:** `src/components/voice/VoiceAssistant.tsx` (thêm `compact`), `src/components/ekid/child/InteractiveStage.tsx`, `src/components/ekid/child/useEkidInteractive.ts`, `src/components/ekid/child/EkidTalkScreen.tsx` (mới), `src/app/ekid/page.tsx`, `src/app/ekid/bai-hoc/page.tsx` (mới), `src/middleware.ts` (rewrite `/bai-hoc`).
- [ ] `VoiceAssistant` chế độ `compact`: nút mic tròn + trạng thái 1 dòng, bỏ tiêu đề lớn/tip; vẫn nhận `tools`/`onToolCall`/`hideTranscript`/`onTurnsChange`.
- [ ] `useEkidInteractive`: `current: InteractiveItem | null` (thay thế, không tích luỹ); giữ log turns đầy đủ.
- [ ] `InteractiveStage`: render **1 item** (`current`), tự vừa khung (object-contain, min-h theo viewport); bài tập giữ đúng/sai sau khi chọn; nội dung mới thay ngay.
- [ ] `EkidTalkScreen` (mới): bố cục — sân khấu (flex-1, chủ đạo) + **voice dock gọn** neo góc dưới-phải (mobile)/cạnh phải (desktop); nút "📚 Bài học"; trạng thái chờ khi chưa có nội dung; giữ lưu session/memory khi kết thúc (existing logic chuyển vào đây).
- [ ] `src/app/ekid/page.tsx`: chỉ render `EkidTalkScreen` (bỏ thư viện/tìm kiếm khỏi trang chủ).
- [ ] `src/app/ekid/bai-hoc/page.tsx` (mới): chuyển nguyên thư viện (tìm/lọc/lưới) từ trang chủ sang; middleware rewrite `/bai-hoc` → `/ekid/bai-hoc`.
- [ ] tsc + test + lint + build sạch. Commit.

---

### Task 2: Kiểm tra link media trước khi hiện
**Files:** `src/app/api/ekid/media/validate/route.ts` (mới), `src/components/ekid/child/useEkidInteractive.ts` / `InteractiveStage.tsx`.
- [ ] `GET /api/ekid/media/validate?url=`: auth (chủ hồ sơ hoặc tài khoản con → 403 nếu khác); validate scheme http/https; HEAD (fallback GET Range) → trả `{ ok, kind:"image"|"video"|null, contentType }`; YouTube → ok kind video. Timeout ~5s, không ném lỗi.
- [ ] Client: khi tool `show_media` → gọi validate TRƯỚC; chỉ render khi `ok`; nếu không → thông báo nhẹ trong sân khấu (không khung lỗi to).
- [ ] tsc + test + lint + build sạch. Commit.

---

### Task 3: Build, deploy, verify
- [ ] `npm run build` PASS; merge `dev`→`main` + `bash deploy.sh "..."`.
- [ ] Verify: `/` 307, `/bai-hoc` (307 khi chưa login), service active, repo sạch, push.

## Kiểm thử (Ngài An)
Trang chủ = sân khấu lớn + nút mic góc; AI hiện bài tập/ảnh/video → hiện giữa khung, nội dung mới thay nội dung cũ; bài học vào qua nút "📚 Bài học".