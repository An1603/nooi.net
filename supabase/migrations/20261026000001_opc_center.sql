-- ============================================================================
-- OPC CENTER — MVP nền tảng vận hành (CRM + cộng đồng + hồ sơ + đơn hàng)
-- Ngày: 26/10/2026 · Pháp nhân: NOOI Group (M03)
-- Nguyên tắc: một người — một hồ sơ; một đơn — một dòng tiền; không xoá cứng.
-- ============================================================================

create extension if not exists pgcrypto;

-- ── 1. NGƯỜI ────────────────────────────────────────────────────────────────
create table if not exists public.opc_nguoi (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  email       text,
  ten         text,
  sdt         text,
  vai_tro     text not null default 'thanh_vien'
              check (vai_tro in ('quan_tri','dieu_hanh','sales','success','mentor','thanh_vien')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.opc_ho_so (
  id          uuid primary key default gen_random_uuid(),
  nguoi_id    uuid not null unique references public.opc_nguoi(id) on delete cascade,
  nghe        text,
  doanh_thu   text,
  so_nhan_su  int,
  muc_tieu    text,
  diem_chin   int not null default 0 check (diem_chin between 0 and 100),
  trang_thai  text not null default 'khoi_tao'
              check (trang_thai in ('khoi_tao','chuan_hoa','dong_hanh','dot_pha','dai_su','mentor')),
  updated_at  timestamptz not null default now()
);

-- ── 2. BÁN HÀNG ─────────────────────────────────────────────────────────────
create table if not exists public.opc_lead (
  id           uuid primary key default gen_random_uuid(),
  ten          text not null,
  email        text,
  sdt          text,
  nguon        text,
  kenh         text,
  trang_thai   text not null default 'lead'
               check (trang_thai in ('lead','mql','sql','customer','active','at_risk','churned')),
  diem         int not null default 0 check (diem between 0 and 100),
  chu_so_huu   uuid references public.opc_nguoi(id) on delete set null,
  ghi_chu      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.opc_hoat_dong (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references public.opc_lead(id) on delete cascade,
  nguoi_id    uuid references public.opc_nguoi(id) on delete set null,
  loai        text not null default 'ghi_chu'
              check (loai in ('goi','email','ghi_chu','hen','trang_thai','he_thong')),
  noi_dung    text not null,
  luc         timestamptz not null default now()
);

create table if not exists public.opc_ticket (
  id           uuid primary key default gen_random_uuid(),
  nguoi_id     uuid references public.opc_nguoi(id) on delete cascade,
  tieu_de      text not null,
  noi_dung     text,
  loai         text not null default 'ho_tro',
  muc_do       text not null default 'thuong' check (muc_do in ('thap','thuong','cao','khan')),
  trang_thai   text not null default 'mo' check (trang_thai in ('mo','dang_xu_ly','dong')),
  chu_so_huu   uuid references public.opc_nguoi(id) on delete set null,
  han_xu_ly    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── 3. THƯƠNG MẠI ───────────────────────────────────────────────────────────
create table if not exists public.opc_goi (
  ma         text primary key,
  ten        text not null,
  gia        int not null default 0,
  ky         text not null default 'thang',
  quyen_loi  jsonb not null default '[]'::jsonb,
  thu_tu     int not null default 0,
  active     boolean not null default true
);

create table if not exists public.opc_don_hang (
  id            uuid primary key default gen_random_uuid(),
  nguoi_id      uuid references public.opc_nguoi(id) on delete set null,
  goi_ma        text references public.opc_goi(ma) on delete set null,
  so_tien       int not null default 0 check (so_tien >= 0),
  trang_thai    text not null default 'cho_tt'
                check (trang_thai in ('cho_tt','da_tt','huy','hoan')),
  ma_giao_dich  text,
  ghi_chu       text,
  created_at    timestamptz not null default now(),
  paid_at       timestamptz
);

-- ── 4. CỘNG ĐỒNG ────────────────────────────────────────────────────────────
create table if not exists public.opc_bai_dang (
  id          uuid primary key default gen_random_uuid(),
  nguoi_id    uuid not null references public.opc_nguoi(id) on delete cascade,
  nhom        text not null default 'chung',
  tieu_de     text,
  noi_dung    text not null,
  ghim        boolean not null default false,
  trang_thai  text not null default 'hien' check (trang_thai in ('hien','an')),
  created_at  timestamptz not null default now()
);

create table if not exists public.opc_binh_luan (
  id           uuid primary key default gen_random_uuid(),
  bai_dang_id  uuid not null references public.opc_bai_dang(id) on delete cascade,
  nguoi_id     uuid not null references public.opc_nguoi(id) on delete cascade,
  noi_dung     text not null,
  created_at   timestamptz not null default now()
);

-- ── 5. VẬN HÀNH ─────────────────────────────────────────────────────────────
create table if not exists public.opc_kpi_ngay (
  ngay        date primary key,
  doanh_thu   bigint not null default 0,
  khach_moi   int not null default 0,
  khach_huy   int not null default 0,
  mrr         bigint not null default 0,
  nps         int,
  ticket_mo   int not null default 0,
  updated_at  timestamptz not null default now()
);

create table if not exists public.opc_nhat_ky (
  id           bigserial primary key,
  nguoi_id     uuid references public.opc_nguoi(id) on delete set null,
  hanh_dong    text not null,
  doi_tuong    text,
  doi_tuong_id text,
  du_lieu      jsonb,
  luc          timestamptz not null default now()
);

-- ── 6. CHỈ MỤC ──────────────────────────────────────────────────────────────
create index if not exists opc_lead_trang_thai_idx on public.opc_lead(trang_thai);
create index if not exists opc_lead_created_idx on public.opc_lead(created_at desc);
create index if not exists opc_lead_chu_so_huu_idx on public.opc_lead(chu_so_huu);
create index if not exists opc_hoat_dong_lead_idx on public.opc_hoat_dong(lead_id, luc desc);
create index if not exists opc_bai_dang_created_idx on public.opc_bai_dang(created_at desc);
create index if not exists opc_binh_luan_bai_idx on public.opc_binh_luan(bai_dang_id, created_at);
create index if not exists opc_ticket_trang_thai_idx on public.opc_ticket(trang_thai, han_xu_ly);
create index if not exists opc_don_hang_nguoi_idx on public.opc_don_hang(nguoi_id, created_at desc);

-- ── 7. HÀM DÙNG CHUNG ───────────────────────────────────────────────────────
create or replace function public.opc_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.opc_nguoi_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.opc_nguoi where user_id = auth.uid() limit 1;
$$;

-- Vai trò hiệu lực: admin.nooi.net (bảng admin_users) luôn là quản trị.
create or replace function public.opc_vai_tro()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from public.admin_users where user_id = auth.uid()) then 'quan_tri'
    else coalesce((select vai_tro from public.opc_nguoi where user_id = auth.uid() limit 1), 'khach')
  end;
$$;

create or replace function public.opc_la_nhan_vien()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.opc_vai_tro() in ('quan_tri','dieu_hanh','sales','success');
$$;

revoke all on function public.opc_nguoi_id() from public;
revoke all on function public.opc_vai_tro() from public;
revoke all on function public.opc_la_nhan_vien() from public;
grant execute on function public.opc_nguoi_id() to authenticated;
grant execute on function public.opc_vai_tro() to authenticated;
grant execute on function public.opc_la_nhan_vien() to authenticated;

-- Chặn tự nâng quyền: chỉ quản trị được đổi vai_tro.
create or replace function public.opc_guard_vai_tro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.vai_tro is distinct from old.vai_tro and public.opc_vai_tro() <> 'quan_tri' then
    raise exception 'Chỉ quản trị được đổi vai trò';
  end if;
  return new;
end;
$$;

drop trigger if exists opc_nguoi_touch on public.opc_nguoi;
create trigger opc_nguoi_touch before update on public.opc_nguoi
for each row execute function public.opc_touch_updated_at();

drop trigger if exists opc_nguoi_guard on public.opc_nguoi;
create trigger opc_nguoi_guard before update on public.opc_nguoi
for each row execute function public.opc_guard_vai_tro();

drop trigger if exists opc_ho_so_touch on public.opc_ho_so;
create trigger opc_ho_so_touch before update on public.opc_ho_so
for each row execute function public.opc_touch_updated_at();

drop trigger if exists opc_lead_touch on public.opc_lead;
create trigger opc_lead_touch before update on public.opc_lead
for each row execute function public.opc_touch_updated_at();

drop trigger if exists opc_ticket_touch on public.opc_ticket;
create trigger opc_ticket_touch before update on public.opc_ticket
for each row execute function public.opc_touch_updated_at();

-- ── 8. RLS ──────────────────────────────────────────────────────────────────
alter table public.opc_nguoi      enable row level security;
alter table public.opc_ho_so      enable row level security;
alter table public.opc_lead       enable row level security;
alter table public.opc_hoat_dong  enable row level security;
alter table public.opc_ticket     enable row level security;
alter table public.opc_goi        enable row level security;
alter table public.opc_don_hang   enable row level security;
alter table public.opc_bai_dang   enable row level security;
alter table public.opc_binh_luan  enable row level security;
alter table public.opc_kpi_ngay   enable row level security;
alter table public.opc_nhat_ky    enable row level security;

-- opc_nguoi
drop policy if exists opc_nguoi_select on public.opc_nguoi;
create policy opc_nguoi_select on public.opc_nguoi for select to authenticated
using (user_id = auth.uid() or public.opc_la_nhan_vien());

drop policy if exists opc_nguoi_insert on public.opc_nguoi;
create policy opc_nguoi_insert on public.opc_nguoi for insert to authenticated
with check ((user_id = auth.uid() and vai_tro = 'thanh_vien') or public.opc_vai_tro() = 'quan_tri');

drop policy if exists opc_nguoi_update on public.opc_nguoi;
create policy opc_nguoi_update on public.opc_nguoi for update to authenticated
using (user_id = auth.uid() or public.opc_vai_tro() = 'quan_tri')
with check (user_id = auth.uid() or public.opc_vai_tro() = 'quan_tri');

drop policy if exists opc_nguoi_delete on public.opc_nguoi;
create policy opc_nguoi_delete on public.opc_nguoi for delete to authenticated
using (public.opc_vai_tro() = 'quan_tri');

-- opc_ho_so
drop policy if exists opc_ho_so_select on public.opc_ho_so;
create policy opc_ho_so_select on public.opc_ho_so for select to authenticated
using (nguoi_id = public.opc_nguoi_id() or public.opc_la_nhan_vien());

drop policy if exists opc_ho_so_insert on public.opc_ho_so;
create policy opc_ho_so_insert on public.opc_ho_so for insert to authenticated
with check (nguoi_id = public.opc_nguoi_id() or public.opc_vai_tro() = 'quan_tri');

drop policy if exists opc_ho_so_update on public.opc_ho_so;
create policy opc_ho_so_update on public.opc_ho_so for update to authenticated
using (nguoi_id = public.opc_nguoi_id() or public.opc_vai_tro() = 'quan_tri')
with check (nguoi_id = public.opc_nguoi_id() or public.opc_vai_tro() = 'quan_tri');

-- opc_lead: chỉ nhân viên
drop policy if exists opc_lead_all on public.opc_lead;
create policy opc_lead_all on public.opc_lead for all to authenticated
using (public.opc_la_nhan_vien())
with check (public.opc_la_nhan_vien());

-- opc_hoat_dong: nhân viên đọc/ghi; quản trị xoá
drop policy if exists opc_hoat_dong_select on public.opc_hoat_dong;
create policy opc_hoat_dong_select on public.opc_hoat_dong for select to authenticated
using (public.opc_la_nhan_vien());

drop policy if exists opc_hoat_dong_insert on public.opc_hoat_dong;
create policy opc_hoat_dong_insert on public.opc_hoat_dong for insert to authenticated
with check (public.opc_la_nhan_vien());

drop policy if exists opc_hoat_dong_delete on public.opc_hoat_dong;
create policy opc_hoat_dong_delete on public.opc_hoat_dong for delete to authenticated
using (public.opc_vai_tro() = 'quan_tri');

-- opc_ticket
drop policy if exists opc_ticket_select on public.opc_ticket;
create policy opc_ticket_select on public.opc_ticket for select to authenticated
using (nguoi_id = public.opc_nguoi_id() or public.opc_la_nhan_vien());

drop policy if exists opc_ticket_insert on public.opc_ticket;
create policy opc_ticket_insert on public.opc_ticket for insert to authenticated
with check (nguoi_id = public.opc_nguoi_id());

drop policy if exists opc_ticket_update on public.opc_ticket;
create policy opc_ticket_update on public.opc_ticket for update to authenticated
using (public.opc_la_nhan_vien())
with check (public.opc_la_nhan_vien());

-- opc_goi: mọi người đọc; quản trị ghi
drop policy if exists opc_goi_select on public.opc_goi;
create policy opc_goi_select on public.opc_goi for select to authenticated using (true);

drop policy if exists opc_goi_write on public.opc_goi;
create policy opc_goi_write on public.opc_goi for all to authenticated
using (public.opc_vai_tro() = 'quan_tri')
with check (public.opc_vai_tro() = 'quan_tri');

-- opc_don_hang
drop policy if exists opc_don_hang_select on public.opc_don_hang;
create policy opc_don_hang_select on public.opc_don_hang for select to authenticated
using (nguoi_id = public.opc_nguoi_id() or public.opc_la_nhan_vien());

drop policy if exists opc_don_hang_write on public.opc_don_hang;
create policy opc_don_hang_write on public.opc_don_hang for all to authenticated
using (public.opc_la_nhan_vien())
with check (public.opc_la_nhan_vien());

-- opc_bai_dang
drop policy if exists opc_bai_dang_select on public.opc_bai_dang;
create policy opc_bai_dang_select on public.opc_bai_dang for select to authenticated
using (trang_thai = 'hien' or nguoi_id = public.opc_nguoi_id() or public.opc_la_nhan_vien());

drop policy if exists opc_bai_dang_insert on public.opc_bai_dang;
create policy opc_bai_dang_insert on public.opc_bai_dang for insert to authenticated
with check (nguoi_id = public.opc_nguoi_id());

drop policy if exists opc_bai_dang_update on public.opc_bai_dang;
create policy opc_bai_dang_update on public.opc_bai_dang for update to authenticated
using (nguoi_id = public.opc_nguoi_id() or public.opc_vai_tro() = 'quan_tri')
with check (nguoi_id = public.opc_nguoi_id() or public.opc_vai_tro() = 'quan_tri');

drop policy if exists opc_bai_dang_delete on public.opc_bai_dang;
create policy opc_bai_dang_delete on public.opc_bai_dang for delete to authenticated
using (nguoi_id = public.opc_nguoi_id() or public.opc_vai_tro() = 'quan_tri');

-- opc_binh_luan
drop policy if exists opc_binh_luan_select on public.opc_binh_luan;
create policy opc_binh_luan_select on public.opc_binh_luan for select to authenticated using (true);

drop policy if exists opc_binh_luan_insert on public.opc_binh_luan;
create policy opc_binh_luan_insert on public.opc_binh_luan for insert to authenticated
with check (nguoi_id = public.opc_nguoi_id());

drop policy if exists opc_binh_luan_delete on public.opc_binh_luan;
create policy opc_binh_luan_delete on public.opc_binh_luan for delete to authenticated
using (nguoi_id = public.opc_nguoi_id() or public.opc_vai_tro() = 'quan_tri');

-- opc_kpi_ngay
drop policy if exists opc_kpi_select on public.opc_kpi_ngay;
create policy opc_kpi_select on public.opc_kpi_ngay for select to authenticated
using (public.opc_la_nhan_vien());

drop policy if exists opc_kpi_write on public.opc_kpi_ngay;
create policy opc_kpi_write on public.opc_kpi_ngay for all to authenticated
using (public.opc_vai_tro() = 'quan_tri')
with check (public.opc_vai_tro() = 'quan_tri');

-- opc_nhat_ky
drop policy if exists opc_nhat_ky_select on public.opc_nhat_ky;
create policy opc_nhat_ky_select on public.opc_nhat_ky for select to authenticated
using (public.opc_vai_tro() = 'quan_tri');

drop policy if exists opc_nhat_ky_insert on public.opc_nhat_ky;
create policy opc_nhat_ky_insert on public.opc_nhat_ky for insert to authenticated
with check (public.opc_la_nhan_vien());

-- ── 9. QUYỀN BẢNG ───────────────────────────────────────────────────────────
grant select, insert, update, delete on
  public.opc_nguoi, public.opc_ho_so, public.opc_lead, public.opc_hoat_dong,
  public.opc_ticket, public.opc_goi, public.opc_don_hang, public.opc_bai_dang,
  public.opc_binh_luan, public.opc_kpi_ngay, public.opc_nhat_ky
to authenticated;
grant usage, select on sequence public.opc_nhat_ky_id_seq to authenticated;

-- ── 10. DỮ LIỆU GỐC ────────────────────────────────────────────────────────
insert into public.opc_goi (ma, ten, gia, ky, quyen_loi, thu_tu) values
  ('khoi-tao',   'Khởi tạo',            0,        'mien_phi', '["Chẩn đoán độ chín OPC","Cộng đồng","Workshop hằng tháng"]'::jsonb, 1),
  ('chuan-hoa',  'Chuẩn hóa',           2500000,  'mot_lan',  '["Khóa khởi sự","Chuẩn hóa 1 quy trình","Hồ sơ pháp lý cơ bản"]'::jsonb, 2),
  ('membership', 'Membership',          399000,   'thang',    '["Cộng đồng","Thư viện nội dung","Workshop"]'::jsonb, 3),
  ('pro',        'Đồng hành Pro',       3500000,  'thang',    '["Mentor 1-1","AI Agent vận hành","Kế toán – pháp lý theo nhu cầu"]'::jsonb, 4),
  ('ai-agent',   'AI Agent',            990000,   'thang',    '["Trợ lý AI vận hành","Cấu hình theo ngành","Hỗ trợ 24/7"]'::jsonb, 5),
  ('retreat',    'Retreat Măng Đen',    25000000, 'lan',      '["3–7 ngày workation","Mentor chuyên sâu","Kết nối đối tác"]'::jsonb, 6)
on conflict (ma) do update set
  ten = excluded.ten,
  gia = excluded.gia,
  ky = excluded.ky,
  quyen_loi = excluded.quyen_loi,
  thu_tu = excluded.thu_tu;
