import { describe, it, expect } from "vitest";
import {
  CHILD_EMAIL_DOMAIN,
  normalizeUsername,
  isValidUsername,
  childEmail,
  pointsForScore,
  badgesForProgress,
} from "@/lib/ekid/ekid-system";

describe("ekid v2 — username", () => {
  it("normalize → trim + lowercase", () => {
    expect(normalizeUsername("  BeBo  ")).toBe("bebo");
  });
  it("hợp lệ 3-20 ký tự a-z0-9._", () => {
    expect(isValidUsername("bebo")).toBe(true);
    expect(isValidUsername("be.bo_1")).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("BeBo")).toBe(false);
    expect(isValidUsername("be- bo")).toBe(false);
  });
  it("childEmail ghép domain nội bộ", () => {
    expect(childEmail("BeBo")).toBe("bebo@ekid.nooi.net");
  });
  it("CHILD_EMAIL_DOMAIN đúng", () => {
    expect(CHILD_EMAIL_DOMAIN).toBe("ekid.nooi.net");
  });
});

describe("ekid v2 — điểm & huy hiệu", () => {
  it("pointsForScore", () => {
    expect(pointsForScore(100)).toBe(10);
    expect(pointsForScore(0)).toBe(0);
    expect(pointsForScore(-5)).toBe(0);
  });
  it("badgesForProgress mốc 3/5/10", () => {
    expect(badgesForProgress(0).length).toBe(0);
    expect(badgesForProgress(3).length).toBe(1);
    expect(badgesForProgress(5).length).toBe(2);
    expect(badgesForProgress(10).length).toBe(3);
  });
});