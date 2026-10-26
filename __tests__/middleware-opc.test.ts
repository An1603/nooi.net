import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const updateSessionMock = vi.fn();
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (req: NextRequest) => updateSessionMock(req),
}));

import { middleware } from "@/middleware";

const OPC_HOST = "opc.nooi.net";

function makeReq(path: string, host = OPC_HOST): NextRequest {
  return new NextRequest(new URL(`https://${host}${path}`), { headers: { host } });
}

function rewriteTarget(res: Response): string | null {
  return res.headers.get("x-middleware-rewrite");
}

function mockSession(user: { id: string } | null) {
  updateSessionMock.mockResolvedValue({
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
      }),
    },
    supabaseResponse: new Response(null, { status: 200 }),
    user,
  });
}

beforeEach(() => {
  updateSessionMock.mockReset();
});

describe("middleware OPC — cửa hàng công khai", () => {
  it("chưa đăng nhập vào / → rewrite /opc-public, không redirect login", async () => {
    mockSession(null);
    const res = await middleware(makeReq("/"));
    const target = rewriteTarget(res);
    expect(res.status).toBe(200);
    expect(target).not.toBeNull();
    expect(new URL(target!).pathname).toBe("/opc-public");
  });

  it("đã đăng nhập vào / → rewrite /opc (dashboard)", async () => {
    mockSession({ id: "user-1" });
    const res = await middleware(makeReq("/"));
    const target = rewriteTarget(res);
    expect(target).not.toBeNull();
    expect(new URL(target!).pathname).toBe("/opc");
  });

  it("chưa đăng nhập vào /goi → rewrite /opc-public/goi", async () => {
    mockSession(null);
    const res = await middleware(makeReq("/goi"));
    const target = rewriteTarget(res);
    expect(target).not.toBeNull();
    expect(new URL(target!).pathname).toBe("/opc-public/goi");
  });

  it("đã đăng nhập vẫn xem được /goi (không 404)", async () => {
    mockSession({ id: "user-1" });
    const res = await middleware(makeReq("/goi"));
    const target = rewriteTarget(res);
    expect(target).not.toBeNull();
    expect(new URL(target!).pathname).toBe("/opc-public/goi");
  });

  it("chưa đăng nhập vào /goi/pro → rewrite trang chi tiết gói (không bắt đăng nhập)", async () => {
    mockSession(null);
    const res = await middleware(makeReq("/goi/pro"));
    const target = rewriteTarget(res);
    expect(res.status).toBe(200);
    expect(target).not.toBeNull();
    expect(new URL(target!).pathname).toBe("/opc-public/goi/pro");
  });

  it("chưa đăng nhập vào /chan-doan → rewrite /opc-public/chan-doan", async () => {
    mockSession(null);
    const res = await middleware(makeReq("/chan-doan"));
    const target = rewriteTarget(res);
    expect(target).not.toBeNull();
    expect(new URL(target!).pathname).toBe("/opc-public/chan-doan");
  });

  it("chưa đăng nhập vào /dat-mua/pro → rewrite đúng trang đặt mua", async () => {
    mockSession(null);
    const res = await middleware(makeReq("/dat-mua/pro"));
    const target = rewriteTarget(res);
    expect(target).not.toBeNull();
    expect(new URL(target!).pathname).toBe("/opc-public/dat-mua/pro");
  });

  it("khu vực nội bộ /opc vẫn yêu cầu đăng nhập", async () => {
    mockSession(null);
    const res = await middleware(makeReq("/opc"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("host chính không được lộ /opc-public", async () => {
    mockSession(null);
    const res = await middleware(makeReq("/opc-public", "nooi.net"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");
  });

  it("/api/opc/health vẫn đi thẳng, không bị rewrite", async () => {
    mockSession(null);
    const res = await middleware(makeReq("/api/opc/health"));
    expect(rewriteTarget(res)).toBeNull();
    expect(res.status).toBe(200);
  });
});
