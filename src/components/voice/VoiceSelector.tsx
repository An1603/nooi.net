"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, ChevronDown, Volume2, Play, Pause } from "lucide-react";

// ─── 10 Gemini Live Voices ────────────────────────────────────────────────────
// Source: docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api/configure-language-voice
// Preview files generated with edge-tts — each voice uses a different TTS voice.

export const VOICE_OPTIONS = [
  { id: "Puck",       label: "Puck",       desc: "Nam ấm áp, vui tươi",               emoji: "🎙️" },
  { id: "Charon",     label: "Charon",     desc: "Nam trầm ấm, tin cậy",              emoji: "🎙️" },
  { id: "Kore",       label: "Kore",       desc: "Nữ nhẹ nhàng, chắc chắn",           emoji: "🎤"  },
  { id: "Fenrir",     label: "Fenrir",     desc: "Nam hào hứng, năng lượng",          emoji: "🎙️" },
  { id: "Aoede",      label: "Aoede",      desc: "Nữ trong trẻo, mát lành",           emoji: "🎤"  },
  { id: "Zephyr",     label: "Zephyr",     desc: "Nam sáng sủa, tươi tắn",            emoji: "🎙️" },
  { id: "Leda",       label: "Leda",       desc: "Nữ trẻ trung, tươi mới",            emoji: "🎤"  },
  { id: "Orus",       label: "Orus",       desc: "Nam nam tính, mạnh mẽ",              emoji: "🎙️" },
  { id: "Callirrhoe", label: "Callirrhoe", desc: "Nữ thoải mái, tự nhiên",            emoji: "🎤"  },
  { id: "Sulafat",    label: "Sulafat",    desc: "Nam ấm áp, tình cảm",               emoji: "🎙️" },
] as const;

export type VoiceId = (typeof VOICE_OPTIONS)[number]["id"];

// ─── Props ───────────────────────────────────────────────────────────────────

interface VoiceSelectorProps {
  userId: string;
  currentVoice: VoiceId;
  onVoiceChange: (voice: VoiceId) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VoiceSelector({ userId, currentVoice, onVoiceChange }: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState<VoiceId | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selected = VOICE_OPTIONS.find((v) => v.id === currentVoice) ?? VOICE_OPTIONS[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const handleSelect = async (voice: VoiceId) => {
    setOpen(false);
    if (voice === currentVoice) return;

    setSaving(true);
    onVoiceChange(voice);

    try {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ voice_preference: voice })
        .eq("user_id", userId);
    } catch {
      // Silent fail — preference still works for this session
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (voice: VoiceId) => {
    // If already playing this voice, stop
    if (playing === voice) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlaying(null);
      return;
    }

    // Stop any current playback
    audioRef.current?.pause();

    // Create and play new audio
    const audio = new Audio(`/voice-previews/${voice.toLowerCase()}.mp3`);
    audioRef.current = audio;
    setPlaying(voice);

    audio.onended = () => {
      setPlaying(null);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setPlaying(null);
      audioRef.current = null;
    };

    audio.play().catch(() => {
      setPlaying(null);
      audioRef.current = null;
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
      >
        <Volume2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Giọng:</span>
        <span className="font-medium text-foreground">{selected.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
        {saving && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-card border border-border shadow-xl shadow-black/30 z-50 overflow-hidden animate-slide-up">
          <div className="p-1.5">
            {VOICE_OPTIONS.map((voice) => {
              const isSelected = voice.id === currentVoice;
              const isPlaying = playing === voice.id;
              return (
                <div
                  key={voice.id}
                  className={`flex items-center gap-1 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary/10"
                      : "hover:bg-muted/30"
                  }`}
                >
                  {/* Select button */}
                  <button
                    onClick={() => handleSelect(voice.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-left text-sm flex-1 min-w-0 ${
                      isSelected
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-base shrink-0">{voice.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium leading-tight">{voice.label}</div>
                      <div className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                        {voice.desc}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </button>

                  {/* Preview button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePreview(voice.id); }}
                    className={`shrink-0 mr-1 p-2 rounded-lg transition-colors ${
                      isPlaying
                        ? "text-red-400 hover:text-red-300 bg-red-500/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    title={isPlaying ? "Dừng" : "Nghe thử giọng"}
                    aria-label={`Nghe thử giọng ${voice.label}`}
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
