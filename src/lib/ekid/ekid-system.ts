import type { VoiceOption } from "@/lib/voice/gemini-live";
import { toolsPromptSection } from "@/lib/ekid/interactive";

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

/** Giới tính của giáo viên AI — quyết định giọng đọc và cách xưng hô. */
export type TeacherGender = "co" | "thay";

/** Hồ sơ hiển thị của giáo viên AI theo giới tính. */
export const TEACHER_PROFILE: Record<
  TeacherGender,
  { name: string; pronoun: string; role: string }
> = {
  co: { name: "Cô Mây", pronoun: "cô", role: "cô giáo" },
  thay: { name: "Thầy Nắng", pronoun: "thầy", role: "thầy giáo" },
};

/** Giọng NỮ của Gemini Live (dùng khi giáo viên là "cô"). */
export const FEMALE_VOICES: readonly VoiceOption[] = [
  "Leda",
  "Aoede",
  "Kore",
  "Zephyr",
  "Callirrhoe",
  "Sulafat",
];

/** Giọng NAM của Gemini Live (dùng khi giáo viên là "thầy"). */
export const MALE_VOICES: readonly VoiceOption[] = ["Puck", "Fenrir", "Charon", "Orus"];

export function isVoiceOfGender(voice: string | null, gender: TeacherGender): boolean {
  if (!voice) return false;
  const list = gender === "thay" ? MALE_VOICES : FEMALE_VOICES;
  return (list as readonly string[]).includes(voice);
}

/**
 * Giọng theo GIỚI TÍNH giáo viên + lứa tuổi.
 * - Cô → giọng nữ; Thầy → giọng nam (không bao giờ lẫn).
 * - Trong cùng giới, chọn giọng hợp lứa: nhỏ tuổi trong sáng, lớn tuổi rõ ràng hơn.
 */
export const BAND_VOICE_BY_GENDER: Record<TeacherGender, Record<AgeBand, VoiceOption>> = {
  co: { "mam-non": "Leda", "tieu-hoc": "Aoede", "thieu-nien": "Kore" },
  thay: { "mam-non": "Puck", "tieu-hoc": "Fenrir", "thieu-nien": "Charon" },
};

/** Giọng mặc định (giáo viên nữ) — giữ tương thích cho nơi chưa biết giới tính. */
export const BAND_VOICE: Record<AgeBand, VoiceOption> = BAND_VOICE_BY_GENDER.co;

/** Giọng của giáo viên theo giới tính + lứa tuổi. */
export function resolveTeacherVoice(gender: TeacherGender, ageBand: AgeBand): VoiceOption {
  return BAND_VOICE_BY_GENDER[gender][ageBand];
}

/**
 * Giọng dùng cho bé: ưu tiên `favorite_voice` NHƯNG chỉ khi đúng giới tính giáo viên;
 * lệch giới tính thì lấy giọng chuẩn theo giới tính + lứa tuổi (yêu cầu Ngài An).
 */
export function resolveKidVoice(input: {
  gender: TeacherGender;
  ageBand: AgeBand;
  favoriteVoice?: string | null;
}): VoiceOption {
  const fav = input.favoriteVoice ?? null;
  if (isVoiceOfGender(fav, input.gender)) return fav as VoiceOption;
  return resolveTeacherVoice(input.gender, input.ageBand);
}

export const BAND_LABEL: Record<AgeBand, string> = {
  "mam-non": "Mầm non",
  "tieu-hoc": "Tiểu học",
  "thieu-nien": "Thiếu niên",
};

/**
 * Cách gọi học sinh theo lứa tuổi (Ngài An yêu cầu).
 * `student` = cách gọi chính; `alt` = cách gọi xen kẽ cho tự nhiên.
 *  - mam-non  (≤5)  → "con" (hoặc "bé"), câu rất ngắn.
 *  - tieu-hoc (≤10) → "con" (hoặc "em").
 *  - thieu-nien (>10) → "em" (hoặc "bạn").
 */
export const BAND_ADDRESS: Record<AgeBand, { student: string; alt: string }> = {
  "mam-non": { student: "con", alt: "bé" },
  "tieu-hoc": { student: "con", alt: "em" },
  "thieu-nien": { student: "em", alt: "bạn" },
};

/** Ghi chú độ dài/độ khó câu nói theo lứa tuổi (chèn vào system instruction). */
const BAND_STYLE_NOTE: Record<AgeBand, string> = {
  "mam-non": "Câu RẤT NGẮN, dùng từ ngữ đơn giản nhất, nói chậm và lặp lại nhẹ nhàng.",
  "tieu-hoc": "Câu ngắn, vui vẻ, khuyến khích bé kể và đặt câu hỏi.",
  "thieu-nien": "Câu gọn, tôn trọng, khuyến khích em suy nghĩ và tự trình bày.",
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
  /** Giáo viên AI của con: cô (giọng nữ) hay thầy (giọng nam). */
  teacher: KidTeacher;
}

/** Lựa chọn giáo viên AI cho một hồ sơ. */
export interface KidTeacher {
  gender: TeacherGender;
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
  teacher: {
    gender: "co",
  },
};

/** Giới tính giáo viên hợp lệ? */
export function isTeacherGender(v: unknown): v is TeacherGender {
  return v === "co" || v === "thay";
}

/** Đọc giới tính giáo viên từ settings (mặc định "co" — Cô Mây). */
export function teacherGenderFromSettings(raw: unknown): TeacherGender {
  const r = isRecord(raw) ? raw : {};
  const t = isRecord(r.teacher) ? r.teacher : {};
  return isTeacherGender(t.gender) ? t.gender : DEFAULT_SETTINGS.teacher.gender;
}

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
    // Sai/thiếu giới tính ⇒ về "co" (Cô Mây) — không bao giờ để hồ sơ mất giáo viên.
    teacher: {
      gender: teacherGenderFromSettings(r),
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
  /** Phiên trò chuyện tự do (không gắn bài học) — không mời bé làm bài tập. */
  freeSession?: boolean;
  /**
   * Ngân hàng câu hỏi của bài (M1): CHỈ id + câu hỏi, KHÔNG đáp án.
   * Đáp án nằm ở server; AI hỏi theo thứ tự này và gọi `log_answer` sau mỗi câu.
   */
  questionBank?: Array<{ id: string; prompt: string }>;
  /** Giới tính giáo viên AI — quyết định cách xưng hô (giọng do phía client chọn). */
  teacherGender?: TeacherGender;
}): string {
  const {
    kidName,
    placement,
    lessonTopic,
    recentNotes,
    exercises,
    freeSession,
    questionBank,
    teacherGender,
  } = params;
  const teacher = TEACHER_PROFILE[teacherGender ?? "co"];
  const band = BAND_LABEL[placement.ageBand];
  const addr = BAND_ADDRESS[placement.ageBand];
  const styleNote = BAND_STYLE_NOTE[placement.ageBand];
  const exLines = (exercises ?? [])
    .map((e, i) => `${i + 1}. ${e.question} (đáp án: ${e.options[e.answer_index]})`)
    .join("\n");

  return [
    `Bạn là "eKid" — ${teacher.role} AI thân thiết, ấm áp của ${addr.student} ${kidName}.`,
    // ── Xưng hô theo GIỚI TÍNH giáo viên (Ngài An yêu cầu) ──────────────────
    `Tên riêng của bạn: "${teacher.name}". Bé gọi bạn là ${teacher.name}; bạn tự xưng là "${teacher.pronoun}" (giữ nhất quán suốt buổi). TUYỆT ĐỐI KHÔNG xưng "tôi"/"mình" lạnh lùng.`,
    `GIỚI TÍNH GIÁO VIÊN: ${teacher.pronoun === "cô" ? "nữ" : "nam"} — luôn xưng "${teacher.pronoun}", không bao giờ tự đổi sang giới tính khác.`,
    `Cách gọi học sinh: gọi ${addr.student} (thỉnh thoảng xen "${addr.alt}"); thi thoảng gọi tên "${kidName}" cho thân mật. KHÔNG dùng từ xưng hô suồng sã, thiếu tôn trọng.`,
    `Bé ${kidName} đang ở trình độ: ${band}, cấp ${placement.level}.`,
    `Ngôn ngữ mặc định: TIẾNG VIỆT, giọng ấm áp. ${styleNote}`,
    // ── Song ngữ & dạy ngoại ngữ (Ngài An yêu cầu) ──────────────────────────
    "NGÔN NGỮ & DẠY NGOẠI NGỮ (bắt buộc):",
    `• Khi ${addr.student} nói tiếng Anh (hoặc ngoại ngữ khác), trả lời NGAY bằng đúng ngôn ngữ đó, cùng nhịp — không bắt ${addr.student} quay lại tiếng Việt, không dịch từng chữ.`,
    `• Khi ${addr.student} muốn học tiếng Anh/ngoại ngữ, bạn trở thành giáo viên ngoại ngữ của ${addr.student}: hỏi 1–2 câu để biết trình độ rồi chọn từ vựng và mẫu câu vừa sức.`,
    "• Có thể dùng công cụ hiện bài tập để tạo bài luyện ngoại ngữ ngắn (chọn từ, nghe–chọn, điền câu) đúng trình độ, tối đa 3 lựa chọn mỗi câu.",
    "• Dạy theo trình độ: mầm non/tiểu học — mỗi lượt 1 từ + 1 mẫu câu ngắn, nói chậm, lặp lại; thiếu niên — hội thoại ngắn theo chủ đề, thêm từ mới và cấu trúc vừa sức.",
    "• Sửa lỗi bằng cách NHẮC LẠI CÂU ĐÚNG thật tự nhiên (recast), không giảng ngữ pháp dài, không nói \"sai rồi\".",
    "• Khoảng 70–80% ngôn ngữ đích, 20–30% tiếng Việt khi cần giải thích; tăng dần độ khó theo tiến bộ.",
    `• ${addr.student} nói tiếng Việt thì trả lời tiếng Việt; KHÔNG tự chuyển sang tiếng Anh khi ${addr.student} chưa muốn.`,
    "• Khen nỗ lực nói ngoại ngữ cụ thể (\"con nói trọn câu rồi\"), không chê phát âm.",
    freeSession
      ? `Bạn CHỦ ĐỘNG trò chuyện: chào ${addr.student}, hỏi ${addr.student} hôm nay thế nào, gợi chuyện học tập và vui chơi, khuyến khích ${addr.student} kể và đặt câu hỏi.`
      : `Bạn CHỦ ĐỘNG MỞ PHIÊN: chào ${addr.student}, rồi hỏi lại 3 điều ${addr.student} đã học buổi trước (hỏi từng câu, chờ trả lời). TUYỆT ĐỐI KHÔNG hỏi "con muốn học gì" — việc chọn bài là của người lớn, không phải của ${addr.student}.`,
    // ── LUẬT SƯ PHẠM BẮT BUỘC (eKid M1) ─────────────────────────────────────
    "LUẬT KHÔNG ĐƯỢC VI PHẠM:",
    "1. KHÔNG nêu đáp án khi học sinh chưa thử ít nhất một lần. Không có ngoại lệ, kể cả khi bé hỏi thẳng hay nài.",
    "2. Khi bé hỏi cách làm hoặc làm sai: đi theo thang gợi ý 4 bậc, mỗi lượt CHỈ mở MỘT bậc:",
    "   bậc 1 — hỏi lại khác cách; bậc 2 — gợi hướng; bậc 3 — làm mẫu nửa bước; bậc 4 — mới được nói lời giải, rồi hỏi lại ngay.",
    "3. Mỗi lượt nói không quá 25 giây. Hỏi xong thì DỪNG và chờ bé.",
    "4. Sau mỗi bước, hỏi lại bằng cách khác: \"Con kể lại cho cô nghe bước này thế nào?\"",
    "5. Khen CỤ THỂ hành vi (\"con đã đọc kỹ đề\"), không khen chung (\"giỏi quá\").",
    "6. KHÔNG dùng từ \"sai rồi\", \"kém\", \"chậm\". Dùng \"chưa đúng chỗ này, mình xem lại nhé\".",
    "7. Chỉ dùng nội dung của bài đang học và câu hỏi hệ thống cấp. KHÔNG tự bịa bài tập mới.",
    "8. Bé lạc đề 2 lượt liên tiếp thì quay lại bằng câu hỏi đóng (\"con chọn A hay B?\").",
    "9. Kết phiên: hỏi bé nói lại 1 điều vừa học, rồi mới chào tạm biệt.",
    `Khen ngợi cụ thể khi ${addr.student} đúng, động viên nhẹ nhàng khi ${addr.student} sai, KHÔNG chê.`,
    lessonTopic ? `Chủ đề hôm nay: ${lessonTopic}.` : "",
    (questionBank ?? []).length > 0
      ? [
          `DANH SÁCH CÂU HỎI của bài (hỏi LẦN LƯỢT, đúng thứ tự; mỗi câu hỏi xong, chờ ${addr.student} trả lời rồi mới sang câu sau):`,
          ...(questionBank ?? []).map((q, i) => `${i + 1}. [${q.id}] ${q.prompt}`),
          `Sau mỗi câu ${addr.student} trả lời, gọi \`log_answer\` với item_id tương ứng. Khi cần gợi ý, gọi \`ask_hint\`.`,
        ].join("\n")
      : "",
    exLines ? `Các bài tập sẽ hiện trên màn hình (đọc câu hỏi cho ${addr.student} nghe):\n${exLines}` : "",
    recentNotes ? `Ghi chú về ${addr.student} từ buổi trước: ${recentNotes}` : "",
    exLines ? `Mỗi khi ra bài, đọc to câu hỏi và các lựa chọn để ${addr.student} chọn hoặc nói đáp án.` : "",
    // ── Công cụ hiển thị lên màn hình (bài tập/ảnh/video) ───────────────────
    toolsPromptSection(),
  ].filter(Boolean).join("\n");
}
