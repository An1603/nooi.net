import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Helpers ────────────────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500];
const LEVEL_NAMES = ["Người mới", "Người tìm kiếm", "Học viên", "Người thực hành", "Người đồng hành", "Mentor", "Master Mentor"];

function calcLevel(n: number) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (n >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return level;
}

// GET /api/admin/users — list all users with stats
export async function GET() {
  const supabase = createAdminClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get all admin users for role mapping
  const { data: admins } = await supabase
    .from("admin_users")
    .select("user_id, email, role");

  const adminMap = new Map((admins ?? []).map((a) => [a.user_id, a]));

  // Get journal counts for all users in batch
  const userIds = (profiles ?? []).map((p) => p.user_id);
  const { data: journals } = userIds.length > 0
    ? await supabase.from("documents").select("user_id").eq("file_type", "journal").in("user_id", userIds).limit(5000)
    : { data: [] };

  const journalCounts = new Map<string, number>();
  (journals ?? []).forEach((j: { user_id: string }) => {
    journalCounts.set(j.user_id, (journalCounts.get(j.user_id) || 0) + 1);
  });

  // Level stats for summary
  const levelStats = new Map<number, number>();
  for (let i = 1; i <= 7; i++) levelStats.set(i, 0);
  let totalN = 0;

  const users = (profiles ?? []).map((p) => {
    const journals = journalCounts.get(p.user_id) || 0;
    const n = journals * 10;
    const level = calcLevel(n);
    totalN += n;
    levelStats.set(level, (levelStats.get(level) || 0) + 1);

    const admin = adminMap.get(p.user_id) as { email?: string; role?: string } | undefined;
    return {
      id: p.user_id,
      full_name: p.full_name,
      email: admin?.email ?? null,
      onboarding_completed: p.onboarding_completed,
      has_numerology: p.numerology_report !== null,
      has_tuvi: p.tuvi_report !== null,
      has_astrology: p.chiem_tinh_report !== null,
      role: admin?.role ?? "user",
      created_at: p.created_at,
      date_of_birth: p.date_of_birth,
      gio_sinh: p.gio_sinh,
      gioi_tinh: p.gioi_tinh,
      noi_sinh: p.noi_sinh,
      // Added stats
      journals,
      n,
      level,
      level_name: LEVEL_NAMES[level - 1],
      public_slug: p.public_slug,
      public_is_visible: p.public_is_visible,
      public_headline: p.public_headline,
    };
  });

  return NextResponse.json({
    users,
    stats: {
      total: users.length,
      totalN,
      byLevel: Object.fromEntries(levelStats),
      levelNames: LEVEL_NAMES,
    },
  });
}

// POST /api/admin/users — create new user
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email và mật khẩu là bắt buộc" }, { status: 400 });
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || "" },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authUser?.user) {
      return NextResponse.json({ error: "Không thể tạo user" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: { id: authUser.user.id, email: authUser.user.email },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
