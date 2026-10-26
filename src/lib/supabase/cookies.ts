/**
 * Shared cookie options + tên cookie auth cho Supabase SSR.
 *
 * - Host nooi.net / app.nooi.net / admin.nooi.net: tên cookie MẶC ĐỊNH + `domain=.nooi.net`
 *   → phiên chia sẻ liên subdomain (GIỮ NGUYÊN hành vi cũ).
 * - Host ekid.nooi.net: TÊN COOKIE RIÊNG + host-only (KHÔNG `domain`).
 *   Tách hoàn toàn CẢ HAI CHIỀU: cookie của ekid không rò sang nooi.net, và cookie
 *   `.nooi.net` của người lớn (tên mặc định) KHÔNG BAO GIỜ được đọc trên ekid vì
 *   `@supabase/ssr` chỉ khớp chunk theo `storageKey` (= tên cookie đã cấu hình).
 */

/** Tên cookie auth mặc định — phải khớp storageKey Supabase của project. */
export const AUTH_COOKIE_NAME = "sb-gsnuqrutiauhnsacgzym-auth-token";

/** Tên cookie auth RIÊNG của host eKid (khác hẳn tên mặc định). */
export const EKID_AUTH_COOKIE_NAME = "sb-ekid-auth-token";

/** Tên cookie auth RIÊNG của host OPC Center (host-only, tách khỏi phiên nooi.net). */
export const OPC_AUTH_COOKIE_NAME = "sb-opc-auth-token";

/** Host của phân hệ eKid. */
export const EKID_HOST = "ekid.nooi.net";

/** Host của phân hệ OPC Center. */
export const OPC_HOST = "opc.nooi.net";

/**
 * Trả về tên cookie auth phù hợp với host.
 * Chỉ host ekid dùng tên riêng; mọi host khác giữ tên mặc định.
 */
export function authCookieName(host: string): string {
  if (host === EKID_HOST) return EKID_AUTH_COOKIE_NAME;
  if (host === OPC_HOST) return OPC_AUTH_COOKIE_NAME;
  return AUTH_COOKIE_NAME;
}

/** Tên các chunk cookie (`.0`, `.1`, …) ứng với một tên cookie gốc. */
export function authCookieChunkNames(name: string): string[] {
  return [`${name}.0`, `${name}.1`];
}

/**
 * Shared cookie options for cross-subdomain session sharing.
 * Sets domain to .nooi.net in production so cookies work across
 * nooi.net, app.nooi.net, and admin.nooi.net.
 *
 * Khi `hostOnly` = true (phân hệ eKid trên ekid.nooi.net): KHÔNG set `domain`,
 * phiên là host-only → độc lập hoàn toàn với nooi.net/app/admin.
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
