import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * API quản trị mật khẩu slides.nooi.net.
 * Gọi server-side sang dịch vụ tĩnh (127.0.0.1:3101) bằng token dùng chung.
 * Token KHÔNG bao giờ lộ ra trình duyệt.
 */

const SLIDES_API = process.env.SLIDES_API_URL || "http://127.0.0.1:3101";
const SLIDES_TOKEN = process.env.SLIDES_ADMIN_TOKEN || "";

async function currentAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  return data ? user : null;
}

async function callSlides(method: "GET" | "POST", body?: unknown) {
  const res = await fetch(`${SLIDES_API}/__api/auth`, {
    method,
    headers: {
      "X-Nooi-Token": SLIDES_TOKEN,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function GET() {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: "Không có quyền quản trị" }, { status: 403 });
  }
  if (!SLIDES_TOKEN) {
    return NextResponse.json({ error: "Thiếu cấu hình SLIDES_ADMIN_TOKEN" }, { status: 500 });
  }
  const r = await callSlides("GET");
  return NextResponse.json(r.data, { status: r.status });
}

export async function POST(request: NextRequest) {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: "Không có quyền quản trị" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const payload: Record<string, unknown> = {};
  if (typeof body.master === "string") payload.master = body.master;
  if (body.decks && typeof body.decks === "object") payload.decks = body.decks;
  if (body.rotate) payload.rotate = true;
  const r = await callSlides("POST", payload);
  return NextResponse.json(r.data, { status: r.status });
}