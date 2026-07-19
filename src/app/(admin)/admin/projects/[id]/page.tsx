"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProject, deleteProject } from "../actions";

interface Project {
  id: string;
  title: string;
  description: string;
  investment_target: number;
  break_even: number;
  revenue_share: string;
  roi_estimate: string;
  status: string;
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      setProject(data);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await updateProject(id, formData);
      if (result.success) {
        router.push("/admin/projects");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Bạn có chắc muốn xóa dự án này?")) return;
    
    setDeleting(true);
    try {
      const result = await deleteProject(id);
      if (result.success) {
        router.push("/admin/projects");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <p className="text-destructive">Không tìm thấy dự án</p>
        <Link href="/admin/projects" className="text-primary hover:underline mt-2 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/admin/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft size={14} />
        Quay lại danh sách
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold tracking-tight">Chỉnh sửa dự án</h1>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Xóa
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Tên dự án *</label>
          <input
            name="title"
            required
            defaultValue={project.title}
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Mô tả</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={project.description}
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Mục tiêu huy động (VNĐ)</label>
            <input
              name="investment_target"
              type="number"
              min="0"
              defaultValue={project.investment_target}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Điểm hòa vốn (VNĐ)</label>
            <input
              name="break_even"
              type="number"
              min="0"
              defaultValue={project.break_even}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Cấu trúc chia lợi nhuận</label>
          <input
            name="revenue_share"
            defaultValue={project.revenue_share}
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">ROI dự kiến (JSON)</label>
          <textarea
            name="roi_estimate"
            rows={3}
            defaultValue={project.roi_estimate}
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Trạng thái</label>
          <select
            name="status"
            defaultValue={project.status}
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="draft">Nháp</option>
            <option value="in_progress">Đang mở đầu tư</option>
            <option value="completed">Hoàn thành</option>
            <option value="archived">Lưu trữ</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/80 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <Link href="/admin/projects" className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors">
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
