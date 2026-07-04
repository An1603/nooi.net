-- Add ref_code_changes counter + update generate_ref_code to use sequential numbers

-- 1. Add change counter column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ref_code_changes INTEGER DEFAULT 0;

-- 2. Update generate_ref_code: given name (full) + sequential number
CREATE OR REPLACE FUNCTION public.generate_ref_code(full_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned TEXT;
  words TEXT[];
  given_name TEXT;
  base TEXT;
  code TEXT;
  counter INT := 1;
BEGIN
  -- Strip non-ASCII letters, keep spaces
  cleaned := REGEXP_REPLACE(full_name, '[^a-zA-Z ]', '', 'g');
  cleaned := TRIM(cleaned);

  -- Extract last word (given name) — full length
  words := STRING_TO_ARRAY(cleaned, ' ');
  given_name := COALESCE(words[array_length(words, 1)], 'U');
  base := UPPER(given_name);
  IF base = '' THEN base := 'U'; END IF;

  -- Try without number first
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE ref_code = base) THEN
    RETURN base;
  END IF;

  -- Sequential numbering
  LOOP
    code := base || counter::TEXT;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE ref_code = code) THEN
      RETURN code;
    END IF;
    counter := counter + 1;
    IF counter > 100000 THEN
      -- Fallback: extreme edge case
      code := 'U' || LPAD(CAST(FLOOR(RANDOM() * 1000000) AS TEXT), 6, '0');
      RETURN code;
    END IF;
  END LOOP;
END;
$$;
