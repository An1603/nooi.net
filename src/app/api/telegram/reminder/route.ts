import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth/current-user";
import { requireAdmin } from "@/lib/admin/guard";
import { escapeTelegramHtml, safeHttpUrl } from "@/lib/telegram/escape";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// POST — Gửi nhắc nhở cho tất cả người đã đăng ký một buổi live.
// Body: { sessionId: string }
//
// BẢO MẬT (audit 01/11/2026):
//  - Chỉ người tạo buổi học hoặc quản trị viên mới được phát fan-out (trước đây ai
//    có phiên cũng bấm được, kể cả để phát liên kết của mình cho toàn bộ người đăng ký).
//  - Mọi trường lấy từ DB được escape theo bộ thẻ HTML của Telegram; liên kết phải
//    là http/https hợp lệ.
export async function POST(req: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "Telegram chưa cấu hình" }, { status: 503 });
    }

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const sessionId = body && typeof body.sessionId === "string" ? body.sessionId : "";
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

    // 2. Phân quyền: người tạo buổi học hoặc quản trị viên
    const laChuBuoiHoc = session.user_id === user.id;
    const laQuanTri = laChuBuoiHoc ? false : !!(await requireAdmin());
    if (!laChuBuoiHoc && !laQuanTri) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    let content: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(session.content || "{}");
      if (parsed && typeof parsed === "object") content = parsed as Record<string, unknown>;
    } catch {
      content = {};
    }

    // 3. Danh sách người đã đăng ký
    const { data: registrations } = await svc
      .from("documents")
      .select("user_id")
      .eq("file_type", "live_registration")
      .eq("title", sessionId);

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ message: "Không có ai đăng ký", sent: 0 });
    }

    const userIds = registrations.map((r) => r.user_id);
    const { data: profiles } = await svc
      .from("profiles")
      .select("user_id, telegram_chat_id, full_name")
      .in("user_id", userIds)
      .not("telegram_chat_id", "is", null);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: "Không ai kết nối Telegram", sent: 0 });
    }

    // 4. Dựng tin nhắn — MỌI giá trị từ DB đều qua escapeTelegramHtml
    const link = safeHttpUrl(content.link);
    const parts: Array<string | null> = [
      `🔔 <b>Nhắc nhở: Buổi học sắp bắt đầu!</b>`,
      ``,
      `📚 <b>${escapeTelegramHtml(session.title)}</b>`,
      content.description ? `📝 ${escapeTelegramHtml(content.description)}` : null,
      `📅 ${escapeTelegramHtml(content.date)} · ⏰ ${escapeTelegramHtml(content.time)}`,
      content.mentor_name ? `👤 Mentor: ${escapeTelegramHtml(content.mentor_name)}` : null,
      content.meeting_id ? `🔑 ID: <code>${escapeTelegramHtml(content.meeting_id)}</code>` : null,
      content.password ? `🔒 Mật khẩu: <code>${escapeTelegramHtml(content.password)}</code>` : null,
      ``,
      link ? `👉 <a href="${escapeTelegramHtml(link)}">Vào phòng học</a>` : null,
      ``,
      `💡 Hãy chuẩn bị và đến đúng giờ nhé!`,
    ];
    const message = parts.filter(Boolean).join("\n");

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
