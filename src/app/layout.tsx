import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { PWAUpdateToast } from "@/components/pwa/PWAUpdateToast";
import { getBrandUrl } from "@/lib/brand";
import { BrandProvider } from "@/components/brand/BrandProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const faviconUrl = await getBrandUrl("favicon", "/favicon.ico");
  const appleIconUrl = await getBrandUrl("apple-touch-icon", "/apple-touch-icon.png");

  return {
    title: "NOOI",
    description:
      "Kết nối chuyển mình — thân khỏe, tâm minh. Hệ sinh thái giáo dục trải nghiệm, chuyển hóa thân tâm với kho tri thức multimedia, mentor chuyên gia kèm cặp và trợ lý AI đồng hành.",
    keywords: [
      "NOOI", "kết nối chuyển mình", "thân khỏe tâm minh", "chuyển hóa thân tâm",
      "thiền định", "khí công", "healing tourism", "an nhiên tự tại",
      "mentor thân tâm", "trợ lý AI giọng nói",
    ],
    openGraph: {
      title: "NOOI",
      description:
        "Kết nối chuyển mình — thân khỏe, tâm minh. Hệ sinh thái giáo dục trải nghiệm và chuyển hóa thân tâm.",
      type: "website",
      locale: "vi_VN",
    },
    icons: {
      icon: faviconUrl,
      apple: appleIconUrl,
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      title: "NOOI",
      statusBarStyle: "black-translucent",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: true,
  minimumScale: 1,
  maximumScale: 3,
  themeColor: "#1a0a2e",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Host ekid.nooi.net và opc.nooi.net KHÔNG dùng service worker: cache của SW khoá
  // theo URL (không theo người dùng) → dễ phục vụ dữ liệu cũ/của người khác. Trên hai
  // host này ta chủ động GỠ mọi SW + xoá cache cũ; các host khác giữ nguyên PWA.
  const host = (await headers()).get("host") || "";
  const isEkidHost = host === "ekid.nooi.net";
  const isOpcHost = host === "opc.nooi.net";
  const swScript = isEkidHost || isOpcHost
    ? `
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (regs) {
          regs.forEach(function (r) { r.unregister(); });
        });
        if (window.caches && caches.keys) {
          caches.keys().then(function (keys) {
            keys.forEach(function (k) { caches.delete(k); });
          });
        }
      }
    `
    : `
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () {
          navigator.serviceWorker.register("/sw.js").catch(function (err) {
            console.log("SW registration failed:", err);
          });
        });
      }
    `;

  return (
    <html lang="vi" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div id="toast-debug" className="hidden">toast marker</div>
        <BrandProvider>{children}</BrandProvider>
        <ToastProvider />
        {!isOpcHost && <PWAUpdateToast />}
      </body>
    </html>
  );
}
