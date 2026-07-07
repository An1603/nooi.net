import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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
    const body = await req.json();
    const userMessage = body.message?.trim();

    if (!userMessage) {
      return NextResponse.json(
        { error: "Missing 'message' in request body" },
        { status: 400 }
      );
    }

    const client = new GoogleGenAI({ apiKey });

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: userMessage }] },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    const reply = response.candidates?.[0]?.content?.parts?.[0]?.text || 
      "Xin lỗi, tôi chưa thể đưa ra lời khuyên lúc này. Hãy chia sẻ thêm về điều bạn đang trải nghiệm.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[ai-mentor/chat] Error:", err);
    return NextResponse.json(
      { error: `AI Mentor error: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
