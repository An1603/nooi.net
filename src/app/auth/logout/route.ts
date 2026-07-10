import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

async function handleLogout(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");

  const host = request.headers.get("host") || "";

  // Admin host → redirect to admin login
  if (host === "admin.nooi.net") {
    const resp = NextResponse.redirect(new URL("/admin-login", `https://admin.nooi.net`));
    // Clear auth cookies
    resp.cookies.set("sb-gsnuqrutiauhnsacgzym-auth-token.0", "", { maxAge: 0, path: "/" });
    resp.cookies.set("sb-gsnuqrutiauhnsacgzym-auth-token.1", "", { maxAge: 0, path: "/" });
    return resp;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nooi.net";
  const resp = NextResponse.redirect(new URL("/", siteUrl));
  // Clear auth cookies
  resp.cookies.set("sb-gsnuqrutiauhnsacgzym-auth-token.0", "", { maxAge: 0, path: "/" });
  resp.cookies.set("sb-gsnuqrutiauhnsacgzym-auth-token.1", "", { maxAge: 0, path: "/" });
  return resp;
}
