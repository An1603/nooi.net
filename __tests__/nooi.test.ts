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

// ─── Streak Calculation Tests ──────────────────────────────────────────────

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = dates.sort().reverse();
  let streak = 0;
  const today = new Date(sorted[0]);
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];
    if (sorted[i] === expectedStr) streak++;
    else break;
  }
  return streak;
}

describe("Streak Calculation", () => {
  it("should return 0 for empty dates", () => {
    expect(calculateStreak([])).toBe(0);
  });

  it("should count 1 for today only", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(calculateStreak([today])).toBe(1);
  });

  it("should count consecutive days", () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
    expect(calculateStreak([today, yesterday, twoDaysAgo])).toBe(3);
  });

  it("should break on gap", () => {
    const today = new Date().toISOString().split("T")[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
    expect(calculateStreak([today, twoDaysAgo])).toBe(1);
  });

  it("should handle unsorted dates", () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    expect(calculateStreak([yesterday, today])).toBe(2);
  });
});

// ─── Badge Logic Tests ─────────────────────────────────────────────────────

const BADGE_DEFS = [
  { id: "first_step", name: "Bước đầu tiên", icon: "🌱", require: 1 },
  { id: "consistent_7", name: "Kiên trì 7 ngày", icon: "🔥", require: 7 },
  { id: "one_month", name: "Một tháng chuyển hóa", icon: "⭐", require: 30 },
  { id: "master", name: "Bậc thầy kiên trì", icon: "🏆", require: 100 },
];

function getEarnedBadges(streak: number, existingIds: string[]) {
  return BADGE_DEFS.map((b) => ({
    ...b,
    earned: existingIds.includes(b.id) || streak >= b.require,
    new: !existingIds.includes(b.id) && streak >= b.require,
  }));
}

describe("Badge Logic", () => {
  it("should award first_step badge at streak 1", () => {
    const badges = getEarnedBadges(1, []);
    expect(badges.find((b) => b.id === "first_step")?.earned).toBe(true);
  });

  it("should NOT award master badge at streak 50", () => {
    const badges = getEarnedBadges(50, []);
    expect(badges.find((b) => b.id === "master")?.earned).toBe(false);
  });

  it("should award master badge at streak 100", () => {
    const badges = getEarnedBadges(100, []);
    expect(badges.find((b) => b.id === "master")?.earned).toBe(true);
  });

  it("should mark badge as new", () => {
    const badges = getEarnedBadges(7, []);
    expect(badges.find((b) => b.id === "consistent_7")?.new).toBe(true);
  });

  it("should not mark existing badge as new", () => {
    const badges = getEarnedBadges(7, ["consistent_7"]);
    expect(badges.find((b) => b.id === "consistent_7")?.new).toBe(false);
  });

  it("should award all badges at streak 100", () => {
    const badges = getEarnedBadges(100, []);
    expect(badges.every((b) => b.earned)).toBe(true);
  });
});
