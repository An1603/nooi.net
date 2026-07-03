/**
 * Audio Capture & Playback Utilities for Gemini Live API
 *
 * Gemini Live API requires:
 *   - Input:  raw PCM 16-bit, 16kHz, mono, little-endian (base64)
 *   - Output: raw PCM 16-bit, 24kHz, mono, little-endian (base64)
 *
 * Capture uses AudioWorklet (desktop + mobile) with fallback to ScriptProcessor.
 * Playback uses Web Audio API AudioBufferSourceNode for low-latency streaming.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const AUDIO_CONSTANTS = {
  INPUT_SAMPLE_RATE: 16000,
  OUTPUT_SAMPLE_RATE: 24000,
  BITS_PER_SAMPLE: 16,
  CHANNELS: 1,
  /** How often (ms) to send PCM chunks to Gemini */
  CHUNK_INTERVAL_MS: 100,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AudioCaptureCallbacks {
  /** Called with base64 PCM chunk ready to send */
  onChunk: (base64PCM: string) => void;
  /** Called with audio level (0-1) for visualization */
  onLevel?: (level: number) => void;
  /** Called when capture fails */
  onError?: (error: string) => void;
}

export type AudioCaptureState = "idle" | "requesting" | "active" | "error";

// ─── Audio Capture ───────────────────────────────────────────────────────────

export class AudioCapture {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: AudioWorkletNode | ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private state: AudioCaptureState = "idle";
  private callbacks: AudioCaptureCallbacks;
  private chunkInterval: ReturnType<typeof setInterval> | null = null;
  private bufferQueue: Float32Array[] = [];

  constructor(callbacks: AudioCaptureCallbacks) {
    this.callbacks = callbacks;
  }

  get captureState(): AudioCaptureState {
    return this.state;
  }

  async start(): Promise<void> {
    if (this.state === "active") return;

    this.state = "requesting";

    try {
      // Request mic access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: AUDIO_CONSTANTS.INPUT_SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create AudioContext at 16kHz
      this.audioContext = new AudioContext({
        sampleRate: AUDIO_CONSTANTS.INPUT_SAMPLE_RATE,
      });

      this.source = this.audioContext.createMediaStreamSource(this.stream);

      // Try AudioWorklet first (modern browsers), fallback to ScriptProcessor
      try {
        await this.setupAudioWorklet();
      } catch {
        this.setupScriptProcessor();
      }

      // Start interval to process buffered chunks
      this.chunkInterval = setInterval(() => {
        this.flushBuffer();
      }, AUDIO_CONSTANTS.CHUNK_INTERVAL_MS);

      this.state = "active";
    } catch (err) {
      this.state = "error";
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone permissions."
          : `Microphone error: ${(err as Error).message}`;
      this.callbacks.onError?.(msg);
      throw new Error(msg);
    }
  }

  stop() {
    this.state = "idle";

    if (this.chunkInterval) {
      clearInterval(this.chunkInterval);
      this.chunkInterval = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }

    this.bufferQueue = [];
  }

  private async setupAudioWorklet() {
    if (!this.audioContext) return;

    // Create a simple worklet processor via blob URL
    const workletCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        constructor() { super(); }
        process(inputs) {
          const input = inputs[0];
          if (input && input[0]) {
            const channel = input[0];
            this.port.postMessage(channel.slice(0), [channel.buffer]);
          }
          return true;
        }
      }
      registerProcessor('pcm-processor', PCMProcessor);
    `;

    const blob = new Blob([workletCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    await this.audioContext.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);

    this.processor = new AudioWorkletNode(this.audioContext!, "pcm-processor");
    this.processor.port.onmessage = (event) => {
      const samples: Float32Array = event.data;
      this.bufferQueue.push(samples);
    };

    this.source!.connect(this.processor);
    this.processor.connect(this.audioContext!.destination);
  }

  private setupScriptProcessor() {
    if (!this.audioContext) return;

    const bufferSize = 4096;
    this.processor = this.audioContext.createScriptProcessor(
      bufferSize,
      1,
      1
    );

    this.processor.onaudioprocess = (event) => {
      const samples = new Float32Array(event.inputBuffer.getChannelData(0));
      this.bufferQueue.push(samples);
    };

    this.source!.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  private flushBuffer() {
    if (this.bufferQueue.length === 0) return;

    // Concatenate all buffered samples
    let totalLength = 0;
    for (const buf of this.bufferQueue) totalLength += buf.length;

    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const buf of this.bufferQueue) {
      combined.set(buf, offset);
      offset += buf.length;
    }
    this.bufferQueue = [];

    // Convert to 16-bit PCM and base64
    const base64 = float32ToPCMBase64(combined);

    // Report audio level for visualization
    const level = computeAudioLevel(combined);
    this.callbacks.onLevel?.(level);

    this.callbacks.onChunk(base64);
  }
}

// ─── Audio Playback ──────────────────────────────────────────────────────────

export class AudioPlayback {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private pendingBuffer: Float32Array[] = [];
  private isPlaying = false;
  private scheduledEnd = 0;
  private sourceNode: AudioBufferSourceNode | null = null;

  async playBase64PCM(base64: string): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({
        sampleRate: AUDIO_CONSTANTS.OUTPUT_SAMPLE_RATE,
      });
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.8;
      this.gainNode.connect(this.audioContext.destination);
    }

    // Resume context if suspended (mobile auto-play policy)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // Decode base64 → PCM samples
    const pcmData = base64ToFloat32(base64);
    this.pendingBuffer.push(pcmData);

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.scheduleNext();
    }
  }

  private scheduleNext() {
    if (!this.audioContext || !this.gainNode) return;

    while (this.pendingBuffer.length > 0) {
      const samples = this.pendingBuffer.shift()!;
      const buffer = this.audioContext.createBuffer(
        AUDIO_CONSTANTS.CHANNELS,
        samples.length,
        AUDIO_CONSTANTS.OUTPUT_SAMPLE_RATE
      );
      buffer.getChannelData(0).set(samples);

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gainNode!);
      this.sourceNode = source;

      const now = this.audioContext.currentTime;
      const startTime = Math.max(this.scheduledEnd, now);
      source.start(startTime);
      this.scheduledEnd = startTime + buffer.duration;
    }

    this.isPlaying = false;
  }

  stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch { /* already stopped */ }
      this.sourceNode = null;
    }
    this.pendingBuffer = [];
    this.isPlaying = false;
    this.scheduledEnd = 0;
  }

  close() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
  }
}

// ─── PCM Conversion Utilities ────────────────────────────────────────────────

/**
 * Convert Float32Array (values -1 to 1) to base64-encoded 16-bit PCM
 */
export function float32ToPCMBase64(samples: Float32Array): string {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < samples.length; i++) {
    // Clamp to [-1, 1]
    const s = Math.max(-1, Math.min(1, samples[i]));
    // Convert to 16-bit signed integer
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); // little-endian
  }

  // Convert ArrayBuffer to base64
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decode base64 16-bit PCM string to Float32Array
 */
export function base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const sampleCount = bytes.length / 2;
  const result = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const int16 = (bytes[i * 2 + 1] << 8) | bytes[i * 2];
    result[i] = int16 < 0x8000 ? int16 / 0x8000 : (int16 - 0x10000) / 0x8000;
  }
  return result;
}

/**
 * Compute RMS audio level (0-1) from Float32Array
 */
export function computeAudioLevel(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * 5);
}

/**
 * Check if browser supports required audio APIs
 */
export function checkAudioSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!navigator.mediaDevices?.getUserMedia) {
    missing.push("getUserMedia");
  }
  // webkitAudioContext for older Safari
  const hasAudioContext = typeof AudioContext !== "undefined"
    || typeof ((window as unknown as Record<string, unknown>).webkitAudioContext) !== "undefined";
  if (!hasAudioContext) {
    missing.push("AudioContext");
  }
  if (typeof WebSocket === "undefined") {
    missing.push("WebSocket");
  }
  if (typeof atob === "undefined" || typeof btoa === "undefined") {
    missing.push("Base64");
  }

  return {
    supported: missing.length === 0,
    missing,
  };
}
