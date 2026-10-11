import { describe, it, expect } from "vitest";
import {
  authCookieName,
  authCookieChunkNames,
  AUTH_COOKIE_NAME,
  EKID_AUTH_COOKIE_NAME,
  EKID_HOST,
} from "@/lib/supabase/cookies";

describe("authCookieName — tách tên cookie auth theo host", () => {
  it("host ekid.nooi.net → tên cookie RIÊNG (khác tên mặc định)", () => {
    const name = authCookieName(EKID_HOST);
    expect(name).toBe(EKID_AUTH_COOKIE_NAME);
    expect(name).not.toBe(AUTH_COOKIE_NAME);
  });

  it("host nooi.net/app/admin → giữ tên MẶC ĐỊNH (không hồi quy)", () => {
    expect(authCookieName("nooi.net")).toBe(AUTH_COOKIE_NAME);
    expect(authCookieName("app.nooi.net")).toBe(AUTH_COOKIE_NAME);
    expect(authCookieName("admin.nooi.net")).toBe(AUTH_COOKIE_NAME);
  });

  it("tên chunk dựng đúng từ tên gốc, và 2 bộ tên KHÔNG giao nhau", () => {
    const ekidChunks = authCookieChunkNames(EKID_AUTH_COOKIE_NAME);
    const defaultChunks = authCookieChunkNames(AUTH_COOKIE_NAME);
    expect(ekidChunks).toEqual(["sb-ekid-auth-token.0", "sb-ekid-auth-token.1"]);
    expect(ekidChunks.some((n) => defaultChunks.includes(n))).toBe(false);
  });
});
