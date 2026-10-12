# eKid v3.0 — Trò chuyện: ẩn hội thoại + lưu & biên tập thành bộ nhớ

**Goal (Ngài An):**
1. Phần nói chuyện **KHÔNG hiện khối hội thoại** (bong bóng chữ) — đã ẩn ở UI (`hideTranscript`).
2. Nội dung nói chuyện phải được **tổng hợp, biên tập lại và LƯU** để: (a) hiểu học sinh hơn; (b) làm **bộ nhớ** cho ngữ cảnh các buổi sau; (c) phục vụ **đánh giá học sinh sát nhất, cá nhân hóa nhất**.

## Hiện trạng
- `useVoiceAssistant` chỉ giữ `transcript` (câu bé nói) + `response` (AI) của **lượt hiện tại** — không có lịch sử.
- `EkidVoiceSession.finish()` gửi `transcript: []` → **hội thoại bị mất**.
- `EkidTalkCard` (trang chủ) không lưu gì.
- Schema: `ekid_sessions.transcript jsonb` + `ekid_sessions.ai_notes text` đã có; `ekid_kids` **chưa có cột bộ nhớ**.
- LLM server-side sẵn có: `GoogleGenAI` + `GEMINI_API_KEY`, model `gemini-2.5-flash` (mẫu ở `src/app/api/ai-mentor/chat/route.ts`).

## Thiết kế

### Bộ nhớ
- Thêm cột **`ekid_kids.memory text`** = bản tổng hợp **đã biên tập** (rolling): hiểu biết về bé (tính cách, sở thích, điểm mạnh/khó khăn, cảm xúc, tiến bộ), tiếng Việt, ngắn gọn, cập nhật dần mỗi buổi.
- `buildSystemInstruction` đã có tham số `recentNotes` → truyền `memory` để AI **nhớ ngữ cảnh**.

### Thu thập hội thoại
- `useVoiceAssistant`: tích luỹ **`turns: {role:"user"|"ai"; text:string}[]`** suốt phiên; trả về.
- `VoiceAssistant`: nhận `onTurnsChange?: (turns) => void` → báo lên cha mỗi khi có lượt mới.

### Lưu + biên tập (một lần khi kết thúc buổi)
- Client (EkidTalkCard + EkidVoiceSession): khi kết thúc (ẩn tab/đóng trang: `visibilitychange`→hidden, `pagehide`, hoặc nút "Kết thúc buổi học") → gửi **một lần** toàn bộ `turns` + số phút qua `fetch(..., { keepalive: true })` tới endpoint mới.
- Endpoint mới **`POST /api/ekid/kids/[kidId]/memory`** (quyền: chủ hồ sơ HOẶC chính tài khoản con):
  1. Validate; chèn 1 dòng `ekid_sessions` (lesson_id null/hoặc lesson nếu có, `transcript`=turns, `duration_min`, score nếu có bài).
  2. Cộng phút vào `ekid_daily` (đếm hạn mức ngày, mốc ngày VN).
  3. Gọi Gemini (`gemini-2.5-flash`) → **biên tập**: (a) `ai_notes` ngắn gọn cho buổi này; (b) cập nhật **`ekid_kids.memory`** (gộp memory cũ + buổi mới, viết lại mạch lạc, tiếng Việt).
  4. Trả `{ ok, ai_notes }`.
- `/api/ekid/library` trả thêm `memory` (để buildSystemInstruction dùng).

## Ràng buộc
- Nhánh `dev`; production = `main`; migration qua Management API.
- TS strict; tiếng Việt; KHÔNG chặn luồng nói nếu lưu lỗi (best-effort, im lặng).
- Không phá AI Mentor (dùng chung VoiceAssistant — thêm prop tùy chọn, mặc định giữ nguyên).