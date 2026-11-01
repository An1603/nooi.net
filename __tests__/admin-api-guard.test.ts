import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Hồi quy cho lỗi audit run-1 (01/11/2026): 13 route /api/admin/** chạy bằng
 * service-role mà KHÔNG kiểm người gọi. Bài kiểm này gọi thẳng handler với
 * `requireAdmin()` trả null (không phiên / không có trong admin_users) và đòi 403.
 *
 * Nếu ai đó thêm handler mới mà quên cổng, chỉ cần thêm vào danh sách dưới đây.
 */

const requireAdminMock = vi.fn();
vi.mock("@/lib/admin/guard", () => ({
  requireAdmin: () => requireAdminMock(),
  requireAdminRole: () => requireAdminMock(),
}));

import * as activity from "@/app/api/admin/activity/route";
import * as brand from "@/app/api/admin/brand/route";
import * as brandFiles from "@/app/api/admin/brand/files/route";
import * as documents from "@/app/api/admin/documents/route";
import * as learning from "@/app/api/admin/learning/route";
import * as lessons from "@/app/api/admin/lessons/route";
import * as live from "@/app/api/admin/live/route";
import * as mentors from "@/app/api/admin/mentors/route";
import * as roles from "@/app/api/admin/roles/route";
import * as users from "@/app/api/admin/users/route";
import * as userDetail from "@/app/api/admin/users/[id]/route";
import * as userStats from "@/app/api/admin/users/stats/route";
import * as generateReports from "@/app/api/admin/users/[id]/generate-reports/route";

function req(method = "GET", path = "https://nooi.net/api/admin/x", body?: unknown) {
  return new NextRequest(new URL(path), {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const params = { params: Promise.resolve({ id: "11111111-2222-3333-4444-555555555555" }) };

beforeEach(() => {
  requireAdminMock.mockReset();
});

describe("API quản trị — khách không có quyền bị chặn 403", () => {
  it("mọi handler trả 403 khi requireAdmin() = null", async () => {
    requireAdminMock.mockResolvedValue(null);
    const calls: Array<[string, () => Promise<Response>]> = [
      ["activity GET", () => activity.GET()],
      ["brand GET", () => brand.GET()],
      ["brand PUT", () => brand.PUT(req("PUT", undefined, { key: "logo" }))],
      ["brand/files GET", () => brandFiles.GET()],
      ["brand/files DELETE", () => brandFiles.DELETE(req("DELETE", "https://nooi.net/api/admin/brand/files?path=a.png"))],
      ["documents GET", () => documents.GET(req())],
      ["learning GET", () => learning.GET()],
      ["lessons GET", () => lessons.GET()],
      ["lessons POST", () => lessons.POST(req("POST", undefined, { title: "x" }))],
      ["live GET", () => live.GET()],
      ["live POST", () => live.POST(req("POST", undefined, { title: "x" }))],
      ["mentors GET", () => mentors.GET()],
      ["mentors POST", () => mentors.POST(req("POST", undefined, { name: "x" }))],
      ["roles GET", () => roles.GET()],
      ["roles POST", () => roles.POST(req("POST", undefined, { action: "assign", user_id: "u", role: "admin" }))],
      ["users GET", () => users.GET()],
      ["users POST", () => users.POST(req("POST", undefined, { email: "a@b.c" }))],
      ["users/[id] GET", () => userDetail.GET(req(), params)],
      ["users/[id] PUT", () => userDetail.PUT(req("PUT", undefined, {}), params)],
      ["users/[id] DELETE", () => userDetail.DELETE(req("DELETE"), params)],
      ["users/stats GET", () => userStats.GET(req())],
      ["users/[id]/generate-reports POST", () => generateReports.POST(req("POST"), params)],
    ];

    for (const [name, call] of calls) {
      const res = await call();
      expect(res.status, name).toBe(403);
    }
  });

  it("không có handler nào dưới /api/admin thiếu cổng quyền", async () => {
    // Quét mã nguồn: mỗi file route dưới src/app/api/admin phải có ít nhất một
    // lời gọi cổng (requireAdmin/requireAdminRole) hoặc cổng cục bộ currentAdmin/laQuanTri.
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const root = path.resolve(process.cwd(), "src/app/api/admin");
    const files: string[] = [];
    async function walk(dir: string) {
      for (const e of await fs.readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) await walk(p);
        else if (e.name === "route.ts") files.push(p);
      }
    }
    await walk(root);
    expect(files.length).toBeGreaterThanOrEqual(20);
    for (const f of files) {
      const src = await fs.readFile(f, "utf8");
      expect(
        /requireAdmin\(|requireAdminRole\(|currentAdmin\(\)|laQuanTri\(\)/.test(src),
        `${f} thiếu cổng phân quyền`,
      ).toBe(true);
    }
  });
});
