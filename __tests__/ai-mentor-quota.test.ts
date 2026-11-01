import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Hồi quy: /api/ai-mentor/chat yêu cầu phiên + hạn mức 100 tin/ngày.
 * - ẩn danh → 401, không gọi model, không tăng bộ đếm
 * - chạm trần → 429 kèm thông điệp, hoàn lại 1 tin vừa tăng
 * - gần hết → 200 kèm quota.canhBao để UI nhắc
 * - model lỗi → hoàn lại tin (không tính vào hạn mức)
 */

const getSessionUserMock = vi.fn();
vi.mock("@/lib/auth/current-user", () => ({ getSessionUser: () => getSessionUserMock() }));

const rpcMock = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc: (fn: string, args: unknown) => rpcMock(fn, args) }),
}));

const generateMock = vi.fn();
vi.mock("@/lib/ai/gemini-text", () => ({
  generateGeminiText: (...args: unknown[]) => generateMock(...args),
}));

import * as chat from "@/app/api/ai-mentor/chat/route";

function req(message = "hôm nay tôi thấy nặng") {
  return new NextRequest(new URL("https://nooi.net/api/ai-mentor/chat"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

beforeEach(() => {
  getSessionUserMock.mockReset();
  rpcMock.mockReset();
  generateMock.mockReset();
  process.env.GEMINI_API_KEY = "DUMMY";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://stub.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "DUMMY";
});

describe("/api/ai-mentor/chat", () => {
  it("tin nhắn quá dài → 400, không tốn hạn mức", async () => {
    getSessionUserMock.mockResolvedValue({ id: "u1", email: null });
    const res = await chat.POST(req("x".repeat(4001)));
    expect(res.status).toBe(400);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("ẩn danh → 401, không tăng bộ đếm", async () => {
    getSessionUserMock.mockResolvedValue(null);
    const res = await chat.POST(req());
    expect(res.status).toBe(401);
    expect(rpcMock).not.toHaveBeenCalled();
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("tin thứ 101 → 429 và hoàn lại tin vừa tăng", async () => {
    getSessionUserMock.mockResolvedValue({ id: "u1", email: null });
    rpcMock.mockImplementation(async (fn: string) =>
      fn === "tang_ai_usage" ? { data: 101, error: null } : { data: 100, error: null }
    );
    const res = await chat.POST(req());
    expect(res.status).toBe(429);
    expect((await res.json()).error).toContain("100 tin");
    expect(rpcMock).toHaveBeenCalledWith("giam_ai_usage", expect.objectContaining({ p_user: "u1" }));
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("gần hết hạn mức → 200 kèm cảnh báo để UI nhắc", async () => {
    getSessionUserMock.mockResolvedValue({ id: "u1", email: null });
    rpcMock.mockResolvedValue({ data: 95, error: null });
    generateMock.mockResolvedValue("Bạn đang ở trạng thái THẤY.");
    const res = await chat.POST(req());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.reply).toContain("THẤY");
    expect(body.quota).toMatchObject({ used: 95, limit: 100, remaining: 5, canhBao: true });
    expect(body.quota.thongDiep).toContain("5/100");
  });

  it("model lỗi → hoàn lại tin, trả 500", async () => {
    getSessionUserMock.mockResolvedValue({ id: "u1", email: null });
    rpcMock.mockResolvedValue({ data: 12, error: null });
    generateMock.mockRejectedValue(new Error("quota exceeded"));
    const res = await chat.POST(req());
    expect(res.status).toBe(500);
    expect(rpcMock).toHaveBeenCalledWith("giam_ai_usage", expect.objectContaining({ p_user: "u1" }));
  });

  it("không đọc được hạn mức → 503, không gọi model", async () => {
    getSessionUserMock.mockResolvedValue({ id: "u1", email: null });
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    const res = await chat.POST(req());
    expect(res.status).toBe(503);
    expect(generateMock).not.toHaveBeenCalled();
  });
});
