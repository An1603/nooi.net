-- ============================================================================
-- OPC Center — view công khai tối thiểu để cộng đồng hiển thị tên tác giả
-- Không lộ email / số điện thoại. Chỉ thành viên đã đăng nhập mới đọc được.
-- ============================================================================

create or replace view public.opc_nguoi_cong_khai as
select id, ten, vai_tro
from public.opc_nguoi;

comment on view public.opc_nguoi_cong_khai is
  'Tên và vai trò tối thiểu cho cộng đồng OPC — không chứa dữ liệu liên hệ.';

grant select on public.opc_nguoi_cong_khai to authenticated;
