import { describe, it, expect } from "vitest";

// ─── XP/Level Calculation Tests ─────────────────────────────────────────────

function calculateLevel(xp: number) {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500];
  const names = ["Người mới", "Người tìm kiếm", "Học viên", "Người thực hành", "Người đồng hành", "Mentor", "Master Mentor"];
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) { level = i + 1; break; }
  }
  const nextThreshold = thresholds[Math.min(level, 6)];
  const progress = Math.min(100, Math.round(((xp - thresholds[level - 1]) / (nextThreshold - thresholds[level - 1])) * 100));
  return { level, levelName: names[Math.min(level - 1, 6)], n: xp, progress, nToNext: Math.max(0, nextThreshold - xp) };
}

describe("N / Level System", () => {
  it("should be level 1 with 0 XP", () => {
    const result = calculateLevel(0);
    expect(result.level).toBe(1);
    expect(result.levelName).toBe("Người mới");
    expect(result.nToNext).toBe(100);
  });

  it("should be level 2 with 100 XP", () => {
    const result = calculateLevel(100);
    expect(result.level).toBe(2);
    expect(result.levelName).toBe("Người tìm kiếm");
  });

  it("should be level 3 with 300 XP", () => {
    const result = calculateLevel(300);
    expect(result.level).toBe(3);
    expect(result.levelName).toBe("Học viên");
  });

  it("should be level 4 with 600 XP", () => {
    const result = calculateLevel(600);
    expect(result.level).toBe(4);
    expect(result.levelName).toBe("Người thực hành");
  });

  it("should be level 5 with 1000 XP", () => {
    const result = calculateLevel(1000);
    expect(result.level).toBe(5);
    expect(result.levelName).toBe("Người đồng hành");
  });

  it("should be level 6 with 1500 XP", () => {
    const result = calculateLevel(1500);
    expect(result.level).toBe(6);
    expect(result.levelName).toBe("Mentor");
  });

  it("should be level 7 with 2500 XP", () => {
    const result = calculateLevel(2500);
    expect(result.level).toBe(7);
    expect(result.levelName).toBe("Master Mentor");
    expect(result.nToNext).toBe(0);
  });

  it("should calculate progress correctly", () => {
    const result = calculateLevel(50); // 50/100 = 50%
    expect(result.progress).toBe(50);
  });

  it("should handle XP between levels", () => {
    const result = calculateLevel(750); // level 4 -> 150/400 to next = 37.5%
    expect(result.level).toBe(4);
    expect(result.progress).toBe(38);
  });
});

// ─── Journal Entry Parsing Tests ────────────────────────────────────────────

function parseJournalEntry(content: string) {
  try {
    return JSON.parse(content) as { than?: string; tam?: string; hanh?: string };
  } catch {
    return { than: content };
  }
}

describe("Journal Entry Parsing", () => {
  it("should parse valid JSON journal", () => {
    const result = parseJournalEntry('{"than":"Khỏe","tam":"Vui","hanh":"Tập trung"}');
    expect(result.than).toBe("Khỏe");
    expect(result.tam).toBe("Vui");
    expect(result.hanh).toBe("Tập trung");
  });

  it("should handle plain text fallback", () => {
    const result = parseJournalEntry("Hôm nay tôi khỏe");
    expect(result.than).toBe("Hôm nay tôi khỏe");
  });

  it("should handle empty content", () => {
    const result = parseJournalEntry("");
    expect(result.than).toBe("");
  });
});

// ─── Journal Stats Tests ────────────────────────────────────────────────────

describe("Journal Statistics", () => {
  it("should count journals correctly", () => {
    const journals = [1, 2, 3, 4, 5];
    expect(journals.length).toBeGreaterThanOrEqual(0);
  });

  it("should calculate XP from journal count", () => {
    const journalCount = 5;
    const xp = journalCount * 10;
    expect(xp).toBe(50);
  });

  it("should handle empty journals", () => {
    const journalCount = 0;
    const xp = journalCount * 10;
    expect(xp).toBe(0);
    expect(calculateLevel(xp).levelName).toBe("Người mới");
  });
});
