"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import type { VoiceStatus } from "./useVoiceAssistant";

// ─── Config ──────────────────────────────────────────────────────────────────

interface VoiceVisualizerProps {
  status: VoiceStatus;
  audioLevel: number;
  isSpeaking: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const THEME = {
  listening: { primary: "#ef4444", secondary: "#f97316", accent: "#dc2626" },
  speaking:  { primary: "#a78bfa", secondary: "#c084fc", accent: "#7c3aed" },
  ready:     { primary: "#C8943E", secondary: "#eab308", accent: "#d97706" },
  connecting:{ primary: "#fbbf24", secondary: "#f59e0b", accent: "#f59e0b" },
};

const BAR_COUNT = 48;
const BAR_ANGLES = Array.from({ length: BAR_COUNT }, (_, i) => (360 / BAR_COUNT) * i);
const RING_COUNT = 5;

// ─── Utility ─────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VoiceVisualizer({ status, audioLevel, isSpeaking, onToggle, disabled }: VoiceVisualizerProps) {
  const isActive = status === "listening" || status === "speaking";
  const isBusy = status === "connecting" || status === "init";
  const theme = status === "listening" ? THEME.listening
    : status === "speaking" ? THEME.speaking
    : status === "connecting" ? THEME.connecting
    : THEME.ready;

  const [audioHistory, setAudioHistory] = useState<number[]>([]);
  const audioLevelRef = useRef(audioLevel);
  audioLevelRef.current = audioLevel;

  // Smooth audio history buffer (for water-like lag/flow)
  useEffect(() => {
    if (!isActive) {
      setAudioHistory([]);
      return;
    }
    const interval = setInterval(() => {
      setAudioHistory(prev => {
        const next = [...prev, audioLevelRef.current];
        return next.length > 20 ? next.slice(-20) : next;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [isActive]);

  const smoothLevel = audioHistory.length > 0
    ? audioHistory.reduce((a, b) => a + b, 0) / audioHistory.length
    : 0;

  const displayLevel = isActive ? lerp(0.1, smoothLevel, 0.7) : 0;
  const barHeights = useMemo(() => {
    const t = Date.now() / 1000;
    return BAR_ANGLES.map((_, i) => {
      const freq = 1 - i / BAR_COUNT;
      const wave1 = Math.sin(t * 3 + i * 0.3) * 0.4 + 0.6;
      const wave2 = Math.sin(t * 2.1 + i * 0.15) * 0.3 + 0.7;
      const base = isActive ? displayLevel * 36 * freq : 2;
      return Math.max(2, Math.min(40, base * (wave1 * 0.6 + wave2 * 0.4)));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayLevel, isActive, audioLevel]);

  const ringScale = isActive ? 1 + displayLevel * 1.2 : 1;

  return (
    <div className="relative flex items-center justify-center w-80 h-80 mx-auto select-none">
      {/* Hidden SVG for liquid filters */}
      <svg className="absolute w-0 h-0" aria-hidden>
        <defs>
          <filter id="liquid-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
          <filter id="liquid-soft">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix in="blur" mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
          </filter>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="grad-liquid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.6" />
            <stop offset="50%" stopColor={theme.secondary} stopOpacity="0.4" />
            <stop offset="100%" stopColor={theme.accent} stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      {/* ═══════ 1. Outer Ambient Glow ═══════ */}
      <div
        className="absolute rounded-full transition-all duration-1000"
        style={{
          width: 320, height: 320,
          background: `radial-gradient(circle at 50% 50%, ${theme.primary}20 0%, ${theme.secondary}08 40%, transparent 70%)`,
          transform: `scale(${1 + displayLevel * 0.25})`,
          opacity: isActive ? 0.9 : 0.2,
          filter: 'url(#glow-strong)',
        }}
      />

      {/* ═══════ 2. Liquid Morphing Rings ═══════ */}
      {isActive && Array.from({ length: RING_COUNT }).map((_, i) => {
        const delay = i * 0.4;
        const baseR = 60 + i * 22 + displayLevel * 20;
        const speed = 4 + i * 1.2;
        const wobble = 8 + displayLevel * 18;
        const t = Date.now() / 1000;
        const rx = baseR + Math.sin(t * speed + delay * 2) * wobble;
        const ry = baseR + Math.cos(t * speed * 0.7 + delay * 1.5) * wobble;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: rx, height: ry,
              border: `2px solid ${theme.primary}${Math.max(10, 40 - i * 7).toString(16)}`,
              opacity: 0.15 + displayLevel * 0.4 - i * 0.05,
              filter: 'url(#liquid-soft)',
              transform: `translate(-50%, -50%)`,
              left: '50%', top: '50%',
              transition: 'width 0.15s ease-out, height 0.15s ease-out',
            }}
          />
        );
      })}

      {/* ═══════ 3. Water Ripple Rings (pulsing) ═══════ */}
      {isActive && [0, 0.25, 0.5, 0.75].map((d, i) => (
        <div
          key={`ripple-${i}`}
          className="absolute rounded-full"
          style={{
            width: 90, height: 90,
            border: `2px solid ${theme.primary}44`,
            animation: `water-ripple 2.8s ease-out infinite`,
            animationDelay: `${d}s`,
            opacity: 0.2 + displayLevel * 0.4,
            filter: 'url(#liquid-soft)',
            transform: `scale(${1 + displayLevel * 0.5})`,
          }}
        />
      ))}

      {/* ═══════ 4. Fluid Spectrum Bars ═══════ */}
      {BAR_ANGLES.map((angle, i) => {
        const h = barHeights[i];
        const opacity = isActive
          ? 0.3 + (displayLevel * h) / 40 * 0.7
          : 0.06;
        return (
          <div
            key={angle}
            className="absolute rounded-full"
            style={{
              width: 2.5,
              height: h,
              background: isActive
                ? `linear-gradient(to top, ${theme.primary}, ${theme.secondary})`
                : 'rgba(255,255,255,0.05)',
              left: '50%',
              top: '50%',
              transformOrigin: '50% 0',
              transform: `translateX(-50%) translateY(-50%) rotate(${angle}deg) translateY(-${72 + displayLevel * 18}px)`,
              opacity,
              borderRadius: 4,
              transition: 'height 0.08s ease-out, opacity 0.2s ease',
              filter: isActive ? 'url(#liquid-soft)' : 'none',
            }}
          />
        );
      })}

      {/* ═══════ 5. Flowing Liquid Core (SVG ring) ═══════ */}
      <svg
        className="absolute"
        width="240"
        height="240"
        viewBox="0 0 240 240"
        style={{ transform: `rotate(${Date.now() / 10000}rad)` }}
      >
        <defs>
          <linearGradient id="core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity={isActive ? 0.5 : 0.15}>
              <animate attributeName="stopOpacity" values={isActive ? "0.5" : "0.15"} dur="1s" />
            </stop>
            <stop offset="100%" stopColor={theme.secondary} stopOpacity={isActive ? 0.3 : 0.08}>
              <animate attributeName="stopOpacity" values={isActive ? "0.3" : "0.08"} dur="1s" />
            </stop>
          </linearGradient>
        </defs>

        {/* Outer liquid ring */}
        <circle
          cx="120" cy="120" r={80 + displayLevel * 12}
          fill="none"
          stroke="url(#core-grad)"
          strokeWidth={2 + displayLevel * 3}
          strokeLinecap="round"
          filter="url(#liquid-soft)"
          opacity={isActive ? 0.6 + displayLevel * 0.4 : 0.1}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 120 120"
            to="360 120 120"
            dur={`${8 - displayLevel * 3}s`}
            repeatCount="indefinite"
          />
        </circle>

        {/* Inner liquid ring (counter-rotate) */}
        <circle
          cx="120" cy="120" r={60 + displayLevel * 8}
          fill="none"
          stroke="url(#core-grad)"
          strokeWidth={1.5 + displayLevel * 2}
          strokeLinecap="round"
          strokeDasharray={`${40 + displayLevel * 40} ${60}`}
          filter="url(#liquid-soft)"
          opacity={isActive ? 0.4 + displayLevel * 0.4 : 0.05}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 120 120"
            to="0 120 120"
            dur={`${6 - displayLevel * 2}s`}
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* ═══════ 6. Inner Pulse Core ═══════ */}
      <div
        className="absolute rounded-full transition-all duration-200 ease-out"
        style={{
          width: `${160 + displayLevel * 60}px`,
          height: `${160 + displayLevel * 60}px`,
          border: `2.5px solid ${theme.primary}${isActive ? "99" : "22"}`,
          opacity: isActive ? 0.4 + displayLevel * 0.6 : 0.1,
          transform: `scale(${1 + displayLevel * 0.15})`,
          boxShadow: isActive
            ? `0 0 ${30 + displayLevel * 60}px ${theme.primary}44, inset 0 0 ${20 + displayLevel * 40}px ${theme.primary}22`
            : '0 0 10px rgba(200,148,62,0.08)',
          filter: 'url(#liquid-soft)',
        }}
      />

      {/* ═══════ 7. Center Gradient Orb ═══════ */}
      <div
        className="absolute rounded-full transition-all duration-500"
        style={{
          width: 140, height: 140,
          background: isActive
            ? `radial-gradient(circle at 40% 35%, ${theme.primary}33 0%, ${theme.secondary}15 40%, ${theme.accent}08 70%, transparent 100%)`
            : 'radial-gradient(circle, rgba(200,148,62,0.08) 0%, transparent 60%)',
          filter: 'url(#liquid-goo)',
        }}
      >
        {/* Animated inner glow */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at ${50 + Math.sin(Date.now() / 2000) * 20}% ${50 + Math.cos(Date.now() / 2500) * 20}%, ${theme.primary}44 0%, transparent 60%)`,
              transition: 'background 0.3s ease',
            }}
          />
        )}
      </div>

      {/* ═══════ 8. Mic Button ═══════ */}
      <button
        onClick={onToggle}
        disabled={disabled || isBusy}
        className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 cursor-pointer group"
        style={{
          background: isActive
            ? `radial-gradient(circle at 35% 30%, ${theme.primary}35, ${theme.primary}10 60%, ${theme.accent}08)`
            : 'radial-gradient(circle at 35% 30%, rgba(200,148,62,0.12), rgba(200,148,62,0.04))',
          border: `2.5px solid ${isActive ? theme.primary + '77' : 'rgba(200,148,62,0.25)'}`,
          boxShadow: isActive
            ? `0 0 ${40 + displayLevel * 60}px ${theme.primary}33, inset 0 0 ${30 + displayLevel * 40}px ${theme.primary}15`
            : '0 0 15px rgba(200,148,62,0.08)',
        }}
        aria-label={isActive ? 'Dừng' : 'Bắt đầu'}
      >
        {/* Button inner liquid glow */}
        <div
          className="absolute inset-1.5 rounded-full transition-all duration-300"
          style={{
            background: isActive
              ? `radial-gradient(circle at 50% 50%, ${theme.primary}50 0%, transparent 70%)`
              : 'transparent',
            opacity: displayLevel,
          }}
        />

        {/* Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative transition-all duration-200"
          style={{
            width: 32 + displayLevel * 4,
            height: 32 + displayLevel * 4,
            color: isActive ? theme.primary : '#C8943E',
            transform: `scale(${1 + displayLevel * 0.2})`,
            filter: isActive ? 'drop-shadow(0 0 6px ' + theme.primary + '66)' : 'none',
          }}
        >
          {isSpeaking ? (
            <>
              <path d="M2 10v4" />
              <path d="M6 8v8" />
              <path d="M10 6v12" />
              <path d="M14 4v16" />
              <path d="M18 6v12" />
            </>
          ) : (
            <>
              <rect x="9" y="2" width="6" height="11" rx="3" ry="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </>
          )}
        </svg>

        {/* Expanding ping ring */}
        {isActive && (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px solid ${theme.primary}`,
              animation: `water-ripple 1.8s ease-out infinite`,
              opacity: 0.3 + displayLevel * 0.3,
            }}
          />
        )}
      </button>

      {/* ═══════ 9. Liquid Particles ═══════ */}
      {isActive && <LiquidParticles level={displayLevel} theme={theme} />}
    </div>
  );
}

// ─── Liquid Particles (water-like flowing dots) ─────────────────────────────

function LiquidParticles({ level, theme }: { level: number; theme: typeof THEME.listening }) {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (360 / 12) * i;
      const dist = 90 + Math.random() * 50;
      return {
        id: i,
        x: Math.cos((angle * Math.PI) / 180) * dist,
        y: Math.sin((angle * Math.PI) / 180) * dist,
        size: 2.5 + Math.random() * 4,
        speed: 0.8 + Math.random() * 1.2,
        pulse: Math.random() * Math.PI * 2,
        drift: Math.random() * 50 - 25,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ filter: 'url(#liquid-soft)' }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: level > 0.05 ? theme.primary : 'transparent',
            opacity: level * (0.2 + Math.random() * 0.5),
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`,
            boxShadow: `0 0 ${6 + level * 12}px ${theme.primary}88`,
            animation: `water-particle ${2 + p.speed}s ease-in-out ${p.pulse}s infinite`,
            transition: 'opacity 0.3s ease, background 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}
