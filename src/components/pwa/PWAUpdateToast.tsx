"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw, X } from "lucide-react";

const STORAGE_KEY = "nooi_sw_version";
const CURRENT_VERSION = "nooi-v4";

/**
 * PWAUpdateToast — thông báo khi có phiên bản PWA mới.
 *
 * Cơ chế: so sánh version trong localStorage với CURRENT_VERSION.
 * - Khớp → không hiện toast
 * - Không khớp (hoặc chưa có) → hiện toast yêu cầu cài lại
 * - Bấm "Cài lại" → lưu version + reload → hết toast
 * - Bấm ✕ → ẩn tạm, hiện lại khi chuyển trang
 */
export function PWAUpdateToast() {
  const [dismissed, setDismissed] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const pathname = usePathname();

  const checkVersion = useCallback(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== CURRENT_VERSION) {
      setNeedsUpdate(true);
      setDismissed(false);
    } else {
      setNeedsUpdate(false);
    }
  }, []);

  useEffect(() => {
    checkVersion();

    // Cũng lắng nghe SW message (nếu SW kịp gửi)
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "SW_UPDATED") {
        localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
        setNeedsUpdate(false);
      }
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleMessage);
      // Force SW update check
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) reg.update().catch(() => {});
      });
    }

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      }
    };
  }, [checkVersion]);

  // Kiểm tra lại mỗi lần chuyển trang
  useEffect(() => {
    checkVersion();
  }, [pathname, checkVersion]);

  function handleReload() {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    // Skip waiting nếu SW đang chờ
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      });
    }
    window.location.reload();
  }

  if (!needsUpdate || dismissed) return null;

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
