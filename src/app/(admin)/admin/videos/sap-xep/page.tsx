import { permanentRedirect } from "next/navigation";

/**
 * Trang sắp xếp riêng đã BỎ (Ngài An 27/11/2026: “tích hợp việc sắp xếp, kéo ngay tại /admin/videos
 * cho đơn giản”). Giữ đường dẫn cũ để link/bookmark không gãy, chuyển thẳng về danh sách và giữ
 * nguyên bộ lọc danh mục đang chọn.
 */
export default async function SapXepCu({
  searchParams,
}: {
  searchParams: Promise<{ dm?: string }>;
}) {
  const { dm = "" } = await searchParams;
  permanentRedirect(`/admin/videos${dm ? `?dm=${dm}` : ""}`);
}
