import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Streak data: 7 ngày gần nhất
    const { data: allStreak } = await supabase
      .from("documents")
      .select("title")
      .eq("user_id", user.id)
      .eq("file_type", "streak")
      .order("title", { ascending: false })
      .limit(30);

    // Journal data: 4 tuần gần nhất
    const { data: allJournals } = await supabase
      .from("documents")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("file_type", "journal")
      .order("created_at", { ascending: false })
      .limit(100);

    // Tính streak
    const today = new Date().toISOString().split("T")[0];
    let streak = 0;
    if (allStreak) {
      const todayDate = new Date(today);
      for (let i = 0; i < allStreak.length; i++) {
        const expected = new Date(todayDate);
        expected.setDate(expected.getDate() - i);
        if (allStreak[i].title === expected.toISOString().split("T")[0]) streak++;
        else break;
      }
    }

    // 7 ngày gần nhất (heatmap)
    const weekDays: { date: string; label: string; active: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      weekDays.push({
        date: dateStr,
        label: dayLabels[d.getDay()],
        active: allStreak?.some((s) => s.title === dateStr) || false,
      });
    }

    // Journal theo tuần (4 tuần)
    const weeks: { label: string; count: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const count = allJournals?.filter((j) => {
        const d = new Date(j.created_at);
        return d >= start && d < end;
      }).length || 0;
      weeks.push({
        label: `T${4 - i}`,
        count,
      });
    }

    // Badge count
    const { count: badgeCount } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("file_type", "badge");

    // Level
    const { count: journalCount } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("file_type", "journal");

    const n = (journalCount ?? 0) * 10;
    const levelThresholds = [0, 100, 300, 700, 1200, 2200, 3500];
    let level = 1;
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (n >= levelThresholds[i]) { level = i + 1; break; }
    }
    const levelNames = ["🌰 Member", "Seeker 🌱", "Grower 🌿", "Giver 🌳", "Guider 🌲", "Mentor 🌳", "Master 👑"];

    return NextResponse.json({
      streak,
      weekDays,
      weeks,
      totalJournals: journalCount ?? 0,
      totalN: n,
      level,
      levelName: levelNames[Math.min(level - 1, 6)],
      badges: badgeCount ?? 0,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
