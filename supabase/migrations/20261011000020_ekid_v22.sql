-- eKid v2.2 — Migration Task 1
-- Thêm các cột mở rộng cho hồ sơ trẻ: status, settings, birth_time, gender, birth_place
ALTER TABLE public.ekid_kids
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','khoa')),
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS birth_time TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('nam','nu')),
  ADD COLUMN IF NOT EXISTS birth_place TEXT;
