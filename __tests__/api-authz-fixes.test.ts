import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Hồi quy audit run-1 cho 4 lỗi còn mở:
 *  - /api/telegram/send       : chỉ gửi tới chat của CHÍNH người gọi
 *  - /api/telegram/reminder   : chỉ chủ buổi học / quản trị được fan-out + escape HTML
 *  - /api/upload/avatar       : danh tính từ phiên, không từ form
 *  - /api/ref-code/change     : danh tính từ phiên, không từ body
 */

const getSessionUserMock = vi.fn();
const requireAdminMock = vi.fn();
vi.mock("@/lib/auth/current-user", () => ({ getSessionUser: () => getSessionUserMock() }));
vi.mock("@/lib/admin/guard", () => ({
  requireAdmin: () => requireAdminMock(),
  requireAdminRole: () => requireAdminMock(),
}));

type Row = unknown;
/** Hàng đợi kết quả theo từng bảng: mỗi lần await (maybeSingle hoặc then) lấy 1 phần tử. */
const queues: Record<string, Row[]> = {};
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      const next = () => (queues[table] ?? []).shift() ?? null;
      const chain: Record<string, unknown> = {
        select: () => chain,
        insert: () => chain,
        update: () => chain,
        delete: () => chain,
        eq: () => chain,
        neq: () => chain,
        in: () => chain,
        not: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({ data: next(), error: null }),
        then: (res: (v: unknown) => unknown) => res({ data: next(), error: null }),
      };
      return chain;
    },
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "https://cdn.nooi.net/avatars/x.jpg" } }),
      }),
    },
  }),
}));

vi.hoisted(() => {
  process.env.TELEGRAM_BOT_TOKEN = "DUMMY";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://stub.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "DUMMY";
});

import * as telegramSend from "@/app/api/telegram/send/route";
import * as telegramReminder from "@/app/api/telegram/reminder/route";
import * as avatar from "@/app/api/upload/avatar/route";
import * as refCode from "@/app/api/ref-code/change/route";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function jsonReq(body: unknown, path = "https://nooi.net/api/x") {
  return new NextRequest(new URL(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  getSessionUserMock.mockReset();
  requireAdminMock.mockReset();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: { message_id: 7 } }) });
  for (const k of Object.keys(queues)) delete queues[k];
});

describe("/api/telegram/send", () => {
  it("chưa đăng nhập → 401", async () => {
    getSessionUserMock.mockResolvedValue(null);
    const res = await telegramSend.POST(jsonReq({ message: "x" }));
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bỏ qua userId/chatId trong body — chỉ gửi tới chat của chính người gọi", async () => {
    getSessionUserMock.mockResolvedValue({ id: "me", email: "me@nooi.net" });
    queues.profiles = [{ telegram_chat_id: "999" }];
    const res = await telegramSend.POST(
      jsonReq({ message: "xin chào", userId: "victim", chatId: "-1001234567890" })
    );
    expect(res.status).toBe(200);
    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.chat_id).toBe("999");
    expect(sentBody.parse_mode).toBe("HTML");
  });

  it("chưa kết nối Telegram → 404, không gửi", async () => {
    getSessionUserMock.mockResolvedValue({ id: "me", email: null });
    queues.profiles = [{ telegram_chat_id: null }];
    const res = await telegramSend.POST(jsonReq({ message: "x" }));
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("/api/telegram/reminder", () => {
  const session = {
    id: "sess-1",
    user_id: "owner",
    title: "Buổi học",
    content: JSON.stringify({
      description: "<b>x</b>",
      date: "2026-11-02",
      time: "20:00",
      link: "javascript:alert(1)",
    }),
  };

  it("chưa đăng nhập → 401", async () => {
    getSessionUserMock.mockResolvedValue(null);
    const res = await telegramReminder.POST(jsonReq({ sessionId: "sess-1" }));
    expect(res.status).toBe(401);
  });

  it("thành viên không phải chủ buổi học, không phải admin → 403", async () => {
    getSessionUserMock.mockResolvedValue({ id: "other", email: null });
    requireAdminMock.mockResolvedValue(null);
    queues.documents = [session];
    const res = await telegramReminder.POST(jsonReq({ sessionId: "sess-1" }));
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("chủ buổi học: escape HTML và bỏ link sai scheme", async () => {
    getSessionUserMock.mockResolvedValue({ id: "owner", email: null });
    queues.documents = [session, [{ user_id: "u2" }]];
    queues.profiles = [[{ user_id: "u2", telegram_chat_id: "555", full_name: "<i>Bé</i>" }]];
    const res = await telegramReminder.POST(jsonReq({ sessionId: "sess-1" }));
    expect(res.status).toBe(200);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.chat_id).toBe("555");
    expect(sent.text).not.toContain("<b>x</b>");
    expect(sent.text).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(sent.text).not.toContain("javascript:");
  });
});

describe("/api/upload/avatar", () => {
  it("chưa đăng nhập → 401", async () => {
    getSessionUserMock.mockResolvedValue(null);
    const fd = new FormData();
    fd.set("file", new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" }));
    fd.set("user_id", "victim");
    const req = new NextRequest(new URL("https://nooi.net/api/upload/avatar"), {
      method: "POST",
      body: fd,
    });
    const res = await avatar.POST(req);
    expect(res.status).toBe(401);
  });
});

describe("/api/ref-code/change", () => {
  it("chưa đăng nhập → 401", async () => {
    getSessionUserMock.mockResolvedValue(null);
    const res = await refCode.POST(jsonReq({ userId: "victim", newCode: "ABC" }));
    expect(res.status).toBe(401);
  });

  it("userId trong body bị bỏ qua — chỉ đổi mã của chính mình", async () => {
    getSessionUserMock.mockResolvedValue({ id: "me", email: null });
    queues.profiles = [{ ref_code_changes: 0, ref_code: "OLD" }, null, null];
    const res = await refCode.POST(jsonReq({ userId: "victim", newCode: "MOI" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});
