import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/brand/files — danh sách file đã upload trong brand/uploads/
 */
export async function GET() {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.storage
      .from("images")
      .list("brand/uploads", { sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      // Thử bucket khác
      const { data: d2, error: e2 } = await adminClient.storage
        .from("documents")
        .list("brand/uploads", { sortBy: { column: "created_at", order: "desc" } });

      if (e2) {
        return NextResponse.json({ files: [] });
      }

      const files = (d2 || [])
        .filter((f) => f.name.match(/\.(png|jpg|jpeg|webp|ico|svg)$/i))
        .map((f) => ({
          name: f.name,
          url: adminClient.storage.from("documents").getPublicUrl(`brand/uploads/${f.name}`).data.publicUrl,
          size: f.metadata?.size || 0,
          created_at: f.created_at,
        }));

      return NextResponse.json({ files });
    }

    const files = (data || [])
      .filter((f) => f.name.match(/\.(png|jpg|jpeg|webp|ico|svg)$/i))
      .map((f) => ({
        name: f.name,
        url: adminClient.storage.from("images").getPublicUrl(`brand/uploads/${f.name}`).data.publicUrl,
        size: f.metadata?.size || 0,
        created_at: f.created_at,
      }));

    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
