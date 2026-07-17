import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StorageFile {
  name: string;
  url: string;
  size: number;
  created_at: string;
  bucket: string;
  path: string;
}

/**
 * Liệt kê tất cả file trong brand/ (gốc + uploads/) trên tất cả bucket
 */
async function listAll(adminClient: ReturnType<typeof createAdminClient>): Promise<StorageFile[]> {
  const files: StorageFile[] = [];
  const buckets = ["images", "documents", "avatars"];
  const prefixes = ["brand", "brand/uploads"];

  for (const bucket of buckets) {
    for (const prefix of prefixes) {
      const { data } = await adminClient.storage
        .from(bucket)
        .list(prefix, { sortBy: { column: "created_at", order: "desc" } });

      if (data) {
        for (const f of data) {
          if (!f.metadata) continue; // folder
          if (!f.name.match(/\.(png|jpg|jpeg|webp|ico|svg|gif)$/i)) continue;

          const { data: urlData } = adminClient.storage
            .from(bucket)
            .getPublicUrl(`${prefix}/${f.name}`);

          files.push({
            name: f.name,
            url: urlData.publicUrl,
            size: f.metadata?.size || 0,
            created_at: f.created_at || "",
            bucket,
            path: `${prefix}/${f.name}`,
          });
        }
      }
    }
  }

  // Dedup by URL
  const seen = new Set<string>();
  return files.filter((f) => {
    if (seen.has(f.url)) return false;
    seen.add(f.url);
    return true;
  });
}

// GET /api/admin/brand/files
export async function GET() {
  try {
    const adminClient = createAdminClient();
    const files = await listAll(adminClient);
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}

// DELETE /api/admin/brand/files?bucket=images&path=brand/uploads/file.png
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bucket = url.searchParams.get("bucket");
    const path = url.searchParams.get("path");

    if (!bucket || !path) {
      return NextResponse.json({ error: "Missing bucket or path" }, { status: 400 });
    }

    // Chỉ cho phép xóa trong brand/
    if (!path.startsWith("brand/")) {
      return NextResponse.json({ error: "Chỉ được xóa file trong brand/" }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.storage.from(bucket).remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
