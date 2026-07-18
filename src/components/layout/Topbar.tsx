"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import NotificationDropdown from "@/components/notification/NotificationDropdown";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function Topbar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Load avatar từ profiles nếu có
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user?.id) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
    });
  }, []);

  function toggleSidebar() {
    window.dispatchEvent(new CustomEvent("sidebar:toggle"));
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-card/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 h-12">
        {/* Left */}
        <div className="flex items-center gap-2">
          {/* Hamburger: visible on ≤1024px (mobile + tablet) */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
          {/* Logo: visible on ≤1024px */}
          <Logo variant="horizontal" className="!h-7 lg:hidden" />
        </div>
        {/* Right */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/app/profile"
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
              avatarUrl
                ? "overflow-hidden border border-border hover:ring-2 hover:ring-primary/30"
                : "bg-white/10 hover:bg-white/15"
            )}
            title="Hồ sơ"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </Link>
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
}