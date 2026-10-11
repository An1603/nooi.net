-- eKid — partial UNIQUE index trên link_code của các lời mời ĐANG CHỜ.
-- Lý do: mã liên kết được tra TOÀN CỤC theo link_code (không scope theo kid_id).
-- Nếu hai lời mời pending trùng mã, truy vấn `.limit(1)` có thể chọn tuỳ ý và
-- gắn người nhập mã sang BÉ KHÁC (lỗi tính đúng đắn kiêm bảo mật).
-- Chỉ ràng buộc các dòng status='pending' + link_code NOT NULL; dòng đã linked/
-- rejected vẫn giữ mã cũ để tra cứu lịch sử mà không chặn mã mới.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ekid_caregivers_linkcode_pending
  ON public.ekid_caregivers (link_code)
  WHERE status = 'pending' AND link_code IS NOT NULL;
