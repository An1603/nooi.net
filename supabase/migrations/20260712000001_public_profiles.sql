-- ============================================================
-- NOOI Public Profile System
-- Each user gets an auto-generated public profile page at /u/<slug>
-- ============================================================

-- 1. Add public profile columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_bio TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_avatar_url TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_headline TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_website TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_skills TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_is_visible BOOLEAN DEFAULT true;

-- 2. Modify handle_new_profile_ref_code to also set public_slug
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
  -- Default public_slug = lowercase of ref_code (always unique since ref_code is unique)
  NEW.public_slug := LOWER(NEW.ref_code);
  RETURN NEW;
END;
$$;

-- 3. Function: get only public-safe profile data (bypass RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_public_profile(slug TEXT)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  public_slug TEXT,
  public_bio TEXT,
  public_headline TEXT,
  public_avatar_url TEXT,
  public_website TEXT,
  public_social_links JSONB,
  public_skills TEXT[],
  public_is_visible BOOLEAN,
  ref_code TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    p.user_id,
    p.full_name,
    p.public_slug,
    COALESCE(p.public_bio, '')::TEXT,
    COALESCE(p.public_headline, '')::TEXT,
    COALESCE(p.public_avatar_url, '')::TEXT,
    COALESCE(p.public_website, '')::TEXT,
    COALESCE(p.public_social_links, '{}'::jsonb),
    COALESCE(p.public_skills, '{}'),
    p.public_is_visible,
    p.ref_code,
    p.created_at
  FROM public.profiles p
  WHERE p.public_slug = LOWER(TRIM(slug))
    AND p.public_is_visible = true
  LIMIT 1;
$$;

-- 4. Function: check if slug is available (for user customization)
CREATE OR REPLACE FUNCTION public.check_slug_available(slug TEXT, current_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public_slug = LOWER(TRIM(slug))
      AND (current_user_id IS NULL OR user_id != current_user_id)
  );
$$;

-- 5. Function: update public_slug for current user (with availability check)
CREATE OR REPLACE FUNCTION public.update_public_slug(new_slug TEXT, current_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  clean_slug TEXT;
BEGIN
  clean_slug := LOWER(TRIM(new_slug));
  
  -- Validate: only lowercase letters, numbers, hyphens
  IF NOT clean_slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$' THEN
    RETURN 'ERROR:invalid_format';
  END IF;
  
  -- Check availability
  IF EXISTS (SELECT 1 FROM public.profiles WHERE public_slug = clean_slug AND user_id != current_user_id) THEN
    RETURN 'ERROR:taken';
  END IF;
  
  -- Update
  UPDATE public.profiles SET public_slug = clean_slug WHERE user_id = current_user_id;
  RETURN clean_slug;
END;
$$;

-- 6. RLS: allow public anon reads on visible profiles (safe columns only via RPC above)
-- No direct table access needed — all public reads go through get_public_profile RPC.
-- Users can still update their own public profile fields via existing RLS.

-- 7. Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_profiles_public_slug ON profiles(public_slug) WHERE public_is_visible = true;

-- 8. Backfill public_slug for existing profiles that don't have one
UPDATE profiles
SET public_slug = LOWER(ref_code)
WHERE public_slug IS NULL AND ref_code IS NOT NULL;

-- For profiles without ref_code (shouldn't happen, but safety)
UPDATE profiles
SET public_slug = 'user-' || SUBSTR(id::TEXT, 1, 8)
WHERE public_slug IS NULL;