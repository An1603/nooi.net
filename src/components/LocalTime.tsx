"use client";

import { useEffect, useState } from "react";

/**
 * Hiển thị thời gian ISO UTC theo múi giờ địa phương của trình duyệt.
 * Server render: hiện thô "—". Client hydrate: hiện đúng giờ local.
 */
export function LocalTime({ iso, format }: { iso: string | null | undefined; format?: "short" | "full" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!iso) return <span className="text-muted-foreground">—</span>;
  if (!mounted) return <span className="text-muted-foreground">—</span>;

  const d = new Date(iso);
  if (isNaN(d.getTime())) return <span className="text-muted-foreground">—</span>;

  if (format === "short") {
    // VD: 26/06/2026
    return <span>{d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>;
  }

  // Full: VD: 07:38 26/06/2026
  return <span>{d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>;
}