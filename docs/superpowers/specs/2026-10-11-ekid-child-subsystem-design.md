# eKid v2 — Phân hệ học riêng cho con trẻ (ekid.nooi.net)

**Ngày:** 2026-10-11 · **Trạng thái:** Chờ Ngài An duyệt
**Bối cảnh:** Bản v1 (trong `/app/ekid`) chưa khớp mô hình thật. Ngài An yêu cầu tách phân hệ học riêng cho con + mô hình tài khoản nhiều-nhiều + làm trọn gói.

## 1. Mục tiêu (đã chốt với Ngài An)

- **Phân hệ học của con TÁCH HẲN**, đơn giản: đăng nhập → vào học luôn. Chỉ gồm: **bài học (+video nếu cần)**, **thi/đánh giá**, **thưởng**, **tìm lại bài học**, **xem lại hướng dẫn**, **thi lại**.
- Địa chỉ: **`ekid.nooi.net`** — subdomain riêng.
- **Con đăng nhập bằng username + mật khẩu** (không dùng Google OAuth).
- **Mô hình nhiều-nhiều**: 1 người giám sát có nhiều con; 1 con có nhiều người giám sát (cha, mẹ, người giám hộ, ông bà…).
- **Người giám sát tạo tài khoản cho con** ngay trong tài khoản nooi.net của mình, rồi gắn thêm người theo dõi.
- Làm **trọn gói một lần**.

## 2. Kiến trúc tổng thể — 2 phân hệ tách biệt

| Phân hệ | Host / đường dẫn | Cho ai | Chức năng |
|---|---|---|---|
| **① Giám sát** (người lớn) | `nooi.net/app/ekid` (trong app hiện có) | Cha/mẹ/giám hộ | Tạo tài khoản con (username+pass), gắn người theo dõi, xem tiến độ/báo cáo |
| **② Học của con** (RIÊNG) | **`ekid.nooi.net`** | Con | Đăng nhập u/p → học luôn: bài học + video, thi, thưởng, thư viện ôn, thi lại |

### 2.1. Hạ tầng (đã khảo sát thực tế)
- Traefik (Docker `traefik-traefik-1`) file provider tại `/docker/traefik/config/`. Hiện `nooi.yml` chỉ route `nooi.net|www|app|admin.nooi.net → http://127.0.0.1:3000`. **ekid.nooi.net chưa có rule → 404.**
- **Thêm router cho `ekid.nooi.net`** trỏ về cùng service `nooi-web` (127.0.0.1:3000), `passHostHeader: true`. Traefik `--providers.file.watch=true` → tự nạp lại. TLS qua `certResolver: letsencrypt` như các subdomain khác.
- DNS `ekid.nooi.net` **đã trỏ Cloudflare** (đã verify) — không cần làm gì thêm ở DNS.
- Next.js: middleware phát hiện `host === "ekid.nooi.net"` → **rewrite** nội bộ sang route group `/ekid/*` (giống cách `admin.nooi.net` được xử lý bằng host-check sẵn có).

## 3. Mô hình tài khoản (n-n)

```
Người giám sát (auth Nooi, Google/email)
        │ tạo
        ▼
Tài khoản CON  ── ekid_kids { user_id: "chủ hồ sơ" (người tạo), child_user_id: auth con, username }
        │  đăng nhập username+password (email nội bộ <username>@ekid.nooi.net)
        ▼
Phân hệ học ekid.nooi.net

Quan hệ n-n: ekid_caregivers { kid_id, caregiver_user_id, role, status }
  → 1 con ↔ nhiều người giám sát (cha/mẹ/giám hộ/ông bà); 1 người ↔ nhiều con
```

- **Đăng nhập con**: tận dụng Supabase Auth — server tạo user với **email nội bộ** `<username>@ekid.nooi.net` + mật khẩu do giám sát đặt (`email_confirm: true`). Con chỉ gõ **username + mật khẩu**; client/login ghép domain. Bảo mật chuẩn, không tự chế auth.
- Nếu con quên mật khẩu → giám sát đặt lại trong trang quản trị.
- **Chuẩn hóa**: `ekid_kids.user_id` giữ nghĩa "chủ hồ sơ (người tạo)". Thêm `child_user_id` (auth của con) + `username`. Nhờ vậy: (a) tách biệt tài khoản học của con khỏi tài khoản giám sát; (b) nhiều giám sát qua `ekid_caregivers`; (c) chặn con vào app người lớn.

## 4. Schema DB — thay đổi + bảng mới

### 4.1. Sửa `ekid_kids`
```sql
ALTER TABLE public.ekid_kids
  ADD COLUMN IF NOT EXISTS child_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ekid_kids_username ON public.ekid_kids(lower(username)) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ekid_kids_child_user ON public.ekid_kids(child_user_id) WHERE child_user_id IS NOT NULL;
```

### 4.2. Sửa `ekid_lessons` (video hướng dẫn + thứ tự)
```sql
ALTER TABLE public.ekid_lessons
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
```

### 4.3. `ekid_rewards` — thưởng của con
```sql
CREATE TABLE IF NOT EXISTS public.ekid_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('diem','huy-hieu','sticker')),
  code TEXT,                         -- mã huy hiệu (vd 'first_lesson')
  label TEXT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ekid_rewards_kid ON public.ekid_rewards(kid_id, created_at DESC);
ALTER TABLE public.ekid_rewards ENABLE ROW LEVEL SECURITY;
-- con đọc thưởng của mình; chủ hồ sơ/caregiver linked đọc; ghi qua admin client
```

### 4.4. `ekid_progress` — tiến độ bài học (đã học / đã thi / điểm cao nhất)
```sql
CREATE TABLE IF NOT EXISTS public.ekid_progress (
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.ekid_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'chua-hoc' CHECK (status IN ('chua-hoc','da-hoc','da-thi')),
  best_score INT,                    -- điểm cao nhất (0..100) qua các lần thi
  attempts INT NOT NULL DEFAULT 0,
  last_at TIMESTAMPTZ,
  PRIMARY KEY (kid_id, lesson_id)
);
ALTER TABLE public.ekid_progress ENABLE ROW LEVEL SECURITY;
```

> `ekid_sessions` (đã có) giữ lịch sử từng buổi; `ekid_progress` là "sổ tổng hợp" để hiện thư viện bài + điểm cao nhất.

## 5. Routes

### 5.1. Phân hệ con — route group `src/app/ekid/` (layout tối giản, KHÔNG sidebar người lớn)
| Route | Nội dung |
|---|---|
| `/ekid/login` | Đăng nhập username + mật khẩu (giao diện trẻ em, nút to) |
| `/ekid` | Trang chủ: **Thư viện bài học** (theo lứa của bé) — ô bài + trạng thái đã học/đã thi/điểm |
| `/ekid/hoc/[lessonId]` | Học 1 bài: video hướng dẫn (nếu có) + AI voice + bài tập; có nút **thi** |
| `/ekid/thi/[lessonId]` | **Thi/đánh giá**: làm bài, chấm điểm, lưu `best_score`; xong hiện điểm + thưởng |
| `/ekid/thuong` | **Thưởng**: điểm tổng, huy hiệu, sticker đã đạt |

### 5.2. Phân hệ giám sát — trong `(dashboard)/app/ekid/`
| Route | Nội dung |
|---|---|
| `/app/ekid` (có) | Danh sách con + nút **Tạo tài khoản con** (username+pass) + nút Tiến độ/Người thân |
| `/app/ekid/relatives` (có) | Gắn người theo dõi (mã/tìm kiếm) — giữ |
| `/app/ekid/report` (có) | Báo cáo tiến độ (thêm điểm/thưởng/bài đã học) |

### 5.3. API mới
| Route | Việc |
|---|---|
| `POST /api/ekid/kids` (sửa) | Tạo con: validate username unique + mật khẩu, tạo auth user con (`admin.createUser`), tạo `ekid_kids` |
| `POST /api/ekid/kids/reset-password` | Giám sát đặt lại mật khẩu con |
| `GET /api/ekid/library` | Thư viện bài của bé (lesson + progress) — cho phân hệ con |
| `POST /api/ekid/quiz` | Nộp bài thi: chấm điểm, lưu session + progress + thưởng |
| `GET /api/ekid/rewards` | Điểm + huy hiệu của bé |

## 6. Tính năng phân hệ con

1. **Bài học + video hướng dẫn**: `ekid_lessons.video_url` (YouTube embed, tái dùng pattern sẵn có). Bé xem hướng dẫn → luyện với AI voice.
2. **Thi/đánh giá**: bộ câu hỏi của bài (`exercises`), làm → chấm điểm tại `/api/ekid/quiz` → lưu `best_score` + `attempts` + `ekid_sessions`.
3. **Thưởng**: mỗi bài hoàn thành / mỗi lần thi đạt ≥ ngưỡng → cộng **điểm**; mốc điểm → **huy hiệu**; hiển thị ở `/ekid/thuong`.
4. **Tìm lại bài học**: thư viện `/ekid` lọc theo lứa + tìm theo tên bài + nhóm "đã học/chưa học".
5. **Xem lại hướng dẫn**: mở lại bài bất cứ lúc nào (video + AI voice).
6. **Thi lại**: làm lại bài bất kỳ lúc nào; `best_score` = điểm cao nhất.

## 7. Middleware & phân quyền (tách 2 phân hệ)

- `host === "ekid.nooi.net"`:
  - chưa đăng nhập → `/ekid/login`;
  - là **tài khoản con** (tồn tại `ekid_kids.child_user_id = user.id`) → **rewrite** sang `/ekid/*`;
  - là **người lớn** → redirect về `https://nooi.net/app/ekid`.
- Ngược lại (host nooi.net): nếu user là **tài khoản con** → redirect sang `https://ekid.nooi.net` (con không thấy app người lớn).
- Giữ nguyên guard admin hiện có.

## 8. Bảo mật

- Con **chỉ** truy cập phân hệ học; không vào được `/app/*` (báo cáo, đầu tư…).
- Người lớn **không** tự động vào màn học của con (chỉ xem báo cáo trong phân hệ giám sát).
- Mật khẩu con do giám sát đặt, băm bởi Supabase; reset qua giám sát (không gửi email cho trẻ).
- RLS: con đọc dữ liệu của chính mình; giám sát linked đọc dữ liệu con; ghi qua `createAdminClient()` có kiểm quyền.
- Hạn mức 25 phút/ngày giữ nguyên, áp ở phân hệ học.

## 9. Triển khai

1. **Traefik**: thêm `Host(\`ekid.nooi.net\`)` vào router `nooi-http`/`nooi-https` trong `/docker/traefik/config/nooi.yml` → Traefik tự reload.
2. Migration DB (mục 4) qua Supabase Management API (token dòng cuối `~/.hermes/.env`).
3. Code: route group `/ekid`, middleware, API mới, trang giám sát sửa.
4. Build → `bash deploy.sh` → verify `https://ekid.nooi.net` (login) + `https://nooi.net/app/ekid`.

## 10. Ngoài phạm vi (vòng sau)

- App di động cho con.
- Nhiều dạng minigame/thi nâng cao.
- Thanh toán gói cước theo số con.
- Báo cáo phân tích nâng cao cho giám sát.

## 11. Câu hỏi còn treo

- Quy tắc **username** con: em đề xuất `a-z0-9._`, 3-20 ký tự, không phân biệt hoa/thường, unique. Bé nhỏ giám sát đặt giúp; bé lớn tự đổi được.
- Ngưỡng **huy hiệu**: em đề xuất mốc 3/5/10 bài đạt; điểm ≥ 70/bài thì tính "đạt". Ngài An chỉnh được sau trong dữ liệu.