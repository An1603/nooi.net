"use client";

import { useMemo } from "react";
import type { VoiceStatus } from "./useVoiceAssistant";

// ─── Configuration ──────────────────────────────────────────────────────────

interface VoiceVisualizerProps {
  status: VoiceStatus;
  audioLevel: number; // 0-1
  isSpeaking: boolean; // true khi Gemini đang nói
  onToggle: () => void;
  disabled?: boolean;
}

// ─── Theme Colors ────────────────────────────────────────────────────────────

const THEME = {
  listening: {
    primary: "#ef4444",     // red-500
    secondary: "#f97316",   // orange-500
    glow: "rgba(239, 68, 68, 0.3)",
    label: "Đang nghe...",
  },
  speaking: {
    primary: "#a78bfa",     // violet-400
    secondary: "#c084fc",   // violet-300
    glow: "rgba(167, 139, 250, 0.3)",
    label: "Đang trả lời...",
  },
  ready: {
    primary: "#C8943E",     // gold
    secondary: "#eab308",   // yellow-500
    glow: "rgba(200, 148, 62, 0.2)",
    label: "Bấm để nói",
  },
  connecting: {
    primary: "#fbbf24",     // amber-400
    secondary: "#f59e0b",   // amber-500
    glow: "rgba(251, 191, 36, 0.2)",
    label: "Đang kết nối...",
  },
};

// ─── Bar Visualizer Data ────────────────────────────────────────────────────

const BAR_COUNT = 36;
const BAR_ANGLES = Array.from({ length: BAR_COUNT }, (_, i) => (360 / BAR_COUNT) * i);

function generateBarHeights(audioLevel: number, isActive: boolean): number[] {
  if (!isActive) return BAR_ANGLES.map(() => 2 + Math.random() * 4);

  const heights: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    // Simulate spectrum: lower frequencies (first bars) have more energy
    const freqFactor = 1 - i / BAR_COUNT; // 1 → 0
    const variation = Math.sin(Date.now() / 300 + i * 0.5) * 0.3 + 0.7;
    const h = 3 + audioLevel * 24 * freqFactor * variation;
    heights.push(Math.max(2, Math.min(28, h)));
  }
  return heights;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VoiceVisualizer({ status, audioLevel, isSpeaking, onToggle, disabled }: VoiceVisualizerProps) {
  const isActive = status === "listening" || status === "speaking";
  const isBusy = status === "connecting" || status === "init";
  const theme = status === "listening"
    ? THEME.listening
    : status === "speaking"
    ? THEME.speaking
    : status === "connecting"
    ? THEME.connecting
    : THEME.ready;

  const barHeights = useMemo(
    () => generateBarHeights(audioLevel, isActive),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [audioLevel, isActive, status]
  );

  return (
    <div className="relative flex items-center justify-center w-72 h-72 mx-auto select-none">
      {/* ===== Outer glow ===== */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.glow} 0%, transparent 70%)`,
          transform: `scale(${1 + audioLevel * 0.15})`,
          opacity: isActive ? 0.8 : 0.3,
        }}
      />

      {/* ===== Ripple rings ===== */}
      {isActive && (
        <>
          <RippleRing delay={0} audioLevel={audioLevel} color={theme.primary} />
          <RippleRing delay={0.3} audioLevel={audioLevel} color={theme.secondary} />
          <RippleRing delay={0.6} audioLevel={audioLevel} color={theme.primary} />
        </>
      )}

      {/* ===== Spectrum bars ===== */}
      {BAR_ANGLES.map((angle, i) => {
        const h = barHeights[i];
        return (
          <div
            key={angle}
            className="absolute rounded-full transition-all"
            style={{
              width: 3,
              height: h,
              background: isActive
                ? `linear-gradient(to top, ${theme.primary}, ${theme.secondary})`
                : "rgba(255,255,255,0.1)",
              left: "50%",
              top: "50%",
              transformOrigin: "50% 0",
              transform: `translateX(-50%) translateY(-50%) rotate(${angle}deg) translateY(-${70 + audioLevel * 12}px)`,
              opacity: isActive ? 0.6 + audioLevel * 0.4 : 0.15,
              borderRadius: 2,
              transition: "height 0.1s ease, opacity 0.3s ease",
            }}
          />
        );
      })}

      {/* ===== Inner pulsing ring ===== */}
      <div
        className="absolute rounded-full transition-all duration-150 ease-out"
        style={{
          width: `${150 + audioLevel * 50}px`,
          height: `${150 + audioLevel * 50}px`,
          border: `2px solid ${theme.primary}${isActive ? "88" : "33"}`,
          opacity: isActive ? 0.5 + audioLevel * 0.5 : 0.2,
          transform: `scale(${1 + audioLevel * 0.1})`,
          boxShadow: isActive
            ? `0 0 ${20 + audioLevel * 40}px ${theme.glow}`
            : "none",
        }}
      />

      {/* ===== Center glow ===== */}
      <div
        className="absolute rounded-full transition-all duration-300"
        style={{
          width: 130,
          height: 130,
          background: isActive
            ? `radial-gradient(circle, ${theme.primary}22 0%, ${theme.secondary}11 50%, transparent 70%)`
            : "radial-gradient(circle, rgba(200,148,62,0.08) 0%, transparent 60%)",
        }}
      />

      {/* ===== Mic Button ===== */}
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
            ? `0 0 ${30 + audioLevel * 50}px ${theme.glow}, inset 0 0 ${20 + audioLevel * 30}px ${theme.primary}11`
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
            opacity: audioLevel,
          }}
        />

        {/* Mic icon */}
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
            transform: isActive ? `scale(${1 + audioLevel * 0.15})` : "scale(1)",
          }}
        >
          {isSpeaking ? (
            <>
              {/* Speaker/wave icon when AI is speaking */}
              <path d="M2 10v4" />
              <path d="M6 8v8" />
              <path d="M10 6v12" />
              <path d="M14 4v16" />
            </>
          ) : (
            <>
              {/* Mic icon */}
              <rect x="9" y="2" width="6" height="11" rx="3" ry="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </>
          )}
        </svg>

        {/* Pulsing button border */}
        {isActive && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{
              border: `2px solid ${theme.primary}`,
              animationDuration: `${1.5 - audioLevel * 0.5}s`,
            }}
          />
        )}
      </button>

      {/* ===== Floating particles ===== */}
      {isActive && <AudioParticles audioLevel={audioLevel} color={theme.primary} />}
    </div>
  );
}

// ─── Ripple Ring Sub-Component ───────────────────────────────────────────────

function RippleRing({ delay, audioLevel, color }: { delay: number; audioLevel: number; color: string }) {
  const animDelay = -delay;

  return (
    <div
      className="absolute rounded-full"
      style={{
        width: 120,
        height: 120,
        border: `1.5px solid ${color}44`,
        animation: `ripple-expand 2.5s ease-out infinite`,
        animationDelay: `${animDelay}s`,
        opacity: 0.3 + audioLevel * 0.3,
        transform: `scale(${1 + audioLevel * 0.5})`,
      }}
    />
  );
}

// ─── Audio Particles ─────────────────────────────────────────────────────────

function AudioParticles({ audioLevel, color }: { audioLevel: number; color: string }) {
  // Generate particles with stable keys
  const particles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      angle: (360 / 8) * i + Math.random() * 20,
      distance: 80 + Math.random() * 60,
      size: 3 + Math.random() * 5,
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 2,
    }));
  }, []);

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
            opacity: audioLevel * (0.3 + Math.random() * 0.4),
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translate(${Math.cos((p.angle * Math.PI) / 180) * p.distance}px, ${Math.sin((p.angle * Math.PI) / 180) * p.distance}px)`,
            animation: audioLevel > 0.1
              ? `particle-float-${p.id % 3} ${p.duration}s ease-in-out ${p.delay}s infinite`
              : "none",
            boxShadow: `0 0 ${4 + audioLevel * 8}px ${color}`,
            transition: "opacity 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}
