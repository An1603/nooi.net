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
  async headers() {
    return [
      {
        // sw.js PHẢI không bị cache: nếu trình duyệt/Cloudflare giữ bản cũ 4 giờ thì bản vá
        // service worker (nguyên nhân trang tĩnh hiển thị lộn xộn vì css/js cũ) không tới được
        // người đã cài PWA. Trình duyệt vẫn tự kiểm tra sw.js, nhưng đừng để lớp cache nào cản.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/gallery", destination: "/gallery/index.html" },
      { source: "/gallery/", destination: "/gallery/index.html" },
    ];
  },
};

export default nextConfig;
