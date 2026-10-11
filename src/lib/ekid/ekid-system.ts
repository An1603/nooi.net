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
}): Placement {
  const age = calcAge(input.dob);
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
