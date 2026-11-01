/**
 * Chuẩn hoá "đích chuyển hướng sau đăng nhập" thành đường dẫn NỘI BỘ an toàn.
 *
 * Vì sao cần: các route `src/app/auth/*` từng ghép thẳng `?next=` / `?redirect=`
 * / `?fallback=` vào Location, nên `next=.evil.com`, `next=@evil.com`,
 * `redirect=//evil.com`, `redirect=\\evil.com` đưa người vừa đăng nhập sang host
 * của kẻ tấn công (audit 01/11/2026, run-1).
 *
 * Luật: chỉ chấp nhận đường dẫn tuyệt đối **cùng origin** bắt đầu bằng đúng MỘT
 * dấu "/", không chứa "\\" hay "@", phân giải lại bằng URL để chắc chắn origin
 * không đổi; mọi trường hợp khác trả `fallback`.
 */
export function safeInternalPath(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const value = raw.trim();
  if (!value) return fallback;

  // Bắt buộc bắt đầu bằng "/" và KHÔNG phải "//" (protocol-relative).
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  // Ký tự dùng để đổi host trong bộ phân giải URL.
  if (value.includes("\\") || value.includes("@")) return fallback;
  // Dấu chéo ngược/chéo xuôi đã mã hoá — cùng họ với "//" và "\".
  if (/%2f|%5c|%00/i.test(value)) return fallback;

  // Chỉ nhận ký tự đường dẫn/query/hash thông thường (chặn scheme lẫn vào path).
  if (!/^\/[A-Za-z0-9\-._~!$&'()*+,;=%/?#\[\]]*$/.test(value)) return fallback;

  try {
    const base = "https://nooi.net";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
