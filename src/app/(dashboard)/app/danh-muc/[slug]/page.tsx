import { permanentRedirect } from "next/navigation";

/**
 * ĐÃ GỘP vào `/app/videos?dm=<mã danh mục>` — Ngài An chốt 27/11/2026.
 *
 * Luồng xem theo danh mục giờ là bộ lọc danh mục trên kho video (cùng thành phần với `/video`),
 * không còn là trang riêng. Đường dẫn cũ vẫn dẫn tới đúng danh sách đó.
 */
export default async function DanhMucXemDaGop({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/app/videos?dm=${encodeURIComponent(slug)}`);
}
