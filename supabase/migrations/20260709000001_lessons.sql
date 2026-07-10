-- ============================================================
-- NOOI.NET — Lessons table for Learning Hub
-- Cho phép admin CRUD bài giảng thay vì hardcode
-- ============================================================

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id INTEGER NOT NULL CHECK (level_id BETWEEN 1 AND 7),
  lesson_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('video', 'practice')),
  duration TEXT NOT NULL DEFAULT '00:00',
  youtube_id TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_level_id ON lessons(level_id);
CREATE INDEX IF NOT EXISTS idx_lessons_sort ON lessons(level_id, sort_order);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lessons_updated_at ON lessons;
CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_lessons_updated_at();

-- RLS: admin-only (via service_role), public read
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_select_all"
  ON lessons FOR SELECT
  USING (true);

-- Seed data từ LEVELS hiện tại
INSERT INTO lessons (level_id, lesson_id, title, type, duration, youtube_id, description, sort_order) VALUES
(1, '1-1', 'NOOI là gì?', 'video', '15:00', '', 'Giới thiệu về NOOI và hành trình chuyển hóa', 1),
(1, '1-2', 'Vì sao NOOI ra đời?', 'video', '12:00', '', 'Nguồn gốc và sứ mệnh của NOOI', 2),
(1, '1-3', 'Bản đồ con người', 'video', '20:00', '', 'Hiểu về cấu trúc con người theo NOOI', 3),
(1, '1-4', 'Bản đồ khổ đau', 'video', '18:00', '', 'Nhận diện nguồn gốc khổ đau', 4),
(1, '1-5', 'Bắt đầu thực hành', 'practice', '10:00', '', 'Bài thực hành đầu tiên', 5),
(2, '2-1', 'Quan sát thân-tâm', 'video', '15:00', '', 'Học cách quan sát thân và tâm', 1),
(2, '2-2', 'Nhận diện cảm xúc', 'video', '12:00', '', 'Nhận biết các loại cảm xúc', 2),
(2, '2-3', 'Thiền căn bản', 'video', '20:00', '', 'Thực hành thiền cơ bản', 3),
(2, '2-4', 'Bài tập: Nhật ký cảm xúc', 'practice', '15:00', '', 'Viết nhật ký cảm xúc hàng ngày', 4),
(3, '3-1', 'Chánh niệm trong đời sống', 'video', '20:00', '', 'Áp dụng chánh niệm vào cuộc sống', 1),
(3, '3-2', 'Quản trị tâm trí', 'video', '15:00', '', 'Làm chủ suy nghĩ và cảm xúc', 2),
(3, '3-3', 'Thực hành: Đi bộ chánh niệm', 'practice', '10:00', '', 'Thiền động qua đi bộ', 3),
(4, '4-1', 'Chuyển hóa cảm xúc', 'video', '20:00', '', 'Phương pháp chuyển hóa cảm xúc tiêu cực', 1),
(4, '4-2', 'Sống chánh niệm', 'video', '15:00', '', 'Duy trì chánh niệm trong mọi hoạt động', 2),
(5, '5-1', 'Lắng nghe sâu', 'video', '15:00', '', 'Kỹ năng lắng nghe với chánh niệm', 1),
(5, '5-2', 'Đồng hành cùng người khác', 'video', '20:00', '', 'Hướng dẫn đồng hành cùng người khác', 2),
(6, '6-1', 'Kỹ năng Mentor', 'video', '25:00', '', 'Kỹ năng cần có của một Mentor', 1)
ON CONFLICT (lesson_id) DO NOTHING;
