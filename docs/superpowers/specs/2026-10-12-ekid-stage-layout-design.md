# eKid v3.2 — Bố cục màn hình: sân khấu trình chiếu chủ đạo + voice gọn

**Bối cảnh:** v3.1 đã hiện được bài tập/ảnh/video (AI gọi công cụ OK) nhưng **bố cục chưa hợp lý**.

## Goal (Ngài An)
1. **Voice gọn lại** — đưa ra **góc/cạnh** màn hình; chỉ cần **nút mic nói/tắt** + trạng thái ngắn. Không chiếm diện tích.
2. **Sân khấu trình chiếu là CHỦ ĐẠO** — khu **cố định, phù hợp kích thước màn hình**; nội dung (bài tập/ảnh/video) **tự vừa khung**.
3. **Chỉ hiện nội dung hiện tại** — nói tới nội dung nào thì hiện nội dung đó; **ẩn nội dung trước** khi hiện nội dung sau. KHÔNG danh sách/lịch sử tràn lan, KHÔNG lặp.
4. **Kiểm tra link ảnh/video cho chuẩn mới hiện** — validate trước khi render; nếu không hợp lệ → không hiện (thông báo nhẹ). Có thể tạm lấy từ kho/nguồn sẵn cho nhanh; chuẩn hoá loại nội dung sau.
5. **Bài học ẩn vào trang/menu riêng** — trang chủ chỉ còn trò chuyện + trình chiếu; vào bài học khi cần.

## Thiết kế

### Bố cục trang chủ con (ekid.nooi.net/)
- **Sân khấu** (primary): vùng lớn chiếm phần lớn màn hình (flex-1, `min-h` theo viewport). Hiển thị **1 nội dung hiện tại**:
  - Chưa có gì → trạng thái chờ thân thiện ("Bấm mic để trò chuyện cùng thầy/cô AI").
  - Có nội dung → bài tập (trắc nghiệm) hoặc ảnh/video, **tự vừa khung** (object-contain, aspect phù hợp).
- **Voice dock** (gọn): neo **góc dưới-phải** (mobile) / **cạnh phải** (desktop) — chỉ gồm:
  - Nút **mic** lớn vừa đủ bấm (nói/tắt), chỉ báo trạng thái (đang nghe/đang nói/lỗi) rất ngắn.
  - KHÔNG tiêu đề lớn, KHÔNG tip, KHÔNG khối hội thoại.
- **Nút nhỏ** "📚 Bài học" → mở trang bài học riêng.

### Voice dock gọn
- Thêm chế độ `compact` cho `VoiceAssistant` (hoặc component `VoiceDock` dùng `useVoiceAssistant`): visualizer thu nhỏ (nút tròn), trạng thái 1 dòng ngắn; vẫn nhận `tools` + `onToolCall` + `hideTranscript`.

### Sân khấu 1 nội dung
- `useEkidInteractive`: đổi từ `items[]` tích luỹ → **`current: InteractiveItem | null`** (mỗi tool call **thay thế** nội dung cũ). Vẫn giữ log hội thoại đầy đủ để lưu session/memory.
- `InteractiveStage`: chỉ render `current`; bài tập giữ trạng thái đúng/sai sau khi bé chọn; nội dung mới thay thế ngay.

### Kiểm tra link media
- API mới **`GET /api/ekid/media/validate?url=`** (auth): server kiểm tra URL http/https + HEAD/GET-range → `{ ok, kind:"image"|"video"|null, contentType }` (chỉ chấp nhận content-type image/* hoặc video/*, hoặc YouTube).
- Client: khi AI gọi `show_media` → gọi validate trước; **chỉ render khi ok**; nếu không → thông báo nhẹ (không hiện khung lỗi to).

### Bài học riêng
- Chuyển thư viện bài học (hiện ở trang chủ) sang **`/ekid/bai-hoc`** (URL ngắn `/bai-hoc` rewrite như `/login`). Trang chủ bỏ thư viện, thêm nút "📚 Bài học".
- `/hoc/[lessonId]`, `/thi`, `/thuong` giữ nguyên (không hồi quy).

## Ràng buộc
- Nhánh `dev`; production = `main`; KHÔNG migration; TS strict; tiếng Việt; tông sáng khu con.
- Giữ nguyên luồng học/thi/thưởng + AI Mentor + hideTranscript.