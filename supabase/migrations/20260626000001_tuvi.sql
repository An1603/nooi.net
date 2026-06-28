-- Add Tử Vi fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tuvi_report JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gioi_tinh TEXT DEFAULT 'nam' CHECK (gioi_tinh IN ('nam', 'nu'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gio_sinh INTEGER DEFAULT 12 CHECK (gio_sinh >= 0 AND gio_sinh <= 23);
