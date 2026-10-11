-- eKid — bỏ ràng buộc UNIQUE trên ekid_kids(user_id)
-- Lý do: cho phép MỘT tài khoản (người tạo/phụ huynh) quản lý NHIỀU hồ sơ con,
-- khớp với UI đa-con ở /app/ekid. Trước đây index UNIQUE(user_id) khiến hồ sơ
-- con thứ 2 bị lỗi 23505 → route trả 500 chung.
DROP INDEX IF EXISTS public.idx_ekid_kids_user;
