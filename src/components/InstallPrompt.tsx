/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone, Monitor } from "lucide-react";

const LS_KEY = "nooi-install-dismissed";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"mobile" | "desktop">("desktop");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Detect platform
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setPlatform(isMobile ? "mobile" : "desktop");

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if user hasn't dismissed
      if (!localStorage.getItem(LS_KEY)) {
        setTimeout(() => setShow(true), 3000); // delay 3s
      }
    };
    window.addEventListener("beforeinstallprompt", handler);

    // App installed successfully
    const installedHandler = () => {
      setInstalled(true);
      setShow(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    // Also show prompt for returning visitors (after 10s if not dismissed before)
    if (!localStorage.getItem(LS_KEY) && !deferredPrompt) {
      const timer = setTimeout(() => {
        // Only show if they've been on the site for a bit
        const visits = Number(localStorage.getItem("nooi-visits") || "0");
        localStorage.setItem("nooi-visits", String(visits + 1));
        if (visits >= 2) {
          setShow(true);
        }
      }, 10000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
        window.removeEventListener("appinstalled", installedHandler);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(LS_KEY, "true");
    setShow(false);
  };

  if (installed || !show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="rounded-2xl border border-border/50 bg-[#111] shadow-2xl p-5 backdrop-blur-sm">
        {/* Close button */}
        <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
          <X className="size-4" />
        </button>

        {/* Icon */}
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Download className="size-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Cài đặt NOOI</h3>
            <p className="text-[12px] text-muted-foreground">
              {deferredPrompt
                ? "Trải nghiệm tốt hơn với ứng dụng"
                : "Thêm NOOI vào màn hình chính"}
            </p>
          </div>
        </div>

        {/* Guide */}
        {!deferredPrompt && (
          <div className="rounded-lg bg-muted/20 p-3 mb-3">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              {platform === "mobile" ? <Smartphone className="size-4 shrink-0 mt-0.5" /> : <Monitor className="size-4 shrink-0 mt-0.5" />}
              <span>
                {platform === "mobile"
                  ? 'Mở trình duyệt → menu chia sẻ → "Thêm vào màn hình chính"'
                  : 'Click vào icon cài đặt 🔒 trên thanh địa chỉ → "Cài đặt"'}
              </span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {deferredPrompt && (
            <button onClick={handleInstall}
              className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:brightness-110 transition-all"
            >
              📲 Cài đặt
            </button>
          )}
          <button onClick={handleDismiss}
            className="flex-1 border border-border px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {deferredPrompt ? "Để sau" : "Đóng"}
          </button>
        </div>
      </div>
    </div>
  );
}
