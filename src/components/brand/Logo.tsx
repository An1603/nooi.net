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
   NOOI Logo — sử dụng ảnh thiết kế gốc từ /public/
   ================================================================== */

/**
 * Logo đầy đủ dạng vuông: hexagon pyramid + NOOI + "Kết nối chuyển mình."
 * Dùng cho hero section, landing page
 */
export function LogoFull({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-512w.png"
      alt="NOOI"
      width={180}
      height={180}
      className={cn('w-auto h-auto', className)}
      priority
    />
  );
}

/**
 * Logo ngang: hexagon cluster bên trái + NOOI text + tagline
 * Dùng cho header. theme='light' → nền sáng, theme='dark' → nền tối
 */
export function LogoHorizontal({
  className,
  theme = 'dark',
}: {
  className?: string;
  theme?: 'light' | 'dark';
}) {
  // Logo_h_w: có chữ NOOI đậm, hợp nền sáng
  // Logo_h_tr: icon infinity, hợp nền tối (cần xử lý)
  // Trên nền tối, dùng logo_h_w và CSS filter invert để hiển thị
  const src = '/logo-h-w.png';

  return (
    <Link href="/" className={cn('flex items-center no-underline', className)}>
      <Image
        src={src}
        alt="NOOI"
        width={150}
        height={50}
        className={cn(
          'w-auto h-auto',
          theme === 'dark' && 'brightness-0 invert'
        )}
        priority
      />
    </Link>
  );
}

/**
 * Icon hình tròn (nền xám) — dùng cho dashboard sidebar
 */
export function LogoCircular({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-c.png"
      alt="NOOI"
      width={size}
      height={size}
      className={cn('shrink-0 rounded-full', className)}
    />
  );
}

/**
 * Icon hexagon pyramid (từ logo 512w50)
 */
export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-512w50.png"
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
