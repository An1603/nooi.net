import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// POST — Gửi nhắc nhở cho tất cả user đã đăng ký buổi live sắp diễn ra
// Body: { sessionId: string }
export async function POST(req: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "Telegram chưa cấu hình" }, { status: 503 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Thiếu sessionId" }, { status: 400 });
    }

    const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Lấy thông tin buổi học
    const { data: session } = await svc
      .from("documents")
      .select("*")
      .eq("id", sessionId)
      .eq("file_type", "live_session")
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: "Không tìm thấy buổi học" }, { status: 404 });
    }

    const content = JSON.parse(session.content || "{}");

    // 2. Lấy danh sách user đã đăng ký
    const { data: registrations } = await svc
      .from("documents")
      .select("user_id")
      .eq("file_type", "live_registration")
      .eq("title", sessionId);

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ message: "Không có ai đăng ký", sent: 0 });
    }

    // 3. Lấy telegram_chat_id của tất cả user đã đăng ký
    const userIds = registrations.map((r) => r.user_id);
    const { data: profiles } = await svc
      .from("profiles")
      .select("user_id, telegram_chat_id, full_name")
      .in("user_id", userIds)
      .not("telegram_chat_id", "is", null);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: "Không ai kết nối Telegram", sent: 0 });
    }

    // 4. Gửi tin nhắn nhắc nhở
    const message = [
      `🔔 <b>Nhắc nhở: Buổi học sắp bắt đầu!</b>`,
      ``,
      `📚 <b>${session.title}</b>`,
      content.description ? `📝 ${content.description}` : null,
      `📅 ${content.date} · ⏰ ${content.time}`,
      content.mentor_name ? `👤 Mentor: ${content.mentor_name}` : null,
      content.meeting_id ? `🔑 ID: <code>${content.meeting_id}</code>` : null,
      content.password ? `🔒 Mật khẩu: <code>${content.password}</code>` : null,
      ``,
      content.link ? `👉 <a href="${content.link}">Vào phòng học</a>` : null,
      ``,
      `💡 Hãy chuẩn bị và đến đúng giờ nhé!`,
    ]
      .filter(Boolean)
      .join("\n");

    let sent = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const res = await fetch(tgUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: profile.telegram_chat_id,
            text: message,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        });
        if (res.ok) sent++;
        else {
          const err = await res.json();
          errors.push(`${profile.full_name}: ${err.description}`);
        }
      } catch (e) {
        errors.push(`${profile.full_name}: ${e}`);
      }
    }

    return NextResponse.json({ sent, total: profiles.length, errors });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
