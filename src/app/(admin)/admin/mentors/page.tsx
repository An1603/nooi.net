/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Users, Award, Search, X, Loader2, Edit3 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const LEVEL_COLORS: Record<number, string> = {
  6: "bg-red-500/10 text-red-400",
  7: "bg-purple-500/10 text-purple-400",
};

export default function AdminMentorsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState(0);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      const mentors = (data.users || []).filter((u: any) => u.level >= 6);
      setUsers(mentors);
    } catch { toast.error("Không thể tải dữ liệu"); }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter((u: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (!(u.full_name || "").toLowerCase().includes(q) && !(u.email || "").toLowerCase().includes(q)) return false;
    }
    if (filterLevel > 0 && u.level !== filterLevel) return false;
    return true;
  });

  const level6Count = users.filter((u: any) => u.level === 6).length;
  const level7Count = users.filter((u: any) => u.level === 7).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Mentor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Users đạt cấp bậc Mentor (Level 6+) — bất kỳ ai cũng có thể trở thành Mentor khi đủ N
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Tổng Mentor" value={users.length} icon={Users} color="text-primary" bg="bg-primary/10" />
        <SummaryCard label="Mentor (Level 6)" value={level6Count} icon={Star} color="text-red-400" bg="bg-red-500/10" />
        <SummaryCard label="Master Mentor (Level 7)" value={level7Count} icon={Award} color="text-purple-400" bg="bg-purple-500/10" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Tìm mentor..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 h-9 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="size-4" /></button>}
        </div>
        <select value={filterLevel} onChange={(e) => setFilterLevel(Number(e.target.value))}
          className="h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none">
          <option value={0}>Tất cả cấp bậc</option>
          <option value={6}>Level 6 — Mentor</option>
          <option value={7}>Level 7 — Master Mentor</option>
        </select>
      </div>

      {/* Mentor list */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Users className="size-10 text-muted-foreground/30 mx-auto mb-3" />
          {users.length === 0
            ? <p className="text-sm text-muted-foreground">Chưa có ai đạt cấp Mentor. Khuyến khích học viên viết nhật ký!</p>
            : <p className="text-sm text-muted-foreground">Không tìm thấy mentor phù hợp.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u: any) => (
            <div key={u.id} className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`size-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${LEVEL_COLORS[u.level] || "bg-primary/10 text-primary"}`}>
                    {(u.full_name || "M")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/admin/users/${u.id}`} className="text-sm font-medium hover:text-primary transition-colors">{u.full_name || "Chưa đặt tên"}</Link>
                      <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[u.level] || "bg-primary/10 text-primary"}`}>
                        {u.level === 7 ? "🌟 Master Mentor" : "⭐ Mentor"}
                      </span>
                      {u.role !== "user" && (
                        <span className="text-[12px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          {u.role === "super_admin" ? "Super Admin" : "Admin"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{u.email || u.id.slice(0, 12)}...</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[12px] text-muted-foreground">
                      <span>📓 {u.journals || 0} nhật ký</span>
                      <span>🔢 {u.n || 0} N</span>
                      {u.has_numerology && <span className="px-1 py-0.5 rounded bg-amber-500/10 text-amber-400">TS</span>}
                      {u.has_tuvi && <span className="px-1 py-0.5 rounded bg-red-500/10 text-red-400">TV</span>}
                      {u.has_astrology && <span className="px-1 py-0.5 rounded bg-purple-500/10 text-purple-400">CT</span>}
                    </div>
                  </div>
                </div>
                <Link href={`/admin/users/${u.id}`} className="text-[12px] text-primary hover:underline shrink-0 flex items-center gap-1">
                  <Edit3 className="size-3" /> Chi tiết
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, bg }: { label: string; value: number; icon: React.ElementType; color: string; bg: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className={`size-8 rounded-lg ${bg} flex items-center justify-center`}><Icon className={`size-4 ${color}`} /></div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
