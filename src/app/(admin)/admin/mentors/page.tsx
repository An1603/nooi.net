"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Star, Users, Award, Briefcase, ToggleLeft, Edit3, Plus, Loader2, Search, X,
} from "lucide-react";
import { toast } from "sonner";

interface Mentor {
  id: string;
  user_id: string;
  full_name: string;
  title: string;
  bio: string;
  specialties: string[];
  experience_years: number;
  rating: number;
  review_count: number;
  is_active: boolean;
  mentee_count: number;
  created_at: string;
}

export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit
  const [editMentor, setEditMentor] = useState<Mentor | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editSpecialties, setEditSpecialties] = useState("");
  const [editExperienceYears, setEditExperienceYears] = useState(0);
  const [editing, setEditing] = useState(false);

  // Toggle
  const [toggling, setToggling] = useState<string | null>(null);

  const loadMentors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mentors");
      const data = await res.json();
      setMentors(data.mentors ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  const filtered = mentors.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.user_id.toLowerCase().includes(q)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId || !newTitle) {
      toast.error("User ID và Title là bắt buộc");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", user_id: newUserId, title: newTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo thất bại");
      toast.success("Đã tạo mentor!");
      setShowCreate(false);
      setNewUserId("");
      setNewTitle("");
      loadMentors();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Tạo thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (mentor: Mentor) => {
    setToggling(mentor.id);
    try {
      const res = await fetch("/api/admin/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_active",
          id: mentor.id,
          is_active: !mentor.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chuyển đổi thất bại");
      toast.success(mentor.is_active ? "Đã vô hiệu hoá mentor" : "Đã kích hoạt mentor");
      loadMentors();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Chuyển đổi thất bại");
    } finally {
      setToggling(null);
    }
  };

  const openEdit = (m: Mentor) => {
    setEditMentor(m);
    setEditTitle(m.title);
    setEditBio(m.bio || "");
    setEditSpecialties((m.specialties ?? []).join(", "));
    setEditExperienceYears(m.experience_years || 0);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMentor) return;
    setEditing(true);
    try {
      const specialties = editSpecialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: editMentor.id,
          title: editTitle,
          bio: editBio,
          specialties,
          experience_years: editExperienceYears,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cập nhật thất bại");
      toast.success("Đã cập nhật mentor!");
      setEditMentor(null);
      loadMentors();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Quản lý Mentor</h1>
          <p className="text-xs text-muted-foreground">
            {mentors.length} mentors
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-primary-foreground hover:brightness-110 text-sm gap-1.5 h-9"
        >
          <Plus className="size-4" /> Thêm mentor
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, title hoặc ID..."
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

      {/* Table */}
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Mentor
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Chuyên môn
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    <Briefcase className="size-3 inline mr-1" />
                    KN
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    <Star className="size-3 inline mr-1" />
                    ĐG
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    <Users className="size-3 inline mr-1" />
                    Mentee
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Trạng thái
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.01]">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                          <Award className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {m.full_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {m.user_id.slice(0, 10)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground max-w-[140px] truncate block">
                        {m.title || "—"}
                      </span>
                    </td>

                    {/* Specialties */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex gap-1 flex-wrap max-w-[180px]">
                        {(m.specialties ?? []).length > 0 ? (
                          (m.specialties ?? []).slice(0, 2).map((s, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            —
                          </span>
                        )}
                        {(m.specialties ?? []).length > 2 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                            +{m.specialties.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Experience */}
                    <td className="px-4 py-3 hidden lg:table-cell text-center">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {m.experience_years || 0}y
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3 hidden lg:table-cell text-center">
                      <span className="inline-flex items-center gap-1 text-xs tabular-nums">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        {m.rating.toFixed(1)}
                        <span className="text-[10px] text-muted-foreground">
                          ({m.review_count})
                        </span>
                      </span>
                    </td>

                    {/* Mentees */}
                    <td className="px-4 py-3 hidden lg:table-cell text-center">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {m.mentee_count}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 hidden sm:table-cell text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          m.is_active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            m.is_active ? "bg-emerald-400" : "bg-red-400"
                          }`}
                        />
                        {m.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(m)}
                          disabled={toggling === m.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            m.is_active
                              ? "hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                              : "hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400"
                          }`}
                          title={m.is_active ? "Vô hiệu hoá" : "Kích hoạt"}
                        >
                          {toggling === m.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <ToggleLeft className="size-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(m)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-blue-400 transition-colors"
                          title="Sửa"
                        >
                          <Edit3 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground p-4 text-center">
              Không tìm thấy mentor.
            </p>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Thêm mentor mới">
          <form onSubmit={handleCreate} className="space-y-3">
            <Field icon={Award} label="User ID *">
              <Input
                placeholder="UUID của user"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="pl-8 h-9 text-sm"
                required
              />
            </Field>
            <Field icon={Briefcase} label="Title *">
              <Input
                placeholder="VD: Chuyên gia Thần số học"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="pl-8 h-9 text-sm"
                required
              />
            </Field>
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
                "Tạo mentor"
              )}
            </Button>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editMentor && (
        <Modal
          onClose={() => setEditMentor(null)}
          title={`Sửa: ${editMentor.full_name}`}
        >
          <form onSubmit={handleEdit} className="space-y-3">
            <Field icon={Briefcase} label="Title">
              <Input
                placeholder="VD: Chuyên gia Thần số học"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </Field>
            <Field icon={Award} label="Chuyên môn (cách nhau bằng dấu phẩy)">
              <Input
                placeholder="VD: Thần số học, Tử Vi, Chiêm tinh"
                value={editSpecialties}
                onChange={(e) => setEditSpecialties(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </Field>
            <div className="space-y-1">
              <Label className="text-xs">Số năm kinh nghiệm</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={editExperienceYears}
                onChange={(e) =>
                  setEditExperienceYears(Number(e.target.value))
                }
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bio</Label>
              <textarea
                placeholder="Mô tả về mentor..."
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
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
    </div>
  );
}

/* ── Shared UI components ── */

function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#111] border border-border rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">{title}</h2>
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
