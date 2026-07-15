'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'horizontal' | 'icon' | 'circular';
  className?: string;
  linkClassName?: string;
  theme?: 'light' | 'dark';
}

/* ==================================================================
   NOOI Logo — sử dụng ảnh thiết kế mới từ /public/brand/
   - nooi-stacked.png   : dọc (hexagon + NOI + tagline)
   - nooi-horizontal.png: ngang (hexagon + NOI + tagline)
   - nooi-icon-v.png    : icon dọc (infinity knot, nền trắng)
   - nooi-icon-h.png    : icon ngang (infinity knot, nền trắng)
   ================================================================== */

/**
 * Logo đầy đủ dạng dọc: hexagon + NOI + "Kết nối chuyển mình."
 * Dùng cho hero section, landing page
 */
export function LogoFull({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/nooi-stacked.png"
      alt="NOOI — Kết nối chuyển mình"
      width={180}
      height={180}
      className={cn('w-auto h-auto', className)}
      priority
    />
  );
}

/**
 * Logo ngang: hexagon cluster bên trái + NOI text + tagline
 * Dùng cho header. theme='light' → nền sáng, theme='dark' → nền tối
 */
export function LogoHorizontal({
  className,
  theme = 'dark',
}: {
  className?: string;
  theme?: 'light' | 'dark';
}) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 no-underline', className)}>
      <Image
        src="/brand/nooi-horizontal.png"
        alt="NOOI — Kết nối chuyển mình"
        width={160}
        height={48}
        className="h-8 w-auto"
        priority
      />
    </Link>
  );
}

/**
 * Icon hình tròn — dùng cho dashboard sidebar
 * Sử dụng icon ngang, CSS rounded-full tự crop
 */
export function LogoCircular({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/nooi-icon-h.png"
      alt="NOOI"
      width={size}
      height={size}
      className={cn('shrink-0 rounded-full object-cover', className)}
    />
  );
}

/**
 * Icon infinity knot (dọc) — small icon variant
 */
export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/nooi-icon-v.png"
      alt="NOOI"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
    />
  );
}

/* ------------------------------------------------------------------
   Main exported Logo component
   ------------------------------------------------------------------ */
export function Logo({ variant = 'horizontal', className, linkClassName, theme = 'dark' }: LogoProps) {
  if (variant === 'full') {
    return (
      <Link href="/" className={cn('flex items-center no-underline', linkClassName)}>
        <LogoFull className={className} />
      </Link>
    );
  }

  if (variant === 'circular') {
    return (
      <Link href="/app" className={cn('flex items-center no-underline', linkClassName)}>
        <LogoCircular className={className} />
      </Link>
    );
  }

  if (variant === 'icon') {
    return (
      <Link href="/" className={cn('flex items-center no-underline', linkClassName)}>
        <LogoIcon className={className} />
      </Link>
    );
  }

  // horizontal (default)
  return <LogoHorizontal className={className} theme={theme} />;
}
