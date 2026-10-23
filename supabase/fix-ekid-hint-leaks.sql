-- Sửa các bậc gợi ý 1–3 đang LỘ ĐÁP ÁN (cổng C1 bắt được).
-- Nguyên tắc: bậc 1 hướng nhìn, bậc 2 gợi mở kiến thức, bậc 3 làm mẫu MỘT PHẦN —
-- không bậc nào được nói ra đáp án; đáp án chỉ ở bậc 4.
BEGIN;

-- ── Toán lớp 3 (lô 1) ───────────────────────────────────────────────────────
UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Có 5 chữ số; chữ số đứng đầu bên trái thuộc hàng lớn nhất trong 5 hàng."'::jsonb)
WHERE prompt = 'Trong số 78 405, chữ số 7 thuộc hàng nào?';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Số liền sau hơn số đã cho đúng 1 đơn vị. Khi cả 5 chữ số đều là 9 thì phải thêm một hàng mới bên trái."'::jsonb)
WHERE prompt = 'Số liền sau của 99 999 là số nào?';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Cộng phần nghìn: 2 + 3, rồi viết thêm ba chữ số 0 vào sau."'::jsonb)
WHERE prompt = 'Tính nhẩm: 2 000 + 3 000 bằng bao nhiêu?';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Trừ phần nghìn: 8 − 5, rồi viết thêm ba chữ số 0 vào sau."'::jsonb)
WHERE prompt = 'Tính nhẩm: 8 000 − 5 000 bằng bao nhiêu?';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Muốn tìm số hạng chưa biết, con lấy tổng trừ đi số hạng đã biết: 10 000 − 2 500."'::jsonb)
WHERE prompt = 'Tìm x, biết x + 2 500 = 10 000.';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"7 chia 4 được 1, 1 × 4 = 4, 7 − 4 còn 3 — phần còn lại đó là số dư."'::jsonb)
WHERE prompt = '47 chia 4 bằng bao nhiêu và dư mấy?';

-- ── Tiếng Việt lớp 3 (lô 2) ────────────────────────────────────────────────
UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Người xuất hiện đầu tiên trong câu, là người ra vườn tưới rau."'::jsonb)
WHERE prompt LIKE 'Nghe đoạn văn:%Đoạn văn nói về ai?';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Vật đó cũng tròn, cũng phát sáng vào buổi tối."'::jsonb)
WHERE prompt = 'Trong đoạn văn vừa rồi, quả cà chua được so sánh với gì?';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Từ ''như'' nối hai sự vật giống nhau — đó là dấu hiệu của biện pháp tu từ này."'::jsonb)
WHERE prompt LIKE 'Câu văn ''đỏ ửng như%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Việc chú làm mỗi chiều, lặp đi lặp lại, hướng ra ngõ."'::jsonb)
WHERE prompt LIKE 'Trong đoạn về chú chó%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Phần đứng sau dấu hai chấm chính là lời của mẹ, được kể nguyên văn."'::jsonb)
WHERE prompt LIKE 'Dấu hai chấm trong câu%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Khi cảm xúc mạnh, người viết muốn người đọc nghe được giọng điệu của mình."'::jsonb)
WHERE prompt = 'Vì sao câu cảm thường có dấu chấm than?';

-- ── Thêm 2 câu mức 3 cho bài đọc–viết số (bài cũ chỉ có câu mức 1–2) ───────
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
SELECT l.id, 'TO3.SP.01', 3, 'noi', 9,
  'Một kho có 45 230 ki-lô-gam gạo, nhập thêm 4 500 ki-lô-gam. Kho có bao nhiêu ki-lô-gam gạo?',
  '{"value": "49730", "alt": ["49 730", "bốn mươi chín nghìn bảy trăm ba mươi"]}'::jsonb,
  '["Bài cho gì, hỏi gì? Có thêm nghĩa là làm phép gì?", "Đặt tính cộng thẳng hàng: đơn vị dưới đơn vị, nghìn dưới nghìn.", "45 230 + 4 500: 0 + 0 = 0; 3 + 0 = 3; 2 + 5 = 7; 5 + 4 = 9; 4 giữ nguyên."]'::jsonb
FROM public.ekid_lessons l WHERE l.slug = 'toan3-doc-viet-so-100000'
  AND NOT EXISTS (SELECT 1 FROM public.ekid_items i WHERE i.lesson_id = l.id AND i.sort_order = 9);

INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
SELECT l.id, 'TO3.SP.01', 3, 'giai_thich', 10,
  'Vì sao số 70 005 phải đọc là “bảy mươi nghìn không trăm linh năm”?',
  '{"value": "vì hàng trăm không có chữ số nào nên phải đọc không trăm, rồi đọc tiếp hàng chục và hàng đơn vị", "rubric": ["Nói được ''vì có số 0''.", "Nói được ''số 0 ở hàng trăm phải đọc là không trăm''.", "Nói được cả ba phần: không trăm, linh, và đọc tiếp hai chữ số cuối."]}'::jsonb,
  '["Con đọc từng hàng từ trái sang phải xem hàng nào không có chữ số.", "Hàng trăm là chữ số 0 — nếu bỏ qua thì người nghe hiểu thành số khác.", "Đọc đủ ba phần: bảy mươi nghìn / không trăm / linh năm."]'::jsonb
FROM public.ekid_lessons l WHERE l.slug = 'toan3-doc-viet-so-100000'
  AND NOT EXISTS (SELECT 1 FROM public.ekid_items i WHERE i.lesson_id = l.id AND i.sort_order = 10);

COMMIT;
