import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/lessons — list all lessons
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .order("level_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get progress stats
  const { data: progress } = await supabase
    .from("documents")
    .select("title, content")
    .eq("file_type", "lesson_progress")
    .limit(5000);

  const lessonStats = new Map<string, { total: number; completed: number }>();
  (progress ?? []).forEach((p: { title: string; content: string | null }) => {
    const c = lessonStats.get(p.title) || { total: 0, completed: 0 };
    c.total++;
    try { const d = JSON.parse(p.content || "{}"); if (d.completed) c.completed++; }
    catch { if (p.content === "completed") c.completed++; }
    lessonStats.set(p.title, c);
  });

  const lessons = (data ?? []).map((l: Record<string, unknown>) => {
    const lid = l.lesson_id as string;
    const stats = lessonStats.get(lid) || { total: 0, completed: 0 };
    return {
      id: l.id,
      level_id: l.level_id,
      lesson_id: lid,
      title: l.title,
      type: l.type,
      duration: l.duration,
      youtube_id: l.youtube_id || "",
      description: l.description || "",
      sort_order: l.sort_order,
      is_active: l.is_active,
      stats_total: stats.total,
      stats_completed: stats.completed,
      created_at: l.created_at,
    };
  });

  return NextResponse.json({ lessons });
}

// POST /api/admin/lessons — CRUD operations
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  try {
    const body = await request.json();
    const { action, id, level_id, lesson_id, title, type, duration, youtube_id, description, sort_order, is_active } = body;

    if (action === "create") {
      if (!level_id || !lesson_id || !title) {
        return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
      }
      const { error } = await supabase.from("lessons").insert({
        level_id: Number(level_id),
        lesson_id,
        title,
        type: type || "video",
        duration: duration || "00:00",
        youtube_id: youtube_id || "",
        description: description || "",
        sort_order: sort_order || 0,
        is_active: true,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "update") {
      if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (type !== undefined) updates.type = type;
      if (duration !== undefined) updates.duration = duration;
      if (youtube_id !== undefined) updates.youtube_id = youtube_id;
      if (description !== undefined) updates.description = description;
      if (sort_order !== undefined) updates.sort_order = sort_order;
      if (is_active !== undefined) updates.is_active = is_active;
      if (lesson_id !== undefined) updates.lesson_id = lesson_id;
      if (level_id !== undefined) updates.level_id = Number(level_id);

      const { error } = await supabase.from("lessons").update(updates).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
      // Delete lesson + associated progress records
      const { data: lesson } = await supabase.from("lessons").select("lesson_id").eq("id", id).single();
      if (lesson) {
        await supabase.from("documents").delete().eq("file_type", "lesson_progress").eq("title", (lesson as { lesson_id: string }).lesson_id);
      }
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
