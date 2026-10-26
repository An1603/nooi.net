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

  // OPC Center host → về trang đăng nhập OPC + xóa cookie phiên RIÊNG (host-only).
  if (host === "opc.nooi.net") {
    const resp = NextResponse.redirect(new URL("/login", "https://opc.nooi.net"));
    for (const n of ["sb-opc-auth-token", "sb-opc-auth-token.0", "sb-opc-auth-token.1"]) {
      resp.cookies.set(n, "", { maxAge: 0, path: "/" });
    }
    return resp;
  }

  // eKid host → về trang đăng nhập CỦA CON + xóa cookie phiên RIÊNG của ekid
  // (tên sb-ekid-auth-token), không đụng phiên người lớn.
  if (host === "ekid.nooi.net") {
    const resp = NextResponse.redirect(new URL("/login", "https://ekid.nooi.net"));
    for (const n of ["sb-ekid-auth-token", "sb-ekid-auth-token.0", "sb-ekid-auth-token.1"]) {
      resp.cookies.set(n, "", { maxAge: 0, path: "/" });
    }
    return resp;
  }

  const resp = NextResponse.redirect(new URL("/", siteUrl));
  // Clear auth cookies
  resp.cookies.set("sb-gsnuqrutiauhnsacgzym-auth-token.0", "", { maxAge: 0, path: "/" });
  resp.cookies.set("sb-gsnuqrutiauhnsacgzym-auth-token.1", "", { maxAge: 0, path: "/" });
  return resp;
}
