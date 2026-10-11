-- Seed bài học mẫu cho eKid — 9 bài (3 nhóm tuổi × 3 bài).
-- Nhóm tuổi: mam-non | tieu-hoc | thieu-nien
-- Cột exercises là jsonb: mảng câu hỏi {question, options, answer_index, type}.
INSERT INTO public.ekid_lessons (age_band, title, part, core_topic, system_prompt, exercises, difficulty)
VALUES
-- ===== Mầm non =====
('mam-non','Bảng chữ cái A Ă Â','chung','Nhận biết chữ cái','Dạy bé nhận mặt chữ A, Ă, Â qua hình ảnh.',
 '[{"question":"Đây là chữ gì?","options":["A","B","C","D"],"answer_index":0,"type":"chon-hinh"},{"question":"Chữ nào có dấu mũ?","options":["A","Ă","E","I"],"answer_index":1,"type":"chon-hinh"}]',1),
('mam-non','Đếm số 1-5','chung','Đếm số lượng','Dạy bé đếm từ 1 đến 5 qua đồ vật.',
 '[{"question":"Có mấy quả táo?","options":["2","3","4","5"],"answer_index":2,"type":"dem"},{"question":"Số nào sau số 2?","options":["1","3","4","5"],"answer_index":1,"type":"nghe-chon"}]',1),
('mam-non','Nhận biết màu sắc','chung','Phân biệt màu','Dạy bé nhận biết các màu cơ bản qua đồ vật quen thuộc.',
 '[{"question":"Quả chuối chín có màu gì?","options":["Đỏ","Vàng","Xanh","Tím"],"answer_index":1,"type":"chon-hinh"},{"question":"Bầu trời ban ngày màu gì?","options":["Xanh","Đen","Nâu","Hồng"],"answer_index":0,"type":"chon-hinh"}]',1),
-- ===== Tiểu học =====
('tieu-hoc','Cộng trừ trong phạm vi 20','chung','Toán cơ bản','Dạy bé cộng trừ đơn giản.',
 '[{"question":"5 + 7 = ?","options":["11","12","13","10"],"answer_index":1,"type":"nghe-chon"},{"question":"15 - 6 = ?","options":["8","9","10","7"],"answer_index":1,"type":"nghe-chon"}]',2),
('tieu-hoc','Đọc hiểu đoạn ngắn','chung','Đọc hiểu','Đọc đoạn ngắn rồi hỏi nội dung.',
 '[{"question":"Con mèo trong bài màu gì?","options":["Đen","Trắng","Vàng","Xám"],"answer_index":1,"type":"chon-hinh"}]',2),
('tieu-hoc','Chính tả cơ bản','chung','Viết đúng chính tả','Luyện bé phân biệt ch/tr, s/x qua từ quen thuộc.',
 '[{"question":"Từ nào viết đúng?","options":["con chó","con tró","con chố","con chò"],"answer_index":0,"type":"nghe-chon"},{"question":"Từ nào viết đúng?","options":["xinh xắn","sinh sắn","xinh sắn","sinh xắn"],"answer_index":0,"type":"nghe-chon"}]',2),
-- ===== Thiếu niên =====
('thieu-nien','Tư duy logic','chung','Suy luận','Bài đố logic đơn giản cho thiếu niên.',
 '[{"question":"Nếu hôm nay thứ 3, 2 ngày nữa là thứ mấy?","options":["Thứ 4","Thứ 5","Thứ 6","Thứ 7"],"answer_index":1,"type":"nghe-chon"}]',3),
('thieu-nien','Quy luật dãy số','chung','Tìm quy luật','Tìm số tiếp theo trong dãy theo quy luật cho trước.',
 '[{"question":"2, 4, 6, 8, ...?","options":["9","10","11","12"],"answer_index":1,"type":"nghe-chon"},{"question":"1, 3, 9, 27, ...?","options":["54","72","81","108"],"answer_index":2,"type":"nghe-chon"}]',3),
('thieu-nien','Đọc hiểu nâng cao','chung','Đọc hiểu','Đọc đoạn văn rồi suy luận ý chính và thông điệp.',
 '[{"question":"Ý chính của đoạn văn là gì?","options":["Bảo vệ môi trường","Nuôi thú cưng","Học toán","Chơi thể thao"],"answer_index":0,"type":"nghe-chon"},{"question":"Thông điệp tác giả muốn gửi gắm là gì?","options":["Tiết kiệm nước","Chăm chỉ học tập","Trung thực","Đoàn kết"],"answer_index":2,"type":"nghe-chon"}]',3);
