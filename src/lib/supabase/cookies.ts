/**
 * Shared cookie options for cross-subdomain session sharing.
 * Sets domain to .nooi.net in production so cookies work across
 * nooi.net, app.nooi.net, and admin.nooi.net.
 */
export function cookieOptions(base?: Record<string, unknown>): Record<string, unknown> {
  if (process.env.NODE_ENV === "production") {
    return { ...base, domain: ".nooi.net", secure: true, sameSite: "lax" as const };
  }
  return { ...base };
}