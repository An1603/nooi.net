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
  // Thư viện ảnh tĩnh (public/gallery) — trỏ /gallery → index.html.
  // Middleware đã whitelist "/gallery" nên xem được không cần đăng nhập.
  async rewrites() {
    return [
      { source: "/gallery", destination: "/gallery/index.html" },
      { source: "/gallery/", destination: "/gallery/index.html" },
    ];
  },
};

export default nextConfig;
