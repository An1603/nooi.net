import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const LEVEL_NAMES = ["Member 🌰", "Seeker 🌱", "Grower 🌿", "Giver 🌳", "Guider 🌲", "Mentor 🌳", "Master 👑"];
const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1200, 2200, 3500];

function getLevel(n: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (n >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

/**
 * GET /api/items/certificate
 *
 * Generates a certificate SVG for the current user.
 * Query params: level (optional, uses user's current level if omitted)
 */
export async function GET(req: NextRequest) {
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

  // Get user profile
  const { data: profile } = await authSupabase
    .from("profiles")
    .select("display_name, ref_code_changes")
    .eq("user_id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name || user.email?.split("@")[0] || "Học viên";
  const userN = ((profile?.ref_code_changes as number) ?? 0) * 10;
  const userLevel = getLevel(userN);
  const levelName = LEVEL_NAMES[userLevel - 1];

  const today = new Date().toLocaleDateString("vi-VN", {
    year: "numeric", month: "long", day: "numeric",
  });

  // SVG Certificate
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a0a2e"/>
      <stop offset="100%" stop-color="#2a1a3e"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C8943E"/>
      <stop offset="100%" stop-color="#E8B84E"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>

  <!-- Outer border -->
  <rect x="0" y="0" width="800" height="600" rx="20" fill="url(#bg)"/>
  <rect x="15" y="15" width="770" height="570" rx="15" fill="none" stroke="url(#gold)" stroke-width="2"/>
  <rect x="20" y="20" width="760" height="560" rx="12" fill="none" stroke="url(#gold)" stroke-width="0.5" opacity="0.5"/>

  <!-- Decorative corners -->
  <text x="40" y="50" font-size="24" fill="url(#gold)" opacity="0.3">✦</text>
  <text x="740" y="50" font-size="24" fill="url(#gold)" opacity="0.3" text-anchor="end">✦</text>
  <text x="40" y="570" font-size="24" fill="url(#gold)" opacity="0.3">✦</text>
  <text x="740" y="570" font-size="24" fill="url(#gold)" opacity="0.3" text-anchor="end">✦</text>

  <!-- Title -->
  <text x="400" y="100" font-family="serif" font-size="14" fill="#C8943E" text-anchor="middle" letter-spacing="4" opacity="0.7">NOOI</text>
  <text x="400" y="145" font-family="serif" font-size="28" fill="url(#gold)" text-anchor="middle" letter-spacing="2" font-weight="bold">CHỨNG NHẬN HOÀN THÀNH</text>

  <!-- Decorative line -->
  <line x1="200" y1="165" x2="600" y2="165" stroke="url(#gold)" stroke-width="0.5" opacity="0.5"/>

  <!-- Body -->
  <text x="400" y="220" font-family="sans-serif" font-size="16" fill="#a0a0a0" text-anchor="middle">Chứng nhận này được trao cho</text>

  <!-- Name -->
  <text x="400" y="280" font-family="serif" font-size="36" fill="#ffffff" text-anchor="middle" font-weight="bold">${displayName}</text>

  <!-- Level -->
  <text x="400" y="340" font-family="sans-serif" font-size="16" fill="#a0a0a0" text-anchor="middle">đã đạt cấp độ</text>
  <text x="400" y="380" font-family="serif" font-size="28" fill="url(#accent)" text-anchor="middle" font-weight="bold">${levelName}</text>

  <!-- Date -->
  <text x="400" y="440" font-family="sans-serif" font-size="13" fill="#707070" text-anchor="middle">Ngày cấp: ${today}</text>

  <!-- Footer -->
  <text x="400" y="510" font-family="serif" font-size="12" fill="#C8943E" text-anchor="middle" opacity="0.5">Kết nối chuyển mình — thân khỏe, tâm minh</text>
  <text x="400" y="540" font-family="sans-serif" font-size="10" fill="#505050" text-anchor="middle">${userN} N · NOOI Ecosystem</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="nooi-certificate-${userLevel}.svg"`,
      "Cache-Control": "no-cache",
    },
  });
}
