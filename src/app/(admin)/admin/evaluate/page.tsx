"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCheck, Search, X, BookOpen, Users, Star, TrendingUp, Loader2, FileText, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface UserSummary {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  onboarding_completed: boolean;
  created_at: string;
  stats: {
    journals: number;
    n: number;
    level: number;
    documents: number;
    projects: number;
    lastActive: string | null;
  } | null;
}

export default function AdminEvaluatePage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "journals" | "level" | "recent">("level");
  const [filterLevel, setFilterLevel] = useState(0); // 0 = all

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      const userList = data.users ?? [];

      // Get stats for all users in parallel
      const statsResults = await Promise.allSettled(
        userList.slice(0, 50).map((u: { id: string }) =>
          fetch(`/api/admin/users/stats?user_id=${u.id}`).then(r => r.json())
        )
      );

      const enriched = userList.slice(0, 50).map((u: UserSummary, i: number) => ({
        ...u,
        stats: statsResults[i]?.status === "fulfilled" ? statsResults[i].value.stats : null,
      }));

      setUsers(enriched);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users
    .filter((u) => {
      if (search && !u.full_name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterLevel > 0 && (u.stats?.level ?? 0) !== filterLevel) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "journals": return (b.stats?.journals ?? 0) - (a.stats?.journals ?? 0);
        case "level": return (b.stats?.level ?? 0) - (a.stats?.level ?? 0);
        case "recent": return new Date(b.stats?.lastActive ?? b.created_at).getTime() - new Date(a.stats?.lastActive ?? a.created_at).getTime();
        case "name": return (a.full_name ?? "").localeCompare(b.full_name ?? "");
        default: return 0;
      }
    });

  const levelNames = ["", "Người mới", "Người tìm kiếm", "Học viên", "Người thực hành", "Người đồng hành", "Mentor", "Master Mentor"];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Đánh giá</h1>
        <p className="text-sm text-muted-foreground mt-1">Đánh giá hoạt động và mức độ tham gia của người dùng</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Tìm user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 h-9 rounded-lg border border-border bg-background text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-xs"
        >
          <option value="level">Sắp xếp: Level</option>
          <option value="journals">Nhật ký nhiều nhất</option>
          <option value="recent">Hoạt động gần đây</option>
          <option value="name">Tên A-Z</option>
        </select>

        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(Number(e.target.value))}
          className="h-9 rounded-lg border border-border bg-background px-3 text-xs"
        >
          <option value={0}>Tất cả level</option>
          {[1, 2, 3, 4, 5, 6, 7].map((l) => (
            <option key={l} value={l}>Level {l}: {levelNames[l]}</option>
          ))}
        </select>

        <button onClick={loadUsers} className="h-9 px-3 rounded-lg border border-border bg-background text-xs hover:bg-muted/30 transition-colors">
          Làm mới
        </button>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Tổng user" value={users.length} icon={Users} color="text-blue-400" />
          <SummaryCard label="Level 6+ (Mentor)" value={users.filter((u) => (u.stats?.level ?? 0) >= 6).length} icon={Star} color="text-amber-400" />
          <SummaryCard label="Có nhật ký" value={users.filter((u) => (u.stats?.journals ?? 0) > 0).length} icon={BookOpen} color="text-cyan-400" />
          <SummaryCard label="Tổng N" value={users.reduce((sum, u) => sum + (u.stats?.n ?? 0), 0).toLocaleString("vi-VN")} icon={TrendingUp} color="text-primary" />
        </div>
      )}

      {/* User cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground p-8 text-center">Không tìm thấy user phù hợp.</p>
          ) : (
            filtered.map((u) => {
              const lvl = u.stats?.level ?? 1;
              return (
                <div key={u.id} className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4 hover:border-primary/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {(u.full_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{u.full_name || "Chưa đặt tên"}</p>
                          {u.role !== "user" && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              u.role === "super_admin" ? "bg-red-500/10 text-red-400" :
                              u.role === "admin" ? "bg-primary/10 text-primary" :
                              "bg-amber-500/10 text-amber-400"
                            }`}>
                              {u.role === "super_admin" ? "Super" : u.role === "admin" ? "Admin" : "Mod"}
                            </span>
                          )}
                          {!u.onboarding_completed && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Chưa setup</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{u.email || u.id.slice(0, 12)}...</p>
                      </div>
                    </div>
                    <Link href={`/admin/users/${u.id}`} className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
                      <Eye className="size-3.5" />
                    </Link>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/20">
                    <StatBadge icon={BookOpen} label="Nhật ký" value={String(u.stats?.journals ?? 0)} color="text-cyan-400" />
                    <StatBadge icon={Star} label={`Level ${lvl}`} value={levelNames[lvl] || ""} color="text-amber-400" />
                    <StatBadge icon={TrendingUp} label="N" value={String(u.stats?.n ?? 0)} color="text-primary" />
                    <StatBadge icon={FileText} label="Tài liệu" value={String(u.stats?.documents ?? 0)} color="text-blue-400" />
                    {u.stats?.lastActive && (
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        Hoạt động: {new Date(u.stats.lastActive).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <div className={`size-7 rounded-lg bg-white/5 flex items-center justify-center`}>
          <Icon className={`size-3.5 ${color}`} />
        </div>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function StatBadge({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className={`size-3 ${color}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
