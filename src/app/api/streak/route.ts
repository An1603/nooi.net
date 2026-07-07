import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Check if already checked in today
    const { data: existing } = await supabase
      .from("documents")
      .select("id")
      .eq("user_id", user.id)
      .eq("file_type", "streak")
      .eq("title", today)
      .maybeSingle();

    if (!existing) {
      // Create today's check-in
      await supabase.from("documents").insert({
        user_id: user.id,
        title: today,
        content: JSON.stringify({ date: today }),
        file_type: "streak",
      });
    }

    // Calculate streak: count consecutive days backwards from today
    const { data: allDays } = await supabase
      .from("documents")
      .select("title")
      .eq("user_id", user.id)
      .eq("file_type", "streak")
      .order("title", { ascending: false })
      .limit(365);

    let streak = 0;
    if (allDays) {
      const todayDate = new Date(today);
      for (let i = 0; i < allDays.length; i++) {
        const expected = new Date(todayDate);
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split("T")[0];
        if (allDays[i].title === expectedStr) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Check & award badges
    const { data: existingBadges } = await supabase
      .from("documents")
      .select("title")
      .eq("user_id", user.id)
      .eq("file_type", "badge");

    const badgeIds = existingBadges?.map((b) => b.title) || [];
    const newBadges: { id: string; name: string; icon: string }[] = [];

    const badgeDefs = [
      { id: "first_step", name: "Bước đầu tiên", icon: "🌱", require: 1 },
      { id: "consistent_7", name: "Kiên trì 7 ngày", icon: "🔥", require: 7 },
      { id: "persistent_14", name: "Bền bỉ 14 ngày", icon: "💪", require: 14 },
      { id: "dedicated_21", name: "Tận tâm 21 ngày", icon: "🎯", require: 21 },
      { id: "one_month", name: "Một tháng chuyển hóa", icon: "⭐", require: 30 },
      { id: "two_months", name: "Hai tháng vững vàng", icon: "🌟", require: 60 },
      { id: "master", name: "Bậc thầy kiên trì", icon: "🏆", require: 100 },
    ];

    for (const badge of badgeDefs) {
      if (streak >= badge.require && !badgeIds.includes(badge.id)) {
        await supabase.from("documents").insert({
          user_id: user.id,
          title: badge.id,
          content: JSON.stringify({ name: badge.name, icon: badge.icon, earned_at: new Date().toISOString() }),
          file_type: "badge",
        });
        newBadges.push(badge);
      }
    }

    return NextResponse.json({
      streak,
      checkedIn: !!existing,
      newBadges,
      badges: badgeDefs.filter((b) => badgeIds.includes(b.id) || streak >= b.require).map((b) => ({
        ...b,
        earned: badgeIds.includes(b.id) || streak >= b.require,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET() {
  // Same logic but read-only (no check-in)
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: allDays } = await supabase
      .from("documents")
      .select("title")
      .eq("user_id", user.id)
      .eq("file_type", "streak")
      .order("title", { ascending: false })
      .limit(365);

    const today = new Date().toISOString().split("T")[0];
    let streak = 0;
    if (allDays) {
      const todayDate = new Date(today);
      for (let i = 0; i < allDays.length; i++) {
        const expected = new Date(todayDate);
        expected.setDate(expected.getDate() - i);
        if (allDays[i].title === expected.toISOString().split("T")[0]) streak++;
        else break;
      }
    }

    const { data: existingBadges } = await supabase
      .from("documents")
      .select("title, content")
      .eq("user_id", user.id)
      .eq("file_type", "badge");

    const badgeDefs = [
      { id: "first_step", name: "Bước đầu tiên", icon: "🌱", require: 1 },
      { id: "consistent_7", name: "Kiên trì 7 ngày", icon: "🔥", require: 7 },
      { id: "persistent_14", name: "Bền bỉ 14 ngày", icon: "💪", require: 14 },
      { id: "dedicated_21", name: "Tận tâm 21 ngày", icon: "🎯", require: 21 },
      { id: "one_month", name: "Một tháng chuyển hóa", icon: "⭐", require: 30 },
      { id: "two_months", name: "Hai tháng vững vàng", icon: "🌟", require: 60 },
      { id: "master", name: "Bậc thầy kiên trì", icon: "🏆", require: 100 },
    ];

    return NextResponse.json({
      streak,
      checkedIn: allDays?.some((d) => d.title === today) || false,
      badges: badgeDefs.map((b) => ({
        ...b,
        earned: existingBadges?.some((eb) => eb.title === b.id) || false,
        earned_at: existingBadges?.find((eb) => eb.title === b.id)?.content
          ? JSON.parse(existingBadges.find((eb) => eb.title === b.id)!.content).earned_at
          : null,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
