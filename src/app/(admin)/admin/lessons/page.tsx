"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, Pencil, Play, Sparkles, Search, X, Loader2,
  Eye, EyeOff, GripVertical,
} from "lucide-react";
import { toast } from "sonner";

// ─── Level definitions matching hoc-tap/page.tsx ──────────────────────────
const LEVELS = [
  { id: 1, name: "Người mới", desc: "Bắt đầu hành trình chuyển hóa" },
  { id: 2, name: "Người tìm kiếm", desc: "Hiểu rõ bản thân" },
  { id: 3, name: "Học viên", desc: "Xây nền tảng vững chắc" },
  { id: 4, name: "Người thực hành", desc: "Chuyển hóa hàng ngày" },
  { id: 5, name: "Người đồng hành", desc: "Lan tỏa giá trị" },
  { id: 6, name: "Mentor", desc: "Hướng dẫn người khác" },
  { id: 7, name: "Master Mentor", desc: "Làm chủ hành trình" },
];

const LEVEL_NAMES: Record<number, string> = {};
LEVELS.forEach((l) => { LEVEL_NAMES[l.id] = l.name; });

const TYPE_OPTIONS = [
  { value: "video", label: "📹 Video" },
  { value: "practice", label: "✏️ Thực hành" },
];

interface Lesson {
  id: string;
  level_id: number;
  lesson_id: string;
  title: string;
  type: string;
  duration: string;
  youtube_id: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  stats_total: number;
  stats_completed: number;
  created_at: string;
}

interface LessonForm {
  level_id: number;
  lesson_id: string;
  title: string;
  type: string;
  duration: string;
  youtube_id: string;
  description: string;
  sort_order: number;
}

const EMPTY_FORM: LessonForm = {
  level_id: 1,
  lesson_id: "",
  title: "",
  type: "video",
  duration: "00:00",
  youtube_id: "",
  description: "",
  sort_order: 0,
};

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<LessonForm>({ ...EMPTY_FORM });
  const [creating, setCreating] = useState(false);

  // Edit
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [editForm, setEditForm] = useState<LessonForm>({ ...EMPTY_FORM });
  const [editing, setEditing] = useState(false);

  // Delete
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadLessons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lessons");
      const data = await res.json();
      setLessons(data.lessons ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  // ─── Filter ──────────────────────────────────────────────────────────
  const filtered = lessons.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      l.lesson_id.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      (LEVEL_NAMES[l.level_id] || "").toLowerCase().includes(q)
    );
  });

  // Group by level
  const grouped = LEVELS.map((level) => ({
    ...level,
    lessons: filtered
      .filter((l) => l.level_id === level.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  // ─── Create ──────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.lesson_id.trim()) {
      toast.error("Tiêu đề và ID bài học là bắt buộc");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...createForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo thất bại");
      toast.success("✅ Đã tạo bài học!");
      setShowCreate(false);
      setCreateForm({ ...EMPTY_FORM, level_id: createForm.level_id });
      loadLessons();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Tạo thất bại");
    } finally {
      setCreating(false);
    }
  };

  // ─── Edit ────────────────────────────────────────────────────────────
  const openEdit = (lesson: Lesson) => {
    setEditLesson(lesson);
    setEditForm({
      level_id: lesson.level_id,
      lesson_id: lesson.lesson_id,
      title: lesson.title,
      type: lesson.type,
      duration: lesson.duration,
      youtube_id: lesson.youtube_id || "",
      description: lesson.description || "",
      sort_order: lesson.sort_order,
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLesson) return;
    if (!editForm.title.trim() || !editForm.lesson_id.trim()) {
      toast.error("Tiêu đề và ID bài học là bắt buộc");
      return;
    }
    setEditing(true);
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id: editLesson.id, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cập nhật thất bại");
      toast.success("✅ Đã cập nhật bài học!");
      setEditLesson(null);
      loadLessons();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setEditing(false);
    }
  };

  // ─── Toggle active ───────────────────────────────────────────────────
  const toggleActive = async (lesson: Lesson) => {
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id: lesson.id, is_active: !lesson.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cập nhật thất bại");
      toast.success(lesson.is_active ? "⛔ Đã ẩn bài học" : "👁️ Đã hiện bài học");
      loadLessons();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại");
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteLesson) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: deleteLesson.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xoá thất bại");
      toast.success("🗑️ Đã xoá bài học!");
      setDeleteLesson(null);
      loadLessons();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xoá thất bại");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Helper ──────────────────────────────────────────────────────────
  const typeIcon = (t: string) =>
    t === "video"
      ? <Play className="size-3.5 text-red-400" />
      : <Sparkles className="size-3.5 text-purple-400" />;

  const typeBadge = (t: string) =>
    t === "video"
      ? "bg-red-500/10 text-red-400"
      : "bg-purple-500/10 text-purple-400";

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Bài giảng</h1>
          <p className="text-xs text-muted-foreground">
            {lessons.length} bài học trên {LEVELS.length} cấp độ
          </p>
        </div>
        <Button
          onClick={() => { setShowCreate(true); setCreateForm({ ...EMPTY_FORM, level_id: 1 }); }}
          className="bg-primary text-primary-foreground hover:brightness-110 text-sm gap-1.5 h-9"
        >
          <Plus className="size-4" /> Thêm bài học
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tiêu đề, ID, cấp độ..."
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

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-8">
          <p className="text-xs text-muted-foreground text-center">
            {search ? "Không tìm thấy bài học nào." : "Chưa có bài học nào. Hãy thêm bài học mới!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((level) => {
            if (level.lessons.length === 0) return null;
            return (
              <div
                key={level.id}
                className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden"
              >
                {/* Level header */}
                <div className="px-5 py-3 border-b border-border/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Level {level.id}
                    </span>
                    <h2 className="text-sm font-semibold">{level.name}</h2>
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      {level.desc}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {level.lessons.length} bài
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/10">
                        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground">ID</th>
                        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground">Tiêu đề</th>
                        <th className="text-center px-4 py-2 text-[11px] font-medium text-muted-foreground hidden sm:table-cell">Loại</th>
                        <th className="text-center px-4 py-2 text-[11px] font-medium text-muted-foreground hidden md:table-cell">TG</th>
                        <th className="text-center px-4 py-2 text-[11px] font-medium text-muted-foreground hidden lg:table-cell">YouTube</th>
                        <th className="text-center px-4 py-2 text-[11px] font-medium text-muted-foreground hidden xl:table-cell">Thứ tự</th>
                        <th className="text-center px-4 py-2 text-[11px] font-medium text-muted-foreground hidden lg:table-cell">Học viên</th>
                        <th className="text-center px-4 py-2 text-[11px] font-medium text-muted-foreground">Trạng thái</th>
                        <th className="text-right px-4 py-2 text-[11px] font-medium text-muted-foreground">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/5">
                      {level.lessons.map((lesson) => (
                        <tr
                          key={lesson.id}
                          className={`hover:bg-white/[0.02] transition-colors ${
                            !lesson.is_active ? "opacity-50" : ""
                          }`}
                        >
                          <td className="px-4 py-2.5">
                            <code className="text-[11px] font-mono text-muted-foreground">
                              {lesson.lesson_id}
                            </code>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${typeBadge(lesson.type)}`}
                              >
                                {typeIcon(lesson.type)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate max-w-[200px]">
                                  {lesson.title}
                                </p>
                                {lesson.description && (
                                  <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center hidden sm:table-cell">
                            <span className={`text-[11px] px-1.5 py-0.5 rounded ${typeBadge(lesson.type)}`}>
                              {lesson.type === "video" ? "Video" : "Thực hành"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center hidden md:table-cell">
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {lesson.duration}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center hidden lg:table-cell">
                            {lesson.youtube_id ? (
                              <span className="text-[11px] font-mono text-blue-400 truncate inline-block max-w-[100px]">
                                {lesson.youtube_id}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center hidden xl:table-cell">
                            <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                              <GripVertical className="size-3" />
                              {lesson.sort_order}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center hidden lg:table-cell">
                            <span className="text-[11px] text-muted-foreground">
                              {lesson.stats_total > 0
                                ? `${lesson.stats_completed}/${lesson.stats_total}`
                                : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              onClick={() => toggleActive(lesson)}
                              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                                lesson.is_active
                                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-muted/30 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                              }`}
                              title={lesson.is_active ? "Nhấn để ẩn" : "Nhấn để hiện"}
                            >
                              {lesson.is_active ? (
                                <><Eye className="size-3" /> Hiện</>
                              ) : (
                                <><EyeOff className="size-3" /> Ẩn</>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(lesson)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-blue-400 transition-colors"
                                title="Sửa"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteLesson(lesson)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                title="Xoá"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create Modal ─────────────────────────────────────────────── */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Thêm bài học">
          <form onSubmit={handleCreate} className="space-y-3">
            {/* Level */}
            <div className="space-y-1">
              <Label className="text-xs">Cấp độ</Label>
              <select
                value={createForm.level_id}
                onChange={(e) => setCreateForm({ ...createForm, level_id: Number(e.target.value) })}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
              >
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    Level {l.id} — {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lesson ID */}
            <div className="space-y-1">
              <Label className="text-xs">ID bài học *</Label>
              <Input
                placeholder="VD: 1-6"
                value={createForm.lesson_id}
                onChange={(e) => setCreateForm({ ...createForm, lesson_id: e.target.value })}
                className="h-9 text-sm"
                required
              />
              <p className="text-[11px] text-muted-foreground">Mã định danh duy nhất, VD: 1-6, 2-5</p>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs">Tiêu đề *</Label>
              <Input
                placeholder="VD: Thiền căn bản"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="h-9 text-sm"
                required
              />
            </div>

            {/* Type + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Loại</Label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Thời lượng</Label>
                <Input
                  placeholder="15:00"
                  value={createForm.duration}
                  onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* YouTube ID */}
            {createForm.type === "video" && (
              <div className="space-y-1">
                <Label className="text-xs">YouTube ID</Label>
                <Input
                  placeholder="dQw4w9WgXcQ"
                  value={createForm.youtube_id}
                  onChange={(e) => setCreateForm({ ...createForm, youtube_id: e.target.value })}
                  className="h-9 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">Phần ID sau v= trong URL YouTube</p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-xs">Mô tả</Label>
              <Input
                placeholder="Mô tả ngắn về bài học..."
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            {/* Sort order */}
            <div className="space-y-1">
              <Label className="text-xs">Thứ tự</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={createForm.sort_order}
                onChange={(e) => setCreateForm({ ...createForm, sort_order: Number(e.target.value) })}
                className="h-9 text-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-9 bg-primary text-primary-foreground hover:brightness-110 text-sm"
              disabled={creating}
            >
              {creating ? <><Loader2 className="size-3.5 animate-spin mr-1" />Đang tạo...</> : "Tạo bài học"}
            </Button>
          </form>
        </Modal>
      )}

      {/* ─── Edit Modal ───────────────────────────────────────────────── */}
      {editLesson && (
        <Modal
          onClose={() => setEditLesson(null)}
          title={`Sửa: ${editLesson.title}`}
        >
          <form onSubmit={handleEdit} className="space-y-3">
            {/* Level */}
            <div className="space-y-1">
              <Label className="text-xs">Cấp độ</Label>
              <select
                value={editForm.level_id}
                onChange={(e) => setEditForm({ ...editForm, level_id: Number(e.target.value) })}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
              >
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    Level {l.id} — {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lesson ID */}
            <div className="space-y-1">
              <Label className="text-xs">ID bài học *</Label>
              <Input
                placeholder="VD: 1-6"
                value={editForm.lesson_id}
                onChange={(e) => setEditForm({ ...editForm, lesson_id: e.target.value })}
                className="h-9 text-sm"
                required
              />
            </div>

            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs">Tiêu đề *</Label>
              <Input
                placeholder="VD: Thiền căn bản"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="h-9 text-sm"
                required
              />
            </div>

            {/* Type + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Loại</Label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Thời lượng</Label>
                <Input
                  placeholder="15:00"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* YouTube ID */}
            {editForm.type === "video" && (
              <div className="space-y-1">
                <Label className="text-xs">YouTube ID</Label>
                <Input
                  placeholder="dQw4w9WgXcQ"
                  value={editForm.youtube_id}
                  onChange={(e) => setEditForm({ ...editForm, youtube_id: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-xs">Mô tả</Label>
              <Input
                placeholder="Mô tả ngắn về bài học..."
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            {/* Sort order */}
            <div className="space-y-1">
              <Label className="text-xs">Thứ tự</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={editForm.sort_order}
                onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })}
                className="h-9 text-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-9 bg-primary text-primary-foreground hover:brightness-110 text-sm"
              disabled={editing}
            >
              {editing ? <><Loader2 className="size-3.5 animate-spin mr-1" />Đang lưu...</> : "Lưu thay đổi"}
            </Button>
          </form>
        </Modal>
      )}

      {/* ─── Delete Modal ─────────────────────────────────────────────── */}
      {deleteLesson && (
        <Modal onClose={() => setDeleteLesson(null)} title="Xoá bài học?" borderRed>
          <p className="text-xs text-muted-foreground mb-4">
            Hành động này sẽ xoá bài học <strong className="text-foreground">{deleteLesson.title}</strong> ({deleteLesson.lesson_id})
            và tất cả dữ liệu tiến độ liên quan. Không thể hoàn tác.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteLesson(null)}
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
                <><Loader2 className="size-3.5 animate-spin mr-1" />Đang xoá...</>
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

// ─── Modal component ──────────────────────────────────────────────────────
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
