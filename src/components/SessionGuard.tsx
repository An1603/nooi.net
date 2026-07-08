"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * SessionGuard — Client-side auth guard.
 * Double-check session và cleanup SW cache để tránh cache dashboard sau logout.
 */
export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Layer 1: Unregister old service workers + clear caches
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => {
          // Check if it's the old SW version
          if (reg.active?.scriptURL) {
            reg.unregister();
          }
        });
      });
      // Clear ALL caches to prevent stale dashboard cache
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }

    // Layer 2: Double-check session. Nếu không có → redirect login
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Clear any lingering cookies
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    };
    checkSession();
  }, [router]);

  return <>{children}</>;
}
