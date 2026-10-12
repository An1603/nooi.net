import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Supabase (không chạm DB thật) ────────────────────────────────────────
const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  kid: null as { id: string; user_id: string | null; child_user_id: string | null } | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: state.kid }),
        }),
      }),
    }),
  }),
}));

import { GET } from "@/app/api/ekid/media/validate/route";

const KID = "11111111-1111-1111-1111-111111111111";
const OWNER = "owner-1";
const CHILD = "child-1";

function makeReq(qs: string): Request {
  return { url: `http://localhost/api/ekid/media/validate?${qs}` } as unknown as Request;
}

beforeEach(() => {
  state.user = { id: OWNER };
  state.kid = { id: KID, user_id: OWNER, child_user_id: CHILD };
});

describe("API /api/ekid/media/validate — quyền (F4)", () => {
  it("chưa đăng nhập → 401", async () => {
    state.user = null;
    const res = await GET(makeReq(`kid_id=${KID}&url=http://cdn.example.com/a.png`));
    expect(res.status).toBe(401);
  });

  it("kid_id sai định dạng → 404", async () => {
    const res = await GET(makeReq(`kid_id=khong-phai-uuid&url=http://cdn.example.com/a.png`));
    expect(res.status).toBe(404);
  });

  it("thiếu kid_id → 404", async () => {
    const res = await GET(makeReq(`url=http://cdn.example.com/a.png`));
    expect(res.status).toBe(404);
  });

  it("hồ sơ không tồn tại → 403", async () => {
    state.kid = null;
    const res = await GET(makeReq(`kid_id=${KID}&url=http://cdn.example.com/a.png`));
    expect(res.status).toBe(403);
  });

  it("người dùng KHÔNG phải chủ hồ sơ / tài khoản con → 403", async () => {
    state.user = { id: "nguoi-la" };
    const res = await GET(makeReq(`kid_id=${KID}&url=http://cdn.example.com/a.png`));
    expect(res.status).toBe(403);
  });

  it("chủ hồ sơ → 200", async () => {
    state.user = { id: OWNER };
    const res = await GET(makeReq(`kid_id=${KID}&url=http://cdn.example.com/a.png`));
    expect(res.status).toBe(200);
  });

  it("tài khoản con → 200", async () => {
    state.user = { id: CHILD };
    const res = await GET(makeReq(`kid_id=${KID}&url=http://cdn.example.com/a.png`));
    expect(res.status).toBe(200);
  });
});

describe("API /api/ekid/media/validate — URL nội bộ (SSRF) → ok:false", () => {
  const internalUrls = [
    "http://127.0.0.1/",
    "http://localhost/secret",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.0.5/x.jpg",
    "http://172.16.0.9/x.jpg",
    "http://192.168.1.1/x.jpg",
    "http://[::1]/x.jpg",
    "http://metadata.google.internal/",
    "http://127.0.0.1:6379/",
  ];

  for (const url of internalUrls) {
    it(`${url} → ok:false`, async () => {
      const res = await GET(makeReq(`kid_id=${KID}&url=${encodeURIComponent(url)}`));
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: boolean; kind: null };
      expect(body.ok).toBe(false);
      expect(body.kind).toBeNull();
    });
  }
});
