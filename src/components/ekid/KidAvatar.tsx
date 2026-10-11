"use client";

/**
 * Avatar của bé — hiển thị emoji trong vòng tròn, kích thước tuỳ chỉnh.
 */
export function KidAvatar({ emoji, size = 56 }: { emoji: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border border-border"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        background: "rgba(255,255,255,0.05)",
      }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
