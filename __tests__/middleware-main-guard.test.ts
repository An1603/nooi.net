import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Hồi quy cho lỗi audit run-1 (01/11/2026):
 * `publicRoutes` chứa "/" + so khớp startsWith ⇒ cổng chặn ẩn danh của host chính
 * không bao giờ chạy, mở toàn bộ /api/admin/* dùng service-role cho khách vãng lai.
 *
 * Bài kiểm này khoá lại hành vi ĐÚNG: chỉ đường dẫn công khai tường minh mới đi qua.
 */

const updateSessionMock = vi.fn();
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (req: NextRequest) => updateSessionMock(req),
}));

import { middleware } from "@/middleware";

function makeReq(path: string, host = "nooi.net"): NextRequest {
  return new NextRequest(new URL(`https://${host}${path}`), { headers: { host } });
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

describe("middleware host chính — đường dẫn công khai khớp CHÍNH XÁC", () => {
  it("khách vãng lai KHÔNG vào được /api/admin/roles (điều bị lỗi trước đây)", async () => {
    mockSession(null);
    const res = await middleware(makeReq("/api/admin/roles"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("khách vãng lai KHÔNG vào được các API admin khác", async () => {
    mockSession(null);
    for (const p of [
      "/api/admin/users",
      "/api/admin/activity",
      "/api/admin/live",
      "/api/admin/brand",
      "/api/admin/users/stats",
    ]) {
      const res = await middleware(makeReq(p));
      expect(res.status, p).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname, p).toBe("/login");
    }
  });

  it("khách vãng lai KHÔNG vào được /api/migrate* (đã bỏ khỏi danh sách công khai)", async () => {
    mockSession(null);
    for (const p of ["/api/migrate", "/api/migrate-investment", "/api/migrate-mentors"]) {
      const res = await middleware(makeReq(p));
      expect(res.status, p).toBe(307);
    }
  });

  it("khách vãng lai KHÔNG vào được /app/journal", async () => {
    mockSession(null);
    const res = await middleware(makeReq("/app/journal"));
    expect(res.status).toBe(307);
  });

  it("trang chủ / vẫn công khai", async () => {
    mockSession(null);
    const res = await middleware(makeReq("/"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("các mục công khai tường minh vẫn đi qua", async () => {
    mockSession(null);
    for (const p of [
      "/login",
      "/signup",
      "/gallery",
      "/gallery/abc",
      "/u/some-slug",
      "/api/sso/vuon",
      "/api/track",
      "/auth/callback",
      "/auth/confirm",
      "/auth/reset",
      "/auth/refresh-domain?redirect=/admin",
    ]) {
      const res = await middleware(makeReq(p));
      expect(res.status, p).toBe(200);
    }
  });

  it("tài nguyên công khai của trình duyệt/máy tìm kiếm vẫn mở", async () => {
    mockSession(null);
    for (const p of [
      "/manifest.json",
      "/sw.js",
      "/robots.txt",
      "/sitemap.xml",
      "/api/og/profile/abc",
      "/api/ref-code/check?code=ABC",
    ]) {
      const res = await middleware(makeReq(p));
      expect(res.status, p).toBe(200);
    }
  });

  it("đường dẫn chỉ GIỐNG tiền tố công khai không được coi là công khai", async () => {
    mockSession(null);
    // "/u" là công khai nhưng "/users" thì không; "/login" công khai nhưng "/loginx" thì không
    for (const p of ["/users", "/loginx", "/galleryx", "/api/trackx"]) {
      const res = await middleware(makeReq(p));
      expect(res.status, p).toBe(307);
    }
  });
});

describe("middleware host ekid — token giọng nói không cấp cho khách", () => {
  it("khách vãng lai gọi /api/voice/token → 401, không passthrough", async () => {
    mockSession(null);
    const res = await middleware(makeReq("/api/voice/token", "ekid.nooi.net"));
    expect(res.status).toBe(401);
  });

  it("đã đăng nhập gọi /api/voice/token → đi qua", async () => {
    mockSession({ id: "kid-1" });
    const res = await middleware(makeReq("/api/voice/token", "ekid.nooi.net"));
    expect(res.status).toBe(200);
  });
});
