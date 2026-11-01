import { describe, expect, it } from "vitest";
import { noiDungNhatKyTrung, quyetDinhLead } from "@/lib/opc/lead";

/**
 * Hồi quy audit run-1 (mục 3): form công khai không được sửa hồ sơ CRM của người khác.
 */
describe("quyetDinhLead", () => {
  it("chưa có lead trùng → tạo mới", () => {
    expect(quyetDinhLead(false, false)).toBe("tao-moi");
    expect(quyetDinhLead(false, true)).toBe("tao-moi");
  });

  it("trùng lead + người gửi ẩn danh → chỉ ghi nhật ký, không sửa hồ sơ", () => {
    expect(quyetDinhLead(true, false)).toBe("chi-ghi-nhat-ky");
  });

  it("trùng lead + người gửi đã đăng nhập → được cập nhật", () => {
    expect(quyetDinhLead(true, true)).toBe("cap-nhat");
  });
});

describe("noiDungNhatKyTrung", () => {
  it("ghi rõ kênh và ghi chú của người gửi", () => {
    const s = noiDungNhatKyTrung("muốn tư vấn gói Pro", "chan-doan");
    expect(s).toContain("chan-doan");
    expect(s).toContain("muốn tư vấn gói Pro");
  });

  it("không có ghi chú vẫn tạo được dòng nhật ký", () => {
    expect(noiDungNhatKyTrung("", "lien-he")).toContain("lien-he");
  });

  it("cắt về 2000 ký tự", () => {
    expect(noiDungNhatKyTrung("x".repeat(5000), "lien-he").length).toBeLessThanOrEqual(2000);
  });
});
