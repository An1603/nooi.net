// media-validate.ts — Kiểm tra link ảnh/video trước khi hiện lên sân khấu (eKid v3.2).
//
// Dùng CHUNG cho API `GET /api/ekid/media/validate` và cho kiểm thử:
//   - Chỉ chấp nhận scheme http/https (chặn javascript:/data:/file:/vbscript:…).
//   - Chỉ chấp nhận port mặc định 80/443 (không port, hoặc port 80/443).
//   - (SSRF) Chặn địa chỉ nội bộ/riêng tư/link-local/metadata: kiểm hostname + IP literal
//     và RESOLVE DNS — nếu BẤT KỲ IP nào bị chặn thì từ chối (chống DNS rebinding cơ bản).
//   - Link YouTube → VIDEO, phải hỏi oEmbed: chỉ nhận video còn tồn tại VÀ cho phép nhúng.
//   - Còn lại: HEAD request (redirect THỦ CÔNG, tối đa 3 hop, kiểm lại từng hop) rồi fallback
//     GET `Range: bytes=0-0` → đọc `content-type`: image/* → ảnh, video/* → video, khác → không hợp lệ.
//
// TUYỆT ĐỐI không ném lỗi ra ngoài — mọi trục trặc (timeout, mạng, URL sai, DNS lỗi) đều
// quy về `{ ok: false, kind: null }` để phía client chỉ việc ẩn nội dung.

// Dùng cục bộ + xuất lại (re-export) — các nơi khác vẫn import từ media-validate như trước.
import { isYouTubeUrl, youtubeVideoId } from "./youtube";

/** Thời gian chờ tối đa cho một lần kiểm tra (ms). */
export const MEDIA_VALIDATE_TIMEOUT_MS = 5000;

/** Số hop redirect tối đa được phép đi theo (mỗi hop đều phải qua kiểm SSRF). */
export const MEDIA_MAX_REDIRECTS = 3;

/** Loại nội dung hiển thị được trên sân khấu. */
export type MediaKind = "image" | "video";

/** Kết quả kiểm tra một URL media. */
export interface MediaValidateResult {
  ok: boolean;
  kind: MediaKind | null;
  contentType: string | null;
  /** Chỉ có với video YouTube: mã video đã kiểm chứng nhúng được. */
  videoId?: string | null;
}

/** Kiểu hàm fetch tối thiểu — cho phép tiêm bản giả trong kiểm thử. */
export type MediaFetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Một kết quả phân giải DNS tối thiểu. */
export interface DnsAddress {
  address: string;
  family: number;
}

/** Kiểu hàm phân giải DNS tối thiểu — cho phép tiêm bản giả trong kiểm thử. */
export type DnsLookupLike = (hostname: string) => Promise<DnsAddress[]>;

/** Phân giải DNS thật (Node runtime) — nạp động để module vẫn import được ở môi trường khác. */
async function defaultDnsLookup(hostname: string): Promise<DnsAddress[]> {
  const { promises: dns } = await import("node:dns");
  return dns.lookup(hostname, { all: true });
}

function invalid(contentType: string | null = null): MediaValidateResult {
  return { ok: false, kind: null, contentType };
}

// ─── Chuẩn hoá hostname / nhận diện IP ────────────────────────────────────────

/** Bỏ ngoặc vuông của IPv6 (`[::1]` → `::1`) và khoảng trắng thừa. */
function stripBrackets(host: string): string {
  const t = host.trim();
  if (t.startsWith("[") && t.endsWith("]")) return t.slice(1, -1);
  return t;
}

/** Chuẩn hoá hostname: bỏ ngoặc, hạ chữ thường, bỏ dấu chấm cuối. */
function normalizeHost(hostname: string): string {
  return stripBrackets(hostname).toLowerCase().replace(/\.$/, "");
}

/** Phân tích IPv4 dạng chấm-thập-phân; trả null nếu không phải IPv4 hợp lệ. */
function parseIPv4(host: string): [number, number, number, number] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const nums: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    nums.push(n);
  }
  return [nums[0], nums[1], nums[2], nums[3]];
}

/**
 * Phân tích IPv6 (chuẩn nén `::`, có/không có IPv4 nhúng, có/không zone `%eth0`)
 * → mảng 16 byte; trả null nếu không hợp lệ.
 */
function parseIPv6Bytes(raw: string): number[] | null {
  let h = raw;
  const pct = h.indexOf("%");
  if (pct !== -1) h = h.slice(0, pct);
  if (!h.includes(":")) return null;
  if (!/^[0-9a-f:.]+$/i.test(h)) return null;
  if (h.split("::").length > 2) return null;

  // Chuyển một đoạn IPv4 nhúng thành 2 nhóm 16-bit.
  const expandV4 = (part: string): string[] | null => {
    const v4 = parseIPv4(part);
    if (!v4) return null;
    return [(((v4[0] << 8) | v4[1]) >>> 0).toString(16), (((v4[2] << 8) | v4[3]) >>> 0).toString(16)];
  };

  const hasDoubleColon = h.includes("::");
  const [leftRaw, rightRaw] = hasDoubleColon ? h.split("::") : [h, ""];
  const left = leftRaw ? leftRaw.split(":") : [];
  const right = rightRaw ? rightRaw.split(":") : [];

  const conv = (arr: string[]): string[] | null => {
    const out: string[] = [];
    for (const seg of arr) {
      if (seg === "") return null;
      if (seg.includes(".")) {
        const ex = expandV4(seg);
        if (!ex) return null;
        out.push(...ex);
      } else {
        if (!/^[0-9a-fA-F]{1,4}$/.test(seg)) return null;
        out.push(seg);
      }
    }
    return out;
  };

  const lc = conv(left);
  const rc = conv(right);
  if (!lc || !rc) return null;

  let groups: string[];
  if (hasDoubleColon) {
    const fill = 8 - lc.length - rc.length;
    if (fill < 1) return null;
    groups = [...lc, ...new Array<string>(fill).fill("0"), ...rc];
  } else {
    if (lc.length !== 8) return null;
    groups = lc;
  }
  if (groups.length !== 8) return null;

  const bytes: number[] = [];
  for (const g of groups) {
    const n = parseInt(g, 16);
    if (Number.isNaN(n) || n < 0 || n > 0xffff) return null;
    bytes.push((n >> 8) & 0xff, n & 0xff);
  }
  return bytes;
}

function isBlockedIPv4(o: [number, number, number, number]): boolean {
  const [a, b, c] = o;
  if (a === 0) return true; // 0.0.0.0/8 ("this network"/unspecified)
  if (a === 10) return true; // 10.0.0.0/8 private
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (gồm metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 IETF + 192.0.2.0/24 TEST-NET-1
  if (a === 198 && b >= 18 && b <= 19) return true; // 198.18.0.0/15 benchmarking
  if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24 TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24 TEST-NET-3
  if (a >= 224) return true; // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved + broadcast
  return false;
}

function isBlockedIPv6(bytes: number[]): boolean {
  if (bytes.length !== 16) return false;
  const b0 = bytes[0];
  const b1 = bytes[1];
  if (bytes.every((x) => x === 0)) return true; // :: unspecified
  if (bytes.slice(0, 15).every((x) => x === 0) && bytes[15] === 1) return true; // ::1 loopback
  if ((b0 & 0xfe) === 0xfc) return true; // fc00::/7 unique-local
  if (b0 === 0xfe && (b1 & 0xc0) === 0x80) return true; // fe80::/10 link-local
  if (b0 === 0x20 && b1 === 0x02) return true; // 2002::/16 6to4 (có thể bọc IPv4 nội bộ)

  const first10Zero = bytes.slice(0, 10).every((x) => x === 0);
  if (first10Zero && bytes[10] === 0xff && bytes[11] === 0xff) {
    // ::ffff:a.b.c.d — IPv4-mapped
    return isBlockedIPv4([bytes[12], bytes[13], bytes[14], bytes[15]]);
  }
  if (first10Zero && bytes[10] === 0 && bytes[11] === 0) {
    // ::a.b.c.d — IPv4-compatible (kể cả ::1 đã chặn ở trên)
    return isBlockedIPv4([bytes[12], bytes[13], bytes[14], bytes[15]]);
  }
  if (b0 === 0x00 && b1 === 0x64 && bytes[2] === 0xff && bytes[3] === 0x9b && bytes.slice(4, 12).every((x) => x === 0)) {
    // 64:ff9b::/96 — NAT64 well-known prefix
    return isBlockedIPv4([bytes[12], bytes[13], bytes[14], bytes[15]]);
  }
  return false;
}

/** True nếu hostname là một IP literal (IPv4 hoặc IPv6). */
function isIpLiteral(host: string): boolean {
  return parseIPv4(host) !== null || parseIPv6Bytes(host) !== null;
}

/**
 * (SSRF) Kiểm tra ĐỒNG BỘ một hostname/IP literal có bị chặn hay không.
 * Chặn: `localhost`/`*.localhost`, `*.local`, `*.internal` (gồm `metadata.google.internal`),
 * và các dải IP nội bộ/riêng tư/link-local/metadata (IPv4 + IPv6).
 *
 * LƯU Ý: hàm này là kiểm tra TĨNH. Với hostname KHÔNG phải IP literal cần gọi thêm
 * `isAllowedHost()` để phân giải DNS và kiểm từng IP.
 */
export function isBlockedAddress(hostname: string): boolean {
  const h = normalizeHost(hostname);
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;
  const v4 = parseIPv4(h);
  if (v4) return isBlockedIPv4(v4);
  const v6 = parseIPv6Bytes(h);
  if (v6) return isBlockedIPv6(v6);
  return false;
}

/**
 * (SSRF) Kiểm tra một hostname có an toàn để phát request hay không:
 *   1) Chặn ngay nếu hostname/IP literal thuộc danh sách đen (`isBlockedAddress`).
 *   2) Với hostname thường: phân giải DNS (mọi bản ghi) — nếu BẤT KỲ IP nào bị chặn → từ chối;
 *      lookup lỗi hoặc rỗng → coi như KHÔNG hợp lệ.
 * Luôn best-effort: không bao giờ ném lỗi (trả `false` khi trục trặc).
 */
export async function isAllowedHost(
  hostname: string,
  lookup: DnsLookupLike = defaultDnsLookup,
): Promise<boolean> {
  if (isBlockedAddress(hostname)) return false;
  const h = normalizeHost(hostname);
  if (isIpLiteral(h)) return true; // IP literal không nằm danh sách đen → cho phép
  let addrs: DnsAddress[];
  try {
    addrs = await lookup(h);
  } catch {
    return false;
  }
  if (!Array.isArray(addrs) || addrs.length === 0) return false;
  for (const a of addrs) {
    if (!a || typeof a.address !== "string") return false;
    if (isBlockedAddress(a.address)) return false;
  }
  return true;
}

// ─── Kiểm tra URL / protocol / port ──────────────────────────────────────────

/** Chỉ cho phép scheme http/https — chặn javascript:, data:, file:, vbscript:… */
export function isHttpUrl(raw: string): boolean {
  try {
    const protocol = new URL(raw).protocol.toLowerCase();
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** (SSRF) Chỉ cho phép port mặc định: không port, hoặc 80/443. */
export function isAllowedPort(port: string): boolean {
  return port === "" || port === "80" || port === "443";
}

// ─── Nhận diện YouTube (tách sang youtube.ts — hàm thuần, an toàn cho client) ──
// Xuất lại để nơi khác tiếp tục import từ media-validate như trước.
export { isYouTubeUrl, youtubeVideoId } from "./youtube";

/** Content-type "chung chung" — server không nói rõ là ảnh hay video. */
function isGenericContentType(ct: string): boolean {
  return (
    ct === "" ||
    ct === "application/octet-stream" ||
    ct === "binary/octet-stream" ||
    ct === "application/binary"
  );
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogv)$/i;

/** Lấy phần đường dẫn (bỏ query) của URL để đoán loại theo đuôi file. */
function urlPathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

/**
 * Quy `content-type` về loại hiển thị được (image/video) hoặc null.
 * Với content-type CHUNG CHUNG (vd `application/octet-stream` — rất nhiều CDN ảnh
 * trả kiểu này) thì suy tiếp từ ĐUÔI FILE của `url`, tránh loại oan ảnh xem được.
 * Content-type nói RÕ là `text/html`/`application/json` thì vẫn bị loại (trang web).
 */
export function classifyContentType(contentType: string | null, url?: string): MediaKind | null {
  const ct = (contentType ?? "").toLowerCase().split(";")[0].trim();
  if (ct.startsWith("image/")) return "image";
  if (ct.startsWith("video/")) return "video";
  if (!url || !isGenericContentType(ct)) return null;

  const path = urlPathname(url);
  if (IMAGE_EXT_RE.test(path)) return "image";
  if (VIDEO_EXT_RE.test(path)) return "video";
  return null;
}

// ─── Gọi mạng có kiểm soát ───────────────────────────────────────────────────

// Một lần gọi mạng có timeout — nuốt mọi lỗi, trả null nếu thất bại.
// (SSRF) `redirect: "manual"` — KHÔNG để fetch tự đi theo redirect; tự kiểm từng hop.
async function requestWithTimeout(
  doFetch: MediaFetchLike,
  url: string,
  init: RequestInit,
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MEDIA_VALIDATE_TIMEOUT_MS);
  try {
    return await doFetch(url, { ...init, redirect: "manual", signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function cancelBody(res: Response | null): Promise<void> {
  try {
    await res?.body?.cancel();
  } catch {
    // bỏ qua
  }
}

/**
 * (SSRF) Gọi request nhưng tự đi theo redirect một cách AN TOÀN: mỗi hop phải
 * là http/https, port mặc định, và host an toàn (kiểm địa chỉ + DNS). Tối đa
 * `MEDIA_MAX_REDIRECTS` hop; vượt quá / Location xấu → trả null.
 */
async function fetchFollowingSafeRedirects(
  doFetch: MediaFetchLike,
  url: string,
  init: RequestInit,
  lookup: DnsLookupLike,
): Promise<Response | null> {
  let current = url;
  for (let hop = 0; hop <= MEDIA_MAX_REDIRECTS; hop++) {
    const res = await requestWithTimeout(doFetch, current, init);
    if (!res) return null;

    const status = typeof res.status === "number" ? res.status : 0;
    if (status >= 300 && status < 400) {
      const location = res.headers.get("location");
      await cancelBody(res);
      if (!location || hop >= MEDIA_MAX_REDIRECTS) return null;

      let nextUrl: string;
      try {
        nextUrl = new URL(location, current).toString();
      } catch {
        return null;
      }
      if (!isHttpUrl(nextUrl)) return null;

      let next: URL;
      try {
        next = new URL(nextUrl);
      } catch {
        return null;
      }
      if (!isAllowedPort(next.port)) return null;
      if (!(await isAllowedHost(next.hostname, lookup))) return null;

      current = nextUrl;
      continue;
    }
    return res;
  }
  return null;
}

/**
 * Hỏi YouTube **oEmbed** xem video còn tồn tại VÀ có cho phép nhúng không.
 * 200 = nhúng được; 401/403/404 (video riêng tư, đã xoá, chủ kênh tắt nhúng,
 * video nhạc) = KHÔNG nhúng được. Mọi lỗi mạng/timeout → coi như không nhúng được.
 * Endpoint là hằng số của YouTube (không dựng từ input) nên không có rủi ro SSRF.
 */
async function isYouTubeEmbeddable(
  videoId: string,
  doFetch: MediaFetchLike,
): Promise<boolean> {
  const watch = `https://www.youtube.com/watch?v=${videoId}`;
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`;
  const res = await requestWithTimeout(doFetch, endpoint, { method: "GET" });
  const ok = !!res && res.ok === true && res.status >= 200 && res.status < 300;
  await cancelBody(res);
  return ok;
}

/**
 * Kiểm tra một URL media. KHÔNG BAO GIỜ ném lỗi.
 * @param raw URL cần kiểm tra.
 * @param doFetch hàm fetch (mặc định `globalThis.fetch`) — tiêm để kiểm thử.
 * @param doLookup hàm phân giải DNS (mặc định `node:dns`) — tiêm để kiểm thử.
 */
export async function validateMediaUrl(
  raw: string,
  doFetch: MediaFetchLike = (input, init) => fetch(input, init),
  doLookup: DnsLookupLike = defaultDnsLookup,
): Promise<MediaValidateResult> {
  const url = (raw ?? "").trim();
  if (!url || !isHttpUrl(url)) return invalid();

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return invalid();
  }

  // (SSRF) Chỉ port mặc định 80/443.
  if (!isAllowedPort(parsed.port)) return invalid();

  // (SSRF) Chặn hostname/IP nội bộ + phân giải DNS kiểm từng IP.
  if (!(await isAllowedHost(parsed.hostname, doLookup))) return invalid();

  // YouTube: KHÔNG tin tưởng mù. Hỏi oEmbed — chỉ nhận video còn tồn tại VÀ cho
  // phép nhúng; nếu không, tránh hẳn khung "video không khả dụng" cho bé xem.
  if (isYouTubeUrl(url)) {
    const videoId = youtubeVideoId(url);
    if (!videoId) return invalid();
    if (!(await isYouTubeEmbeddable(videoId, doFetch))) return invalid();
    return { ok: true, kind: "video", contentType: "video/youtube", videoId };
  }

  // HEAD trước; nhiều CDN chặn HEAD (405) → fallback GET `Range: bytes=0-0`.
  // Mọi redirect đều được kiểm SSRF ở từng hop.
  // `sawResponse`: server THẬT SỰ trả lời (kể cả lỗi) — chỉ khi đó mới được suy
  // loại từ đuôi file; mạng lỗi/timeout/chặn SSRF thì KHÔNG suy (tránh nhận oan).
  let contentType: string | null = null;
  let sawResponse = false;

  const head = await fetchFollowingSafeRedirects(doFetch, url, { method: "HEAD" }, doLookup);
  if (head) {
    sawResponse = true;
    if (head.ok) contentType = head.headers.get("content-type");
    await cancelBody(head);
  }

  if (!contentType) {
    const get = await fetchFollowingSafeRedirects(
      doFetch,
      url,
      { method: "GET", headers: { Range: "bytes=0-0" } },
      doLookup,
    );
    if (get) {
      sawResponse = true;
      contentType = get.headers.get("content-type");
    }
    // Chỉ cần header — huỷ luồng để không tải nặng nội dung.
    await cancelBody(get);
  }

  const kind = classifyContentType(contentType, sawResponse ? url : undefined);
  if (!kind) return invalid(contentType);
  return { ok: true, kind, contentType };
}
