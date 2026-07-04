"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, ChevronDown, Volume2 } from "lucide-react";

// ─── Voice Options ───────────────────────────────────────────────────────────

export const VOICE_OPTIONS = [
  { id: "Puck", label: "Puck", desc: "Giọng nam ấm áp, tự nhiên", emoji: "🎙️" },
  { id: "Charon", label: "Charon", desc: "Giọng nam trầm, mạnh mẽ", emoji: "🎙️" },
  { id: "Kore", label: "Kore", desc: "Giọng nữ dịu dàng", emoji: "🎤" },
  { id: "Fenrir", label: "Fenrir", desc: "Giọng nam trung tính", emoji: "🎙️" },
  { id: "Aoede", label: "Aoede", desc: "Giọng nữ trong trẻo", emoji: "🎤" },
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border shadow-xl shadow-black/30 z-50 overflow-hidden animate-slide-up">
          <div className="p-1.5">
            {VOICE_OPTIONS.map((voice) => {
              const isSelected = voice.id === currentVoice;
              return (
                <button
                  key={voice.id}
                  onClick={() => handleSelect(voice.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  <span className="text-base">{voice.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{voice.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {voice.desc}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
