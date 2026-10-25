import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VUON = (process.env.VUON_ADMIN_URL || "http://127.0.0.1:3200").replace(/\/$/, "");
const TOKEN = process.env.VUON_ADMIN_TOKEN || "";

/** Chỉ super_admin / admin mới được gọi. */
async function laQuanTri(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data && ["super_admin", "admin"].includes(data.role);
}

async function goiVuon(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${VUON}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Token": TOKEN },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({ loi: `Vườn trả ${res.status}` }));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ loi: "Chưa cấu hình VUON_ADMIN_TOKEN" }, { status: 500 });
  if (!(await laQuanTri())) return NextResponse.json({ loi: "Không có quyền" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  switch (action) {
    case "ds":
      return goiVuon("/api/admin/ds", {});
    case "cham":
      return goiVuon("/api/admin/cham", { id: b.id, ma: b.ma, nguoi: b.nguoi, muc: b.muc });
    case "tra":
      return goiVuon("/api/admin/tra", { id: b.id });
    case "quyen":
      return goiVuon("/api/admin/quyen", { ma: b.ma, email: b.email, bo: !!b.bo });
    case "quyen-ds":
      return goiVuon("/api/admin/quyen-ds", { ma: b.ma });
    case "nhatky":
      return goiVuon("/api/admin/nhatky", { id: b.id });
    case "hat-ds":
      return goiVuon("/api/admin/hat/ds", {});
    case "hat-luu":
      return goiVuon("/api/admin/hat/luu", { hat: b.hat });
    case "hat-an":
      return goiVuon("/api/admin/hat/an", { ma: b.ma, an: b.an });
    case "hat-xoa":
      return goiVuon("/api/admin/hat/xoa", { ma: b.ma });
    case "nguoi-ds":
      return goiVuon("/api/admin/nguoi/ds", {});
    case "nguoi-them":
      return goiVuon("/api/admin/nguoi/them", { email: b.email, ten: b.ten, vai_tro: b.vai_tro });
    case "nguoi-xoa":
      return goiVuon("/api/admin/nguoi/xoa", { email: b.email });
    default:
      return NextResponse.json({ loi: "Hành động không hợp lệ" }, { status: 400 });
  }
}
