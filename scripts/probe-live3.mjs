// Probe 3: toolResponse THIẾU id vs CÓ id → model có nói tiếp không?
import { GoogleGenAI } from "@google/genai";
import WebSocket from "ws";
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const WITH_ID = process.env.WITH_ID === "1";
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
let sawTool = false;

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
          parts: [{ text: "Bạn là thầy AI dạy bé 8 tuổi, nói tiếng Việt ngắn gọn. Khi bé muốn học, gọi show_exercise." }],
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

  if (msg.toolCall && !sawTool) {
    sawTool = true;
    const fc = msg.toolCall.functionCalls[0];
    console.log("[TOOL]", fc.name, "| id:", fc.id, "| args:", JSON.stringify(fc.args));
    audio = 0;
    spoken = "";
    const responses = WITH_ID
      ? [{ id: fc.id, name: fc.name, response: { shown: true } }]
      : [{ name: fc.name, response: { shown: true } }];
    console.log("gửi toolResponse, có id?", WITH_ID);
    ws.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
  }
});

await wait(10000);
console.log(`\nKẾT QUẢ (WITH_ID=${WITH_ID ? 1 : 0}): audioChunks=${audio}`);
console.log("lời nói:", JSON.stringify(spoken.trim().slice(0, 220)));
console.log("=>", audio > 0 ? "MODEL NÓI TIẾP SAU TOOLRESPONSE" : "MODEL IM");
ws.close();
process.exit(0);
