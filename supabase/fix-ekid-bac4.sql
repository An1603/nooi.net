BEGIN;
UPDATE public.ekid_items
SET hint_ladder = hint_ladder || '["Đáp án: 49 730 ki-lô-gam. Giờ con nói lại cho cô: vì sao ra kết quả đó?"]'::jsonb
WHERE prompt LIKE 'Một kho có 45 230 ki-lô-gam%' AND jsonb_array_length(hint_ladder) = 3;

UPDATE public.ekid_items
SET hint_ladder = hint_ladder || '["Vì hàng trăm không có chữ số nào nên phải đọc “không trăm”, rồi đọc tiếp hàng chục và hàng đơn vị: không trăm linh năm."]'::jsonb
WHERE prompt LIKE 'Vì sao số 70 005 phải đọc%' AND jsonb_array_length(hint_ladder) = 3;
COMMIT;
