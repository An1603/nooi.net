"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Link2, Unlink, CheckCircle, Loader2, MessageCircle, Copy } from "lucide-react";

interface Props {
  userId: string;
  initialChatId: string | null;
}

const BOT_USERNAME = "NOOI_Agent_Bot";

export function TelegramConnect({ userId, initialChatId }: Props) {
  const supabase = createClient();
  const [chatId, setChatId] = useState(initialChatId || "");
  const [connected, setConnected] = useState(!!initialChatId);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "waiting" | "done">(initialChatId ? "done" : "input");

  const handleConnect = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (!chatId.trim()) {
      setError("Vui lòng nhập Chat ID.");
      return;
    }

    if (!/^-?\d+$/.test(chatId.trim())) {
      setError("Chat ID phải là số (ví dụ: 123456789).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/telegram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chatId.trim() }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi kết nối");

      setConnected(true);
      setStep("done");
      setSuccess("✅ Đã kết nối Telegram thành công!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const handleDisconnect = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/telegram/connect", { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi ngắt kết nối");

      setConnected(false);
      setChatId("");
      setStep("input");
      setSuccess("✅ Đã ngắt kết nối Telegram.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: "🎉 <b>Kết nối thành công!</b>\n\nĐây là tin nhắn thử nghiệm từ NOOI. Bạn sẽ nhận được nhắc nhở qua Telegram khi có buổi học sắp diễn ra.",
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi gửi tin nhắn");

      setSuccess("✅ Đã gửi tin nhắn thử nghiệm! Kiểm tra Telegram của bạn.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setTesting(false);
    }
  }, [userId]);

  const copyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card mb-6">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-400" />
          <h2 className="text-base font-semibold">Telegram Notification</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Nhận nhắc nhở buổi học và thông báo qua Telegram.
        </p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Trạng thái kết nối */}
        {connected ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Đã kết nối · Chat ID: <code className="bg-muted/30 px-1.5 py-0.5 rounded text-xs">{chatId || initialChatId}</code></span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Chưa kết nối Telegram
          </div>
        )}

        {/* Hướng dẫn kết nối */}
        {!connected && (
          <div className="space-y-3">
            <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 space-y-2">
              <p className="text-xs font-medium text-blue-400">📱 Hướng dẫn kết nối:</p>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Mở Telegram, tìm <strong>@{BOT_USERNAME}</strong></li>
                <li>Nhấn <strong>Start</strong> hoặc gửi <code className="bg-muted/30 px-1 rounded">/start</code></li>
                <li>Bot sẽ trả về <strong>Chat ID</strong> của bạn</li>
                <li>Copy Chat ID và dán vào ô bên dưới</li>
              </ol>
              <a
                href={`https://t.me/${BOT_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline mt-1"
              >
                <MessageCircle className="w-3 h-3" />
                Mở @{BOT_USERNAME} trên Telegram
              </a>
            </div>

            {/* Input Chat ID */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatId}
                onChange={(e) => { setChatId(e.target.value); setError(null); setSuccess(null); }}
                placeholder="Nhập Chat ID (ví dụ: 123456789)"
                className="flex-1 px-3 py-2.5 rounded-lg bg-muted/20 border border-border text-sm"
              />
              <button
                onClick={handleConnect}
                disabled={loading || !chatId.trim()}
                className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                Kết nối
              </button>
            </div>
          </div>
        )}

        {/* Actions khi đã kết nối */}
        {connected && (
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-3 py-2 rounded-lg bg-muted/30 border border-border text-xs hover:bg-muted/50 transition-all flex items-center gap-1.5"
            >
              {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Gửi thử
            </button>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive hover:bg-destructive/20 transition-all flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
              Ngắt kết nối
            </button>
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-500/50 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-400">
            {success}
          </div>
        )}

        {/* Info */}
        <p className="text-[12px] text-muted-foreground">
          💡 Sau khi kết nối, bạn sẽ nhận nhắc nhở trước 15 phút khi buổi học Live sắp bắt đầu.
        </p>
      </div>
    </div>
  );
}
