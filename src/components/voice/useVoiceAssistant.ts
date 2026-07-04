"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GeminiLiveClient, type GeminiLiveEvent, type VoiceOption } from "@/lib/voice/gemini-live";
import { AudioCapture, AudioPlayback, checkAudioSupport } from "@/lib/voice/audio-utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type VoiceStatus =
  | "init"       // Checking browser support
  | "ready"      // Supported, awaiting user to start
  | "connecting" // Fetching token + opening WS
  | "connected"  // WS connected, waiting for mic
  | "listening"  // Mic active, speaking to Gemini
  | "speaking"   // Gemini responding
  | "error";     // Something failed

export interface VoiceAssistantConfig {
  voice?: VoiceOption;
  systemInstruction?: string;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useVoiceAssistant(config?: VoiceAssistantConfig) {
  const [status, setStatus] = useState<VoiceStatus>("init");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [support, setSupport] = useState<{ supported: boolean; missing: string[] } | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [voiceKey, setVoiceKey] = useState(0); // Increment to force reconnect

  const clientRef = useRef<GeminiLiveClient | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const playbackRef = useRef<AudioPlayback | null>(null);
  const statusRef = useRef<VoiceStatus>("init");
  const voiceRef = useRef<string>(config?.voice || "Puck");

  // Listen for voice changes from VoiceSelector
  useEffect(() => {
    voiceRef.current = config?.voice || "Puck";
  }, [config?.voice]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      voiceRef.current = e.detail;
      if (status === "listening" || status === "speaking" || status === "connected") {
        clientRef.current?.disconnect();
        captureRef.current?.stop();
        playbackRef.current?.stop();
        setStatus("ready");
        setIsMicMuted(true);
      }
    };
    window.addEventListener("nooi:voice-change", handler as EventListener);
    return () => window.removeEventListener("nooi:voice-change", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const setSafeStatus = useCallback((s: VoiceStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  // Check browser support on mount
  useEffect(() => {
    const audioSupport = checkAudioSupport();
    setSupport(audioSupport);
    setSafeStatus(audioSupport.supported ? "ready" : "error");
    if (!audioSupport.supported) {
      setError(
        `Trình duyệt không hỗ trợ: ${audioSupport.missing.join(", ")}. Vui lòng dùng Chrome/Edge/Safari mới nhất.`
      );
    }

    playbackRef.current = new AudioPlayback();

    return () => {
      clientRef.current?.disconnect();
      captureRef.current?.stop();
      playbackRef.current?.close();
    };
  }, [setSafeStatus]);

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");
    setResponse("");
    setSafeStatus("connecting");

    try {
      // 1. Get ephemeral token from server
      const tokenRes = await fetch("/api/voice/token", { method: "POST" });
      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}));
        throw new Error(errData.error || `Token error (${tokenRes.status})`);
      }
      const tokenData = await tokenRes.json();
      const token = tokenData.token || tokenData.authToken || tokenData.access_token;

      if (!token) {
        throw new Error("No token received from server");
      }

      // 2. Create Gemini Live client
      const client = new GeminiLiveClient({
        token,
        voice: (voiceRef.current || "Puck") as VoiceOption,
        systemInstruction: config?.systemInstruction || "",
        inputAudioTranscription: true,
        outputAudioTranscription: true,
      });

      client.onOpen = () => {
        setSafeStatus("connected");
      };

      client.onClose = () => {
        setSafeStatus("ready");
        captureRef.current?.stop();
        setIsMicMuted(true);
      };

      client.onError = (err) => {
        setError(err);
        setSafeStatus("error");
      };

      client.onEvent = (event: GeminiLiveEvent) => {
        switch (event.type) {
          case "setup_complete":
            // Setup done — now start mic
            setSafeStatus("listening");
            setIsMicMuted(false);
            break;

          case "audio":
            setSafeStatus("speaking");
            setIsMicMuted(true);
            playbackRef.current?.playBase64PCM(event.data);
            break;

          case "text":
            setResponse((prev) => prev + event.data);
            break;

          case "input_transcription":
            if (event.data.text) {
              setTranscript(event.data.text);
            }
            break;

          case "output_transcription":
            if (event.data.text) {
              setResponse(event.data.text);
            }
            break;

          case "interrupted":
            playbackRef.current?.stop();
            setSafeStatus("listening");
            setIsMicMuted(false);
            break;

          case "turn_complete":
            setSafeStatus("listening");
            setIsMicMuted(false);
            break;
        }
      };

      // 3. Connect WebSocket
      client.connect();
      clientRef.current = client;

      // 4. Start audio capture (will send chunks after setup)
      const capture = new AudioCapture({
        onChunk: (base64PCM) => {
          clientRef.current?.sendAudio(base64PCM);
        },
        onLevel: (level) => {
          setAudioLevel(level);
        },
        onError: (msg) => {
          setError(msg);
          setSafeStatus("error");
        },
      });

      captureRef.current = capture;
      await capture.start();
    } catch (err) {
      const msg = (err as Error).message || "Unknown error";
      setError(msg);
      setSafeStatus("error");
    }
  }, [config?.voice, config?.systemInstruction, setSafeStatus]);

  const stop = useCallback(() => {
    captureRef.current?.stop();
    clientRef.current?.disconnect();
    playbackRef.current?.stop();
    setIsMicMuted(true);
    setAudioLevel(0);
    setSafeStatus("ready");
  }, [setSafeStatus]);

  const toggleMute = useCallback(() => {
    // For now, toggle = stop/start
    if (status === "listening") {
      captureRef.current?.stop();
      setIsMicMuted(true);
      setSafeStatus("connected");
    } else if (status === "connected" || status === "speaking") {
      captureRef.current?.start().catch(() => {});
      setIsMicMuted(false);
      setSafeStatus("listening");
    }
  }, [status, setSafeStatus]);

  return {
    status,
    transcript,
    response,
    audioLevel,
    error,
    support,
    isMicMuted,
    start,
    stop,
    toggleMute,
  };
}
