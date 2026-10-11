-- eKid: AI live voice cho trẻ em
CREATE TABLE IF NOT EXISTS public.ekid_kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '🦊',
  favorite_voice TEXT DEFAULT 'Leda',
  placement_age_band TEXT CHECK (placement_age_band IN ('mam-non','tieu-hoc','thieu-nien')),
  level INT NOT NULL DEFAULT 1,
  placement_level INT DEFAULT 1,
  daily_limit_min INT NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ekid_kids_user ON public.ekid_kids(user_id);

CREATE TABLE IF NOT EXISTS public.ekid_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('dau-vao','ngay')),
  band TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  band_after JSONB,
  kid_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ekid_assessments_kid ON public.ekid_assessments(kid_id);

CREATE TABLE IF NOT EXISTS public.ekid_caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  caregiver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('cha','me','nguoi-giam-ho')),
  status TEXT NOT NULL DEFAULT 'pending',
  link_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kid_id, caregiver_user_id)
);
CREATE INDEX IF NOT EXISTS idx_ekid_caregivers_kid ON public.ekid_caregivers(kid_id);

CREATE TABLE IF NOT EXISTS public.ekid_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age_band TEXT NOT NULL CHECK (age_band IN ('mam-non','tieu-hoc','thieu-nien')),
  title TEXT NOT NULL,
  part TEXT CHECK (part IN ('chung','rieng')),
  core_topic TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  difficulty INT DEFAULT 1,
  status TEXT DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS idx_ekid_lessons_band ON public.ekid_lessons(age_band, status);

CREATE TABLE IF NOT EXISTS public.ekid_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.ekid_lessons(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_min INT,
  transcript JSONB NOT NULL DEFAULT '[]',
  exercises_done JSONB NOT NULL DEFAULT '[]',
  score INT,
  ai_notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_ekid_sessions_kid ON public.ekid_sessions(kid_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.ekid_daily (
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  minutes_used INT NOT NULL DEFAULT 0,
  PRIMARY KEY (kid_id, day)
);

-- RLS
ALTER TABLE public.ekid_kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_daily ENABLE ROW LEVEL SECURITY;

-- ⚠️ SECURITY DEFINER helpers: phá đệ quy RLS (policy không subquery trực tiếp sang bảng khác).
-- Hai hàm này chạy với quyền owner → bypass RLS của bảng được query bên trong.
CREATE OR REPLACE FUNCTION public.ekid_owns_kid(p_kid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.ekid_kids k WHERE k.id = p_kid AND k.user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.ekid_is_caregiver(p_kid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.ekid_caregivers c
                 WHERE c.kid_id = p_kid AND c.caregiver_user_id = auth.uid() AND c.status = 'linked');
$$;

GRANT EXECUTE ON FUNCTION public.ekid_owns_kid(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ekid_is_caregiver(uuid) TO authenticated;

-- ekid_kids: chủ sở hữu toàn quyền; caregiver đã linked CHỈ đọc
DROP POLICY IF EXISTS "ekid_kids_owner" ON public.ekid_kids;
CREATE POLICY "ekid_kids_owner" ON public.ekid_kids
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ekid_kids_caregiver_read" ON public.ekid_kids;
CREATE POLICY "ekid_kids_caregiver_read" ON public.ekid_kids
  FOR SELECT TO authenticated USING (public.ekid_is_caregiver(id));

-- ekid_lessons: mọi authenticated đọc
DROP POLICY IF EXISTS "ekid_lessons_read" ON public.ekid_lessons;
CREATE POLICY "ekid_lessons_read" ON public.ekid_lessons
  FOR SELECT TO authenticated USING (true);

-- ekid_sessions: chủ toàn quyền; caregiver CHỈ đọc
DROP POLICY IF EXISTS "ekid_sessions_access" ON public.ekid_sessions;
DROP POLICY IF EXISTS "ekid_sessions_owner" ON public.ekid_sessions;
DROP POLICY IF EXISTS "ekid_sessions_caregiver_read" ON public.ekid_sessions;
CREATE POLICY "ekid_sessions_owner" ON public.ekid_sessions
  FOR ALL TO authenticated USING (public.ekid_owns_kid(kid_id)) WITH CHECK (public.ekid_owns_kid(kid_id));
CREATE POLICY "ekid_sessions_caregiver_read" ON public.ekid_sessions
  FOR SELECT TO authenticated USING (public.ekid_is_caregiver(kid_id));

-- ekid_daily: chủ toàn quyền; caregiver CHỈ đọc
DROP POLICY IF EXISTS "ekid_daily_access" ON public.ekid_daily;
DROP POLICY IF EXISTS "ekid_daily_owner" ON public.ekid_daily;
DROP POLICY IF EXISTS "ekid_daily_caregiver_read" ON public.ekid_daily;
CREATE POLICY "ekid_daily_owner" ON public.ekid_daily
  FOR ALL TO authenticated USING (public.ekid_owns_kid(kid_id)) WITH CHECK (public.ekid_owns_kid(kid_id));
CREATE POLICY "ekid_daily_caregiver_read" ON public.ekid_daily
  FOR SELECT TO authenticated USING (public.ekid_is_caregiver(kid_id));

-- ekid_assessments: chủ toàn quyền; caregiver CHỈ đọc
DROP POLICY IF EXISTS "ekid_assessments_access" ON public.ekid_assessments;
DROP POLICY IF EXISTS "ekid_assessments_owner" ON public.ekid_assessments;
DROP POLICY IF EXISTS "ekid_assessments_caregiver_read" ON public.ekid_assessments;
CREATE POLICY "ekid_assessments_owner" ON public.ekid_assessments
  FOR ALL TO authenticated USING (public.ekid_owns_kid(kid_id)) WITH CHECK (public.ekid_owns_kid(kid_id));
CREATE POLICY "ekid_assessments_caregiver_read" ON public.ekid_assessments
  FOR SELECT TO authenticated USING (public.ekid_is_caregiver(kid_id));

-- ekid_caregivers: chủ toàn quyền (ghi qua admin client); người thân thấy dòng của mình
DROP POLICY IF EXISTS "ekid_caregivers_owner" ON public.ekid_caregivers;
CREATE POLICY "ekid_caregivers_owner" ON public.ekid_caregivers
  FOR ALL TO authenticated USING (
    public.ekid_owns_kid(kid_id) OR caregiver_user_id = auth.uid()
  ) WITH CHECK (
    public.ekid_owns_kid(kid_id)
  );
