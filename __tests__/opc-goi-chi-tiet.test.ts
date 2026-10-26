import { describe, it, expect } from "vitest";
import { CHI_TIET_GOI, chiTietCuaGoi } from "@/lib/opc/goi-chi-tiet";

// Danh mục đang bán trên `opc_goi` (10 gói). Nếu thêm gói mới mà quên nội dung,
// test này phải đỏ trước khi deploy.
const MA_DANH_MUC = [
  "khoi-tao",
  "chuan-hoa",
  "membership",
  "pro",
  "ai-agent",
  "retreat",
  "launch",
  "residency",
  "partner",
  "certified",
] as const;

describe("OPC — nội dung trang chi tiết gói", () => {
  it("có nội dung cho đủ 10 gói đang bán", () => {
    for (const ma of MA_DANH_MUC) {
      expect(CHI_TIET_GOI[ma], `thiếu nội dung cho ${ma}`).toBeTruthy();
      expect(chiTietCuaGoi(ma)).not.toBeNull();
    }
  });

  it("không có nội dung mồ côi (mã không nằm trong danh mục)", () => {
    for (const ma of Object.keys(CHI_TIET_GOI)) {
      expect(MA_DANH_MUC as readonly string[]).toContain(ma);
    }
  });

  it("mỗi gói đủ cấu trúc tối thiểu để thuyết phục", () => {
    for (const ma of MA_DANH_MUC) {
      const ct = CHI_TIET_GOI[ma];
      expect(ct.dinhVi.length, `${ma}: định vị quá ngắn`).toBeGreaterThan(60);
      expect(ct.phuHop.length, `${ma}: cần ≥3 dấu hiệu phù hợp`).toBeGreaterThanOrEqual(3);
      expect(ct.khongPhuHop.length, `${ma}: cần ≥2 điểm chưa phù hợp`).toBeGreaterThanOrEqual(2);
      expect(ct.dauRa, `${ma}: cần đúng 3 đầu ra`).toHaveLength(3);
      expect(ct.noiDung.length, `${ma}: cần ≥4 cấu phần`).toBeGreaterThanOrEqual(4);
      expect(ct.cachHoatDong.length, `${ma}: cần ≥4 bước`).toBeGreaterThanOrEqual(4);
      expect(ct.chinhSach.length, `${ma}: cần ≥2 chính sách`).toBeGreaterThanOrEqual(2);
      expect(ct.faq.length, `${ma}: cần ≥4 câu hỏi`).toBeGreaterThanOrEqual(4);
      expect(ct.soSanh.length, `${ma}: cần ≥1 gói so sánh`).toBeGreaterThanOrEqual(1);
      expect(ct.thoiGian.trim().length).toBeGreaterThan(0);
      expect(ct.hinhThuc.trim().length).toBeGreaterThan(0);
    }
  });

  it("gói so sánh trỏ tới mã có thật và không tự trỏ chính mình", () => {
    for (const ma of MA_DANH_MUC) {
      for (const item of CHI_TIET_GOI[ma].soSanh) {
        expect(MA_DANH_MUC as readonly string[]).toContain(item.ma);
        expect(item.ma).not.toBe(ma);
        expect(item.moTa.length).toBeGreaterThan(20);
      }
    }
  });
});
