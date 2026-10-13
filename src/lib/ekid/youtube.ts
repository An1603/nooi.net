// youtube.ts — Nhận diện link YouTube + lấy mã video (HÀM THUẦN, không phụ thuộc Node).
//
// Tách riêng khỏi `media-validate.ts` vì file đó có `import("node:dns")` (kiểm SSRF):
// component CLIENT import thẳng file đó sẽ làm webpack lôi `node:dns` vào bundle trình
// duyệt → "UnhandledSchemeError". Mọi thứ client cần phải nằm ở file này.

/** Tham số nhúng: TỰ PHÁT + gọn gàng cho màn hình trẻ em. */
const YT_EMBED_PARAMS = "autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3";

/**
 * URL nhúng video YouTube (`youtube-nocookie.com`) — **tự phát**, không gợi ý video lạ.
 * Lưu ý: trình duyệt có thể chặn tự phát nếu trang chưa có thao tác của người dùng;
 * khi đó bé chỉ cần bấm nút phát.
 */
export function youtubeEmbedSrc(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?${YT_EMBED_PARAMS}`;
}

/** Nhận diện link YouTube (watch / youtu.be / embed / shorts / music / nocookie). */
export function isYouTubeUrl(raw: string): boolean {
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
    return (
      host === "youtu.be" ||
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    );
  } catch {
    return false;
  }
}

// Mã video YouTube: 11 ký tự [A-Za-z0-9_-] (nới 6–20 cho link rút gọn/thử nghiệm).
const YT_VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;

/**
 * Lấy MÃ VIDEO từ link YouTube (watch / youtu.be / shorts / embed / live).
 * Trả null nếu không phải link video hợp lệ — nhờ vậy KHÔNG hiện khung rỗng.
 */
export function youtubeVideoId(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (!isYouTubeUrl(raw)) return null;
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

  const pick = (value: string | null | undefined): string | null =>
    value && YT_VIDEO_ID.test(value) ? value : null;

  if (host === "youtu.be") return pick(parsed.pathname.slice(1).split("/")[0]);

  const fromQuery = pick(parsed.searchParams.get("v"));
  if (fromQuery) return fromQuery;

  const m = parsed.pathname.match(/^\/(?:embed|shorts|v|live)\/([^/?#]+)/);
  return m ? pick(m[1]) : null;
}
