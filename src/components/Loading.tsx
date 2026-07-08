"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * RouteLoader — hiển thị thanh loading bar trên cùng khi chuyển trang.
 * Dùng usePathname + useSearchParams để phát hiện route change.
 * Tự động ẩn sau 500ms hoặc khi page load xong.
 */
export function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    const currentPath = pathname + (searchParams?.toString() || "");
    if (prevPath.current !== currentPath) {
      setLoading(true);
      prevPath.current = currentPath;
      // Auto-hide sau 500ms (thời gian tối đa cho skeleton UI xuất hiện)
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Cũng bắt sự kiện click vào link để show loading ngay
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (target && target.href && target.href.startsWith(window.location.origin)) {
        const url = new URL(target.href);
        const currentPath = window.location.pathname + window.location.search;
        const targetPath = url.pathname + url.search;
        if (currentPath !== targetPath) {
          setLoading(true);
        }
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      {/* Thanh loading bar mỏng trên cùng */}
      <div
        className={`fixed top-0 left-0 z-[9999] h-0.5 bg-gradient-to-r from-primary via-secondary to-primary transition-all duration-300 ease-out ${
          loading ? "w-full opacity-100" : "w-0 opacity-0"
        }`}
        style={{
          animation: loading ? "loading-bar 1.5s ease-in-out infinite" : "none",
          backgroundSize: "200% 100%",
        }}
      />
      <style>{`
        @keyframes loading-bar {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}

/**
 * LoadingSpinner — spinner nhỏ dùng trong component khi fetch data.
 */
export function LoadingSpinner({ size = "md", text = "" }: { size?: "sm" | "md" | "lg"; text?: string }) {
  const sizeClasses = { sm: "size-4", md: "size-6", lg: "size-8" };
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <div className={`${sizeClasses[size]} border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin`} />
      {text && <p className="text-xs text-muted-foreground">{text}</p>}
    </div>
  );
}

/**
 * SkeletonBlock — khối skeleton pulse cho loading states.
 */
export function SkeletonBlock({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/30 ${className}`} />;
}

/**
 * SkeletonCard — thẻ skeleton hoàn chỉnh cho danh sách.
 */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-muted/30" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-muted/30 rounded-lg" />
          <div className="h-3 w-1/2 bg-muted/20 rounded-lg" />
        </div>
      </div>
      <div className="h-3 w-full bg-muted/20 rounded-lg" />
      <div className="h-3 w-2/3 bg-muted/20 rounded-lg" />
    </div>
  );
}
