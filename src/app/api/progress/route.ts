import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Tính XP từ số ngày viết nhật ký (mỗi entry = 10 XP)
    const { data: journals } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("file_type", "journal");

    const journalCount = (journals?.length ?? 0);
    const xp = journalCount * 10;

    // Tính level
    let level = 1;
    if (xp >= 100) level = 2;
    if (xp >= 300) level = 3;
    if (xp >= 700) level = 4;
    if (xp >= 1200) level = 5;
    if (xp >= 2200) level = 6;
    if (xp >= 3500) level = 7;

    const levelNames = ["🌰 Member", "Seeker 🌱", "Grower 🌿", "Giver 🌳", "Guider 🌲", "Mentor 🌳", "Master 👑"];
    const nextLevelXp = [100, 300, 700, 1200, 2200, 3500, 99999];
    const xpToNext = nextLevelXp[Math.min(level, 6)] - xp;

    return NextResponse.json({
      n: xp,
      level,
      levelName: levelNames[Math.min(level - 1, 6)],
      journalCount,
      nToNext: Math.max(0, xpToNext),
      progress: Math.min(100, Math.round((xp / nextLevelXp[Math.min(level - 1, 6)]) * 100)),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
