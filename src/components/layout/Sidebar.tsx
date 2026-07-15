'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Sparkles,
  Headphones,
  User,
  BookHeart,
  Users,
  Layers,
  Package,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { label: 'Học tập', href: '/app/hoc-tap', icon: BookOpen },
  { label: 'Lớp Live', href: '/app/live', icon: Video },
  { label: 'Nhật ký', href: '/app/journal', icon: BookHeart },
  { label: 'Thực hành', href: '/app/thuc-hanh', icon: Sparkles },
  { label: 'Thẻ chuyển hóa', href: '/app/the-chuyen-hoa', icon: Layers },
  { label: 'Kho vật phẩm', href: '/app/kho-vat-pham', icon: Package },
  { label: 'AI Mentor', href: '/app/voice', icon: Headphones },
  { label: 'Mentor Hub', href: '/app/mentors', icon: Users },
  { label: 'Cộng đồng', href: '/app/cong-dong', icon: Users },
  { label: 'Video', href: '/app/videos', icon: Video },
  { label: 'Thư viện', href: '/app/library', icon: BookOpen },
  { label: 'Dự án', href: '/app/projects', icon: FolderOpen },
  { label: 'Hồ sơ', href: '/app/profile', icon: User },
  { label: 'Cài đặt', href: '/app/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Listen for toggle events from Topbar
  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      if (w <= 820) {
        // Mobile: open overlay
        setMobileOpen((prev) => !prev);
      } else if (w <= 1024) {
        // Tablet: toggle collapse
        setCollapsed((prev) => !prev);
      }
      // Desktop (>1024): do nothing
    };
    window.addEventListener("sidebar:toggle", handler);
    return () => window.removeEventListener("sidebar:toggle", handler);
  }, []);

  // Auto-uncollapse when resizing from tablet to desktop
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth > 1024) {
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', checkWidth);
    // Also run on mount
    checkWidth();
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== '/app' && pathname.startsWith(href + '/'));

  const linkClass = (href: string) =>
    cn(
      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
      isActive(href)
        ? 'bg-primary/10 text-primary border-l-2 border-primary pl-2.5 shadow-[inset_0_1px_0_rgba(200,148,62,0.1)]'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent pl-2.5'
    );

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-3 pt-3 pb-4 border-b border-border relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <Link href="/" className="flex items-center gap-2 no-underline relative" onClick={closeMobile}>
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
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={linkClass(item.href)}
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer spacer */}
      <div className="px-2 py-3 border-t border-border" />
    </>
  );

  return (
    <>
      {/* ── Sidebar: Desktop (>1024px) + Tablet (821-1024px) ── */}
      <aside
        className={`hidden max-[820px]:hidden shrink-0 min-h-screen border-r border-border bg-card flex-col relative transition-all duration-300 ${
          collapsed ? 'w-0 !overflow-hidden !border-0' : 'w-52'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-accent/3 pointer-events-none" />
        <div className="relative flex flex-col h-full min-w-52">
          {sidebarContent}
        </div>
      </aside>

      {/* ── Mobile overlay (≤820px) ── */}
      {mobileOpen && (
        <>
          <div
            className="max-[820px]:block hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={closeMobile}
          />
          <aside className="max-[820px]:flex hidden fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex-col shadow-2xl animate-slide-up">
            <div className="relative flex flex-col h-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-accent/3 pointer-events-none" />
              <div className="relative flex flex-col h-full">
                {sidebarContent}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
