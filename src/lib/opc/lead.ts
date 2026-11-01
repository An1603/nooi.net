/**
 * Quyết định xử lý khi form CÔNG KHAI gửi thông tin liên hệ trùng một lead đã có.
 *
 * Vì sao cần (audit 01/11/2026, mục 3): `luuLead` cũ tìm lead theo email/số điện
 * thoại rồi **cập nhật** dòng đó bằng service-role. Kẻ tấn công chỉ cần biết email
 * của khách là nâng được `diem`/`trang_thai` của hồ sơ người khác và nhét ghi chú
 * vào CRM — không cần đăng nhập.
 *
 * Luật nay:
 *  - chưa có lead trùng  → tạo mới
 *  - có lead trùng + người gửi CÓ phiên đăng nhập → được cập nhật
 *  - có lead trùng + người gửi ẩn danh → CHỈ ghi nhật ký hoạt động, không đổi
 *    điểm/trạng thái/ghi chú của hồ sơ
 */
export type HanhDongLead = "tao-moi" | "cap-nhat" | "chi-ghi-nhat-ky";

export function quyetDinhLead(coLeadTrung: boolean, nguoiGuiCoPhien: boolean): HanhDongLead {
  if (!coLeadTrung) return "tao-moi";
  return nguoiGuiCoPhien ? "cap-nhat" : "chi-ghi-nhat-ky";
}

/** Nội dung dòng nhật ký khi form ẩn danh gửi lại thông tin của lead đã có. */
export function noiDungNhatKyTrung(ghiChu: string, kenh: string): string {
  const them = ghiChu ? ` — ${ghiChu}` : "";
  return `Form công khai gửi lại thông tin liên hệ (kênh: ${kenh})${them}`.slice(0, 2000);
}
