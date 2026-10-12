// media-validate.ts — Kiểm tra link ảnh/video trước khi hiện lên sân khấu (eKid v3.2).
//
// Dùng CHUNG cho API `GET /api/ekid/media/validate` và cho kiểm thử:
//   - Chỉ chấp nhận scheme http/https (chặn javascript:/data:/file:/vbscript:…).
//   - Link YouTube (watch/youtu.be/embed/shorts/music) → coi là VIDEO, khỏi gọi mạng.
//   - Còn lại: HEAD request (timeout) rồi fallback GET `Range: bytes=0-0` →
//     đọc `content-type`: image/* → ảnh, video/* → video, khác → không hợp lệ.
//
// TUYỆT ĐỐI không ném lỗi ra ngoài — mọi trục trặc (timeout, mạng, URL sai) đều
// quy về `{ ok: false, kind: null }` để phía client chỉ việc ẩn nội dung.

/** Thời gian chờ tối đa cho một lần kiểm tra (ms). */
export const MEDIA_VALIDATE_TIMEOUT_MS = 5000;

/** Loại nội dung hiển thị được trên sân khấu. */
export type MediaKind = "image" | "video";

/** Kết quả kiểm tra một URL media. */
export interface MediaValidateResult {
  ok: boolean;
  kind: MediaKind | null;
  contentType: string | null;
}

/** Kiểu hàm fetch tối thiểu — cho phép tiêm bản giả trong kiểm thử. */
export type MediaFetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function invalid(contentType: string | null = null): MediaValidateResult {
  return { ok: false, kind: null, contentType };
}

/** Chỉ cho phép scheme http/https — chặn javascript:, data:, file:, vbscript:… */
export function isHttpUrl(raw: string): boolean {
  try {
    const protocol = new URL(raw).protocol.toLowerCase();
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** Nhận diện link YouTube (watch/youtu.be/embed/shorts/music) → coi là video. */
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

/** Quy `content-type` về loại hiển thị được (image/video) hoặc null. */
export function classifyContentType(contentType: string | null): MediaKind | null {
  const ct = (contentType ?? "").toLowerCase();
  if (ct.startsWith("image/")) return "image";
  if (ct.startsWith("video/")) return "video";
  return null;
}

// Một lần gọi mạng có timeout — nuốt mọi lỗi, trả null nếu thất bại.
async function requestWithTimeout(
  doFetch: MediaFetchLike,
  url: string,
  init: RequestInit,
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MEDIA_VALIDATE_TIMEOUT_MS);
  try {
    return await doFetch(url, { ...init, redirect: "follow", signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Kiểm tra một URL media. KHÔNG BAO GIỜ ném lỗi.
 * @param raw URL cần kiểm tra.
 * @param doFetch hàm fetch (mặc định `globalThis.fetch`) — tiêm để kiểm thử.
 */
export async function validateMediaUrl(
  raw: string,
  doFetch: MediaFetchLike = (input, init) => fetch(input, init),
): Promise<MediaValidateResult> {
  const url = (raw ?? "").trim();
  if (!url || !isHttpUrl(url)) return invalid();

  // YouTube coi là video — không cần chạm mạng (embed sẽ chạy ở client).
  if (isYouTubeUrl(url)) return { ok: true, kind: "video", contentType: "video/youtube" };

  // HEAD trước; nhiều CDN chặn HEAD (405) → fallback GET `Range: bytes=0-0`.
  let contentType: string | null = null;
  const head = await requestWithTimeout(doFetch, url, { method: "HEAD" });
  if (head && head.ok) contentType = head.headers.get("content-type");

  if (!contentType) {
    const get = await requestWithTimeout(doFetch, url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
    });
    if (get) contentType = get.headers.get("content-type");
    // Chỉ cần header — huỷ luồng để không tải nặng nội dung.
    try {
      await get?.body?.cancel();
    } catch {
      // bỏ qua
    }
  }

  const kind = classifyContentType(contentType);
  if (!kind) return invalid(contentType);
  return { ok: true, kind, contentType };
}
