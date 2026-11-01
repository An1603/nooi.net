import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/lib/auth/safe-redirect";

/**
 * Hồi quy audit run-1: đích `next`/`redirect`/`fallback` phải là đường dẫn nội bộ.
 * Danh sách payload lấy đúng từ báo cáo (đã chứng minh đổi host trước bản vá).
 */
describe("safeInternalPath", () => {
  const payloads = [
    ".evil.com",
    "@evil.com",
    "//evil.com",
    "\\\\evil.com",
    "https://evil.com/x",
    "http://evil.com",
    "/\\evil.com",
    "/%5Cevil.com",
    "javascript:alert(1)",
    "",
  ];

  it.each(payloads)("chặn %j → fallback", (p) => {
    expect(safeInternalPath(p, "/app")).toBe("/app");
  });

  it("giữ đường dẫn nội bộ hợp lệ", () => {
    expect(safeInternalPath("/admin/users", "/app")).toBe("/admin/users");
    expect(safeInternalPath("/app/journal?tab=1", "/app")).toBe("/app/journal?tab=1");
    expect(safeInternalPath("/u/nguyen-an", "/")).toBe("/u/nguyen-an");
    expect(safeInternalPath("/admin/luot-truy-cap#top", "/")).toBe("/admin/luot-truy-cap#top");
  });

  it("cắt khoảng trắng hai đầu rồi mới kiểm", () => {
    expect(safeInternalPath(" /admin", "/app")).toBe("/admin");
  });

  it("giá trị không phải chuỗi → fallback", () => {
    expect(safeInternalPath(null, "/login")).toBe("/login");
    expect(safeInternalPath(undefined, "/login")).toBe("/login");
    expect(safeInternalPath(123, "/login")).toBe("/login");
  });

  it("kết quả luôn cùng origin khi phân giải", () => {
    const out = safeInternalPath("/admin", "/x");
    expect(new URL(out, "https://nooi.net").origin).toBe("https://nooi.net");
  });
});
