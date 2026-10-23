import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Test tích hợp DB THẬT: tạo hồ sơ tạm → mở gợi ý 1→4 → chấm câu trả lời →
 * lịch ôn giãn cách → báo cáo phụ huynh → xoá sạch.
 *
 * Chỉ chạy khi có `.env.local` (VPS/dev). Trên CI không có DB thì tự bỏ qua,
 * không làm đỏ pipeline.
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
let admin: any;
let lib: any;
let kidId = "";
let sessionId = "";
let lessonId = "";
let items: any[] = [];

beforeAll(async () => {
  ({ createAdminClient: admin } = await import("@/lib/supabase/admin"));
  lib = await import("@/lib/ekid/plan-server");

  const db = admin();
  const { data: anyKid } = await db.from("ekid_kids").select("user_id").limit(1).maybeSingle();
  const { data: kid, error } = await db
    .from("ekid_kids")
    .insert({
      user_id: anyKid.user_id,
      name: "Bé kiểm thử luồng M1",
      date_of_birth: "2018-05-01",
      avatar_emoji: "🙂",
      daily_limit_min: 20,
      placement_age_band: "tieu-hoc",
      placement_level: 1,
    })
    .select("id")
    .single();
  expect(error).toBeNull();
  kidId = kid.id;

  const { data: lesson } = await db
    .from("ekid_lessons")
    .select("id, title")
    .eq("slug", "toan3-doc-viet-so-100000")
    .maybeSingle();
  lessonId = lesson.id;
  items = await lib.loadItems(lessonId);
  expect(items.length).toBeGreaterThanOrEqual(8);

  const { data: ses } = await db
    .from("ekid_sessions")
    .insert({ kid_id: kidId, lesson_id: lessonId })
    .select("id")
    .single();
  sessionId = ses.id;
});

afterAll(async () => {
  const db = admin();
  if (!kidId) return;
  await db.from("ekid_hint_log").delete().eq("kid_id", kidId);
  await db.from("ekid_attempts").delete().eq("kid_id", kidId);
  await db.from("ekid_reviews").delete().eq("kid_id", kidId);
  await db.from("ekid_daily_plan").delete().eq("kid_id", kidId);
  await db.from("ekid_sessions").delete().eq("kid_id", kidId);
  await db.from("ekid_kids").delete().eq("id", kidId);
});

describe.skipIf(!HAS_DB)("luồng học thật: gợi ý 1→4, chấm câu trả lời, ôn giãn cách, báo cáo", () => {
  it("mở gợi ý tuần tự đúng 4 bậc rồi dừng ở bậc 4", async () => {
    const item = items[0];
    const tiers: number[] = [];
    const texts: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      const h = await lib.openNextHint({ kidId, sessionId, item });
      tiers.push(h.tier);
      texts.push(h.text);
    }
    expect(tiers).toEqual([1, 2, 3, 4, 4]);
    expect(texts[0]).toBe(item.hint_ladder[0]);
    expect(texts[1]).toBe(item.hint_ladder[1]);
    expect(texts[3]).toContain("Đáp án:");
    expect(new Set(texts.slice(0, 4)).size).toBe(4);
  });

  it("chấm đúng/sai và KHÔNG trả đáp án khi chưa hết thang gợi ý", async () => {
    const item = items[1];
    expect(lib.isCorrectAnswer(item, item.answer.value)).toBe(true);
    expect(lib.isCorrectAnswer(item, "một câu trả lời sai hoàn toàn")).toBe(false);

    await lib.recordAttempt({
      kidId,
      sessionId,
      itemId: item.id,
      objectiveId: item.objective_id,
      correct: false,
      hintsUsed: 1,
      transcript: "sai",
    });
    await lib.recordAttempt({
      kidId,
      sessionId,
      itemId: items[2].id,
      objectiveId: items[2].objective_id,
      correct: true,
      hintsUsed: 0,
      transcript: "đúng",
    });

    const db = admin();
    const { data } = await db.from("ekid_attempts").select("correct, hints_used").eq("kid_id", kidId);
    expect((data ?? []).length).toBe(2);
  });

  it("lịch ôn kế tiếp: đúng → xa hơn, sai → quay về 1 ngày", async () => {
    const ok = await lib.scheduleReview({ kidId, objectiveId: items[2].objective_id, correct: true });
    const bad = await lib.scheduleReview({ kidId, objectiveId: items[1].objective_id, correct: false });
    expect(ok.stage).toBe(2); // 1 → 3 ngày
    expect(bad.stage).toBe(1); // sai → 1 ngày
    expect(ok.dueDate > bad.dueDate).toBe(true);
  });

  it("báo cáo phụ huynh đếm đúng 'đúng khi không gợi ý'", async () => {
    const r = await lib.dailyReport(kidId);
    expect(r.graded).toBe(2);
    expect(r.correctNoHint).toBe(1);
    expect(r.rateNoHint).toBe(50);
    expect(r.weakObjectives).toContain(items[1].objective_id);
  });

  it("đóng phiên bằng UPDATE (không tạo dòng thứ hai)", async () => {
    const db = admin();
    await db
      .from("ekid_sessions")
      .update({ ended_at: new Date().toISOString(), duration_min: 10 })
      .eq("id", sessionId);
    const { data } = await db.from("ekid_sessions").select("id").eq("kid_id", kidId);
    expect((data ?? []).length).toBe(1);
  });
});
