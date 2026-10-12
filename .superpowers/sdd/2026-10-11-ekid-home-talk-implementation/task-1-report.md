# Task 1 — Báo cáo: Khối trò chuyện AI ở đầu trang chủ con

**Trạng thái:** HOÀN THÀNH ✅
**Nhánh:** `dev` (HEAD nền `6ee6eda`)

## Việc đã làm

### 1. Component mới `src/components/ekid/child/EkidTalkCard.tsx` (client)
- Props `{ kid: TalkKid; remaining: number }` với `TalkKid = { name, favorite_voice, placement_age_band, placement_level }`.
- `TalkKid.placement_age_band` kiểu `AgeBand | null` (type-safe với `BAND_VOICE`).
- Chọn giọng: `favorite_voice` nếu nằm trong 10 giọng VALID (`Puck, Charon, Kore, Fenrir, Aoede, Zephyr, Leda, Orus, Callirrhoe, Sulafat`), ngược lại `BAND_VOICE[ageBand ?? "mam-non"]`.
- `systemInstruction = buildSystemInstruction({ kidName, placement, lessonTopic: undefined, exercises: [] })` — phiên trò chuyện chung, không gắn bài.
- Render thẻ tiêu đề kiểu AI Mentor trong khung `KID.cardPad` (tông sáng): `🎙️ Bạn AI của {tên bé}` + phụ đề ngắn, chứa `<VoiceAssistant voice systemInstruction title={`Bạn AI của ${kid.name}`} />`.
- `remaining <= 0` → thay `VoiceAssistant` bằng thông báo `Hôm nay mình học đủ rồi, hẹn bé ngày mai nhé! 🌙` (role="status").

### 2. `src/app/ekid/page.tsx`
- Thêm state `remaining` (mặc định 30) + `useEffect` fetch `GET /api/ekid/session?kid_id=<kid.id>` khi có `kid`; fallback `kid.daily_limit_min ?? 30`. Có cờ `cancelled` chống set state sau unmount.
- Chèn `<EkidTalkCard …/>` **ngay đầu trang**, sau hàng tiêu đề "Thư viện của {tên bé}" và **trước** ô tìm kiếm/thư viện.
- Bỏ nút hero cũ `🎙️ Nói chuyện & học cùng bạn AI`, thay bằng link nhỏ `📚 Xem bài học` (anchor `#thu-vien` cuộn xuống thư viện).
- Thêm `id="thu-vien"` cho khối tìm kiếm + lưới bài học. **Giữ nguyên** toàn bộ thư viện bên dưới.

### 3. Theme trẻ
- Khung dùng `KID.cardPad`; phần thông báo hết giờ dùng màu hex tường minh (`#ffd93d`/`#fffbeb`/`#6b5648`).
- `VoiceAssistant` hiển thị hài hoà nhờ `.ekid-scope` trong `globals.css` đã override biến CSS (`--foreground`, `--card`, `--muted-foreground`, dải `*-400`…) sang tông sáng. **Không sửa component dùng chung.**

## Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ sạch (exit 0) |
| `npm run test` (vitest) | ✅ 85/85 pass, 6 file |
| `npm run lint` | ✅ không lỗi (chỉ warning cũ có sẵn ở file khác) |
| `npm run build` | ✅ PASS — route `/ekid` dựng thành công |

## Ràng buộc đã tuân thủ
- TS strict; tiếng Việt; tái dùng `VoiceAssistant`/`buildSystemInstruction` (không viết lại engine voice).
- Không đổi API (`/api/ekid/session` giữ nguyên); không migration.
- Không đụng `/hoc/[lessonId]` hay trang khác.

## File thay đổi
- `src/components/ekid/child/EkidTalkCard.tsx` (mới)
- `src/app/ekid/page.tsx` (sửa)
