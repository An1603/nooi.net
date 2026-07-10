import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/items/gift
 *
 * Gift an item to another user by their referral code.
 * Body: { itemId: string, recipientCode: string, message?: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { itemId, recipientCode, message } = body as {
    itemId?: string;
    recipientCode?: string;
    message?: string;
  };

  if (!itemId || !recipientCode) {
    return NextResponse.json({ success: false, error: "Thiếu thông tin." });
  }

  // Auth sender
  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user: sender } } = await authSupabase.auth.getUser();
  if (!sender) {
    return NextResponse.json({ success: false, error: "Chưa đăng nhập." }, { status: 401 });
  }

  // Service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Find recipient by referral code
  const { data: recipient } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .eq("referral_code", recipientCode.toUpperCase())
    .maybeSingle();

  if (!recipient) {
    return NextResponse.json({ success: false, error: "Không tìm thấy người nhận." });
  }

  if (recipient.user_id === sender.id) {
    return NextResponse.json({ success: false, error: "Không thể tặng cho chính mình." });
  }

  // Check sender owns the item
  const { data: ownership } = await supabase
    .from("user_items")
    .select("id")
    .eq("user_id", sender.id)
    .eq("item_id", itemId)
    .maybeSingle();

  if (!ownership) {
    return NextResponse.json({ success: false, error: "Bạn không sở hữu vật phẩm này." });
  }

  // Check recipient doesn't already have it
  const { data: alreadyOwned } = await supabase
    .from("user_items")
    .select("id")
    .eq("user_id", recipient.user_id)
    .eq("item_id", itemId)
    .maybeSingle();

  if (alreadyOwned) {
    return NextResponse.json({ success: false, error: "Người nhận đã có vật phẩm này." });
  }

  // Insert gift to recipient
  const { error: insertError } = await supabase.from("user_items").insert({
    user_id: recipient.user_id,
    item_id: itemId,
    source: "gift",
    gifted_by: sender.id,
  });

  if (insertError) {
    return NextResponse.json({ success: false, error: insertError.message });
  }

  return NextResponse.json({
    success: true,
    recipientName: recipient.display_name || recipientCode.toUpperCase(),
  });
}
