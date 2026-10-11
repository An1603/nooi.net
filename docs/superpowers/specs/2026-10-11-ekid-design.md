# eKid — Người bạn AI NỐI cho con trẻ (nooi.net/ekid)

**Ngày:** 2026-10-11 · **Trạng thái:** Chờ duyệt từ Ngài An

## 1. Mục tiêu (đã chốt với Ngài An)

- Trẻ em giao tiếp, học tập bằng **AI live voice (Gemini Live)** — hai chiều, ngắt lời được.
- **Lịch sử hội thoại + bài tập được lưu lại** để phụ huynh xem tiến độ.
- **AI chủ động hỏi, ra bài tập hiển thị trên màn hình** (bé trả lời bằng giọng nói HOẶC chạm/bấm đáp án hình ảnh).
- **Lộ trình chuẩn hóa**: phần chung (kiến thức cốt lõi theo lứa) + phần riêng (cá nhân hóa theo từng bé).
- **Phân lứa tự động theo năm sinh** (`profiles.date_of_birth` đã có sẵn).
- **Định vị cấp độ ĐỘNG**: tuổi nhập chỉ là điểm khởi đầu → **test đầu vào** (assessment lúc tạo hồ sơ) + **kết quả học hàng ngày** (từ `ekid_sessions`) cập nhật liên tục định vị/level cho trẻ → bé luôn được dạy ở mức phù hợp nhất.
- **Trẻ có tài khoản login RIÊNG** (`auth.users`). Trong tài khoản trẻ có mục **Liên kết người thân**: nhập **mã liên kết** HOẶC **tìm kiếm** cha/mẹ/người giám hộ → liên kết để thuận tiện thanh toán cho con sau này.
- **Phụ huynh tạo hồ sơ con ngay trong flow onboarding** (mở rộng `/app/setup`).
- **Giới hạn 20-30 phút/con/ngày** — quản lý thói quen + chi phí Gemini.

## 2. Phân lứa KHỞI ĐẦU theo năm sinh

`ekid_kids.date_of_birth` → tự tính `age` → lứa khởi đầu (rồi bị test đầu vào + kết quả học chỉnh lại):

| Lứa | Độ tuổi | Màu sắc | Giọng đề xuất | Trọng tâm |
|-----|--------|--------|--------------|----------|
| **Mầm non** | 3-5 | 🍎 Vàng-hồng | **Leda / Aoede** (nữ ấm áp) | Chữ cái, số đếm, con vật, màu sắc, truyện ngắn |
| **Tiểu học** | 6-10 | 🚀 Xanh-tím | **Puck / Kore** | Chữ số, đọc hiểu, tư duy toán, tiếng Anh cơ bản |
| **Thiếu niên** | 11-15 | 🌟 Tím-vàng | **Charon / Sulafat** | Tư duy, khoa học, dự án, định hướng |

> Phần **chung**: chương trình theo lứa (giống cho mọi bé cùng lứa). Phần **riêng**: cá nhân hóa theo tiến độ + sở thích từ `ekid_sessions` trước.

## 3. Schema (Supabase — 5 bảng)

### `ekid_kids` — hồ sơ trẻ (1 trẻ = 1 tài khoản login riêng)
```sql
CREATE TABLE public.ekid_kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- chính là tài khoản của TRẺ
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '🦊',
  favorite_voice TEXT DEFAULT 'Leda',      -- giọng Gemini Live
  placement_age_band TEXT CHECK (placement_age_band IN ('mam-non','tieu-hoc','thieu-nien')), -- định vị HIỆN TẠI (động)
  level INT NOT NULL DEFAULT 1,
  placement_level INT DEFAULT 1,           -- cấp độ chi tiết trong lứa (định vị động)
  daily_limit_min INT NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `ekid_assessments` — test đầu vào + cập nhật định vị
```sql
CREATE TABLE public.ekid_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES ekid_kids(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('dau-vao','ngay')),
  band TEXT,                       -- band gợi ý (đầu vào)
  items JSONB NOT NULL DEFAULT '[]', -- [{q, answer, correct}]
  band_after JSONB,                -- → cập nhật placement_age_band + placement_level
  kid_result JSONB,                -- điểm/level mới
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `ekid_caregivers` — liên kết người thân (cha/mẹ/người giám hộ)
```sql
CREATE TABLE public.ekid_caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES ekid_kids(id) ON DELETE CASCADE,
  caregiver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('cha','me','nguoi-giam-ho')),
  status TEXT NOT NULL DEFAULT 'pending',  -- pending → linked (phụ huynh nhập/xác nhận)
  link_code TEXT,                         -- mã liên kết 6 ký tự (echo trao cho người thân)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kid_id, caregiver_user_id)
);
```

### `ekid_lessons` — kho lộ trình chuẩn hóa
```sql
CREATE TABLE public.ekid_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age_band TEXT NOT NULL CHECK (age_band IN ('mam-non','tieu-hoc','thieu-nien')),
  title TEXT NOT NULL,
  part TEXT CHECK (part IN ('chung','rieng')),
  core_topic TEXT NOT NULL,               -- chủ đề chốt, AI phải bám
  system_prompt TEXT NOT NULL,            -- instruction riêng cho bài
  exercises JSONB NOT NULL DEFAULT '[]',  -- [{question, image_url, options[], answer_index, type}]
  difficulty INT DEFAULT 1,
  status TEXT DEFAULT 'active'
);
```

### `ekid_sessions` — lịch sử hội thoại + bài tập (đầy đủ)
```sql
CREATE TABLE public.ekid_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES ekid_kids(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES ekid_lessons(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_min INT,
  transcript JSONB NOT NULL DEFAULT '[]',  -- [{role, text, ts, exercise_id?}]
  exercises_done JSONB NOT NULL DEFAULT '[]', -- [{exercise_id, kid_answer, correct, ai_comment, ts}]
  score INT,
  ai_notes TEXT                            -- tóm tắt AI về bé (phần riêng)
);
```

### `ekid_daily` — giới hạn phút/ngày
```sql
CREATE TABLE public.ekid_daily (
  kid_id UUID NOT NULL REFERENCES ekid_kids(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  minutes_used INT NOT NULL DEFAULT 0,
  PRIMARY KEY (kid_id, day)
);
```

### RLS (mọi bảng áp dụng chung)
```sql
-- ekid_kids: chủ tài khoản trẻ đọc/sửa con mình
ALTER TABLE ekid_kids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tre-quan-ly-ho-so-con" ON ekid_kids
  FOR ALL TO authenticated USING (user_id = auth.uid());
-- ekid_caregivers: trẻ xem người thân liên kết + người thân đã linked thấy con
-- ekid_assessments/sessions/daily: trẻ + caregiver đã linked được đọc
-- ekid_lessons: mọi authenticated đọc (chung+riêng đều là nội dung)
```

## 4. Luồng chính (kịch bản "AI chủ động")

```
Phụ huynh đăng ký tài khoản nooi → /app/setup (THÊM bước "Tạo tài khoản cho con" → tạo ekid_kids
   → con có login riêng: email con / email phụ huynh, tên con, ngày sinh, test đầu vào định vị)
→ Trẻ đăng nhập tài khoản CON → /app/ekid → chọn con → Bấm 🎤 → voice Gemini Live (tái sử dụng pipeline có sẵn)
→ Params: placement_age_band (định vị ĐỘNG: tuổi + assessment + kết quả hàng ngày) + systemInstruction (riêng eKid)
→ AI chủ động chào → RA bài (chữ/hình hiện màn hình) → bé trả lời giọng nói/chạm
→ AI đánh giá → lưu ekid_sessions (transcript + exercises_done) + ekid_daily.minutes
→ Sau mỗi phiên: cập nhật placement_level/placement_age_band theo kết quả (ekid_assessments.step='ngay')
→ Giới hạn 25 phút/ngày → 30 phút nữa ai cũng dừng, hẹn mai
→ /app/ekid/relatives → tạo mã liên kết & tìm kiếm cha/mẹ/người giám hộ → gắn (để thanh toán cho con)
→ /app/ekid/report → chủ tài khoản trẻ + caregiver đã linked xem tiến độ từng con
```

## 5. Component & Route (tái sử dụng toàn bộ voice pipeline hiện có)

| File mới | Nội dung |
|---|---|
| `src/app/(dashboard)/app/ekid/page.tsx` | Chọn con + nhúng `VoiceAssistant` (với `systemInstruction` soạn riêng theo định vị/con) + `ExerciseCard` hiển thị bài tập |
| `src/app/(dashboard)/app/ekid/report/page.tsx` | Báo cáo tiến độ (đọc từ `ekid_sessions`, `ekid_daily`) — trẻ + caregiver đã linked xem |
| `src/app/(dashboard)/app/ekid/relatives/page.tsx` | **Liên kết người thân**: tạo mã liên kết (ký tự) + tìm kiếm cha/mẹ/người giám hộ → gửi lời mời → chấp nhận |
| `src/app/(dashboard)/app/setup/ekid.ts` | Mở rộng `/app/setup`: tạo **tài khoản con** (login riêng) + test đầu vào định vị |
| `src/app/api/ekid/kids/route.ts` | CRUD `ekid_kids` (server, admin client) |
| `src/app/api/ekid/assessments/route.ts` | POST test đầu vào + cập nhật `placement_age_band`/`placement_level` |
| `src/app/api/ekid/caregivers/route.ts` | Tạo mã liên kết, tìm kiếm user, accept/reject liên kết |
| `src/app/api/ekid/session/route.ts` | POST kết thúc → lưu `ekid_sessions` + cập nhật `ekid_daily` + giới hạn phút/ngày |
| `src/app/api/ekid/lessons/route.ts` | GET lesson active theo age_band; admin CRUD qua hệ thống admin có sẵn |
| `src/lib/ekid/ekid-system.ts` | Hàm tính tuổi → band khởi đầu, tổng hợp định vị động (tuổi+assessment+kết quả), tạo mã liên kết, soạn `systemPrompt` (chung+riêng), checkout giới hạn phút |
| `src/components/ekid/` | `KidAvatar.tsx`, `ExerciseCard.tsx`, `KidProgress.tsx`, `DailyLimitBadge.tsx`, `RelativeLink.tsx`, `AssessmentIntro.tsx` |

### Tái sử dụng (KHÔNG viết lại):
- `/api/voice/token` ✅ (đã hoạt động)
- `useVoiceAssistant` + `VoiceAssistant` + `VoiceVisualizer` ✅ (chỉ truyền `systemInstruction` + `voice`)
- `components/ui/*` (Button, Input, Label...)
- `createAdminClient()` cho dữ liệu server-side cross-user

## 6. Khi chạy (AI sinh "phần riêng")

- Mỗi bài: `system_prompt` (phần chung) + đoạn prompt nói rõ với AI về lịch sử `ekid_sessions` lọc theo kid (sở thích, lỗi hay gặp, điểm) → AI tự điều chỉnh khó/dễ, nội dung cho bé riêng.
- **Định vị động** gồm 3 thành phần (`ekid-system.ts` tổng hợp):
  1. Tuổi nhập → band khởi đầu
  2. Kết quả test đầu vào (`ekid_assessments.step='dau-vao'`) → band/level tinh chỉnh
  3. Kết quả học hàng ngày (`ekid_sessions` + `ekid_daily`) → cứ mỗi N phiên TỐT, AI nâng level; TỆ thì giữ/hạ
  → `placement_age_band` + `placement_level` luôn là chỗ AI đọc để chọn bài phù hợp nhất.
- **Liên kết người thân**: tài khoản trẻ tạo mã 6 ký tự (`ekid_caregivers.link_code`) → cha/mẹ/giám hộ nhập mã để gắn kèm role; hoặc tìm kiếm theo tên/email → gửi lời mời → người nhận chấp nhận → `status='linked'`. Nhiều người thân (cha, mẹ, ông bà) cùng 1 con.

## 7. Chi phí & kế hoạch

| Hạng mục | Ước tính |
|---|---|
| Gemini Live Flash (âm thanh hai chiều) | ~$0.0006/phút → ~$0.02/con/phiên 25 phút |
| 10 con × 25 phút/ngày | ~$6/tháng |

Phần thanh toán cho con qua người thân liên kết — triển khai ở vòng 2 (khi có gói cước), vòng 1 chỉ gắn quan hệ + mở được đường trả. 

## 8. Triển khai

Quy trình `deploy.sh` (build → commit → push → restart systemd → health check → purge CF cache).

**Việc làm theo thứ tự:**
1. Migration bảng (ekid_kids, ekid_assessments, ekid_caregivers, ekid_lessons, ekid_sessions, ekid_daily) + RLS (qua Supabase Dashboard SQL Editor — KHÔNG có Docker trên VPS)
2. `src/lib/ekid/ekid-system.ts` (age_band, system prompt builder, daily limit)
3. API routes: `ekid/kids`, `ekid/lessons`, `ekid/session`
4. Components: `KidAvatar`, `ExerciseCard`, `KidProgress`, `DailyLimitBadge`
5. Page `/app/ekid` + report page
6. Mở rộng `/app/setup` (tạo hồ sơ con ngay lúc onboarding)
7. Seed 6-9 bài mẫu
8. Test + deploy + verify production (`curl https://nooi.net/ekid` → 200)

## 9. Ngoài phạm vi (vòng sau)

- eKid trên **mobile app** (đang xây) — sau
- Thanh toán/đăng ký gói eKid con thứ N
- Nhiều bài tập minigame phức tạp
- Phân tích (ML) — hiện AI note đủ

## 10. Câu hỏi còn treo (nếu có, ghi rõ để Ngài An trả lời 1 lần duy nhất)

Không còn câu hỏi treo cho vòng 1 — đã đủ thông tin. Nếu Ngài An muốn thay đổi gì (giọng, độ tuổi, giới hạn phút) nói em sửa.
