import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/learning — learning hub stats (user progress, lesson completion)
export async function GET() {
  const supabase = createAdminClient();

  // Get all lesson_progress entries
  const { data: progress } = await supabase
    .from("documents")
    .select("id, user_id, title, content")
    .eq("file_type", "lesson_progress")
    .limit(5000);

  // Count by lesson
  const lessonCounts = new Map<string, { total: number; completed: number }>();
  const userProgressMap = new Map<string, string[]>();

  (progress ?? []).forEach((p) => {
    const lessonId = p.title;
    const c = lessonCounts.get(lessonId) || { total: 0, completed: 0 };
    c.total++;
    try {
      const data = JSON.parse(p.content || "{}");
      if (data.completed) c.completed++;
    } catch {
      if (p.content === "completed") c.completed++;
    }
    lessonCounts.set(lessonId, c);

    if (!userProgressMap.has(p.user_id)) userProgressMap.set(p.user_id, []);
    userProgressMap.get(p.user_id)!.push(lessonId);
  });

  // Users with progress
  const usersWithProgress = userProgressMap.size;

  // Total lessons defined in the app
  const totalLessons = 22; // From the LEVELS array in hoc-tap/page.tsx

  return NextResponse.json({
    stats: {
      totalLessons,
      usersWithProgress,
      totalProgressRecords: (progress ?? []).length,
      completedLessons: Array.from(lessonCounts.values()).reduce((sum, c) => sum + c.completed, 0),
    },
    lessonBreakdown: Object.fromEntries(lessonCounts),
  });
}
