import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: {
    default: "OPC Center — Từ ý tưởng đến doanh nghiệp vận hành",
    template: "%s · OPC Center",
  },
  description:
    "OPC Center giúp người làm kinh doanh một mình chẩn đoán điểm nghẽn, chọn đúng việc tiếp theo và có người đồng hành. Ba cấp độ, mười sản phẩm, online toàn quốc và offline tại NOOI Forest.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "OPC Center — Từ ý tưởng đến doanh nghiệp vận hành",
    description:
      "Chẩn đoán miễn phí, lộ trình theo 3 cấp độ, đồng hành thật. Online toàn quốc và offline tại NOOI Forest.",
    type: "website",
    locale: "vi_VN",
  },
};

export const dynamic = "force-dynamic";

function hopLeHost(host: string): boolean {
  if (host === "opc.nooi.net") return true;
  return process.env.NODE_ENV !== "production" && (host.startsWith("localhost") || host.startsWith("127.0.0.1"));
}

export default async function OpcPublicLayout({ children }: { children: ReactNode }) {
  const host = (await headers()).get("host") || "";
  if (!hopLeHost(host)) notFound();

  return (
    <div className="min-h-screen bg-[#12081F] text-[#F5EFE6]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#12081F]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="OPC Center — về trang chủ">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C8943E]/35 bg-[#C8943E]/10 text-sm font-black text-[#E8C07A]">
              N
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-[0.12em] text-[#F5EFE6]">
                NOOI <span className="text-[#C8943E]">OPC</span>
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-[#9A88AD]">
                Center
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-xs font-semibold text-[#C9BCD7] md:flex">
            <Link href="/goi" className="transition-colors hover:text-[#F5EFE6]">
              Sản phẩm
            </Link>
            <Link href="/#gia-tri" className="transition-colors hover:text-[#F5EFE6]">
              Giá trị
            </Link>
            <Link href="/#cach-hoat-dong" className="transition-colors hover:text-[#F5EFE6]">
              Cách hoạt động
            </Link>
            <Link href="/#forest" className="transition-colors hover:text-[#F5EFE6]">
              NOOI Forest
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex rounded-xl px-2.5 py-2 text-xs font-semibold text-[#C9BCD7] transition-colors hover:bg-white/5 hover:text-[#F5EFE6]"
            >
              Đăng nhập
            </Link>
            <Link
              href="/chan-doan"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#C8943E] px-3 py-2.5 text-xs font-bold text-[#160B22] transition-colors hover:bg-[#E8C07A]"
            >
              Chẩn đoán<span className="hidden sm:inline"> miễn phí</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-white/10 bg-[#0D0616]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3 md:px-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold tracking-[0.12em]">
              <Leaf size={16} className="text-[#C8943E]" />
              NOOI <span className="text-[#C8943E]">OPC</span>
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-[#9A88AD]">
              Hệ sinh thái giáo dục trải nghiệm và chuyển hóa dành cho người làm kinh doanh một mình — online toàn quốc,
              offline tại NOOI Forest.
            </p>
          </div>
          <div className="text-xs">
            <p className="font-semibold uppercase tracking-[0.14em] text-[#C9BCD7]">Khám phá</p>
            <div className="mt-3 grid gap-2 text-[#9A88AD]">
              <Link href="/goi" className="hover:text-[#F5EFE6]">Sản phẩm &amp; giá</Link>
              <Link href="/chan-doan" className="hover:text-[#F5EFE6]">Chẩn đoán 10 câu</Link>
              <Link href="/#cach-hoat-dong" className="hover:text-[#F5EFE6]">Cách OPC hoạt động</Link>
              <Link href="/#forest" className="hover:text-[#F5EFE6]">NOOI Forest</Link>
            </div>
          </div>
          <div className="text-xs">
            <p className="font-semibold uppercase tracking-[0.14em] text-[#C9BCD7]">Bắt đầu</p>
            <div className="mt-3 grid gap-2 text-[#9A88AD]">
              <Link href="/chan-doan" className="hover:text-[#F5EFE6]">Nhận bản chẩn đoán</Link>
              <Link href="/dat-mua/chuan-hoa" className="hover:text-[#F5EFE6]">Đặt mua Chuẩn hóa</Link>
              <Link href="/dat-mua/pro" className="hover:text-[#F5EFE6]">Đặt mua Đồng hành Pro</Link>
              <Link href="/login" className="hover:text-[#F5EFE6]">Đăng nhập thành viên</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 px-4 py-4 text-center text-[11px] text-[#6F5D80]">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={12} />
            OPC Center · NOOI Group · 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
