import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth/current-user";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MAX_LEN = 4096;

// POST — Gửi tin nhắn Telegram.
// Body: { message: string }
//
// BẢO MẬT (audit 01/11/2026): đích gửi LUÔN là chat Telegram đã liên kết của chính
// người đang đăng nhập. Không còn nhận `userId`/`chatId` từ body — trước đây bất kỳ
// thành viên nào cũng gửi được tin mang thương hiệu NOOI tới chat của người khác.
export async function POST(req: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { error: "Telegram chưa được cấu hình. Cần TELEGRAM_BOT_TOKEN trong env." },
        { status: 503 }
      );
    }

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const message = body && typeof body.message === "string" ? body.message : "";

    if (!message.trim()) {
      return NextResponse.json({ error: "Thiếu message" }, { status: 400 });
    }
    if (message.length > MAX_LEN) {
      return NextResponse.json(
        { error: `Tin nhắn tối đa ${MAX_LEN} ký tự` },
        { status: 400 }
      );
    }

    const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: profile } = await svc
      .from("profiles")
      .select("telegram_chat_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Một câu trả lời duy nhất cho "không có chat" — không tạo oracle dò tài khoản.
    if (!profile?.telegram_chat_id) {
      return NextResponse.json(
        { error: "Bạn chưa kết nối Telegram" },
        { status: 404 }
      );
    }

    const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const tgRes = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: profile.telegram_chat_id,
        text: message,
        parse_mode: "HTML",
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
