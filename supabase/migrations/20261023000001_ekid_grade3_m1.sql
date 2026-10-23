-- eKid M1 — Vòng lặp học lớp 3
-- Ba tầng: yêu cầu cần đạt (TT 32/2018) → bài → câu hỏi
-- Không gắn cứng vào sách giáo khoa; phân phối chương trình của trường là lớp cấu hình sau.

-- 1) Mở rộng bảng bài học sẵn có (giữ nguyên dữ liệu mầm non / thiếu niên)
ALTER TABLE public.ekid_lessons
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS grade INT,
  ADD COLUMN IF NOT EXISTS objective_ids TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS est_minutes SMALLINT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS script_hint TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Unique đầy đủ (không partial) để `ON CONFLICT (slug)` dùng được khi seed.
-- PostgreSQL coi mỗi NULL là khác nhau nên bài cũ không có slug vẫn hợp lệ.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ekid_lessons_slug
  ON public.ekid_lessons(slug);
CREATE INDEX IF NOT EXISTS idx_ekid_lessons_grade
  ON public.ekid_lessons(grade, subject);

-- 2) Tầng 1 — yêu cầu cần đạt
CREATE TABLE IF NOT EXISTS public.ekid_objectives (
  id          TEXT PRIMARY KEY,
  subject     TEXT NOT NULL,
  grade       INT  NOT NULL DEFAULT 3,
  strand      TEXT NOT NULL,
  topic       TEXT NOT NULL,
  code_short  TEXT NOT NULL,
  statement   TEXT NOT NULL,
  level       SMALLINT NOT NULL CHECK (level IN (1,2,3)),
  term        SMALLINT CHECK (term IN (1,2)),
  source      TEXT NOT NULL DEFAULT 'TT32/2018',
  active      BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_ekid_objectives_subject
  ON public.ekid_objectives(subject, grade, active);

-- 3) Tầng 3 — câu hỏi (gắn đúng 1 YCCĐ + mức + 4 bậc gợi ý soạn sẵn)
CREATE TABLE IF NOT EXISTS public.ekid_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    UUID NOT NULL REFERENCES public.ekid_lessons(id) ON DELETE CASCADE,
  objective_id TEXT NOT NULL REFERENCES public.ekid_objectives(id),
  level        SMALLINT NOT NULL CHECK (level IN (1,2,3)),
  kind         TEXT NOT NULL CHECK (kind IN ('noi','chon','viet','giai_thich')),
  sort_order   INT NOT NULL DEFAULT 0,
  prompt       TEXT NOT NULL,
  answer       JSONB NOT NULL,
  hint_ladder  JSONB NOT NULL,
  audio_url    TEXT,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ekid_items_lesson
  ON public.ekid_items(lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_ekid_items_objective
  ON public.ekid_items(objective_id);

-- 4) Nhật ký học: lượt trả lời + lượt mở gợi ý (hai bảng tách rời để tính
--    "đúng khi không dùng gợi ý" một cách trung thực)
CREATE TABLE IF NOT EXISTS public.ekid_attempts (
  id           BIGSERIAL PRIMARY KEY,
  kid_id       UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  session_id   UUID REFERENCES public.ekid_sessions(id) ON DELETE CASCADE,
  item_id      UUID REFERENCES public.ekid_items(id) ON DELETE SET NULL,
  objective_id TEXT,
  attempt_no   SMALLINT NOT NULL DEFAULT 1,
  correct      BOOLEAN,
  hints_used   SMALLINT NOT NULL DEFAULT 0,
  transcript   TEXT,
  rubric_score SMALLINT CHECK (rubric_score BETWEEN 1 AND 3),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ekid_attempts_kid
  ON public.ekid_attempts(kid_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ekid_attempts_session
  ON public.ekid_attempts(session_id);

CREATE TABLE IF NOT EXISTS public.ekid_hint_log (
  id         BIGSERIAL PRIMARY KEY,
  kid_id     UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.ekid_sessions(id) ON DELETE CASCADE,
  item_id    UUID,
  tier       SMALLINT NOT NULL CHECK (tier BETWEEN 1 AND 4),
  accepted   BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ekid_hint_log_session
  ON public.ekid_hint_log(session_id, item_id);

-- 5) Lịch học ngày + ôn giãn cách 1–3–7–21
CREATE TABLE IF NOT EXISTS public.ekid_daily_plan (
  id            BIGSERIAL PRIMARY KEY,
  kid_id        UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  plan_date     DATE NOT NULL,
  slot          SMALLINT NOT NULL DEFAULT 1,
  kind          TEXT NOT NULL CHECK (kind IN ('on_cu','bai_moi','kiem_tra','bo_tro')),
  lesson_id     UUID REFERENCES public.ekid_lessons(id) ON DELETE SET NULL,
  objective_ids TEXT[] NOT NULL DEFAULT '{}',
  done          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kid_id, plan_date, slot)
);
CREATE INDEX IF NOT EXISTS idx_ekid_daily_plan_kid
  ON public.ekid_daily_plan(kid_id, plan_date);

CREATE TABLE IF NOT EXISTS public.ekid_reviews (
  id           BIGSERIAL PRIMARY KEY,
  kid_id       UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  objective_id TEXT NOT NULL,
  due_date     DATE NOT NULL,
  stage        SMALLINT NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 4),
  last_result  BOOLEAN,
  UNIQUE (kid_id, objective_id, due_date)
);
CREATE INDEX IF NOT EXISTS idx_ekid_reviews_due
  ON public.ekid_reviews(kid_id, due_date);

-- 6) Cửa kiểm tra lên level
CREATE TABLE IF NOT EXISTS public.ekid_checkups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id       UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  unit         TEXT NOT NULL,
  objective_ids TEXT[] NOT NULL DEFAULT '{}',
  items        JSONB NOT NULL DEFAULT '[]',
  result       TEXT CHECK (result IN ('pass','fail')),
  score        NUMERIC(4,2),
  taken_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retake_after DATE
);
CREATE INDEX IF NOT EXISTS idx_ekid_checkups_kid
  ON public.ekid_checkups(kid_id, taken_at DESC);

-- 7) Phần thưởng do bố mẹ đặt (bổ sung cột cho bảng sẵn có)
ALTER TABLE public.ekid_rewards
  ADD COLUMN IF NOT EXISTS level_required INT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unlocked'
    CHECK (status IN ('locked','unlocked','given')),
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- 8) Phụ huynh nhập liệu + đồng thuận hai tầng
CREATE TABLE IF NOT EXISTS public.ekid_parent_notes (
  id         BIGSERIAL PRIMARY KEY,
  kid_id     UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('muc_tieu','noi_dung','ghi_nhan','danh_gia')),
  body       TEXT,
  rating     SMALLINT CHECK (rating BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ekid_parent_notes_kid
  ON public.ekid_parent_notes(kid_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ekid_consents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id         UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  guardian_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_version    TEXT NOT NULL,
  guardian_ok_at TIMESTAMPTZ,
  child_ok_at    TIMESTAMPTZ,
  withdrawn_at   TIMESTAMPTZ,
  scopes         TEXT[] NOT NULL DEFAULT '{hoc_tap}',
  UNIQUE (kid_id, doc_version)
);

-- 9) RLS: chương trình học đọc công khai cho người đã đăng nhập,
--    dữ liệu của trẻ chỉ đọc bởi chủ hồ sơ / chính bé / người chăm sóc đã liên kết.
ALTER TABLE public.ekid_objectives   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_hint_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_daily_plan   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_checkups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_parent_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_consents     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ekid_objectives_read" ON public.ekid_objectives;
CREATE POLICY "ekid_objectives_read" ON public.ekid_objectives
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "ekid_items_read" ON public.ekid_items;
CREATE POLICY "ekid_items_read" ON public.ekid_items
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "ekid_attempts_read" ON public.ekid_attempts;
CREATE POLICY "ekid_attempts_read" ON public.ekid_attempts
  FOR SELECT TO authenticated USING (
    public.ekid_is_child_of(kid_id) OR public.ekid_owns_kid(kid_id) OR public.ekid_is_caregiver(kid_id)
  );

DROP POLICY IF EXISTS "ekid_hint_log_read" ON public.ekid_hint_log;
CREATE POLICY "ekid_hint_log_read" ON public.ekid_hint_log
  FOR SELECT TO authenticated USING (
    public.ekid_is_child_of(kid_id) OR public.ekid_owns_kid(kid_id) OR public.ekid_is_caregiver(kid_id)
  );

DROP POLICY IF EXISTS "ekid_daily_plan_read" ON public.ekid_daily_plan;
CREATE POLICY "ekid_daily_plan_read" ON public.ekid_daily_plan
  FOR SELECT TO authenticated USING (
    public.ekid_is_child_of(kid_id) OR public.ekid_owns_kid(kid_id) OR public.ekid_is_caregiver(kid_id)
  );

DROP POLICY IF EXISTS "ekid_reviews_read" ON public.ekid_reviews;
CREATE POLICY "ekid_reviews_read" ON public.ekid_reviews
  FOR SELECT TO authenticated USING (
    public.ekid_is_child_of(kid_id) OR public.ekid_owns_kid(kid_id) OR public.ekid_is_caregiver(kid_id)
  );

DROP POLICY IF EXISTS "ekid_checkups_read" ON public.ekid_checkups;
CREATE POLICY "ekid_checkups_read" ON public.ekid_checkups
  FOR SELECT TO authenticated USING (
    public.ekid_is_child_of(kid_id) OR public.ekid_owns_kid(kid_id) OR public.ekid_is_caregiver(kid_id)
  );

DROP POLICY IF EXISTS "ekid_parent_notes_read" ON public.ekid_parent_notes;
CREATE POLICY "ekid_parent_notes_read" ON public.ekid_parent_notes
  FOR SELECT TO authenticated USING (
    public.ekid_owns_kid(kid_id) OR public.ekid_is_caregiver(kid_id) OR public.ekid_is_child_of(kid_id)
  );

DROP POLICY IF EXISTS "ekid_consents_read" ON public.ekid_consents;
CREATE POLICY "ekid_consents_read" ON public.ekid_consents
  FOR SELECT TO authenticated USING (
    public.ekid_owns_kid(kid_id) OR public.ekid_is_caregiver(kid_id)
  );

COMMENT ON TABLE public.ekid_objectives IS
  'Yêu cầu cần đạt theo TT 32/2018/TT-BGDĐT — khoá chính của toàn bộ nội dung học.';
COMMENT ON COLUMN public.ekid_items.hint_ladder IS
  'Đúng 4 bậc: hỏi lại khác cách → gợi hướng → làm mẫu nửa bước → lời giải + hỏi lại ngay.';
