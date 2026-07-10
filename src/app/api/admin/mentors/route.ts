import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/mentors — list all mentors
export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = (data ?? []).map((m: { user_id: string }) => m.user_id);
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
    : { data: [] };
  const nameMap = new Map((profiles ?? []).map((p: { user_id: string; full_name: string }) => [p.user_id, p.full_name]));

  // Count mentees per mentor
  const mentorIds = (data ?? []).map((m: { id: string }) => m.id);
  const { data: relationships } = mentorIds.length > 0
    ? await supabase.from("mentor_relationships").select("mentor_id").eq("status", "active")
    : { data: [] };
  const menteeCounts = new Map<string, number>();
  (relationships ?? []).forEach((r: { mentor_id: string }) => {
    menteeCounts.set(r.mentor_id, (menteeCounts.get(r.mentor_id) || 0) + 1);
  });

  return NextResponse.json({
    mentors: (data ?? []).map((m) => ({
      id: m.id,
      user_id: m.user_id,
      full_name: nameMap.get(m.user_id) || "—",
      title: m.title,
      bio: m.bio,
      specialties: m.specialties || [],
      experience_years: m.experience_years || 0,
      rating: m.rating || 0,
      review_count: m.review_count || 0,
      is_active: m.is_active ?? true,
      mentee_count: menteeCounts.get(m.id) || 0,
      created_at: m.created_at,
    })),
  });
}

// POST /api/admin/mentors — create/update/delete mentor
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  try {
    const body = await request.json();
    const { action, id, user_id, title, bio, specialties, experience_years, is_active } = body;

    if (action === "update") {
      if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (bio !== undefined) updates.bio = bio;
      if (specialties !== undefined) updates.specialties = specialties;
      if (experience_years !== undefined) updates.experience_years = experience_years;
      if (is_active !== undefined) updates.is_active = is_active;
      const { error } = await supabase.from("mentors").update(updates).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "toggle_active") {
      if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
      const { error } = await supabase.from("mentors").update({ is_active }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "create") {
      if (!user_id || !title) return NextResponse.json({ error: "Thiếu user_id/title" }, { status: 400 });
      const { error } = await supabase.from("mentors").insert({
        user_id, title, bio: bio || "", specialties: specialties || [], experience_years: experience_years || 0,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
