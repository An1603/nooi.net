-- Thêm cột voice_preference cho profiles để lưu giọng nói yêu thích
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_preference TEXT DEFAULT 'Puck';
