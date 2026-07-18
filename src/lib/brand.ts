import { createAdminClient } from "@/lib/supabase/admin";

interface BrandAsset {
  key: string;
  label: string;
  url: string;
  file_type: string;
  updated_at: string;
}

interface BrandConfig {
  version: number;
  assets: Record<string, BrandAsset>;
}

// Cache trong memory (server-side, tồn tại suốt vòng đời process)
let cachedConfig: BrandConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 phút

/**
 * Lấy brand config từ DB, có cache 1 phút.
 * Dùng trong server components và API routes.
 */
export async function getBrandConfig(): Promise<BrandConfig> {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("documents")
      .select("content")
      .eq("title", "__brand_config__")
      .maybeSingle();

    if (data?.content) {
      cachedConfig = JSON.parse(data.content) as BrandConfig;
      cacheTime = now;
      return cachedConfig;
    }
  } catch {}

  return { version: 1, assets: {} };
}

/**
 * Lấy URL của một brand asset theo key.
 * Trả về URL từ config nếu có, ngược lại fallback về public path.
 */
export async function getBrandUrl(key: string, fallback: string): Promise<string> {
  const config = await getBrandConfig();
  return config.assets[key]?.url || fallback;
}

/**
 * Map các key phổ biến → fallback path
 */
const FALLBACKS: Record<string, string> = {
  favicon: "/favicon.ico",
  "favicon-png": "/favicon.png",
  "apple-touch-icon": "/apple-touch-icon.png",
  "pwa-icon-192": "/pwa/icon-192.png",
  "pwa-icon-512": "/pwa/icon-512.png",
  "logo-horizontal": "/brand/nooi-horizontal.png",
  "logo-horizontal-white": "/brand/nooi-horizontal-white.png",
  "logo-square": "/brand/nooi-stacked.png",
  "logo-square-white": "/brand/nooi-stacked-white.png",
  "logo-icon": "/brand/nooi-icon-v.png",
  "logo-icon-white": "/brand/nooi-icon-v-white.png",
};

export function getBrandFallback(key: string): string {
  return FALLBACKS[key] || "";
}
