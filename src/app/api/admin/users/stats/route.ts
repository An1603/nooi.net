import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/users/stats — user stats (journals, N, activity)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  const supabase = createAdminClient();

  if (userId) {
    // Stats for specific user
    const { count: journalCount } = await supabase
      .from("documents").select("*", { count: "exact", head: true })
      .eq("user_id", userId).eq("file_type", "journal");
    const { count: docCount } = await supabase
      .from("documents").select("*", { count: "exact", head: true })
      .eq("user_id", userId).neq("file_type", "journal");
    const { count: projectCount } = await supabase
      .from("projects").select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const n = (journalCount ?? 0) * 10;
    const thresholds = [0, 100, 300, 600, 1000, 1500, 2500];
    let level = 1;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (n >= thresholds[i]) { level = i + 1; break; }
    }

    // Last active
    const { data: lastEntry } = await supabase
      .from("documents").select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      stats: {
        journals: journalCount ?? 0,
        n,
        level,
        documents: docCount ?? 0,
        projects: projectCount ?? 0,
        lastActive: lastEntry?.created_at || null,
      },
    });
  }

  // Aggregate stats (used for evaluate page)
  const { data: allJournals } = await supabase
    .from("documents")
    .select("user_id")
    .eq("file_type", "journal")
    .limit(5000);

  const userJournalCounts = new Map<string, number>();
  (allJournals ?? []).forEach((j) => {
    userJournalCounts.set(j.user_id, (userJournalCounts.get(j.user_id) || 0) + 1);
  });

  return NextResponse.json({
    userJournalCounts: Object.fromEntries(userJournalCounts),
  });
}
