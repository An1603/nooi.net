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
  // Chỉ nêu TỈ LỆ, không nêu chữ “dọc”/“ngang” (yêu cầu 26/11/2026: bỏ chữ đó khỏi giao diện)
  ngang: "16:9",
  doc: "9:16",
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
  /** Danh mục (mã slug) — dùng để biết video có thuộc khối bài học hay không (nút “Mở bài”). */
  danh_muc?: string | null;
  duration?: number | null;
  /** Ảnh bìa — hiện ngay khi video còn đang tải (đỡ khung đen, "bấm là có hình"). */
  thumbnail_url?: string | null;
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
    `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1&cc_lang_pref=vi&enablejsapi=1`,

  /**
   * Video NGANG nhúng trong luồng xem: KHÔNG tắt tiếng, KHÔNG lặp, **KHÔNG thanh điều khiển của YouTube**,
   * và **KHÔNG `autoplay`**.
   *
   * Vì sao `controls=0`: Ngài An báo 27/11/2026 thấy **hai thanh tiến trình** chồng nhau (thanh của
   * YouTube nằm trong iframe + thanh tua của NOOI). Luồng xem tự dựng thanh tua (bấm/kéo được, phím
   * ← →) và nút loa/phát riêng nên thanh của YouTube là thừa — tắt đi để mọi nguồn (Bunny, YouTube,
   * tệp trực tiếp) có **đúng một** thanh và một bộ điều khiển giống nhau.
   *
   * Vì sao BỎ `autoplay` KHÔNG kèm `mute` (Ngài An báo 27/11/2026: *“đang xem video này lại nghe
   * thấy tiếng của video bên cạnh”*): luồng xem dựng sẵn khung liền trước + liền sau cho mượt, nên
   * mỗi iframe mang `autoplay=1` đều TỰ PHÁT **có tiếng** — kể cả khung bên cạnh; lệnh tạm dừng gửi
   * lúc iframe chưa sẵn sàng thì bị bỏ im lặng, nên khung lạ cứ thế phát.
   *
   * Nay `autoplay=1&mute=1`: tự phát LUÔN được (trình duyệt chỉ chặn tự phát CÓ tiếng) nhưng **câm**;
   * khung đang xem được mở tiếng bằng lệnh `unMute` khi trình phát báo sẵn sàng (xem
   * `src/lib/video/youtube.ts` — `tiengMong`). Khung bên cạnh bị tắt tiếng + tạm dừng ngay khi báo
   * “đang phát” (`VideoFeedDoc` → `gacTieng`), nên không bao giờ nghe lẫn.
   */
  youtubeNgang: (id: string) =>
    `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1&cc_lang_pref=vi&enablejsapi=1&autoplay=1&mute=1&controls=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&showinfo=0`,

  /**
   * Cùng video nhưng dùng **trình phát ĐẦY ĐỦ của YouTube** (`controls=1`) — chế độ người xem tự
   * chọn khi cần menu chất lượng / phụ đề / tốc độ của chính YouTube.
   *
   * Vì sao phải có chế độ riêng: Google bỏ khả năng chọn chất lượng qua API từ 24/10/2019
   * (`setPlaybackQuality` là no-op). Muốn CÓ menu chất lượng thì bắt buộc dùng thanh điều khiển của
   * YouTube — và khi đó thanh tua của NOOI phải ẩn đi, nếu không lại thành hai thanh.
   * `start` giữ đúng chỗ đang xem khi chuyển qua lại.
   */
  youtubeDayDu: (id: string, giay = 0) =>
    `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1&cc_lang_pref=vi&enablejsapi=1&autoplay=1&controls=1&modestbranding=1&iv_load_policy=3&start=${Math.max(0, Math.floor(giay))}`,

  /** Dạng dọc cho luồng vuốt: tự phát, tắt tiếng, lặp lại, giấu bớt chrome của YouTube. */
  youtubeDoc: (id: string) =>
    `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&playsinline=1&cc_lang_pref=vi&enablejsapi=1`,

  /**
   * Trình phát nhúng của Bunny. GIỮ LẠI chỉ để làm đường lui "Mở bằng trình phát Bunny" —
   * đường phát chính là tệp CDN (xem `layBunnyMp4`), vì nhiều mạng chặn hẳn miền
   * `player.mediadelivery.net` và trình duyệt báo "refused to connect".
   */
  bunny: (libraryId: string, videoId: string) =>
    `https://player.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`,

  /** Dạng dọc cho luồng vuốt: tự phát + tắt tiếng (trình duyệt chặn tự phát có tiếng) + lặp lại. */
  bunnyDoc: (libraryId: string, videoId: string) =>
    `https://player.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true&loop=true&muted=true&preload=true&responsive=true`,
};

/**
 * Miền CDN của thư viện Bunny Stream — phát TỆP TRỰC TIẾP, không qua trình phát nhúng.
 *
 * Vì sao: ngày 25/11/2026 máy của Ngài An báo `player.mediadelivery.net refused to connect`
 * (mạng/DNS chặn hẳn miền trình phát) trong khi máy chủ Bunny KHÔNG hề chặn nhúng. Tệp CDN nằm ở
 * miền khác (`*.b-cdn.net`) nên đi được; đồng thời thẻ `<video>` của mình cho điều khiển 100%.
 *
 * Cách tìm miền này cho một thư viện khác: mở `https://player.mediadelivery.net/embed/<thư-viện>/<guid>`
 * rồi tìm chuỗi `playlist.m3u8` trong mã trang — miền đứng ngay trước là miền CDN (pull zone).
 * LƯU Ý: CDN chặn yêu cầu KHÔNG có Referer (mặc định của thư viện) — chỉ phát từ trang của mình.
 */
export const BUNNY_CDN = "vz-42e2ef37-7c7.b-cdn.net";

/** Các mức chất lượng Bunny xuất kèm dạng tệp rời (`play_<mức>.mp4`) — dùng làm nguồn dự phòng. */
export const BUNNY_MP4_MUC = ["720p", "480p", "360p"] as const;

/** Link tệp MP4 trực tiếp trên CDN của Bunny. */
export function layBunnyMp4(videoId: string, muc: string = "720p"): string {
  return `https://${BUNNY_CDN}/${videoId}/play_${muc}.mp4`;
}

/** Danh sách nguồn dự phòng (hạ dần chất lượng) khi mức cao không có. */
export function layBunnyMp4DuPhong(videoId: string): string[] {
  return BUNNY_MP4_MUC.map((m) => layBunnyMp4(videoId, m));
}

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
      // Phát TỆP CDN chứ không nhúng trình phát: mạng hay chặn player.mediadelivery.net
      return b ? { kieu: "truc-tiep", src: layBunnyMp4(b.videoId), loai: "mp4" } : null;
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
  /**
   * Mã video YouTube — có mã này thì luồng xem gắn bộ điều khiển qua `postMessage`
   * (`src/lib/video/youtube.ts`): phát/dừng, tua bằng phím ← →, mở tiếng.
   */
  youtubeId?: string;
  /**
   * Mã video Bunny — cần để ĐỔI MỨC CHẤT LƯỢNG ngay trong luồng xem (`play_<mức>.mp4`).
   * Không phải thông tin bí mật: mã này vốn nằm sẵn trong địa chỉ tệp CDN mà trình duyệt đang phát.
   */
  bunnyId?: string;
  /** Nguồn dự phòng, thử lần lượt khi nguồn chính không tải được (mức chất lượng thấp hơn). */
  srcDuPhong?: string[];
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
      // Thẻ <video> của mình phát tệp CDN: điều khiển 100% (phát/dừng/tắt tiếng) và KHÔNG phụ
      // thuộc miền trình phát nhúng (mạng chặn miền đó -> "refused to connect").
      return {
        kieu: "video",
        src: layBunnyMp4(b.videoId),
        srcDuPhong: layBunnyMp4DuPhong(b.videoId),
        bunnyId: b.videoId,
        dieuKhien: true,
      };
    }
  }

  if (kenh === "youtube") {
    const id = layYoutubeId(video.url);
    if (id) {
      // Khổ DỌC: giữ kiểu TikTok (tự phát, tắt tiếng, lặp) cho thao tác vuốt.
      // Khổ NGANG: KHÔNG tắt tiếng, KHÔNG lặp — video dài, mở ra là để nghe.
      const doc = video.khung_hinh === "doc";
      return {
        kieu: "iframe",
        src: doc ? DUONG_DAN_NHUNG.youtubeDoc(id) : DUONG_DAN_NHUNG.youtubeNgang(id),
        youtubeId: id,
        // Điều khiển được qua postMessage, nhưng chỉ khi YouTube trả lời handshake —
        // luồng xem bật nút tua/tiếng khi nhận được tín hiệu đầu tiên (xem `youtube.ts`).
        dieuKhien: false,
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
  if (doan.kieu === "bunny") {
    const b = layBunnyId(video.url);
    if (b) return { kieu: "video", src: layBunnyMp4(b.videoId), srcDuPhong: layBunnyMp4DuPhong(b.videoId), bunnyId: b.videoId, dieuKhien: true };
  }

  return { kieu: "khong", src: "", dieuKhien: false, lyDo: doan.kieu === "khong" ? doan.lyDo : "Chưa có nguồn phát" };
}
