"use client";

import { Bell } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function Topbar() {
  function toggleSidebar() {
    window.dispatchEvent(new CustomEvent("sidebar:toggle"));
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 h-12">
        {/* Left: hamburger (mobile only) + Logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted/50 transition-colors md:hidden"
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
          <Logo variant="horizontal" className="!h-7" />
        </div>

        {/* Right: notification bell */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Thông báo"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
