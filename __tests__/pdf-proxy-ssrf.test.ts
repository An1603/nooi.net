import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Hồi quy audit run-1 (SSRF): pdf-proxy chỉ được tải tệp từ kho Storage của NOOI
 * hoặc miền khai báo qua PDF_PROXY_HOSTS — không gọi được mạng nội bộ.
 */

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: getUserMock } }),
}));

import * as proxy from "@/app/api/library/pdf-proxy/route";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const SUPABASE = "https://gsnuqrutiauhnsacgzym.supabase.co";

function go(url: string) {
  const u = `https://nooi.net/api/library/pdf-proxy?url=${encodeURIComponent(url)}`;
  return proxy.GET(new NextRequest(new URL(u)));
}

beforeEach(() => {
  getUserMock.mockReset();
  fetchMock.mockReset();
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "DUMMY";
  getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
});

describe("/api/library/pdf-proxy", () => {
  it("ẩn danh → 401", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await go(`${SUPABASE}/storage/v1/object/public/library/a.pdf`);
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tệp trong kho NOOI → stream về", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/pdf", "content-length": "1024" }),
      body: "PDF",
    });
    const res = await go(`${SUPABASE}/storage/v1/object/public/library/a.pdf`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it.each([
    "http://127.0.0.1:3000/api/admin/roles",
    "http://169.254.169.254/latest/meta-data/",
    "https://evil.example/x.pdf",
    "https://gsnuqrutiauhnsacgzym.supabase.co/rest/v1/profiles",
    "http://gsnuqrutiauhnsacgzym.supabase.co/storage/v1/object/public/a.pdf",
    "https://gsnuqrutiauhnsacgzym.supabase.co:8443/storage/v1/object/public/a.pdf",
  ])("chặn %s", async (url) => {
    const res = await go(url);
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("không đi theo redirect (chặn vòng qua 302)", async () => {
    fetchMock.mockRejectedValue(new TypeError("unexpected redirect"));
    const res = await go(`${SUPABASE}/storage/v1/object/public/library/a.pdf`);
    expect(res.status).toBe(500);
  });

  it("nội dung không phải PDF → 415", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/html" }),
      body: "<html>",
    });
    const res = await go(`${SUPABASE}/storage/v1/object/public/library/a.pdf`);
    expect(res.status).toBe(415);
  });
});
