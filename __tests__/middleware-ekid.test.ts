import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock updateSession để không cần Supabase thật / mạng.
const updateSessionMock = vi.fn();
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (req: NextRequest) => updateSessionMock(req),
}));

import { middleware } from "@/middleware";

const EKID_HOST = "ekid.nooi.net";

/** Supabase giả: mọi truy vấn .from().select().eq().maybeSingle() trả dữ liệu cho sẵn. */
function fakeSupabase(childRows: { id: string }[] = []) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: childRows[0] ?? null, error: null }),
        }),
      }),
    }),
  };
}

function makeReq(path: string, host = EKID_HOST): NextRequest {
  return new NextRequest(new URL(`https://${host}${path}`), {
    headers: { host },
  });
}

function rewriteTarget(res: Response): string | null {
  return res.headers.get("x-middleware-rewrite");
}

beforeEach(() => {
  updateSessionMock.mockReset();
});

describe("middleware eKid host — (C) API passthrough", () => {
  it("KHÔNG rewrite /api/ekid/library (không thành /ekid/api/...) dù đã đăng nhập là con", async () => {
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([{ id: "kid1" }]), // user là con
      supabaseResponse: new Response(null, { status: 200 }),
      user: { id: "child-user-1" },
    });

    const res = await middleware(makeReq("/api/ekid/library"));
    expect(rewriteTarget(res)).toBeNull();
    expect(res.status).toBe(200);
  });

  it("CHO QUA /api khi chưa đăng nhập (route tự lo 401), không redirect/rewrite", async () => {
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([]),
      supabaseResponse: new Response(null, { status: 200 }),
      user: null,
    });

    const res = await middleware(makeReq("/api/ekid/session?kid_id=x"));
    expect(rewriteTarget(res)).toBeNull();
    expect(res.status).toBe(200);
  });

  it("vẫn rewrite path web thường của con: /hoc/abc → /ekid/hoc/abc", async () => {
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([{ id: "kid1" }]),
      supabaseResponse: new Response(null, { status: 200 }),
      user: { id: "child-user-1" },
    });

    const res = await middleware(makeReq("/hoc/abc"));
    const target = rewriteTarget(res);
    expect(target).not.toBeNull();
    expect(new URL(target!).pathname).toBe("/ekid/hoc/abc");
  });

  it("path /ekid/* của con đi thẳng, không rewrite", async () => {
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([{ id: "kid1" }]),
      supabaseResponse: new Response(null, { status: 200 }),
      user: { id: "child-user-1" },
    });

    const res = await middleware(makeReq("/ekid/thi/abc"));
    expect(rewriteTarget(res)).toBeNull();
    expect(res.status).toBe(200);
  });
});
