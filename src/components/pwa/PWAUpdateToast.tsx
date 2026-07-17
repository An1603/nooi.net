"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

/**
 * PWAUpdateToast — hiển thị thông báo khi có phiên bản PWA mới.
 * Lắng nghe message "SW_UPDATED" từ Service Worker.
 * Hiển thị toast với nút "Cài lại" để reload trang.
 */
export function PWAUpdateToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Listen for SW update messages
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "SW_UPDATED") {
        setShow(true);
      }
    }

    // Also check on mount if there's a waiting SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        // If there's a waiting worker, it means an update is ready
        if (reg.waiting) {
          setShow(true);
        }

        // Listen for new waiting worker
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setShow(true);
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
  }, []);

  function handleReload() {
    // Skip waiting on any waiting SW, then reload
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      });
    }
    // Reload to activate new SW
    window.location.reload();
  }

  if (!show) return null;

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
          onClick={() => setShow(false)}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
