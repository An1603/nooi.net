import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// POST — Lưu telegram_chat_id cho user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId } = body;

    if (!chatId || typeof chatId !== "string") {
      return NextResponse.json({ error: "Thiếu chatId" }, { status: 400 });
    }

    // Validate chatId format (numeric string, can be negative for groups)
    if (!/^-?\d+$/.test(chatId.trim())) {
      return NextResponse.json({ error: "Chat ID không hợp lệ. Phải là số." }, { status: 400 });
    }

    // Auth
    const authClient = createServerClient(SUPABASE_URL, ANON_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    // Save chat_id to profile
    const { error: updateError } = await authClient
      .from("profiles")
      .update({ telegram_chat_id: chatId.trim() })
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, chatId: chatId.trim() });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE — Ngắt kết nối Telegram
export async function DELETE(req: NextRequest) {
  try {
    const authClient = createServerClient(SUPABASE_URL, ANON_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    await authClient
      .from("profiles")
      .update({ telegram_chat_id: null })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
