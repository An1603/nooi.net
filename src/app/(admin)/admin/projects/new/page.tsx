"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "../actions";
import ProjectForm from "@/components/admin/ProjectForm";

export default function NewProjectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(formData: FormData) {
    setSaving(true);
    setError("");
    try {
      const result = await createProject(formData);
      if (result.success) router.push("/admin/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setSaving(false);
    }
  }

  return <ProjectForm onSave={handleSave} saving={saving} error={error} />;
}
