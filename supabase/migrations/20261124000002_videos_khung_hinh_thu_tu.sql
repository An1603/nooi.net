-- 20261124000002_videos_khung_hinh_thu_tu.sql
-- Thêm 2 trường phục vụ luồng xem dọc kiểu vuốt (TikTok), chốt 24/11/2026.
--
--   khung_hinh = 'doc'   -> video dọc 9:16, vào được luồng vuốt /app/short
--   khung_hinh = 'ngang' -> video ngang 16:9 (mặc định, dữ liệu cũ giữ nguyên)
--   thu_tu               -> thứ tự trong luồng; số LỚN hơn đứng TRƯỚC (bài ghim = 1000)
--
-- Quyết định của Ngài An: video dọc CHỈ nằm trong nooi.net (Bunny Stream).
-- Phân phối xã hội dùng bản riêng do bộ phận truyền thông lo.
--
-- An toàn: chỉ THÊM cột có giá trị mặc định, không đổi/xoá cột cũ.

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS khung_hinh text NOT NULL DEFAULT 'ngang',
  ADD COLUMN IF NOT EXISTS thu_tu integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'videos_khung_hinh_check' AND conrelid = 'public.videos'::regclass
  ) THEN
    ALTER TABLE public.videos
      ADD CONSTRAINT videos_khung_hinh_check CHECK (khung_hinh IN ('ngang', 'doc'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS videos_feed_doc_idx
  ON public.videos (khung_hinh, thu_tu DESC, created_at DESC);

COMMENT ON COLUMN public.videos.khung_hinh IS
  'Khung hình: doc (9:16, vào luồng vuốt) hoặc ngang (16:9)';
COMMENT ON COLUMN public.videos.thu_tu IS
  'Thứ tự trong luồng vuốt — số lớn hơn đứng trước; 0 = theo thời gian tạo';

-- Mở rộng kênh phát: thêm 'truc-tiep' cho tệp video rời (clip thử, video ngắn không qua nền tảng).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'videos_kenh_phat_check' AND conrelid = 'public.videos'::regclass
  ) THEN
    ALTER TABLE public.videos DROP CONSTRAINT videos_kenh_phat_check;
  END IF;

  ALTER TABLE public.videos
    ADD CONSTRAINT videos_kenh_phat_check
    CHECK (kenh_phat IN ('youtube', 'bunny', 'truc-tiep'));
END $$;

COMMENT ON COLUMN public.videos.kenh_phat IS
  'Cửa phát: youtube (cần người lạ tìm thấy) | bunny (khoá quyền, tặng theo cấp độ) | truc-tiep (tệp .mp4 rời)';
