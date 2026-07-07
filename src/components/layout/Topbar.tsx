"use client";

import { Bell, Menu } from "lucide-react";

export default function Topbar() {
  function toggleSidebar() {
    window.dispatchEvent(new CustomEvent("sidebar:toggle"));
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-sm md:hidden">
      <div className="flex items-center justify-between px-4 h-12">
        {/* Left: hamburger */}
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2 text-sm font-semibold text-foreground touch-target"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
          <span>NOOI</span>
        </button>

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
