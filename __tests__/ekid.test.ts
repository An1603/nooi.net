import { describe, it, expect } from "vitest";
import {
  calcAge, initialBand, resolvePlacement, remainingMinutes,
  canStartSession, generateLinkCode, BAND_VOICE,
} from "@/lib/ekid/ekid-system";

describe("ekid — calcAge", () => {
  it("tính tuổi theo năm", () => {
    expect(calcAge("2019-05-01", new Date("2026-10-11"))).toBe(7);
  });
  it("chưa tới sinh nhật thì trừ 1", () => {
    expect(calcAge("2019-12-01", new Date("2026-10-11"))).toBe(6);
  });
});

describe("ekid — initialBand", () => {
  it("3-5 tuổi → mầm non", () => { expect(initialBand(4)).toBe("mam-non"); });
  it("6-10 tuổi → tiểu học", () => { expect(initialBand(8)).toBe("tieu-hoc"); });
  it("11-15 tuổi → thiếu niên", () => { expect(initialBand(13)).toBe("thieu-nien"); });
});

describe("ekid — resolvePlacement (định vị động)", () => {
  // Mốc thời gian cố định để test tất định, không phụ thuộc đồng hồ thực.
  const now = new Date("2026-10-11");
  it("điểm test đầu vào cao → nâng band", () => {
    const p = resolvePlacement({ dob: "2019-05-01", entryTestPct: 95, now });
    expect(p.ageBand).toBe("tieu-hoc");
    expect(p.level).toBeGreaterThan(1);
  });
  it("điểm test thấp → giữ band thấp hơn", () => {
    const p = resolvePlacement({ dob: "2019-05-01", entryTestPct: 20, now });
    expect(p.ageBand).toBe("mam-non");
  });
  it("không có test → band theo tuổi", () => {
    expect(resolvePlacement({ dob: "2019-05-01", now }).ageBand).toBe("tieu-hoc");
  });
});

describe("ekid — giới hạn phút", () => {
  it("remainingMinutes", () => { expect(remainingMinutes(25, 10)).toBe(15); });
  it("không âm", () => { expect(remainingMinutes(25, 40)).toBe(0); });
  it("canStartSession", () => {
    expect(canStartSession(25, 20)).toBe(true);
    expect(canStartSession(25, 25)).toBe(false);
  });
});

describe("ekid — generateLinkCode", () => {
  it("6 ký tự, chỉ A-Z0-9, không ký tự dễ nhầm", () => {
    const code = generateLinkCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
});

describe("ekid — BAND_VOICE", () => {
  it("có giọng cho cả 3 band", () => {
    expect(BAND_VOICE["mam-non"]).toBeTruthy();
    expect(BAND_VOICE["tieu-hoc"]).toBeTruthy();
    expect(BAND_VOICE["thieu-nien"]).toBeTruthy();
  });
});
