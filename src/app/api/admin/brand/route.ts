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
  try {
    return JSON.parse(doc.content);
  } catch {
    return { version: 1, assets: {} };
  }
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

    // Reset: xóa asset khỏi config → dùng file mặc định
    if (resetUrl === "") {
      delete config.assets[key];
      config.version += 1;
      await saveConfig(config);
      return NextResponse.json({ success: true, asset: null });
    }

    if (file && file.size > 0) {
      const ext = file.name.split(".").pop() || "png";
      const bucketPath = `brand/uploads/${key}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await adminClient.storage
        .from("images")
        .upload(bucketPath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
          cacheControl: "31536000",
        });

      // Nếu bị từ chối vì MIME type, thử lại không có contentType
      if (uploadError && uploadError.message?.includes("mime type")) {
        const { error: retryError } = await adminClient.storage
          .from("images")
          .upload(bucketPath, buffer, {
            upsert: true,
            cacheControl: "31536000",
          });
        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }
      } else if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: urlData } = adminClient.storage
        .from("images")
        .getPublicUrl(bucketPath);

      config.assets[key] = {
        key,
        label,
        url: urlData.publicUrl,
        file_type: file.type,
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
