"use client";

import { Logo } from "@/components/brand/Logo";
import NotificationDropdown from "@/components/notification/NotificationDropdown";

export default function Topbar() {
  function toggleSidebar() {
    window.dispatchEvent(new CustomEvent("sidebar:toggle"));
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-card/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 h-12">
        {/* Left side */}
        <div className="flex items-center gap-2">
          {/* Hamburger + Logo: only visible on mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
            <Logo variant="horizontal" className="!h-7" />
          </div>
          {/* Desktop: empty to avoid redundancy with sidebar logo */}
          <span className="hidden md:block text-xs text-muted-foreground" />
        </div>

        {/* Right: notification bell */}
        <NotificationDropdown />
      </div>
    </header>
  );
}
