import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Lấy journal count của tất cả users
    const { data: journals } = await supabase
      .from("documents")
      .select("user_id")
      .eq("file_type", "journal");

    // Đếm số journal mỗi user
    const journalCounts: Record<string, number> = {};
    journals?.forEach((j) => {
      journalCounts[j.user_id] = (journalCounts[j.user_id] || 0) + 1;
    });

    // Sắp xếp top N
    const sorted = Object.entries(journalCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    // Lấy thông tin profiles
    const userIds = sorted.map(([id]) => id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const nameMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.full_name]));

    const leaderboard = sorted.map(([id, count], i) => ({
      rank: i + 1,
      user_id: id,
      name: nameMap[id] || "Người dùng",
      n: count * 10,
      journals: count,
    }));

    return NextResponse.json({ leaderboard });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
