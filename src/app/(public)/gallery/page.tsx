import type { Metadata } from "next";
import { ThuVienAnh } from "@/components/gallery/ThuVienAnh";

export const metadata: Metadata = {
  title: "Thư viện ảnh NOOI",
  description:
    "Thư viện ảnh NOOI — bộ sưu tập hình ảnh về thiền, khí công, retreat, không gian sống và công trình trong hệ sinh thái NOOI. Tìm theo bộ sưu tập, khổ ảnh và tông màu.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Thư viện ảnh NOOI",
    description: "Bộ sưu tập hình ảnh của hệ sinh thái NOOI.",
    locale: "vi_VN",
    type: "website",
    siteName: "NOOI",
  },
};

/**
 * Thư viện ảnh — nay là TRANG NEXT, không còn là trang HTML tĩnh riêng.
 *
 * Vì sao đổi: bản tĩnh tự dựng thanh đầu trang bằng CSS riêng nên mỗi lần bấm vào/ra là
 * trình duyệt tải lại cả trang — menu nháy, giật, không đồng bộ với 5 phân hệ còn lại.
 * Nay dùng chung `Header` trong `(public)/layout`, điều hướng mềm như mọi trang khác.
 * Ảnh và dữ liệu vẫn nằm trong `public/gallery/` (pipeline cào ảnh giữ nguyên).
 */
export default function GalleryPage() {
  return (
    <main className="min-h-[100dvh] bg-background">
      <h1 className="sr-only">Thư viện ảnh NOOI</h1>
      <div className="pt-[70px]">
        <ThuVienAnh />
      </div>
    </main>
  );
}
