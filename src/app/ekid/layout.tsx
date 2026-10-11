import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KID } from "@/components/ekid/child/kid-theme";

export const dynamic = "force-dynamic";

// Metadata RIÊNG cho phân hệ con (eKid) — độc lập với NOOI người lớn.
// Manifest riêng /ekid-manifest.json (được middleware phục vụ cho host ekid.nooi.net).
export const metadata: Metadata = {
  title: "eKid",
  description: "Bạn học AI của bé — thuộc NOOI",
  manifest: "/ekid-manifest.json",
  appleWebApp: {
    capable: true,
    title: "eKid",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/pwa/ekid-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa/ekid-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/pwa/ekid-icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff7a59",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};


// Lấy hồ sơ bé của tài khoản đang đăng nhập (đọc qua RLS child_user_id).
async function currentKid() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("ekid_kids")
    .select("name, avatar_emoji")
    .eq("child_user_id", user.id)
    .maybeSingle();

  return data;
}

// Layout tối giản cho phân hệ con — KHÔNG Sidebar/Topbar người lớn.
// Tone SÁNG sinh động cho trẻ (xem kid-theme.ts), khác hẳn tone tối NOOI.
export default async function EkidLayout({ children }: { children: ReactNode }) {
  const kid = await currentKid();

  return (
    <div className={`${KID.page} ekid-scope`}>
      <header className="flex items-center justify-between gap-2 border-b-2 border-[#bae6fd] bg-white/70 px-3 py-3 backdrop-blur">
        <Link
          href="/ekid"
          className="flex items-center gap-1.5 text-2xl font-extrabold text-[#ff7a59]"
        >
          <span aria-hidden>🎓</span>
          <span>eKid</span>
        </Link>

        {kid ? (
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-[#3b2a20]">
              <span aria-hidden className="mr-1">
                {kid.avatar_emoji ?? "🦊"}
              </span>
              {kid.name}
            </span>
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="min-h-[48px] rounded-full border-2 border-[#ff7a59]/60 bg-white px-4 py-2 text-base font-bold text-[#e15a3a] transition-transform hover:scale-[1.03] active:scale-95"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        ) : null}
      </header>

      <main className="flex-1 px-3 py-5">{children}</main>

      <footer className="border-t-2 border-[#bae6fd] bg-white/70 px-4 py-5 text-center backdrop-blur">
        <p className="text-base font-semibold text-[#6b5648]">
          Phân hệ eKid thuộc{" "}
          <a
            href="https://nooi.net"
            target="_blank"
            rel="noopener"
            className="font-extrabold text-[#ff7a59] underline decoration-2 underline-offset-2 hover:text-[#e15a3a]"
          >
            NOOI
          </a>
        </p>
      </footer>
    </div>
  );
}
