import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gsnuqrutiauhnsacgzym.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // sw.js PHẢI không bị cache: nếu trình duyệt/Cloudflare giữ bản cũ thì bản vá
        // service worker không tới được người đã cài PWA.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Dữ liệu thư viện ảnh đổi mỗi lần đồng bộ -> đừng để trình duyệt giữ bản cũ.
        source: "/gallery/data/gallery.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
  // Thư viện ảnh: KHÔNG còn rewrite sang public/gallery/index.html — đã là trang Next
  // (`src/app/(public)/gallery/page.tsx`) để dùng chung thanh đầu trang, không tải lại cả trang.
  // Ảnh và dữ liệu vẫn phục vụ tĩnh từ public/gallery (images/, data/gallery.json).
  async rewrites() {
    return [];
  },
};

export default nextConfig;
