import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Hồi quy audit run-1: /api/sso/vuon không được dựng URL đăng nhập từ header
 * `x-forwarded-host` do client gửi (nguy cơ trang đăng nhập giả).
 */

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: getUserMock, signOut: async () => ({}) } }),
}));

import * as sso from "@/app/api/sso/vuon/route";

function req(headers: Record<string, string> = {}, query = "") {
  return new NextRequest(new URL(`https://nooi.net/api/sso/vuon${query}`), { headers });
}

beforeEach(() => {
  getUserMock.mockReset();
  getUserMock.mockResolvedValue({ data: { user: null } });
  process.env.VUON_SSO_SECRET = "DUMMY_SECRET";
});

describe("/api/sso/vuon — origin", () => {
  it.each([
    "evil.example",
    "nooi.net.evil.example",
    "evil.example:443",
    "",
  ])("x-forwarded-host=%j bị bỏ, dùng nooi.net", async (host) => {
    const res = await sso.GET(req({ "x-forwarded-host": host }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://nooi.net/login?redirect=%2Fapi%2Fsso%2Fvuon"
    );
  });

  it("host hợp lệ trong danh sách trắng được giữ", async () => {
    const res = await sso.GET(req({ "x-forwarded-host": "opc.nooi.net" }));
    expect(res.headers.get("location")).toContain("https://opc.nooi.net/login");
  });

  it("nhiều giá trị trong header chỉ lấy giá trị đầu", async () => {
    const res = await sso.GET(req({ "x-forwarded-host": "nooi.net, evil.example" }));
    expect(res.headers.get("location")).toContain("https://nooi.net/login");
  });
});

describe("/api/sso/vuon — back", () => {
  it("back ra ngoài Vườn bị thay bằng trang chủ Vườn", async () => {
    const res = await sso.GET(req({}, "?back=https://evil.example/x&logout=1"));
    expect(res.headers.get("location")).toBe("https://vuon.nooi.net/");
  });

  it("back hợp lệ trong Vườn được giữ", async () => {
    const res = await sso.GET(req({}, "?back=https://vuon.nooi.net/khoa-hoc&logout=1"));
    expect(res.headers.get("location")).toBe("https://vuon.nooi.net/khoa-hoc");
  });
});
