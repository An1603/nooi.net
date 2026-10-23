import { describe, expect, it } from "vitest";
import {
  buildDailyPlan,
  canOpenCheckup,
  correctWithoutHint,
  gradeCheckup,
  nextHintTier,
  nextReviewDate,
  reviewIntervalDays,
  stageAfterResult,
} from "@/lib/ekid/plan-core";
import { isCorrectAnswer, normalizeAnswer } from "@/lib/ekid/plan-server";

describe("ôn giãn cách", () => {
  it("đi đúng nhịp 1 → 3 → 7 → 21 ngày", () => {
    expect(reviewIntervalDays(1)).toBe(1);
    expect(reviewIntervalDays(2)).toBe(3);
    expect(reviewIntervalDays(3)).toBe(7);
    expect(reviewIntervalDays(4)).toBe(21);
    expect(reviewIntervalDays(9)).toBe(21);
  });

  it("tính ngày ôn kế tiếp theo giờ VN", () => {
    expect(nextReviewDate("2026-10-23", 1)).toBe("2026-10-24");
    expect(nextReviewDate("2026-10-23", 2)).toBe("2026-10-26");
    expect(nextReviewDate("2026-12-30", 2)).toBe("2027-01-02");
  });

  it("sai thì quay về bậc 1, đúng thì tiến một bậc", () => {
    expect(stageAfterResult(3, false)).toBe(1);
    expect(stageAfterResult(3, true)).toBe(4);
    expect(stageAfterResult(4, true)).toBe(4);
  });
});

describe("sinh lịch ngày", () => {
  const lessons = [
    { id: "l1", objectiveIds: ["TO3.SP.01"], estMinutes: 10, done: false },
    { id: "l2", objectiveIds: ["TO3.SP.05"], estMinutes: 12, done: false },
  ];

  it("ôn cũ trước, tối đa 1 bài mới", () => {
    const plan = buildDailyPlan({
      reviews: [
        { objectiveId: "TO3.SP.01", stage: 2, lastResult: true },
        { objectiveId: "TO3.SP.05", stage: 1, lastResult: false },
      ],
      lessons,
      minutesCap: 20,
    });
    expect(plan[0].kind).toBe("on_cu");
    // câu từng sai được ôn trước
    expect(plan[0].objectiveIds).toEqual(["TO3.SP.05"]);
    expect(plan.filter((s) => s.kind === "bai_moi").length).toBeLessThanOrEqual(1);
  });

  it("không lặp YCCĐ đã dùng và không vượt số mục", () => {
    const plan = buildDailyPlan({
      reviews: [
        { objectiveId: "TO3.SP.01", stage: 1, lastResult: false },
        { objectiveId: "TO3.SP.01", stage: 1, lastResult: false },
      ],
      lessons,
      minutesCap: 20,
      maxSlots: 3,
    });
    expect(plan.length).toBeLessThanOrEqual(3);
    const objs = plan.flatMap((s) => s.objectiveIds);
    expect(new Set(objs).size).toBe(objs.length);
  });

  it("bài quá dài so với trần phút thì không xếp", () => {
    const plan = buildDailyPlan({
      reviews: [],
      lessons: [{ id: "l3", objectiveIds: ["TO3.SP.10"], estMinutes: 25, done: false }],
      minutesCap: 10,
      maxSlots: 2,
    });
    expect(plan).toEqual([]);
  });

  it("bài đã học không được xếp là bài mới", () => {
    const plan = buildDailyPlan({
      reviews: [],
      lessons: [{ id: "l4", objectiveIds: ["TO3.SP.06"], estMinutes: 10, done: true }],
      minutesCap: 20,
    });
    expect(plan).toEqual([]);
  });
});

describe("chỉ số học thật", () => {
  it("chỉ đếm câu đúng khi không dùng gợi ý", () => {
    const r = correctWithoutHint([
      { itemId: "a", correct: true, hintsUsed: 0 },
      { itemId: "b", correct: true, hintsUsed: 2 },
      { itemId: "c", correct: false, hintsUsed: 0 },
      { itemId: "d", correct: null, hintsUsed: 0 },
    ]);
    expect(r).toEqual({ correct: 1, total: 3, rate: 1 / 3 });
  });
});

describe("thang gợi ý", () => {
  it("không vượt bậc 4", () => {
    expect(nextHintTier(0)).toBe(1);
    expect(nextHintTier(3)).toBe(4);
    expect(nextHintTier(4)).toBe(4);
  });
});

describe("cửa kiểm tra", () => {
  it("cần 3 phiên đạt", () => {
    expect(canOpenCheckup(2)).toBe(false);
    expect(canOpenCheckup(3)).toBe(true);
  });

  it("qua khi ≥80% và có giải thích đạt", () => {
    expect(gradeCheckup({ total: 5, correct: 4, explanationScore: 2 }).pass).toBe(true);
    expect(gradeCheckup({ total: 5, correct: 4, explanationScore: 1 }).pass).toBe(false);
    expect(gradeCheckup({ total: 5, correct: 3, explanationScore: 3 }).pass).toBe(false);
  });
});

describe("chấm đáp án nói tiếng Việt", () => {
  it("bỏ dấu, không phân biệt hoa thường", () => {
    expect(normalizeAnswer("Bốn mươi lăm nghìn")).toBe("bon muoi lam nghin");
  });

  it("chấp nhận đáp án đúng và alt", () => {
    const item = { answer: { value: "70 005", alt: ["70005"] } };
    expect(isCorrectAnswer(item, "bảy mươi nghìn không trăm linh năm")).toBe(false);
    expect(isCorrectAnswer(item, "70005")).toBe(true);
    expect(isCorrectAnswer(item, "70 005")).toBe(true);
  });

  it("chấp nhận khi bé nói cả câu có chứa đáp án", () => {
    const item = { answer: { value: "56" } };
    expect(isCorrectAnswer(item, "dạ 56 ạ")).toBe(true);
    expect(isCorrectAnswer(item, "45")).toBe(false);
    expect(isCorrectAnswer(item, "")).toBe(false);
  });
});
