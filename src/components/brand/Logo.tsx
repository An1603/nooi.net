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
   - nooi-horizontal(-white).png : ngang (NOOI + infinity + tagline)
   - nooi-stacked(-white).png    : vuông (NOOI + infinity + tagline)
   - nooi-icon-v.png             : icon standalone (infinity knot tím)
   - nooi-icon-v-white.png       : icon standalone (trắng trên nền tím)
   theme='dark' → nền tối → logo trắng
   theme='light' → nền sáng → logo màu
   ================================================================== */

/**
 * Logo đầy đủ dạng vuông: NOOI + infinity + "Kết nối chuyển mình."
 * Dùng cho hero section, landing page
 */
export function LogoFull({ className, theme = 'dark' }: { className?: string; theme?: 'light' | 'dark' }) {
  return (
    <Image
      src={theme === 'dark' ? '/brand/nooi-stacked-white.png' : '/brand/nooi-stacked.png'}
      alt="NOOI — Kết nối chuyển mình"
      width={163}
      height={163}
      className={cn('w-auto h-auto', className)}
      priority
    />
  );
}

/**
 * Logo ngang: NOOI text + infinity icon + tagline
 * theme='dark' → nền tối → logo trắng
 * theme='light' → nền sáng → logo màu
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
        src={theme === 'dark' ? '/brand/nooi-horizontal-white.png' : '/brand/nooi-horizontal.png'}
        alt="NOOI — Kết nối chuyển mình"
        width={163}
        height={75}
        className="h-8 w-auto"
        priority
      />
    </Link>
  );
}

/**
 * Icon hình tròn — dùng cho dashboard sidebar
 * Sử dụng icon standalone (infinity knot), CSS rounded-full
 */
export function LogoCircular({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/nooi-icon-v.png"
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
        <LogoFull className={className} theme={theme} />
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
