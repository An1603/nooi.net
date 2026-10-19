// Probe 4: sau toolCall, cách nào khiến model NÓI ĐÚNG nội dung bài vừa hiện?
// MODE=A: toolResponse + realtimeInput.text   MODE=B: chỉ realtimeInput.text
import { GoogleGenAI } from "@google/genai";
import WebSocket from "ws";
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const MODE = process.env.MODE || "A";
const MODEL = process.env.PROBE_MODEL || "gemini-3.1-flash-live-preview";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const t = await ai.authTokens.create({
  config: { uses: 1, expireTime: new Date(Date.now() + 600000).toISOString(), newSessionExpireTime: new Date(Date.now() + 300000).toISOString() },
});

const TOOLS = [
  {
    name: "show_exercise",
    description: "Hiện bài tập trắc nghiệm lên màn hình của bé.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" }, options: { type: "array", items: { type: "string" } } },
      required: ["question", "options"],
    },
  },
];

const ws = new WebSocket(
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained" +
    `?access_token=${t.name}`,
);
ws.binaryType = "arraybuffer";

let audio = 0;
let spoken = "";
let asked = "";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

ws.on("open", () =>
  ws.send(
    JSON.stringify({
      setup: {
        model: `models/${MODEL}`,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } },
        },
        systemInstruction: {
          parts: [
            {
              text:
                "Bạn là thầy AI dạy bé 8 tuổi, tiếng Việt, ngắn gọn. Khi bé muốn học, gọi show_exercise. " +
                "SAU KHI hiện bài, bạn phải đọc to đúng câu hỏi và các lựa chọn vừa hiện.",
            },
          ],
        },
        tools: [{ functionDeclarations: TOOLS }],
        outputAudioTranscription: {},
      },
    }),
  ),
);

ws.on("message", (raw) => {
  const msg = JSON.parse(Buffer.from(raw).toString("utf8"));
  const sc = msg.serverContent || {};
  if (msg.setupComplete) {
    ws.send(JSON.stringify({ realtimeInput: { text: "Thầy ơi con muốn học phép cộng." } }));
    return;
  }
  for (const p of sc.modelTurn?.parts || []) if (p.inlineData) audio++;
  if (sc.outputTranscription?.text) spoken += sc.outputTranscription.text;

  if (msg.toolCall) {
    const fc = msg.toolCall.functionCalls[0];
    asked = fc.args?.question || "";
    console.log("[TOOL]", asked, "| options:", JSON.stringify(fc.args?.options));
    audio = 0;
    spoken = "";
    if (MODE === "A") {
      ws.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: fc.id, name: fc.name, response: { shown: true } }] } }));
    }
    ws.send(
      JSON.stringify({
        realtimeInput: {
          text:
            `[HỆ THỐNG] Thẻ bài tập ĐÃ hiện trên màn hình, câu hỏi: "${asked}", ` +
            `lựa chọn: ${JSON.stringify(fc.args?.options)}. Hãy đọc to đúng câu hỏi và các lựa chọn này cho bé nghe ngay.`,
        },
      }),
    );
  }
});

await wait(12000);
console.log(`\nMODE=${MODE} | audioChunks=${audio}`);
console.log("lời nói:", JSON.stringify(spoken.trim().slice(0, 260)));
console.log("khớp câu hỏi đã hiện?", asked && spoken.includes(asked.replace(/\s+/g, " ").slice(0, 12)) ? "CÓ (theo chuỗi)" : "không rõ — xem nội dung trên");
ws.close();
process.exit(0);
