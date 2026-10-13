"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  GeminiLiveClient,
  type GeminiLiveEvent,
  type VoiceOption,
  type ToolFunctionCall,
  type ToolFunctionResponse,
} from "@/lib/voice/gemini-live";
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

/** Một lượt hội thoại trong phiên: bé nói (user) hoặc AI đáp (ai). */
export interface VoiceTurn {
  role: "user" | "ai";
  text: string;
}

/** Callback xử lý tool call: nhận danh sách lời gọi + hàm `respond` để trả kết quả. */
export type OnToolCall = (
  calls: ToolFunctionCall[],
  respond: (res: ToolFunctionResponse[]) => void
) => void;

export interface VoiceAssistantConfig {
  voice?: VoiceOption;
  systemInstruction?: string;
  /**
   * Gọi NGAY khi danh sách lượt hội thoại thay đổi (đồng bộ, không qua effect)
   * — để cha nhận được cả lượt cuối cùng khi component bị gỡ.
   */
  onTurnsChange?: (turns: VoiceTurn[]) => void;
  /**
   * Khai báo function calling gửi kèm setup — chỉ dùng cho eKid.
   * Bỏ trống → AI Mentor hoạt động như cũ.
   */
  tools?: unknown[];
  /** Xử lý khi model gọi hàm (chỉ khi eKid truyền `tools`). */
  onToolCall?: OnToolCall;
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
  const [turns, setTurns] = useState<VoiceTurn[]>([]);

  const clientRef = useRef<GeminiLiveClient | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const playbackRef = useRef<AudioPlayback | null>(null);
  const statusRef = useRef<VoiceStatus>("init");
  const voiceRef = useRef<string>(config?.voice || "Puck");

  // ── Tích luỹ hội thoại ──────────────────────────────────────────────────
  // turnsRef: bản sao đồng bộ của `turns` (tránh stale closure trong handler).
  // curUserRef/curAiRef: văn bản ĐANG nói của lượt hiện tại (transcription tích
  // luỹ theo lượt); userCommittedRef/aiCommittedRef: đã chốt lượt hiện tại chưa.
  const turnsRef = useRef<VoiceTurn[]>([]);
  const curUserRef = useRef("");
  const curAiRef = useRef("");
  const userCommittedRef = useRef(false);
  const aiCommittedRef = useRef(false);
  // Đánh dấu lượt AI đã có văn bản từ output_transcription (bản đầy đủ theo lượt) —
  // khi đó KHÔNG cộng dồn thêm các part `text` để tránh nhân đôi lượt AI.
  const aiTranscribedRef = useRef(false);
  const onTurnsChangeRef = useRef(config?.onTurnsChange);
  const onToolCallRef = useRef(config?.onToolCall);

  // Giữ callback mới nhất mà không cần đưa vào phụ thuộc của start().
  useEffect(() => {
    onTurnsChangeRef.current = config?.onTurnsChange;
  }, [config?.onTurnsChange]);

  useEffect(() => {
    onToolCallRef.current = config?.onToolCall;
  }, [config?.onToolCall]);

  // Chốt một lượt vào mảng turns và báo lên cha (đồng bộ, best-effort).
  const commitTurn = useCallback((role: "user" | "ai", text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const next = [...turnsRef.current, { role, text: clean }];
    turnsRef.current = next;
    setTurns(next);
    onTurnsChangeRef.current?.(next);
  }, []);

  // Chốt lượt BÉ khi AI bắt đầu trả lời (hoặc khi đổi lượt).
  const commitPendingUser = useCallback(() => {
    if (userCommittedRef.current) return;
    userCommittedRef.current = true;
    commitTurn("user", curUserRef.current);
  }, [commitTurn]);

  // Chốt lượt AI khi lượt AI kết thúc (turn_complete) hoặc bị ngắt/đổi lượt.
  const commitPendingAi = useCallback(() => {
    if (aiCommittedRef.current) return;
    aiCommittedRef.current = true;
    commitTurn("ai", curAiRef.current);
  }, [commitTurn]);

  // Chốt mọi lượt đang dở rồi mở lượt mới (khi kết thúc/đổi lượt).
  const flushTurns = useCallback(() => {
    commitPendingUser();
    commitPendingAi();
    curUserRef.current = "";
    curAiRef.current = "";
    userCommittedRef.current = false;
    aiCommittedRef.current = false;
    aiTranscribedRef.current = false;
  }, [commitPendingUser, commitPendingAi]);

  // Reset toàn bộ tích luỹ (bắt đầu phiên mới).
  const resetTurns = useCallback(() => {
    turnsRef.current = [];
    curUserRef.current = "";
    curAiRef.current = "";
    userCommittedRef.current = false;
    aiCommittedRef.current = false;
    aiTranscribedRef.current = false;
    setTurns([]);
  }, []);

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
    resetTurns();
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
        tools: config?.tools,
      });

      client.onOpen = () => {
        setSafeStatus("connected");
      };

      client.onClose = () => {
        // Chốt nốt lượt đang dở để không mất hội thoại khi ngắt kết nối.
        flushTurns();
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
            captureRef.current?.setPaused(false);
            setSafeStatus("listening");
            setIsMicMuted(false);
            break;

          case "audio":
            // AI bắt đầu đáp → chốt lượt BÉ, NGƯNG gửi mic (chống lặp âm thanh: loa phát
            // tiếng AI → mic thu lại → model tự ngắt lời mình, chép lời sai).
            commitPendingUser();
            setSafeStatus("speaking");
            setIsMicMuted(true);
            captureRef.current?.setPaused(true);
            playbackRef.current?.playBase64PCM(event.data);
            break;

          case "text":
            // AI bắt đầu đáp bằng TEXT (không audio) → vẫn phải tích luỹ để không mất
            // lượt AI text-only. Chỉ cộng dồn khi lượt này CHƯA có output_transcription.
            commitPendingUser();
            if (!aiTranscribedRef.current) curAiRef.current += event.data;
            setResponse((prev) => prev + event.data);
            break;

          case "input_transcription":
            if (event.data.text) {
              // Văn bản tích luỹ theo ĐÚNG lượt này của bé.
              curUserRef.current = event.data.text;
              setTranscript(event.data.text);
            }
            break;

          case "output_transcription":
            if (event.data.text) {
              // AI bắt đầu đáp → chốt lượt bé; tích luỹ văn bản AI của lượt này.
              commitPendingUser();
              aiTranscribedRef.current = true;
              curAiRef.current = event.data.text;
              setResponse(event.data.text);
            }
            break;

          case "interrupted":
            // AI bị ngắt giữa lượt → chốt phần đã nói rồi mở lượt mới.
            flushTurns();
            playbackRef.current?.stop();
            captureRef.current?.setPaused(false);
            setSafeStatus("listening");
            setIsMicMuted(false);
            break;

          case "turn_complete":
            // Lượt AI kết thúc → chốt lượt AI + mở lượt mới cho bé.
            flushTurns();
            captureRef.current?.setPaused(false);
            setSafeStatus("listening");
            setIsMicMuted(false);
            break;

          case "tool_call":
            // Model gọi hàm (eKid) — chuyển lên UI; UI xử lý xong gọi `respond`.
            onToolCallRef.current?.(event.data.functionCalls, (res) => {
              clientRef.current?.sendToolResponse(res);
            });
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
  }, [config?.voice, config?.systemInstruction, config?.tools, setSafeStatus, resetTurns, flushTurns, commitPendingUser]);

  /**
   * TẠM DỪNG trò chuyện (giữ phiên): ngưng gửi mic + ngưng phát giọng AI.
   * Dùng khi bé đang xem VIDEO — để bé nghe rõ và TIẾT KIỆM voice live.
   * Không làm gì nếu phiên chưa hoạt động.
   */
  const pause = useCallback(() => {
    const s = statusRef.current;
    if (s !== "listening" && s !== "speaking" && s !== "connected") return;
    captureRef.current?.setPaused(true);
    playbackRef.current?.stop();
    setIsMicMuted(true);
    setSafeStatus("connected");
  }, [setSafeStatus]);

  /** TIẾP TỤC trò chuyện sau khi tạm dừng (chỉ khi đang ở trạng thái tạm dừng). */
  const resume = useCallback(() => {
    if (statusRef.current !== "connected") return;
    captureRef.current?.setPaused(false);
    setIsMicMuted(false);
    setSafeStatus("listening");
  }, [setSafeStatus]);

  const stop = useCallback(() => {
    // Chốt nốt lượt đang dở trước khi ngắt phiên.
    flushTurns();
    captureRef.current?.stop();
    clientRef.current?.disconnect();
    playbackRef.current?.stop();
    setIsMicMuted(true);
    setAudioLevel(0);
    setSafeStatus("ready");
  }, [setSafeStatus, flushTurns]);

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

  /** Gửi kết quả xử lý tool call về cho model (dùng khi không dùng `respond` trong onToolCall). */
  const sendToolResponse = useCallback((responses: ToolFunctionResponse[]) => {
    clientRef.current?.sendToolResponse(responses);
  }, []);

  /**
   * Gửi một LƯỢT VĂN BẢN vào phiên theo thời gian thực.
   * Dùng để ÉP AI lên tiếng ngay (vd: thông báo kết quả bài tập) — không phụ thuộc
   * việc model có tự phát lượt hay không. An toàn khi chưa kết nối: tự bỏ qua.
   */
  const sendText = useCallback((text: string) => {
    clientRef.current?.sendText(text);
  }, []);

  return {
    status,
    transcript,
    response,
    /** Toàn bộ lượt hội thoại tích luỹ trong phiên (bé ↔ AI). */
    turns,
    audioLevel,
    error,
    support,
    isMicMuted,
    start,
    stop,
    pause,
    resume,
    toggleMute,
    sendToolResponse,
    sendText,
  };
}
