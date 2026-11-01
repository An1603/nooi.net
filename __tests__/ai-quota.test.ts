import { describe, expect, it } from "vitest";
import { GIOI_HAN_TIN_NGAY, NGUONG_CANH_BAO, ngayVietNam, taoHanMuc } from "@/lib/ai/quota";

describe("ngayVietNam", () => {
  it("00:00 giờ Việt Nam đã sang ngày mới (UTC vẫn là hôm trước)", () => {
    expect(ngayVietNam(new Date("2026-11-01T16:59:00Z"))).toBe("2026-11-01");
    expect(ngayVietNam(new Date("2026-11-01T17:00:00Z"))).toBe("2026-11-02");
  });

  it("giữa trưa giờ Việt Nam", () => {
    expect(ngayVietNam(new Date("2026-11-01T05:00:00Z"))).toBe("2026-11-01");
  });
});

describe("taoHanMuc", () => {
  it("chưa gần hạn mức thì không nhắc", () => {
    const hm = taoHanMuc(79);
    expect(hm.remaining).toBe(21);
    expect(hm.canhBao).toBe(false);
    expect(hm.thongDiep).toBeUndefined();
  });

  it("còn đúng ngưỡng 20 tin thì bắt đầu nhắc", () => {
    const hm = taoHanMuc(GIOI_HAN_TIN_NGAY - NGUONG_CANH_BAO);
    expect(hm.remaining).toBe(NGUONG_CANH_BAO);
    expect(hm.canhBao).toBe(true);
    expect(hm.thongDiep).toContain("20/100");
  });

  it("hết hạn mức thì báo hết và nhắc mốc làm mới", () => {
    const hm = taoHanMuc(100);
    expect(hm.remaining).toBe(0);
    expect(hm.canhBao).toBe(true);
    expect(hm.thongDiep).toContain("00:00");
  });

  it("vượt hạn mức không trả số âm", () => {
    expect(taoHanMuc(137).remaining).toBe(0);
    expect(taoHanMuc(-5).used).toBe(0);
  });
});
