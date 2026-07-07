"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Mic, Keyboard, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import { createClient } from "@/lib/supabase/client";

const AI_MENTOR_SYSTEM = `# AI Mentor System Prompt (NOOI Standard)

## 1. Identity & Voice
- Name: NOOI AI Mentor.
- Pronunciation: NOOI is pronounced 'NỐI'. Always speak it with a natural Vietnamese tone.
- Persona: A calm, profound, yet accessible 'Master in the World'. Wise but not arrogant.

## 2. Ethical Compass
- Empowerment: Never give direct life-changing instructions. Use Socratic questions.
- Safety: If crisis keywords are detected (self-harm, etc.), transition to human Mentor support immediately.
- Transparency: "I am an AI guide; your experience is the only truth."

## 3. Knowledge Retrieval
- Source of Truth: Base all advice on NOOI Master Blueprint (Chapters 1-12).
- Methodology: Identify user's state (THẤY/HIỂU/SỐNG/LAN TỎA) and provide guidance relative to their position on the Map.

## 4. Journal Analysis (Nhật ký Thân-Tâm-Hành)
When the user shares a journal entry with Thân (body), Tâm (mind), Hành (action):
- Analyze the connection between body, mind, and action
- **Compare with their journal history** to identify trends and changes over time
- Acknowledge specific details and progression (e.g., "Tuần trước bạn đau lưng, hôm nay đã đỡ hơn...")
- Identify which state they are in: THẤY (seeing), HIỂU (understanding), SỐNG (living), LAN TỎA (sharing)
- Give 1 specific micro-practice suggestion based on their entire journey
- ALWAYS refer explicitly to what they wrote and how it has changed

## 5. Communication Style
- Tone: Empathetic, Socratic, concise, "Bậc thầy nhập thế".
- When user provides journal data: **go straight to analysis, no greeting**
- Goal: Help users move from 'Currently stuck' -> 'Insight' -> 'Micro-practice' -> 'An trú'.`;

export default function AIMentorFloating() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const journalDataRef = useRef<string>("");

  // Listen for external "ai-mentor:ask" event
  useEffect(() => {
    const handler = (e: CustomEvent<{ text: string }>) => {
      const text = e.detail.text;
      setOpen(true);
      setMode("chat");
      setMessages([]);
      setInput(text);
    };
    window.addEventListener("ai-mentor:ask", handler as EventListener);
    return () => window.removeEventListener("ai-mentor:ask", handler as EventListener);
  }, []);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nooi-chat-history");
      if (saved) setMessages(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Auto-load journal history when opening
  useEffect(() => {
    if (!open) return;
    const hasHistory = messages.length > 0;
    if (hasHistory) return;
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
        const journalSummary = data.map((e: { content: string; created_at: string }) => {
          try {
            const d = JSON.parse(e.content) as { than?: string; tam?: string; hanh?: string };
            const date = new Date(e.created_at).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" });
            return `[${date}] Thân: ${d.than || "—"} | Tâm: ${d.tam || "—"} | Hành: ${d.hanh || "—"}`;
          } catch { return ""; }
        }).filter(Boolean).join("\n");
        if (journalSummary) journalDataRef.current = journalSummary;
      } catch { /* ignore */ }
    })();
  }, [open]);
 
  // Save chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("nooi-chat-history", JSON.stringify(messages));
    } catch { /* ignore */ }
  }, [messages]);

  function clearHistory() {
    if (!confirm("Xóa toàn bộ lịch sử trò chuyện?")) return;
    setMessages([]);
    localStorage.removeItem("nooi-chat-history");
  }

  // Trigger send when input is set externally
  const inputCommitted = useRef(false);
  useEffect(() => {
    if (input && !inputCommitted.current) {
      inputCommitted.current = true;
      // Small delay to let state settle
      const timer = setTimeout(() => {
        sendMessage();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && mode === "chat") inputRef.current?.focus();
  }, [open, mode]);

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
      setMessages((prev) => [...prev, { role: "ai", text: "Lỗi kết nối. Vui lòng thử lại." }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
        aria-label="AI Mentor"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div className={`fixed z-50 rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 ${
          fullscreen 
            ? "inset-4 w-auto h-auto max-w-none max-h-none" 
            : "bottom-24 right-5 w-[380px] max-w-[calc(100vw-40px)] h-[560px] max-h-[calc(100vh-180px)]"
        }`}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">NOOI AI Mentor</p>
              <p className="text-[10px] text-muted-foreground">
                {mode === "voice" ? "Trò chuyện giọng nói" : "Nhắn tin trực tiếp"}
              </p>
            </div>
            {/* Mode toggle */}
            <button
              onClick={() => setMode(mode === "chat" ? "voice" : "chat")}
              className="w-8 h-8 rounded-full hover:bg-muted/50 flex items-center justify-center transition-colors"
              title={mode === "chat" ? "Chuyển sang giọng nói" : "Chuyển sang nhắn tin"}
            >
              {mode === "chat" ? (
                <Mic className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Keyboard className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="w-7 h-7 rounded-full hover:bg-muted/50 flex items-center justify-center transition-colors"
              title={fullscreen ? "Thu nhỏ" : "Toàn màn hình"}
            >
              {fullscreen ? <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" /> : <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            <button
              onClick={clearHistory}
              className="w-7 h-7 rounded-full hover:bg-red-500/10 flex items-center justify-center transition-colors"
              title="Xóa lịch sử"
            >
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-400" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full hover:bg-muted/50 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          {mode === "voice" ? (
            <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
              <VoiceAssistant
                systemInstruction={AI_MENTOR_SYSTEM}
                title="NOOI AI Mentor"
              />
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-center px-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Chào bạn, tôi là AI Mentor NOOI.</p>
                      <p className="text-xs text-muted-foreground/70">
                        Hãy chia sẻ những điều bạn đang trăn trở. Tôi sẽ lắng nghe và đồng hành cùng bạn.
                      </p>
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.role === "ai" && (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                        <Bot className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/30 border border-border/40 text-foreground"
                      }`}
                    >
                      {m.text}
                    </div>
                    {m.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-0.5 shrink-0">
                        <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border bg-muted/10 shrink-0">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 rounded-lg bg-muted/30 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
