import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/library/pdf-proxy?url=ENCODED_URL
 * Proxy PDF từ Supabase storage → stream về client với headers cho phép embed.
 * Supabase storage trả về X-Frame-Options: DENY → block iframe.
 * Endpoint này fetch PDF server-side và stream về không có header block.
 */
export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    // Fetch PDF from Supabase storage server-side
    const response = await fetch(url, {
      headers: {
        // Forward Supabase auth if needed (storage URLs are usually pre-signed)
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.status}` },
        { status: response.status }
      );
    }

    // Stream PDF back with embed-friendly headers
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", "inline; filename=\"document.pdf\"");
    headers.set("Cache-Control", "public, max-age=3600");
    // Không set X-Frame-Options → cho phép embed

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("PDF proxy error:", err);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}