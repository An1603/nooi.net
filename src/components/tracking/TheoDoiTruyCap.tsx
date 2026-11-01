"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Gửi tín hiệu lượt truy cập về /api/track (giai đoạn 2 — toàn nooi.net).
 * - "vao": mỗi lần tải trang / đổi tuyến đường
 * - "nhip": 20 giây một lần (giữ thời lượng chính xác)
 * - "thoat": khi ẩn tab hoặc rời trang
 * Không chặn giao diện, không gửi khi trình duyệt ở chế độ tiết kiệm dữ liệu cứng.
 */

const NHIP_MS = 20_000;

function gui(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      if (navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }))) return;
    }
  } catch {
    /* thử fetch bên dưới */
  }
  try {
    void fetch("/api/track", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      cache: "no-store",
    });
  } catch {
    /* bỏ qua */
  }
}

export function TheoDoiTruyCap() {
  const pathname = usePathname();
  const t0 = useRef(Date.now());
  const daGuiVao = useRef<string>("");

  useEffect(() => {
    t0.current = Date.now();
    if (daGuiVao.current === pathname) return;
    daGuiVao.current = pathname;
    gui({
      t: "vao",
      d: pathname + (window.location.search || ""),
      q: window.location.search || "",
      r: document.referrer || "",
      g: 0,
    });
  }, [pathname]);

  useEffect(() => {
    const giay = () => Math.round((Date.now() - t0.current) / 1000);

    const nhip = window.setInterval(() => {
      gui({ t: "nhip", d: pathname, g: giay() });
    }, NHIP_MS);

    const khiAn = () => {
      if (document.visibilityState === "hidden") {
        gui({ t: "thoat", d: pathname, g: giay() });
      }
    };
    const khiRoi = () => gui({ t: "thoat", d: pathname, g: giay() });

    document.addEventListener("visibilitychange", khiAn);
    window.addEventListener("pagehide", khiRoi);
    return () => {
      window.clearInterval(nhip);
      document.removeEventListener("visibilitychange", khiAn);
      window.removeEventListener("pagehide", khiRoi);
    };
  }, [pathname]);

  return null;
}
