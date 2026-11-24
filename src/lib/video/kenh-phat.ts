/**
 * Định tuyến kênh phát cho kho video NOOI.
 *
 * Quy ước: video nào cần NGƯỜI LẠ TÌM THẤY -> YouTube (miễn phí băng thông, có tìm kiếm,
 * chia sẻ tốt trên Zalo/Facebook). Video nào cần NGƯỜI CỦA MÌNH XEM ĐÚNG QUYỀN -> Bunny Stream
 * (khoá quyền, tặng theo cấp độ, đo lường đầy đủ, giữ đúng thiết kế, không quảng cáo).
 *
 * Dùng CHUNG một bảng `videos`: thêm video = thêm một bản ghi, không phải biết nó nằm ở đâu.
 *
 * Hai trục phân loại, đừng trộn:
 *   kenh_phat  = video phát từ ĐÂU   (youtube | bunny | truc-tiep)
 *   khung_hinh = video có DẠNG gì   (ngang 16:9 | doc 9:16 — dọc thì vào luồng vuốt)
 */

export type KenhPhat = "youtube" | "bunny" | "truc-tiep";

export const KENH_PHAT_LABELS: Record<KenhPhat, string> = {
  youtube: "YouTube",
  bunny: "Bunny Stream",
  "truc-tiep": "Tệp trực tiếp",
};

export function laKenhPhat(v: unknown): v is KenhPhat {
  return v === "youtube" || v === "bunny" || v === "truc-tiep";
}

export type KhungHinh = "ngang" | "doc";

export const KHUNG_HINH_LABELS: Record<KhungHinh, string> = {
  ngang: "Ngang 16:9",
  doc: "Dọc 9:16",
};

export function laKhungHinh(v: unknown): v is KhungHinh {
  return v === "ngang" || v === "doc";
}

/** Phần tối thiểu để định tuyến cửa phát (trang xem một bài chỉ cần chỗ này). */
export interface VideoDePhat {
  title?: string | null;
  url?: string | null;
  kenh_phat?: string | null;
}

/** Bản ghi video tối thiểu cho luồng vuốt. */
export interface VideoDoc extends VideoDePhat {
  id: string;
  title: string;
  description?: string | null;
  khung_hinh?: string | null;
  duration?: number | null;
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
 *   https://player.mediadelivery.net/embed/<libraryId>/<videoId>   (dạng tài liệu Bunny khuyến nghị)
 *   https://iframe.mediadelivery.net/embed|play/<libraryId>/<videoId>
 *   https://video.bunnycdn.com/play/<libraryId>/<videoId>
 *   cặp gọn: <libraryId>/<videoId>
 */
export function layBunnyId(url?: string | null): { libraryId: string; videoId: string } | null {
  if (!url) return null;
  const goc = url.trim();
  const m =
    goc.match(/(?:player|iframe)\.mediadelivery\.net\/(?:embed|play)\/(\d+)\/([0-9a-fA-F-]{36})/) ??
    goc.match(/video\.bunnycdn\.com\/play\/(\d+)\/([0-9a-fA-F-]{36})/) ??
    goc.match(/^(\d{3,})\/([0-9a-fA-F-]{36})$/);
  return m ? { libraryId: m[1], videoId: m[2] } : null;
}

/** Link trỏ thẳng tới một tệp video (không qua trình phát của nền tảng nào). */
export function layVideoTrucTiep(url?: string | null): { loai: "mp4" | "hls"; src: string } | null {
  const goc = (url ?? "").trim();
  if (!goc) return null;
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(goc)) return { loai: "mp4", src: goc };
  // Safari phát HLS gốc; Chrome/Android cần hls.js -> vẫn trả về nhưng kèm cảnh báo
  if (/\.m3u8(\?|$)/i.test(goc)) return { loai: "hls", src: goc };
  return null;
}

export const DUONG_DAN_NHUNG = {
  /**
   * `rel=0` từ 2018 chỉ giới hạn video gợi ý trong CÙNG kênh (không tắt được);
   * `modestbranding` đã bị Google bỏ từ 2023 nên không truyền. Dùng youtube-nocookie
   * để hạn chế cookie theo dõi của Google trên nooi.net.
   */
  youtube: (id: string) =>
    `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1&cc_lang_pref=vi`,

  /** Dạng dọc cho luồng vuốt: tự phát, tắt tiếng, lặp lại, giấu bớt chrome của YouTube. */
  youtubeDoc: (id: string) =>
    `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&playsinline=1&cc_lang_pref=vi`,

  /**
   * Tham số truy vấn theo tài liệu Bunny: autoplay, muted, loop, preload (mặc định autoplay=true,
   * muted=false). Trình phát nằm ở player.mediadelivery.net — giao diện (màu, logo, thanh điều khiển)
   * đặt trong Player settings của thư viện.
   */
  bunny: (libraryId: string, videoId: string) =>
    `https://player.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`,

  /** Dạng dọc cho luồng vuốt: tự phát + tắt tiếng (trình duyệt chặn tự phát có tiếng) + lặp lại. */
  bunnyDoc: (libraryId: string, videoId: string) =>
    `https://player.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true&loop=true&muted=true&preload=true&responsive=true`,
};

export type NguonPhat =
  | { kieu: "youtube"; src: string }
  | { kieu: "bunny"; src: string }
  | { kieu: "truc-tiep"; src: string; loai: "mp4" | "hls" }
  | { kieu: "khong"; lyDo: string };

/** Suy ra nguồn phát thực tế từ một bản ghi `videos` (dùng cho trang xem một bài). */
export function nguonPhat(video: VideoDePhat): NguonPhat {
  const url = (video.url ?? "").trim();
  if (!url) return { kieu: "khong", lyDo: "Chưa có đường dẫn video" };

  const thu = (kenh: KenhPhat): NguonPhat | null => {
    if (kenh === "youtube") {
      const id = layYoutubeId(url);
      return id ? { kieu: "youtube", src: DUONG_DAN_NHUNG.youtube(id) } : null;
    }
    if (kenh === "bunny") {
      const b = layBunnyId(url);
      return b ? { kieu: "bunny", src: DUONG_DAN_NHUNG.bunny(b.libraryId, b.videoId) } : null;
    }
    const t = layVideoTrucTiep(url);
    return t ? { kieu: "truc-tiep", src: t.src, loai: t.loai } : null;
  };

  // Ưu tiên đúng kênh đã khai báo, rồi mới đoán theo link (dữ liệu cũ chưa khai báo)
  if (laKenhPhat(video.kenh_phat)) {
    const dungKenh = thu(video.kenh_phat);
    if (dungKenh) return dungKenh;
  }
  const doan = thu("youtube") ?? thu("bunny") ?? thu("truc-tiep");
  if (doan) return doan;

  return {
    kieu: "khong",
    lyDo: "Link không khớp YouTube, Bunny Stream hay tệp video trực tiếp",
  };
}

export interface NguonDoc {
  /** iframe = trình phát của nền tảng; video = thẻ <video> của mình (điều khiển được 100%) */
  kieu: "iframe" | "video" | "khong";
  src: string;
  /** Có điều khiển được phát/dừng bằng mã của mình không? YouTube qua iframe: KHÔNG. */
  dieuKhien: boolean;
  canhBao?: string;
  lyDo?: string;
}

/**
 * Nguồn phát cho LUỒNG VUỐT DỌC (/app/short).
 *
 * Vì sao phải tách khỏi `nguonPhat`: trong luồng vuốt, người dùng đặt ngón tay lên đúng vùng video
 * để vuốt. Thao tác chạm trong iframe KHÔNG truyền ra trang cha, nên mọi item dùng iframe đều bị
 * chặn vuốt. Trình phát Bunny điều khiển được qua player.js (play/pause/mute/seek) nên lớp phủ
 * trên iframe vẫn dùng được; YouTube thì không điều khiển được -> đánh dấu để giao diện báo.
 */
export function nguonPhatDoc(video: VideoDoc): NguonDoc {
  const kenh: KenhPhat = laKenhPhat(video.kenh_phat) ? video.kenh_phat : "youtube";

  if (kenh === "bunny") {
    const b = layBunnyId(video.url);
    if (b) {
      return {
        kieu: "iframe",
        src: DUONG_DAN_NHUNG.bunnyDoc(b.libraryId, b.videoId),
        dieuKhien: true,
      };
    }
  }

  if (kenh === "youtube") {
    const id = layYoutubeId(video.url);
    if (id) {
      return {
        kieu: "iframe",
        src: DUONG_DAN_NHUNG.youtubeDoc(id),
        dieuKhien: false,
        canhBao: "Video YouTube: chạm không tạm dừng được, dùng nút của YouTube",
      };
    }
  }

  const t = layVideoTrucTiep(video.url);
  if (t) {
    return {
      kieu: "video",
      src: t.src,
      dieuKhien: true,
      canhBao:
        t.loai === "hls"
          ? "Link HLS (.m3u8): Safari phát được, Chrome/Android cần thư viện HLS — nên dùng Bunny hoặc tệp mp4"
          : undefined,
    };
  }

  // Kênh khai báo sai chỗ (ví dụ chọn Bunny nhưng dán link YouTube) -> thử đoán lại
  const doan = nguonPhat({ ...video, kenh_phat: undefined });
  if (doan.kieu === "youtube") return { kieu: "iframe", src: doan.src, dieuKhien: false };
  if (doan.kieu === "bunny") return { kieu: "iframe", src: doan.src, dieuKhien: true };

  return { kieu: "khong", src: "", dieuKhien: false, lyDo: doan.kieu === "khong" ? doan.lyDo : "Chưa có nguồn phát" };
}
