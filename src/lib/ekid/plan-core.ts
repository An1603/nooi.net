/**
 * Lõi sinh lịch học + thang gợi ý cho eKid M1 (lớp 3). Hàm thuần, không I/O.
 *
 * Nguyên tắc (xem đặc tả M1):
 *  - Mở phiên bằng ôn cũ trước, bài mới sau. Không bao giờ mở bằng "con muốn học gì".
 *  - Ôn giãn cách 1 → 3 → 7 → 21 ngày.
 *  - Mỗi ngày tối đa 1 bài mới; phần còn lại là ôn/bổ trợ.
 *  - Thang gợi ý 4 bậc do server quyết, không cho client tự tăng.
 */

export type PlanKind = "on_cu" | "bai_moi" | "kiem_tra" | "bo_tro";

export interface ReviewCandidate {
  objectiveId: string;
  stage: number; // 1..4
  lastResult: boolean | null;
}

export interface LessonCandidate {
  id: string;
  objectiveIds: string[];
  estMinutes: number;
  done: boolean;
}

export interface PlanSlot {
  slot: number;
  kind: PlanKind;
  lessonId: string | null;
  objectiveIds: string[];
}

export interface DailyPlanInput {
  reviews: ReviewCandidate[];
  lessons: LessonCandidate[];
  minutesCap: number;
  maxSlots?: number;
}

/** Bậc ôn kế tiếp: 1 → 3 → 7 → 21 ngày; quá bậc 4 thì giữ 21 ngày. */
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 21] as const;

export function nextReviewStage(stage: number): number {
  if (!Number.isFinite(stage)) return 1;
  return Math.min(Math.max(Math.trunc(stage), 1), REVIEW_INTERVAL_DAYS.length);
}

export function reviewIntervalDays(stage: number): number {
  const i = nextReviewStage(stage) - 1;
  return REVIEW_INTERVAL_DAYS[i];
}

/** Ngày ôn kế tiếp tính từ hôm nay (theo giờ VN, chỉ phần ngày). */
export function nextReviewDate(today: string, stage: number): string {
  const [y, m, d] = today.split("-").map(Number);
  const base = Date.UTC(y, (m ?? 1) - 1, d ?? 1);
  const next = new Date(base + reviewIntervalDays(stage) * 86_400_000);
  return next.toISOString().slice(0, 10);
}

/**
 * Sai một câu thì quay về bậc 1 (ôn lại sớm), đúng thì tiến một bậc.
 * Đây là "desirable difficulty": sai phải gặp lại nhanh, đúng thì giãn ra.
 */
export function stageAfterResult(stage: number, correct: boolean): number {
  if (!correct) return 1;
  return Math.min(stage + 1, REVIEW_INTERVAL_DAYS.length);
}

/**
 * Sinh lịch một ngày. Thứ tự bắt buộc: ôn cũ → (tuỳ chỗ) bổ trợ → tối đa 1 bài mới.
 * Trả về tối đa `maxSlots` mục (mặc định 3) và không vượt trần phút.
 */
export function buildDailyPlan(input: DailyPlanInput): PlanSlot[] {
  const maxSlots = input.maxSlots ?? 3;
  const slots: PlanSlot[] = [];
  const usedObjectives = new Set<string>();

  // 1) Ôn: ưu tiên bậc thấp (gần quên nhất), rồi tới câu từng sai.
  const sortedReviews = [...input.reviews].sort((a, b) => {
    const lastA = a.lastResult === false ? 0 : 1;
    const lastB = b.lastResult === false ? 0 : 1;
    if (lastA !== lastB) return lastA - lastB;
    return a.stage - b.stage;
  });

  for (const rv of sortedReviews) {
    if (slots.length >= maxSlots - 1) break; // luôn chừa 1 chỗ cho bài mới
    if (usedObjectives.has(rv.objectiveId)) continue;
    const lesson = input.lessons.find((l) => l.objectiveIds.includes(rv.objectiveId));
    slots.push({
      slot: slots.length + 1,
      kind: lesson ? "on_cu" : "bo_tro",
      lessonId: lesson?.id ?? null,
      objectiveIds: [rv.objectiveId],
    });
    usedObjectives.add(rv.objectiveId);
  }

  // 2) Bài mới: bài chưa học, cùng YCCĐ chưa dùng, vừa trần phút.
  const newLesson = input.lessons.find(
    (l) => !l.done && l.estMinutes <= input.minutesCap && !l.objectiveIds.some((o) => usedObjectives.has(o)),
  );
  if (newLesson && slots.length < maxSlots) {
    slots.push({
      slot: slots.length + 1,
      kind: "bai_moi",
      lessonId: newLesson.id,
      objectiveIds: newLesson.objectiveIds,
    });
    newLesson.objectiveIds.forEach((o) => usedObjectives.add(o));
  }

  return slots;
}

/** Câu đúng khi KHÔNG dùng gợi ý — chỉ số học thật duy nhất của eKid. */
export interface AttemptLike {
  itemId: string | null;
  correct: boolean | null;
  hintsUsed: number;
}

export function correctWithoutHint(attempts: AttemptLike[]): { correct: number; total: number; rate: number } {
  const graded = attempts.filter((a) => a.correct !== null);
  const correct = graded.filter((a) => a.correct && a.hintsUsed === 0).length;
  const total = graded.length;
  return { correct, total, rate: total === 0 ? 0 : correct / total };
}

/** Bậc gợi ý kế tiếp: 1..4, không vượt 4. */
export function nextHintTier(currentTier: number, maxTier = 4): number {
  if (!Number.isFinite(currentTier) || currentTier < 0) return 1;
  return Math.min(currentTier + 1, maxTier);
}

/** Điều kiện mở cửa kiểm tra: 3 phiên đạt trong cùng một cụm YCCĐ. */
export function canOpenCheckup(passedSessionsInUnit: number): boolean {
  return passedSessionsInUnit >= 3;
}

/** Chấm cửa kiểm tra: đúng ≥ 4/5 và có ít nhất 1 câu giải thích đạt mức 2. */
export function gradeCheckup(input: {
  total: number;
  correct: number;
  explanationScore: number | null;
}): { pass: boolean; score: number } {
  const score = input.total === 0 ? 0 : input.correct / input.total;
  const pass = input.total >= 4 && score >= 0.8 && (input.explanationScore ?? 0) >= 2;
  return { pass, score: Math.round(score * 100) / 100 };
}
