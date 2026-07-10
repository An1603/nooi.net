import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// POST — Gửi tin nhắn Telegram đến user(s)
// Body: { userId?: string, chatId?: string, message: string, parseMode?: string }
export async function POST(req: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { error: "Telegram chưa được cấu hình. Cần TELEGRAM_BOT_TOKEN trong env." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { userId, chatId, message, parseMode } = body;

    if (!message) {
      return NextResponse.json({ error: "Thiếu message" }, { status: 400 });
    }

    let targetChatId = chatId;

    // Nếu có userId, tìm chat_id từ profiles
    if (!targetChatId && userId) {
      const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      const { data: profile } = await svc
        .from("profiles")
        .select("telegram_chat_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!profile?.telegram_chat_id) {
        return NextResponse.json(
          { error: "User chưa kết nối Telegram" },
          { status: 404 }
        );
      }
      targetChatId = profile.telegram_chat_id;
    }

    if (!targetChatId) {
      return NextResponse.json({ error: "Thiếu chatId hoặc userId" }, { status: 400 });
    }

    // Gửi qua Telegram Bot API
    const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const tgRes = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: parseMode || "HTML",
        disable_web_page_preview: true,
      }),
    });

    const tgData = await tgRes.json();

    if (!tgRes.ok) {
      return NextResponse.json(
        { error: `Telegram API error: ${tgData.description || "Unknown"}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, messageId: tgData.result?.message_id });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
