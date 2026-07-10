import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500];
const LEVEL_NAMES = ["Người mới", "Người tìm kiếm", "Học viên", "Người thực hành", "Người đồng hành", "Mentor", "Master Mentor"];

function calcLevel(n: number) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (n >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return level;
}

// GET /api/mentors — public endpoint, returns users with Level >= 6
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get all profiles
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .limit(200);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Get journal counts
  const userIds = (profiles ?? []).map((p: { user_id: string }) => p.user_id);
  const { data: journals } = userIds.length > 0
    ? await supabase.from("documents").select("user_id").eq("file_type", "journal").in("user_id", userIds).limit(5000)
    : { data: [] };

  const journalCounts = new Map<string, number>();
  (journals ?? []).forEach((j: { user_id: string }) => {
    journalCounts.set(j.user_id, (journalCounts.get(j.user_id) || 0) + 1);
  });

  // Filter Level 6+
  const mentors = (profiles ?? [])
    .map((p: { user_id: string; full_name: string }) => {
      const journals = journalCounts.get(p.user_id) || 0;
      const n = journals * 10;
      const level = calcLevel(n);
      return {
        id: p.user_id,
        full_name: p.full_name || "Mentor",
        level,
        level_name: LEVEL_NAMES[level - 1],
        journals,
        n,
      };
    })
    .filter((m: { level: number }) => m.level >= 6)
    .sort((a: { n: number }, b: { n: number }) => b.n - a.n);

  return Response.json({ mentors });
}
