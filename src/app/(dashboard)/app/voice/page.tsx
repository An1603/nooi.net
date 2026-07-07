"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Mic, Keyboard, Sparkles } from "lucide-react";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import { createClient } from "@/lib/supabase/client";

const AI_MENTOR_SYSTEM = `# AI Mentor System Prompt (NOOI Standard)
## 1. Identity & Voice
- Name: NOOI AI Mentor. Pronunciation: NOOI is 'NỐI'. Vietnamese tone.
- Persona: Calm, profound, 'Master in the World'. Wise, not arrogant.
## 2. Ethical Compass
- Empowerment: Never give direct life-changing instructions. Use Socratic questions.
- Safety: Crisis keywords → human Mentor. Transparency: "I am an AI guide."
## 3. Journal Analysis
When user shares Thân-Tâm-Hành: analyze connections, compare with history, identify THẤY/HIỂU/SỐNG/LAN TỎA, give micro-practice.
## 4. Style
Tone: Empathetic, Socratic, "Bậc thầy nhập thế". Go straight to analysis, no greeting.`;

export default function AIMentorPage() {
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const journalDataRef = useRef<string>("");

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Load journal history on mount
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("documents")
          .select("content, created_at")
          .eq("user_id", user.id)
          .eq("file_type", "journal")
          .order("created_at", { ascending: false })
          .limit(5);
        if (!data || data.length === 0) return;
        const summary = data.map((e: { content: string; created_at: string }) => {
          try {
            const d = JSON.parse(e.content);
            const date = new Date(e.created_at).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" });
            return `[${date}] Thân: ${d.than || "—"} | Tâm: ${d.tam || "—"} | Hành: ${d.hanh || "—"}`;
          } catch { return ""; }
        }).filter(Boolean).join("\n");
        if (summary) {
          journalDataRef.current = summary;
          setMessages([{ role: "ai", text: `👋 Mình đã đọc nhật ký gần đây của bạn. Bạn muốn phân tích gì?` }]);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  async function sendMessage() {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");

    // Tự động gửi kèm nhật ký nếu có
    let finalMsg = msg;
    if (journalDataRef.current) {
      finalMsg = `[NHẬT KÝ GẦN ĐÂY CỦA TÔI]\n${journalDataRef.current}\n\n${msg}`;
    }

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: finalMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply || "Xin lỗi, hãy thử lại." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Lỗi kết nối." }]);
    }
    setLoading(false);
  }

  // Các chủ đề gợi ý
  const quickTopics = [
    "Phân tích nhật ký hôm nay của tôi",
    "Một bài thiền ngắn cho người mới",
    "Làm sao để bớt lo âu?",
    "Gợi ý thực hành biết ơn",
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">NOOI AI Mentor</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Người đồng hành trên hành trình chuyển hóa của bạn
          </p>
        </div>
        {/* Mode toggle */}
        <div className="flex bg-muted/30 rounded-lg p-0.5 border border-border">
          <button onClick={() => setMode("chat")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Keyboard className="w-4 h-4 inline mr-1" /> Chat
          </button>
          <button onClick={() => setMode("voice")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "voice" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Mic className="w-4 h-4 inline mr-1" /> Voice
          </button>
        </div>
      </div>

      {/* Content */}
      {mode === "voice" ? (
        <div className="rounded-xl border border-border bg-card p-8 flex items-center justify-center min-h-[400px]">
          <VoiceAssistant
            key={journalDataRef.current ? "voice-with-journal" : "voice-without-journal"}
            systemInstruction={AI_MENTOR_SYSTEM + (journalDataRef.current ? `\n\n## JOURNAL HISTORY\nBelow is the user's recent journal history. Use this to personalize your guidance:\n${journalDataRef.current}` : "")}
            title="NOOI AI Mentor"
          />
        </div>
      ) : (
        <>
          {/* Chat messages */}
          <div className="rounded-xl border border-border bg-card min-h-[400px] max-h-[500px] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-64 text-center px-8">
                <div>
                  <Bot className="w-10 h-10 text-primary/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">NOOI AI Mentor sẵn sàng đồng hành</p>
                  <p className="text-xs text-muted-foreground/60">Hãy đặt câu hỏi hoặc chọn một chủ đề bên dưới.</p>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/30 border border-border/40 text-foreground"
                }`}>{m.text}</div>
                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="4" /><path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick topics */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {quickTopics.map((topic, i) => (
                <button key={i} onClick={() => { setInput(topic); inputRef.current?.focus(); }}
                  className="text-xs border border-border bg-card px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />{topic}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nhập tin nhắn..." disabled={loading}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              className="rounded-xl bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
