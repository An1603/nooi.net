#!/usr/bin/env python3
"""Sinh file seed SQL cho eKid lớp 3 từ dữ liệu có cấu trúc.

Chạy: python3 scripts/gen-ekid-grade3-seed.py > supabase/seed-ekid-grade3.sql
Nguồn YCCĐ: TT 32/2018/TT-BGDĐT (bảng "Nội dung | Yêu cầu cần đạt" môn Toán lớp 3).
"""
import json

OBJ = [
    # id, strand, topic, code_short, statement, level, term
    ("TO3.SP.01", "Số và phép tính", "Số tự nhiên", "Đọc, viết số đến 100 000",
     "Đọc, viết được các số trong phạm vi 10 000; trong phạm vi 100 000.", 1, 1),
    ("TO3.SP.02", "Số và phép tính", "Số tự nhiên", "Cấu tạo thập phân, số tròn nghìn",
     "Nhận biết được số tròn nghìn, tròn mười nghìn; nhận biết được cấu tạo thập phân của một số; nhận biết được chữ số La Mã và viết được các số tự nhiên trong phạm vi 20 bằng chữ số La Mã.", 1, 1),
    ("TO3.SP.03", "Số và phép tính", "Số tự nhiên", "So sánh, sắp xếp số",
     "Nhận biết được cách so sánh hai số trong phạm vi 100 000; xác định được số lớn nhất hoặc số bé nhất trong một nhóm có không quá 4 số; sắp xếp được các số theo thứ tự trong một nhóm có không quá 4 số.", 2, 1),
    ("TO3.SP.04", "Số và phép tính", "Số tự nhiên", "Làm tròn số",
     "Làm quen với việc làm tròn số đến tròn chục, tròn trăm, tròn nghìn, tròn mười nghìn.", 2, 1),
    ("TO3.SP.05", "Số và phép tính", "Các phép tính với số tự nhiên", "Cộng, trừ số có đến 5 chữ số",
     "Thực hiện được phép cộng, phép trừ các số có đến 5 chữ số (có nhớ không quá hai lượt và không liên tiếp).", 2, 1),
    ("TO3.SP.06", "Số và phép tính", "Các phép tính với số tự nhiên", "Bảng nhân, bảng chia 2–9",
     "Vận dụng được các bảng nhân, bảng chia 2, 3, ..., 9 trong thực hành tính.", 1, 1),
    ("TO3.SP.07", "Số và phép tính", "Các phép tính với số tự nhiên", "Nhân với số có một chữ số",
     "Thực hiện được phép nhân với số có một chữ số (có nhớ không quá hai lượt và không liên tiếp).", 2, 1),
    ("TO3.SP.08", "Số và phép tính", "Các phép tính với số tự nhiên", "Chia cho số có một chữ số",
     "Thực hiện được phép chia cho số có một chữ số; nhận biết và thực hiện được phép chia hết và phép chia có dư.", 2, 1),
    ("TO3.SP.09", "Số và phép tính", "Các phép tính với số tự nhiên", "Tính nhẩm",
     "Thực hiện được cộng, trừ, nhân, chia nhẩm trong những trường hợp đơn giản.", 1, 1),
    ("TO3.SP.10", "Số và phép tính", "Các phép tính với số tự nhiên", "Biểu thức số",
     "Tính được giá trị của biểu thức số có đến hai dấu phép tính, có hoặc không có dấu ngoặc.", 3, 1),
    ("TO3.SP.11", "Số và phép tính", "Giải quyết vấn đề", "Giải toán có đến hai bước tính",
     "Giải quyết được một số vấn đề gắn với việc giải các bài toán có đến hai bước tính, liên quan đến gấp một số lên một số lần, giảm một số đi một số lần, so sánh số lớn gấp mấy lần số bé.", 3, 1),
    ("TO3.SP.12", "Số và phép tính", "Các phép tính với số tự nhiên", "Tìm thành phần chưa biết",
     "Xác định được thành phần chưa biết của phép tính thông qua các giá trị đã biết.", 3, 2),
    ("TO3.PS.01", "Số và phép tính", "Phân số", "Làm quen phân số đơn vị",
     "Nhận biết được các phân số 1/2, 1/3, ..., 1/9.", 1, 2),
    ("TO3.PS.02", "Số và phép tính", "Phân số", "Một phần mấy của một nhóm",
     "Xác định được 1/2, 1/3, ..., 1/9 của một nhóm đồ vật bằng việc chia thành các phần đều nhau.", 2, 2),
    ("TO3.HH.01", "Hình học và đo lường", "Hình học trực quan", "Điểm ở giữa, trung điểm",
     "Nhận biết được điểm ở giữa, trung điểm của đoạn thẳng.", 1, 1),
    ("TO3.HH.02", "Hình học và đo lường", "Hình học trực quan", "Góc, góc vuông",
     "Nhận biết được góc, góc vuông, góc không vuông; sử dụng được ê-ke để kiểm tra góc vuông.", 1, 1),
    ("TO3.HH.03", "Hình học và đo lường", "Hình học trực quan", "Tam giác, tứ giác, hình chữ nhật, hình vuông",
     "Nhận biết được tam giác, tứ giác; nhận biết được một số yếu tố cơ bản như đỉnh, cạnh, góc của hình chữ nhật, hình vuông.", 1, 1),
    ("TO3.HH.04", "Hình học và đo lường", "Hình học trực quan", "Hình tròn",
     "Nhận biết được tâm, bán kính, đường kính của hình tròn; sử dụng được compa để vẽ đường tròn.", 1, 2),
    ("TO3.HH.05", "Hình học và đo lường", "Hình học trực quan", "Khối lập phương, khối hộp chữ nhật",
     "Nhận biết được một số yếu tố cơ bản như đỉnh, cạnh, mặt của khối lập phương, khối hộp chữ nhật.", 1, 2),
    ("TO3.DL.01", "Hình học và đo lường", "Đo lường", "Đơn vị đo mm, g, ml, °C, cm²",
     "Nhận biết được các đơn vị đo mm, g, ml, °C, cm² và quan hệ giữa các đơn vị đã học.", 1, 1),
    ("TO3.DL.02", "Hình học và đo lường", "Đo lường", "Tiền Việt Nam, thời gian",
     "Nhận biết được mệnh giá các tờ tiền Việt Nam trong phạm vi 100 000 đồng; nhận biết được tháng trong năm; đọc được giờ chính xác đến 5 phút.", 1, 1),
    ("TO3.DL.03", "Hình học và đo lường", "Đo lường", "Chu vi hình đã học",
     "Tính được chu vi của hình tam giác, hình tứ giác, hình chữ nhật, hình vuông khi biết độ dài các cạnh.", 2, 2),
    ("TO3.DL.04", "Hình học và đo lường", "Đo lường", "Diện tích hình chữ nhật, hình vuông",
     "Tính được diện tích hình chữ nhật, hình vuông.", 2, 2),
    ("TO3.DL.05", "Hình học và đo lường", "Đo lường", "Ước lượng và giải vấn đề đo lường",
     "Thực hiện được việc ước lượng các kết quả đo lường trong một số trường hợp đơn giản; giải quyết được một số vấn đề thực tiễn liên quan đến đo lường.", 3, 2),
    ("TO3.TK.01", "Một số yếu tố thống kê và xác suất", "Thống kê", "Thu thập, phân loại số liệu",
     "Nhận biết được cách thu thập, phân loại, ghi chép số liệu thống kê theo các tiêu chí cho trước.", 1, 2),
    ("TO3.TK.02", "Một số yếu tố thống kê và xác suất", "Thống kê", "Đọc, mô tả bảng số liệu",
     "Đọc và mô tả được các số liệu ở dạng bảng.", 1, 2),
    ("TO3.TK.03", "Một số yếu tố thống kê và xác suất", "Thống kê", "Nhận xét từ bảng số liệu",
     "Nêu được một số nhận xét đơn giản từ bảng số liệu.", 2, 2),
    ("TO3.TK.04", "Một số yếu tố thống kê và xác suất", "Xác suất", "Khả năng xảy ra của sự kiện",
     "Nhận biết và mô tả được các khả năng xảy ra (có tính ngẫu nhiên) của một sự kiện.", 1, 2),
]

# Bài học: slug, title, objectives, hint mặc định theo bài
LESSONS = [
    {
        "slug": "toan3-doc-viet-so-100000",
        "title": "Đọc, viết số đến 100 000",
        "objectives": ["TO3.SP.01", "TO3.SP.02"],
        "est": 10,
        "script": "Bé lớp 3 lần đầu gặp số có 5 chữ số. Đi từ nhóm ba chữ số, đọc từ trái sang phải. Sau mỗi số, hỏi bé chỉ ra hàng của một chữ số bất kỳ để kiểm tra hiểu cấu tạo thập phân.",
        "t1": "Con đọc số này theo từng nhóm ba chữ số từ phải sang trái giúp cô nhé.",
        "t2": "Mình tách số thành hai nhóm: nhóm nghìn ở bên trái, nhóm còn lại ở bên phải.",
        "t3": "Nhóm bên trái đọc trước rồi thêm chữ 'nghìn', sau đó đọc nhóm bên phải.",
    },
    {
        "slug": "toan3-so-sanh-so",
        "title": "So sánh và làm tròn số",
        "objectives": ["TO3.SP.03", "TO3.SP.04"],
        "est": 10,
        "script": "Trọng tâm: so sánh từ hàng lớn nhất bên trái; số có nhiều chữ số hơn thì lớn hơn. Làm tròn: xem chữ số ngay bên phải hàng cần làm tròn, từ 5 trở lên thì thêm 1.",
        "t1": "Con đếm xem mỗi số có bao nhiêu chữ số trước đã.",
        "t2": "Hai số cùng số chữ số thì so từ hàng lớn nhất bên trái sang.",
        "t3": "Hàng nghìn của hai số khác nhau — con so hàng nghìn trước.",
    },
    {
        "slug": "toan3-cong-tru-5-chu-so",
        "title": "Cộng, trừ số có đến 5 chữ số",
        "objectives": ["TO3.SP.05", "TO3.SP.09", "TO3.SP.12"],
        "est": 12,
        "script": "Bé đặt tính rồi tính. Nhấn mạnh: viết thẳng cột theo hàng, cộng/trừ từ phải sang trái, nhớ sang hàng bên trái. Xen câu tính nhẩm để bé không chỉ máy móc đặt tính.",
        "t1": "Con đặt tính dọc giúp cô: các chữ số cùng hàng phải thẳng cột với nhau.",
        "t2": "Mình tính từ hàng đơn vị bên phải trước, rồi mới sang hàng chục.",
        "t3": "Con tính từng hàng: đơn vị, chục, trăm, nghìn — nhớ cộng (hoặc trừ) phần nhớ.",
    },
    {
        "slug": "toan3-bang-nhan-chia",
        "title": "Bảng nhân, bảng chia và tính nhẩm",
        "objectives": ["TO3.SP.06", "TO3.SP.09", "TO3.PS.02"],
        "est": 10,
        "script": "Ôn bảng nhân 2–9 bằng cách hỏi xuôi và hỏi ngược (chia). Với câu sai, hỏi lại bằng bảng liền kề: 7 × 8 = 7 × 7 + 7.",
        "t1": "Con nhẩm lại bảng nhân tương ứng trong đầu nhé.",
        "t2": "Có thể lấy kết quả của phép liền trước rồi cộng thêm một lần.",
        "t3": "Ví dụ: 7 × 8 = 7 × 7 + 7 = 49 + 7.",
    },
]

# Câu hỏi: (kind, level, objective, prompt, answer, t1?, t2?, t3?, rubric?)
ITEMS = {
"toan3-doc-viet-so-100000": [
 ("noi", 1, "TO3.SP.01", "Số 45 230 đọc thế nào?",
  {"value": "bốn mươi lăm nghìn hai trăm ba mươi"},
  "Con thử đọc nhóm ba chữ số bên phải trước xem nào.", "Nhóm bên trái là 45 — đọc là bốn mươi lăm nghìn.",
  "Ghép lại: bốn mươi lăm nghìn + hai trăm ba mươi.", None),
 ("chon", 1, "TO3.SP.02", "Số nào là số tròn nghìn? A. 3 400   B. 3 000   C. 3 040",
  {"value": "B"}, "Con nhìn ba chữ số cuối của mỗi số.", "Số tròn nghìn thì ba chữ số cuối đều là 0.",
  "3 000 có ba chữ số cuối là 000.", None),
 ("noi", 1, "TO3.SP.02", "Trong số 78 405, chữ số 7 thuộc hàng nào?",
  {"value": "hàng chục nghìn"}, "Con đếm từ phải sang trái: đơn vị, chục, trăm, nghìn, chục nghìn.",
  "Chữ số 7 đứng đầu tiên bên trái.", "Năm chữ số thì hàng đầu tiên bên trái là hàng chục nghìn.", None),
 ("chon", 2, "TO3.SP.02", "Số 60 000 gồm mấy chục nghìn? A. 6   B. 60   C. 600",
  {"value": "A"}, "Con bỏ ba chữ số 0 ở cuối rồi đọc phần còn lại.", "60 000 = 6 × 10 000.",
  "Vậy là 6 chục nghìn.", None),
 ("noi", 1, "TO3.SP.01", "Viết số: bảy mươi nghìn không trăm linh năm.",
  {"value": "70 005", "alt": ["70005"]}, "Con viết nhóm nghìn trước: bảy mươi nghìn là bao nhiêu?",
  "Phần sau là 'không trăm linh năm' — viết là 005.", "Ghép 70 và 005, nhớ viết đủ chữ số 0 ở giữa.", None),
 ("chon", 1, "TO3.SP.02", "Số La Mã XII là số nào? A. 10   B. 11   C. 12",
  {"value": "C"}, "X là 10, con nhớ nhé.", "I là 1, đứng sau X thì cộng thêm.",
  "X + I + I = 10 + 1 + 1.", None),
 ("giai_thich", 3, "TO3.SP.02", "Vì sao 20 000 + 5 000 = 25 000? Con giải thích bằng lời của con.",
  {"value": "vì 2 chục nghìn cộng 5 nghìn thành 25 nghìn",
   "rubric": ["Nói được kết quả nhưng chưa giải thích.", "Nói được '2 chục nghìn cộng 5 nghìn'.", "Nói được cả cách cộng theo hàng nghìn và đọc lại kết quả."]},
  "Con đọc 20 000 là mấy chục nghìn?", "Vậy 2 chục nghìn thêm 5 nghìn là bao nhiêu nghìn?",
  "20 000 là 2 chục nghìn, thêm 5 000 nữa thành 25 000.", None),
 ("noi", 2, "TO3.SP.01", "Số liền sau của 99 999 là số nào?",
  {"value": "100 000"}, "Con thêm 1 vào 99 999 xem nào.", "99 999 + 1 thì hàng nghìn nhớ sang hàng chục nghìn.",
  "Chín chữ số 9 sẽ thành 100 000.", None),
],
"toan3-so-sanh-so": [
 ("chon", 2, "TO3.SP.03", "So sánh: 45 230 ... 39 999. A. >   B. <   C. =",
  {"value": "A"}, "Con đếm số chữ số của hai số trước.", "Hai số đều có 5 chữ số, so hàng chục nghìn.",
  "4 chục nghìn lớn hơn 3 chục nghìn.", None),
 ("noi", 2, "TO3.SP.03", "Số lớn nhất trong nhóm: 12 000; 21 000; 20 100; 9 999 là số nào?",
  {"value": "21 000"}, "Con tách riêng số có bốn chữ số ra đã.", "Ba số còn lại đều 5 chữ số, so hàng chục nghìn.",
  "Số nào có hàng chục nghìn lớn nhất?", None),
 ("noi", 2, "TO3.SP.03", "Sắp xếp ba số sau từ bé đến lớn: 8 500; 5 800; 8 050.",
  {"value": "5 800; 8 050; 8 500"}, "Con tìm số bé nhất trước.", "Hai số 8 500 và 8 050: so hàng trăm.",
  "8 050 có hàng trăm là 0, nhỏ hơn 500.", None),
 ("noi", 2, "TO3.SP.04", "Làm tròn số 1 234 đến hàng chục.",
  {"value": "1 230"}, "Con xem chữ số hàng đơn vị là mấy.", "Chữ số hàng đơn vị là 4, nhỏ hơn 5.",
  "Nhỏ hơn 5 thì giữ nguyên hàng chục, thay hàng đơn vị bằng 0.", None),
 ("noi", 2, "TO3.SP.04", "Làm tròn số 3 780 đến hàng trăm.",
  {"value": "3 800"}, "Con xem chữ số hàng chục là mấy.", "Hàng chục là 8, từ 5 trở lên.",
  "Từ 5 trở lên thì thêm 1 vào hàng trăm: 37 thành 38 trăm.", None),
 ("chon", 1, "TO3.SP.03", "Số bé nhất trong nhóm 60 000; 6 000; 66 000 là: A. 60 000   B. 6 000   C. 66 000",
  {"value": "B"}, "Con đếm số chữ số của từng số.", "Số có ít chữ số nhất thì bé nhất.",
  "6 000 có bốn chữ số, hai số kia có năm chữ số.", None),
 ("giai_thich", 3, "TO3.SP.03", "Vì sao khi so sánh hai số, mình bắt đầu từ hàng lớn nhất bên trái?",
  {"value": "vì hàng lớn nhất quyết định giá trị lớn hơn hay bé hơn",
   "rubric": ["Nói lại được quy tắc nhưng chưa giải thích.", "Nói được 'hàng lớn hơn thì quyết định trước'.", "Nói được ví dụ cụ thể và kết luận vì sao không cần so các hàng sau."]},
  "Hàng chục nghìn và hàng đơn vị, hàng nào lớn hơn?", "Nếu hàng chục nghìn đã khác nhau thì các hàng sau còn cần so không?",
  "Ví dụ 45 000 và 39 000: 4 chục nghìn > 3 chục nghìn nên 45 000 lớn hơn, không cần so tiếp.", None),
 ("noi", 3, "TO3.SP.03", "Một bạn nói 9 999 > 10 000. Con thấy đúng hay sai, vì sao?",
  {"value": "sai, vì 9 999 có bốn chữ số còn 10 000 có năm chữ số"}, "Con đếm số chữ số của hai số.",
  "Số có nhiều chữ số hơn thì lớn hơn.", "9 999 là gần 10 000 nhưng vẫn bé hơn 10 000.", None),
],
"toan3-cong-tru-5-chu-so": [
 ("noi", 2, "TO3.SP.05", "34 125 + 12 340 bằng bao nhiêu?",
  {"value": "46 465"}, "Con đặt tính dọc, các hàng thẳng cột.", "Cộng từ hàng đơn vị: 5 + 0 = 5.",
  "Tiếp: 2+4, 1+3, 4+2, 3+1 — không có nhớ.", None),
 ("noi", 2, "TO3.SP.05", "58 700 − 23 400 bằng bao nhiêu?",
  {"value": "35 300"}, "Con đặt tính rồi trừ từ phải sang trái.", "Hàng đơn vị và hàng chục đều là 0 trừ 0.",
  "Hàng trăm: 7 − 4 = 3; hàng nghìn: 8 − 3 = 5.", None),
 ("noi", 1, "TO3.SP.09", "Tính nhẩm: 2 000 + 3 000 bằng bao nhiêu?",
  {"value": "5 000"}, "Con bỏ ba chữ số 0, nhẩm 2 + 3.", "2 + 3 = 5.", "Thêm ba chữ số 0 vào: 5 000.", None),
 ("noi", 1, "TO3.SP.09", "Tính nhẩm: 8 000 − 5 000 bằng bao nhiêu?",
  {"value": "3 000"}, "Con nhẩm 8 − 5 trước.", "8 − 5 = 3.", "Thêm ba chữ số 0: 3 000.", None),
 ("noi", 3, "TO3.SP.11", "Cửa hàng có 45 600 kg gạo, đã bán 18 200 kg. Còn lại bao nhiêu ki-lô-gam?",
  {"value": "27 400 kg"}, "Bài này hỏi còn lại nên mình làm phép gì?", "Lấy số có trừ số đã bán.",
  "45 600 − 18 200: đặt tính rồi trừ từ phải sang trái.", None),
 ("giai_thich", 3, "TO3.SP.05", "Con nói cách đặt tính của phép 45 230 + 8 745.",
  {"value": "viết thẳng cột theo hàng rồi cộng từ phải sang trái, nhớ khi quá 9",
   "rubric": ["Nói được 'đặt tính rồi tính' chung chung.", "Nói được phải thẳng cột và cộng từ phải sang trái.", "Nói được cả quy tắc nhớ khi tổng một hàng vượt quá 9."]},
  "Trước khi tính, con phải làm gì với hai số?", "Các chữ số cùng hàng nên viết thế nào?",
  "Viết 45 230 rồi viết 8 745 sao cho hàng đơn vị thẳng hàng đơn vị, rồi cộng từ phải sang trái.", None),
 ("noi", 3, "TO3.SP.12", "Tìm x, biết x + 2 500 = 10 000.",
  {"value": "7 500"}, "Muốn tìm số hạng chưa biết, con làm phép gì?", "Lấy tổng trừ đi số hạng đã biết.",
  "10 000 − 2 500 = 7 500.", None),
 ("chon", 2, "TO3.SP.05", "27 000 − 9 000 bằng: A. 18 000   B. 19 000   C. 17 000",
  {"value": "A"}, "Con nhẩm 27 − 9.", "27 − 9 = 18.", "Thêm ba chữ số 0: 18 000.", None),
],
"toan3-bang-nhan-chia": [
 ("noi", 1, "TO3.SP.06", "7 × 8 bằng bao nhiêu?",
  {"value": "56"}, "Con nhẩm bảng nhân 7.", "7 × 7 = 49, thêm một lần 7 nữa.", "49 + 7 = 56.", None),
 ("noi", 1, "TO3.SP.06", "63 : 9 bằng bao nhiêu?",
  {"value": "7"}, "Con nghĩ xem 9 nhân mấy bằng 63.", "9 × 6 = 54, còn thiếu 9 nữa.", "9 × 7 = 63 nên 63 : 9 = 7.", None),
 ("noi", 1, "TO3.SP.06", "6 × 7 bằng bao nhiêu?",
  {"value": "42"}, "Con nhẩm bảng nhân 6.", "6 × 6 = 36, thêm 6.", "36 + 6 = 42.", None),
 ("noi", 1, "TO3.SP.09", "Tính nhẩm: 8 × 10 bằng bao nhiêu?",
  {"value": "80"}, "Nhân với 10 thì thêm một chữ số 0 vào bên phải.", "8 thêm một chữ số 0.", "8 × 10 = 80.", None),
 ("noi", 2, "TO3.SP.09", "Tính nhẩm: 400 : 4 bằng bao nhiêu?",
  {"value": "100"}, "Con bỏ hai chữ số 0 rồi nhẩm 4 : 4.", "4 : 4 = 1.", "Thêm hai chữ số 0: 100.", None),
 ("chon", 1, "TO3.SP.06", "5 × 9 bằng: A. 40   B. 45   C. 54",
  {"value": "B"}, "Con nhẩm bảng nhân 5.", "5 × 8 = 40, thêm 5.", "40 + 5 = 45.", None),
 ("giai_thich", 3, "TO3.SP.06", "Vì sao 6 × 7 và 7 × 6 cho cùng một kết quả?",
  {"value": "vì đổi chỗ hai thừa số thì tích không đổi",
   "rubric": ["Nói được 'vì bằng nhau' mà chưa giải thích.", "Nói được 'đổi chỗ hai số nhân'.", "Nói được tính chất giao hoán và cho ví dụ."]},
  "Con thử đếm 6 hàng, mỗi hàng 7 cái, rồi đổi thành 7 hàng mỗi hàng 6 cái.", "Số cái có đổi không?",
  "Vì 6 nhóm 7 và 7 nhóm 6 đều là 42 cái — đổi chỗ hai thừa số thì tích không đổi.", None),
 ("noi", 3, "TO3.SP.11", "Một hộp có 8 bút. Chín hộp như thế có bao nhiêu bút?",
  {"value": "72 bút"}, "Bài này lặp lại 9 lần, mình làm phép gì?", "Lấy 8 nhân với 9.",
  "8 × 9 = 72.", None),
],
}


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


def main():
    out = []
    out.append("-- AUTO-GENERATED bởi scripts/gen-ekid-grade3-seed.py — đừng sửa tay.")
    out.append("-- Nguồn YCCĐ: TT 32/2018/TT-BGDĐT, môn Toán lớp 3.")
    out.append("BEGIN;")
    out.append("")
    out.append("-- Yêu cầu cần đạt")
    for oid, strand, topic, short, stmt, level, term in OBJ:
        out.append(
            "INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)\n"
            f"VALUES ({q(oid)}, 'toan', 3, {q(strand)}, {q(topic)}, {q(short)}, {q(stmt)}, {level}, {term})\n"
            "ON CONFLICT (id) DO UPDATE SET strand=EXCLUDED.strand, topic=EXCLUDED.topic, "
            "code_short=EXCLUDED.code_short, statement=EXCLUDED.statement, level=EXCLUDED.level, "
            "term=EXCLUDED.term, active=TRUE;"
        )
    out.append("")
    out.append("-- Bài học + câu hỏi")
    for L in LESSONS:
        objs = "ARRAY[" + ",".join(q(o) for o in L["objectives"]) + "]"
        out.append(
            "INSERT INTO public.ekid_lessons "
            "(slug, age_band, grade, subject, title, part, core_topic, system_prompt, objective_ids, est_minutes, script_hint, sort_order, status)\n"
            f"VALUES ({q(L['slug'])}, 'tieu-hoc', 3, 'toan', {q(L['title'])}, 'chung', {q('toan-lop-3')}, "
            f"{q('Bài học Toán lớp 3: ' + L['title'])}, {objs}, {L['est']}, {q(L['script'])}, "
            f"(SELECT COALESCE(MAX(sort_order),0)+1 FROM public.ekid_lessons), 'active')\n"
            "ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, objective_ids=EXCLUDED.objective_ids, "
            "script_hint=EXCLUDED.script_hint, est_minutes=EXCLUDED.est_minutes, status='active';"
        )
        # xoá câu cũ của bài để seed lại idempotent
        out.append(
            f"DELETE FROM public.ekid_items WHERE lesson_id = (SELECT id FROM public.ekid_lessons WHERE slug={q(L['slug'])});"
        )
        items = ITEMS[L["slug"]]
        for i, (kind, level, obj, prompt, answer, t1, t2, t3, rubric) in enumerate(items, start=1):
            hints = [
                t1 or L["t1"],
                t2 or L["t2"],
                t3 or L["t3"],
                "Đáp án: " + str(answer["value"]) + ". Giờ con nói lại cho cô: vì sao ra kết quả đó?",
            ]
            out.append(
                "INSERT INTO public.ekid_items (lesson_id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder)\n"
                f"VALUES ((SELECT id FROM public.ekid_lessons WHERE slug={q(L['slug'])}), {q(obj)}, {level}, {q(kind)}, {i}, "
                f"{q(prompt)}, {q(json.dumps(answer, ensure_ascii=False))}::jsonb, "
                f"{q(json.dumps(hints, ensure_ascii=False))}::jsonb);"
            )
        out.append("")
    out.append("COMMIT;")
    print("\n".join(out))


if __name__ == "__main__":
    main()
