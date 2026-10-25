import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VUON = (process.env.VUON_ADMIN_URL || "http://127.0.0.1:3200").replace(/\/$/, "");
const TOKEN = process.env.VUON_ADMIN_TOKEN || "";

const LOAI: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  txt: "text/plain; charset=utf-8",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
};

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

export async function GET(req: NextRequest) {
  if (!(await laQuanTri())) return NextResponse.json({ loi: "Không có quyền" }, { status: 403 });

  const ten = (req.nextUrl.searchParams.get("ten") || "").replace(/[^A-Za-z0-9._-]/g, "");
  if (!ten) return NextResponse.json({ loi: "Thiếu tên tệp" }, { status: 400 });

  const res = await fetch(`${VUON}/tep/${ten}`, {
    headers: { "X-Admin-Token": TOKEN },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ loi: "Không tải được tệp" }, { status: res.status });

  const buf = Buffer.from(await res.arrayBuffer());
  const ext = ten.split(".").pop()!.toLowerCase();
  const tenGoc = decodeURIComponent(res.headers.get("X-Ten-Goc") || ten);

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": LOAI[ext] || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(tenGoc)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
