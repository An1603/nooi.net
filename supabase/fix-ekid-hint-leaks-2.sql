-- Sửa tiếp các bậc gợi ý 1–3 còn lộ đáp án (cổng C1, lô 3).
-- Chỉ sửa bậc 3 (index 2) — giữ nguyên bậc 1–2 đã ổn.
BEGIN;

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Tên gọi có hai tiếng, tiếng đầu bắt đầu bằng chữ ''tr''."'::jsonb)
WHERE prompt LIKE 'Điểm ở giữa đoạn thẳng AB%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Nếu điểm lệch về một phía thì hai nửa sẽ không còn bằng nhau — mà bằng nhau là điều kiện bắt buộc."'::jsonb)
WHERE prompt LIKE 'Vì sao trung điểm phải nằm chính giữa%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Nó giống góc của viên gạch lát nhà — loại góc đặc biệt mà ê-ke dùng để kiểm tra."'::jsonb)
WHERE prompt LIKE 'Góc của quyển sách%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Hình đó có bốn cạnh dài bằng nhau và bốn góc vuông."'::jsonb)
WHERE prompt LIKE 'Mặt của khối lập phương%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Tiền tố ''ki-lô'' cũng có trong ki-lô-mét: 1 km = 1000 m, nên đơn vị này theo đúng quy ước đó."'::jsonb)
WHERE prompt LIKE 'Vì sao 1 ki-lô-gam%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Con đi một vòng quanh hình: tổng quãng đường vừa đi chính là đại lượng đang hỏi."'::jsonb)
WHERE prompt = 'Chu vi là gì?';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Nó bơi theo đàn ở nơi nước mặn, mênh mông."'::jsonb)
WHERE prompt = 'Cá heo sống ở đâu?';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Có hai việc: một việc bơi cùng đàn, một việc nhảy lên khỏi mặt nước."'::jsonb)
WHERE prompt LIKE 'Theo đoạn văn, cá heo thích làm gì%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Các mốc 6 giờ, 6 giờ 30, 7 giờ tăng dần — người ta sắp xếp theo loại trình tự này."'::jsonb)
WHERE prompt LIKE 'Nghe đoạn: ''Sáng 6 giờ%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Người được nhắc ở mốc đó là mẹ, việc đó gắn với bữa sáng."'::jsonb)
WHERE prompt LIKE 'Trong đoạn vừa rồi, lúc 6 giờ 30%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Phần sau dấu là lời của Lan, được kể nguyên văn chứ không phải lời người kể."'::jsonb)
WHERE prompt LIKE 'Trong câu ''Lan nói:%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Sau dấu là một dãy các thứ được kể ra lần lượt."'::jsonb)
WHERE prompt LIKE 'Trong câu ''Mẹ mua ba thứ:%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Thiếu dấu thì người đọc không phân biệt được đâu là lời nhân vật, đâu là lời người kể."'::jsonb)
WHERE prompt LIKE 'Vì sao lời nói trực tiếp%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Người nghe cần biết ba điều: ai, làm gì, lúc nào."'::jsonb)
WHERE prompt = 'Muốn kể rõ, câu của con cần có gì?';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Trao đổi phải theo lượt: người này nói xong mới đến người kia."'::jsonb)
WHERE prompt = 'Khi bạn đang kể, con muốn góp ý thì nên làm gì?';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Thiếu hai thông tin đó thì người nghe khó hình dung bối cảnh câu chuyện."'::jsonb)
WHERE prompt LIKE 'Vì sao khi kể cần nói rõ thời gian%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Hai vật được nhắc sau chữ ''như'': một vật tròn, một vật phát sáng."'::jsonb)
WHERE prompt LIKE 'Nghe hai câu thơ:%';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Đó là chuyện các tiếng ở cuối dòng thơ nghe na ná nhau."'::jsonb)
WHERE prompt = 'Vần là gì?';

UPDATE public.ekid_items SET hint_ladder = jsonb_set(hint_ladder, '{2}',
  '"Trăng có hình tròn và toả sáng — hai điều đó giống vật được chọn để ví."'::jsonb)
WHERE prompt LIKE 'Vì sao tác giả lại so sánh trăng%';

COMMIT;
