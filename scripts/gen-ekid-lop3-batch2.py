#!/usr/bin/env python3
"""Lô 2 nội dung lớp 3 — Toán (4 bài) + Tiếng Việt (4 bài), mỗi bài 8 câu.

Chạy: python3 scripts/gen-ekid-lop3-batch2.py > supabase/seed-ekid-lop3-batch2.sql
Rồi:  python3 scripts/apply-sql-api.py supabase/seed-ekid-lop3-batch2.sql

Nguyên tắc biên soạn (xem kế hoạch nội dung):
  - mỗi câu một YCCĐ; lời hỏi ≤ 20 từ; đáp án nói ra ≤ 5 từ (trừ câu giải thích)
  - đáp án số có `alt` là chữ đọc; đáp án chọn A/B/C/D giữ nguyên chữ cái
  - 4 bậc gợi ý KHÁC LOẠI: hướng nhìn → gợi mở kiến thức → làm mẫu một phần → đáp án
  - mỗi bài có ≥ 2 câu mức 3
  - Tiếng Việt: chỉ đưa vào voice phần chấm được bằng lời (đọc hiểu, từ ngữ, kiểu câu,
    đọc đúng từ khó). Viết đoạn tay KHÔNG đưa vào lô này.
"""
import json

# ── YCCĐ Tiếng Việt lớp 3 (TT 32/2018, phần lớp 3) ──────────────────────────
# id, strand, topic, code_short, statement, level, term
TV_OBJ = [
    ("TV3.DH.01", "Đọc", "Kĩ thuật đọc", "Đọc đúng, đọc diễn cảm",
     "Đọc đúng và bước đầu biết đọc diễn cảm các đoạn văn miêu tả, câu chuyện, bài thơ; tốc độ đọc khoảng 70 – 80 tiếng trong 1 phút; biết nghỉ hơi ở chỗ có dấu câu hay chỗ ngắt nhịp thơ.", 1, 1),
    ("TV3.DH.02", "Đọc", "Đọc hiểu nội dung", "Chi tiết và nội dung chính",
     "Nhận biết được chi tiết và nội dung chính; tìm được ý chính của từng đoạn văn dựa trên các câu hỏi gợi ý; hiểu được điều tác giả muốn nói qua văn bản dựa vào gợi ý.", 2, 1),
    ("TV3.DH.03", "Đọc", "Đọc hiểu hình thức", "Vần và biện pháp so sánh",
     "Nhận biết được vần và biện pháp tu từ so sánh trong thơ.", 2, 1),
    ("TV3.LT.01", "Kiến thức tiếng Việt", "Vốn từ", "Từ cùng nghĩa, từ trái nghĩa",
     "Nhận biết được từ có nghĩa giống nhau và từ có nghĩa trái ngược nhau.", 1, 1),
    ("TV3.LT.02", "Kiến thức tiếng Việt", "Ngữ pháp", "Câu kể, câu hỏi, câu khiến, câu cảm",
     "Nhận biết được câu kể, câu hỏi, câu khiến, câu cảm: đặc điểm thể hiện qua dấu câu, qua từ đánh dấu kiểu câu và công dụng của từng kiểu câu.", 2, 2),
    ("TV3.LT.03", "Kiến thức tiếng Việt", "Ngữ pháp", "Dấu gạch ngang, ngoặc kép, hai chấm",
     "Nhận biết được công dụng của dấu gạch ngang (đánh dấu lời nói trực tiếp của nhân vật); dấu ngoặc kép (đánh dấu phần trích dẫn trực tiếp hoặc lời đối thoại); dấu hai chấm (báo hiệu phần giải thích, liệt kê).", 2, 2),
    ("TV3.CT.01", "Viết", "Chính tả", "Phát âm và viết đúng từ dễ lẫn",
     "Viết đúng chính tả các từ dễ lẫn (s/x, tr/ch, d/gi, dấu hỏi/dấu ngã) trong phạm vi đã học; phát âm rõ ràng để người nghe hiểu đúng.", 1, 1),
    ("TV3.NN.01", "Nói và nghe", "Nói", "Kể lại sự việc, trao đổi ý kiến",
     "Nói rõ ràng; kể lại được một sự việc đã chứng kiến hoặc tham gia; biết trao đổi ý kiến trong nhóm.", 2, 1),
]

# ── Bài học ─────────────────────────────────────────────────────────────────
# slug, subject, title, objectives, est, core_topic, script
LESSONS = [
    {
        "slug": "toan3-nhan-1-chu-so",
        "subject": "toan",
        "title": "Nhân số có nhiều chữ số với số có một chữ số",
        "objectives": ["TO3.SP.07", "TO3.SP.11"],
        "est": 12,
        "core_topic": "toan-lop-3",
        "script": "Nhân lần lượt từ phải sang trái, nhớ sang hàng bên trái. Với bài có lời văn, hỏi bé 'bài cho gì, hỏi gì' trước khi tính.",
    },
    {
        "slug": "toan3-chia-1-chu-so",
        "subject": "toan",
        "title": "Chia số có nhiều chữ số cho số có một chữ số",
        "objectives": ["TO3.SP.08", "TO3.SP.11"],
        "est": 12,
        "core_topic": "toan-lop-3",
        "script": "Chia từ trái sang phải. Phân biệt chia hết và chia có dư: số dư luôn bé hơn số chia. Hỏi bé kiểm lại bằng phép nhân.",
    },
    {
        "slug": "toan3-bieu-thuc-so",
        "subject": "toan",
        "title": "Tính giá trị biểu thức số",
        "objectives": ["TO3.SP.10"],
        "est": 12,
        "core_topic": "toan-lop-3",
        "script": "Có ngoặc thì làm trong ngoặc trước; không ngoặc thì nhân chia trước, cộng trừ sau. Luôn hỏi bé 'con làm phép nào trước'.",
    },
    {
        "slug": "toan3-phan-so-don-vi",
        "subject": "toan",
        "title": "Phân số đơn vị và một phần mấy của một nhóm",
        "objectives": ["TO3.PS.01", "TO3.PS.02"],
        "est": 12,
        "core_topic": "toan-lop-3",
        "script": "Một phần mấy = chia đều thành bấy nhiêu phần rồi lấy một phần. Dùng ví dụ đồ vật thật (cái bánh, viên bi) để bé thấy được.",
    },
    {
        "slug": "tv3-doc-hieu-doan-van",
        "subject": "tieng-viet",
        "title": "Đọc hiểu đoạn văn: chi tiết và ý chính",
        "objectives": ["TV3.DH.02", "TV3.NN.01"],
        "est": 12,
        "core_topic": "tieng-viet-lop-3",
        "script": "Cô đọc đoạn văn một lần, chậm rãi. Sau đó hỏi từng câu, bé trả lời bằng lời. Không đọc lại cả đoạn trừ khi bé xin.",
    },
    {
        "slug": "tv3-tu-cung-nghia-trai-nghia",
        "subject": "tieng-viet",
        "title": "Từ cùng nghĩa và từ trái nghĩa",
        "objectives": ["TV3.LT.01"],
        "est": 10,
        "core_topic": "tieng-viet-lop-3",
        "script": "Cùng nghĩa là nói giống nhau; trái nghĩa là ngược nhau. Cho ví dụ bằng chính đồ vật trong nhà bé.",
    },
    {
        "slug": "tv3-kieu-cau",
        "subject": "tieng-viet",
        "title": "Câu kể, câu hỏi, câu khiến, câu cảm",
        "objectives": ["TV3.LT.02", "TV3.LT.03"],
        "est": 12,
        "core_topic": "tieng-viet-lop-3",
        "script": "Câu hỏi để hỏi, cuối câu có dấu chấm hỏi. Câu khiến để nhờ, yêu cầu. Câu cảm bộc lộ cảm xúc, cuối câu có dấu chấm than. Câu kể để kể, tả.",
    },
    {
        "slug": "tv3-doc-dung-tu-kho",
        "subject": "tieng-viet",
        "title": "Đọc đúng từ dễ lẫn (s/x, tr/ch, hỏi/ngã)",
        "objectives": ["TV3.CT.01", "TV3.DH.01"],
        "est": 10,
        "core_topic": "tieng-viet-lop-3",
        "script": "Cô đọc mẫu một lần rồi mời bé đọc lại. Nghe kỹ âm đầu và dấu thanh; khen khi bé sửa được, không nhại lại lỗi của bé.",
    },
]

# ── Câu hỏi: kind, level, objective, prompt, answer, gợi ý 1..3 ─────────────
# Bậc 4 luôn là đáp án (script tự sinh).
ITEMS = {
"toan3-nhan-1-chu-so": [
 ("noi", 1, "TO3.SP.07", "12 nhân 3 bằng bao nhiêu?", {"value": "36", "alt": ["ba mươi sáu"]},
  "Con nhân hàng đơn vị trước: 2 nhân 3.", "2 × 3 = 6, viết 6 nhớ 0.", "1 × 3 = 3. Ghép lại được 36."),
 ("noi", 1, "TO3.SP.07", "24 nhân 2 bằng bao nhiêu?", {"value": "48", "alt": ["bốn mươi tám"]},
  "Con tách 24 thành 20 và 4.", "20 × 2 = 40.", "4 × 2 = 8, cộng với 40."),
 ("noi", 2, "TO3.SP.07", "123 nhân 3 bằng bao nhiêu?", {"value": "369", "alt": ["ba trăm sáu mươi chín"]},
  "Nhân từ phải sang trái, bắt đầu từ 3 nhân 3.", "3 × 3 = 9; 2 × 3 = 6.", "1 × 3 = 3. Kết quả là 369."),
 ("noi", 2, "TO3.SP.07", "126 nhân 4 bằng bao nhiêu?", {"value": "504", "alt": ["năm trăm linh bốn"]},
  "Con nhân 6 với 4 trước, xem có nhớ không.", "6 × 4 = 24, viết 4 nhớ 2.", "2 × 4 = 8, thêm 2 nhớ là 10, viết 0 nhớ 1; 1 × 4 = 4 thêm 1 = 5."),
 ("chon", 1, "TO3.SP.07", "Phép nhân nào đúng? A. 34 × 2 = 58   B. 34 × 2 = 68   C. 34 × 2 = 78", {"value": "B"},
  "Con tính 4 × 2 trước.", "4 × 2 = 8, nên kết quả phải có tận cùng là 8.", "3 × 2 = 6, vậy 68."),
 ("giai_thich", 3, "TO3.SP.07", "Vì sao khi nhân ta phải nhân từ phải sang trái?", {"value": "vì phải xử lý số nhớ sang hàng bên trái",
   "rubric": ["Nói được 'vì có nhớ'.", "Nói được 'nhớ sang hàng bên trái'.", "Nói được thứ tự và lý do: nhớ phải cộng vào hàng lớn hơn."]},
  "Nếu con nhân từ trái sang phải thì số nhớ sẽ đi đâu?", "Số nhớ thuộc hàng nào?", "Vì nhớ phải cộng vào hàng bên trái, nên phải làm từ phải sang trái."),
 ("noi", 3, "TO3.SP.11", "Mỗi hộp có 115 viên phấn. Ba hộp như thế có bao nhiêu viên?", {"value": "345", "alt": ["345 viên", "ba trăm bốn mươi lăm viên"]},
  "Bài cho gì, hỏi gì? Mỗi hộp 115 viên, ba hộp.", "Lặp lại 3 lần thì làm phép gì?", "115 × 3 = 345 viên."),
 ("noi", 3, "TO3.SP.11", "Một cuộn dây dài 208 mét. Bốn cuộn như thế dài bao nhiêu mét?", {"value": "832", "alt": ["832 mét"]},
  "Bốn cuộn, mỗi cuộn 208 mét.", "208 × 4, nhân từ phải sang trái.", "8 × 4 = 32 viết 2 nhớ 3; 0 × 4 = 0 thêm 3 = 3; 2 × 4 = 8 → 832 mét."),
],
"toan3-chia-1-chu-so": [
 ("noi", 1, "TO3.SP.08", "48 chia 4 bằng bao nhiêu?", {"value": "12", "alt": ["mười hai"]},
  "Con chia 4 chục cho 4 trước.", "4 : 4 = 1, tức là 1 chục.", "8 : 4 = 2. Ghép lại được 12."),
 ("noi", 1, "TO3.SP.08", "96 chia 3 bằng bao nhiêu?", {"value": "32", "alt": ["ba mươi hai"]},
  "Chia từ trái sang phải: 9 chia 3.", "9 : 3 = 3.", "6 : 3 = 2, nên kết quả là 32."),
 ("noi", 2, "TO3.SP.08", "85 chia 5 bằng bao nhiêu?", {"value": "17", "alt": ["mười bảy"]},
  "8 chia 5 được mấy, dư mấy?", "8 : 5 = 1 dư 3; hạ 5 thành 35.", "35 : 5 = 7, nên kết quả là 17."),
 ("noi", 2, "TO3.SP.08", "47 chia 4 bằng bao nhiêu và dư mấy?", {"value": "11 dư 3", "alt": ["11 du 3", "mười một dư ba"]},
  "4 chia 4 trước.", "4 : 4 = 1; hạ 7 được 7.", "7 : 4 = 1 dư 3. Vậy 11 dư 3."),
 ("chon", 1, "TO3.SP.08", "Phép chia nào CÓ DƯ? A. 36 : 3   B. 45 : 5   C. 47 : 5", {"value": "C"},
  "Con thử nhân ngược lại từng đáp án.", "36 = 3 × 12, 45 = 5 × 9 — chia hết.", "47 không chia hết cho 5 vì 45 : 5 = 9 dư 2."),
 ("giai_thich", 3, "TO3.SP.08", "Vì sao số dư luôn bé hơn số chia?", {"value": "vì nếu bằng hoặc lớn hơn thì chia được thêm một lần nữa",
   "rubric": ["Nói được 'vì chia tiếp được'.", "Nói được 'nếu bằng số chia thì thêm 1'.", "Nói được: dư ≥ số chia nghĩa là còn chia được nữa, nên thương phải tăng."]},
  "Nếu số dư bằng số chia thì chuyện gì xảy ra?", "Con thử với 9 chia 3 xem.", "Vì nếu dư bằng hoặc hơn số chia thì vẫn chia tiếp được, nên số dư phải bé hơn."),
 ("noi", 3, "TO3.SP.11", "Có 96 quyển vở chia đều cho 4 tổ. Mỗi tổ được mấy quyển?", {"value": "24", "alt": ["24 quyển"]},
  "Chia đều nghĩa là làm phép gì?", "96 : 4, chia từ trái sang phải.", "9 : 4 = 2 dư 1; hạ 6 thành 16; 16 : 4 = 4 → 24 quyển."),
 ("noi", 3, "TO3.SP.11", "Một sợi dây 75 xăng-ti-mét cắt thành các đoạn 5 xăng-ti-mét. Cắt được mấy đoạn?", {"value": "15", "alt": ["15 đoạn"]},
  "Mỗi đoạn 5 cm, có 75 cm.", "75 : 5, chia từ trái sang phải.", "7 : 5 = 1 dư 2; hạ 5 thành 25; 25 : 5 = 5 → 15 đoạn."),
],
"toan3-bieu-thuc-so": [
 ("noi", 1, "TO3.SP.10", "Tính: 5 + 3 × 2", {"value": "11", "alt": ["mười một"]},
  "Trong biểu thức không có ngoặc, con làm phép nào trước?", "Nhân trước: 3 × 2 = 6.", "5 + 6 = 11."),
 ("noi", 1, "TO3.SP.10", "Tính: (5 + 3) × 2", {"value": "16", "alt": ["mười sáu"]},
  "Có ngoặc thì làm gì trước?", "Trong ngoặc: 5 + 3 = 8.", "8 × 2 = 16."),
 ("noi", 2, "TO3.SP.10", "Tính: 24 : 4 + 7", {"value": "13", "alt": ["mười ba"]},
  "Chia trước hay cộng trước?", "24 : 4 = 6.", "6 + 7 = 13."),
 ("noi", 2, "TO3.SP.10", "Tính: 40 - 6 × 5", {"value": "10", "alt": ["mười"]},
  "Nhân trước hay trừ trước?", "6 × 5 = 30.", "40 - 30 = 10."),
 ("chon", 2, "TO3.SP.10", "Biểu thức nào có giá trị bằng 18? A. 3 + 5 × 3   B. (3 + 5) × 3   C. 3 × 5 + 3", {"value": "A"},
  "Con tính từng biểu thức, nhớ thứ tự.", "A: 5 × 3 = 15, 3 + 15 = 18.", "B: 8 × 3 = 24; C: 15 + 3 = 18? — kiểm lại C là 18, nhưng A đúng trước. Xem lại: A = 18."),
 ("giai_thich", 3, "TO3.SP.10", "Vì sao phải làm trong ngoặc trước?", {"value": "vì ngoặc yêu cầu tính phần đó thành một số trước",
   "rubric": ["Nói được 'vì có ngoặc'.", "Nói được 'tính phần trong ngoặc thành một số'.", "Nói được nếu không làm vậy kết quả sẽ khác, cho ví dụ."]},
  "Nếu bỏ ngoặc ở (5 + 3) × 2 thì kết quả là bao nhiêu?", "16 và 11 khác nhau, vì sao?", "Vì ngoặc yêu cầu tính phần trong ngoặc trước, thành một số rồi mới làm tiếp."),
 ("noi", 3, "TO3.SP.10", "Tính: 100 - (20 + 30)", {"value": "50", "alt": ["năm mươi"]},
  "Trong ngoặc bằng bao nhiêu?", "20 + 30 = 50.", "100 - 50 = 50."),
 ("noi", 3, "TO3.SP.10", "Tính: 6 × (9 - 4)", {"value": "30", "alt": ["ba mươi"]},
  "Trong ngoặc trước.", "9 - 4 = 5.", "6 × 5 = 30."),
],
"toan3-phan-so-don-vi": [
 ("noi", 1, "TO3.PS.01", "Một phần hai viết thế nào?", {"value": "1/2", "alt": ["một phần hai", "1 phần 2"]},
  "Chia đều thành 2 phần, lấy 1 phần.", "Viết số 1 ở trên, số 2 ở dưới.", "Đọc là một phần hai, viết 1/2."),
 ("noi", 1, "TO3.PS.01", "Một phần tư viết thế nào?", {"value": "1/4", "alt": ["một phần tư", "một phần bốn", "1 phần 4"]},
  "Chia thành mấy phần thì mẫu số là số đó.", "Chia thành 4 phần, lấy 1 phần.", "Viết 1/4, đọc là một phần tư."),
 ("chon", 1, "TO3.PS.01", "Phân số nào đọc là 'một phần năm'? A. 1/4   B. 1/5   C. 5/1", {"value": "B"},
  "Mẫu số cho biết chia thành mấy phần.", "'Phần năm' nghĩa là chia thành 5 phần.", "Vậy là 1/5."),
 ("noi", 2, "TO3.PS.02", "Có 8 viên bi, lấy một phần hai số bi. Lấy mấy viên?", {"value": "4", "alt": ["4 viên"]},
  "Một phần hai là chia đôi.", "8 chia 2 bằng mấy?", "8 : 2 = 4 viên."),
 ("noi", 2, "TO3.PS.02", "Có 12 cái kẹo, lấy một phần ba. Lấy mấy cái?", {"value": "4", "alt": ["4 cái"]},
  "Một phần ba là chia thành 3 phần bằng nhau.", "12 chia 3 bằng mấy?", "12 : 3 = 4 cái."),
 ("noi", 2, "TO3.PS.02", "Có 18 quả cam, lấy một phần sáu. Lấy mấy quả?", {"value": "3", "alt": ["3 quả"]},
  "Chia thành 6 phần bằng nhau.", "18 chia 6 bằng mấy?", "18 : 6 = 3 quả."),
 ("giai_thich", 3, "TO3.PS.02", "Vì sao một phần hai của 10 lại bằng 5?", {"value": "vì chia 10 thành 2 phần bằng nhau, mỗi phần 5",
   "rubric": ["Nói được 'chia đôi'.", "Nói được 'chia thành 2 phần bằng nhau'.", "Nói được phép tính 10 : 2 = 5 và giải thích 'phần' là một trong hai phần đó."]},
  "Một phần hai nghĩa là chia thành mấy phần?", "10 chia 2 bằng bao nhiêu?", "Vì chia 10 thành 2 phần bằng nhau thì mỗi phần là 5."),
 ("noi", 3, "TO3.PS.02", "Có 24 viên phấn, lấy một phần tám. Lấy mấy viên?", {"value": "3", "alt": ["3 viên"]},
  "Chia thành 8 phần bằng nhau.", "24 chia 8 bằng mấy?", "24 : 8 = 3 viên."),
],
"tv3-doc-hieu-doan-van": [
 ("noi", 1, "TV3.DH.02",
  "Nghe đoạn văn: 'Sáng sớm, bà nội ra vườn tưới rau. Trên giàn, mấy quả cà chua đỏ ửng như những chiếc đèn lồng nhỏ.' Đoạn văn nói về ai?",
  {"value": "bà nội", "alt": ["bà", "bà của bạn nhỏ"]},
  "Con nghe xem ai là người ra vườn.", "Người đầu tiên được nhắc đến là ai?", "Là bà nội."),
 ("noi", 1, "TV3.DH.02",
  "Trong đoạn văn vừa rồi, quả cà chua được so sánh với gì?", {"value": "đèn lồng", "alt": ["chiếc đèn lồng", "những chiếc đèn lồng nhỏ"]},
  "Con tìm chữ 'như' trong đoạn.", "Đứng sau chữ 'như' là gì?", "Là những chiếc đèn lồng nhỏ."),
 ("noi", 2, "TV3.DH.03", "Câu văn 'đỏ ửng như những chiếc đèn lồng nhỏ' dùng biện pháp gì?", {"value": "so sánh", "alt": ["biện pháp so sánh"]},
  "Con thấy từ nào dùng để ví von?", "Từ 'như' là dấu hiệu của biện pháp nào?", "Đó là so sánh."),
 ("noi", 2, "TV3.DH.02",
  "Nghe đoạn: 'Chiều nào cũng vậy, chú chó Vàng nằm trước hiên, mắt nhìn ra ngõ chờ bạn nhỏ đi học về.' Chú chó đang làm gì?",
  {"value": "nằm chờ bạn nhỏ đi học về", "alt": ["chờ bạn nhỏ", "nằm trước hiên chờ bạn nhỏ"]},
  "Con nghe chú chó ở đâu và làm gì.", "Nó nhìn ra ngõ để làm gì?", "Nằm trước hiên, chờ bạn nhỏ đi học về."),
 ("noi", 2, "TV3.DH.02",
  "Trong đoạn về chú chó, chi tiết nào cho thấy chú chó rất thân với bạn nhỏ?", {"value": "nằm chờ bạn nhỏ đi học về", "alt": ["chờ bạn nhỏ đi học về", "ngày nào cũng chờ"]},
  "Chi tiết nào lặp lại ngày nào cũng thế?", "'Chiều nào cũng vậy' nói lên điều gì?", "Chú nằm chờ bạn nhỏ đi học về."),
 ("chon", 2, "TV3.DH.02",
  "Câu chuyện về chú chó Vàng cho thấy điều gì? A. Chó rất sợ bạn nhỏ   B. Chó quý bạn nhỏ   C. Chó không thích ra ngoài", {"value": "B"},
  "Ngày nào chú cũng chờ, vậy chú thấy thế nào?", "Chờ ai đó về là biểu hiện của tình cảm gì?", "Là quý bạn nhỏ."),
 ("giai_thich", 3, "TV3.DH.02", "Vì sao tác giả lại so sánh quả cà chua với đèn lồng?", {"value": "vì cà chua đỏ và tròn giống đèn lồng",
   "rubric": ["Nói được 'vì đỏ'.", "Nói được 'vì đỏ và tròn'.", "Nói được cả hình dáng, màu sắc và cảm giác đẹp, ấm."]},
  "Quả cà chua màu gì, hình gì?", "Đèn lồng màu gì, hình gì?", "Vì cà chua đỏ và tròn giống chiếc đèn lồng nhỏ."),
 ("noi", 3, "TV3.NN.01", "Con kể lại cho cô nghe một việc con đã làm giúp bố mẹ tuần này.", {"value": "kể được một việc có thật, nói rõ làm gì",
   "rubric": ["Kể được một việc nhưng chưa rõ.", "Kể rõ việc và thời điểm.", "Kể rõ việc, thời điểm và cảm xúc của mình."]},
  "Con nghĩ xem tuần này con đã giúp bố mẹ việc gì.", "Việc đó con làm khi nào?", "Kể lại: con đã làm gì, khi nào, và con thấy thế nào."),
],
"tv3-tu-cung-nghia-trai-nghia": [
 ("chon", 1, "TV3.LT.01", "Từ nào CÙNG nghĩa với 'chăm chỉ'? A. lười biếng   B. siêng năng   C. chậm chạp", {"value": "B"},
  "Cùng nghĩa là nói giống nhau.", "Chăm chỉ là hay làm việc.", "Siêng năng là cùng nghĩa."),
 ("chon", 1, "TV3.LT.01", "Từ nào TRÁI nghĩa với 'cao'? A. thấp   B. to   C. dài", {"value": "A"},
  "Trái nghĩa là ngược lại.", "Cao thì ngược với gì?", "Là thấp."),
 ("noi", 1, "TV3.LT.01", "Từ trái nghĩa với 'nóng' là gì?", {"value": "lạnh", "alt": ["lạnh cóng", "nguội"]},
  "Con nghĩ đến thời tiết mùa đông.", "Nóng thì ngược với gì?", "Là lạnh."),
 ("noi", 1, "TV3.LT.01", "Từ cùng nghĩa với 'to' là gì?", {"value": "lớn", "alt": ["to lớn", "khổng lồ"]},
  "Con nghĩ xem cái gì đó rộng, nặng.", "To còn nói là gì?", "Là lớn."),
 ("noi", 2, "TV3.LT.01", "Tìm một từ trái nghĩa với 'vui'.", {"value": "buồn", "alt": ["buồn bã", "rầu"]},
  "Vui thì ngược với gì?", "Khi không vui con thấy thế nào?", "Là buồn."),
 ("chon", 2, "TV3.LT.01", "Cặp từ nào là cặp TRÁI NGHĨA? A. nhanh – mau   B. sạch – bẩn   C. đẹp – xinh", {"value": "B"},
  "Con xét từng cặp xem có ngược nhau không.", "Nhanh và mau có ngược nhau không?", "Sạch và bẩn là ngược nhau."),
 ("giai_thich", 3, "TV3.LT.01", "Vì sao 'nhanh' và 'mau' là từ cùng nghĩa, không phải trái nghĩa?", {"value": "vì cả hai đều chỉ sự việc diễn ra trong thời gian ngắn",
   "rubric": ["Nói được 'vì giống nhau'.", "Nói được 'cả hai đều chỉ nhanh'.", "Nói được cả hai cùng chỉ thời gian ngắn nên nghĩa giống nhau."]},
  "Con thử dùng 'nhanh' và 'mau' trong cùng một câu.", "Hai từ đó nói cùng một ý hay ngược ý?", "Vì cả hai đều chỉ việc xảy ra trong thời gian ngắn — nghĩa giống nhau."),
 ("noi", 3, "TV3.LT.01", "Đặt một câu có cả từ 'cao' và từ trái nghĩa của nó.", {"value": "câu có cao và thấp",
   "rubric": ["Nói được câu có hai từ nhưng chưa rõ nghĩa.", "Nói được câu có 'cao' và 'thấp' đúng nghĩa.", "Nói được câu tự nhiên, đúng cả nghĩa và ngữ pháp."]},
  "Trái nghĩa với cao là gì?", "Con đặt câu so sánh hai vật.", "Ví dụ: Cây cau này cao, còn cây ổi kia thấp."),
],
"tv3-kieu-cau": [
 ("chon", 1, "TV3.LT.02", "Câu 'Con đã làm bài chưa?' là kiểu câu gì? A. câu kể   B. câu hỏi   C. câu cảm", {"value": "B"},
  "Con nhìn dấu cuối câu.", "Cuối câu có dấu chấm hỏi.", "Là câu hỏi."),
 ("chon", 1, "TV3.LT.02", "Câu 'Ôi, đẹp quá!' là kiểu câu gì? A. câu khiến   B. câu cảm   C. câu kể", {"value": "B"},
  "Câu này bộc lộ cảm xúc gì?", "Từ 'Ôi' và dấu chấm than cho biết điều gì?", "Là câu cảm."),
 ("chon", 2, "TV3.LT.02", "Câu 'Con đóng cửa giúp mẹ nhé!' là kiểu câu gì? A. câu khiến   B. câu hỏi   C. câu kể", {"value": "A"},
  "Câu này nhờ vả hay kể chuyện?", "Có từ 'giúp', 'nhé' là dấu hiệu gì?", "Là câu khiến."),
 ("noi", 2, "TV3.LT.02", "Đặt một câu hỏi về thời tiết hôm nay.", {"value": "câu hỏi có dấu chấm hỏi",
   "rubric": ["Nói được câu hỏi nhưng thiếu dấu.", "Nói được câu hỏi đúng nội dung.", "Nói được câu hỏi tự nhiên, đúng cả từ để hỏi và dấu câu."]},
  "Muốn hỏi thì dùng từ nào?", "Con hỏi cô xem hôm nay trời thế nào.", "Ví dụ: Hôm nay trời có mưa không ạ?"),
 ("noi", 2, "TV3.LT.03", "Dấu hai chấm trong câu 'Mẹ dặn: con nhớ mang áo mưa' dùng để làm gì?", {"value": "báo hiệu lời nói trực tiếp", "alt": ["báo hiệu phần giải thích", "để dẫn lời nói"]},
  "Sau dấu hai chấm là lời của ai?", "Đó là lời nói trực tiếp hay lời kể?", "Dấu hai chấm báo hiệu lời nói trực tiếp."),
 ("noi", 3, "TV3.LT.03", "Dấu ngoặc kép trong câu 'Bạn ấy được gọi là \"cây toán\" của lớp' dùng để làm gì?", {"value": "đánh dấu từ ngữ được dùng với ý đặc biệt", "alt": ["đánh dấu lời trích dẫn", "đánh dấu từ được nhấn mạnh"]},
  "Cụm 'cây toán' có phải tên thật không?", "Nó được dùng theo nghĩa đặc biệt.", "Dấu ngoặc kép đánh dấu từ ngữ dùng với ý đặc biệt."),
 ("chon", 3, "TV3.LT.02", "Câu nào là câu KỂ? A. Bạn có đi học không?   B. Em là học sinh lớp ba.   C. Em hãy đọc to lên!", {"value": "B"},
  "Câu kể dùng để kể hoặc giới thiệu.", "Câu nào không hỏi, không yêu cầu?", "Câu 'Em là học sinh lớp ba' là câu kể."),
 ("giai_thich", 3, "TV3.LT.02", "Vì sao câu cảm thường có dấu chấm than?", {"value": "vì câu cảm bộc lộ cảm xúc mạnh",
   "rubric": ["Nói được 'vì có cảm xúc'.", "Nói được 'cảm xúc mạnh nên dùng dấu chấm than'.", "Nói được dấu chấm than thể hiện ngữ điệu và cảm xúc, cho ví dụ."]},
  "Câu cảm dùng khi nào?", "Khi cảm xúc mạnh, người ta viết dấu gì?", "Vì câu cảm bộc lộ cảm xúc mạnh nên dùng dấu chấm than."),
],
"tv3-doc-dung-tu-kho": [
 ("noi", 1, "TV3.CT.01", "Đọc to từ sau: xum xuê", {"value": "xum xuê", "alt": ["xum xue"]},
  "Con đọc âm đầu 'x' cho rõ.", "Hai tiếng đều bắt đầu bằng 'x'.", "Đọc là: xum xuê."),
 ("noi", 1, "TV3.CT.01", "Đọc to từ sau: sáng suốt", {"value": "sáng suốt", "alt": ["sang suot"]},
  "Âm đầu là 's', không phải 'x'.", "Đọc chậm từng tiếng.", "Đọc là: sáng suốt."),
 ("chon", 1, "TV3.CT.01", "Từ nào viết ĐÚNG? A. trung thành   B. chung thành   C. trung thàn", {"value": "A"},
  "Con nghĩ đến nghĩa 'luôn một lòng'.", "'Trung' nghĩa là một lòng, 'chung' nghĩa là cùng.", "Viết đúng là 'trung thành'."),
 ("chon", 1, "TV3.CT.01", "Từ nào viết ĐÚNG? A. dành dụm   B. giành dụm   C. dành giụm", {"value": "A"},
  "'Dành dụm' là để dành từng chút.", "Tiếng thứ nhất bắt đầu bằng 'd'.", "Viết đúng là 'dành dụm'."),
 ("noi", 2, "TV3.CT.01", "Đọc to: nghỉ ngơi", {"value": "nghỉ ngơi", "alt": ["nghi ngoi"]},
  "Tiếng 'nghỉ' có dấu hỏi.", "Đọc rõ dấu hỏi ở tiếng đầu.", "Đọc là: nghỉ ngơi."),
 ("noi", 2, "TV3.CT.01", "Đọc to: dũng cảm", {"value": "dũng cảm", "alt": ["dung cam"]},
  "Tiếng đầu có dấu ngã.", "Đọc rõ dấu ngã: dũng.", "Đọc là: dũng cảm."),
 ("chon", 3, "TV3.CT.01", "Câu nào viết ĐÚNG chính tả? A. Chú mèo nằm xưởi nắng.   B. Chú mèo nằm sưởi nắng.   C. Chú mèo nằm sưởi nắng.", {"value": "B"},
  "Con nghe kỹ âm đầu của từ chỉ việc phơi mình dưới nắng.", "Từ đó bắt đầu bằng 's'.", "Viết đúng là 'sưởi nắng'."),
 ("noi", 3, "TV3.DH.01", "Đọc to câu sau, nghỉ hơi đúng chỗ: 'Trời đã sang thu, gió heo may về, lá bàng bắt đầu chuyển đỏ.'", {"value": "đọc đúng, nghỉ sau dấu phẩy",
   "rubric": ["Đọc được cả câu nhưng còn ngắt sai.", "Đọc đúng, nghỉ sau dấu phẩy.", "Đọc đúng, nghỉ hơi đúng và có ngữ điệu nhẹ nhàng."]},
  "Con thấy dấu phẩy ở đâu thì nghỉ một chút.", "Câu có mấy dấu phẩy?", "Đọc: Trời đã sang thu / gió heo may về / lá bàng bắt đầu chuyển đỏ."),
],
}

# Câu "chon" ở toan3-bieu-thuc-so có 2 đáp án đúng (A và C) → sửa lại cho đúng luật
# "không câu nào có hai đáp án đúng": đổi C thành 3 × 5 + 4 (= 19).
ITEMS["toan3-bieu-thuc-so"][4] = (
    "chon", 2, "TO3.SP.10",
    "Biểu thức nào có giá trị bằng 18? A. 3 + 5 × 3   B. (3 + 5) × 3   C. 3 × 5 + 4",
    {"value": "A"},
    "Con tính từng biểu thức, nhớ thứ tự nhân trước.",
    "A: 5 × 3 = 15, 3 + 15 = 18. B: 8 × 3 = 24.",
    "C: 15 + 4 = 19. Vậy chỉ A bằng 18.",
)


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


def main():
    out = []
    out.append("-- AUTO-GENERATED bởi scripts/gen-ekid-lop3-batch2.py — đừng sửa tay.")
    out.append("-- Nguồn YCCĐ: TT 32/2018/TT-BGDĐT — Toán lớp 3 & Tiếng Việt lớp 3.")
    out.append("BEGIN;")
    out.append("")
    out.append("-- Yêu cầu cần đạt môn Tiếng Việt")
    for oid, strand, topic, short, stmt, level, term in TV_OBJ:
        out.append(
            "INSERT INTO public.ekid_objectives (id, subject, grade, strand, topic, code_short, statement, level, term)\n"
            f"VALUES ({q(oid)}, 'tieng-viet', 3, {q(strand)}, {q(topic)}, {q(short)}, {q(stmt)}, {level}, {term})\n"
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
            f"VALUES ({q(L['slug'])}, 'tieu-hoc', 3, {q(L['subject'])}, {q(L['title'])}, 'chung', {q(L['core_topic'])}, "
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
