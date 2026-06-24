'use client';

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
  ChevronRight,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { label: 'Dự án', href: '/app/projects', icon: FolderOpen },
  { label: 'Video', href: '/app/videos', icon: Video },
  { label: 'Thư viện', href: '/app/library', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-card flex flex-col">
      {/* Brand */}
      <div className="px-4 pt-4 pb-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Logo variant="circular" className="!w-7 !h-7" />
          <div>
            <span className="text-base font-bold tracking-tight text-foreground">NOOI</span>
            <span className="text-[10px] text-muted-foreground block leading-tight -mt-0.5">
              Kết nối chuyển mình.
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-primary/10 text-primary border border-primary/15'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent',
              )}
            >
              <Icon size={18} className={active ? 'text-primary' : ''} />
              <span>{item.label}</span>
              {active && (
                <ChevronRight size={14} className="ml-auto text-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <Link
          href="/app/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <Settings size={18} />
          <span>Cài đặt</span>
        </Link>
        <form action="/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
