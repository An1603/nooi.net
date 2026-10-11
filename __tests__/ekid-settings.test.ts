import { describe, it, expect } from "vitest";
import {
  DEFAULT_SETTINGS,
  normalizeKidSettings,
  isWithinAllowedHours,
  lockedLessonsByOrder,
  PASS_SCORE,
  isValidDailyLimitMin,
  DAILY_LIMIT_MIN,
  DAILY_LIMIT_MAX,
  type KidSettings,
} from "@/lib/ekid/ekid-system";

describe("normalizeKidSettings", () => {
  it("raw rỗng (null/undefined/không phải object) → toàn bộ giá trị mặc định", () => {
    expect(normalizeKidSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeKidSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeKidSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(normalizeKidSettings("chuỗi hỏng")).toEqual(DEFAULT_SETTINGS);
    expect(normalizeKidSettings(42)).toEqual(DEFAULT_SETTINGS);
  });

  it("trả về object mới (không phải chính DEFAULT_SETTINGS — tránh sửa nhầm)", () => {
    const a = normalizeKidSettings(null);
    expect(a).not.toBe(DEFAULT_SETTINGS);
    expect(a.rules).not.toBe(DEFAULT_SETTINGS.rules);
    expect(a.rewards).not.toBe(DEFAULT_SETTINGS.rewards);
  });

  it("merge một phần: chỉ ghi đè trường hợp lệ, giữ mặc định phần còn lại", () => {
    const out = normalizeKidSettings({
      rules: { allowedFrom: "07:30" },
      subjects: ["toan", "tieng-viet"],
    });
    expect(out.rules.allowedFrom).toBe("07:30");
    // Giữ mặc định các trường không truyền
    expect(out.rules.allowedTo).toBe(DEFAULT_SETTINGS.rules.allowedTo);
    expect(out.rules.maxLessonsPerDay).toBe(DEFAULT_SETTINGS.rules.maxLessonsPerDay);
    expect(out.rules.requirePassToAdvance).toBe(DEFAULT_SETTINGS.rules.requirePassToAdvance);
    expect(out.subjects).toEqual(["toan", "tieng-viet"]);
    expect(out.rewards).toEqual(DEFAULT_SETTINGS.rewards);
  });

  it("chặn giá trị sai kiểu → rơi về mặc định", () => {
    const out = normalizeKidSettings({
      rules: {
        allowedFrom: "7h30" as unknown as string, // sai định dạng HH:MM
        maxLessonsPerDay: -5 as unknown as number,
        requirePassToAdvance: "có" as unknown as boolean,
      },
      subjects: "toan" as unknown as string[], // không phải mảng
      rewards: {
        pointsPerPassedLesson: NaN as unknown as number,
        badgeMilestones: ["a", 3] as unknown as number[],
        custom: [{ label: "kem", points: 10 }, { bad: true } as unknown as { label: string; points: number }],
      },
    });
    expect(out.rules.allowedFrom).toBeNull();
    expect(out.rules.maxLessonsPerDay).toBe(DEFAULT_SETTINGS.rules.maxLessonsPerDay);
    expect(out.rules.requirePassToAdvance).toBe(DEFAULT_SETTINGS.rules.requirePassToAdvance);
    expect(out.subjects).toEqual([]);
    expect(out.rewards.pointsPerPassedLesson).toBe(
      DEFAULT_SETTINGS.rewards.pointsPerPassedLesson,
    );
    expect(out.rewards.badgeMilestones).toEqual(DEFAULT_SETTINGS.rewards.badgeMilestones);
    // custom: giữ mục hợp lệ, bỏ mục hỏng
    expect(out.rewards.custom).toEqual([{ label: "kem", points: 10 }]);
  });

  it("giữ mốc huy hiệu & custom hợp lệ", () => {
    const out = normalizeKidSettings({
      rewards: {
        badgeMilestones: [2, 4, 8],
        custom: [{ label: "Xem phim", points: 20 }],
      },
    });
    expect(out.rewards.badgeMilestones).toEqual([2, 4, 8]);
    expect(out.rewards.custom).toEqual([{ label: "Xem phim", points: 20 }]);
  });
});

describe("isWithinAllowedHours", () => {
  const base: KidSettings = DEFAULT_SETTINGS;

  it("khung giờ null → luôn cho phép", () => {
    expect(isWithinAllowedHours(base, new Date(2026, 0, 1, 3, 0))).toBe(true);
    expect(isWithinAllowedHours(base, new Date(2026, 0, 1, 23, 59))).toBe(true);
  });

  it("chỉ cần một đầu null → luôn cho phép", () => {
    const s: KidSettings = {
      ...base,
      rules: { ...base.rules, allowedFrom: "08:00", allowedTo: null },
    };
    expect(isWithinAllowedHours(s, new Date(2026, 0, 1, 2, 0))).toBe(true);
  });

  it("trong khoảng (08:00–11:00)", () => {
    const s: KidSettings = {
      ...base,
      rules: { ...base.rules, allowedFrom: "08:00", allowedTo: "11:00" },
    };
    expect(isWithinAllowedHours(s, new Date(2026, 0, 1, 9, 30))).toBe(true);
    expect(isWithinAllowedHours(s, new Date(2026, 0, 1, 8, 0))).toBe(true); // biên đầu
    expect(isWithinAllowedHours(s, new Date(2026, 0, 1, 11, 0))).toBe(true); // biên cuối
  });

  it("ngoài khoảng (08:00–11:00)", () => {
    const s: KidSettings = {
      ...base,
      rules: { ...base.rules, allowedFrom: "08:00", allowedTo: "11:00" },
    };
    expect(isWithinAllowedHours(s, new Date(2026, 0, 1, 7, 59))).toBe(false);
    expect(isWithinAllowedHours(s, new Date(2026, 0, 1, 11, 1))).toBe(false);
    expect(isWithinAllowedHours(s, new Date(2026, 0, 1, 20, 0))).toBe(false);
  });

  it("qua nửa đêm (20:00–06:00)", () => {
    const s: KidSettings = {
      ...base,
      rules: { ...base.rules, allowedFrom: "20:00", allowedTo: "06:00" },
    };
    expect(isWithinAllowedHours(s, new Date(2026, 0, 1, 21, 0))).toBe(true); // tối
    expect(isWithinAllowedHours(s, new Date(2026, 0, 1, 5, 30))).toBe(true); // sáng sớm
    expect(isWithinAllowedHours(s, new Date(2026, 0, 1, 12, 0))).toBe(false); // giữa trưa
    expect(isWithinAllowedHours(s, new Date(2026, 0, 1, 19, 0))).toBe(false);
  });
});

describe("lockedLessonsByOrder", () => {
  const ids = ["l1", "l2", "l3", "l4"];
  function scores(pairs: Record<string, number | null>) {
    return new Map(Object.entries(pairs));
  }

  it("requirePassToAdvance = false → không khoá bài nào", () => {
    const out = lockedLessonsByOrder(ids, scores({}), false);
    expect(out.size).toBe(0);
  });

  it("bài đầu tiên KHÔNG bao giờ bị khoá", () => {
    const out = lockedLessonsByOrder(ids, scores({ l1: null }), true);
    expect(out.has("l1")).toBe(false);
    expect(out.has("l2")).toBe(true); // bài trước (l1) chưa đạt
  });

  it("bài sau mở khi bài NGAY TRƯỚC đã đạt", () => {
    const out = lockedLessonsByOrder(ids, scores({ l1: 80, l2: 75 }), true);
    expect(out.has("l1")).toBe(false);
    expect(out.has("l2")).toBe(false); // l1 đạt
    expect(out.has("l3")).toBe(false); // l2 đạt (75 ≥ 70)
    expect(out.has("l4")).toBe(true); // l3 chưa có điểm
  });

  it("ngưỡng đạt = PASS_SCORE (70): 69 chưa đạt, 70 đạt", () => {
    const below = lockedLessonsByOrder(ids, scores({ l1: PASS_SCORE - 1 }), true);
    expect(below.has("l2")).toBe(true);
    const at = lockedLessonsByOrder(ids, scores({ l1: PASS_SCORE }), true);
    expect(at.has("l2")).toBe(false);
  });

  it("dây chuyền: l1 đạt, l2 chưa có → l3, l4 khoá", () => {
    const out = lockedLessonsByOrder(ids, scores({ l1: 90 }), true);
    expect(out.has("l1")).toBe(false);
    expect(out.has("l2")).toBe(false); // l1 đạt
    expect(out.has("l3")).toBe(true); // l2 chưa đạt
    expect(out.has("l4")).toBe(true); // l3 chưa đạt
  });

  it("danh sách rỗng → Set rỗng", () => {
    expect(lockedLessonsByOrder([], scores({}), true).size).toBe(0);
  });
});

describe("isValidDailyLimitMin", () => {
  it("nhận số nguyên trong [MIN, MAX]", () => {
    expect(isValidDailyLimitMin(DAILY_LIMIT_MIN)).toBe(true);
    expect(isValidDailyLimitMin(30)).toBe(true);
    expect(isValidDailyLimitMin(DAILY_LIMIT_MAX)).toBe(true);
  });

  it("từ chối 0 (chặn con hoàn toàn) và số ngoài khoảng", () => {
    expect(isValidDailyLimitMin(0)).toBe(false);
    expect(isValidDailyLimitMin(DAILY_LIMIT_MIN - 1)).toBe(false);
    expect(isValidDailyLimitMin(DAILY_LIMIT_MAX + 1)).toBe(false);
  });

  it("từ chối giá trị không phải số nguyên / không phải số", () => {
    expect(isValidDailyLimitMin(10.5)).toBe(false);
    expect(isValidDailyLimitMin("30")).toBe(false);
    expect(isValidDailyLimitMin(null)).toBe(false);
    expect(isValidDailyLimitMin(NaN)).toBe(false);
  });
});
