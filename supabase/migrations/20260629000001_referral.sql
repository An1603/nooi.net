-- ============================================================
-- NOOI Referral System
-- Adds referral code + referred_by to profiles
-- ============================================================

-- 1. Add referral columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ref_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Unique index on ref_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_ref_code ON profiles(ref_code);

-- 2. Function: auto-generate ref_code for new profiles
CREATE OR REPLACE FUNCTION public.generate_ref_code(full_name TEXT, existing_ids UUID[] DEFAULT '{}')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base TEXT;
  code TEXT;
  tries INT := 0;
BEGIN
  -- Take first 3 uppercase chars of name (remove diacritics by simple ASCII folding)
  base := UPPER(REGEXP_REPLACE(
    REGEXP_REPLACE(full_name, '[^a-zA-Z0-9]', '', 'g'),
    '([a-zA-Z])[a-zA-Z]*', '\1', 'g'
  ));
  IF base = '' THEN base := 'U'; END IF;
  IF LENGTH(base) > 4 THEN base := LEFT(base, 4); END IF;

  LOOP
    code := base || LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE ref_code = code) THEN
      RETURN code;
    END IF;
    tries := tries + 1;
    IF tries > 100 THEN
      code := 'U' || LPAD(CAST(FLOOR(RANDOM() * 1000000) AS TEXT), 6, '0');
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- 3. Trigger: auto-generate ref_code on insert
CREATE OR REPLACE FUNCTION public.handle_new_profile_ref_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  name_for_code TEXT;
BEGIN
  name_for_code := COALESCE(NEW.full_name, 'U');
  IF name_for_code = '' THEN name_for_code := 'U'; END IF;
  NEW.ref_code := public.generate_ref_code(name_for_code);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_ref_code ON profiles;
CREATE TRIGGER trg_profiles_ref_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_ref_code();

-- 4. Index for referral tree queries
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- 5. RLS: allow inserting ref_code update (referred_by)
DROP POLICY IF EXISTS "update_own_ref_code" ON profiles;
CREATE POLICY "update_own_ref_code" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Function: lookup user by ref_code (safe, returns user_id only)
CREATE OR REPLACE FUNCTION public.lookup_ref_code(code TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT user_id FROM public.profiles WHERE ref_code = UPPER(TRIM(code)) LIMIT 1;
$$;

-- 7. Function: get referral stats for a user
CREATE OR REPLACE FUNCTION public.get_referral_stats(p_user_id UUID)
RETURNS TABLE (
  total_referred BIGINT,
  joined_this_month BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    COUNT(*)::BIGINT AS total_referred,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()))::BIGINT AS joined_this_month
  FROM public.profiles
  WHERE referred_by = p_user_id;
$$;

-- 8. Function: get referral list for a user
CREATE OR REPLACE FUNCTION public.get_referral_list(p_user_id UUID)
RETURNS TABLE (
  referee_id UUID,
  full_name TEXT,
  created_at TIMESTAMPTZ,
  has_onboarding BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    p.user_id,
    p.full_name,
    p.created_at,
    p.onboarding_completed
  FROM public.profiles p
  WHERE p.referred_by = p_user_id
  ORDER BY p.created_at DESC;
$$;
