import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import fs from "node:fs/promises";
import path from "node:path";
import { ThuVienAnh, type BanDau } from "@/components/gallery/ThuVienAnh";

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
 * Lô ảnh ĐẦU TIÊN vẽ sẵn ở máy chủ.
 *
 * Vì sao: trước đây trang trả về khung rỗng, rồi trình duyệt mới tải 350 KB JSON và dựng
 * 1.738 thẻ — khách thấy dòng “Đang tải thư viện…” vài giây. Nay 60 ảnh đầu nằm ngay trong
 * HTML: trình duyệt thấy thẻ <img> là tải luôn, không chờ JavaScript.
 *
 * Đệm 60 giây: đọc + phân tích 350 KB mỗi lượt truy cập là việc thừa — dữ liệu chỉ đổi khi
 * chạy lại pipeline cào ảnh.
 */
const SO_ANH_DAU = 60;

const layLoDau = unstable_cache(
  async (): Promise<BanDau> => {
    try {
      const tep = path.join(process.cwd(), "public/gallery/data/gallery.json");
      const raw = await fs.readFile(tep, "utf8");
      const d = JSON.parse(raw) as BanDau;
      return {
        total: d.total ?? d.items.length,
        scrapedAt: d.scrapedAt ?? null,
        boards: d.boards ?? [],
        items: (d.items ?? []).slice(0, SO_ANH_DAU),
      };
    } catch {
      // Thiếu tệp dữ liệu thì trả rỗng — phía trình duyệt sẽ tự thử nạp lại.
      return { total: 0, scrapedAt: null, boards: [], items: [] };
    }
  },
  ["gallery-lo-dau"],
  { revalidate: 60, tags: ["gallery"] }
);

/**
 * Thư viện ảnh — nay là TRANG NEXT, không còn là trang HTML tĩnh riêng.
 *
 * Vì sao đổi: bản tĩnh tự dựng thanh đầu trang bằng CSS riêng nên mỗi lần bấm vào/ra là
 * trình duyệt tải lại cả trang — menu nháy, giật, không đồng bộ với 5 phân hệ còn lại.
 * Nay dùng chung `Header` trong `(public)/layout`, điều hướng mềm như mọi trang khác.
 * Ảnh và dữ liệu vẫn nằm trong `public/gallery/` (pipeline cào ảnh giữ nguyên).
 */
export default async function GalleryPage() {
  const banDau = await layLoDau();

  return (
    <main className="min-h-[100dvh] bg-background">
      <h1 className="sr-only">Thư viện ảnh NOOI</h1>
      <div className="pt-[70px]">
        <ThuVienAnh banDau={banDau} />
      </div>
    </main>
  );
}
