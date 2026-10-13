// media-find.ts — TÌM nội dung thật thay vì để AI tự bịa link (eKid v3.4).
//
// Vấn đề đo được: model Live tự đưa link (nhiều khi là chữ thường, hoặc link TRANG WEB
// chứ không phải link ảnh) → luôn hiện "Không tìm thấy nội dung phù hợp".
// Giải pháp: AI chỉ đưa TỪ KHOÁ; hệ thống TÌM nội dung thật rồi mới hiện:
//   - Ảnh  → Wikimedia Commons (không cần key, link ảnh trực tiếp, không chặn hotlink).
//   - Video → YouTube search qua `yt-dlp` (không cần key) rồi kiểm nhúng bằng oEmbed.
// Pexels/Unsplash là bản NÂNG CẤP (ảnh đẹp hơn) — chỉ dùng khi có key.
//
// Hàm THUẦN ở đây để kiểm thử không cần mạng.

import { execFile } from "node:child_process";

export type FoundMediaKind = "image" | "video";
export type FoundMediaSource = "pexels" | "commons" | "youtube";

/** Kết quả tìm nội dung. */
export interface FoundMedia {
  ok: boolean;
  kind: FoundMediaKind | null;
  /** Ảnh: URL ảnh trực tiếp. Video: link watch YouTube. */
  url: string | null;
  videoId?: string | null;
  title?: string | null;
  source?: FoundMediaSource | null;
}

export const MEDIA_FIND_TIMEOUT_MS = 15000;
export const MEDIA_FIND_MAX_QUERY = 120;

/**
 * Làm sạch từ khoá: gộp khoảng trắng, bỏ ký tự điều khiển, cắt độ dài.
 * (yt-dlp được gọi bằng execFile với mảng đối số nên KHÔNG qua shell; đây vẫn là
 * lớp phòng thủ thứ hai + giữ truy vấn gọn cho API.)
 */
export function sanitizeMediaQuery(raw: string): string {
  return (raw ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MEDIA_FIND_MAX_QUERY);
}

/** Link watch YouTube từ mã video. */
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

const YT_ID_RE = /^[A-Za-z0-9_-]{6,20}$/;

/**
 * Đọc kết quả `yt-dlp --flat-playlist --print "%(id)s\t%(title)s"`:
 * mỗi dòng `id<TAB>title`. Bỏ dòng hỏng, khử trùng mã, tối đa `limit` mục.
 */
export function parseYtDlpSearch(stdout: string, limit = 5): { id: string; title: string }[] {
  const out: { id: string; title: string }[] = [];
  const seen = new Set<string>();
  for (const line of (stdout ?? "").split("\n")) {
    const idx = line.indexOf("\t");
    if (idx <= 0) continue;
    const id = line.slice(0, idx).trim();
    const title = line.slice(idx + 1).trim();
    if (!YT_ID_RE.test(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, title });
    if (out.length >= limit) break;
  }
  return out;
}

interface CommonsImageInfo {
  mime?: unknown;
  thumburl?: unknown;
  url?: unknown;
}

interface CommonsPage {
  title?: unknown;
  index?: unknown;
  imageinfo?: unknown;
}

/**
 * Chọn ẢNH đầu tiên (theo `index` của Commons) từ payload MediaWiki
 * `generator=search&prop=imageinfo`. Bỏ qua mục không phải ảnh.
 */
export function pickCommonsImage(payload: unknown): { url: string; title: string } | null {
  const pages = (payload as { query?: { pages?: Record<string, CommonsPage> } })?.query?.pages;
  if (!pages || typeof pages !== "object") return null;

  const items = Object.values(pages)
    .map((p) => ({
      title: typeof p?.title === "string" ? p.title : "",
      index: typeof p?.index === "number" ? p.index : Number.MAX_SAFE_INTEGER,
      info: Array.isArray(p?.imageinfo) ? (p.imageinfo[0] as CommonsImageInfo) : null,
    }))
    .sort((a, b) => a.index - b.index);

  for (const it of items) {
    const mime = typeof it.info?.mime === "string" ? it.info.mime : "";
    const url = typeof it.info?.thumburl === "string" ? it.info.thumburl : "";
    if (mime.startsWith("image/") && /^https?:\/\//i.test(url)) {
      // Bỏ tham số theo dõi của Commons cho link gọn + cache tốt hơn.
      return { url: url.split("?")[0], title: it.title.replace(/^File:/, "") };
    }
  }
  return null;
}

/** URL API tìm ảnh trên Wikimedia Commons (không cần key). */
export function commonsSearchUrl(query: string, limit = 8, width = 900): string {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: "6",
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: String(width),
  });
  return `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
}

/** Chạy `yt-dlp` tìm video YouTube — KHÔNG cần key. Không bao giờ ném lỗi. */
export function ytDlpSearch(
  query: string,
  limit = 5,
): Promise<{ id: string; title: string }[]> {
  return new Promise((resolve) => {
    try {
      execFile(
        "yt-dlp",
        [
          `ytsearch${limit}:${query}`,
          "--flat-playlist",
          "--no-warnings",
          "--no-playlist",
          "--print",
          "%(id)s\t%(title)s",
        ],
        { timeout: MEDIA_FIND_TIMEOUT_MS, maxBuffer: 1024 * 1024 },
        (err, stdout) => resolve(err && !stdout ? [] : parseYtDlpSearch(stdout, limit)),
      );
    } catch {
      resolve([]);
    }
  });
}
