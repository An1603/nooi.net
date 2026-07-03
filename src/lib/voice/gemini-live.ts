/**
 * Gemini Live API — Browser WebSocket Client
 *
 * Handles the direct WebSocket connection to Gemini's Live API using
 * ephemeral tokens. Supports real-time bidirectional audio streaming
 * with barge-in (interrupt), voice configuration, and transcriptions.
 *
 * Protocol: wss://generativelanguage.googleapis.com/ws/...v1beta.GenerativeService.BidiGenerateContentConstrained
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GeminiLiveConfig {
  /** Ephemeral token from /api/voice/token */
  token: string;
  /** Model ID (default: gemini-3.1-flash-live-preview) */
  model?: string;
  /** Voice: Puck, Charon, Kore, Fenrir, Aoede */
  voice?: string;
  /** System instruction */
  systemInstruction?: string;
  /** Enable transcription of user's speech */
  inputAudioTranscription?: boolean;
  /** Enable transcription of model's speech */
  outputAudioTranscription?: boolean;
  /** Temperature (0-1, default: 1.0) */
  temperature?: number;
}

export type VoiceOption = "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede";

export type GeminiLiveEvent =
  | { type: "setup_complete" }
  | { type: "audio"; data: string }
  | { type: "text"; data: string }
  | { type: "interrupted" }
  | { type: "turn_complete" }
  | { type: "input_transcription"; data: { text: string; finished: boolean } }
  | { type: "output_transcription"; data: { text: string; finished: boolean } }
  | { type: "error"; data: string };

// ─── Client ──────────────────────────────────────────────────────────────────

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private token: string;
  private model: string;
  private voice: string;
  private systemInstruction: string;
  private inputTranscription: boolean;
  private outputTranscription: boolean;
  private temperature: number;
  private connected = false;

  public onEvent: ((event: GeminiLiveEvent) => void) | null = null;
  public onOpen: (() => void) | null = null;
  public onClose: (() => void) | null = null;
  public onError: ((err: string) => void) | null = null;

  constructor(config: GeminiLiveConfig) {
    this.token = config.token;
    this.model = `models/${config.model || "gemini-3.1-flash-live-preview"}`;
    this.voice = config.voice || "Puck";
    this.systemInstruction = config.systemInstruction || "";
    this.inputTranscription = config.inputAudioTranscription ?? true;
    this.outputTranscription = config.outputAudioTranscription ?? true;
    this.temperature = config.temperature ?? 1.0;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  connect() {
    if (this.ws) this.disconnect();

    const url =
      `wss://generativelanguage.googleapis.com/ws/` +
      `google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained`
      + `?access_token=${this.token}`;

    this.ws = new WebSocket(url);
    this.ws.binaryType = "blob";

    this.ws.onopen = () => {
      this.connected = true;
      this.sendSetupMessage();
      this.onOpen?.();
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.onClose?.();
    };

    this.ws.onerror = () => {
      this.connected = false;
      this.onError?.("WebSocket connection error");
    };

    this.ws.onmessage = this.handleMessage.bind(this);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  /** Send a text message (chat) */
  sendText(text: string) {
    this.send({ realtimeInput: { text } });
  }

  /** Send a base64 PCM audio chunk */
  sendAudio(base64PCM: string) {
    this.send({
      realtimeInput: {
        audio: { mimeType: "audio/pcm", data: base64PCM },
      },
    });
  }

  /** Send a tool/function response */
  sendToolResponse(functionResponses: Array<{ name: string; response: Record<string, unknown> }>) {
    this.send({
      toolResponse: { functionResponses },
    });
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private send(msg: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private sendSetupMessage() {
    const setup: Record<string, unknown> = {
      model: this.model,
      generationConfig: {
        responseModalities: ["AUDIO"],
        temperature: this.temperature,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: this.voice,
            },
          },
        },
      },
      systemInstruction: {
        parts: [{ text: this.systemInstruction }],
      },
      realtimeInputConfig: {
        automaticActivityDetection: {
          silenceDurationMs: 1500,
          prefixPaddingMs: 300,
        },
      },
    };

    if (this.inputTranscription) setup.inputAudioTranscription = {};
    if (this.outputTranscription) setup.outputAudioTranscription = {};

    this.send({ setup });
  }

  private async handleMessage(event: MessageEvent) {
    let textData: string;

    if (event.data instanceof Blob) {
      textData = await event.data.text();
    } else if (event.data instanceof ArrayBuffer) {
      textData = new TextDecoder().decode(event.data);
    } else {
      textData = event.data;
    }

    try {
      const msg = JSON.parse(textData);
      this.dispatch(msg);
    } catch {
      // Binary / non-JSON data — skip
    }
  }

  private dispatch(msg: Record<string, unknown>) {
    const sc = msg.serverContent as Record<string, unknown> | undefined;
    const parts = (sc?.modelTurn as Record<string, unknown> | undefined)
      ?.parts as Array<Record<string, unknown>> | undefined;

    if (msg.setupComplete) {
      this.onEvent?.({ type: "setup_complete" });
      return;
    }

    if (sc?.interrupted) {
      this.onEvent?.({ type: "interrupted" });
      return;
    }

    // Audio/text data
    if (parts?.length) {
      for (const part of parts) {
        if (part.inlineData as Record<string, unknown>) {
          this.onEvent?.({ type: "audio", data: (part.inlineData as Record<string, unknown>).data as string });
        }
        if (part.text) {
          this.onEvent?.({ type: "text", data: part.text as string });
        }
      }
    }

    // Transcriptions
    const inputTx = sc?.inputTranscription as Record<string, unknown> | undefined;
    const outputTx = sc?.outputTranscription as Record<string, unknown> | undefined;

    if (inputTx) {
      this.onEvent?.({ type: "input_transcription", data: { text: inputTx.text as string ?? "", finished: inputTx.finished as boolean ?? false } });
    }
    if (outputTx) {
      this.onEvent?.({ type: "output_transcription", data: { text: outputTx.text as string ?? "", finished: outputTx.finished as boolean ?? false } });
    }

    if (sc?.turnComplete) {
      this.onEvent?.({ type: "turn_complete" });
    }

    if (msg.toolCall) {
      // Future: handle tool calls
      console.log("[GeminiLive] Tool call:", msg.toolCall);
    }
  }
}
