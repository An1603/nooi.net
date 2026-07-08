import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/items/[id]/download
 *
 * Generates a signed URL for downloading an item file.
 * Only allows download if user owns the item OR item is free.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // SSR client for auth
  const anonSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
  const {
    data: { user },
  } = await anonSupabase.auth.getUser();

  // Service role for queries
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get item
  const { data: item } = await supabase
    .from("digital_items")
    .select("file_url, price_n")
    .eq("id", id)
    .maybeSingle();

  if (!item || !item.file_url) {
    return NextResponse.json({ error: "Vật phẩm không tồn tại." }, { status: 404 });
  }

  // Check access: free items are public, paid items need ownership
  if (item.price_n > 0) {
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }
    const { data: ownership } = await supabase
      .from("user_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_id", id)
      .maybeSingle();

    if (!ownership) {
      return NextResponse.json({ error: "Bạn chưa sở hữu vật phẩm này." }, { status: 403 });
    }
  }

  // Generate signed URL
  const filePath = item.file_url.replace(/^.*\/storage\/v1\/object\/public\//, "");
  const { data: signedUrl } = await supabase.storage
    .from("digital-items")
    .createSignedUrl(filePath, 60);

  if (!signedUrl) {
    return NextResponse.json({ url: item.file_url });
  }

  return NextResponse.json({ url: signedUrl.signedUrl });
}
