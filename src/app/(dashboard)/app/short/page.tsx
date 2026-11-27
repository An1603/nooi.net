import { permanentRedirect } from "next/navigation";

/**
 * ĐÃ GỘP vào `/app/videos?kh=doc` — Ngài An chốt 27/11/2026.
 *
 * "Vuốt dọc" không phải một kho riêng: nó chỉ là **bộ lọc khổ hình dọc** trên kho video. Bộ lọc
 * này đã có sẵn trong `LuoiVideoCongKhai` (tham số `kh`, dùng chung với trang công khai `/video`),
 * nên giữ thêm một trang chỉ để lặp lại đúng danh sách đó là thừa.
 */
export default function ShortDaGop() {
  permanentRedirect("/app/videos?kh=doc");
}
