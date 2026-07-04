import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NOOI — Kết nối chuyển mình.",
  description:
    "Nền tảng sản xuất nội dung AI toàn diện. Xây dựng dự án, quản lý video, truy cập tài liệu học tập và cộng tác với các tác tử thông minh.",
  keywords: [
    "AI platform",
    "video production",
    "AI agents",
    "NOOI",
    "kết nối chuyển mình",
    "nền tảng AI",
    "học tập AI",
  ],
  openGraph: {
    title: "NOOI — Kết nối chuyển mình.",
    description:
      "Nền tảng sản xuất nội dung AI — kết nối tri thức, chuyển mình cùng công nghệ.",
    type: "website",
    locale: "vi_VN",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "NOOI",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
  themeColor: "#C8943E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <head>
        {/* PWA — Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", function () {
                  navigator.serviceWorker.register("/sw.js").catch(function (err) {
                    console.log("SW registration failed:", err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div id="toast-debug" className="hidden">
          toast marker
        </div>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
