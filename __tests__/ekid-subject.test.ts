import { describe, it, expect } from "vitest";
import {
  SUBJECTS,
  SUBJECT_ORDER,
  SUBJECT_SLUGS,
  subjectMeta,
  subjectShortLabel,
  subjectsForBand,
} from "@/lib/ekid/subject";

describe("ekid subject — danh mục chủ đề", () => {
  it("slug không trùng và đều không dấu", () => {
    expect(new Set(SUBJECT_SLUGS).size).toBe(SUBJECT_SLUGS.length);
    for (const slug of SUBJECT_SLUGS) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("mỗi chủ đề có nhãn, nhãn ngắn và emoji", () => {
    for (const s of SUBJECTS) {
      expect(s.label.trim().length).toBeGreaterThan(0);
      expect(s.short.trim().length).toBeGreaterThan(0);
      expect(s.short.length).toBeLessThanOrEqual(14);
      expect(s.emoji.trim().length).toBeGreaterThan(0);
      expect(s.bands.length).toBeGreaterThan(0);
    }
  });

  it("mọi slug trong thứ tự hiển thị đều tồn tại và đúng lứa tuổi", () => {
    for (const [band, slugs] of Object.entries(SUBJECT_ORDER)) {
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const slug of slugs) {
        const meta = subjectMeta(slug);
        expect(meta, `slug "${slug}" phải có trong SUBJECTS`).not.toBeNull();
        // Không được xếp chủ đề vào lứa tuổi mà nó không phục vụ.
        expect(meta?.bands).toContain(band);
      }
    }
  });
});

describe("ekid subject — tra cứu", () => {
  it("subjectMeta trả đúng chủ đề; slug lạ/trống → null", () => {
    expect(subjectMeta("toan")?.short).toBe("Toán");
    expect(subjectMeta("chu-cai")?.emoji).toBe("🔤");
    expect(subjectMeta("khong-ton-tai")).toBeNull();
    expect(subjectMeta(null)).toBeNull();
    expect(subjectMeta("")).toBeNull();
  });

  it("subjectsForBand trả đúng thứ tự của từng lứa", () => {
    const mamNon = subjectsForBand("mam-non").map((s) => s.slug);
    expect(mamNon[0]).toBe("chu-cai");
    expect(mamNon).toContain("so-dem");
    expect(mamNon).not.toContain("toan");

    const thieuNien = subjectsForBand("thieu-nien").map((s) => s.slug);
    expect(thieuNien).toContain("tin-hoc-ai");
    expect(thieuNien).not.toContain("chu-cai");

    expect(subjectsForBand(null)).toEqual([]);
  });

  it("subjectShortLabel: slug hợp lệ → nhãn ngắn; slug lạ → giữ nguyên; trống → null", () => {
    expect(subjectShortLabel("tieng-viet")).toBe("Tiếng Việt");
    expect(subjectShortLabel("mon-moi")).toBe("mon-moi");
    expect(subjectShortLabel("   ")).toBeNull();
    expect(subjectShortLabel(undefined)).toBeNull();
  });
});
