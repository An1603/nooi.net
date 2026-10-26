/**
 * Tên cookie + options dùng chung cho Supabase SSR.
 *
 * - nooi.net / app.nooi.net / admin.nooi.net / opc.nooi.net:
 *   CÙNG một tên cookie mặc định + `domain=.nooi.net`
 *   → đăng nhập một lần, dùng được ở mọi phân hệ (SSO thật).
 * - ekid.nooi.net: tên cookie riêng + host-only, tách hoàn toàn khỏi người lớn.
 *
 * Quan trọng: client (createBrowserClient), server (createServerClient) và
 * middleware PHẢI dùng CÙNG một bộ options. Trước đây client ghi host-only còn
 * middleware ghi `.nooi.net`, tạo hai biến thể cùng tên → server đọc nhầm và
 * "đá" phiên ra login.
 */

/** Tên cookie auth mặc định — phải khớp storageKey Supabase của project. */
export const AUTH_COOKIE_NAME = "sb-gsnuqrutiauhnsacgzym-auth-token";

/** Tên cookie auth RIÊNG của host eKid (khác hẳn tên mặc định). */
export const EKID_AUTH_COOKIE_NAME = "sb-ekid-auth-token";

/** Host của phân hệ eKid. */
export const EKID_HOST = "ekid.nooi.net";

/** Host của phân hệ OPC Center. */
export const OPC_HOST = "opc.nooi.net";

/** Tên cookie auth theo host. Chỉ eKid dùng tên riêng. */
export function authCookieName(host: string): string {
  return host === EKID_HOST ? EKID_AUTH_COOKIE_NAME : AUTH_COOKIE_NAME;
}

/**
 * Options đầy đủ cho cookie auth. Dùng cho cả browser, server và middleware.
 * Production + host người lớn → domain `.nooi.net` để chia sẻ phiên.
 */
export function authCookieOptions(host: string): {
  name: string;
  path: string;
  sameSite: "lax";
  secure: boolean;
  domain?: string;
} {
  const hostOnly = host === EKID_HOST;
  const base = {
    name: authCookieName(host),
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  return process.env.NODE_ENV === "production" && !hostOnly
    ? { ...base, domain: ".nooi.net" }
    : base;
}

/** Tên các chunk (`.0`, `.1`) ứng với một tên cookie gốc. */
export function authCookieChunkNames(name: string): string[] {
  return [`${name}.0`, `${name}.1`];
}

/** Tên cookie gốc + các chunk — dùng khi cần dọn phiên. */
export function authCookieNames(name: string): string[] {
  return [name, ...authCookieChunkNames(name)];
}

/**
 * Legacy helper cho các route cũ (confirm, refresh-domain).
 * Giữ tương thích; code mới dùng `authCookieOptions`.
 */
export function cookieOptions(
  base?: Record<string, unknown>,
  opts?: { hostOnly?: boolean }
): Record<string, unknown> {
  if (process.env.NODE_ENV === "production") {
    if (opts?.hostOnly) {
      return { ...base, secure: true, sameSite: "lax" as const };
    }
    return { ...base, domain: ".nooi.net", secure: true, sameSite: "lax" as const };
  }
  return { ...base };
}
