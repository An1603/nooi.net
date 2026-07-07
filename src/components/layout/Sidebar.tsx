'use client';

import { useState, useEffect } from 'react';
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
  Sparkles,
  Headphones,
  User,
  BookHeart,
  Users,
  BarChart3,
  Trophy,
  Layers,
} from 'lucide-react';

const NAV = [
  // Nhóm Dashboard
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard },

  // Nhóm AI & Học tập
  { label: 'AI Mentor', href: '/app/voice', icon: Headphones },
  { label: 'Học tập', href: '/app/hoc-tap', icon: BookOpen },
  { label: 'Lớp Live', href: '/app/live', icon: Video },
  { label: 'Nhật ký', href: '/app/journal', icon: BookHeart },
  { label: 'Thực hành', href: '/app/thuc-hanh', icon: Sparkles },

  // Nhóm Khám phá
  { label: 'Thẻ chuyển hóa', href: '/app/the-chuyen-hoa', icon: Layers },
  { label: 'Mentor Hub', href: '/app/mentors', icon: Users },
  { label: 'Cộng đồng', href: '/app/cong-dong', icon: Users },

  // Nhóm Cá nhân
  { label: 'Video', href: '/app/videos', icon: Video },
  { label: 'Thư viện', href: '/app/library', icon: BookOpen },
  { label: 'Dự án', href: '/app/projects', icon: FolderOpen },
  { label: 'Hồ sơ', href: '/app/profile', icon: User },
  { label: 'Cài đặt', href: '/app/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Listen for toggle events from Topbar
  useEffect(() => {
    const handler = () => setMobileOpen((prev) => !prev);
    window.addEventListener("sidebar:toggle", handler);
    return () => window.removeEventListener("sidebar:toggle", handler);
  }, []);

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
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
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

      {/* Footer spacer */}
      <div className="px-2 py-3 border-t border-border" />
    </>
  );

  return (
    <>
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
