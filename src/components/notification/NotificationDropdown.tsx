"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Flame, BookHeart, Sparkles } from "lucide-react";

interface Notification {
  id: string; icon: string; title: string; desc: string; time: string;
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    // Load notifications from API
    (async () => {
      try {
        const res = await fetch("/api/notify");
        const data = await res.json();
        if (data.notifications) setNotifs(data.notifications);
      } catch {}
    })();
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {notifs.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Thông báo</p>
            <button onClick={() => setOpen(false)} className="w-6 h-6 rounded-full hover:bg-muted/50 flex items-center justify-center">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Chưa có thông báo</p>
              </div>
            ) : (
              notifs.map((n) => (
                <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-muted/10 transition-colors border-b border-border/50 last:border-0">
                  <span className="text-lg">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{n.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
