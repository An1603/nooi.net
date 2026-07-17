"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw, X } from "lucide-react";

/**
 * PWAUpdateToast — hiển thị thông báo khi có phiên bản PWA mới.
 * Lắng nghe message "SW_UPDATED" từ Service Worker + kiểm tra waiting SW.
 * - Bấm ✕ → ẩn tạm thời, sẽ hiện lại khi chuyển trang
 * - Bấm "Cài lại" → reload → SW mới kích hoạt → không còn thông báo
 */
export function PWAUpdateToast() {
  const [dismissed, setDismissed] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const pathname = usePathname();

  // Kiểm tra waiting SW
  const checkUpdate = useCallback(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        setHasUpdate(true);
        setDismissed(false); // reset dismiss on route change
      }
    });
  }, []);

  useEffect(() => {
    // Kiểm tra ngay khi mount
    checkUpdate();

    // Lắng nghe SW message
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "SW_UPDATED") {
        setHasUpdate(true);
        setDismissed(false);
      }
    }

    // Lắng nghe updatefound
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setHasUpdate(true);
                setDismissed(false);
              }
            });
          }
        });
      });

      navigator.serviceWorker.addEventListener("message", handleMessage);
    }

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      }
    };
  }, [checkUpdate]);

  // Mỗi lần chuyển trang → kiểm tra lại + reset dismissed
  useEffect(() => {
    checkUpdate();
  }, [pathname, checkUpdate]);

  function handleReload() {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      });
    }
    window.location.reload();
  }

  // Chỉ hiện khi có update VÀ chưa bị dismiss trong lần navigate hiện tại
  if (!hasUpdate || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-primary/30 shadow-2xl backdrop-blur-md max-w-sm">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            🆕 Phiên bản mới đã sẵn sàng
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cài lại để cập nhật logo & icon mới
          </p>
        </div>
        <button
          onClick={handleReload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          <RefreshCw size={14} />
          Cài lại
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
