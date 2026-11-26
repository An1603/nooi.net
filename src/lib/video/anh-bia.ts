/**
 * Ảnh bìa nhẹ cho lưới và khung xem video.
 *
 * Vì sao cần: ảnh bìa trong kho Supabase là tệp gốc 100–450 KB (đo 26/11/2026: huong-tuyen-cao-toc
 * 441 KB). Lưới có 18 bài ⇒ tải cả chục MB ảnh cho những ô chỉ rộng ~200 px — đây là nguyên nhân
 * chính làm `/video` mở chậm.
 *
 * Cách làm: dùng chính dịch vụ DỊCH ẢNH TẠI CHỖ của Supabase Storage
 * (`/storage/v1/render/image/public/...?width=…&quality=…`) — cùng tệp đó xuống còn ~47 KB (đo thật),
 * biên Cloudflare đã đệm sẵn (`cf-cache-status: HIT`) nên không tốn CPU máy chủ NOOI.
 *
 * An toàn: ảnh KHÔNG nằm trong kho Supabase (miền khác) thì trả về nguyên địa chỉ cũ.
 */
export function anhBia(
  url?: string | null,
  opts: { rong?: number; cao?: number; chat?: number } = {}
): string | null {
  const goc = (url ?? "").trim();
  if (!goc) return null;
  // Chỉ dịch được ảnh nằm trong kho Supabase Storage (đường /storage/v1/object/public/…)
  const m = goc.match(/^(https:\/\/[^/]+)\/storage\/v1\/object\/public\/(.+)$/);
  if (!m) return goc;
  const [, mien, duong] = m;
  const { rong = 400, cao, chat = 70 } = opts;
  const thamSo = new URLSearchParams({ width: String(rong), quality: String(chat) });
  if (cao) {
    thamSo.set("height", String(cao));
    thamSo.set("resize", "cover");
  }
  return `${mien}/storage/v1/render/image/public/${duong}?${thamSo.toString()}`;
}

/** Bộ địa chỉ ảnh bìa 2 mức cho `srcset` — máy thường và máy màn hình nét (retina).
 *  KHÔNG cắt ảnh (không truyền chiều cao) để giữ nguyên khung hình gốc như trước. */
export function anhBiaSrcSet(url?: string | null): string | null {
  const nho = anhBia(url, { rong: 300 });
  const lon = anhBia(url, { rong: 600 });
  if (!nho || !lon || nho === lon) return null;
  return `${nho} 300w, ${lon} 600w`;
}
