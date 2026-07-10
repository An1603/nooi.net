-- Thêm cột gifted_by để tracking người tặng
ALTER TABLE user_items ADD COLUMN IF NOT EXISTS gifted_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Tạo index cho tra cứu quà tặng
CREATE INDEX IF NOT EXISTS idx_user_items_gifted_by ON user_items(gifted_by);
