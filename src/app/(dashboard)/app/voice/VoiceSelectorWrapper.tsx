"use client";

import { useState } from "react";
import { VoiceSelector, type VoiceId } from "@/components/voice/VoiceSelector";

interface VoiceSelectorWrapperProps {
  userId: string;
  currentVoice: string;
}

export function VoiceSelectorWrapper({ userId, currentVoice }: VoiceSelectorWrapperProps) {
  const [voice, setVoice] = useState<VoiceId>(currentVoice as VoiceId);

  // Update the DOM so VoiceAssistant can read it
  const handleVoiceChange = (newVoice: VoiceId) => {
    setVoice(newVoice);
    // Dispatch a custom event so useVoiceAssistant can pick up the change
    const event = new CustomEvent("nooi:voice-change", { detail: newVoice });
    window.dispatchEvent(event);
  };

  return (
    <VoiceSelector
      userId={userId}
      currentVoice={voice}
      onVoiceChange={handleVoiceChange}
    />
  );
}
