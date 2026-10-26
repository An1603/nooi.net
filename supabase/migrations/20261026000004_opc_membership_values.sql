-- ============================================================================
-- OPC MEMBERSHIP — bổ sung quyền lợi cộng đồng & mạng lưới
-- Ngày: 26/10/2026
-- Mục tiêu: thay 3 quyền lợi mô tả chung bằng 7 quyền lợi phản ánh đúng
--           giá trị cộng đồng đã công bố trên opc.nooi.net.
-- Lưu ý: đây là quyền lợi hiển thị/bán; không thay đổi giá hoặc kỳ hạn.
-- ============================================================================

update public.opc_goi
set quyen_loi = '[
  "Cộng đồng doanh nhân OPC",
  "Workshop + office hours",
  "Kết nối đối tác & nguồn lực",
  "Sự kiện chuyên gia, khách mời",
  "Ưu đãi pháp lý – kế toán, AI, không gian",
  "Cơ hội giới thiệu khách hàng & case study",
  "Thư viện mẫu & tài liệu"
]'::jsonb
where ma = 'membership';
