import { type MetadataRoute } from "next";
import { PHAN_HE } from "@/lib/phan-he";
import { BAI_VIET } from "@/lib/tri-thuc/bai-viet";

/**
 * Sitemap — sinh từ ĐÚNG các nguồn đang dùng cho menu.
 *
 * Vì sao không viết tay danh sách đường dẫn ở đây: thêm một phân hệ mà quên sitemap là
 * chuyện chắc chắn sẽ xảy ra. Lấy từ `PHAN_HE` và `BAI_VIET` thì không thể lệch.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://nooi.net";
  const now = new Date();

  const phanHe: MetadataRoute.Sitemap = PHAN_HE.filter((p) => p.href.startsWith("/")).map((p) => ({
    url: `${baseUrl}${p.href}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const baiViet: MetadataRoute.Sitemap = BAI_VIET.map((b) => ({
    url: `${baseUrl}/kho-tri-thuc/${b.slug}`,
    lastModified: new Date(b.capNhat),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...phanHe,
    ...baiViet,
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
