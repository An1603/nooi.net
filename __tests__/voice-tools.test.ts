import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GeminiLiveClient, type GeminiLiveEvent } from "@/lib/voice/gemini-live";

/**
 * Transport cho function calling (eKid v3.1):
 *  - khai báo `tools` phải được gắn vào setup message;
 *  - `msg.toolCall` phải phát sự kiện `tool_call` (map đúng functionCalls);
 *  - `sendToolResponse` phải gửi đúng khung `toolResponse`.
 * WebSocket được giả lập để kiểm tra các khung JSON gửi đi.
 */

interface SentFrame {
  setup?: { tools?: unknown };
  toolResponse?: { functionResponses: unknown };
  [k: string]: unknown;
}

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.OPEN;
  binaryType = "";
  sent: string[] = [];
  url: string;

  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
  }

  frames(): SentFrame[] {
    return this.sent.map((s) => JSON.parse(s) as SentFrame);
  }
}

const RealWebSocket = globalThis.WebSocket;

beforeEach(() => {
  MockWebSocket.instances = [];
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket;
});

afterEach(() => {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = RealWebSocket;
  vi.restoreAllMocks();
});

function openClient(config: ConstructorParameters<typeof GeminiLiveClient>[0]) {
  const client = new GeminiLiveClient(config);
  const events: GeminiLiveEvent[] = [];
  client.onEvent = (e) => events.push(e);
  client.connect();
  const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1];
  ws.onopen?.();
  return { client, ws, events };
}

describe("GeminiLiveClient — khai báo tools trong setup", () => {
  it("gắn setup.tools khi có tools", () => {
    const decls = [{ name: "show_exercise", description: "hiện bài tập" }];
    const { ws } = openClient({ token: "t", tools: decls });
    const setup = ws.frames()[0].setup as { tools?: unknown };
    expect(setup.tools).toEqual([{ functionDeclarations: decls }]);
  });

  it("KHÔNG gắn setup.tools khi không truyền tools", () => {
    const { ws } = openClient({ token: "t" });
    const setup = ws.frames()[0].setup as { tools?: unknown };
    expect(setup.tools).toBeUndefined();
  });

  it("KHÔNG gắn setup.tools khi mảng rỗng", () => {
    const { ws } = openClient({ token: "t", tools: [] });
    const setup = ws.frames()[0].setup as { tools?: unknown };
    expect(setup.tools).toBeUndefined();
  });
});

describe("GeminiLiveClient — phát sự kiện tool_call", () => {
  it("map đúng msg.toolCall.functionCalls → event tool_call", async () => {
    const { ws, events } = openClient({ token: "t" });
    ws.onmessage?.({
      data: JSON.stringify({
        toolCall: {
          functionCalls: [
            { id: "call-1", name: "show_exercise", args: { question: "2+2?", options: ["3", "4"] } },
            { id: "call-2", name: "show_media", args: { url: "https://x/y.png", kind: "image" } },
          ],
        },
      }),
    });
    await Promise.resolve();

    const tc = events.find((e) => e.type === "tool_call");
    expect(tc).toBeDefined();
    if (tc?.type !== "tool_call") throw new Error("unreachable");
    expect(tc.data.functionCalls).toEqual([
      { id: "call-1", name: "show_exercise", args: { question: "2+2?", options: ["3", "4"] } },
      { id: "call-2", name: "show_media", args: { url: "https://x/y.png", kind: "image" } },
    ]);
  });

  it("bỏ qua toolCall rỗng (không phát sự kiện)", async () => {
    const { ws, events } = openClient({ token: "t" });
    ws.onmessage?.({ data: JSON.stringify({ toolCall: { functionCalls: [] } }) });
    await Promise.resolve();
    expect(events.find((e) => e.type === "tool_call")).toBeUndefined();
  });
});

describe("GeminiLiveClient — sendToolResponse", () => {
  it("gửi đúng khung toolResponse.functionResponses", () => {
    const { client, ws } = openClient({ token: "t" });
    client.sendToolResponse([{ name: "show_exercise", response: { chosen_index: 1, correct: true } }]);
    const last = ws.frames().at(-1);
    expect(last?.toolResponse).toEqual({
      functionResponses: [{ name: "show_exercise", response: { chosen_index: 1, correct: true } }],
    });
  });
});
