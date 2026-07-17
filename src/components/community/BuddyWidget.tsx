"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, UserPlus, Check, X, Users, Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Buddy {
  id: string; buddyId: string; name: string; since: string;
}
interface PendingReceived {
  id: string; fromUserId: string; fromName: string; message: string;
}
interface PendingSent {
  id: string; toUserId: string; toName: string;
}

export default function BuddyWidget() {
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [pendingReceived, setPendingReceived] = useState<PendingReceived[]>([]);
  const [pendingSent, setPendingSent] = useState<PendingSent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFind, setShowFind] = useState(false);
  const [allUsers, setAllUsers] = useState<{ user_id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/buddy");
      const data = await res.json();
      if (data.buddies) setBuddies(data.buddies);
      if (data.pendingReceived) setPendingReceived(data.pendingReceived);
      if (data.pendingSent) setPendingSent(data.pendingSent);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load all users for search
  useEffect(() => {
    if (!showFind) return;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").neq("user_id", user.id);
      if (profs) setAllUsers(profs.map(p => ({ user_id: p.user_id, name: p.full_name || "Người dùng" })));
    })();
  }, [showFind]);

  async function sendRequest(targetUserId: string) {
    setActionLoading(targetUserId);
    try {
      await fetch("/api/buddy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", targetUserId }),
      });
      await fetchData();
      setShowFind(false);
    } catch {}
    setActionLoading(null);
  }

  async function acceptRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      await fetch("/api/buddy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", requestId }),
      });
      await fetchData();
    } catch {}
    setActionLoading(null);
  }

  async function rejectRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      await fetch("/api/buddy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", requestId }),
      });
      await fetchData();
    } catch {}
    setActionLoading(null);
  }

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) &&
    !buddies.some(b => b.buddyId === u.user_id) &&
    !pendingSent.some(p => p.toUserId === u.user_id)
  );

  return (
    <div className="rounded-xl border border-pink-500/15 bg-gradient-to-br from-pink-500/5 via-card to-red-500/5 p-5 card-elevated">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center border border-pink-500/20">
            <Heart className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Bạn đồng hành</h2>
            <p className="text-[11px] text-muted-foreground">Cùng nhau thực hành, nhắc nhở lẫn nhau</p>
          </div>
        </div>
        <button
          onClick={() => setShowFind(!showFind)}
          className="text-xs bg-pink-500/10 text-pink-400 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-pink-500/20 transition-colors"
        >
          <UserPlus className="w-3 h-3" /> Tìm bạn
        </button>
      </div>

      {/* Find buddy panel */}
      {showFind && (
        <div className="mb-4 p-3 rounded-lg bg-muted/10 border border-border/50 space-y-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm người để kết bạn..."
            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
          />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredUsers.slice(0, 10).map(u => (
              <div key={u.user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {u.name.charAt(0)}
                  </div>
                  <span className="text-xs">{u.name}</span>
                </div>
                <button
                  onClick={() => sendRequest(u.user_id)}
                  disabled={actionLoading === u.user_id}
                  className="text-[11px] bg-pink-500/10 text-pink-400 px-2 py-1 rounded-lg hover:bg-pink-500/20 disabled:opacity-50"
                >
                  {actionLoading === u.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                </button>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Không tìm thấy</p>
            )}
          </div>
        </div>
      )}

      {/* Pending received requests */}
      {pendingReceived.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">📩 Lời mời kết bạn ({pendingReceived.length})</p>
          {pendingReceived.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-pink-500/5 border border-pink-500/15">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-pink-500/10 flex items-center justify-center text-xs font-bold text-pink-400">
                  {r.fromName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-medium">{r.fromName}</p>
                  {r.message && <p className="text-[11px] text-muted-foreground">{r.message}</p>}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => acceptRequest(r.id)}
                  disabled={actionLoading === r.id}
                  className="w-7 h-7 rounded-lg bg-green-500/15 text-green-400 flex items-center justify-center hover:bg-green-500/25 disabled:opacity-50"
                >
                  {actionLoading === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => rejectRequest(r.id)}
                  disabled={actionLoading === r.id}
                  className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center hover:bg-red-500/25 disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Buddy list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : buddies.length === 0 ? (
        <div className="text-center py-6">
          <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Chưa có bạn đồng hành</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Nhấn &quot;Tìm bạn&quot; để bắt đầu kết nối</p>
        </div>
      ) : (
        <div className="space-y-2">
          {buddies.map(b => (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 flex items-center justify-center text-sm font-bold text-pink-400 border border-pink-500/20">
                {b.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{b.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Bạn đồng hành từ {new Date(b.since).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <Heart className="w-4 h-4 text-pink-400/60" />
            </div>
          ))}
        </div>
      )}

      {/* Pending sent */}
      {pendingSent.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-[11px] text-muted-foreground">Đã gửi lời mời: {pendingSent.map(p => p.toName).join(", ")}</p>
        </div>
      )}
    </div>
  );
}
