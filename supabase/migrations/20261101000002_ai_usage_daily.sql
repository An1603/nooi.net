-- Hạn mức tin nhắn AI Mentor theo ngày (chốt 100 tin/ngày/người — 01/11/2026)
-- Bảng đếm + 2 hàm nguyên tử tăng/giảm. Không có policy: chỉ service-role dùng.

CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ngay          date        NOT NULL,
  so_tin        integer     NOT NULL DEFAULT 0 CHECK (so_tin >= 0),
  cap_nhat_luc  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ngay)
);

ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_usage_daily FROM anon, authenticated;

-- Tăng 1 tin và trả về tổng của ngày → dùng để chặn vượt hạn mức kể cả khi
-- nhiều request song song (upsert ... returning là một câu lệnh nguyên tử).
CREATE OR REPLACE FUNCTION public.tang_ai_usage(p_user uuid, p_ngay date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v integer;
BEGIN
  INSERT INTO public.ai_usage_daily (user_id, ngay, so_tin)
  VALUES (p_user, p_ngay, 1)
  ON CONFLICT (user_id, ngay) DO UPDATE
    SET so_tin = public.ai_usage_daily.so_tin + 1,
        cap_nhat_luc = now()
  RETURNING so_tin INTO v;

  RETURN v;
END;
$$;

-- Hoàn lại 1 tin khi gọi model thất bại (không tính vào hạn mức của người dùng).
CREATE OR REPLACE FUNCTION public.giam_ai_usage(p_user uuid, p_ngay date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v integer;
BEGIN
  UPDATE public.ai_usage_daily
     SET so_tin = GREATEST(so_tin - 1, 0),
         cap_nhat_luc = now()
   WHERE user_id = p_user AND ngay = p_ngay
  RETURNING so_tin INTO v;

  RETURN COALESCE(v, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.tang_ai_usage(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.giam_ai_usage(uuid, date) FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_ngay ON public.ai_usage_daily (ngay);
