import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/items?category=hoc-tap
 *
 * Returns all digital items, optionally filtered by category.
 */
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Chỉ trả cột công khai — KHÔNG trả `file_url` (đường dẫn tệp trả phí).
  // Quyền đọc cột này đã bị thu hồi với anon/authenticated ở tầng CSDL (01/11/2026).
  let query = supabase
    .from("digital_items")
    .select(
      "id,name,slug,category,type,image_url,price_n,level_required,auto_unlock,description,sort_order,created_at"
    )
    .order("sort_order");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
