"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProject, deleteProject } from "../actions";
import ProjectForm from "@/components/admin/ProjectForm";
import { Loader2 } from "lucide-react";

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("projects").select("*").eq("id", id).single();
      setProject(data);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave(formData: FormData) {
    setSaving(true);
    setError("");
    try {
      const result = await updateProject(id, formData);
      if (result.success) router.push("/admin/projects");
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
      if (result.success) router.push("/admin/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setDeleting(false);
    }
  }

  if (loading) return <div className="p-6 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-primary" /></div>;
  if (!project) return <div className="p-6"><p className="text-destructive">Không tìm thấy dự án</p></div>;

  return <ProjectForm initialData={project} onSave={handleSave} onDelete={handleDelete} saving={saving} deleting={deleting} error={error} />;
}
