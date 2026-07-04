"use client";

import { useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VoiceVisualizerProps {
  status: "init" | "ready" | "connecting" | "connected" | "listening" | "speaking" | "error";
  audioLevel: number;
  isSpeaking: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

// ─── Theme ───────────────────────────────────────────────────────────────────

const THEME = {
  listening: { primary: "#ef4444", secondary: "#f97316", glow: "rgba(239,68,68,0.3)", label: "Đang nghe..." },
  speaking:  { primary: "#a78bfa", secondary: "#c084fc", glow: "rgba(167,139,250,0.3)", label: "Đang trả lời..." },
  ready:     { primary: "#C8943E", secondary: "#eab308", glow: "rgba(200,148,62,0.2)", label: "Bấm để nói" },
  connecting:{ primary: "#fbbf24", secondary: "#f59e0b", glow: "rgba(251,191,36,0.2)",  label: "Đang kết nối..." },
  init:      { primary: "#C8943E", secondary: "#eab308", glow: "rgba(200,148,62,0.1)", label: "" },
  error:     { primary: "#ef4444", secondary: "#ef4444", glow: "rgba(239,68,68,0.2)",  label: "Lỗi" },
  connected: { primary: "#22c55e", secondary: "#4ade80", glow: "rgba(34,197,94,0.2)",  label: "Đã kết nối" },
};

// ─── Spectrum Bars ───────────────────────────────────────────────────────────

const BAR_COUNT = 36;

function getBarHeights(level: number, active: boolean): number[] {
  const now = Date.now();
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    if (!active) return 2;
    const freq = 1 - i / BAR_COUNT;          // bass → treble rolloff
    const wave = Math.sin(now / 250 + i * 0.6) * 0.3 + 0.7;
    return 2 + level * 28 * freq * wave;
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VoiceVisualizer({ status, audioLevel, isSpeaking, onToggle, disabled }: VoiceVisualizerProps) {
  const isActive = status === "listening" || status === "speaking" || status === "connected";
  const isBusy = status === "connecting" || status === "init";
  const theme = THEME[status] ?? THEME.ready;
  const displayLevel = Math.min(1, audioLevel * 1.2);
  const micOff = status === "connected";

  const barHeights = useMemo(
    () => getBarHeights(displayLevel, isActive && !micOff),
    [displayLevel, isActive, micOff]
  );

  return (
    <div className="relative flex items-center justify-center w-72 h-72 mx-auto select-none">
      {/* SVG Filters */}
      <svg className="absolute w-0 h-0" aria-hidden>
        <defs>
          <radialGradient id="core-pulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* ═══ 1. Outer ambient glow ═══ */}
      <div
        className="absolute rounded-full transition-all duration-1000"
        style={{
          width: 320, height: 320,
          background: `radial-gradient(circle at 50% 50%, ${theme.primary}20 0%, ${theme.secondary}08 40%, transparent 70%)`,
          transform: `scale(${1 + displayLevel * 0.25})`,
          opacity: isActive ? 0.9 : 0.2,
        }}
      />

      {/* ═══ 2. Spectrum analyzer bars ═══ */}
      {barHeights.map((h, i) => {
        const angle = (360 / BAR_COUNT) * i;
        const opacity = isActive && !micOff
          ? 0.3 + (displayLevel * h) / 30 * 0.7
          : 0.06;
        return (
          <div
            key={angle}
            className="absolute rounded-full"
            style={{
              width: 2.5,
              height: h,
              background: isActive && !micOff
                ? `linear-gradient(to top, ${theme.primary}, ${theme.secondary})`
                : "rgba(255,255,255,0.05)",
              left: "50%",
              top: "50%",
              transformOrigin: "50% 0",
              transform: `translateX(-50%) translateY(-50%) rotate(${angle}deg) translateY(-${72 + displayLevel * 18}px)`,
              opacity,
              borderRadius: 4,
              transition: "height 0.08s ease-out, opacity 0.2s ease",
            }}
          />
        );
      })}

      {/* ═══ 3. Center pulse glow ═══ */}
      <div
        className="absolute rounded-full transition-all duration-200"
        style={{
          width: `${130 + displayLevel * 40}px`,
          height: `${130 + displayLevel * 40}px`,
          background: `radial-gradient(circle at 50% 50%, ${theme.primary}22 0%, ${theme.secondary}10 40%, transparent 65%)`,
          transform: `scale(${1 + displayLevel * 0.08})`,
        }}
      />

      {/* ═══ 4. Inner pulsing ring ═══ */}
      <div
        className="absolute rounded-full transition-all duration-150"
        style={{
          width: `${140 + displayLevel * 30}px`,
          height: `${140 + displayLevel * 30}px`,
          border: `2px solid ${theme.primary}${isActive && !micOff ? "66" : "22"}`,
          opacity: isActive && !micOff ? 0.4 + displayLevel * 0.5 : 0.15,
          boxShadow: isActive && !micOff
            ? `0 0 ${20 + displayLevel * 40}px ${theme.glow}`
            : "none",
          transition: "width 0.15s ease-out, height 0.15s ease-out, box-shadow 0.3s ease",
        }}
      />

      {/* ═══ 5. Mic button ═══ */}
      <button
        onClick={onToggle}
        disabled={disabled || isBusy}
        className="relative z-10 flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 cursor-pointer group"
        style={{
          background: isActive
            ? `radial-gradient(circle at 40% 35%, ${theme.primary}30, ${theme.primary}10)`
            : "radial-gradient(circle at 40% 35%, rgba(200,148,62,0.15), rgba(200,148,62,0.05))",
          border: `2px solid ${isActive ? theme.primary + "66" : "rgba(200,148,62,0.3)"}`,
          boxShadow: isActive
            ? `0 0 ${20 + displayLevel * 40}px ${theme.glow}, inset 0 0 ${15 + displayLevel * 25}px ${theme.primary}11`
            : "0 0 10px rgba(200,148,62,0.1)",
        }}
        aria-label={isActive ? "Dừng" : "Bắt đầu"}
      >
        {/* Button inner glow */}
        <div
          className="absolute inset-2 rounded-full transition-opacity duration-300"
          style={{
            background: isActive
              ? `radial-gradient(circle at 50% 50%, ${theme.primary}40 0%, transparent 70%)`
              : "transparent",
            opacity: displayLevel,
          }}
        />

        {/* Mic / Sound icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative w-8 h-8 transition-all duration-200"
          style={{
            color: isActive ? theme.primary : "#C8943E",
            transform: isActive ? `scale(${1 + displayLevel * 0.12})` : "scale(1)",
          }}
        >
          {isSpeaking ? (
            <>
              <path d="M2 10v4" />
              <path d="M6 8v8" />
              <path d="M10 6v12" />
              <path d="M14 4v16" />
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

        {/* Ping border */}
        {isActive && !micOff && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{
              border: `2px solid ${theme.primary}`,
              animationDuration: `${1.5 - displayLevel * 0.5}s`,
            }}
          />
        )}
      </button>

      {/* ═══ 6. Floating particles ═══ */}
      {isActive && !micOff && <AudioParticles level={displayLevel} color={theme.primary} />}
    </div>
  );
}

// ─── Particles ───────────────────────────────────────────────────────────────

function AudioParticles({ level, color }: { level: number; color: string }) {
  const particles = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      angle: (360 / 6) * i + Math.random() * 15,
      dist: 85 + Math.random() * 40,
      size: 2.5 + Math.random() * 3.5,
      dur: 2 + Math.random() * 1.5,
      delay: Math.random() * 1.5,
    })), []);

  if (level < 0.05) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: color,
            opacity: level * (0.2 + Math.random() * 0.5),
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translate(${Math.cos((p.angle * Math.PI) / 180) * p.dist}px, ${Math.sin((p.angle * Math.PI) / 180) * p.dist}px)`,
            animation: `particle-drift-${p.id % 3} ${p.dur}s ease-in-out ${p.delay}s infinite`,
            boxShadow: `0 0 ${3 + level * 6}px ${color}`,
            transition: "opacity 0.3s",
          }}
        />
      ))}
    </div>
  );
}
