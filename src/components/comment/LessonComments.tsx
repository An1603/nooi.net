"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send, Heart, Reply, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  user_name?: string;
  parent_id?: string | null;
  likes: number;
  liked_by_me: boolean;
  replies?: Comment[];
}

export default function LessonComments({ lessonId }: { lessonId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const fetchComments = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyUserId(user.id);

      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("file_type", "comment")
        .eq("title", lessonId)
        .order("created_at", { ascending: false });
      if (!data) return;

      // Get user names
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const nameMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.full_name]));

      // Parse all comments
      const allComments: Comment[] = data.map(c => {
        const content = JSON.parse(c.content || "{}");
        return {
          id: c.id,
          user_id: c.user_id,
          text: content.text || "",
          created_at: c.created_at,
          user_name: nameMap[c.user_id],
          parent_id: content.parent_id || null,
          likes: content.likes || 0,
          liked_by_me: (content.liked_by || []).includes(user.id),
        };
      });

      // Separate top-level and replies
      const topLevel = allComments.filter(c => !c.parent_id);
      const replies = allComments.filter(c => c.parent_id);

      // Attach replies to parent
      topLevel.forEach(c => {
        c.replies = replies.filter(r => r.parent_id === c.id);
      });

      // Sort
      if (sortBy === "popular") {
        topLevel.sort((a, b) => b.likes - a.likes);
      }

      setComments(topLevel);
    } catch {}
    setLoading(false);
  }, [lessonId, sortBy]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function addComment(parentId?: string) {
    const commentText = parentId ? replyText : text;
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("documents").insert({
        user_id: user.id,
        title: lessonId,
        content: JSON.stringify({
          text: commentText.trim(),
          parent_id: parentId || null,
          likes: 0,
          liked_by: [],
        }),
        file_type: "comment",
      });

      if (parentId) {
        setReplyText("");
        setReplyTo(null);
      } else {
        setText("");
      }
      await fetchComments();
    } catch {}
    setSubmitting(false);
  }

  async function toggleLike(commentId: string) {
    if (!myUserId) return;
    try {
      const supabase = createClient();
      const { data: doc } = await supabase
        .from("documents")
        .select("content")
        .eq("id", commentId)
        .maybeSingle();
      if (!doc) return;

      const content = JSON.parse(doc.content || "{}");
      const likedBy: string[] = content.liked_by || [];
      const isLiked = likedBy.includes(myUserId);

      if (isLiked) {
        content.liked_by = likedBy.filter(id => id !== myUserId);
        content.likes = Math.max(0, (content.likes || 0) - 1);
      } else {
        content.liked_by = [...likedBy, myUserId];
        content.likes = (content.likes || 0) + 1;
      }

      await supabase.from("documents").update({ content: JSON.stringify(content) }).eq("id", commentId);
      await fetchComments();
    } catch {}
  }

  function toggleReplies(commentId: string) {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }

  function renderComment(c: Comment, isReply = false) {
    return (
      <div key={c.id} className={`flex gap-3 p-3 rounded-lg ${isReply ? "bg-muted/5 ml-8" : "bg-muted/10"}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          c.user_id === myUserId ? "bg-primary/20 text-primary" : "bg-accent/10 text-accent"
        }`}>
          {c.user_name?.charAt(0) || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{c.user_name || "Người dùng"}</span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(c.created_at).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{c.text}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <button
              onClick={() => toggleLike(c.id)}
              className={`flex items-center gap-1 text-[10px] transition-colors ${
                c.liked_by_me ? "text-pink-400" : "text-muted-foreground/50 hover:text-pink-400"
              }`}
            >
              <Heart className={`w-3 h-3 ${c.liked_by_me ? "fill-pink-400" : ""}`} />
              {c.likes > 0 && <span>{c.likes}</span>}
            </button>
            {!isReply && (
              <button
                onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyText(""); }}
                className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors"
              >
                <Reply className="w-3 h-3" /> Trả lời
              </button>
            )}
          </div>

          {/* Reply input */}
          {replyTo === c.id && (
            <div className="flex gap-2 mt-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComment(c.id)}
                placeholder={`Trả lời ${c.user_name}...`}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs"
                autoFocus
              />
              <button
                onClick={() => addComment(c.id)}
                disabled={!replyText.trim() || submitting}
                className="bg-primary px-2 py-1.5 rounded-lg text-primary-foreground disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </button>
            </div>
          )}

          {/* Replies */}
          {!isReply && c.replies && c.replies.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => toggleReplies(c.id)}
                className="flex items-center gap-1 text-[10px] text-primary"
              >
                {expandedReplies.has(c.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {c.replies.length} trả lời
              </button>
              {expandedReplies.has(c.id) && (
                <div className="mt-2 space-y-2">
                  {c.replies.map(r => renderComment(r, true))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Thảo luận ({comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0)})</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setSortBy("newest")}
            className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${sortBy === "newest" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/20"}`}
          >
            Mới nhất
          </button>
          <button
            onClick={() => setSortBy("popular")}
            className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${sortBy === "popular" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/20"}`}
          >
            Yêu thích
          </button>
        </div>
      </div>

      {/* Add comment */}
      <div className="flex gap-2 mb-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addComment()}
          placeholder="Chia sẻ suy nghĩ của bạn về bài học..."
          className="flex-1 px-3 py-2 rounded-lg bg-muted/20 border border-border text-sm"
        />
        <button
          onClick={() => addComment()}
          disabled={!text.trim() || submitting}
          className="bg-primary px-3 py-2 rounded-lg text-primary-foreground disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* Comments list */}
      {loading && <p className="text-xs text-muted-foreground text-center py-4">Đang tải...</p>}
      {!loading && comments.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">Chưa có thảo luận. Hãy là người đầu tiên!</p>
      )}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {comments.map(c => renderComment(c))}
      </div>
    </div>
  );
}
