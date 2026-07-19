"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { createProject } from "../actions";

export default function NewProjectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createProject(formData);
      if (result.success) {
        router.push("/admin/projects");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/admin/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft size={14} />
        Quay lại danh sách
      </Link>

      <h1 className="text-xl font-bold tracking-tight mb-6">Thêm dự án mới</h1>

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
            placeholder="VD: NOOI Forest"
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Mô tả</label>
          <textarea
            name="description"
            rows={4}
            placeholder="Mô tả dự án..."
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Mục tiêu huy động (VNĐ)</label>
            <input
              name="investment_target"
              type="number"
              min="0"
              placeholder="500000000"
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Điểm hòa vốn (VNĐ)</label>
            <input
              name="break_even"
              type="number"
              min="0"
              placeholder="200000000"
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Cấu trúc chia lợi nhuận</label>
          <input
            name="revenue_share"
            placeholder="VD: 60-40"
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">ROI dự kiến (JSON)</label>
          <textarea
            name="roi_estimate"
            rows={3}
            placeholder='[{"year":1,"rate":8},{"year":2,"rate":12},{"year":3,"rate":18}]'
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Trạng thái</label>
          <select
            name="status"
            defaultValue="draft"
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
            {saving ? "Đang lưu..." : "Tạo dự án"}
          </button>
          <Link href="/admin/projects" className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors">
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
