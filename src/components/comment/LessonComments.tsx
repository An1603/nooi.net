"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  user_name?: string;
}

export default function LessonComments({ lessonId }: { lessonId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Lấy comments
        const { data } = await supabase
          .from("documents")
          .select("*")
          .eq("file_type", "comment")
          .eq("title", lessonId)
          .order("created_at", { ascending: false });
        if (data) {
          // Lấy tên user
          const userIds = [...new Set(data.map((c) => c.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", userIds);
          const nameMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.full_name]));
          setComments(data.map((c) => ({
            id: c.id,
            user_id: c.user_id,
            text: JSON.parse(c.content || "{}").text || "",
            created_at: c.created_at,
            user_name: nameMap[c.user_id],
          })));
        }
      } catch {}
      setLoading(false);
    })();
  }, [lessonId]);

  async function addComment() {
    if (!text.trim()) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("documents").insert({
        user_id: user.id,
        title: lessonId,
        content: JSON.stringify({ text: text.trim() }),
        file_type: "comment",
      });
      setText("");
      window.location.reload();
    } catch {}
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">Thảo luận ({comments.length})</h3>
      </div>

      {/* Add comment */}
      <div className="flex gap-2 mb-4">
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addComment()}
          placeholder="Chia sẻ suy nghĩ của bạn về bài học..."
          className="flex-1 px-3 py-2 rounded-lg bg-muted/20 border border-border text-sm"
        />
        <button onClick={addComment} disabled={!text.trim()}
          className="bg-primary px-3 py-2 rounded-lg text-primary-foreground disabled:opacity-50"
        ><Send className="w-4 h-4" /></button>
      </div>

      {/* Comments list */}
      {loading && <p className="text-xs text-muted-foreground">Đang tải...</p>}
      {!loading && comments.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">Chưa có thảo luận. Hãy là người đầu tiên!</p>
      )}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-muted/10">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {c.user_name?.charAt(0) || "?"}
            </div>
            <div>
              <p className="text-xs font-medium">{c.user_name || "Người dùng"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.text}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(c.created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
