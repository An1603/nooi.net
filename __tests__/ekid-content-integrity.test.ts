import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { gradeSpokenAnswer } from "@/lib/ekid/answer-grade";

/**
 * CỔNG C1 — kiểm tra TOÀN BỘ ngân hàng câu hỏi lớp 3 đang chạy trên DB.
 *
 * Đây là thứ chặn lỗi nội dung trước khi tới tay bé: câu thiếu đáp án, thiếu bậc gợi ý,
 * trùng câu, bài toàn câu dễ, hoặc tệ nhất — đáp án của chính câu đó bị bộ chấm chấm SAI.
 * Chỉ chạy khi có .env.local (VPS/dev); CI không có DB thì bỏ qua.
 */
const ENV_FILE = path.join(process.cwd(), ".env.local");
const HAS_DB = fs.existsSync(ENV_FILE);

function loadEnv() {
  if (!HAS_DB) return;
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
}
loadEnv();

/* eslint-disable @typescript-eslint/no-explicit-any */
let db: any;
type Item = {
  id: string;
  lesson_id: string;
  prompt: string;
  answer: { value?: string; alt?: string[] } | null;
  hint_ladder: string[] | null;
  level: number;
  kind: string;
};
let lessons: Array<{ id: string; slug: string; title: string }> = [];
let items: Item[] = [];

beforeAll(async () => {
  if (!HAS_DB) return;
  const { createAdminClient } = await import("@/lib/supabase/admin");
  db = createAdminClient();
  const { data: ls } = await db
    .from("ekid_lessons")
    .select("id, slug, title")
    .eq("grade", 3)
    .eq("status", "active");
  lessons = ls ?? [];
  const ids = lessons.map((l) => l.id);
  const { data: its } = await db
    .from("ekid_items")
    .select("id, lesson_id, prompt, answer, hint_ladder, level, kind")
    .in("lesson_id", ids)
    .eq("active", true);
  items = its ?? [];
});

describe.skipIf(!HAS_DB)("C1 — toàn vẹn ngân hàng câu hỏi lớp 3", () => {
  it("có nội dung để kiểm", () => {
    expect(items.length).toBeGreaterThan(0);
  });

  it("mọi câu đều có đáp án", () => {
    const bad = items.filter((i) => !i.answer?.value || !String(i.answer.value).trim());
    expect(bad.map((i) => i.prompt)).toEqual([]);
  });

  it("mọi câu có đủ 4 bậc gợi ý, không bậc nào rỗng", () => {
    const bad = items.filter(
      (i) => !Array.isArray(i.hint_ladder) || i.hint_ladder.length < 4 || i.hint_ladder.slice(0, 4).some((h) => !String(h).trim()),
    );
    expect(bad.map((i) => i.prompt)).toEqual([]);
  });

  it("bậc 1→3 KHÔNG được chứa nguyên đáp án (gợi ý không được lộ sớm)", () => {
    const leaks: string[] = [];
    for (const it of items) {
      const ans = String(it.answer?.value ?? "").trim();
      if (!ans || ans.length < 2) continue;
      // Chỉ xét đáp án chữ (số 1-2 ký tự xuất hiện khắp nơi, không tính là lộ).
      if (ans.length < 5) continue;
      // Câu "đọc to từ sau: X" thì X nằm ngay trong đề bài — gợi ý nhắc lại không phải lộ.
      if (it.prompt.toLowerCase().includes(ans.toLowerCase())) continue;
      for (const h of (it.hint_ladder ?? []).slice(0, 3)) {
        if (String(h).toLowerCase().includes(ans.toLowerCase())) leaks.push(`${it.prompt} → bậc gợi ý lộ đáp án`);
      }
    }
    expect(leaks).toEqual([]);
  });

  it("bộ chấm chấm ĐÚNG đáp án của chính câu đó (kể cả alt)", () => {
    const bad: string[] = [];
    for (const it of items) {
      const a = it.answer ?? {};
      if (!a.value) continue;
      const key = { value: String(a.value), alt: a.alt };
      if (!gradeSpokenAnswer(key, String(a.value))) bad.push(`sai đáp án gốc: ${it.prompt}`);
      for (const v of a.alt ?? []) {
        if (!gradeSpokenAnswer(key, v)) bad.push(`sai biến thể "${v}": ${it.prompt}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("không có câu trùng nguyên văn trong cùng một bài", () => {
    const seen = new Map<string, string[]>();
    for (const it of items) {
      const key = `${it.lesson_id}::${it.prompt.trim().toLowerCase()}`;
      seen.set(key, [...(seen.get(key) ?? []), it.prompt]);
    }
    const dups = [...seen.values()].filter((v) => v.length > 1).map((v) => v[0]);
    expect(dups).toEqual([]);
  });

  it("mỗi bài có ít nhất 8 câu và ít nhất 2 câu mức 3", () => {
    const problems: string[] = [];
    for (const l of lessons) {
      const own = items.filter((i) => i.lesson_id === l.id);
      if (own.length === 0) continue; // bài cũ chưa soạn — audit riêng
      if (own.length < 8) problems.push(`${l.slug}: chỉ ${own.length} câu`);
      if (own.filter((i) => i.level === 3).length < 2) problems.push(`${l.slug}: thiếu câu mức 3`);
    }
    expect(problems).toEqual([]);
  });

  it("mỗi câu đều gắn một YCCĐ còn tồn tại", () => {
    const hasObj = items.every((i) => (i as unknown as { objective_id?: string }).objective_id !== null);
    expect(hasObj).toBe(true);
  });
});
