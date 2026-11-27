import { permanentRedirect } from "next/navigation";

/**
 * ĐÃ GỘP vào `/app/videos` — Ngài An chốt 27/11/2026.
 *
 * Trang danh mục riêng chỉ lặp lại việc mở luồng xem theo một danh mục, trong khi `/app/videos`
 * đã có thanh chip danh mục kèm số lượng (dùng chung với kho công khai `/video`). Giữ đường dẫn
 * cũ để liên kết đã chia sẻ / dấu trang không gãy: chuyển thẳng về kho video, người dùng tự chọn
 * danh mục trên thanh chip.
 */
export default function DanhMucDaGop() {
  permanentRedirect("/app/videos");
}
