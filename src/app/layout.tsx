import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { ToastProvider } from "@/components/ToastProvider";
import { VerifiedToastNotifier } from "@/components/VerifiedToastNotifier";

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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div id="toast-debug" className="hidden">toast marker</div>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
