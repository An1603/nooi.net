"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, ChevronDown, Volume2, Loader2, Play, StopCircle } from "lucide-react";

// ─── 10 Gemini Live Voices ────────────────────────────────────────────────────
// Source: docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api/configure-language-voice

export const VOICE_OPTIONS = [
  { id: "Puck",    label: "Puck",       desc: "Nam ấm áp, vui tươi",        emoji: "🎙️", previewPitch: 1.0, previewRate: 1.0 },
  { id: "Charon",  label: "Charon",     desc: "Nam trầm ấm, tin cậy",       emoji: "🎙️", previewPitch: 0.7, previewRate: 0.85 },
  { id: "Kore",    label: "Kore",       desc: "Nữ nhẹ nhàng, chắc chắn",     emoji: "🎤",  previewPitch: 1.3, previewRate: 0.9 },
  { id: "Fenrir",  label: "Fenrir",     desc: "Nam hào hứng, năng lượng",    emoji: "🎙️", previewPitch: 1.1, previewRate: 1.1 },
  { id: "Aoede",   label: "Aoede",      desc: "Nữ trong trẻo, mát lành",     emoji: "🎤",  previewPitch: 1.4, previewRate: 0.95 },
  { id: "Zephyr",  label: "Zephyr",     desc: "Nam sáng sủa, tươi tắn",     emoji: "🎙️", previewPitch: 0.9, previewRate: 0.95 },
  { id: "Leda",    label: "Leda",       desc: "Nữ trẻ trung, tươi mới",     emoji: "🎤",  previewPitch: 1.5, previewRate: 1.0 },
  { id: "Orus",    label: "Orus",       desc: "Nam nam tính, mạnh mẽ",       emoji: "🎙️", previewPitch: 0.6, previewRate: 0.85 },
  { id: "Callirrhoe", label: "Callirrhoe", desc: "Nữ thoải mái, tự nhiên",   emoji: "🎤",  previewPitch: 1.2, previewRate: 0.9 },
  { id: "Sulafat", label: "Sulafat",    desc: "Nam ấm áp, tình cảm",        emoji: "🎙️", previewPitch: 0.8, previewRate: 0.85 },
] as const;

export type VoiceId = (typeof VOICE_OPTIONS)[number]["id"];

// ─── Preview Text ─────────────────────────────────────────────────────────────

const PREVIEW_TEXT = "Xin chào, tôi là trợ lý giọng nói của NOOI. Rất vui được trò chuyện cùng bạn.";

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
  const [previewId, setPreviewId] = useState<VoiceId | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const selected = VOICE_OPTIONS.find((v) => v.id === currentVoice) ?? VOICE_OPTIONS[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPreviewId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleSelect = async (voice: VoiceId) => {
    setOpen(false);
    setPreviewId(null);
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

  const speakPreview = useCallback((voice: VoiceId) => {
    if (!window.speechSynthesis) return;

    // If already playing this voice, stop it
    if (previewId === voice) {
      window.speechSynthesis.cancel();
      setPreviewId(null);
      currentUtteranceRef.current = null;
      return;
    }

    // Cancel any ongoing preview
    window.speechSynthesis.cancel();

    const option = VOICE_OPTIONS.find(v => v.id === voice);
    if (!option) return;

    const utterance = new SpeechSynthesisUtterance(PREVIEW_TEXT);
    utterance.lang = "vi-VN";
    utterance.pitch = option.previewPitch;
    utterance.rate = option.previewRate;

    currentUtteranceRef.current = utterance;

    setPreviewBusy(true);
    setPreviewId(voice);

    utterance.onend = () => {
      setPreviewBusy(false);
      setPreviewId(null);
      currentUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      setPreviewBusy(false);
      setPreviewId(null);
      currentUtteranceRef.current = null;
    };

    // Try to find a Vietnamese voice
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.startsWith("vi"));
    if (viVoice) utterance.voice = viVoice;

    window.speechSynthesis.speak(utterance);
  }, [previewId]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) setPreviewId(null); }}
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
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-card border border-border shadow-xl shadow-black/30 z-50 overflow-hidden animate-slide-up">
          <div className="p-1.5">
            {VOICE_OPTIONS.map((voice) => {
              const isSelected = voice.id === currentVoice;
              const isPreviewing = previewId === voice.id;
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
                    onClick={(e) => { e.stopPropagation(); speakPreview(voice.id); }}
                    className="shrink-0 mr-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Nghe thử giọng"
                    aria-label={`Nghe thử giọng ${voice.label}`}
                  >
                    {isPreviewing && previewBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    ) : isPreviewing ? (
                      <StopCircle className="w-3.5 h-3.5 text-red-400" />
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
