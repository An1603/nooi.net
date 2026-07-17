import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/brand/favicon — redirects to the current favicon from brand config
 * Dùng cho <link rel="icon"> trong <head>
 */
export async function GET(req: NextRequest) {
  try {
    const adminClient = createAdminClient();

    // Đọc brand config
    const { data, error } = await adminClient.storage
      .from("images")
      .download("brand/config.json");

    if (error || !data) {
      // Fallback: serve file tĩnh
      return NextResponse.redirect(new URL("/favicon.ico", req.url));
    }

    const config = JSON.parse(await data.text());
    const faviconUrl = config.assets?.favicon?.url;

    if (!faviconUrl) {
      return NextResponse.redirect(new URL("/favicon.ico", req.url));
    }

    // Fetch và serve file (tránh redirect về Supabase)
    const imageRes = await fetch(faviconUrl);
    if (!imageRes.ok) {
      return NextResponse.redirect(new URL("/favicon.ico", req.url));
    }

    const buffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get("content-type") || "image/png";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/favicon.ico", req.url));
  }
}
