import type { VoiceOption } from "@/lib/voice/gemini-live";

export type AgeBand = "mam-non" | "tieu-hoc" | "thieu-nien";

export interface Placement {
  ageBand: AgeBand;
  level: number;
}

export interface EkidExercise {
  question: string;
  image_url?: string | null;
  options: string[];
  answer_index: number;
  type: "chon-hinh" | "nghe-chon" | "dem" | "ke-chuyen";
}

export const BAND_VOICE: Record<AgeBand, VoiceOption> = {
  "mam-non": "Leda",
  "tieu-hoc": "Puck",
  "thieu-nien": "Charon",
};

export const BAND_LABEL: Record<AgeBand, string> = {
  "mam-non": "Mầm non",
  "tieu-hoc": "Tiểu học",
  "thieu-nien": "Thiếu niên",
};

function asDate(d: string | Date): Date {
  return d instanceof Date ? d : new Date(d + "T00:00:00Z");
}

export function calcAge(dob: string | Date, now: Date = new Date()): number {
  const b = asDate(dob);
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export function initialBand(age: number): AgeBand {
  if (age <= 5) return "mam-non";
  if (age <= 10) return "tieu-hoc";
  return "thieu-nien";
}

const BAND_ORDER: AgeBand[] = ["mam-non", "tieu-hoc", "thieu-nien"];

export function resolvePlacement(input: {
  dob: string | Date;
  entryTestPct?: number | null;
  recentGoodSessions?: number;
  now?: Date;
}): Placement {
  // `now` là tham số tuỳ chọn để test tất định; mặc định dùng đồng hồ thực.
  const age = calcAge(input.dob, input.now || new Date());
  let idx = BAND_ORDER.indexOf(initialBand(age));

  // Test đầu vào chỉnh định vị (chỉ khi có điểm)
  let level = 1;
  if (input.entryTestPct != null) {
    if (input.entryTestPct >= 85) {
      // vượt trội → nâng cấp độ trong cùng band
      level += 1;
    } else if (input.entryTestPct < 30 && idx > 0) {
      // yếu → xuống band
      idx -= 1;
    }
  }

  // Kết quả học gần đây
  const good = input.recentGoodSessions ?? 0;
  level += Math.floor(good / 3); // cứ 3 phiên tốt +1 level

  return { ageBand: BAND_ORDER[idx], level: Math.max(1, level) };
}

export function remainingMinutes(limitMin: number, usedMin: number): number {
  return Math.max(0, limitMin - usedMin);
}

export function canStartSession(limitMin: number, usedMin: number): boolean {
  return remainingMinutes(limitMin, usedMin) > 0;
}

export function generateLinkCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ I,O,0,1
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** Chuẩn hoá mã liên kết người dùng nhập: bỏ khoảng trắng hai đầu và viết hoa. */
export function normalizeLinkCode(raw: string): string {
  return raw.trim().toUpperCase();
}

// ---------------------------------------------------------------------------
// eKid v2 — username, email nội bộ cho bé, điểm & huy hiệu
// ---------------------------------------------------------------------------

/** Domain email nội bộ cấp cho tài khoản học sinh eKid. */
export const CHILD_EMAIL_DOMAIN = "ekid.nooi.net";

/** Chuẩn hoá tên đăng nhập: bỏ khoảng trắng hai đầu và chuyển về chữ thường. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Kiểm tra tên đăng nhập hợp lệ: 3–20 ký tự thuộc [a-z0-9._].
 * Kiểm tra trên chuỗi gốc (không tự chuẩn hoá) — chữ hoa/khoảng trắng bị coi là không hợp lệ.
 * Dùng normalizeUsername() trước nếu cần chuẩn hoá.
 */
export function isValidUsername(u: string): boolean {
  return /^[a-z0-9._]{3,20}$/.test(u);
}

/** Ghép email nội bộ cho bé từ tên đăng nhập. */
export function childEmail(username: string): string {
  return `${normalizeUsername(username)}@${CHILD_EMAIL_DOMAIN}`;
}

/** Quy đổi điểm bài (thang 100) sang điểm thưởng: 10 điểm bài = 1 điểm, tối thiểu 0. */
export function pointsForScore(score: number): number {
  return Math.max(0, Math.round((Number.isFinite(score) ? score : 0) / 10));
}

const BADGE_MILESTONES = [
  { at: 3, code: "hoc-sinh-cham-chi", label: "Chăm chỉ (3 bài đạt)" },
  { at: 5, code: "hoc-sinh-gioi", label: "Giỏi giang (5 bài đạt)" },
  { at: 10, code: "hoc-sinh-xuat-sac", label: "Xuất sắc (10 bài đạt)" },
];

/** Danh sách huy hiệu đạt được theo số bài đã hoàn thành (mốc 3/5/10). */
export function badgesForProgress(passedLessons: number): { code: string; label: string }[] {
  return BADGE_MILESTONES.filter((m) => passedLessons >= m.at).map((m) => ({
    code: m.code,
    label: m.label,
  }));
}

// ---------------------------------------------------------------------------
// eKid v2.2 — Cài đặt riêng cho từng con (KidSettings, cột JSONB `settings`)
// ---------------------------------------------------------------------------

/** Nguyên tắc học tập: khung giờ, số bài/ngày, thi đạt mới sang bài.
 * Giới hạn phút/ngày dùng DUY NHẤT cột `ekid_kids.daily_limit_min` (không lặp trong đây). */
export interface KidRules {
  allowedFrom: string | null; // "HH:MM" hoặc null = không giới hạn
  allowedTo: string | null;
  maxLessonsPerDay: number;
  requirePassToAdvance: boolean;
}

/** Phần thưởng tuỳ chỉnh do cha/mẹ đặt (tên + điểm quy đổi). */
export interface KidCustomReward {
  label: string;
  points: number;
}

/** Phần thưởng: điểm/bài đạt, mốc huy hiệu, danh sách tuỳ chỉnh. */
export interface KidRewards {
  pointsPerPassedLesson: number;
  badgeMilestones: number[];
  custom: KidCustomReward[];
}

/** Cài đặt đầy đủ của một hồ sơ trẻ. `subjects` rỗng ⇒ không lọc theo môn. */
export interface KidSettings {
  rules: KidRules;
  subjects: string[];
  rewards: KidRewards;
}

/** Giá trị mặc định khi hồ sơ chưa có cài đặt (cột `settings` = `{}`). */
export const DEFAULT_SETTINGS: KidSettings = {
  rules: {
    allowedFrom: null,
    allowedTo: null,
    maxLessonsPerDay: 5,
    requirePassToAdvance: false,
  },
  subjects: [],
  rewards: {
    pointsPerPassedLesson: 1,
    badgeMilestones: [3, 5, 10],
    custom: [],
  },
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function numOr(v: unknown, fallback: number, min: number): number {
  return typeof v === "number" && Number.isFinite(v) && v >= min ? v : fallback;
}

function intOr(v: unknown, fallback: number, min: number): number {
  return typeof v === "number" && Number.isInteger(v) && v >= min ? v : fallback;
}

function boolOr(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function timeOr(v: unknown, fallback: string | null): string | null {
  return typeof v === "string" && TIME_RE.test(v) ? v : fallback;
}

function stringArrayOr(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.filter((x): x is string => typeof x === "string" && x.trim() !== "");
  return out;
}

function milestonesOr(v: unknown): number[] {
  if (!Array.isArray(v) || v.length === 0) return DEFAULT_SETTINGS.rewards.badgeMilestones;
  const out = v.filter(
    (x): x is number => typeof x === "number" && Number.isInteger(x) && x > 0,
  );
  return out.length === v.length ? out : DEFAULT_SETTINGS.rewards.badgeMilestones;
}

function customRewardsOr(v: unknown): KidCustomReward[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(isRecord)
    .map((x) => ({ label: x.label, points: x.points }))
    .filter(
      (x): x is KidCustomReward =>
        typeof x.label === "string" &&
        x.label.trim() !== "" &&
        typeof x.points === "number" &&
        Number.isFinite(x.points) &&
        x.points >= 0,
    );
}

/**
 * Chuẩn hoá cài đặt con đọc từ cột JSONB: merge an toàn với mặc định.
 * Giá trị sai kiểu/không hợp lệ bị thay bằng mặc định tương ứng (không ném lỗi).
 */
export function normalizeKidSettings(raw: unknown): KidSettings {
  const r = isRecord(raw) ? raw : {};
  const rawRules = isRecord(r.rules) ? r.rules : {};
  const rawRewards = isRecord(r.rewards) ? r.rewards : {};

  return {
    rules: {
      allowedFrom: timeOr(rawRules.allowedFrom, DEFAULT_SETTINGS.rules.allowedFrom),
      allowedTo: timeOr(rawRules.allowedTo, DEFAULT_SETTINGS.rules.allowedTo),
      maxLessonsPerDay: intOr(
        rawRules.maxLessonsPerDay,
        DEFAULT_SETTINGS.rules.maxLessonsPerDay,
        0,
      ),
      requirePassToAdvance: boolOr(
        rawRules.requirePassToAdvance,
        DEFAULT_SETTINGS.rules.requirePassToAdvance,
      ),
    },
    subjects: stringArrayOr(r.subjects, DEFAULT_SETTINGS.subjects),
    rewards: {
      pointsPerPassedLesson: numOr(
        rawRewards.pointsPerPassedLesson,
        DEFAULT_SETTINGS.rewards.pointsPerPassedLesson,
        0,
      ),
      badgeMilestones: milestonesOr(rawRewards.badgeMilestones),
      custom: customRewardsOr(rawRewards.custom),
    },
  };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Kiểm tra `now` có nằm trong khung giờ được học không.
 * Nếu thiếu một trong hai đầu (null) ⇒ không giới hạn (luôn true).
 * Khung giờ qua nửa đêm (from > to, vd 20:00–06:00) được xử lý đúng.
 */
/** Múi giờ nghiệp vụ eKid (giờ Việt Nam) — dùng thống nhất cho khung giờ & mốc ngày. */
export const EKID_TZ = "Asia/Ho_Chi_Minh";

/** Chuỗi ngày YYYY-MM-DD theo giờ VN (khoá ngày ekid_daily). */
export function vnDayString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: EKID_TZ }).format(d);
}

/** Thời điểm 00:00 giờ VN của ngày chứa `d` (instant UTC) — mốc đếm buổi trong ngày. */
export function vnDayStart(d: Date = new Date()): Date {
  return new Date(`${vnDayString(d)}T00:00:00+07:00`);
}

/** Số phút trong ngày theo giờ VN (0..1439) — không phụ thuộc TZ của server. */
export function vnMinutes(d: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EKID_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mi = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + mi;
}

export function isWithinAllowedHours(settings: KidSettings, now: Date): boolean {
  const { allowedFrom, allowedTo } = settings.rules;
  if (!allowedFrom || !allowedTo) return true;
  const m = vnMinutes(now);
  const from = toMinutes(allowedFrom);
  const to = toMinutes(allowedTo);
  return from <= to ? m >= from && m <= to : m >= from || m <= to;
}

/** Điểm tối thiểu để coi là ĐẠT một bài (thang 100). */
export const PASS_SCORE = 70;

/** Khoảng hợp lệ cho giới hạn phút/ngày của một hồ sơ (cột `ekid_kids.daily_limit_min`).
 * Cận dưới > 0 để tránh đặt 0 khiến con bị chặn hoàn toàn mà ba/mẹ không nhận ra. */
export const DAILY_LIMIT_MIN = 5;
export const DAILY_LIMIT_MAX = 120;

/** Giới hạn phút/ngày hợp lệ: số nguyên trong [DAILY_LIMIT_MIN, DAILY_LIMIT_MAX]. */
export function isValidDailyLimitMin(v: unknown): v is number {
  return (
    typeof v === "number" &&
    Number.isInteger(v) &&
    v >= DAILY_LIMIT_MIN &&
    v <= DAILY_LIMIT_MAX
  );
}

/**
 * Xác định các bài bị KHOÁ theo nguyên tắc "thi đạt mới sang bài".
 *
 * `orderedLessonIds` phải theo ĐÚNG thứ tự học (sort_order tăng, rồi difficulty).
 * Khi `requirePassToAdvance = false` ⇒ không khoá bài nào (trả Set rỗng).
 * Khi bật: bài ở vị trí i bị khoá nếu bài NGAY TRƯỚC (i-1) chưa đạt
 * (best_score null hoặc < {@link PASS_SCORE}). Bài đầu tiên không bao giờ bị khoá.
 */
export function lockedLessonsByOrder(
  orderedLessonIds: string[],
  bestScoreByLesson: Map<string, number | null>,
  requirePassToAdvance: boolean,
): Set<string> {
  const locked = new Set<string>();
  if (!requirePassToAdvance) return locked;
  for (let i = 1; i < orderedLessonIds.length; i++) {
    const prevScore = bestScoreByLesson.get(orderedLessonIds[i - 1]) ?? null;
    const passed = prevScore != null && prevScore >= PASS_SCORE;
    if (!passed) locked.add(orderedLessonIds[i]);
  }
  return locked;
}

export function buildSystemInstruction(params: {
  kidName: string;
  placement: Placement;
  lessonTopic?: string | null;
  recentNotes?: string | null;
  exercises?: EkidExercise[];
}): string {
  const { kidName, placement, lessonTopic, recentNotes, exercises } = params;
  const band = BAND_LABEL[placement.ageBand];
  const exLines = (exercises ?? [])
    .map((e, i) => `${i + 1}. ${e.question} (đáp án: ${e.options[e.answer_index]})`)
    .join("\n");

  return [
    `Bạn là "eKid" — người bạn AI thân thiết, vui vẻ của bé ${kidName}.`,
    `Bé đang ở trình độ: ${band}, cấp ${placement.level}.`,
    `Luôn nói tiếng Việt, giọng ấm áp, câu ngắn, dùng từ đơn giản phù hợp lứa tuổi.`,
    `Bạn CHỦ ĐỘNG trò chuyện: chào bé, hỏi bé muốn học gì, rồi mời bé làm bài tập.`,
    `Khen ngợi cụ thể khi bé đúng, động viên nhẹ nhàng khi bé sai, KHÔNG chê.`,
    lessonTopic ? `Chủ đề hôm nay: ${lessonTopic}.` : "",
    exLines ? `Các bài tập sẽ hiện trên màn hình (đọc câu hỏi cho bé nghe):\n${exLines}` : "",
    recentNotes ? `Ghi chú về bé từ buổi trước: ${recentNotes}` : "",
    `Mỗi khi ra bài, đọc to câu hỏi và các lựa chọn để bé chọn hoặc nói đáp án.`,
  ].filter(Boolean).join("\n");
}
