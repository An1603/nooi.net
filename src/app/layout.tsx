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
  title: "NOOI",
  description:
    "Kết nối chuyển mình — thân khỏe, tâm minh. Hệ sinh thái giáo dục trải nghiệm, chuyển hóa thân tâm với kho tri thức multimedia, mentor chuyên gia kèm cặp và trợ lý AI đồng hành.",
  keywords: [
    "NOOI",
    "kết nối chuyển mình",
    "thân khỏe tâm minh",
    "chuyển hóa thân tâm",
    "thiền định",
    "khí công",
    "healing tourism",
    "an nhiên tự tại",
    "mentor thân tâm",
    "trợ lý AI giọng nói",
  ],
  openGraph: {
    title: "NOOI",
    description:
      "Kết nối chuyển mình — thân khỏe, tâm minh. Hệ sinh thái giáo dục trải nghiệm và chuyển hóa thân tâm.",
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
  themeColor: "#1a0a2e",
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
