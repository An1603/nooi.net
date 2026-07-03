"use client";

import { useState } from "react";
import { useVoiceAssistant, type VoiceStatus } from "./useVoiceAssistant";
import {
  Mic,
  MicOff,
  Loader2,
  Volume2,
  AlertCircle,
  Headphones,
} from "lucide-react";

// ─── Voice Status Display Config ─────────────────────────────────────────────

const STATUS_LABELS: Record<VoiceStatus, string> = {
  init: "Đang kiểm tra...",
  ready: "Sẵn sàng",
  connecting: "Đang kết nối...",
  connected: "Đã kết nối",
  listening: "Đang nghe...",
  speaking: "Đang trả lời...",
  error: "Lỗi",
};

const STATUS_COLORS: Record<VoiceStatus, string> = {
  init: "text-muted-foreground",
  ready: "text-green-400",
  connecting: "text-amber-400",
  connected: "text-green-400",
  listening: "text-red-400",
  speaking: "text-purple-400",
  error: "text-red-500",
};

// ─── Component ───────────────────────────────────────────────────────────────

interface VoiceAssistantProps {
  /** Default voice */
  voice?: "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede";
  /** System instruction for Gemini */
  systemInstruction?: string;
  /** Optional title shown above the assistant */
  title?: string;
}

export function VoiceAssistant({
  voice,
  systemInstruction,
  title = "Trợ lý giọng nói",
}: VoiceAssistantProps) {
  const {
    status,
    transcript,
    response,
    audioLevel,
    error,
    isMicMuted,
    start,
    stop,
  } = useVoiceAssistant({ voice, systemInstruction });

  const [showTranscript, setShowTranscript] = useState(true);

  const isActive = status === "connected" || status === "listening" || status === "speaking";
  const isBusy = status === "connecting" || status === "init";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Gemini Live — <span className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</span>
        </p>
      </div>

      {/* Audio Visualizer Circle */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring animation */}
        <div
          className={`absolute rounded-full transition-all duration-300 ${
            status === "listening"
              ? "w-48 h-48 bg-red-500/10 animate-pulse"
              : status === "speaking"
              ? "w-48 h-48 bg-purple-500/10 animate-pulse"
              : "w-32 h-32"
          }`}
        />

        {/* Audio level ring */}
        <div
          className="absolute rounded-full transition-all duration-150 ease-out"
          style={{
            width: `${100 + audioLevel * 60}px`,
            height: `${100 + audioLevel * 60}px`,
            background:
              status === "listening"
                ? `radial-gradient(circle, rgba(239,68,68,${0.1 + audioLevel * 0.3}) 0%, transparent 70%)`
                : status === "speaking"
                ? `radial-gradient(circle, rgba(168,85,247,${0.1 + audioLevel * 0.3}) 0%, transparent 70%)`
                : "none",
          }}
        />

        {/* Mic button */}
        <button
          onClick={isActive ? stop : start}
          disabled={isBusy}
          className={`relative z-10 flex items-center justify-center w-24 h-24 rounded-full transition-all duration-200 ${
            isBusy
              ? "bg-muted cursor-not-allowed"
              : isActive
              ? "bg-red-500/20 hover:bg-red-500/30 border-2 border-red-400/50"
              : error
              ? "bg-red-500/10 border-2 border-red-500/30"
              : "bg-primary/10 hover:bg-primary/20 border-2 border-primary/30"
          }`}
          aria-label={isActive ? "Dừng" : "Bắt đầu"}
        >
          {isBusy ? (
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          ) : isActive ? (
            <Volume2 className="w-8 h-8 text-red-400" />
          ) : (
            <Mic className="w-8 h-8 text-primary" />
          )}
        </button>
      </div>

      {/* Mute indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isMicMuted && isActive ? (
          <>
            <MicOff className="w-3.5 h-3.5" />
            <span>Mic đang tắt — bấm lại để nói</span>
          </>
        ) : status === "listening" ? (
          <>
            <Mic className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Đang nghe — nói điều gì đó...</span>
          </>
        ) : status === "speaking" ? (
          <>
            <Headphones className="w-3.5 h-3.5 text-purple-400" />
            <span>Đang phản hồi...</span>
          </>
        ) : status === "ready" ? (
          <span>Bấm micro để bắt đầu</span>
        ) : null}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 max-w-md">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Transcript & Response */}
      {showTranscript && (transcript || response) && (
        <div className="w-full max-w-lg space-y-3">
          {/* User transcript */}
          {transcript && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Bạn:</p>
              <p className="text-sm text-foreground">{transcript}</p>
            </div>
          )}

          {/* AI response */}
          {response && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-primary/70 mb-1">NOOI AI:</p>
              <p className="text-sm text-foreground">{response}</p>
            </div>
          )}
        </div>
      )}

      {/* Toggle transcript */}
      {(transcript || response) && (
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showTranscript ? "Ẩn hội thoại" : "Hiện hội thoại"}
        </button>
      )}

      {/* Browser support warning */}
      {status === "error" && error?.includes("trình duyệt") && (
        <div className="text-xs text-muted-foreground text-center max-w-sm">
          <p>Hỗ trợ: Chrome 94+, Edge 94+, Safari 16.4+, Firefox 110+</p>
        </div>
      )}
    </div>
  );
}
