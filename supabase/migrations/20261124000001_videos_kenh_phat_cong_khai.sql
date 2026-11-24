-- 20261124000001_videos_kenh_phat_cong_khai.sql
-- Thêm 2 trường định tuyến cho kho video NOOI.
--
-- Quy ước (chốt 24/11/2026):
--   kenh_phat = 'youtube'  ->  video cần NGƯỜI LẠ TÌM THẤY (thu hút, tuyển sinh, SEO)
--   kenh_phat = 'bunny'    ->  video PHỤC VỤ NGƯỜI TRONG HỆ SINH THÁI (khoá quyền, tặng theo cấp độ)
--   cong_khai = true       ->  hiện được cho người ngoài (mặt tiền, học thử)
--   cong_khai = false       ->  nội bộ (mặc định)
--
-- An toàn: chỉ THÊM cột có giá trị mặc định, không đổi/xoá cột cũ -> không ảnh hưởng dữ liệu đang chạy.

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS kenh_phat text NOT NULL DEFAULT 'youtube',
  ADD COLUMN IF NOT EXISTS cong_khai boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'videos_kenh_phat_check' AND conrelid = 'public.videos'::regclass
  ) THEN
    ALTER TABLE public.videos
      ADD CONSTRAINT videos_kenh_phat_check CHECK (kenh_phat IN ('youtube', 'bunny'));
  END IF;
END $$;

-- Đoán kênh phát cho dữ liệu cũ theo đường dẫn đang có
UPDATE public.videos
   SET kenh_phat = 'youtube'
 WHERE url IS NOT NULL
   AND url ~* '(youtu\.be/|youtube\.com/)'
   AND kenh_phat <> 'youtube';

UPDATE public.videos
   SET kenh_phat = 'bunny'
 WHERE url IS NOT NULL
   AND url !~* '(youtu\.be/|youtube\.com/)'
   AND kenh_phat <> 'bunny';

CREATE INDEX IF NOT EXISTS videos_kenh_phat_idx ON public.videos (kenh_phat);
CREATE INDEX IF NOT EXISTS videos_cong_khai_idx ON public.videos (cong_khai) WHERE cong_khai;

COMMENT ON COLUMN public.videos.kenh_phat IS
  'Cửa phát video: youtube (thu hút người lạ) hoặc bunny (phục vụ người trong hệ sinh thái)';
COMMENT ON COLUMN public.videos.cong_khai IS
  'true = hiện cho cả người ngoài; false = nội bộ';
