"use client";

/**
 * Huy hiệu hiển thị số phút còn lại trong ngày; tô đỏ khi gần hết giới hạn.
 */
export function DailyLimitBadge({ remaining, limit }: { remaining: number; limit: number }) {
  const low = remaining <= 5;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
        low ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground"
      }`}
    >
      <span aria-hidden>⏳</span>
      <span>
        Còn {remaining}/{limit} phút hôm nay
      </span>
    </div>
  );
}
