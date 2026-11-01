-- Luot truy cap toan he thong nooi.net (giai doan 2)
-- Ghi boi route /api/track bang service role; chi quan tri doc qua API /api/admin/truy-cap.

CREATE TABLE IF NOT EXISTS public.luot_truy_cap (
  id           text PRIMARY KEY,          -- ma phien (cookie nooi_vid)
  user_id      uuid,
  email        text,
  bat_dau      timestamptz NOT NULL DEFAULT now(),
  cuoi         timestamptz NOT NULL DEFAULT now(),
  ip           text,
  quoc_gia     text,
  thanh_pho    text,
  thiet_bi     text,
  trinh_duyet  text,
  nguon        text,
  utm          text,
  trang_vao    text,
  so_trang     integer NOT NULL DEFAULT 0,
  thoat        text,
  host         text
);

CREATE INDEX IF NOT EXISTS ix_ltc_cuoi ON public.luot_truy_cap (cuoi DESC);
CREATE INDEX IF NOT EXISTS ix_ltc_batdau ON public.luot_truy_cap (bat_dau DESC);

CREATE TABLE IF NOT EXISTS public.luot_truy_cap_su_kien (
  id         bigserial PRIMARY KEY,
  phien      text NOT NULL,
  luc        timestamptz NOT NULL DEFAULT now(),
  loai       text NOT NULL,               -- vao | xem | nhip | thoat
  duong_dan  text,
  host       text,
  giay       integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_ltsk_luc ON public.luot_truy_cap_su_kien (luc DESC);
CREATE INDEX IF NOT EXISTS ix_ltsk_phien ON public.luot_truy_cap_su_kien (phien);

ALTER TABLE public.luot_truy_cap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.luot_truy_cap_su_kien ENABLE ROW LEVEL SECURITY;

-- Don ban ghi qua 180 ngay
CREATE OR REPLACE FUNCTION public.don_dep_luot_truy_cap(so_ngay integer DEFAULT 180)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  da_xoa integer;
BEGIN
  DELETE FROM public.luot_truy_cap_su_kien
   WHERE luc < now() - (so_ngay || ' days')::interval;
  GET DIAGNOSTICS da_xoa = ROW_COUNT;
  DELETE FROM public.luot_truy_cap
   WHERE cuoi < now() - (so_ngay || ' days')::interval;
  RETURN da_xoa;
END;
$$;

REVOKE ALL ON FUNCTION public.don_dep_luot_truy_cap(integer) FROM PUBLIC, anon, authenticated;
