-- ============================================================
-- Sync public_slug with ref_code — always derived, never manual
-- public_slug is always LOWER(ref_code), guaranteed unique
-- ============================================================

-- 1. Trigger function: sync public_slug when ref_code changes
CREATE OR REPLACE FUNCTION public.sync_public_slug_with_ref_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Always keep public_slug in sync with ref_code
  IF NEW.ref_code IS DISTINCT FROM OLD.ref_code THEN
    NEW.public_slug := LOWER(NEW.ref_code);
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Apply trigger on UPDATE (also handles INSERT via BEFORE INSERT trigger)
DROP TRIGGER IF EXISTS trg_sync_public_slug ON profiles;
CREATE TRIGGER trg_sync_public_slug
  BEFORE UPDATE OF ref_code ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_public_slug_with_ref_code();

-- 3. Drop the now-unnecessary update_public_slug RPC (slug is always derived from ref_code)
DROP FUNCTION IF EXISTS public.update_public_slug;
DROP FUNCTION IF EXISTS public.check_slug_available;

-- 4. Backfill: fix any profiles where public_slug doesn't match LOWER(ref_code)
UPDATE profiles
SET public_slug = LOWER(ref_code)
WHERE ref_code IS NOT NULL
  AND (public_slug IS NULL OR public_slug != LOWER(ref_code));