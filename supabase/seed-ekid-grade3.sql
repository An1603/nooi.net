-- AUTO-GENERATED bởi scripts/gen-ekid-grade3-seed.py — đừng sửa tay.
-- Nguồn YCCĐ: TT 32/2018/TT-BGDĐT, môn Toán lớp 3.
BEGIN;

-- Yêu cầu cần đạt
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.SP.01', 'toan', 3, 'Số và phép tính', 'Số tự nhiên', 'Đọc, viết số đến 100 000', 'Đọc, viết được các số trong phạm vi 10 000; trong phạm vi 100 000.', 1, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.SP.02', 'toan', 3, 'Số và phép tính', 'Số tự nhiên', 'Cấu tạo thập phân, số tròn nghìn', 'Nhận biết được số tròn nghìn, tròn mười nghìn; nhận biết được cấu tạo thập phân của một số; nhận biết được chữ số La Mã và viết được các số tự nhiên trong phạm vi 20 bằng chữ số La Mã.', 1, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.SP.03', 'toan', 3, 'Số và phép tính', 'Số tự nhiên', 'So sánh, sắp xếp số', 'Nhận biết được cách so sánh hai số trong phạm vi 100 000; xác định được số lớn nhất hoặc số bé nhất trong một nhóm có không quá 4 số; sắp xếp được các số theo thứ tự trong một nhóm có không quá 4 số.', 2, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.SP.04', 'toan', 3, 'Số và phép tính', 'Số tự nhiên', 'Làm tròn số', 'Làm quen với việc làm tròn số đến tròn chục, tròn trăm, tròn nghìn, tròn mười nghìn.', 2, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.SP.05', 'toan', 3, 'Số và phép tính', 'Các phép tính với số tự nhiên', 'Cộng, trừ số có đến 5 chữ số', 'Thực hiện được phép cộng, phép trừ các số có đến 5 chữ số (có nhớ không quá hai lượt và không liên tiếp).', 2, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.SP.06', 'toan', 3, 'Số và phép tính', 'Các phép tính với số tự nhiên', 'Bảng nhân, bảng chia 2–9', 'Vận dụng được các bảng nhân, bảng chia 2, 3, ..., 9 trong thực hành tính.', 1, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.SP.07', 'toan', 3, 'Số và phép tính', 'Các phép tính với số tự nhiên', 'Nhân với số có một chữ số', 'Thực hiện được phép nhân với số có một chữ số (có nhớ không quá hai lượt và không liên tiếp).', 2, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.SP.08', 'toan', 3, 'Số và phép tính', 'Các phép tính với số tự nhiên', 'Chia cho số có một chữ số', 'Thực hiện được phép chia cho số có một chữ số; nhận biết và thực hiện được phép chia hết và phép chia có dư.', 2, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.SP.09', 'toan', 3, 'Số và phép tính', 'Các phép tính với số tự nhiên', 'Tính nhẩm', 'Thực hiện được cộng, trừ, nhân, chia nhẩm trong những trường hợp đơn giản.', 1, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.SP.10', 'toan', 3, 'Số và phép tính', 'Các phép tính với số tự nhiên', 'Biểu thức số', 'Tính được giá trị của biểu thức số có đến hai dấu phép tính, có hoặc không có dấu ngoặc.', 3, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.SP.11', 'toan', 3, 'Số và phép tính', 'Giải quyết vấn đề', 'Giải toán có đến hai bước tính', 'Giải quyết được một số vấn đề gắn với việc giải các bài toán có đến hai bước tính, liên quan đến gấp một số lên một số lần, giảm một số đi một số lần, so sánh số lớn gấp mấy lần số bé.', 3, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.SP.12', 'toan', 3, 'Số và phép tính', 'Các phép tính với số tự nhiên', 'Tìm thành phần chưa biết', 'Xác định được thành phần chưa biết của phép tính thông qua các giá trị đã biết.', 3, 2)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.PS.01', 'toan', 3, 'Số và phép tính', 'Phân số', 'Làm quen phân số đơn vị', 'Nhận biết được các phân số 1/2, 1/3, ..., 1/9.', 1, 2)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.PS.02', 'toan', 3, 'Số và phép tính', 'Phân số', 'Một phần mấy của một nhóm', 'Xác định được 1/2, 1/3, ..., 1/9 của một nhóm đồ vật bằng việc chia thành các phần đều nhau.', 2, 2)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.HH.01', 'toan', 3, 'Hình học và đo lường', 'Hình học trực quan', 'Điểm ở giữa, trung điểm', 'Nhận biết được điểm ở giữa, trung điểm của đoạn thẳng.', 1, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.HH.02', 'toan', 3, 'Hình học và đo lường', 'Hình học trực quan', 'Góc, góc vuông', 'Nhận biết được góc, góc vuông, góc không vuông; sử dụng được ê-ke để kiểm tra góc vuông.', 1, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.HH.03', 'toan', 3, 'Hình học và đo lường', 'Hình học trực quan', 'Tam giác, tứ giác, hình chữ nhật, hình vuông', 'Nhận biết được tam giác, tứ giác; nhận biết được một số yếu tố cơ bản như đỉnh, cạnh, góc của hình chữ nhật, hình vuông.', 1, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.HH.04', 'toan', 3, 'Hình học và đo lường', 'Hình học trực quan', 'Hình tròn', 'Nhận biết được tâm, bán kính, đường kính của hình tròn; sử dụng được compa để vẽ đường tròn.', 1, 2)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.HH.05', 'toan', 3, 'Hình học và đo lường', 'Hình học trực quan', 'Khối lập phương, khối hộp chữ nhật', 'Nhận biết được một số yếu tố cơ bản như đỉnh, cạnh, mặt của khối lập phương, khối hộp chữ nhật.', 1, 2)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.DL.01', 'toan', 3, 'Hình học và đo lường', 'Đo lường', 'Đơn vị đo mm, g, ml, °C, cm²', 'Nhận biết được các đơn vị đo mm, g, ml, °C, cm² và quan hệ giữa các đơn vị đã học.', 1, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.DL.02', 'toan', 3, 'Hình học và đo lường', 'Đo lường', 'Tiền Việt Nam, thời gian', 'Nhận biết được mệnh giá các tờ tiền Việt Nam trong phạm vi 100 000 đồng; nhận biết được tháng trong năm; đọc được giờ chính xác đến 5 phút.', 1, 1)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.DL.03', 'toan', 3, 'Hình học và đo lường', 'Đo lường', 'Chu vi hình đã học', 'Tính được chu vi của hình tam giác, hình tứ giác, hình chữ nhật, hình vuông khi biết độ dài các cạnh.', 2, 2)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.DL.04', 'toan', 3, 'Hình học và đo lường', 'Đo lường', 'Diện tích hình chữ nhật, hình vuông', 'Tính được diện tích hình chữ nhật, hình vuông.', 2, 2)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.DL.05', 'toan', 3, 'Hình học và đo lường', 'Đo lường', 'Ước lượng và giải vấn đề đo lường', 'Thực hiện được việc ước lượng các kết quả đo lường trong một số trường hợp đơn giản; giải quyết được một số vấn đề thực tiễn liên quan đến đo lường.', 3, 2)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.TK.01', 'toan', 3, 'Một số yếu tố thống kê và xác suất', 'Thống kê', 'Thu thập, phân loại số liệu', 'Nhận biết được cách thu thập, phân loại, ghi chép số liệu thống kê theo các tiêu chí cho trước.', 1, 2)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.TK.02', 'toan', 3, 'Một số yếu tố thống kê và xác suất', 'Thống kê', 'Đọc, mô tả bảng số liệu', 'Đọc và mô tả được các số liệu ở dạng bảng.', 1, 2)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.TK.03', 'toan', 3, 'Một số yếu tố thống kê và xác suất', 'Thống kê', 'Nhận xét từ bảng số liệu', 'Nêu được một số nhận xét đơn giản từ bảng số liệu.', 2, 2)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;
INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)
VALUES ('TO3.TK.04', 'toan', 3, 'Một số yếu tố thống kê và xác suất', 'Xác suất', 'Khả năng xảy ra của sự kiện', 'Nhận biết và mô tả được các khả năng xảy ra (có tính ngẫu nhiên) của một sự kiện.', 1, 2)
ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, term=EXCLUDED.term, active=TRUE;

-- Bài học + câu hỏi
INSERT INTO public.ekid_lessons (slug, age_band, grade, subject, title, part, core_topic, system_prompt, objective_ids, est_minutes, script_hint, sort_order, status)
VALUES ('toan3-doc-viet-so-100000', 'tieu-hoc', 3, 'toan', 'Đọc, viết số đến 100 000', 'chung', 'toan-lop-3', 'Bài học Toán lớp 3: Đọc, viết số đến 100 000', ARRAY['TO3.SP.01','TO3.SP.02'], 10, 'Bé lớp 3 lần đầu gặp số có 5 chữ số. Đi từ nhóm ba chữ số, đọc từ trái sang phải. Sau mỗi số, hỏi bé chỉ ra hàng của một chữ số bất kỳ để kiểm tra hiểu cấu tạo thập phân.', (SELECT COALESCE(MAX(sort_order),0)+1 FROM public.ekid_lessons), 'active')
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, objective_ids=EXCLUDED.objective_ids, script_hint=EXCLUDED.script_hint, est_minutes=EXCLUDED.est_minutes, status='active';
DELETE FROM public.ekid_items WHERE lesson_id = (SELECT id FROM public.ekid_lessons WHERE slug='toan3-doc-viet-so-100000');
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-doc-viet-so-100000'), 'TO3.SP.01', 1, 'noi', 1, 'Số 45 230 đọc thế nào?', '{"value": "bốn mươi lăm nghìn hai trăm ba mươi"}'::jsonb, '["Con thử đọc nhóm ba chữ số bên phải trước xem nào.", "Nhóm bên trái là 45 — đọc là bốn mươi lăm nghìn.", "Ghép lại: bốn mươi lăm nghìn + hai trăm ba mươi.", "Đáp án: bốn mươi lăm nghìn hai trăm ba mươi. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-doc-viet-so-100000'), 'TO3.SP.02', 1, 'chon', 2, 'Số nào là số tròn nghìn? A. 3 400   B. 3 000   C. 3 040', '{"value": "B"}'::jsonb, '["Con nhìn ba chữ số cuối của mỗi số.", "Số tròn nghìn thì ba chữ số cuối đều là 0.", "3 000 có ba chữ số cuối là 000.", "Đáp án: B. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-doc-viet-so-100000'), 'TO3.SP.02', 1, 'noi', 3, 'Trong số 78 405, chữ số 7 thuộc hàng nào?', '{"value": "hàng chục nghìn"}'::jsonb, '["Con đếm từ phải sang trái: đơn vị, chục, trăm, nghìn, chục nghìn.", "Chữ số 7 đứng đầu tiên bên trái.", "Năm chữ số thì hàng đầu tiên bên trái là hàng chục nghìn.", "Đáp án: hàng chục nghìn. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-doc-viet-so-100000'), 'TO3.SP.02', 2, 'chon', 4, 'Số 60 000 gồm mấy chục nghìn? A. 6   B. 60   C. 600', '{"value": "A"}'::jsonb, '["Con bỏ ba chữ số 0 ở cuối rồi đọc phần còn lại.", "60 000 = 6 × 10 000.", "Vậy là 6 chục nghìn.", "Đáp án: A. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-doc-viet-so-100000'), 'TO3.SP.01', 1, 'noi', 5, 'Viết số: bảy mươi nghìn không trăm linh năm.', '{"value": "70 005", "alt": ["70005"]}'::jsonb, '["Con viết nhóm nghìn trước: bảy mươi nghìn là bao nhiêu?", "Phần sau là ''không trăm linh năm'' — viết là 005.", "Ghép 70 và 005, nhớ viết đủ chữ số 0 ở giữa.", "Đáp án: 70 005. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-doc-viet-so-100000'), 'TO3.SP.02', 1, 'chon', 6, 'Số La Mã XII là số nào? A. 10   B. 11   C. 12', '{"value": "C"}'::jsonb, '["X là 10, con nhớ nhé.", "I là 1, đứng sau X thì cộng thêm.", "X + I + I = 10 + 1 + 1.", "Đáp án: C. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-doc-viet-so-100000'), 'TO3.SP.02', 3, 'giai_thich', 7, 'Vì sao 20 000 + 5 000 = 25 000? Con giải thích bằng lời của con.', '{"value": "vì 2 chục nghìn cộng 5 nghìn thành 25 nghìn", "rubric": ["Nói được kết quả nhưng chưa giải thích.", "Nói được ''2 chục nghìn cộng 5 nghìn''.", "Nói được cả cách cộng theo hàng nghìn và đọc lại kết quả."]}'::jsonb, '["Con đọc 20 000 là mấy chục nghìn?", "Vậy 2 chục nghìn thêm 5 nghìn là bao nhiêu nghìn?", "20 000 là 2 chục nghìn, thêm 5 000 nữa thành 25 000.", "Đáp án: vì 2 chục nghìn cộng 5 nghìn thành 25 nghìn. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-doc-viet-so-100000'), 'TO3.SP.01', 2, 'noi', 8, 'Số liền sau của 99 999 là số nào?', '{"value": "100 000"}'::jsonb, '["Con thêm 1 vào 99 999 xem nào.", "99 999 + 1 thì hàng nghìn nhớ sang hàng chục nghìn.", "Chín chữ số 9 sẽ thành 100 000.", "Đáp án: 100 000. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);

INSERT INTO public.ekid_lessons (slug, age_band, grade, subject, title, part, core_topic, system_prompt, objective_ids, est_minutes, script_hint, sort_order, status)
VALUES ('toan3-so-sanh-so', 'tieu-hoc', 3, 'toan', 'So sánh và làm tròn số', 'chung', 'toan-lop-3', 'Bài học Toán lớp 3: So sánh và làm tròn số', ARRAY['TO3.SP.03','TO3.SP.04'], 10, 'Trọng tâm: so sánh từ hàng lớn nhất bên trái; số có nhiều chữ số hơn thì lớn hơn. Làm tròn: xem chữ số ngay bên phải hàng cần làm tròn, từ 5 trở lên thì thêm 1.', (SELECT COALESCE(MAX(sort_order),0)+1 FROM public.ekid_lessons), 'active')
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, objective_ids=EXCLUDED.objective_ids, script_hint=EXCLUDED.script_hint, est_minutes=EXCLUDED.est_minutes, status='active';
DELETE FROM public.ekid_items WHERE lesson_id = (SELECT id FROM public.ekid_lessons WHERE slug='toan3-so-sanh-so');
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-so-sanh-so'), 'TO3.SP.03', 2, 'chon', 1, 'So sánh: 45 230 ... 39 999. A. >   B. <   C. =', '{"value": "A"}'::jsonb, '["Con đếm số chữ số của hai số trước.", "Hai số đều có 5 chữ số, so hàng chục nghìn.", "4 chục nghìn lớn hơn 3 chục nghìn.", "Đáp án: A. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-so-sanh-so'), 'TO3.SP.03', 2, 'noi', 2, 'Số lớn nhất trong nhóm: 12 000; 21 000; 20 100; 9 999 là số nào?', '{"value": "21 000"}'::jsonb, '["Con tách riêng số có bốn chữ số ra đã.", "Ba số còn lại đều 5 chữ số, so hàng chục nghìn.", "Số nào có hàng chục nghìn lớn nhất?", "Đáp án: 21 000. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-so-sanh-so'), 'TO3.SP.03', 2, 'noi', 3, 'Sắp xếp ba số sau từ bé đến lớn: 8 500; 5 800; 8 050.', '{"value": "5 800; 8 050; 8 500"}'::jsonb, '["Con tìm số bé nhất trước.", "Hai số 8 500 và 8 050: so hàng trăm.", "8 050 có hàng trăm là 0, nhỏ hơn 500.", "Đáp án: 5 800; 8 050; 8 500. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-so-sanh-so'), 'TO3.SP.04', 2, 'noi', 4, 'Làm tròn số 1 234 đến hàng chục.', '{"value": "1 230"}'::jsonb, '["Con xem chữ số hàng đơn vị là mấy.", "Chữ số hàng đơn vị là 4, nhỏ hơn 5.", "Nhỏ hơn 5 thì giữ nguyên hàng chục, thay hàng đơn vị bằng 0.", "Đáp án: 1 230. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-so-sanh-so'), 'TO3.SP.04', 2, 'noi', 5, 'Làm tròn số 3 780 đến hàng trăm.', '{"value": "3 800"}'::jsonb, '["Con xem chữ số hàng chục là mấy.", "Hàng chục là 8, từ 5 trở lên.", "Từ 5 trở lên thì thêm 1 vào hàng trăm: 37 thành 38 trăm.", "Đáp án: 3 800. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-so-sanh-so'), 'TO3.SP.03', 1, 'chon', 6, 'Số bé nhất trong nhóm 60 000; 6 000; 66 000 là: A. 60 000   B. 6 000   C. 66 000', '{"value": "B"}'::jsonb, '["Con đếm số chữ số của từng số.", "Số có ít chữ số nhất thì bé nhất.", "6 000 có bốn chữ số, hai số kia có năm chữ số.", "Đáp án: B. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-so-sanh-so'), 'TO3.SP.03', 3, 'giai_thich', 7, 'Vì sao khi so sánh hai số, mình bắt đầu từ hàng lớn nhất bên trái?', '{"value": "vì hàng lớn nhất quyết định giá trị lớn hơn hay bé hơn", "rubric": ["Nói lại được quy tắc nhưng chưa giải thích.", "Nói được ''hàng lớn hơn thì quyết định trước''.", "Nói được ví dụ cụ thể và kết luận vì sao không cần so các hàng sau."]}'::jsonb, '["Hàng chục nghìn và hàng đơn vị, hàng nào lớn hơn?", "Nếu hàng chục nghìn đã khác nhau thì các hàng sau còn cần so không?", "Ví dụ 45 000 và 39 000: 4 chục nghìn > 3 chục nghìn nên 45 000 lớn hơn, không cần so tiếp.", "Đáp án: vì hàng lớn nhất quyết định giá trị lớn hơn hay bé hơn. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-so-sanh-so'), 'TO3.SP.03', 3, 'noi', 8, 'Một bạn nói 9 999 > 10 000. Con thấy đúng hay sai, vì sao?', '{"value": "sai, vì 9 999 có bốn chữ số còn 10 000 có năm chữ số"}'::jsonb, '["Con đếm số chữ số của hai số.", "Số có nhiều chữ số hơn thì lớn hơn.", "9 999 là gần 10 000 nhưng vẫn bé hơn 10 000.", "Đáp án: sai, vì 9 999 có bốn chữ số còn 10 000 có năm chữ số. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);

INSERT INTO public.ekid_lessons (slug, age_band, grade, subject, title, part, core_topic, system_prompt, objective_ids, est_minutes, script_hint, sort_order, status)
VALUES ('toan3-cong-tru-5-chu-so', 'tieu-hoc', 3, 'toan', 'Cộng, trừ số có đến 5 chữ số', 'chung', 'toan-lop-3', 'Bài học Toán lớp 3: Cộng, trừ số có đến 5 chữ số', ARRAY['TO3.SP.05','TO3.SP.09','TO3.SP.12'], 12, 'Bé đặt tính rồi tính. Nhấn mạnh: viết thẳng cột theo hàng, cộng/trừ từ phải sang trái, nhớ sang hàng bên trái. Xen câu tính nhẩm để bé không chỉ máy móc đặt tính.', (SELECT COALESCE(MAX(sort_order),0)+1 FROM public.ekid_lessons), 'active')
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, objective_ids=EXCLUDED.objective_ids, script_hint=EXCLUDED.script_hint, est_minutes=EXCLUDED.est_minutes, status='active';
DELETE FROM public.ekid_items WHERE lesson_id = (SELECT id FROM public.ekid_lessons WHERE slug='toan3-cong-tru-5-chu-so');
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-cong-tru-5-chu-so'), 'TO3.SP.05', 2, 'noi', 1, '34 125 + 12 340 bằng bao nhiêu?', '{"value": "46 465"}'::jsonb, '["Con đặt tính dọc, các hàng thẳng cột.", "Cộng từ hàng đơn vị: 5 + 0 = 5.", "Tiếp: 2+4, 1+3, 4+2, 3+1 — không có nhớ.", "Đáp án: 46 465. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-cong-tru-5-chu-so'), 'TO3.SP.05', 2, 'noi', 2, '58 700 − 23 400 bằng bao nhiêu?', '{"value": "35 300"}'::jsonb, '["Con đặt tính rồi trừ từ phải sang trái.", "Hàng đơn vị và hàng chục đều là 0 trừ 0.", "Hàng trăm: 7 − 4 = 3; hàng nghìn: 8 − 3 = 5.", "Đáp án: 35 300. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-cong-tru-5-chu-so'), 'TO3.SP.09', 1, 'noi', 3, 'Tính nhẩm: 2 000 + 3 000 bằng bao nhiêu?', '{"value": "5 000"}'::jsonb, '["Con bỏ ba chữ số 0, nhẩm 2 + 3.", "2 + 3 = 5.", "Thêm ba chữ số 0 vào: 5 000.", "Đáp án: 5 000. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-cong-tru-5-chu-so'), 'TO3.SP.09', 1, 'noi', 4, 'Tính nhẩm: 8 000 − 5 000 bằng bao nhiêu?', '{"value": "3 000"}'::jsonb, '["Con nhẩm 8 − 5 trước.", "8 − 5 = 3.", "Thêm ba chữ số 0: 3 000.", "Đáp án: 3 000. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-cong-tru-5-chu-so'), 'TO3.SP.11', 3, 'noi', 5, 'Cửa hàng có 45 600 kg gạo, đã bán 18 200 kg. Còn lại bao nhiêu ki-lô-gam?', '{"value": "27 400 kg"}'::jsonb, '["Bài này hỏi còn lại nên mình làm phép gì?", "Lấy số có trừ số đã bán.", "45 600 − 18 200: đặt tính rồi trừ từ phải sang trái.", "Đáp án: 27 400 kg. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-cong-tru-5-chu-so'), 'TO3.SP.05', 3, 'giai_thich', 6, 'Con nói cách đặt tính của phép 45 230 + 8 745.', '{"value": "viết thẳng cột theo hàng rồi cộng từ phải sang trái, nhớ khi quá 9", "rubric": ["Nói được ''đặt tính rồi tính'' chung chung.", "Nói được phải thẳng cột và cộng từ phải sang trái.", "Nói được cả quy tắc nhớ khi tổng một hàng vượt quá 9."]}'::jsonb, '["Trước khi tính, con phải làm gì với hai số?", "Các chữ số cùng hàng nên viết thế nào?", "Viết 45 230 rồi viết 8 745 sao cho hàng đơn vị thẳng hàng đơn vị, rồi cộng từ phải sang trái.", "Đáp án: viết thẳng cột theo hàng rồi cộng từ phải sang trái, nhớ khi quá 9. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-cong-tru-5-chu-so'), 'TO3.SP.12', 3, 'noi', 7, 'Tìm x, biết x + 2 500 = 10 000.', '{"value": "7 500"}'::jsonb, '["Muốn tìm số hạng chưa biết, con làm phép gì?", "Lấy tổng trừ đi số hạng đã biết.", "10 000 − 2 500 = 7 500.", "Đáp án: 7 500. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-cong-tru-5-chu-so'), 'TO3.SP.05', 2, 'chon', 8, '27 000 − 9 000 bằng: A. 18 000   B. 19 000   C. 17 000', '{"value": "A"}'::jsonb, '["Con nhẩm 27 − 9.", "27 − 9 = 18.", "Thêm ba chữ số 0: 18 000.", "Đáp án: A. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);

INSERT INTO public.ekid_lessons (slug, age_band, grade, subject, title, part, core_topic, system_prompt, objective_ids, est_minutes, script_hint, sort_order, status)
VALUES ('toan3-bang-nhan-chia', 'tieu-hoc', 3, 'toan', 'Bảng nhân, bảng chia và tính nhẩm', 'chung', 'toan-lop-3', 'Bài học Toán lớp 3: Bảng nhân, bảng chia và tính nhẩm', ARRAY['TO3.SP.06','TO3.SP.09','TO3.PS.02'], 10, 'Ôn bảng nhân 2–9 bằng cách hỏi xuôi và hỏi ngược (chia). Với câu sai, hỏi lại bằng bảng liền kề: 7 × 8 = 7 × 7 + 7.', (SELECT COALESCE(MAX(sort_order),0)+1 FROM public.ekid_lessons), 'active')
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, objective_ids=EXCLUDED.objective_ids, script_hint=EXCLUDED.script_hint, est_minutes=EXCLUDED.est_minutes, status='active';
DELETE FROM public.ekid_items WHERE lesson_id = (SELECT id FROM public.ekid_lessons WHERE slug='toan3-bang-nhan-chia');
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-bang-nhan-chia'), 'TO3.SP.06', 1, 'noi', 1, '7 × 8 bằng bao nhiêu?', '{"value": "56"}'::jsonb, '["Con nhẩm bảng nhân 7.", "7 × 7 = 49, thêm một lần 7 nữa.", "49 + 7 = 56.", "Đáp án: 56. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-bang-nhan-chia'), 'TO3.SP.06', 1, 'noi', 2, '63 : 9 bằng bao nhiêu?', '{"value": "7"}'::jsonb, '["Con nghĩ xem 9 nhân mấy bằng 63.", "9 × 6 = 54, còn thiếu 9 nữa.", "9 × 7 = 63 nên 63 : 9 = 7.", "Đáp án: 7. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-bang-nhan-chia'), 'TO3.SP.06', 1, 'noi', 3, '6 × 7 bằng bao nhiêu?', '{"value": "42"}'::jsonb, '["Con nhẩm bảng nhân 6.", "6 × 6 = 36, thêm 6.", "36 + 6 = 42.", "Đáp án: 42. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-bang-nhan-chia'), 'TO3.SP.09', 1, 'noi', 4, 'Tính nhẩm: 8 × 10 bằng bao nhiêu?', '{"value": "80"}'::jsonb, '["Nhân với 10 thì thêm một chữ số 0 vào bên phải.", "8 thêm một chữ số 0.", "8 × 10 = 80.", "Đáp án: 80. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-bang-nhan-chia'), 'TO3.SP.09', 2, 'noi', 5, 'Tính nhẩm: 400 : 4 bằng bao nhiêu?', '{"value": "100"}'::jsonb, '["Con bỏ hai chữ số 0 rồi nhẩm 4 : 4.", "4 : 4 = 1.", "Thêm hai chữ số 0: 100.", "Đáp án: 100. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-bang-nhan-chia'), 'TO3.SP.06', 1, 'chon', 6, '5 × 9 bằng: A. 40   B. 45   C. 54', '{"value": "B"}'::jsonb, '["Con nhẩm bảng nhân 5.", "5 × 8 = 40, thêm 5.", "40 + 5 = 45.", "Đáp án: B. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-bang-nhan-chia'), 'TO3.SP.06', 3, 'giai_thich', 7, 'Vì sao 6 × 7 và 7 × 6 cho cùng một kết quả?', '{"value": "vì đổi chỗ hai thừa số thì tích không đổi", "rubric": ["Nói được ''vì bằng nhau'' mà chưa giải thích.", "Nói được ''đổi chỗ hai số nhân''.", "Nói được tính chất giao hoán và cho ví dụ."]}'::jsonb, '["Con thử đếm 6 hàng, mỗi hàng 7 cái, rồi đổi thành 7 hàng mỗi hàng 6 cái.", "Số cái có đổi không?", "Vì 6 nhóm 7 và 7 nhóm 6 đều là 42 cái — đổi chỗ hai thừa số thì tích không đổi.", "Đáp án: vì đổi chỗ hai thừa số thì tích không đổi. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);
INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)
VALUES ((SELECT id FROM public.ekid_lessons WHERE slug='toan3-bang-nhan-chia'), 'TO3.SP.11', 3, 'noi', 8, 'Một hộp có 8 bút. Chín hộp như thế có bao nhiêu bút?', '{"value": "72 bút"}'::jsonb, '["Bài này lặp lại 9 lần, mình làm phép gì?", "Lấy 8 nhân với 9.", "8 × 9 = 72.", "Đáp án: 72 bút. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb);

COMMIT;
