import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/activity — recent system activity
export async function GET() {
  const supabase = createAdminClient();

  // Recent journals
  const { data: journals } = await supabase
    .from("documents")
    .select("id, title, created_at, user_id")
    .eq("file_type", "journal")
    .order("created_at", { ascending: false })
    .limit(20);

  // Recent signups
  const { data: signups } = await supabase
    .from("profiles")
    .select("user_id, full_name, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  // Recent live registrations
  const { data: registrations } = await supabase
    .from("documents")
    .select("id, title, created_at, user_id")
    .eq("file_type", "live_registration")
    .order("created_at", { ascending: false })
    .limit(10);

  // Build activity feed
  const feed: Array<{
    type: string;
    id: string;
    user_id: string;
    title: string;
    created_at: string;
  }> = [];

  (journals ?? []).forEach((j) => {
    feed.push({ type: "journal", id: j.id, user_id: j.user_id, title: j.title || "(no title)", created_at: j.created_at });
  });
  (signups ?? []).forEach((s) => {
    feed.push({ type: "signup", id: s.user_id, user_id: s.user_id, title: s.full_name || "New user", created_at: s.created_at });
  });
  (registrations ?? []).forEach((r) => {
    feed.push({ type: "registration", id: r.id, user_id: r.user_id, title: `Registered for session`, created_at: r.created_at });
  });

  feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Stats for today
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const { count: todayJournals } = await supabase
    .from("documents").select("*", { count: "exact", head: true })
    .eq("file_type", "journal").gte("created_at", today).lt("created_at", tomorrow);
  const { count: todaySignups } = await supabase
    .from("profiles").select("*", { count: "exact", head: true })
    .gte("created_at", today).lt("created_at", tomorrow);

  return NextResponse.json({
    feed: feed.slice(0, 50),
    stats: {
      todayJournals: todayJournals ?? 0,
      todaySignups: todaySignups ?? 0,
    },
  });
}
