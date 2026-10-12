# eKid v3.1 — Tương tác đa phương thức — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Spec:** `docs/superpowers/specs/2026-10-12-ekid-interactive-design.md`

## Global Constraints
- Nhánh `dev`; production = `main`. TS strict; tiếng Việt; không phá AI Mentor.

---

### Task 1: Transport — khai báo tools + đẩy tool_call + gửi toolResponse
**Files:** `src/lib/voice/gemini-live.ts`, `src/components/voice/useVoiceAssistant.ts`, `src/components/voice/VoiceAssistant.tsx`.
- [ ] `gemini-live.ts`: `GeminiLiveConfig` thêm `tools?: unknown[]`; `sendSetupMessage()` gắn `setup.tools = [{ functionDeclarations: tools }]` khi có; thêm event `{ type: "tool_call"; data: { functionCalls: {id,name,args}[] } }` (bỏ console.log); giữ `sendToolResponse`.
- [ ] `useVoiceAssistant.ts`: nhận `tools?: unknown[]`; xử lý `tool_call` → gọi callback `onToolCall`; trả thêm `sendToolResponse`.
- [ ] `VoiceAssistant.tsx`: prop `tools?: unknown[]` + `onToolCall?: (calls: {id,name,args}[], respond: (res: {name,response}[]) => void) => void`; nối xuống hook. Mặc định không truyền → AI Mentor không đổi.
- [ ] tsc + test + lint sạch. Commit.

---

### Task 2: Lớp tương tác eKid (thẻ bài tập/ảnh/video)
**Files:** `src/lib/ekid/interactive.ts` (mới: tool declarations + build prompt mục "CÔNG CỤ"), `src/components/ekid/child/InteractiveStage.tsx` (mới), `src/components/ekid/child/EkidTalkCard.tsx`, `src/components/ekid/EkidVoiceSession.tsx`.
- [ ] `interactive.ts`: `EKID_TOOLS` (declarations cho `show_exercise`, `show_media`); hàm mô tả công cụ để chèn vào system instruction ("Bạn CÓ THỂ hiện bài tập/ảnh/video lên màn hình bằng công cụ…").
- [ ] `InteractiveStage.tsx`: nhận danh sách "item" (exercise | media) + `onResolve(itemId, result)`; render thẻ trắc nghiệm (chọn đáp án, hiện đúng/sai) và thẻ media (img/YouTube embed/mp4); hỗ trợ nhiều item (mới nhất nổi bật + lịch sử cuộn).
- [ ] `EkidTalkCard` + `EkidVoiceSession`: truyền `tools={EKID_TOOLS}` + `onToolCall` → tạo item từ `call.args` → render qua `InteractiveStage`; khi bé tương tác → `respond([{name, response}])` (vd `{chosen_index, correct}` / `{shown:true}`); ghi mỗi tool call + kết quả vào log hội thoại (đẩy vào turns với role đặc biệt hoặc metadata) để lưu vào session/memory.
- [ ] Bổ sung mô tả công cụ vào `buildSystemInstruction` (mục CÔNG CỤ) để AI biết khi nào dùng.
- [ ] tsc + test + lint + `npm run build` sạch. Commit.

---

### Task 3: Build, deploy, verify
- [ ] `npm run build` PASS; merge `dev`→`main` + `bash deploy.sh "..."`.
- [ ] Verify ekid.nooi.net 200/307; service active; repo sạch; push.
- [ ] Ghi chú cho Ngài An: cách kiểm (nói "cho con làm bài tập/ xem video/ xem hình" → nội dung hiện lên).