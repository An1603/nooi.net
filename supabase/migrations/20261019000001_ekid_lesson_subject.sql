-- eKid v3.5 — Chủ đề (môn) chuẩn hoá cho từng bài học.
--
-- `core_topic` là chuỗi tự do của người soạn bài ("Đếm số lượng", "Đọc hiểu"…)
-- nên KHÔNG lọc/nhóm được. Thêm `subject` giữ SLUG chuẩn (không dấu); nhãn tiếng
-- Việt + emoji sống ở `src/lib/ekid/subject.ts` — đổi nhãn không phải sửa DB.
--
-- Không đặt CHECK trên slug: danh sách chủ đề còn mở rộng; ứng dụng tra cứu qua
-- `subjectMeta()` và tự ẩn chip khi gặp slug lạ (không làm hỏng thư viện của bé).

ALTER TABLE public.ekid_lessons ADD COLUMN IF NOT EXISTS subject TEXT;

COMMENT ON COLUMN public.ekid_lessons.subject IS
  'Slug chủ đề/môn chuẩn (vd toan, tieng-viet, khtn). Nhãn hiển thị: src/lib/ekid/subject.ts';

-- Gán chủ đề cho 9 bài đang có (chỉ điền khi còn trống → chạy lại vô hại).
UPDATE public.ekid_lessons SET subject = 'chu-cai'  WHERE subject IS NULL AND age_band = 'mam-non' AND title = 'Bảng chữ cái A Ă Â';
UPDATE public.ekid_lessons SET subject = 'so-dem'   WHERE subject IS NULL AND age_band = 'mam-non' AND title = 'Đếm số 1-5';
UPDATE public.ekid_lessons SET subject = 'mau-sac'  WHERE subject IS NULL AND age_band = 'mam-non' AND title = 'Nhận biết màu sắc';

UPDATE public.ekid_lessons SET subject = 'toan'       WHERE subject IS NULL AND age_band = 'tieu-hoc' AND title = 'Cộng trừ trong phạm vi 20';
UPDATE public.ekid_lessons SET subject = 'tieng-viet' WHERE subject IS NULL AND age_band = 'tieu-hoc' AND title = 'Đọc hiểu đoạn ngắn';
UPDATE public.ekid_lessons SET subject = 'tieng-viet' WHERE subject IS NULL AND age_band = 'tieu-hoc' AND title = 'Chính tả cơ bản';

UPDATE public.ekid_lessons SET subject = 'toan'    WHERE subject IS NULL AND age_band = 'thieu-nien' AND title = 'Tư duy logic';
UPDATE public.ekid_lessons SET subject = 'toan'    WHERE subject IS NULL AND age_band = 'thieu-nien' AND title = 'Quy luật dãy số';
UPDATE public.ekid_lessons SET subject = 'ngu-van' WHERE subject IS NULL AND age_band = 'thieu-nien' AND title = 'Đọc hiểu nâng cao';

-- Lọc/nhóm thư viện theo (lứa, chủ đề).
CREATE INDEX IF NOT EXISTS idx_ekid_lessons_band_subject
  ON public.ekid_lessons (age_band, subject);
