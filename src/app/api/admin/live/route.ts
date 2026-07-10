import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/live — list all live sessions
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, user_id, title, content, created_at, updated_at")
    .eq("file_type", "live_session")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sessions = (data ?? []).map((d) => {
    try {
      const c = JSON.parse(d.content || "{}");
      return {
        id: d.id,
        user_id: d.user_id,
        title: d.title,
        date: c.date || "",
        time: c.time || "",
        link: c.link || "",
        meeting_id: c.meeting_id || "",
        password: c.password || "",
        mentor_name: c.mentor_name || "",
        max_participants: c.max_participants || 20,
        registered: c.registered || 0,
        description: c.description || "",
        created_at: d.created_at,
      };
    } catch {
      return { id: d.id, user_id: d.user_id, title: d.title, date: "", time: "", link: "", meeting_id: "", password: "", mentor_name: "", max_participants: 20, registered: 0, description: "", created_at: d.created_at };
    }
  });

  // Count registrations per session
  const sessionIds = sessions.map((s) => s.id);
  const { data: registrations } = sessionIds.length > 0
    ? await supabase.from("documents").select("title").eq("file_type", "live_registration").in("title", sessionIds)
    : { data: [] };
  const regCounts = new Map<string, number>();
  (registrations ?? []).forEach((r: { title: string }) => {
    regCounts.set(r.title, (regCounts.get(r.title) || 0) + 1);
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      ...s,
      registered: regCounts.get(s.id) || 0,
    })),
  });
}

// POST /api/admin/live — create/update/delete live session
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  try {
    const body = await request.json();
    const { action, id, title, date, time, link, meeting_id, password, mentor_name, max_participants, description } = body;

    if (action === "create") {
      if (!title || !date || !time) {
        return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
      }
      const { error } = await supabase.from("documents").insert({
        user_id: "00000000-0000-0000-0000-000000000001",
        title,
        content: JSON.stringify({
          description: description || "",
          date, time, link: link || "",
          meeting_id: meeting_id || "",
          password: password || "",
          mentor_name: mentor_name || "NOOI",
          max_participants: Number(max_participants) || 20,
          registered: 0,
        }),
        file_type: "live_session",
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "update") {
      if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
      const { error } = await supabase
        .from("documents")
        .update({
          title,
          content: JSON.stringify({
            description: description || "",
            date, time, link: link || "",
            meeting_id: meeting_id || "",
            password: password || "",
            mentor_name: mentor_name || "NOOI",
            max_participants: Number(max_participants) || 20,
          }),
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
      // Delete session + all registrations
      await supabase.from("documents").delete().eq("file_type", "live_registration").eq("title", id);
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
