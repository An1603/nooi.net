import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock updateSession để không cần Supabase thật / mạng.
const updateSessionMock = vi.fn();
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (req: NextRequest) => updateSessionMock(req),
}));

import { middleware } from "@/middleware";

const EKID_HOST = "ekid.nooi.net";

/** Supabase giả: mọi truy vấn .from().select().eq().maybeSingle() trả dữ liệu cho sẵn. */
function fakeSupabase(childRows: { id: string; status?: string | null }[] = []) {
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

  it("CHO QUA /api/ekid/* khi chưa đăng nhập (route tự lo 401), không redirect/rewrite", async () => {
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([]),
      supabaseResponse: new Response(null, { status: 200 }),
      user: null,
    });

    const res = await middleware(makeReq("/api/ekid/session?kid_id=x"));
    expect(rewriteTarget(res)).toBeNull();
    expect(res.status).toBe(200);
  });

  it("CHO QUA /api/voice/token (con đang đăng nhập) — endpoint giọng nói của phân hệ con", async () => {
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([{ id: "kid1" }]), // user là con
      supabaseResponse: new Response(null, { status: 200 }),
      user: { id: "child-user-1" },
    });

    const res = await middleware(makeReq("/api/voice/token"));
    expect(rewriteTarget(res)).toBeNull();
    expect(res.status).toBe(200);
  });

  it("KHÔNG passthrough /api/ai-mentor/chat (route app người lớn): con bị rewrite → 404, không lộ API", async () => {
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([{ id: "kid1" }]), // user là con
      supabaseResponse: new Response(null, { status: 200 }),
      user: { id: "child-user-1" },
    });

    const res = await middleware(makeReq("/api/ai-mentor/chat"));
    const target = rewriteTarget(res);
    // Bị rewrite sang /ekid/api/ai-mentor/chat → không có page route → 404 (bị chặn)
    expect(target).not.toBeNull();
    expect(new URL(target!).pathname).toBe("/ekid/api/ai-mentor/chat");
  });

  it("KHÔNG passthrough /api không nằm whitelist khi anonymous: chuyển về /login, không cho qua", async () => {
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([]),
      supabaseResponse: new Response(null, { status: 200 }),
      user: null,
    });

    const res = await middleware(makeReq("/api/upload/avatar"));
    expect(rewriteTarget(res)).toBeNull();
    expect(res.status).toBe(307); // redirect → /login
    const loc = res.headers.get("location")!;
    expect(new URL(loc).pathname).toBe("/login");
    expect(loc).not.toContain("/ekid/login");
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

describe("middleware — (I-A) sao chép cookie phiên sang response mới", () => {
  const AUTH_COOKIE = "sb-ekid-auth-token";

  function supabaseRespWithCookie(value = "refreshed") {
    const r = NextResponse.next();
    r.cookies.set(AUTH_COOKIE, value, { path: "/" });
    return r;
  }

  it("REWRITE path của con (/hoc/abc → /ekid/hoc/abc) vẫn mang cookie refresh", async () => {
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([{ id: "kid1" }]),
      supabaseResponse: supabaseRespWithCookie("tok-rw"),
      user: { id: "child-user-1" },
    });

    const res = await middleware(makeReq("/hoc/abc"));
    expect(rewriteTarget(res)).not.toBeNull();
    expect(res.cookies.get(AUTH_COOKIE)?.value).toBe("tok-rw");
  });

  it("REWRITE '/' của con (→ /ekid) vẫn mang cookie refresh", async () => {
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([{ id: "kid1" }]),
      supabaseResponse: supabaseRespWithCookie("tok-root"),
      user: { id: "child-user-1" },
    });

    const res = await middleware(makeReq("/"));
    const target = rewriteTarget(res);
    expect(target).not.toBeNull();
    expect(new URL(target!).pathname).toBe("/ekid");
    expect(res.cookies.get(AUTH_COOKIE)?.value).toBe("tok-root");
  });

  it("REDIRECT (ekid host, chưa đăng nhập) vẫn mang cookie phiên", async () => {
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([]),
      supabaseResponse: supabaseRespWithCookie("tok-clear"),
      user: null,
    });

    const res = await middleware(makeReq("/app/dashboard"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    expect(res.cookies.get(AUTH_COOKIE)?.value).toBe("tok-clear");
  });

  it("nhánh admin không phải admin: lệnh CLEAR cookie thắng cookie sao chép", async () => {
    const src = NextResponse.next();
    src.cookies.set("sb-gsnuqrutiauhnsacgzym-auth-token.0", "stale", { path: "/" });
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([]), // không phải admin (admin_users trống)
      supabaseResponse: src,
      user: { id: "not-admin" },
    });

    const res = await middleware(makeReq("/", "admin.nooi.net"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin-login");
    // Clear đặt SAU khi sao chép → giá trị rỗng, không bị ghi đè bởi "stale".
    expect(res.cookies.get("sb-gsnuqrutiauhnsacgzym-auth-token.0")?.value).toBe("");
  });
});

describe("middleware eKid host — (3.1) khoá tài khoản con", () => {
  function loggedInChild(status: string | null) {
    updateSessionMock.mockResolvedValue({
      supabase: fakeSupabase([{ id: "kid1", status }]),
      supabaseResponse: new Response(null, { status: 200 }),
      user: { id: "child-user-1" },
    });
  }

  it("con bị khoá vào path học → rewrite sang /ekid/khoa", async () => {
    loggedInChild("khoa");
    const res = await middleware(makeReq("/ekid/hoc/abc"));
    const target = rewriteTarget(res);
    expect(target).not.toBeNull();
    expect(new URL(target!).pathname).toBe("/ekid/khoa");
  });

  it("con bị khoá vào '/' → rewrite sang /ekid/khoa", async () => {
    loggedInChild("khoa");
    const res = await middleware(makeReq("/"));
    const target = rewriteTarget(res);
    expect(target).not.toBeNull();
    expect(new URL(target!).pathname).toBe("/ekid/khoa");
  });

  it("CHO QUA chính /ekid/khoa (tránh vòng lặp rewrite) dù con đang bị khoá", async () => {
    loggedInChild("khoa");
    const res = await middleware(makeReq("/ekid/khoa"));
    expect(rewriteTarget(res)).toBeNull();
    expect(res.status).toBe(200);
  });

  it("con đang active → KHÔNG bị rewrite sang /ekid/khoa", async () => {
    loggedInChild("active");
    const res = await middleware(makeReq("/ekid/hoc/abc"));
    expect(rewriteTarget(res)).toBeNull();
    expect(res.status).toBe(200);
  });

  it("con bị khoá vẫn passthrough /api/ekid/* (route tự lo phía API)", async () => {
    loggedInChild("khoa");
    const res = await middleware(makeReq("/api/ekid/session?kid_id=x"));
    expect(rewriteTarget(res)).toBeNull();
    expect(res.status).toBe(200);
  });
});
