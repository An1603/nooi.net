import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Kiểm logic cổng `requireAdmin` — hai nhánh quyết định:
 *  - có phiên + có dòng trong admin_users  → trả hồ sơ quản trị
 *  - thiếu phiên / không có dòng / lỗi query → null (chặn)
 */

const getUserMock = vi.fn();
const maybeSingleMock = vi.fn();
const fromMock = vi.fn(() => ({
  select: () => ({
    eq: () => ({ maybeSingle: maybeSingleMock }),
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  }),
}));

import { requireAdmin, requireAdminRole } from "@/lib/admin/guard";

beforeEach(() => {
  getUserMock.mockReset();
  maybeSingleMock.mockReset();
  fromMock.mockClear();
});

describe("requireAdmin", () => {
  it("không có phiên → null, không truy vấn admin_users", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect(await requireAdmin()).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("có phiên nhưng không có trong admin_users → null", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1", email: "u1@nooi.net" } } });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    expect(await requireAdmin()).toBeNull();
  });

  it("query lỗi → null (fail-closed), không cho qua", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    maybeSingleMock.mockResolvedValue({ data: { user_id: "u1" }, error: { message: "boom" } });
    expect(await requireAdmin()).toBeNull();
  });

  it("admin hợp lệ → trả userId/email/role", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1", email: "fallback@nooi.net" } } });
    maybeSingleMock.mockResolvedValue({
      data: { user_id: "u1", email: "an@nooi.net", role: "super_admin" },
      error: null,
    });
    expect(await requireAdmin()).toEqual({
      userId: "u1",
      email: "an@nooi.net",
      role: "super_admin",
    });
  });
});

describe("requireAdminRole", () => {
  beforeEach(() => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u2" } } });
  });

  it("đúng vai trò → cho qua", async () => {
    maybeSingleMock.mockResolvedValue({ data: { role: "super_admin" }, error: null });
    expect(await requireAdminRole("super_admin")).not.toBeNull();
  });

  it("sai vai trò → null", async () => {
    maybeSingleMock.mockResolvedValue({ data: { role: "moderator" }, error: null });
    expect(await requireAdminRole("super_admin")).toBeNull();
  });

  it("không có vai trò → null", async () => {
    maybeSingleMock.mockResolvedValue({ data: { role: null }, error: null });
    expect(await requireAdminRole("admin")).toBeNull();
  });
});
