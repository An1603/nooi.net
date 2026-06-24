'use client';

import { useEffect, useRef } from 'react';

export function AnimatedGradient() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let angle = 0;
    let animId: number;

    const animate = () => {
      angle += 0.15;
      el.style.background = `
        radial-gradient(circle at ${50 + Math.sin(angle * 0.7) * 25}% ${50 + Math.cos(angle * 0.5) * 20}%, rgba(200, 148, 62, 0.08) 0%, transparent 50%),
        radial-gradient(circle at ${50 + Math.cos(angle * 0.6) * 30}% ${50 + Math.sin(angle * 0.8) * 25}%, rgba(74, 173, 106, 0.06) 0%, transparent 50%),
        radial-gradient(circle at ${50 + Math.sin(angle * 0.4) * 20}% ${50 + Math.cos(angle * 0.9) * 30}%, rgba(58, 107, 140, 0.05) 0%, transparent 50%)
      `;
      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
