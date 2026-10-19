// Probe 2: sau toolCall, tổ hợp nào buộc model NÓI TIẾP?
//  - (1) chỉ toolResponse
//  - (2) toolResponse + clientContent (đọc to câu hỏi)
//  - (3) gửi kết quả bé bấm bằng clientContent
//  - (4) gửi kết quả bé bấm bằng realtimeInput.text
import { GoogleGenAI } from "@google/genai";
import WebSocket from "ws";
import { readFileSync } from "node:fs";

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
    description: "Hiện bài tập trắc nghiệm lên màn hình của bé.",
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
  "Bạn là thầy AI dạy bé 8 tuổi. Khi bé muốn học, gọi show_exercise để hiện bài. " +
  "Sau khi hiện, LUÔN đọc to câu hỏi và các lựa chọn. Nói tiếng Việt, ngắn gọn.";

const ws = new WebSocket(
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained" +
    `?access_token=${t.name}`,
);
ws.binaryType = "arraybuffer";

let audio = 0;
let outText = "";
let step = 0;
const say = (s) => console.log(`\n=== ${s} ===`);

function resetMeter() {
  audio = 0;
  outText = "";
}
function report(label) {
  console.log(`[${label}] audioChunks=${audio} | lời nói: ${JSON.stringify(outText.trim().slice(0, 160))}`);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function clientTurn(text) {
  ws.send(
    JSON.stringify({
      clientContent: { turns: [{ role: "user", parts: [{ text }] }], turnComplete: true },
    }),
  );
}
function realtimeText(text) {
  ws.send(JSON.stringify({ realtimeInput: { text } }));
}

const done = new Promise((resolve) => {
  ws.on("open", () =>
    ws.send(
      JSON.stringify({
        setup: {
          model: `models/${MODEL}`,
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } },
          },
          systemInstruction: { parts: [{ text: INSTRUCTION }] },
          tools: [{ functionDeclarations: TOOLS }],
          outputAudioTranscription: {},
        },
      }),
    ),
  );

  ws.on("message", async (raw) => {
    const msg = JSON.parse(Buffer.from(raw).toString("utf8"));
    const sc = msg.serverContent || {};

    if (msg.setupComplete) {
      say("BƯỚC 1 — yêu cầu ra bài");
      resetMeter();
      clientTurn("Thầy ơi con muốn học phép cộng.");
      return;
    }

    for (const p of sc.modelTurn?.parts || []) if (p.inlineData) audio++;
    if (sc.outputTranscription?.text) outText += sc.outputTranscription.text;

    if (msg.toolCall && step === 0) {
      step = 1;
      report("sau lời dẫn, trước tool");
      say("TOOL: " + JSON.stringify(msg.toolCall.functionCalls[0].args.question));
      // (2) toolResponse + clientContent
      ws.send(
        JSON.stringify({ toolResponse: { functionResponses: [{ name: "show_exercise", response: { shown: true } }] } }),
      );
      resetMeter();
      clientTurn("[HỆ THỐNG] Thẻ bài tập ĐÃ hiện trên màn hình. Hãy đọc to câu hỏi và các lựa chọn cho bé nghe ngay.");
      setTimeout(() => {
        report("BƯỚC 2 — sau toolResponse + clientContent");
        say("BƯỚC 3 — bé BẤM đáp án, gửi bằng clientContent");
        resetMeter();
        clientTurn("[KẾT QUẢ BÀI TẬP] Bé vừa bấm trên màn hình, chọn đáp án B — ĐÚNG. Hãy nói ngay 1-2 câu khen bé.");
        setTimeout(() => {
          report("BƯỚC 3 — clientContent");
          say("BƯỚC 4 — bé NÓI đáp án, gửi bằng realtimeInput.text");
          resetMeter();
          realtimeText("[KẾT QUẢ BÀI TẬP] Bé vừa nói chọn đáp án A — SAI. Hãy động viên và gợi mở cho bé.");
          setTimeout(() => {
            report("BƯỚC 4 — realtimeInput.text");
            done();
          }, 6000);
        }, 6000);
      }, 6000);
    }
  });
});

await Promise.race([done, wait(70000)]);
ws.close();
process.exit(0);
