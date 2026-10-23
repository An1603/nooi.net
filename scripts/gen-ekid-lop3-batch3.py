#!/usr/bin/env python3
"""Lô 3 nội dung lớp 3 — Toán (7 bài) + Tiếng Việt (4 bài), mỗi bài 8 câu.

Phủ nốt 14 yêu cầu cần đạt Toán còn trống (hình học, đo lường, thống kê)
và mở thêm 4 bài Tiếng Việt.

Chạy: python3 scripts/gen-ekid-lop3-batch3.py > supabase/seed-ekid-lop3-batch3.sql
Rồi:  python3 scripts/apply-sql-api.py supabase/seed-ekid-lop3-batch3.sql

Lưu ý thiết kế: các bài hình học ở đây CHỈ hỏi những gì trả lời được bằng lời
(số góc, tên hình, quan hệ cạnh). Bài "vẽ hình / nhận dạng hình trong ảnh" để
giai đoạn sau vì bản M1 chưa có màn hình cảm ứng cho bé vẽ.
"""
import json

LESSONS = [
    {
        "slug": "toan3-diem-giua-trung-diem",
        "subject": "toan",
        "title": "Điểm ở giữa và trung điểm của đoạn thẳng",
        "objectives": ["TO3.HH.01"],
        "est": 10,
        "script": "Trung điểm là điểm nằm chính giữa, chia đoạn thẳng thành hai phần bằng nhau. Hỏi bé bằng câu ví dụ trên thước kẻ hoặc cây bút.",
    },
    {
        "slug": "toan3-goc-vuong-hinh",
        "subject": "toan",
        "title": "Góc vuông, góc không vuông và các hình quen thuộc",
        "objectives": ["TO3.HH.02", "TO3.HH.03"],
        "est": 12,
        "script": "Góc vuông giống góc của quyển sách, viên gạch. Hình chữ nhật và hình vuông đều có 4 góc vuông; hình vuông có 4 cạnh bằng nhau.",
    },
    {
        "slug": "toan3-hinh-tron-khoi",
        "subject": "toan",
        "title": "Hình tròn, khối lập phương, khối hộp chữ nhật",
        "objectives": ["TO3.HH.04", "TO3.HH.05"],
        "est": 10,
        "script": "Bán kính bằng nửa đường kính. Khối lập phương có 6 mặt đều là hình vuông; khối hộp chữ nhật có 6 mặt là hình chữ nhật.",
    },
    {
        "slug": "toan3-don-vi-do",
        "subject": "toan",
        "title": "Đơn vị đo độ dài, khối lượng, dung tích, nhiệt độ",
        "objectives": ["TO3.DL.01", "TO3.DL.05"],
        "est": 12,
        "script": "1 cm = 10 mm; 1 kg = 1000 g; 1 lít = 1000 ml. Ước lượng bằng đồ vật thật: cái bút, chai nước, cặp sách.",
    },
    {
        "slug": "toan3-tien-va-thoi-gian",
        "subject": "toan",
        "title": "Tiền Việt Nam và xem giờ",
        "objectives": ["TO3.DL.02"],
        "est": 12,
        "script": "Tờ tiền lớn hơn có thể đổi thành nhiều tờ nhỏ. Xem giờ: kim ngắn chỉ giờ, kim dài chỉ phút; mỗi số trên đồng hồ là 5 phút.",
    },
    {
        "slug": "toan3-chu-vi-dien-tich",
        "subject": "toan",
        "title": "Chu vi và diện tích hình chữ nhật, hình vuông",
        "objectives": ["TO3.DL.03", "TO3.DL.04"],
        "est": 12,
        "script": "Chu vi là đường bao quanh (cộng các cạnh). Diện tích là phần bên trong (dài nhân rộng). Đơn vị diện tích là xăng-ti-mét vuông.",
    },
    {
        "slug": "toan3-bang-so-lieu",
        "subject": "toan",
        "title": "Đọc bảng số liệu và khả năng xảy ra của sự kiện",
        "objectives": ["TO3.TK.01", "TO3.TK.02", "TO3.TK.03", "TO3.TK.04"],
        "est": 12,
        "script": "Cô đọc bảng số liệu ngắn rồi hỏi từng ý: nhiều nhất, ít nhất, tổng. Với sự kiện, hỏi 'có thể xảy ra, chắc chắn xảy ra, không thể xảy ra'.",
    },
    {
        "slug": "tv3-doc-hieu-van-ban-thong-tin",
        "subject": "tieng-viet",
        "title": "Đọc hiểu văn bản thông tin",
        "objectives": ["TV3.DH.02"],
        "est": 12,
        "script": "Cô đọc một đoạn thông tin ngắn, sau đó hỏi: văn bản viết về cái gì, thông tin nào đáng chú ý, sắp xếp theo trình tự nào.",
    },
    {
        "slug": "tv3-dau-cau",
        "subject": "tieng-viet",
        "title": "Dấu hai chấm, dấu ngoặc kép, dấu gạch ngang",
        "objectives": ["TV3.LT.03"],
        "est": 10,
        "script": "Dấu hai chấm báo hiệu phần giải thích hoặc lời nói tiếp theo. Dấu ngoặc kép đánh dấu lời trích dẫn. Dấu gạch ngang đánh dấu lời nói trực tiếp của nhân vật.",
    },
    {
        "slug": "tv3-ke-lai-su-viec",
        "subject": "tieng-viet",
        "title": "Kể lại một sự việc đã chứng kiến",
        "objectives": ["TV3.NN.01"],
        "est": 12,
        "script": "Kể theo thứ tự: việc gì xảy ra trước, sau đó thế nào, cuối cùng ra sao. Khen khi bé nói được cảm xúc của mình.",
    },
    {
        "slug": "tv3-doc-tho-so-sanh",
        "subject": "tieng-viet",
        "title": "Đọc thơ và nhận biết vần, so sánh",
        "objectives": ["TV3.DH.03", "TV3.DH.01"],
        "est": 12,
        "script": "Vần là các tiếng có phần cuối giống nhau ở cuối dòng thơ. So sánh thường có từ 'như', 'tựa', 'là'. Cô đọc mẫu chậm, rõ.",
    },
]

ITEMS = {
"toan3-diem-giua-trung-diem": [
 ("noi", 1, "TO3.HH.01", "Trung điểm của đoạn thẳng chia đoạn đó thành mấy phần bằng nhau?", {"value": "2", "alt": ["hai", "hai phần"]},
  "Con tưởng tượng đoạn thẳng bị cắt đôi.", "Cắt đôi thì được mấy phần?", "Được 2 phần bằng nhau."),
 ("noi", 1, "TO3.HH.01", "Điểm ở giữa đoạn thẳng AB, nằm chính giữa, gọi là gì?", {"value": "trung điểm", "alt": ["trung điểm của đoạn thẳng AB"]},
  "Điểm đó nằm ở đâu trên đoạn thẳng?", "Nó chia đoạn thẳng thành hai phần thế nào?", "Gọi là trung điểm."),
 ("chon", 1, "TO3.HH.01", "Đoạn thẳng dài 10 xăng-ti-mét. Trung điểm nằm cách mỗi đầu mấy xăng-ti-mét? A. 4   B. 5   C. 10", {"value": "B"},
  "Con chia đôi 10.", "10 chia 2 bằng mấy?", "Nằm cách mỗi đầu 5 xăng-ti-mét."),
 ("noi", 2, "TO3.HH.01", "Đoạn thẳng MN dài 8 xăng-ti-mét, P là trung điểm. MP dài bao nhiêu xăng-ti-mét?", {"value": "4", "alt": ["4 cm", "bốn xăng-ti-mét"]},
  "Trung điểm chia đôi đoạn thẳng.", "8 chia 2 bằng mấy?", "MP dài 4 xăng-ti-mét."),
 ("noi", 2, "TO3.HH.01", "Đoạn thẳng dài 12 xăng-ti-mét. Nếu một điểm chỉ cách đầu A 3 xăng-ti-mét thì điểm đó có phải trung điểm không?", {"value": "không", "alt": ["không phải", "không phải trung điểm"]},
  "Trung điểm phải cách mỗi đầu bao nhiêu?", "12 chia 2 bằng 6 — vậy điểm cách 3 cm thì sao?", "Không phải, vì trung điểm phải cách mỗi đầu 6 xăng-ti-mét."),
 ("chon", 2, "TO3.HH.01", "Điểm nào là trung điểm của đoạn thẳng dài 6 xăng-ti-mét? A. điểm cách A 2 cm   B. điểm cách A 3 cm   C. điểm cách A 4 cm", {"value": "B"},
  "Con chia đôi 6 trước.", "6 chia 2 bằng mấy?", "Điểm cách A 3 xăng-ti-mét."),
 ("giai_thich", 3, "TO3.HH.01", "Vì sao trung điểm phải nằm chính giữa đoạn thẳng?", {"value": "vì trung điểm chia đoạn thẳng thành hai phần bằng nhau",
   "rubric": ["Nói được 'vì nó ở giữa'.", "Nói được 'vì chia hai phần bằng nhau'.", "Nói được: nếu lệch thì hai phần không bằng nhau nên không còn là trung điểm."]},
  "Nếu điểm lệch về một phía thì hai phần có bằng nhau không?", "Trung điểm cần hai phần thế nào?", "Vì trung điểm chia đoạn thẳng thành hai phần bằng nhau, nên phải nằm chính giữa."),
 ("noi", 3, "TO3.HH.01", "Một đoạn thẳng dài 20 xăng-ti-mét. Trung điểm cách đầu B bao nhiêu xăng-ti-mét?", {"value": "10", "alt": ["10 cm", "mười xăng-ti-mét"]},
  "Trung điểm cách hai đầu như nhau.", "20 chia 2 bằng mấy?", "Cách 10 xăng-ti-mét."),
],
"toan3-goc-vuong-hinh": [
 ("noi", 1, "TO3.HH.02", "Góc của quyển sách là góc gì?", {"value": "góc vuông", "alt": ["góc vuông ạ"]},
  "Con nhìn bốn góc của quyển sách.", "Nó giống góc của viên gạch không?", "Là góc vuông."),
 ("noi", 1, "TO3.HH.03", "Hình vuông có mấy góc vuông?", {"value": "4", "alt": ["bốn", "bốn góc"]},
  "Con đếm các góc của hình vuông.", "Mỗi góc giống góc quyển sách.", "Có 4 góc vuông."),
 ("chon", 1, "TO3.HH.03", "Hình nào có 4 cạnh bằng nhau và 4 góc vuông? A. hình chữ nhật   B. hình vuông   C. hình tam giác", {"value": "B"},
  "Hình chữ nhật có 4 góc vuông nhưng hai cạnh dài khác hai cạnh ngắn.", "Hình nào có cả 4 cạnh bằng nhau?", "Là hình vuông."),
 ("noi", 2, "TO3.HH.03", "Hình tam giác có mấy cạnh?", {"value": "3", "alt": ["ba", "ba cạnh"]},
  "Con đếm các cạnh của hình tam giác.", "'Tam' nghĩa là ba.", "Có 3 cạnh."),
 ("noi", 2, "TO3.HH.03", "Hình chữ nhật có mấy góc vuông?", {"value": "4", "alt": ["bốn"]},
  "Con đếm các góc.", "Bốn góc đều giống góc quyển sách.", "Có 4 góc vuông."),
 ("chon", 2, "TO3.HH.02", "Dụng cụ nào dùng để kiểm tra góc vuông? A. thước kẻ   B. ê-ke   C. compa", {"value": "B"},
  "Con nghĩ đến dụng cụ có một góc vuông sẵn.", "Nó thường đi kèm trong hộp bút hình học.", "Là ê-ke."),
 ("giai_thich", 3, "TO3.HH.03", "Vì sao hình vuông cũng là hình chữ nhật?", {"value": "vì hình vuông có 4 góc vuông và các cặp cạnh đối song song, chỉ khác là 4 cạnh bằng nhau",
   "rubric": ["Nói được 'vì giống nhau'.", "Nói được 'vì cũng có 4 góc vuông'.", "Nói được cả điều kiện góc vuông và cặp cạnh đối, chỉ khác độ dài cạnh."]},
  "Hình chữ nhật cần điều kiện gì về góc?", "Hình vuông có đủ điều kiện đó không?", "Vì hình vuông có đủ 4 góc vuông và các cặp cạnh đối song song, chỉ khác là 4 cạnh bằng nhau."),
 ("noi", 3, "TO3.HH.02", "Một hình tứ giác có 4 góc, trong đó 3 góc vuông. Góc còn lại có phải góc vuông không?", {"value": "không", "alt": ["không phải", "không phải góc vuông"]},
  "Con nghĩ đến hình chữ nhật — nó có mấy góc vuông?", "Nếu cả 4 góc đều vuông thì là hình gì?", "Không phải, vì hình có 3 góc vuông thì góc còn lại không vuông."),
],
"toan3-hinh-tron-khoi": [
 ("noi", 1, "TO3.HH.04", "Đường kính gấp mấy lần bán kính?", {"value": "2", "alt": ["hai", "hai lần"]},
  "Con nghĩ đến sợi dây đi qua tâm.", "Bán kính đi từ tâm ra mép, đường kính đi qua tâm tới hai mép.", "Gấp 2 lần."),
 ("noi", 1, "TO3.HH.04", "Bán kính 3 xăng-ti-mét thì đường kính dài bao nhiêu?", {"value": "6", "alt": ["6 cm", "sáu xăng-ti-mét"]},
  "Đường kính bằng hai lần bán kính.", "3 nhân 2 bằng mấy?", "Dài 6 xăng-ti-mét."),
 ("chon", 1, "TO3.HH.05", "Khối lập phương có mấy mặt? A. 4   B. 6   C. 8", {"value": "B"},
  "Con nghĩ đến viên xúc xắc.", "Đếm các mặt của viên xúc xắc.", "Có 6 mặt."),
 ("noi", 2, "TO3.HH.04", "Đường kính 10 xăng-ti-mét thì bán kính dài bao nhiêu?", {"value": "5", "alt": ["5 cm", "năm xăng-ti-mét"]},
  "Bán kính bằng một nửa đường kính.", "10 chia 2 bằng mấy?", "Dài 5 xăng-ti-mét."),
 ("noi", 2, "TO3.HH.05", "Mặt của khối lập phương là hình gì?", {"value": "hình vuông", "alt": ["hình vuông ạ"]},
  "Các cạnh của mỗi mặt dài bằng nhau.", "Hình có 4 cạnh bằng nhau và 4 góc vuông là hình gì?", "Là hình vuông."),
 ("chon", 2, "TO3.HH.04", "Dụng cụ nào dùng để vẽ đường tròn? A. ê-ke   B. compa   C. thước thẳng", {"value": "B"},
  "Con nghĩ đến dụng cụ có hai chân, một chân nhọn.", "Nó quay một vòng để tạo đường tròn.", "Là compa."),
 ("giai_thich", 3, "TO3.HH.04", "Vì sao mọi đường kính của một hình tròn đều dài bằng nhau?", {"value": "vì chúng đều đi qua tâm và nối hai điểm trên đường tròn cách tâm cùng một khoảng",
   "rubric": ["Nói được 'vì đều bằng nhau'.", "Nói được 'vì đều đi qua tâm'.", "Nói được: mọi điểm trên đường tròn cách tâm một khoảng bằng nhau nên hai lần khoảng đó luôn bằng nhau."]},
  "Đường kính gồm mấy lần bán kính?", "Mọi điểm trên đường tròn cách tâm bao xa?", "Vì mọi điểm trên đường tròn đều cách tâm một khoảng bằng nhau, nên hai lần khoảng đó luôn bằng nhau."),
 ("noi", 3, "TO3.HH.05", "Khối hộp chữ nhật có mấy đỉnh?", {"value": "8", "alt": ["tám", "tám đỉnh"]},
  "Con đếm các góc nhọn của chiếc hộp.", "Mỗi mặt có 4 đỉnh, nhưng nhiều đỉnh dùng chung.", "Có 8 đỉnh."),
],
"toan3-don-vi-do": [
 ("noi", 1, "TO3.DL.01", "Một xăng-ti-mét bằng bao nhiêu mi-li-mét?", {"value": "10", "alt": ["10 mm", "mười mi-li-mét"]},
  "Con nhìn vạch chia nhỏ trên thước.", "Giữa vạch 0 và vạch 1 có bao nhiêu vạch nhỏ?", "Bằng 10 mi-li-mét."),
 ("noi", 1, "TO3.DL.01", "Một ki-lô-gam bằng bao nhiêu gam?", {"value": "1000", "alt": ["1 000", "một nghìn gam"]},
  "Ki-lô nghĩa là một nghìn.", "1000 gam là một ki-lô-gam.", "Bằng 1000 gam."),
 ("chon", 1, "TO3.DL.01", "Đơn vị nào dùng để đo dung tích chai nước? A. mi-li-lít   B. mi-li-mét   C. gam", {"value": "A"},
  "Dung tích là lượng nước chứa được.", "Đơn vị đo chất lỏng thường có chữ 'lít'.", "Là mi-li-lít."),
 ("noi", 2, "TO3.DL.01", "Ba xăng-ti-mét bằng bao nhiêu mi-li-mét?", {"value": "30", "alt": ["30 mm", "ba mươi mi-li-mét"]},
  "Mỗi xăng-ti-mét là 10 mi-li-mét.", "3 nhân 10 bằng mấy?", "Bằng 30 mi-li-mét."),
 ("noi", 2, "TO3.DL.05", "Một chiếc bút chì dài khoảng 15 xăng-ti-mét hay 15 mét?", {"value": "15 xăng-ti-mét", "alt": ["15 cm", "xăng-ti-mét"]},
  "Con nhìn chiếc bút trong tay.", "15 mét thì dài hơn cái bàn học rất nhiều.", "Khoảng 15 xăng-ti-mét."),
 ("chon", 2, "TO3.DL.05", "Nhiệt độ nước đang sôi khoảng bao nhiêu? A. 10 độ C   B. 100 độ C   C. 1000 độ C", {"value": "B"},
  "Con nghĩ đến lúc mẹ đun nước pha trà.", "Nước sôi thì rất nóng nhưng không đến nghìn độ.", "Khoảng 100 độ C."),
 ("giai_thich", 3, "TO3.DL.01", "Vì sao 1 ki-lô-gam lại bằng 1000 gam?", {"value": "vì 'ki-lô' nghĩa là một nghìn, nên ki-lô-gam là một nghìn gam",
   "rubric": ["Nói được 'vì bằng nhau'.", "Nói được 'vì ki-lô là nghìn'.", "Nói được: tiền tố ki-lô nghĩa là 1000 nên 1 kg = 1000 g, cho ví dụ cân đường."]},
  "Chữ 'ki-lô' trong ki-lô-gam và ki-lô-mét giống nhau ở đâu?", "Ki-lô-mét bằng bao nhiêu mét?", "Vì 'ki-lô' nghĩa là một nghìn, nên ki-lô-gam là một nghìn gam."),
 ("noi", 3, "TO3.DL.05", "Một chai nước 1 lít rót đầy được mấy cốc 200 mi-li-lít?", {"value": "5", "alt": ["5 cốc", "năm cốc"]},
  "1 lít bằng 1000 mi-li-lít.", "1000 chia 200 bằng mấy?", "Được 5 cốc."),
],
"toan3-tien-va-thoi-gian": [
 ("noi", 1, "TO3.DL.02", "Một tờ 10 000 đồng đổi được mấy tờ 5 000 đồng?", {"value": "2", "alt": ["hai", "hai tờ"]},
  "Con cộng 5 000 với 5 000 xem được bao nhiêu.", "5 000 + 5 000 = 10 000.", "Đổi được 2 tờ."),
 ("noi", 1, "TO3.DL.02", "Một năm có bao nhiêu tháng?", {"value": "12", "alt": ["mười hai", "12 tháng"]},
  "Con đếm các tháng từ tháng 1 đến tháng 12.", "Tháng 12 là tháng cuối năm.", "Có 12 tháng."),
 ("chon", 1, "TO3.DL.02", "Kim dài của đồng hồ chỉ gì? A. giờ   B. phút   C. ngày", {"value": "B"},
  "Kim ngắn chỉ giờ, kim còn lại chỉ gì?", "Kim dài chạy nhanh hơn kim ngắn.", "Kim dài chỉ phút."),
 ("noi", 2, "TO3.DL.02", "Một tờ 50 000 đồng mua hết 32 000 đồng. Còn lại bao nhiêu?", {"value": "18000", "alt": ["18 000", "mười tám nghìn"]},
  "Bài cho gì, hỏi gì? Tiêu đi thì làm phép gì?", "50 000 − 32 000.", "Còn lại 18 000 đồng."),
 ("noi", 2, "TO3.DL.02", "Đồng hồ chỉ 3 giờ 15 phút. Kim dài chỉ số mấy?", {"value": "3", "alt": ["số 3", "số ba"]},
  "Mỗi số trên đồng hồ là 5 phút.", "15 phút là 5 + 5 + 5, tức qua mấy số?", "Kim dài chỉ số 3."),
 ("chon", 2, "TO3.DL.02", "7 giờ tối còn gọi là mấy giờ? A. 17 giờ   B. 19 giờ   C. 21 giờ", {"value": "B"},
  "Buổi chiều cộng thêm 12 vào giờ buổi sáng.", "7 + 12 bằng mấy?", "Là 19 giờ."),
 ("giai_thich", 3, "TO3.DL.02", "Vì sao 15 phút lại ứng với số 3 trên đồng hồ?", {"value": "vì mỗi số trên đồng hồ ứng với 5 phút, 15 phút là ba lần 5 phút",
   "rubric": ["Nói được 'vì 15 phút'.", "Nói được 'mỗi số là 5 phút'.", "Nói được: 5 + 5 + 5 = 15 nên kim dài dừng ở số thứ ba."]},
  "Từ số 12 đến số 1 là bao nhiêu phút?", "15 phút gồm mấy lần 5 phút?", "Vì mỗi số ứng với 5 phút; 15 phút là ba lần 5 phút nên dừng ở số 3."),
 ("noi", 3, "TO3.DL.02", "Mẹ có 100 000 đồng, mua 3 hộp sữa giá 25 000 đồng mỗi hộp. Mẹ còn bao nhiêu tiền?", {"value": "25000", "alt": ["25 000", "hai mươi lăm nghìn"]},
  "Bài này có hai bước: tính tiền 3 hộp trước.", "25 000 nhân 3 bằng bao nhiêu?", "75 000 đồng; 100 000 − 75 000 = 25 000 đồng."),
],
"toan3-chu-vi-dien-tich": [
 ("noi", 1, "TO3.DL.03", "Hình vuông cạnh 5 xăng-ti-mét có chu vi bao nhiêu?", {"value": "20", "alt": ["20 cm", "hai mươi xăng-ti-mét"]},
  "Chu vi là tổng bốn cạnh.", "Hình vuông có 4 cạnh bằng nhau, mỗi cạnh 5 cm.", "5 × 4 = 20 xăng-ti-mét."),
 ("noi", 1, "TO3.DL.03", "Chu vi là gì?", {"value": "tổng độ dài các cạnh bao quanh hình", "alt": ["độ dài đường bao quanh hình", "tổng các cạnh"]},
  "Con tưởng tượng đi một vòng quanh hình.", "Đi hết một vòng là đi qua các cạnh.", "Chu vi là tổng độ dài các cạnh bao quanh hình."),
 ("chon", 1, "TO3.DL.04", "Diện tích hình vuông cạnh 3 xăng-ti-mét là bao nhiêu? A. 6 xăng-ti-mét vuông   B. 9 xăng-ti-mét vuông   C. 12 xăng-ti-mét vuông", {"value": "B"},
  "Diện tích hình vuông bằng cạnh nhân cạnh.", "3 nhân 3 bằng mấy?", "Là 9 xăng-ti-mét vuông."),
 ("noi", 2, "TO3.DL.03", "Hình chữ nhật dài 6 xăng-ti-mét, rộng 4 xăng-ti-mét có chu vi bao nhiêu?", {"value": "20", "alt": ["20 cm", "hai mươi"]},
  "Chu vi hình chữ nhật bằng dài cộng rộng rồi nhân 2.", "6 + 4 = 10; 10 × 2 = ?", "Chu vi 20 xăng-ti-mét."),
 ("noi", 2, "TO3.DL.04", "Hình chữ nhật dài 6 xăng-ti-mét, rộng 4 xăng-ti-mét có diện tích bao nhiêu?", {"value": "24", "alt": ["24 cm2", "24 xăng-ti-mét vuông"]},
  "Diện tích bằng dài nhân rộng.", "6 × 4 bằng mấy?", "24 xăng-ti-mét vuông."),
 ("chon", 2, "TO3.DL.04", "Đơn vị nào dùng để đo diện tích? A. xăng-ti-mét   B. xăng-ti-mét vuông   C. xăng-ti-mét khối", {"value": "B"},
  "Đo phần mặt phẳng bên trong hình.", "Đơn vị diện tích có thêm chữ 'vuông'.", "Là xăng-ti-mét vuông."),
 ("giai_thich", 3, "TO3.DL.04", "Vì sao diện tích hình vuông bằng cạnh nhân cạnh?", {"value": "vì hình vuông được chia thành các ô vuông nhỏ, mỗi hàng có số ô bằng cạnh và có số hàng bằng cạnh",
   "rubric": ["Nói được 'vì nhân hai cạnh'.", "Nói được 'vì chia thành các ô vuông nhỏ'.", "Nói được: số ô mỗi hàng nhân số hàng, mà cả hai đều bằng số đo cạnh."]},
  "Con tưởng tượng lát gạch vuông 1 cm lên hình.", "Mỗi hàng có bao nhiêu viên? Có bao nhiêu hàng?", "Vì hình vuông chia được thành các ô vuông nhỏ: số ô mỗi hàng nhân số hàng, cả hai đều bằng số đo cạnh."),
 ("noi", 3, "TO3.DL.03", "Một sân hình chữ nhật dài 12 mét, rộng 8 mét. Cần bao nhiêu mét dây để rào quanh sân một vòng?", {"value": "40", "alt": ["40 m", "bốn mươi mét"]},
  "Rào một vòng quanh sân là tính gì?", "Chu vi bằng (dài + rộng) × 2.", "(12 + 8) × 2 = 40 mét."),
],
"toan3-bang-so-lieu": [
 ("noi", 1, "TO3.TK.02", "Cô đọc bảng: 'Tổ 1 trồng 12 cây, tổ 2 trồng 15 cây, tổ 3 trồng 9 cây.' Tổ nào trồng nhiều cây nhất?", {"value": "tổ 2", "alt": ["tổ hai"]},
  "Con so ba số: 12, 15, 9.", "Số nào lớn nhất?", "Tổ 2 trồng nhiều nhất."),
 ("noi", 1, "TO3.TK.02", "Trong bảng vừa rồi, tổ nào trồng ít cây nhất?", {"value": "tổ 3", "alt": ["tổ ba"]},
  "Con so ba số: 12, 15, 9.", "Số nào bé nhất?", "Tổ 3 trồng ít nhất."),
 ("noi", 2, "TO3.TK.03", "Ba tổ trồng được tất cả bao nhiêu cây?", {"value": "36", "alt": ["36 cây", "ba mươi sáu"]},
  "Muốn biết tất cả thì làm phép gì?", "12 + 15 = 27; 27 + 9 = ?", "Tất cả 36 cây."),
 ("noi", 2, "TO3.TK.03", "Tổ 2 trồng nhiều hơn tổ 3 bao nhiêu cây?", {"value": "6", "alt": ["6 cây", "sáu"]},
  "Nhiều hơn bao nhiêu là làm phép trừ.", "15 − 9 bằng mấy?", "Nhiều hơn 6 cây."),
 ("chon", 1, "TO3.TK.01", "Muốn biết lớp có bao nhiêu bạn thích bóng đá, con nên làm gì? A. đoán   B. hỏi và ghi lại   C. nhìn trời", {"value": "B"},
  "Muốn có số liệu đúng thì phải làm gì?", "Hỏi từng bạn rồi ghi lại gọi là thu thập số liệu.", "Hỏi và ghi lại."),
 ("chon", 2, "TO3.TK.04", "Gieo một con xúc xắc, khả năng nào sau đây KHÔNG THỂ xảy ra? A. ra mặt 3   B. ra mặt 7   C. ra mặt 6", {"value": "B"},
  "Con xúc xắc có mấy mặt, đánh số mấy?", "Các mặt đánh số từ 1 đến 6.", "Không thể ra mặt 7."),
 ("giai_thich", 3, "TO3.TK.03", "Vì sao muốn so sánh phải nhìn cả bảng số liệu, không chỉ nhìn một dòng?", {"value": "vì phải so với các số khác mới biết nhiều hay ít",
   "rubric": ["Nói được 'vì phải so sánh'.", "Nói được 'vì cần biết các số khác'.", "Nói được: nhiều/ít chỉ có nghĩa khi so với số khác trong cùng bảng."]},
  "Nếu chỉ có một số 15 thì con biết nó nhiều hay ít không?", "Muốn biết nhiều hay ít phải làm gì?", "Vì nhiều hay ít chỉ có nghĩa khi so với các số khác trong cùng bảng."),
 ("noi", 3, "TO3.TK.02", "Cô đọc bảng: 'Thứ hai 8 bạn, thứ ba 10 bạn, thứ tư 6 bạn đến thư viện.' Trung bình mỗi ngày có bao nhiêu bạn? (tính tổng rồi chia 3)", {"value": "8", "alt": ["8 bạn", "tám"]},
  "Bài này hai bước: tính tổng trước.", "8 + 10 + 6 = 24; 24 chia 3 bằng mấy?", "Trung bình 8 bạn."),
],
"tv3-doc-hieu-van-ban-thong-tin": [
 ("noi", 1, "TV3.DH.02", "Nghe đoạn: 'Cá heo là loài vật rất thông minh. Chúng sống ở biển, thích bơi theo đàn và có thể nhảy cao khỏi mặt nước.' Đoạn văn viết về con gì?", {"value": "cá heo", "alt": ["con cá heo"]},
  "Con nghe tên con vật xuất hiện đầu tiên.", "Nó sống ở biển.", "Đoạn văn viết về cá heo."),
 ("noi", 1, "TV3.DH.02", "Cá heo sống ở đâu?", {"value": "ở biển", "alt": ["biển", "dưới biển"]},
  "Con nghe lại câu thứ hai của đoạn.", "Nó bơi theo đàn ở đâu?", "Ở biển."),
 ("noi", 2, "TV3.DH.02", "Theo đoạn văn, cá heo thích làm gì?", {"value": "bơi theo đàn và nhảy cao khỏi mặt nước", "alt": ["bơi theo đàn", "nhảy cao khỏi mặt nước"]},
  "Con nghe phần cuối câu: 'thích...'.", "Có hai việc được nêu sau chữ 'thích'.", "Bơi theo đàn và nhảy cao khỏi mặt nước."),
 ("noi", 2, "TV3.DH.02", "Nghe đoạn: 'Sáng 6 giờ, cả nhà tập thể dục. 6 giờ 30, mẹ nấu ăn sáng. 7 giờ, em đi học.' Đoạn văn sắp xếp thông tin theo trình tự nào?", {"value": "theo trình tự thời gian", "alt": ["thời gian", "trình tự thời gian"]},
  "Con nhìn các mốc giờ được nêu.", "Chúng tăng dần từ sáng sớm đến 7 giờ.", "Theo trình tự thời gian."),
 ("noi", 2, "TV3.DH.02", "Trong đoạn vừa rồi, lúc 6 giờ 30 cả nhà làm gì?", {"value": "mẹ nấu ăn sáng", "alt": ["nấu ăn sáng", "mẹ nấu ăn"]},
  "Con tìm mốc 6 giờ 30 trong đoạn.", "Sau mốc đó là việc của ai?", "Mẹ nấu ăn sáng."),
 ("chon", 2, "TV3.DH.02", "Đoạn văn về cá heo cho ta thông tin gì? A. cách nuôi cá cảnh   B. đặc điểm của cá heo   C. giá bán cá heo", {"value": "B"},
  "Đoạn văn nói về nơi sống và việc nó thích làm.", "Đó là thông tin về điều gì của con vật?", "Là đặc điểm của cá heo."),
 ("giai_thich", 3, "TV3.DH.02", "Vì sao văn bản thông tin thường nêu mốc thời gian rõ ràng?", {"value": "để người đọc biết việc gì xảy ra trước, việc gì xảy ra sau",
   "rubric": ["Nói được 'để dễ hiểu'.", "Nói được 'để biết việc nào trước, việc nào sau'.", "Nói được: mốc thời gian giúp sắp xếp sự việc theo trình tự nên người đọc theo dõi được."]},
  "Nếu không có giờ, con có biết việc nào xảy ra trước không?", "Trình tự giúp người đọc hiểu điều gì?", "Để người đọc biết việc gì xảy ra trước, việc gì sau."),
 ("noi", 3, "TV3.NN.01", "Con kể lại cho cô một thông tin con vừa học được về cá heo.", {"value": "kể lại được một thông tin đúng từ đoạn văn",
   "rubric": ["Nói được một thông tin nhưng chưa rõ.", "Nói được một thông tin đúng, rõ ràng.", "Nói được thông tin đúng và thêm ý mình thấy thú vị."]},
  "Đoạn văn có mấy thông tin về cá heo?", "Con thấy thông tin nào thú vị nhất?", "Con kể lại thông tin đó bằng lời của mình."),
],
"tv3-dau-cau": [
 ("chon", 1, "TV3.LT.03", "Dấu nào báo hiệu phần giải thích hoặc lời nói tiếp theo? A. dấu chấm   B. dấu hai chấm   C. dấu phẩy", {"value": "B"},
  "Con nhìn dấu đứng trước phần được nói ra.", "Dấu này gồm hai chấm xếp dọc.", "Là dấu hai chấm."),
 ("chon", 1, "TV3.LT.03", "Dấu nào đánh dấu lời nói trực tiếp của nhân vật? A. dấu gạch ngang   B. dấu chấm hỏi   C. dấu ngoặc đơn", {"value": "A"},
  "Trong truyện, lời nói của nhân vật thường đứng sau dấu gì?", "Dấu đó là một nét ngang ở đầu dòng.", "Là dấu gạch ngang."),
 ("noi", 1, "TV3.LT.03", "Dấu ngoặc kép dùng để làm gì?", {"value": "đánh dấu phần trích dẫn trực tiếp hoặc lời đối thoại", "alt": ["đánh dấu lời trích dẫn", "đánh dấu lời nói trực tiếp"]},
  "Con thấy dấu này trong câu trích lời ai đó.", "Nó gồm hai dấu giống nhau ở hai đầu.", "Đánh dấu phần trích dẫn trực tiếp."),
 ("noi", 2, "TV3.LT.03", "Trong câu 'Lan nói: \"Mai mình đi học nhóm nhé!\"', dấu hai chấm báo hiệu điều gì?", {"value": "báo hiệu lời nói trực tiếp của Lan", "alt": ["lời nói trực tiếp", "báo hiệu lời nói"]},
  "Sau dấu hai chấm là lời của ai?", "Đó là lời nói trực tiếp hay lời kể lại?", "Báo hiệu lời nói trực tiếp của Lan."),
 ("noi", 2, "TV3.LT.03", "Trong câu 'Mẹ mua ba thứ: gạo, dầu, muối', dấu hai chấm dùng để làm gì?", {"value": "báo hiệu phần liệt kê", "alt": ["liệt kê", "báo hiệu liệt kê"]},
  "Sau dấu hai chấm là mấy thứ được kể ra?", "Kể ra lần lượt như vậy gọi là gì?", "Báo hiệu phần liệt kê."),
 ("chon", 2, "TV3.LT.03", "Câu nào dùng dấu ngoặc kép ĐÚNG? A. Bạn ấy được gọi là \"cây toán\" của lớp.   B. Bạn ấy được gọi là \"cây toán của lớp.   C. Bạn ấy được gọi là cây toán\" của lớp.", {"value": "A"},
  "Dấu ngoặc kép phải có đủ hai dấu, đặt hai đầu cụm từ.", "Cụm được đánh dấu là 'cây toán'.", "Câu A đúng."),
 ("giai_thich", 3, "TV3.LT.03", "Vì sao lời nói trực tiếp của nhân vật cần dấu gạch ngang hoặc ngoặc kép?", {"value": "để người đọc phân biệt lời nhân vật nói với lời người kể",
   "rubric": ["Nói được 'để dễ đọc'.", "Nói được 'để phân biệt lời nói với lời kể'.", "Nói được: dấu giúp tách lời nhân vật khỏi lời người kể nên hiểu đúng ai đang nói."]},
  "Nếu không có dấu, con có biết ai đang nói không?", "Dấu giúp tách hai loại lời nào?", "Để người đọc phân biệt lời nhân vật nói với lời người kể."),
 ("noi", 3, "TV3.LT.03", "Đặt một câu có lời nói trực tiếp của em với mẹ, dùng dấu gạch ngang.", {"value": "câu có dấu gạch ngang đánh dấu lời nói trực tiếp",
   "rubric": ["Nói được câu có lời nói nhưng thiếu dấu.", "Nói được câu có dấu gạch ngang đúng chỗ.", "Nói được câu tự nhiên, dấu đặt đúng và đọc rõ ai nói."]},
  "Lời em nói sẽ đứng sau dấu gì?", "Con thử: 'Mẹ ơi, con học xong rồi ạ!'", "Ví dụ: – Mẹ ơi, con học xong rồi ạ!"),
],
"tv3-ke-lai-su-viec": [
 ("noi", 1, "TV3.NN.01", "Khi kể lại một việc, con nên kể theo thứ tự nào?", {"value": "theo thứ tự việc xảy ra trước rồi đến việc xảy ra sau", "alt": ["thứ tự thời gian", "việc trước đến việc sau"]},
  "Con nhớ lại lúc việc đó bắt đầu.", "Sau đó chuyện gì xảy ra?", "Theo thứ tự việc trước rồi việc sau."),
 ("noi", 1, "TV3.NN.01", "Muốn kể rõ, câu của con cần có gì?", {"value": "nói rõ ai, làm gì, khi nào", "alt": ["ai làm gì", "rõ người và việc"]},
  "Con thử kể một câu thiếu tên người xem có hiểu không.", "Cần biết ai làm và làm gì.", "Cần nói rõ ai, làm gì, khi nào."),
 ("noi", 2, "TV3.NN.01", "Con kể lại: hôm qua con đã làm gì sau khi đi học về?", {"value": "kể được một việc có thật, theo thứ tự",
   "rubric": ["Kể được một việc nhưng lộn xộn.", "Kể được việc theo thứ tự, rõ ràng.", "Kể rõ thứ tự, có chi tiết và cảm xúc của mình."]},
  "Con nhớ lại lúc vừa về đến nhà.", "Việc đầu tiên là gì? Sau đó?", "Kể: về nhà → làm gì → kết quả thế nào."),
 ("chon", 2, "TV3.NN.01", "Câu nào kể lại sự việc RÕ NHẤT? A. Hôm qua có chuyện vui.   B. Hôm qua, em giúp mẹ tưới cây trong vườn.   C. Hôm qua em thích lắm.", {"value": "B"},
  "Câu nào nói rõ ai, làm gì?", "Câu A và C chỉ nói cảm xúc chung chung.", "Câu B rõ nhất."),
 ("noi", 2, "TV3.NN.01", "Khi bạn đang kể, con muốn góp ý thì nên làm gì?", {"value": "chờ bạn nói xong rồi mới nói", "alt": ["chờ bạn nói hết", "nghe hết rồi mới nói"]},
  "Nếu hai bạn cùng nói thì sao?", "Trao đổi ý kiến cần tôn trọng lượt lời.", "Chờ bạn nói xong rồi mới nói."),
 ("noi", 3, "TV3.NN.01", "Con kể lại một lần con giúp một bạn ở lớp, theo ba bước: trước – trong – sau.", {"value": "kể đủ ba bước, rõ việc và cảm xúc",
   "rubric": ["Kể được việc nhưng thiếu bước.", "Kể đủ ba bước, rõ ràng.", "Kể đủ ba bước, có chi tiết và nói được mình cảm thấy thế nào."]},
  "Bước 1: lúc đó con đang làm gì?", "Bước 2: con đã làm gì để giúp bạn?", "Bước 3: sau đó bạn và con thế nào?"),
 ("giai_thich", 3, "TV3.NN.01", "Vì sao khi kể cần nói rõ thời gian và địa điểm?", {"value": "để người nghe hiểu chuyện xảy ra khi nào, ở đâu",
   "rubric": ["Nói được 'để dễ hiểu'.", "Nói được 'để biết khi nào, ở đâu'.", "Nói được: thiếu thời gian và địa điểm thì người nghe khó hình dung và dễ hiểu sai."]},
  "Nếu con kể mà không nói khi nào, người nghe có hiểu không?", "Thời gian và địa điểm giúp gì?", "Để người nghe hiểu chuyện xảy ra khi nào, ở đâu."),
 ("noi", 3, "TV3.NN.01", "Con kể lại cho cô nghe một việc con đã chứng kiến mà con thấy thú vị.", {"value": "kể được sự việc có thật theo trình tự",
   "rubric": ["Kể được sự việc nhưng chưa rõ trình tự.", "Kể rõ sự việc theo trình tự.", "Kể rõ trình tự, có chi tiết đáng nhớ và lý do con thấy thú vị."]},
  "Việc đó xảy ra khi nào, ở đâu?", "Chuyện gì xảy ra đầu tiên?", "Kể tiếp: sau đó thế nào, cuối cùng ra sao."),
],
"tv3-doc-tho-so-sanh": [
 ("noi", 1, "TV3.DH.03", "Nghe hai câu thơ: 'Trăng tròn như cái đĩa. Trăng sáng như ngọn đèn.' Trăng được so sánh với gì?", {"value": "cái đĩa và ngọn đèn", "alt": ["cái đĩa", "ngọn đèn", "đĩa và đèn"]},
  "Con tìm từ 'như' trong hai câu.", "Sau chữ 'như' là hai vật gì?", "Cái đĩa và ngọn đèn."),
 ("noi", 1, "TV3.DH.03", "Vần là gì?", {"value": "các tiếng có phần cuối giống nhau ở cuối dòng thơ", "alt": ["tiếng có phần cuối giống nhau", "phần cuối của tiếng giống nhau"]},
  "Con đọc to hai dòng thơ và nghe âm cuối.", "Hai tiếng cuối dòng nghe na ná nhau.", "Là các tiếng có phần cuối giống nhau ở cuối dòng thơ."),
 ("noi", 1, "TV3.DH.03", "Nghe: 'Em yêu nhà em. Hàng xoan trước ngõ.' Hai tiếng 'em' và 'em' tạo ra điều gì?", {"value": "vần", "alt": ["vần thơ", "hiệp vần"]},
  "Con đọc và nghe âm cuối hai dòng.", "Chúng giống nhau hoàn toàn.", "Tạo ra vần."),
 ("chon", 2, "TV3.DH.03", "Câu nào có dùng biện pháp so sánh? A. Mặt trời mọc ở đằng đông.   B. Mặt trời đỏ như quả cầu lửa.   C. Mặt trời chiếu sáng.", {"value": "B"},
  "Câu nào có từ dùng để ví von?", "Từ 'như' là dấu hiệu của biện pháp nào?", "Câu B dùng so sánh."),
 ("noi", 2, "TV3.DH.03", "Nghe: 'Cánh diều như dấu á. Ai vẽ thế trên trời.' Cánh diều được so sánh với gì?", {"value": "dấu á", "alt": ["dấu á ạ"]},
  "Con tìm chữ 'như'.", "Sau chữ 'như' là hình gì?", "Là dấu á."),
 ("noi", 2, "TV3.DH.01", "Đọc to câu thơ sau, nghỉ hơi sau dấu phẩy: 'Trăng tròn như cái đĩa, sáng như ngọn đèn.'", {"value": "đọc đúng, nghỉ sau dấu phẩy",
   "rubric": ["Đọc được nhưng ngắt sai chỗ.", "Đọc đúng, nghỉ sau dấu phẩy.", "Đọc đúng, nghỉ đúng và có giọng nhẹ nhàng."]},
  "Con thấy dấu phẩy ở đâu?", "Nghỉ một chút rồi đọc tiếp.", "Trăng tròn như cái đĩa / sáng như ngọn đèn."),
 ("giai_thich", 3, "TV3.DH.03", "Vì sao tác giả lại so sánh trăng với cái đĩa?", {"value": "vì trăng tròn và sáng giống cái đĩa",
   "rubric": ["Nói được 'vì tròn'.", "Nói được 'vì tròn và sáng'.", "Nói được cả hình dáng tròn và vẻ sáng nên câu thơ gợi hình hơn."]},
  "Trăng có hình gì?", "Cái đĩa có hình gì?", "Vì trăng tròn và sáng giống cái đĩa."),
 ("noi", 3, "TV3.DH.03", "Con đặt một câu so sánh về một đồ vật trong nhà.", {"value": "câu có từ so sánh và hai sự vật",
   "rubric": ["Nói được câu có hai vật nhưng thiếu từ so sánh.", "Nói được câu có từ 'như' đúng.", "Nói được câu tự nhiên, so sánh hợp lý và gợi hình."]},
  "Con chọn một đồ vật: cái quạt, cái bàn, cái đèn.", "Nó giống cái gì?", "Ví dụ: Cái quạt trần như cánh diều xoay."),
],
}


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


def main():
    out = []
    out.append("-- AUTO-GENERATED bởi scripts/gen-ekid-lop3-batch3.py — đừng sửa tay.")
    out.append("BEGIN;")
    out.append("")
    for L in LESSONS:
        objs = "ARRAY[" + ",".join(q(o) for o in L["objectives"]) + "]"
        out.append(
            "INSERT INTO public.ekid_lessons "
            "(slug, age_band, grade, subject, title, part, core_topic, system_prompt, objective_ids, est_minutes, script_hint, sort_order, status)\n"
            f"VALUES ({q(L['slug'])}, 'tieu-hoc', 3, {q(L['subject'])}, {q(L['title'])}, 'chung', "
            f"{q('toan-lop-3' if L['subject'] == 'toan' else 'tieng-viet-lop-3')}, "
            f"{q('Bài học lớp 3: ' + L['title'])}, {objs}, {L['est']}, {q(L['script'])}, "
            f"(SELECT COALESCE(MAX(sort_order),0)+1 FROM public.ekid_lessons), 'active')\n"
            "ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, subject=EXCLUDED.subject, "
            "objective_ids=EXCLUDED.objective_ids, script_hint=EXCLUDED.script_hint, "
            "est_minutes=EXCLUDED.est_minutes, status='active';"
        )
        out.append(
            f"DELETE FROM public.ekid_items WHERE lesson_id = (SELECT id FROM public.ekid_lessons WHERE slug={q(L['slug'])});"
        )
        for i, (kind, level, obj, prompt, answer, t1, t2, t3) in enumerate(ITEMS[L["slug"]], start=1):
            hints = [
                t1,
                t2,
                t3,
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
