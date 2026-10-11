import { describe, it, expect } from "vitest";
import {
  DEFAULT_SETTINGS,
  normalizeKidSettings,
  isWithinAllowedHours,
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
      rules: { dailyLimitMin: 45, allowedFrom: "07:30" },
      subjects: ["toan", "tieng-viet"],
    });
    expect(out.rules.dailyLimitMin).toBe(45);
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
        dailyLimitMin: "ba mươi" as unknown as number,
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
    expect(out.rules.dailyLimitMin).toBe(DEFAULT_SETTINGS.rules.dailyLimitMin);
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
