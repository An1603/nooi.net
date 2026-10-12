import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { vnDayString } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Một lượt hội thoại trong buổi: bé nói (user) hoặc AI đáp (ai).
interface Turn {
  role: "user" | "ai";
  text: string;
}

// Hồ sơ bé tối thiểu cần cho phân quyền + ngữ cảnh biên tập bộ nhớ.
interface KidRow {
  id: string;
  name: string;
  user_id: string | null;
  child_user_id: string | null;
  memory: string | null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Chuẩn hoá mảng turns nhận từ client: chỉ giữ role hợp lệ ('user'|'ai') và text
// không rỗng; cắt khoảng trắng, bỏ mọi phần tử sai kiểu (không ném lỗi).
function normalizeTurns(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];
  const out: Turn[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const role = item.role;
    const text = typeof item.text === "string" ? item.text.trim() : "";
    if ((role === "user" || role === "ai") && text) {
      out.push({ role, text });
    }
  }
  return out;
}

// Quyền GHI: CHỦ hồ sơ (cha/mẹ) HOẶC chính TÀI KHOẢN CON của hồ sơ đó.
// Caregiver (dù admin) KHÔNG ghi bộ nhớ — bộ nhớ chỉ sinh từ chính buổi học của bé.
async function writableKid(userId: string, kidId: string): Promise<KidRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_kids")
    .select("id, name, user_id, child_user_id, memory")
    .eq("id", kidId)
    .maybeSingle();
  if (!data) return null;
  const kid = data as KidRow;
  if (kid.user_id === userId || kid.child_user_id === userId) return kid;
  return null;
}

// Ghép hội thoại thành văn bản dễ đọc cho prompt (bé↔AI), giới hạn độ dài để tránh
// prompt quá dài (chỉ cần đủ để biên tập bộ nhớ).
function renderTranscript(turns: Turn[]): string {
  const MAX_TURNS = 200;
  const MAX_CHARS = 12000;
  const lines: string[] = [];
  let total = 0;
  for (const t of turns.slice(0, MAX_TURNS)) {
    const line = `${t.role === "user" ? "BÉ" : "AI"}: ${t.text}`;
    total += line.length;
    if (total > MAX_CHARS) break;
    lines.push(line);
  }
  return lines.join("\n");
}

// Bóc JSON khỏi câu trả lời của model (chấp nhận có/không có rào ```json ... ```).
function extractJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const SYSTEM_INSTRUCTION = `Bạn là chuyên gia giáo dục mầm non và tiểu học của NOOI eKid.
Nhiệm vụ: đọc hội thoại giữa BÉ và trợ lý AI trong MỘT buổi học, rồi BIÊN TẬP lại thành
bộ nhớ ngắn gọn, mạch lạc bằng TIẾNG VIỆT để các buổi sau AI hiểu bé hơn.

Yêu cầu:
- Chỉ dùng thông tin CÓ THẬT trong hội thoại; tuyệt đối không bịa. Thông tin nào chưa rõ thì bỏ qua.
- Tập trung ghi nhận về BÉ: tính cách, sở thích, điểm mạnh, khó khăn, cảm xúc, tiến bộ.
- Giữ bộ nhớ CŨ (nếu có) làm nền, GỘP thêm hiểu biết mới, viết lại cho gọn và không mâu thuẫn.
- Văn phong khách quan, tôn trọng trẻ, không phán xét, không chẩn đoán y tế/tâm lý.

Trả về DUY NHẤT một đối tượng JSON đúng định dạng:
{"ai_notes": "<nhận xét ngắn cho buổi này, 1-3 câu>", "memory": "<bộ nhớ tổng hợp về bé, tiếng Việt, ngắn gọn>"}`;

/**
 * POST /api/ekid/kids/[kidId]/memory
 * Lưu một buổi trò chuyện và biên tập nó thành bộ nhớ về bé.
 * Quyền: CHỦ hồ sơ HOẶC chính tài khoản con (caregiver → 403).
 * Body: { turns: {role:"user"|"ai", text}[], duration_min?, lesson_id?, exercises_done? }
 * LUÔN best-effort: lỗi LLM KHÔNG chặn — vẫn lưu session, vẫn trả ok.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ kidId: string }> },
) {
  const { kidId } = await params;
  if (!UUID_RE.test(kidId)) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const kid = await writableKid(user.id, kidId);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const turns = normalizeTurns(body.turns);

  // Không có lượt nào → không có gì để lưu hay biên tập; coi như thành công (im lặng).
  if (turns.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const lessonId =
    typeof body.lesson_id === "string" && body.lesson_id ? body.lesson_id : null;
  const durRaw = typeof body.duration_min === "number" ? body.duration_min : 0;
  const dur = Math.max(0, Math.round(durRaw));

  // Điểm = tỉ lệ bài tập đúng trên tổng số bài đã làm (null nếu không có bài).
  const done = Array.isArray(body.exercises_done) ? body.exercises_done : [];
  const correct = done.filter((d) => isRecord(d) && d.correct === true).length;
  const score = done.length ? Math.round((correct / done.length) * 100) : null;

  const admin = createAdminClient();

  // 1) Lưu buổi học (transcript = toàn bộ lượt hội thoại).
  const { data: session, error: insErr } = await admin
    .from("ekid_sessions")
    .insert({
      kid_id: kidId,
      lesson_id: lessonId,
      ended_at: new Date().toISOString(),
      duration_min: dur,
      transcript: turns,
      exercises_done: done,
      score,
      ai_notes: null,
    })
    .select("id")
    .single();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // 2) Cộng dồn số phút vào ekid_daily theo mốc NGÀY VIỆT NAM (upsert khoá (kid_id, day)).
  if (dur > 0) {
    const day = vnDayString();
    const { data: existing } = await admin
      .from("ekid_daily")
      .select("minutes_used")
      .eq("kid_id", kidId)
      .eq("day", day)
      .maybeSingle();
    const newUsed = (existing?.minutes_used ?? 0) + dur;
    await admin
      .from("ekid_daily")
      .upsert({ kid_id: kidId, day, minutes_used: newUsed }, { onConflict: "kid_id,day" });
  }

  // 3) Biên tập bộ nhớ bằng Gemini — BEST-EFFORT: mọi lỗi (thiếu key, mạng, parse)
  //    đều bỏ qua, KHÔNG chặn: session đã lưu, trả ok để client không kẹt.
  let aiNotes: string | null = null;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const transcript = renderTranscript(turns);
      const oldMemory = (kid.memory ?? "").trim();
      const userPrompt = [
        `Tên bé: ${kid.name}`,
        `Bộ nhớ hiện có về bé (có thể trống):\n${oldMemory || "(chưa có)"}`,
        `Hội thoại buổi này:\n${transcript}`,
      ].join("\n\n");

      const client = new GoogleGenAI({ apiKey });
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.4,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const parsed = extractJson(text);
      const notes =
        parsed && typeof parsed.ai_notes === "string" ? parsed.ai_notes.trim() : "";
      const memory =
        parsed && typeof parsed.memory === "string" ? parsed.memory.trim() : "";
      aiNotes = notes || null;

      // 4) Cập nhật CẢ HAI cột: ai_notes cho buổi này + memory tổng hợp cho bé.
      if (aiNotes) {
        await admin.from("ekid_sessions").update({ ai_notes: aiNotes }).eq("id", session.id);
      }
      if (memory) {
        await admin.from("ekid_kids").update({ memory }).eq("id", kidId);
      }
    }
  } catch (err) {
    console.error("[ekid/kids/memory] Lỗi biên tập bộ nhớ (bỏ qua, best-effort):", err);
  }

  return NextResponse.json({ ok: true, ai_notes: aiNotes });
}
