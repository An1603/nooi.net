/**
 * Định tuyến kênh phát cho kho video NOOI.
 *
 * Quy ước: video nào cần NGƯỜI LẠ TÌM THẤY -> YouTube (miễn phí băng thông, có tìm kiếm,
 * chia sẻ tốt trên Zalo/Facebook). Video nào cần NGƯỜI CỦA MÌNH XEM ĐÚNG QUYỀN -> Bunny Stream
 * (khoá quyền, tặng theo cấp độ, đo lường đầy đủ, giữ đúng thiết kế, không quảng cáo).
 *
 * Dùng CHUNG một bảng `videos`: thêm video = thêm một bản ghi, không phải biết nó nằm ở đâu.
 */

export type KenhPhat = "youtube" | "bunny";

export const KENH_PHAT_LABELS: Record<KenhPhat, string> = {
  youtube: "YouTube",
  bunny: "Bunny Stream",
};

export function laKenhPhat(v: unknown): v is KenhPhat {
  return v === "youtube" || v === "bunny";
}

/** Lấy mã video YouTube từ mọi dạng link (watch, embed, shorts, live, youtu.be). */
export function layYoutubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

/**
 * Lấy mã thư viện + mã video Bunny Stream. Nhận:
 *   https://iframe.mediadelivery.net/embed/<libraryId>/<videoId>
 *   https://iframe.mediadelivery.net/play/<libraryId>/<videoId>
 *   https://video.bunnycdn.com/play/<libraryId>/<videoId>
 *   cặp gọn: <libraryId>/<videoId>
 */
export function layBunnyId(url?: string | null): { libraryId: string; videoId: string } | null {
  if (!url) return null;
  const goc = url.trim();
  const m =
    goc.match(/iframe\.mediadelivery\.net\/(?:embed|play)\/(\d+)\/([0-9a-fA-F-]{36})/) ??
    goc.match(/video\.bunnycdn\.com\/play\/(\d+)\/([0-9a-fA-F-]{36})/) ??
    goc.match(/^(\d{3,})\/([0-9a-fA-F-]{36})$/);
  return m ? { libraryId: m[1], videoId: m[2] } : null;
}

export const DUONG_DAN_NHUNG = {
  /**
   * `rel=0` từ 2018 chỉ giới hạn video gợi ý trong CÙNG kênh (không tắt được);
   * `modestbranding` đã bị Google bỏ từ 2023 nên không truyền. Dùng youtube-nocookie
   * để hạn chế cookie theo dõi của Google trên nooi.net.
   */
  youtube: (id: string) =>
    `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1&cc_lang_pref=vi`,
  bunny: (libraryId: string, videoId: string) =>
    `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`,
};

export type NguonPhat =
  | { kieu: "youtube"; src: string }
  | { kieu: "bunny"; src: string }
  | { kieu: "truc-tiep"; src: string }
  | { kieu: "khong"; lyDo: string };

/** Suy ra nguồn phát thực tế từ một bản ghi `videos`. */
export function nguonPhat(video: {
  url?: string | null;
  kenh_phat?: string | null;
  title?: string | null;
}): NguonPhat {
  const url = (video.url ?? "").trim();
  if (!url) return { kieu: "khong", lyDo: "Chưa có đường dẫn video" };

  const thu = (kenh: KenhPhat): NguonPhat | null => {
    if (kenh === "youtube") {
      const id = layYoutubeId(url);
      return id ? { kieu: "youtube", src: DUONG_DAN_NHUNG.youtube(id) } : null;
    }
    const b = layBunnyId(url);
    return b ? { kieu: "bunny", src: DUONG_DAN_NHUNG.bunny(b.libraryId, b.videoId) } : null;
  };

  // Ưu tiên đúng kênh đã khai báo, rồi mới đoán theo link (dữ liệu cũ chưa khai báo)
  if (laKenhPhat(video.kenh_phat)) {
    const dungKenh = thu(video.kenh_phat);
    if (dungKenh) return dungKenh;
  }
  const doan = thu("youtube") ?? thu("bunny");
  if (doan) return doan;

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { kieu: "truc-tiep", src: url };
  if (/\.m3u8(\?|$)/i.test(url)) {
    return {
      kieu: "khong",
      lyDo: "Link HLS (.m3u8) cần trình phát riêng — dùng link nhúng Bunny Stream thay thế",
    };
  }
  return {
    kieu: "khong",
    lyDo: "Link không khớp YouTube, Bunny Stream hay tệp video trực tiếp",
  };
}
