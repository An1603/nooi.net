import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1200, 2200, 3500];

/**
 * POST /api/items/sync-badges
 *
 * Auto-unlocks badges based on user's current level.
 * Returns list of newly unlocked badge IDs.
 */
export async function POST(req: NextRequest) {
  // Auth
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
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  // Service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get user N
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("file_type", "journal");
  const userN = (count ?? 0) * 10;

  // Calculate level
  let userLevel = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (userN >= LEVEL_THRESHOLDS[i]) { userLevel = i + 1; break; }
  }

  // Get existing owned badge IDs
  const { data: owned } = await supabase
    .from("user_items")
    .select("item_id")
    .eq("user_id", user.id);
  const ownedIds = new Set((owned ?? []).map((o: { item_id: string }) => o.item_id));

  // Get badge items user qualifies for
  const { data: badges } = await supabase
    .from("digital_items")
    .select("id, name, level_required")
    .eq("auto_unlock", true)
    .lte("level_required", userLevel);

  const newlyUnlocked: string[] = [];

  for (const badge of badges ?? []) {
    if (!ownedIds.has(badge.id)) {
      const { error } = await supabase.from("user_items").insert({
        user_id: user.id,
        item_id: badge.id,
        source: "achievement",
      });
      if (!error) {
        newlyUnlocked.push(badge.id);
      }
    }
  }

  return NextResponse.json({ unlocked: newlyUnlocked });
}
