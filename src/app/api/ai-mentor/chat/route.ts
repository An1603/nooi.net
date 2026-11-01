import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateGeminiText } from "@/lib/ai/gemini-text";
import { getSessionUser } from "@/lib/auth/current-user";
import { GIOI_HAN_TIN_NGAY, ngayVietNam, taoHanMuc } from "@/lib/ai/quota";

const SYSTEM_INSTRUCTION = `# AI Mentor System Prompt (NOOI Standard)

## 1. Identity & Voice
- Name: NOOI AI Mentor.
- Pronunciation: NOOI is pronounced 'NỐI'. Always speak it with a natural Vietnamese tone.
- Persona: A calm, profound, yet accessible 'Master in the World'. Wise but not arrogant.

## 2. Ethical Compass
- Empowerment: Never give direct life-changing instructions. Use Socratic questions.
- Safety: If crisis keywords are detected (self-harm, etc.), transition to human Mentor support immediately.
- Transparency: "I am an AI guide; your experience is the only truth."

## 3. Knowledge Retrieval
- Source of Truth: Base all advice on NOOI Master Blueprint (Chapters 1-12).
- Methodology: Identify user's state (THẤY/HIỂU/SỐNG/LAN TỎA) and provide guidance relative to their position on the Map.

## 4. Journal Analysis (Nhật ký Thân-Tâm-Hành)
When the user shares a journal entry with Thân (body), Tâm (mind), Hành (action):
- Analyze the connection between body, mind, and action
- **Compare with their journal history** to identify trends and changes over time
- Acknowledge specific details and progression (e.g., "Tuần trước bạn đau lưng, hôm nay đã đỡ hơn...")
- Identify which state they are in: THẤY (seeing), HIỂU (understanding), SỐNG (living), LAN TỎA (sharing)
- Give 1 specific micro-practice suggestion based on their entire journey
- ALWAYS refer explicitly to what they wrote and how it has changed

## 5. Communication Style
- Tone: Empathetic, Socratic, concise, "Bậc thầy nhập thế".
- When user provides journal data: **go straight to analysis, no greeting**
- Goal: Help users move from 'Currently stuck' -> 'Insight' -> 'Micro-practice' -> 'An trú'.`;

/**
 * POST /api/ai-mentor/chat
 * Text-only chat with NOOI AI Mentor.
 * Uses Google GenAI SDK with system instruction from Master Blueprint.
 *
 * Request:  { message: string }
 * Response: { reply: string }  or  { error: string }
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // 1. Danh tính từ PHIÊN (audit 01/11/2026) — không nhận user_id từ body
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    const userMessage = body.message?.trim();

    if (!userMessage) {
      return NextResponse.json(
        { error: "Missing 'message' in request body" },
        { status: 400 }
      );
    }

    // 2. Hạn mức 100 tin/ngày — tăng TRƯỚC khi gọi model để chặn vượt hạn mức
    //    khi nhiều request song song; gọi model lỗi thì hoàn lại 1 tin.
    const ngay = ngayVietNam();
    const svc = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: daTang, error: loiHanMuc } = await svc.rpc("tang_ai_usage", {
      p_user: user.id,
      p_ngay: ngay,
    });

    if (loiHanMuc || typeof daTang !== "number") {
      console.error("[ai-mentor/chat] Không đọc được hạn mức:", loiHanMuc);
      return NextResponse.json(
        { error: "Tạm thời chưa kiểm được hạn mức, vui lòng thử lại sau ít phút." },
        { status: 503 }
      );
    }

    if (daTang > GIOI_HAN_TIN_NGAY) {
      await svc.rpc("giam_ai_usage", { p_user: user.id, p_ngay: ngay });
      return NextResponse.json(
        {
          error: `Bạn đã dùng hết ${GIOI_HAN_TIN_NGAY} tin nhắn AI Mentor hôm nay. Hạn mức làm mới sau 00:00 (giờ Việt Nam).`,
          quota: taoHanMuc(GIOI_HAN_TIN_NGAY),
        },
        { status: 429 }
      );
    }

    // 3. Gọi model
    let reply: string;
    try {
      reply =
        (await generateGeminiText(apiKey, userMessage, {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
          maxOutputTokens: 4096,
        })) ||
        "Xin lỗi, tôi chưa thể đưa ra lời khuyên lúc này. Hãy chia sẻ thêm về điều bạn đang trải nghiệm.";
    } catch (loiModel) {
      // Không tính tin đã hỏng vào hạn mức của người dùng
      await svc.rpc("giam_ai_usage", { p_user: user.id, p_ngay: ngay });
      throw loiModel;
    }

    return NextResponse.json({ reply, quota: taoHanMuc(daTang) });
  } catch (err) {
    console.error("[ai-mentor/chat] Error:", err);
    return NextResponse.json(
      { error: `AI Mentor error: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
