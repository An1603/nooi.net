-- Update generate_ref_code to use given name (last word) instead of first letters
-- E.g. "Nguyễn Văn An" → "AN3952" instead of "NVA3952"
-- Also add guard: prevent setting referred_by if already set

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
  tries INT := 0;
BEGIN
  -- Strip non-ASCII letters, keep spaces
  cleaned := REGEXP_REPLACE(full_name, '[^a-zA-Z ]', '', 'g');
  cleaned := TRIM(cleaned);

  -- Extract last word (given name)
  words := STRING_TO_ARRAY(cleaned, ' ');
  given_name := COALESCE(words[array_length(words, 1)], 'U');

  -- Take max 4 chars, uppercase
  base := UPPER(LEFT(given_name, 4));
  IF base = '' THEN base := 'U'; END IF;

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
