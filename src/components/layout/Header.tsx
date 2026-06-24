'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { createClient } from '@/lib/supabase/client';
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Tính năng', href: '#features' },
  { label: 'Công nghệ', href: '#tech' },
  { label: 'Giới thiệu', href: '#about' },
  { label: 'Liên hệ', href: '#contact' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setSession(!!data.session);
      setUserEmail(data.session?.user?.email ?? null);
    };
    checkAuth();
  }, []);

  const displayName = userEmail?.split('@')[0] ?? '';

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border'
          : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-2.5">
        {/* Logo */}
        <Logo variant="horizontal" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {displayName}
              </span>
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 text-sm font-medium hover:bg-primary/20 transition-all"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <form action="/auth/logout" method="POST">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5"
                  title="Đăng xuất"
                >
                  <LogOut size={15} />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                Bắt đầu ngay
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <nav className="flex flex-col px-5 py-4 gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-border" />
            {session ? (
              <>
                <Link
                  href="/app"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center gap-2 text-sm text-primary font-medium py-1"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <form action="/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive py-1"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-muted-foreground hover:text-foreground py-1"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium"
                >
                  Bắt đầu ngay
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
