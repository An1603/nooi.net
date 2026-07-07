import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Quest 1: Viết nhật ký
    const { count: journalCount } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("file_type", "journal")
      .gte("created_at", today);

    // Quest 2: Học bài
    const { count: lessonCount } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("file_type", "lesson_progress")
      .gte("created_at", today);

    // Quest 3: Thực hành (micro-practice)
    const { count: practiceCount } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("file_type", "practice")
      .gte("created_at", today);

    // Quest 4: Streak check-in (đã vào app hôm nay)
    const { data: streakToday } = await supabase
      .from("documents")
      .select("id")
      .eq("user_id", user.id)
      .eq("file_type", "streak")
      .eq("title", today)
      .maybeSingle();

    const quests = [
      { id: "journal", label: "Viết nhật ký", icon: "📓", n: 10, done: (journalCount ?? 0) > 0 },
      { id: "lesson", label: "Học một bài", icon: "📚", n: 5, done: (lessonCount ?? 0) > 0 },
      { id: "practice", label: "Thực hành", icon: "⚡", n: 5, done: (practiceCount ?? 0) > 0 },
      { id: "streak", label: "Vào app hôm nay", icon: "🔥", n: 3, done: !!streakToday },
    ];

    const completed = quests.filter((q) => q.done).length;
    const totalN = quests.filter((q) => q.done).reduce((sum, q) => sum + q.n, 0);

    return NextResponse.json({
      quests,
      completed,
      total: quests.length,
      progress: Math.round((completed / quests.length) * 100),
      totalN,
      allDone: completed === quests.length,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
