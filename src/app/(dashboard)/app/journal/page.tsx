"use client";

import { useState, useEffect } from "react";
import { BookHeart, Clock, Trash2, Pencil, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function JournalPage() {
  const [than, setThan] = useState("");
  const [tam, setTam] = useState("");
  const [hanh, setHanh] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoadingEntries(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingEntries(false); return; }
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, content, created_at")
        .eq("user_id", user.id)
        .eq("file_type", "journal")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) console.error("Lỗi tải nhật ký:", error.message);
      else setEntries(data || []);
    } catch (err) {
      console.error("Lỗi tải nhật ký:", err);
    }
    setLoadingEntries(false);
  }

  function startEdit(entry: JournalEntry) {
    const data = parseEntry(entry.content);
    setThan(data.than || "");
    setTam(data.tam || "");
    setHanh(data.hanh || "");
    setEditingId(entry.id);
  }

  function cancelEdit() {
    setThan(""); setTam(""); setHanh("");
    setEditingId(null);
  }

  async function handleSave() {
    if (!than && !tam && !hanh) return;
    setSaving(true);

    if (editingId) {
      // Update existing
      try {
        const res = await fetch(`/api/journal/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ than, tam, hanh }),
        });
        const data = await res.json();
        if (data.error) alert("Lỗi: " + data.error);
        else {
          setSaved(true); setTimeout(() => setSaved(false), 3000);
          setThan(""); setTam(""); setHanh(""); setEditingId(null);
          loadEntries();
        }
      } catch { alert("Lỗi khi cập nhật nhật ký."); }
    } else {
      // Create new
      try {
        const res = await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ than, tam, hanh }),
        });
        const data = await res.json();
        if (data.error) alert("Lỗi: " + data.error);
        else if (data.id) {
          setSaved(true); setTimeout(() => setSaved(false), 3000);
          setThan(""); setTam(""); setHanh("");
          loadEntries();
        }
      } catch (err) {
        alert("Lỗi khi lưu nhật ký: " + (err instanceof Error ? err.message : "Lỗi không xác định"));
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa nhật ký này?")) return;
    try {
      const res = await fetch(`/api/journal/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) alert("Lỗi: " + data.error);
      else loadEntries();
    } catch { alert("Lỗi khi xóa nhật ký."); }
  }

  async function askAI() {
    if (!than && !tam && !hanh) return;

    // 1. Auto-save journal trước
    try {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ than, tam, hanh }),
      });
      setThan(""); setTam(""); setHanh("");
      loadEntries();
    } catch { /* silent */ }

    // 2. Xây dựng message kèm lịch sử nhật ký
    let historyText = "";
    if (entries.length > 0) {
      const recent = entries.slice(0, 5);
      historyText = "\n\n📋 LỊCH SỬ NHẬT KÝ GẦN ĐÂY CỦA TÔI:\n" + recent.map((e) => {
        const d = parseEntry(e.content);
        const date = new Date(e.created_at).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" });
        return `[${date}] Thân: ${d.than || "—"} | Tâm: ${d.tam || "—"} | Hành: ${d.hanh || "—"}`;
      }).join("\n");
    }

    const message = `[NHẬT KÝ HÔM NAY CỦA TÔI]
• Thân: ${than || "(không ghi)"}
• Tâm: ${tam || "(không ghi)"}
• Hành: ${hanh || "(không ghi)"}${historyText}

Hãy phân tích:
1. Xu hướng thay đổi của tôi qua các ngày là gì? (so sánh với lịch sử)
2. Mối liên hệ giữa Thân-Tâm-Hành hôm nay
3. Tôi đang ở đâu trên hành trình chuyển hóa (THẤY/HIỂU/SỐNG/LAN TỎA)?
4. Một gợi ý thực hành cụ thể cho tôi dựa trên toàn bộ hành trình.`;
    window.dispatchEvent(new CustomEvent("ai-mentor:ask", { detail: { text: message } }));
  }

  function parseEntry(content: string) {
    try {
      return JSON.parse(content) as { than?: string; tam?: string; hanh?: string };
    } catch {
      return { than: content };
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <BookHeart className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nhật ký Thân - Tâm - Hành</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            5 phút cuối ngày — nhìn lại để chuyển hóa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="space-y-5">
          {/* Thân */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs text-green-400 font-bold">T</span>
              Thân — Cơ thể hôm nay thế nào?
            </label>
            <textarea value={than} onChange={(e) => setThan(e.target.value)}
              placeholder="Mệt mỏi, căng thẳng ở vai gáy, đau đầu nhẹ..."
              rows={2}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Tâm */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-xs text-red-400 font-bold">T</span>
              Tâm — Cảm xúc chủ đạo hôm nay?
            </label>
            <textarea value={tam} onChange={(e) => setTam(e.target.value)}
              placeholder="Lo lắng, vui vì hoàn thành việc, hơi bực mình vì..."
              rows={2}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Hành */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-bold">H</span>
              Hành — Điều gì tốt? Cần rút kinh nghiệm?
            </label>
            <textarea value={hanh} onChange={(e) => setHanh(e.target.value)}
              placeholder="Sáng tập trung tốt, chiều hơi xao nhãng..."
              rows={2}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving || (!than && !tam && !hanh)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
            >
              <BookHeart className="w-4 h-4" />
              {saving ? "Đang lưu..." : saved ? "✅ Đã lưu" : editingId ? "Cập nhật" : "Lưu nhật ký"}
            </button>
            {editingId && (
              <button onClick={cancelEdit}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
              >
                <X className="w-4 h-4" /> Hủy
              </button>
            )}
            <button onClick={askAI} disabled={!than && !tam && !hanh}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/></svg>
              Hỏi AI Mentor
            </button>
          </div>
        </div>

        {/* Right: Previous entries */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Nhật ký gần đây
          </h2>

          {loadingEntries && (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          )}

          {!loadingEntries && entries.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">Chưa có nhật ký nào.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Hãy viết nhật ký đầu tiên ở cột bên trái!</p>
            </div>
          )}

          {!loadingEntries && entries.map((entry) => {
            const data = parseEntry(entry.content);
            const date = new Date(entry.created_at).toLocaleDateString("vi-VN", {
              weekday: "long", day: "2-digit", month: "2-digit",
            });
            return (
              <div key={entry.id} className="rounded-xl border border-border bg-card p-4 space-y-2 group">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{date}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(entry)} className="w-6 h-6 rounded hover:bg-muted/50 flex items-center justify-center" title="Sửa">
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="w-6 h-6 rounded hover:bg-red-500/10 flex items-center justify-center" title="Xóa">
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
                {data.than && <p className="text-xs"><span className="text-green-400 font-medium">Thân:</span> {data.than}</p>}
                {data.tam && <p className="text-xs"><span className="text-red-400 font-medium">Tâm:</span> {data.tam}</p>}
                {data.hanh && <p className="text-xs"><span className="text-blue-400 font-medium">Hành:</span> {data.hanh}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
