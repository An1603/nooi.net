import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/documents — list all documents (admin view)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileType = searchParams.get("file_type") || "";
  const search = searchParams.get("search") || "";
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
  const offset = Number(searchParams.get("offset")) || 0;

  const supabase = createAdminClient();

  let query = supabase
    .from("documents")
    .select("id, user_id, title, file_type, content, created_at, updated_at, project_id")
    .order("updated_at", { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (fileType && fileType !== "all") {
    if (fileType === "other") {
      query = query.is("file_type", null);
    } else {
      query = query.eq("file_type", fileType);
    }
  }

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get user names
  const userIds = [...new Set((data ?? []).map((d: { user_id: string }) => d.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
    : { data: [] };
  const nameMap = new Map((profiles ?? []).map((p: { user_id: string; full_name: string }) => [p.user_id, p.full_name]));

  // Search filter client-side (for text search)
  let results = (data ?? []).map((d) => ({
    id: d.id,
    user_id: d.user_id,
    user_name: nameMap.get(d.user_id) || d.user_id.slice(0, 8),
    title: d.title,
    file_type: d.file_type || "unknown",
    project_id: d.project_id,
    content_preview: (d.content || "").slice(0, 100),
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));

  if (search) {
    const q = search.toLowerCase();
    results = results.filter((r) => r.title.toLowerCase().includes(q) || r.user_name.toLowerCase().includes(q));
  }

  // Count by type
  const { data: typeCounts } = await supabase
    .from("documents")
    .select("file_type");

  const counts: Record<string, number> = {};
  (typeCounts ?? []).forEach((d: { file_type: string | null }) => {
    const key = d.file_type || "other";
    counts[key] = (counts[key] || 0) + 1;
  });

  return NextResponse.json({ documents: results, total: count ?? 0, typeCounts: counts });
}
