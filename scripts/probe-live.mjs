// Thí nghiệm protocol Gemini Live: model có NÓI tiếp khi toolCall chưa được trả lời?
// và gửi text bằng realtimeInput.text vs clientContent khác nhau thế nào?
// Chạy: node scripts/probe-live.mjs
import { GoogleGenAI } from "@google/genai";
import WebSocket from "ws";
import { readFileSync } from "node:fs";

// nạp .env.local
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const MODEL = process.env.PROBE_MODEL || "gemini-3.1-flash-live-preview";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const t = await ai.authTokens.create({
  config: {
    uses: 1,
    expireTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    newSessionExpireTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  },
});

const TOOLS = [
  {
    name: "show_exercise",
    description:
      "Hiện một bài tập trắc nghiệm lên màn hình của bé. Sau khi gọi, hãy ĐỌC TO câu hỏi và các lựa chọn cho bé nghe.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" },
        options: { type: "array", items: { type: "string" } },
        answer_index: { type: "integer" },
      },
      required: ["question", "options"],
    },
  },
];

const INSTRUCTION =
  "Bạn là thầy AI dạy bé 8 tuổi. Khi bé muốn học, hãy gọi show_exercise để hiện bài tập, " +
  "rồi đọc to câu hỏi và các lựa chọn. Nói tiếng Việt, ngắn gọn.";

const url =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained" +
  `?access_token=${t.name}`;

const ws = new WebSocket(url);
const log = [];
let phase = "setup";
let audioChunks = 0;
let toolCallAt = 0;
let answeredTool = false;
let sawTurnCompleteAfterTool = false;

const stamp = () => ((Date.now() - toolCallAt) / 1000).toFixed(1) + "s";

ws.on("open", () => {
  console.log("[ws] open, model =", MODEL);
  ws.send(
    JSON.stringify({
      setup: {
        model: `models/${MODEL}`,
        generationConfig: {
          responseModalities: ["AUDIO"],
          temperature: 1.0,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } },
        },
        systemInstruction: { parts: [{ text: INSTRUCTION }] },
        tools: [{ functionDeclarations: TOOLS }],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
    }),
  );
});

ws.on("message", async (raw) => {
  const msg = JSON.parse(raw.toString());
  const sc = msg.serverContent || {};

  if (msg.setupComplete) {
    console.log("[setup] complete");
    phase = "ask";
    // Gửi yêu cầu bằng clientContent (cách chuẩn cho lượt text)
    ws.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: "user", parts: [{ text: "Thầy ơi con muốn học phép cộng." }] }],
          turnComplete: true,
        },
      }),
    );
    return;
  }

  if (msg.toolCall) {
    toolCallAt = Date.now();
    sawTurnCompleteAfterTool = false;
    console.log("[TOOL]", JSON.stringify(msg.toolCall.functionCalls));
    if (!answeredTool) {
      answeredTool = true;
      // NHÁNH A: KHÔNG trả lời tool ngay — đo xem model có nói tiếp không.
      console.log("[A] cố tình KHÔNG gửi toolResponse, chờ 8s xem model có nói tiếp...");
      setTimeout(() => {
        console.log(
          `[A] sau 8s: audioChunks=${audioChunks}, turnCompleteSauTool=${sawTurnCompleteAfterTool}`,
        );
        console.log("[A] => kết luận:", audioChunks > 0 ? "model VẪN nói" : "model IM (chờ toolResponse)");
        // NHÁNH B: gửi toolResponse rồi đo tiếp
        audioChunks = 0;
        ws.send(
          JSON.stringify({
            toolResponse: {
              functionResponses: [{ name: "show_exercise", response: { shown: true } }],
            },
          }),
        );
        console.log("[B] đã gửi toolResponse {shown:true}");
        setTimeout(() => {
          console.log(`[B] sau 5s: audioChunks=${audioChunks}`);
          console.log("[B] => kết luận:", audioChunks > 0 ? "model nói tiếp SAU toolResponse" : "model vẫn im");
        }, 5000);
      }, 8000);
    }
    return;
  }

  const parts = sc.modelTurn?.parts || [];
  for (const p of parts) {
    if (p.inlineData) audioChunks++;
    if (p.text) console.log("[TEXT]", JSON.stringify(p.text));
  }
  if (sc.outputTranscription?.text) console.log("[OUT-TX]", JSON.stringify(sc.outputTranscription.text), "finished:", sc.outputTranscription.finished);
  if (sc.inputTranscription?.text) console.log("[IN-TX]", JSON.stringify(sc.inputTranscription.text));
  if (sc.turnComplete) {
    console.log(`[turn_complete] ${toolCallAt ? stamp() : ""} audioChunks=${audioChunks}`);
    if (toolCallAt) sawTurnCompleteAfterTool = true;
    log.push("turn_complete");
  }
});

ws.on("error", (e) => console.error("[ws error]", e.message));
ws.on("close", (c) => {
  console.log("[ws] closed", c);
  process.exit(0);
});

setTimeout(() => {
  console.log("=== HẾT THỜI GIAN ===");
  ws.close();
  process.exit(0);
}, 60000);
