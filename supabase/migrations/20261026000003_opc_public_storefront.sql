-- ============================================================================
-- OPC PUBLIC STOREFRONT — sản phẩm mở rộng + liên kết đơn hàng với lead
-- Ngày: 26/10/2026
-- Mục tiêu:
--   1. Cho phép đơn hàng công khai gắn với lead (truy vết CRM).
--   2. Bổ sung 4 sản phẩm mở rộng vào opc_goi (không ghi đè gói đã có).
-- ============================================================================

-- 1. Đơn hàng có thể gắn lead — đặt mua công khai không cần tài khoản.
alter table public.opc_don_hang
  add column if not exists lead_id uuid references public.opc_lead(id) on delete set null;

create index if not exists opc_don_hang_lead_id_idx
  on public.opc_don_hang(lead_id);

-- 2. Bốn sản phẩm mở rộng (giá đề xuất; chỉ thêm nếu chưa tồn tại).
insert into public.opc_goi (ma, ten, gia, ky, quyen_loi, thu_tu, active)
values
  (
    'launch',
    'OPC Launch',
    9800000,
    'mot_lan',
    '["8 mốc trong 30 ngày","Pháp lý – thuế – ngân hàng – hóa đơn","Website/landing + 3 quy trình AI","Success manager đồng hành"]'::jsonb,
    7,
    true
  ),
  (
    'residency',
    'OPC Residency',
    7000000,
    'thang',
    '["Phòng riêng + desk","Internet + điện nước","Mastermind 1 buổi/tuần","Wellness 1 buổi/tuần","Ưu đãi gói Pro"]'::jsonb,
    8,
    true
  ),
  (
    'partner',
    'OPC Partner',
    30000000,
    'nam',
    '["Cohort co-branded 6 tuần","Chẩn đoán hội viên","Dashboard tiến độ","Báo cáo quý","Quản lý riêng"]'::jsonb,
    9,
    true
  ),
  (
    'certified',
    'OPC Certified',
    1500000,
    'mot_lan',
    '["Đánh giá năng lực 2 giờ","Portfolio + phỏng vấn","Badge OPC Certified","Gia hạn hằng năm"]'::jsonb,
    10,
    true
  )
on conflict (ma) do nothing;
