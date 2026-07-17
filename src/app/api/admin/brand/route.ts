import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BrandAsset {
  key: string;
  label: string;
  url: string;
  file_type: string;
  width?: number;
  height?: number;
  updated_at: string;
}

interface BrandConfig {
  version: number;
  assets: Record<string, BrandAsset>;
}

async function getConfigDoc() {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("documents")
    .select("id, content")
    .eq("title", "__brand_config__")
    .maybeSingle();
  return data;
}

async function getConfig(): Promise<BrandConfig> {
  const doc = await getConfigDoc();
  if (!doc?.content) return { version: 1, assets: {} };
  try { return JSON.parse(doc.content); }
  catch { return { version: 1, assets: {} }; }
}

async function saveConfig(config: BrandConfig) {
  const adminClient = createAdminClient();
  const doc = await getConfigDoc();
  const content = JSON.stringify(config);
  if (doc) {
    await adminClient.from("documents").update({ content }).eq("id", doc.id);
  } else {
    await adminClient.from("documents").insert({
      title: "__brand_config__",
      content,
      user_id: "6d273d8b-800d-48da-bfce-d37033625e68",
      file_type: "system",
    });
  }
}

/**
 * Upload file to Supabase Storage, thử nhiều bucket + retry không contentType
 */
async function uploadToStorage(
  adminClient: ReturnType<typeof createAdminClient>,
  bucketPath: string,
  buffer: Buffer,
  mimeType: string
): Promise<string | null> {
  // Buckets theo thứ tự ưu tiên
  const buckets = ["images", "avatars", "documents"];

  for (const bucket of buckets) {
    // Thử 1: có contentType
    const { error: e1 } = await adminClient.storage
      .from(bucket)
      .upload(bucketPath, buffer, {
        contentType: mimeType || "application/octet-stream",
        upsert: true,
        cacheControl: "31536000",
      });

    if (!e1) {
      const { data } = adminClient.storage.from(bucket).getPublicUrl(bucketPath);
      return data.publicUrl;
    }

    // Thử 2: không contentType
    if (e1.message?.includes("mime type")) {
      const { error: e2 } = await adminClient.storage
        .from(bucket)
        .upload(bucketPath, buffer, {
          upsert: true,
          cacheControl: "31536000",
        });

      if (!e2) {
        const { data } = adminClient.storage.from(bucket).getPublicUrl(bucketPath);
        return data.publicUrl;
      }

      // Thử 3: đổi extension sang .png + không contentType
      if (e2.message?.includes("mime type")) {
        const altPath = bucketPath.replace(/\.[^.]+$/, ".png");
        const { error: e3 } = await adminClient.storage
          .from(bucket)
          .upload(altPath, buffer, {
            upsert: true,
            cacheControl: "31536000",
          });

        if (!e3) {
          const { data } = adminClient.storage.from(bucket).getPublicUrl(altPath);
          return data.publicUrl;
        }
      }
    }
  }

  return null;
}

// GET /api/admin/brand
export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT /api/admin/brand — upload file + update config
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const key = formData.get("key") as string;
    const label = formData.get("label") as string;
    const file = formData.get("file") as File | null;
    const resetUrl = formData.get("url");

    if (!key || !label) {
      return NextResponse.json({ error: "Missing key or label" }, { status: 400 });
    }

    const config = await getConfig();
    const adminClient = createAdminClient();

    // Reset
    if (resetUrl === "") {
      delete config.assets[key];
      config.version += 1;
      await saveConfig(config);
      return NextResponse.json({ success: true, asset: null });
    }

    if (file && file.size > 0) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const bucketPath = `brand/uploads/${key}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const url = await uploadToStorage(adminClient, bucketPath, buffer, file.type);

      if (!url) {
        return NextResponse.json({ error: "Không thể upload file. Thử đổi định dạng ảnh (PNG, JPG)." }, { status: 500 });
      }

      config.assets[key] = {
        key,
        label,
        url,
        file_type: file.type || "image/png",
        updated_at: new Date().toISOString(),
      };
    }

    config.version += 1;
    await saveConfig(config);
    return NextResponse.json({ success: true, asset: config.assets[key] });

  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
