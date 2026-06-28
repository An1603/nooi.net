"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, Eye, Shield, Loader2, Search, X, Mail, Lock, User, Pencil,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const GIO_LIST = [
  { value: 23, label: "Tý (23:00-00:59)" }, { value: 1, label: "Sửu (01:00-02:59)" },
  { value: 3, label: "Dần (03:00-04:59)" }, { value: 5, label: "Mão (05:00-06:59)" },
  { value: 7, label: "Thìn (07:00-08:59)" }, { value: 9, label: "Tỵ (09:00-10:59)" },
  { value: 11, label: "Ngọ (11:00-12:59)" }, { value: 13, label: "Mùi (13:00-14:59)" },
  { value: 15, label: "Thân (15:00-16:59)" }, { value: 17, label: "Dậu (17:00-18:59)" },
  { value: 19, label: "Tuất (19:00-20:59)" }, { value: 21, label: "Hợi (21:00-22:59)" },
];

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
  date_of_birth: string | null;
  gio_sinh: number | null;
  gioi_tinh: string | null;
  noi_sinh: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGio, setEditGio] = useState(12);
  const [editGioiTinh, setEditGioiTinh] = useState("nam");
  const [editNoiSinh, setEditNoiSinh] = useState("");
  const [editing, setEditing] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.full_name??"").toLowerCase().includes(q) || (u.email??"").toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) { toast.error("Email và mật khẩu là bắt buộc"); return; }
    if (newPassword.length < 6) { toast.error("Mật khẩu ít nhất 6 ký tự"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email:newEmail, password:newPassword, full_name:newName }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||"Tạo thất bại");
      toast.success("Đã tạo user!");
      setShowCreate(false); setNewEmail(""); setNewPassword(""); setNewName("");
      loadUsers();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Tạo thất bại"); }
    finally { setCreating(false); }
  };

  const openEdit = (u: AdminUser) => {
    setEditUser(u);
    setEditName(u.full_name || "");
    setEditDob(u.date_of_birth?.split("T")[0] || "");
    setEditGio(u.gio_sinh ?? 12);
    setEditGioiTinh(u.gioi_tinh || "nam");
    setEditNoiSinh(u.noi_sinh || "");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editName.trim() || null,
          date_of_birth: editDob || null,
          gio_sinh: editGio,
          gioi_tinh: editGioiTinh,
          noi_sinh: editNoiSinh.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      toast.success("Đã cập nhật user!");
      setEditUser(null);
      loadUsers();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Cập nhật thất bại"); }
    finally { setEditing(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteId}`, { method:"DELETE" });
      if (!res.ok) throw new Error("Xoá thất bại");
      toast.success("Đã xoá user!");
      setDeleteId(null);
      loadUsers();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Xoá thất bại"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-xl font-bold">Người dùng</h1><p className="text-xs text-muted-foreground">{users.length} users</p></div>
        <Button onClick={() => setShowCreate(true)} className="bg-primary text-primary-foreground hover:brightness-110 text-sm gap-1.5 h-9"><Plus className="size-4"/> Thêm user</Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
        <Input placeholder="Tìm theo tên, email hoặc ID..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 h-9 text-sm"/>
        {search&&<button onClick={()=>setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="size-4"/></button>}
      </div>

      {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground"/></div> : (
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Modules</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Role</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Hành động</th>
              </tr></thead>
              <tbody className="divide-y divide-border/10">
                {filtered.map(u => <tr key={u.id} className="hover:bg-white/[0.01]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{(u.full_name||"U")[0].toUpperCase()}</div>
                    <div className="min-w-0"><p className="text-sm font-medium truncate hover:text-primary transition-colors">{u.full_name||"Chưa đặt tên"}</p><p className="text-[10px] text-muted-foreground truncate">{u.email??u.id.slice(0,8)+"..."}</p></div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell"><div className="flex gap-1 flex-wrap">
                    {u.has_numerology&&<span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">TS</span>}
                    {u.has_tuvi&&<span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">TV</span>}
                    {u.has_astrology&&<span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">CT</span>}
                    {!u.has_numerology&&!u.has_tuvi&&!u.has_astrology&&<span className="text-[10px] text-muted-foreground">—</span>}
                  </div></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.role==="super_admin"||u.role==="admin"?<span className="inline-flex items-center gap-1 text-xs text-primary font-medium"><Shield className="size-3"/>{u.role==="super_admin"?"Super Admin":"Admin"}</span>:<span className="text-xs text-muted-foreground">User</span>}
                  </td>
                  <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-blue-400 transition-colors" title="Sửa"><Pencil className="size-3.5"/></button>
                    <Link href={`/admin/users/${u.id}`} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors" title="Xem chi tiết"><Eye className="size-3.5"/></Link>
                    <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Xoá"><Trash2 className="size-3.5"/></button>
                  </div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          {filtered.length===0&&<p className="text-xs text-muted-foreground p-4 text-center">Không tìm thấy user.</p>}
        </div>
      )}

      {/* Create modal */}
      {showCreate&&<Modal onClose={()=>setShowCreate(false)} title="Thêm người dùng">
        <form onSubmit={handleCreate} className="space-y-3">
          <Field icon={User} label="Họ tên"><Input placeholder="Nguyễn Văn A" value={newName} onChange={e=>setNewName(e.target.value)} className="pl-8 h-9 text-sm"/></Field>
          <Field icon={Mail} label="Email *"><Input type="email" placeholder="user@example.com" value={newEmail} onChange={e=>setNewEmail(e.target.value)} className="pl-8 h-9 text-sm" required/></Field>
          <Field icon={Lock} label="Mật khẩu *"><Input type="password" placeholder="Ít nhất 6 ký tự" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="pl-8 h-9 text-sm" required/></Field>
          <Button type="submit" className="w-full h-9 bg-primary text-primary-foreground hover:brightness-110 text-sm" disabled={creating}>{creating?<><Loader2 className="size-3.5 animate-spin mr-1"/>Đang tạo...</>:"Tạo user"}</Button>
        </form>
      </Modal>}

      {/* Edit modal */}
      {editUser&&<Modal onClose={()=>setEditUser(null)} title={`Sửa: ${editUser.full_name||editUser.email||editUser.id.slice(0,8)}`}>
        <form onSubmit={handleEdit} className="space-y-3">
          <Field icon={User} label="Họ tên"><Input placeholder="Họ tên" value={editName} onChange={e=>setEditName(e.target.value)} className="pl-8 h-9 text-sm"/></Field>
          <div className="space-y-1">
            <Label className="text-xs">Ngày sinh</Label>
            <Input type="date" value={editDob} onChange={e=>setEditDob(e.target.value)} className="h-9 text-sm" max={new Date().toISOString().split("T")[0]}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Giờ sinh</Label>
              <select value={editGio} onChange={e=>setEditGio(Number(e.target.value))} className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm">
                {GIO_LIST.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Giới tính</Label>
              <select value={editGioiTinh} onChange={e=>setEditGioiTinh(e.target.value)} className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm">
                <option value="nam">Nam</option><option value="nu">Nữ</option>
              </select>
            </div>
          </div>
          <Field icon={User} label="Nơi sinh"><Input placeholder="VD: Hà Nội" value={editNoiSinh} onChange={e=>setEditNoiSinh(e.target.value)} className="pl-8 h-9 text-sm"/></Field>
          <Button type="submit" className="w-full h-9 bg-primary text-primary-foreground hover:brightness-110 text-sm" disabled={editing}>{editing?<><Loader2 className="size-3.5 animate-spin mr-1"/>Đang lưu...</>:"Lưu thay đổi"}</Button>
        </form>
      </Modal>}

      {/* Delete modal */}
      {deleteId&&<Modal onClose={()=>setDeleteId(null)} title="Xoá người dùng?" borderRed>
        <p className="text-xs text-muted-foreground mb-4">Hành động này không thể hoàn tác. Tất cả dữ liệu của user sẽ bị xoá vĩnh viễn.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>setDeleteId(null)} className="flex-1 h-9 text-sm">Huỷ</Button>
          <Button onClick={handleDelete} disabled={deleting} className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white text-sm">{deleting?<><Loader2 className="size-3.5 animate-spin mr-1"/>Đang xoá...</>:"Xoá"}</Button>
        </div>
      </Modal>}
    </div>
  );
}

function Modal({ onClose, title, children, borderRed }: { onClose: ()=>void; title: string; children: React.ReactNode; borderRed?: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
    <div className={`w-full max-w-sm bg-[#111] border ${borderRed?"border-red-500/20":"border-border"} rounded-2xl p-6 shadow-2xl`} onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-base font-semibold ${borderRed?"text-red-400":""}`}>{title}</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-5"/></button>
      </div>
      {children}
    </div>
  </div>;
}

function Field({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    <div className="relative"><Icon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"/>{children}</div>
  </div>;
}