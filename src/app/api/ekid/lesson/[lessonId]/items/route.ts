import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { readKid } from "@/lib/ekid/access";

export const dynamic = "force-dynamic";

/**
 * GET /api/ekid/lesson/{lessonId}/items?kid_id=
 *
 * Trả ngân hàng câu hỏi của bài — CHỈ câu hỏi, KHÔNG kèm đáp án và KHÔNG kèm
 * thang gợi ý. Đáp án chỉ được chấm ở server; gợi ý chỉ mở qua /api/ekid/hint.
 */
export async function GET(req: Request, ctx: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const kidId = new URL(req.url).searchParams.get("kid_id");
  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });
  const kid = await readKid(user.id, kidId);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { lessonId } = await ctx.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ekid_items")
    .select("id, prompt, kind, level, objective_id")
    .eq("lesson_id", lessonId)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []).map((r) => ({
    id: r.id as string,
    prompt: r.prompt as string,
    kind: r.kind as string,
    level: r.level as number,
  }));

  return NextResponse.json({ items, count: items.length });
}
