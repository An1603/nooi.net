# eKid v2.9 — Trang chủ con: khung trò chuyện AI ở đầu trang

**Goal (Ngài An):** `ekid.nooi.net/` (trang chủ con sau đăng nhập) hiển thị **khung trò chuyện với bạn AI ngay đầu trang** — kiểu như **NOOI AI Mentor** (`nooi.net/app/voice`) — **thư viện bài học ở dưới**.

## Hiện trạng
- `src/app/ekid/page.tsx` = thư viện bài học (tìm + lọc + lưới thẻ) + nút hero "🎙️ Nói chuyện & học cùng bạn AI" (dẫn vào `/hoc/[lessonId]`).
- `VoiceAssistant` (`src/components/voice/VoiceAssistant.tsx`) = UI voice dùng chung (visualizer + hội thoại + gợi ý).
- `EkidVoiceSession` (`src/components/ekid/EkidVoiceSession.tsx`) = VoiceAssistant + thẻ bài tập (dùng trong bài học); có `BAND_VOICE`, `buildSystemInstruction`.
- AI Mentor: header + khung lớn chứa `VoiceAssistant`.

## Thiết kế
1. **Thêm khối trò chuyện AI ở đầu trang chủ con** (trước ô tìm kiếm/thư viện):
   - Component mới `src/components/ekid/child/EkidTalkCard.tsx` (client): nhận `kid` (name, favorite_voice, placement_age_band, placement_level), `remaining`.
   - Render: thẻ tiêu đề kiểu AI Mentor ("🎙️ Bạn AI của {tên bé}" + phụ đề ngắn) chứa `<VoiceAssistant voice={...} systemInstruction={...} title={...} />`.
   - `voice` = `favorite_voice` nếu hợp lệ, ngược lại `BAND_VOICE[ageBand]`; `systemInstruction` = `buildSystemInstruction({ kidName, placement, lessonTopic: undefined, exercises: [] })` (phiên trò chuyện chung, không gắn bài).
   - Khi `remaining <= 0` → hiển thị thông báo "hôm nay học đủ rồi, hẹn ngày mai" thay cho VoiceAssistant (giống EkidVoiceSession).
2. **Trang chủ** (`src/app/ekid/page.tsx`): chèn `EkidTalkCard` lên đầu; **giữ nguyên thư viện** (tìm/lọc/lưới) bên dưới; bỏ nút hero cũ (không còn cần vì trò chuyện đã ngay trên trang) — hoặc giữ 1 link nhỏ "Xem bài học" cuộn xuống.
3. **Lấy `remaining`**: gọi `GET /api/ekid/session?kid_id=<kid.id>` (đã dùng ở trang `/hoc`), fallback `daily_limit_min`.
4. **Theme trẻ**: dùng `KID` tokens + scope sáng hiện có; đảm bảo `VoiceAssistant` hiển thị hài hoà trong tông sáng của khu con (nếu cần, bọc trong khung `KID` card).

## Ràng buộc
- Nhánh `dev`; production = `main`; KHÔNG migration, KHÔNG đổi API.
- TS strict; tiếng Việt; tái dùng `VoiceAssistant`/`buildSystemInstruction` (không viết lại engine voice).
- Không phá luồng học trong bài (`/hoc/[lessonId]`) và trang khác.