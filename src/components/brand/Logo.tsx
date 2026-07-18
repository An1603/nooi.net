'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useBrandUrl } from '@/components/brand/BrandProvider';

interface LogoProps {
  variant?: 'full' | 'horizontal' | 'icon' | 'circular';
  className?: string;
  linkClassName?: string;
  theme?: 'light' | 'dark';
}

/* ==================================================================
   NOOI Logo — đọc URL từ BrandProvider (admin config).
   Fallback về /public/brand/ nếu chưa có config.
   ================================================================== */

export function LogoFull({ className, theme = 'dark' }: { className?: string; theme?: 'light' | 'dark' }) {
  const colorUrl = useBrandUrl('logo-square');
  const whiteUrl = useBrandUrl('logo-square-white');
  return (
    <Image
      src={theme === 'dark' ? whiteUrl : colorUrl}
      alt="NOOI — Kết nối chuyển mình"
      width={163}
      height={163}
      className={cn('w-auto h-auto', className)}
      priority
    />
  );
}

export function LogoHorizontal({
  className,
  theme = 'dark',
}: {
  className?: string;
  theme?: 'light' | 'dark';
}) {
  const colorUrl = useBrandUrl('logo-horizontal');
  const whiteUrl = useBrandUrl('logo-horizontal-white');
  return (
    <Link href="/" className={cn('flex items-center gap-2 no-underline', className)}>
      <Image
        src={theme === 'dark' ? whiteUrl : colorUrl}
        alt="NOOI — Kết nối chuyển mình"
        width={163}
        height={75}
        className="h-8 w-auto"
        priority
      />
    </Link>
  );
}

export function LogoCircular({ size = 40, className }: { size?: number; className?: string }) {
  const iconUrl = useBrandUrl('logo-icon');
  return (
    <Image
      src={iconUrl}
      alt="NOOI"
      width={size}
      height={size}
      className={cn('shrink-0 rounded-full object-cover', className)}
    />
  );
}

export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  const iconUrl = useBrandUrl('logo-icon');
  return (
    <Image
      src={iconUrl}
      alt="NOOI"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
    />
  );
}

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
  return <LogoHorizontal className={className} theme={theme} />;
}
