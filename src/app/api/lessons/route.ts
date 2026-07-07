import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/lessons — public endpoint returning all active lessons
 * ordered by level_id, then sort_order.
 * No auth required — lessons are public.
 */
export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .order("level_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const lessons = (data ?? []).map((l: Record<string, unknown>) => ({
    id: l.id,
    level_id: l.level_id,
    lesson_id: l.lesson_id,
    title: l.title,
    type: l.type,
    duration: l.duration,
    youtube_id: l.youtube_id || "",
    description: l.description || "",
    sort_order: l.sort_order,
    is_active: l.is_active,
    created_at: l.created_at,
  }));

  return NextResponse.json({ lessons });
}
