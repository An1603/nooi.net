-- Kích thước THẬT của ảnh bìa (px) — để lưới /video dựng ô đúng tỉ lệ ảnh.
--
-- Vì sao cần: lưới kiểu thư viện ảnh (/gallery) đặt chiều cao mỗi ô theo đúng tỉ lệ ảnh. Không có
-- kích thước thì hoặc phải ép mọi ô vào một khung cứng (ảnh dọc bị hai vệt đen), hoặc để trình duyệt
-- tự dò rồi cột nhảy loạn khi ảnh tải xong. Đo thật 26/11/2026: ảnh bìa trong kho có tỉ lệ 0,46 · 0,56
-- · 0,75 · 1,78 — không thể đoán.
--
-- Ghi lúc nạp video; chưa có thì lưới tạm dùng khổ hình (doc → 9:16, ngang → 16:9).

alter table public.videos
  add column if not exists thumbnail_width integer,
  add column if not exists thumbnail_height integer;

comment on column public.videos.thumbnail_width is
  'Chiều rộng thật của ảnh bìa (px) — lưới /video dựng ô theo tỉ lệ này để không nhảy bố cục';
comment on column public.videos.thumbnail_height is
  'Chiều cao thật của ảnh bìa (px) — đi kèm thumbnail_width';
