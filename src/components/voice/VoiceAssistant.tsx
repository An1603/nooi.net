"use client";

import { useState } from "react";
import { useVoiceAssistant, type VoiceStatus } from "./useVoiceAssistant";
import { VoiceVisualizer } from "./VoiceVisualizer";
import {
  Mic,
  MicOff,
  Loader2,
  AlertCircle,
  Volume2,
  MessageSquare,
} from "lucide-react";

// ─── Voice Status Labels ─────────────────────────────────────────────────────

const STATUS_LABELS: Record<VoiceStatus, string> = {
  init: "Đang khởi động...",
  ready: "Sẵn sàng",
  connecting: "Đang kết nối...",
  connected: "Đã kết nối",
  listening: "Đang nghe...",
  speaking: "Đang trả lời...",
  error: "Lỗi",
};

// ─── Component ───────────────────────────────────────────────────────────────

interface VoiceAssistantProps {
  voice?: "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede";
  systemInstruction?: string;
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

  const [showChat, setShowChat] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const isActive = status === "connected" || status === "listening" || status === "speaking";
  const isBusy = status === "connecting" || status === "init";
  const isListening = status === "listening";
  const isSpeaking = status === "speaking";
  const hasConversation = transcript.length > 0 || response.length > 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
      {/* ── Status Header ── */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isActive ? "animate-pulse" : ""
            }`}
            style={{
              backgroundColor:
                isListening ? "#ef4444" :
                isSpeaking ? "#a78bfa" :
                error ? "#ef4444" :
                isBusy ? "#fbbf24" :
                "#22c55e",
            }}
          />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {error ? (
            <span className="text-red-400">{error}</span>
          ) : (
            <>
              <span className="hidden sm:inline">Gemini Live — </span>
              {STATUS_LABELS[status]}
            </>
          )}
        </p>
      </div>

      {/* ── Voice Visualizer ── */}
      <div
        className="transition-transform duration-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transform: isHovered && !isBusy ? "scale(1.03)" : "scale(1)",
        }}
      >
        <VoiceVisualizer
          status={status}
          audioLevel={audioLevel}
          isSpeaking={isSpeaking}
          onToggle={isActive ? stop : start}
          disabled={isBusy}
        />
      </div>

      {/* ── Status Messages ── */}
      <div className="text-center min-h-[2rem]">
        {isBusy ? (
          <div className="flex items-center justify-center gap-2 text-sm text-amber-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang thiết lập kết nối...</span>
          </div>
        ) : isListening ? (
          <div className="flex items-center justify-center gap-2 text-sm text-red-400 animate-pulse">
            <Mic className="w-4 h-4" />
            <span>Đang nghe — hãy nói điều gì đó...</span>
          </div>
        ) : isSpeaking ? (
          <div className="flex items-center justify-center gap-2 text-sm text-purple-400">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Đang phản hồi...</span>
          </div>
        ) : status === "ready" ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mic className="w-4 h-4" />
            <span>Bấm micro để bắt đầu trò chuyện</span>
          </div>
        ) : status === "connected" ? (
          <div className="flex items-center justify-center gap-2 text-sm text-green-400">
            <span>Đã kết nối — mic đang tắt</span>
          </div>
        ) : null}
      </div>

      {/* ── Mute status (when connected but not listening) ── */}
      {isMicMuted && isActive && !isSpeaking && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/40 border border-border/50 text-xs text-muted-foreground">
          <MicOff className="w-3.5 h-3.5" />
          <span>Mic đang tắt — bấm lại để nói</span>
        </div>
      )}

      {/* ── Error (non-fatal) ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 max-w-md w-full">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300 mb-1">Lỗi kết nối</p>
            <p className="text-xs text-red-400/80">{error}</p>
          </div>
        </div>
      )}

      {/* ── Chat Transcript ── */}
      {hasConversation && (
        <div className="w-full max-w-lg space-y-4 animate-slide-up">
          {/* Toggle */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted/30"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {showChat ? "Ẩn hội thoại" : "Hiện hội thoại"}
            </button>
          </div>

          {showChat && (
            <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar">
              {/* User Message */}
              {transcript && (
                <div className="flex items-start gap-3 animate-slide-up">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Bạn</p>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                      <p className="text-sm text-foreground">{transcript}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Response */}
              {response && (
                <div className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-primary/70 mb-1 font-medium">NOOI AI</p>
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm text-foreground">{response}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tips (when idle) ── */}
      {!hasConversation && !error && status === "ready" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-2">
          <Tip icon="🎤" title="Bấm để nói" desc="Bấm micro, nói câu hỏi, thả tay để gửi" />
          <Tip icon="⚡" title="Phản hồi tức thì" desc="Gemini AI trả lời real-time, có thể ngắt lời" />
          <Tip icon="📱" title="Dùng trên mobile" desc="Chrome Android & Safari iOS 14.5+" />
        </div>
      )}
    </div>
  );
}

// ─── Tip Sub-Component ───────────────────────────────────────────────────────

function Tip({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/20 border border-border/40 text-center">
      <div className="text-lg mb-1">{icon}</div>
      <h3 className="text-xs font-medium text-foreground mb-0.5">{title}</h3>
      <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
    </div>
  );
}
