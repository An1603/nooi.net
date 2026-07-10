import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ notifications: [] });

    const today = new Date().toISOString().split("T")[0];
    const notifs: { id: string; icon: string; title: string; desc: string; time: string }[] = [];

    // Kiểm tra streak hôm nay
    const { data: streakToday } = await supabase
      .from("documents")
      .select("id")
      .eq("user_id", user.id)
      .eq("file_type", "streak")
      .eq("title", today)
      .maybeSingle();

    if (!streakToday) {
      notifs.push({
        id: "streak",
        icon: "🔥",
        title: "Chưa check-in hôm nay",
        desc: "Vào app để giữ chuỗi streak của bạn!",
        time: "Ngay bây giờ",
      });
    }

    // Kiểm tra journal hôm nay
    const { count: journalToday } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("file_type", "journal")
      .gte("created_at", today);

    if (!journalToday || journalToday === 0) {
      notifs.push({
        id: "journal",
        icon: "📓",
        title: "Viết nhật ký hôm nay",
        desc: "Dành 5 phút để ghi lại Thân-Tâm-Hành.",
        time: "Hôm nay",
      });
    }

    return NextResponse.json({ notifications: notifs });
  } catch {
    return NextResponse.json({ notifications: [] });
  }
}
