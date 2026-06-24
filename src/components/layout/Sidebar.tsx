'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import {
  LayoutDashboard,
  FolderOpen,
  Video,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { label: 'Dự án', href: '/app/projects', icon: FolderOpen },
  { label: 'Video', href: '/app/videos', icon: Video },
  { label: 'Thư viện', href: '/app/library', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== '/app' && pathname.startsWith(href + '/'));

  const linkClass = (href: string) =>
    cn(
      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
      isActive(href)
        ? 'bg-primary/10 text-primary border-l-2 border-primary pl-2.5'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent pl-2.5'
    );

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-3 pt-3 pb-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 no-underline" onClick={() => setMobileOpen(false)}>
          <Logo variant="circular" className="!w-6 !h-6 shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-bold tracking-tight text-foreground">NOOI</span>
            <span className="text-[10px] text-muted-foreground block leading-tight">
              Kết nối chuyển mình.
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={linkClass(item.href)}
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-border space-y-0.5">
        <Link
          href="/app/settings"
          onClick={() => setMobileOpen(false)}
          className={linkClass('/app/settings')}
        >
          <Settings size={18} className="shrink-0" />
          <span>Cài đặt</span>
        </Link>
        <form action="/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all border-l-2 border-transparent"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 shrink-0 min-h-screen border-r border-border bg-card flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border flex flex-col shadow-2xl animate-slide-up">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
