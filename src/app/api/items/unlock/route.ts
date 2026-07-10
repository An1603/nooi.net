import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/items/unlock
 *
 * Unlock an item by spending N.
 * Body: { itemId: string }
 * Uses service role key for mutations, SSR client for auth.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { itemId } = body as { itemId?: string };
  if (!itemId) {
    return NextResponse.json({ success: false, error: "Thiếu itemId." });
  }

  // Identify user via SSR client (reads cookies properly)
  const anonSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {}, // Read-only — we don't need to set cookies here
      },
    }
  );
  const {
    data: { user },
  } = await anonSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Chưa đăng nhập." }, { status: 401 });
  }

  // Service role client for mutations
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if already owned
  const { data: existing } = await supabase
    .from("user_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: false, error: "Bạn đã sở hữu vật phẩm này." });
  }

  // Get item info
  const { data: item } = await supabase
    .from("digital_items")
    .select("price_n, level_required")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) {
    return NextResponse.json({ success: false, error: "Vật phẩm không tồn tại." });
  }

  // Check user N
  const { data: profile } = await supabase
    .from("profiles")
    .select("ref_code_changes")
    .eq("user_id", user.id)
    .maybeSingle();

  const userN = ((profile?.ref_code_changes as number) ?? 0) * 10;

  if (item.price_n > 0 && userN < item.price_n) {
    return NextResponse.json({
      success: false,
      error: `Không đủ N. Cần ${item.price_n} N, bạn có ${userN} N.`,
    });
  }

  // Insert user_item
  const { error: insertError } = await supabase.from("user_items").insert({
    user_id: user.id,
    item_id: itemId,
    source: "purchase",
  });

  if (insertError) {
    return NextResponse.json({ success: false, error: insertError.message });
  }

  return NextResponse.json({ success: true });
}
