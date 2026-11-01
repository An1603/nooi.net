import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/library/pdf-proxy?url=ENCODED_URL
 * Proxy PDF từ Supabase storage → stream về client với headers cho phép embed.
 * Supabase storage trả về X-Frame-Options: DENY → block iframe.
 * Endpoint này fetch PDF server-side và stream về không có header block.
 */

const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").host.toLowerCase();
  } catch {
    return "";
  }
})();

/** Miền phụ được phép (phân tách bằng dấu phẩy), ví dụ PDF_PROXY_HOSTS=drive.google.com */
const EXTRA_HOSTS = (process.env.PDF_PROXY_HOSTS || "")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

const MAX_BYTES = 50 * 1024 * 1024;

/**
 * BẢO MẬT (audit 01/11/2026): trước đây route tải URL bất kỳ do client gửi lên ⇒
 * máy chủ bị mượn để gọi mạng nội bộ (127.0.0.1, dashboard nội bộ, metadata cloud)
 * và để tải hộ tệp lớn. Nay chỉ nhận HTTPS trên kho Storage của chính project, hoặc
 * các miền khai báo tường minh qua PDF_PROXY_HOSTS. Không đi theo redirect.
 */
function resolveAllowedUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;

  const host = url.host.toLowerCase();
  const laKhoNooi =
    host === SUPABASE_HOST && url.pathname.startsWith("/storage/v1/object/");
  const laMienChoPhep = EXTRA_HOSTS.includes(host);

  if (!laKhoNooi && !laMienChoPhep) return null;
  return url;
}

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  const url = resolveAllowedUrl(raw);
  if (!url) {
    return NextResponse.json({ error: "Địa chỉ tệp không được phép" }, { status: 400 });
  }

  try {
    // Chỉ gắn khoá khi tải từ chính kho NOOI
    const fetchHeaders: Record<string, string> = {};
    if (url.host.toLowerCase() === SUPABASE_HOST) {
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      fetchHeaders.Authorization = "Bearer " + anon;
      fetchHeaders.apikey = anon;
    }

    const response = await fetch(url, {
      headers: fetchHeaders,
      redirect: "error", // không cho chuyển hướng sang đích khác
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.status}` },
        { status: response.status }
      );
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_BYTES) {
      return NextResponse.json({ error: "Tệp quá lớn" }, { status: 413 });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("pdf") && !contentType.startsWith("application/octet-stream")) {
      return NextResponse.json({ error: "Không phải tệp PDF" }, { status: 415 });
    }

    // Stream PDF back with embed-friendly headers
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", 'inline; filename="document.pdf"');
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("X-Content-Type-Options", "nosniff");
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
