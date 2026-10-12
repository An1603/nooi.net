-- eKid v3.0: bộ nhớ biên tập (rolling) về từng bé.
-- Cột `memory` giữ bản tổng hợp ĐÃ BIÊN TẬP (tiếng Việt, ngắn gọn) về bé — tính cách,
-- sở thích, điểm mạnh/khó khăn, cảm xúc, tiến bộ — cập nhật dần mỗi buổi trò chuyện.
-- Dùng làm ngữ cảnh (recentNotes) cho system instruction của AI; cập nhật NGUYÊN TỬ
-- chỉ từ server (service_role), không lộ ra client ngoài các route đã kiểm quyền.
ALTER TABLE ekid_kids ADD COLUMN IF NOT EXISTS memory text;
