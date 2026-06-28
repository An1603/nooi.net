"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, Eye, Shield, CheckCircle, XCircle, Loader2,
  Search, X, Mail, Lock, User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  onboarding_completed: boolean;
  has_numerology: boolean;
  has_tuvi: boolean;
  has_astrology: boolean;
  role: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const supabase = createClient();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  // Create user
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) { toast.error("Email và mật khẩu là bắt buộc"); return; }
    if (newPassword.length < 6) { toast.error("Mật khẩu ít nhất 6 ký tự"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, full_name: newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo thất bại");
      toast.success("Đã tạo user!");
      setShowCreate(false);
      setNewEmail(""); setNewPassword(""); setNewName("");
      loadUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Tạo thất bại");
    } finally {
      setCreating(false);
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xoá thất bại");
      toast.success("Đã xoá user!");
      setDeleteId(null);
      loadUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xoá thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Người dùng</h1>
          <p className="text-xs text-muted-foreground">{users.length} users</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-primary-foreground hover:brightness-110 text-sm gap-1.5 h-9"
        >
          <Plus className="size-4" /> Thêm user
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, email hoặc ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* User table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Modules</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Role</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.01]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {(u.full_name || "U")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.full_name || "Chưa đặt tên"}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{u.email ?? u.id.slice(0, 8) + "..."}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {u.has_numerology && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">TS</span>}
                        {u.has_tuvi && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">TV</span>}
                        {u.has_astrology && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">CT</span>}
                        {!u.has_numerology && !u.has_tuvi && !u.has_astrology && (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {u.role === "super_admin" || u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                          <Shield className="size-3" />{u.role === "super_admin" ? "Super Admin" : "Admin"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/users/${u.id}`}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                          title="Xem chi tiết">
                          <Eye className="size-3.5" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Xoá">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground p-4 text-center">Không tìm thấy user.</p>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-sm bg-[#111] border border-border rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Thêm người dùng</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Họ tên</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Nguyễn Văn A" value={newName} onChange={(e) => setNewName(e.target.value)} className="pl-8 h-9 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email *</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" placeholder="user@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="pl-8 h-9 text-sm" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mật khẩu *</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" placeholder="Ít nhất 6 ký tự" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-8 h-9 text-sm" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-9 bg-primary text-primary-foreground hover:brightness-110 text-sm" disabled={creating}>
                {creating ? <><Loader2 className="size-3.5 animate-spin mr-1" />Đang tạo...</> : "Tạo user"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-xs bg-[#111] border border-red-500/20 rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-red-400 mb-2">Xoá người dùng?</h2>
            <p className="text-xs text-muted-foreground mb-4">Hành động này không thể hoàn tác. Tất cả dữ liệu của user sẽ bị xoá vĩnh viễn.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 h-9 text-sm">Huỷ</Button>
              <Button onClick={handleDelete} disabled={deleting}
                className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white text-sm">
                {deleting ? <><Loader2 className="size-3.5 animate-spin mr-1" />Đang xoá...</> : "Xoá"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}