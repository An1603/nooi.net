-- eKid — cho phép caregiver_user_id NULL trên ekid_caregivers.
-- Lý do: chủ hồ sơ có thể TẠO LỜI MỜI bằng mã liên kết TRƯỚC khi biết ai sẽ nhận.
-- Khi đó dòng lời mời tồn tại với status='pending' và caregiver_user_id = NULL;
-- người nhận nhập `link_code` để tự gán caregiver_user_id và chuyển status='linked'.
-- UNIQUE (kid_id, caregiver_user_id) vẫn an toàn: Postgres coi NULL là khác nhau,
-- nên nhiều lời mời chờ (NULL) cho cùng một bé vẫn hợp lệ.
ALTER TABLE public.ekid_caregivers ALTER COLUMN caregiver_user_id DROP NOT NULL;
