-- NOOI — User Progress (XP & Level) 
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS journal_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_journal_date DATE;

-- ============================================================
-- Function: calculate level from XP
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE
    WHEN xp >= 2500 THEN 7
    WHEN xp >= 1500 THEN 6
    WHEN xp >= 1000 THEN 5
    WHEN xp >= 600 THEN 4
    WHEN xp >= 300 THEN 3
    WHEN xp >= 100 THEN 2
    ELSE 1
  END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function: add XP and auto-update level
-- ============================================================
CREATE OR REPLACE FUNCTION add_xp(
  p_user_id UUID,
  p_amount INTEGER
) RETURNS TABLE(new_xp INTEGER, new_level INTEGER) AS $$
BEGIN
  UPDATE profiles
  SET xp = xp + p_amount,
      level = calculate_level(xp + p_amount)
  WHERE user_id = p_user_id
  RETURNING xp, level INTO new_xp, new_level;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
