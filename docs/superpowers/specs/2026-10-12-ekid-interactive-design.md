# eKid v3.1 — Tương tác đa phương thức trong phiên trò chuyện

**Goal (Ngài An):** trong lúc nói chuyện với AI, AI có thể **chủ động hiện nội dung lên màn hình** để bé thực hành/quan sát **đồng thời với hội thoại**:
1. **Bài tập** — hiện câu hỏi trắc nghiệm, bé chọn/trả lời ngay, AI chấm & phản hồi.
2. **Video** — phát video minh hoạ.
3. **Trình chiếu / ảnh** — hiện ảnh hoặc trang minh hoạ.
- Nguồn nội dung: **AI tự chọn hoặc dùng bất kỳ link nào** để minh hoạ (chuẩn hoá nội dung sau). Nội dung đã hiện cần **ghi log** để Ngài An chuẩn hoá về sau.

## Cơ chế
- Gemini Live API hỗ trợ **function calling**. Hạ tầng đã có: `GeminiLiveClient.sendToolResponse()` + bắt `msg.toolCall` (chưa xử lý). Thiếu: **khai báo tools** trong setup + **đẩy tool_call lên UI** + **gửi toolResponse**.
- Luồng: AI gọi `show_exercise`/`show_media` → client render thẻ tương tác → bé tương tác → client gửi `toolResponse` (kết quả) → AI phản hồi bằng giọng.

## Công cụ (function declarations)
- `show_exercise(question: string, options: string[], answer_index?: number, kind?: string)`
  → thẻ trắc nghiệm; bé chọn → trả `{ chosen_index, correct? }`.
- `show_media(url: string, kind: "image"|"video", caption?: string)`
  → ảnh (`<img>`) hoặc video (YouTube → embed; mp4 → `<video>`); trả `{ shown: true }`.

## UI
- Vùng nội dung tương tác hiển thị cạnh/trên visualizer (kính thước lớn, tông sáng khu con), tự cuộn tới khi có nội dung mới.
- Bé có thể tương tác (chạm chọn đáp án) **trong khi vẫn nói chuyện**.
- Nhiều nội dung liên tiếp → hiện lần lượt (giữ 1-2 thẻ gần nhất + lịch sử cuộn).

## Ghi log
- Mỗi tool call (bài tập/ảnh/video) + kết quả bé tương tác được thêm vào log hội thoại → lưu vào `ekid_sessions.transcript`/`memory` (đã có) để chuẩn hoá nội dung sau.

## Persona & xưng hô (Ngài An yêu cầu)
- AI **tự xưng là "thầy AI" / "cô AI"** (hoặc một tên thân thiện được đặt) — gần gũi, KHÔNG xưng "tôi"/"mình" lạnh lùng. Giữ nhất quán trong suốt buổi.
- **Gọi học sinh theo lứa tuổi**:
  - `mam-non` (≤5 tuổi) → gọi **"con"** (có thể "bé"), câu rất ngắn.
  - `tieu-hoc` (≤10 tuổi) → gọi **"con"** (hoặc "em").
  - `thieu-nien` (>10 tuổi) → gọi **"em"** (hoặc "bạn").
  - Thỉnh thoảng gọi tên bé để thân mật. TUYỆT ĐỐI không dùng từ xưng hô suồng sã/thiếu tôn trọng.
- Áp dụng cho **mọi phiên** (trang chủ con + trong bài học).

## Ràng buộc
- Nhánh `dev`; production = `main`; không migration mới (dùng cột sẵn có).
- TS strict; tiếng Việt; KHÔNG phá AI Mentor (tính năng tùy chọn, chỉ bật cho eKid).
- Nếu model Live không hỗ trợ tool call → ghi nhận để chuyển sang phương án chỉ thị văn bản (fallback), nhưng ưu tiên đường tool native.