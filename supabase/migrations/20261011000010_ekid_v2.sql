-- eKid v2: tài khoản con + thưởng + tiến độ bài học
ALTER TABLE public.ekid_kids
  ADD COLUMN IF NOT EXISTS child_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ekid_kids_username ON public.ekid_kids(lower(username)) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ekid_kids_child_user ON public.ekid_kids(child_user_id) WHERE child_user_id IS NOT NULL;

ALTER TABLE public.ekid_lessons
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.ekid_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('diem','huy-hieu','sticker')),
  code TEXT,
  label TEXT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ekid_rewards_kid ON public.ekid_rewards(kid_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ekid_progress (
  kid_id UUID NOT NULL REFERENCES public.ekid_kids(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.ekid_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'chua-hoc' CHECK (status IN ('chua-hoc','da-hoc','da-thi')),
  best_score INT,
  attempts INT NOT NULL DEFAULT 0,
  last_at TIMESTAMPTZ,
  PRIMARY KEY (kid_id, lesson_id)
);

ALTER TABLE public.ekid_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekid_progress ENABLE ROW LEVEL SECURITY;

-- helper: user hiện tại có phải là CON sở hữu kid_id không
CREATE OR REPLACE FUNCTION public.ekid_is_child_of(p_kid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.ekid_kids k WHERE k.id = p_kid AND k.child_user_id = auth.uid());
$$;
GRANT EXECUTE ON FUNCTION public.ekid_is_child_of(uuid) TO authenticated;

DROP POLICY IF EXISTS "ekid_rewards_read" ON public.ekid_rewards;
CREATE POLICY "ekid_rewards_read" ON public.ekid_rewards
  FOR SELECT TO authenticated USING (
    public.ekid_is_child_of(kid_id) OR public.ekid_owns_kid(kid_id) OR public.ekid_is_caregiver(kid_id)
  );
DROP POLICY IF EXISTS "ekid_progress_read" ON public.ekid_progress;
CREATE POLICY "ekid_progress_read" ON public.ekid_progress
  FOR SELECT TO authenticated USING (
    public.ekid_is_child_of(kid_id) OR public.ekid_owns_kid(kid_id) OR public.ekid_is_caregiver(kid_id)
  );