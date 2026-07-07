"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Video,
  Calendar,
  Clock,
  Users,
  Edit3,
  Trash2,
  Plus,
  Copy,
  Loader2,
  X,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface LiveSession {
  id: string;
  user_id: string;
  title: string;
  date: string;
  time: string;
  link: string;
  meeting_id: string;
  password: string;
  mentor_name: string;
  max_participants: number;
  registered: number;
  description: string;
  created_at: string;
}

const EMPTY_FORM = {
  title: "",
  date: "",
  time: "",
  link: "",
  meeting_id: "",
  password: "",
  mentor_name: "NOOI",
  max_participants: 20,
  description: "",
};

type FormData = typeof EMPTY_FORM;

export default function AdminLivePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<FormData>({ ...EMPTY_FORM });
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editSession, setEditSession] = useState<LiveSession | null>(null);
  const [editForm, setEditForm] = useState<FormData>({ ...EMPTY_FORM });
  const [editing, setEditing] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/live");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.mentor_name.toLowerCase().includes(q) ||
      s.meeting_id.toLowerCase().includes(q)
    );
  });

  const today = new Date().toISOString().split("T")[0];
  const future = filtered.filter((s) => s.date >= today);
  const past = filtered.filter((s) => s.date < today);

  // --- Create ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.date || !createForm.time) {
      toast.error("Tiêu đề, ngày và giờ là bắt buộc");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...createForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo thất bại");
      toast.success("Đã tạo lớp học Live!");
      setShowCreate(false);
      setCreateForm({ ...EMPTY_FORM });
      loadSessions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Tạo thất bại");
    } finally {
      setCreating(false);
    }
  };

  // --- Edit ---
  const openEdit = (s: LiveSession) => {
    setEditSession(s);
    setEditForm({
      title: s.title,
      date: s.date,
      time: s.time,
      link: s.link,
      meeting_id: s.meeting_id,
      password: s.password,
      mentor_name: s.mentor_name,
      max_participants: s.max_participants,
      description: s.description,
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSession) return;
    if (!editForm.title || !editForm.date || !editForm.time) {
      toast.error("Tiêu đề, ngày và giờ là bắt buộc");
      return;
    }
    setEditing(true);
    try {
      const res = await fetch("/api/admin/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id: editSession.id, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cập nhật thất bại");
      toast.success("Đã cập nhật lớp học!");
      setEditSession(null);
      loadSessions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setEditing(false);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: deleteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xoá thất bại");
      toast.success("Đã xoá lớp học!");
      setDeleteId(null);
      loadSessions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xoá thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã sao chép ${label}`);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const SessionTable = ({ items, label }: { items: LiveSession[]; label: string }) => (
    <div>
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {label} ({items.length})
      </h2>
      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tiêu đề</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Ngày / Giờ</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Mentor</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">ĐK</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Meeting ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Password</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">Link</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {items.map((s) => {
                const isPast = s.date < today;
                return (
                  <tr key={s.id} className="hover:bg-white/[0.01]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${isPast ? "bg-white/5 text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                          <Video className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.title}</p>
                          {s.description && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{s.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs flex items-center gap-1">
                          <Calendar className="size-3 text-muted-foreground" />
                          {new Date(s.date + "T" + (s.time || "00:00")).toLocaleDateString("vi-VN", {
                            weekday: "short",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {s.time || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{s.mentor_name || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs inline-flex items-center gap-1 ${s.registered >= s.max_participants ? "text-red-400" : "text-emerald-400"}`}>
                        <Users className="size-3" />
                        {s.registered}/{s.max_participants}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {s.meeting_id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-muted-foreground">{s.meeting_id}</span>
                          <button
                            onClick={() => copyToClipboard(s.meeting_id, "Meeting ID")}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Sao chép Meeting ID"
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {s.password ? (
                        <span className="text-xs font-mono text-muted-foreground">{s.password}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell max-w-[180px]">
                      {s.link ? (
                        <a
                          href={s.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline truncate block"
                        >
                          {s.link}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-blue-400 transition-colors"
                          title="Sửa"
                        >
                          <Edit3 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(s.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Xoá"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground p-4 text-center">Không có buổi học nào.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Lớp học Live</h1>
          <p className="text-xs text-muted-foreground">{sessions.length} buổi học</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-primary-foreground hover:brightness-110 text-sm gap-1.5 h-9"
        >
          <Plus className="size-4" />
          Tạo buổi học
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tiêu đề, mentor hoặc Meeting ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Tables */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          <SessionTable items={future} label="Sắp diễn ra" />
          <SessionTable items={past} label="Đã kết thúc" />
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Tạo buổi học Live">
          <form onSubmit={handleCreate} className="space-y-3">
            <Field icon={Video} label="Tiêu đề *">
              <Input
                placeholder="VD: Thần số học - Bài 1"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                className="pl-8 h-9 text-sm"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Ngày *</Label>
                <Input
                  type="date"
                  value={createForm.date}
                  onChange={(e) => setCreateForm((f) => ({ ...f, date: e.target.value }))}
                  className="h-9 text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Giờ *</Label>
                <Input
                  type="time"
                  value={createForm.time}
                  onChange={(e) => setCreateForm((f) => ({ ...f, time: e.target.value }))}
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field icon={Users} label="Số lượng tối đa">
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={createForm.max_participants}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, max_participants: Number(e.target.value) || 20 }))
                  }
                  className="pl-8 h-9 text-sm"
                />
              </Field>
              <Field icon={Users} label="Mentor">
                <Input
                  placeholder="NOOI"
                  value={createForm.mentor_name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, mentor_name: e.target.value }))}
                  className="pl-8 h-9 text-sm"
                />
              </Field>
            </div>
            <Field icon={Video} label="Meeting ID">
              <Input
                placeholder="VD: 123 456 7890"
                value={createForm.meeting_id}
                onChange={(e) => setCreateForm((f) => ({ ...f, meeting_id: e.target.value }))}
                className="pl-8 h-9 text-sm"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field icon={Video} label="Mật khẩu">
                <Input
                  placeholder="VD: 123456"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  className="pl-8 h-9 text-sm"
                />
              </Field>
              <Field icon={Video} label="Link">
                <Input
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={createForm.link}
                  onChange={(e) => setCreateForm((f) => ({ ...f, link: e.target.value }))}
                  className="pl-8 h-9 text-sm"
                />
              </Field>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mô tả</Label>
              <textarea
                placeholder="Mô tả ngắn về buổi học..."
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none h-20"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-9 bg-primary text-primary-foreground hover:brightness-110 text-sm"
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                  Đang tạo...
                </>
              ) : (
                "Tạo buổi học"
              )}
            </Button>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editSession && (
        <Modal
          onClose={() => setEditSession(null)}
          title={`Sửa: ${editSession.title}`}
        >
          <form onSubmit={handleEdit} className="space-y-3">
            <Field icon={Video} label="Tiêu đề *">
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                className="pl-8 h-9 text-sm"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Ngày *</Label>
                <Input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                  className="h-9 text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Giờ *</Label>
                <Input
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))}
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field icon={Users} label="Số lượng tối đa">
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={editForm.max_participants}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, max_participants: Number(e.target.value) || 20 }))
                  }
                  className="pl-8 h-9 text-sm"
                />
              </Field>
              <Field icon={Users} label="Mentor">
                <Input
                  value={editForm.mentor_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, mentor_name: e.target.value }))}
                  className="pl-8 h-9 text-sm"
                />
              </Field>
            </div>
            <Field icon={Video} label="Meeting ID">
              <Input
                value={editForm.meeting_id}
                onChange={(e) => setEditForm((f) => ({ ...f, meeting_id: e.target.value }))}
                className="pl-8 h-9 text-sm"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field icon={Video} label="Mật khẩu">
                <Input
                  value={editForm.password}
                  onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                  className="pl-8 h-9 text-sm"
                />
              </Field>
              <Field icon={Video} label="Link">
                <Input
                  type="url"
                  value={editForm.link}
                  onChange={(e) => setEditForm((f) => ({ ...f, link: e.target.value }))}
                  className="pl-8 h-9 text-sm"
                />
              </Field>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mô tả</Label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none h-20"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-9 bg-primary text-primary-foreground hover:brightness-110 text-sm"
              disabled={editing}
            >
              {editing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </form>
        </Modal>
      )}

      {/* Delete modal */}
      {deleteId && (
        <Modal onClose={() => setDeleteId(null)} title="Xoá buổi học?" borderRed>
          <p className="text-xs text-muted-foreground mb-4">
            Buổi học và tất cả đăng ký liên quan sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="flex-1 h-9 text-sm"
            >
              Huỷ
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white text-sm"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                  Đang xoá...
                </>
              ) : (
                "Xoá"
              )}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- Shared UI components (identical to admin/users/page.tsx) ---

function Modal({
  onClose,
  title,
  children,
  borderRed,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  borderRed?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm bg-[#111] border ${
          borderRed ? "border-red-500/20" : "border-border"
        } rounded-2xl p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-base font-semibold ${borderRed ? "text-red-400" : ""}`}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}
