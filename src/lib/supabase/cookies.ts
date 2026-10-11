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