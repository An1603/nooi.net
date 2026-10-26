"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  ReceiptText,
  UserRound,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { VAI_TRO_LABEL } from "@/lib/opc/types";
import { initials } from "@/lib/opc/format";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  staffOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/leads", label: "CRM · Lead", icon: Users, staffOnly: true },
  { href: "/cong-dong", label: "Cộng đồng", icon: MessagesSquare },
  { href: "/don-hang", label: "Gói & đơn", icon: ReceiptText, staffOnly: true },
  { href: "/ho-so", label: "Hồ sơ của tôi", icon: UserRound },
];

export default function OpcShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { ten: string | null; email: string | null; vaiTro: string; isStaff: boolean; isAdmin: boolean };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = NAV.filter((x) => !x.staffOnly || user.isStaff);

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const navLinks = (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const Icon = item.icon;
        const on = active(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              on
                ? "bg-[#C8943E]/15 text-[#E8C07A] border border-[#C8943E]/25"
                : "text-[#B9A9C9] border border-transparent hover:bg-white/5 hover:text-[#F5EFE6]"
            }`}
          >
            <Icon size={17} className={on ? "text-[#E8C07A]" : "text-[#8E7CA3] group-hover:text-[#E8C07A]"} />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#C8943E] text-[#160B22] font-black text-lg shadow-[0_0_24px_rgba(200,148,62,0.35)]">
        N
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-bold tracking-[0.18em] text-[#F5EFE6]">NOOI</span>
        <span className="block text-[9px] font-semibold tracking-[0.28em] text-[#C8943E]">OPC CENTER</span>
      </span>
    </Link>
  );

  const userBox = (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2A1538] text-xs font-bold text-[#E8C07A] border border-[#C8943E]/25">
          {initials(user.ten, user.email)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[#F5EFE6]">{user.ten || "Thành viên"}</span>
          <span className="block truncate text-[11px] text-[#A797B8]">
            {VAI_TRO_LABEL[user.vaiTro] || user.vaiTro}
          </span>
        </span>
        <Link
          href="/auth/logout"
          title="Đăng xuất"
          className="rounded-lg p-1.5 text-[#8E7CA3] hover:bg-white/5 hover:text-[#E8C07A]"
        >
          <LogOut size={15} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F0718] text-[#F5EFE6]">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-white/10 bg-[#140A1E]/95 px-4 py-5 lg:flex">
        {brand}
        <div className="mt-7 flex-1">{navLinks}</div>
        <div className="space-y-3">
          <div className="rounded-xl border border-[#C8943E]/15 bg-[#C8943E]/5 p-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#E8C07A]">
              <Sparkles size={13} /> M03 · Vận hành thật
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#A797B8]">
              Một người — một hồ sơ. Một việc — một chủ. Một số — một nguồn.
            </p>
          </div>
          {userBox}
          <Link
            href="https://nooi.net"
            className="flex items-center justify-between rounded-lg px-2 py-1 text-[11px] text-[#8E7CA3] hover:text-[#E8C07A]"
          >
            <span>Về nooi.net</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0F0718]/90 px-4 py-3 backdrop-blur-md lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-white/10 p-2 text-[#D8C8E8]"
          aria-label="Mở menu"
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-white/10 bg-[#140A1E] px-4 py-5">
            <div className="flex items-center justify-between">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/10 p-2 text-[#D8C8E8]"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 flex-1">{navLinks}</div>
            {userBox}
          </div>
        </div>
      )}

      <main className="lg:pl-[248px]">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
