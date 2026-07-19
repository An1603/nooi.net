"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, FolderOpen, TrendingUp, DollarSign, Calendar, ArrowUpRight } from "lucide-react";
import { ProjectCard } from "@/components/content/ProjectCard";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminSupabase = createAdminClient();

  // Lấy dự án của user
  const { data: userProjects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user?.id)
    .order("updated_at", { ascending: false });

  // Lấy dự án đầu tư public
  let investmentProjects: Array<{
    id: string;
    title: string;
    description: string;
    investment_target: number;
    break_even: number;
    status: string;
    created_at: string;
  }> = [];
  try {
    const { data } = await adminSupabase
      .from("projects")
      .select("id, title, description, investment_target, break_even, status, created_at")
      .gt("investment_target", 0)
      .order("created_at", { ascending: false });
    if (data) investmentProjects = data;
  } catch { /* table may not have investment_target column yet */ }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dự án</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Quản lý dự án và khám phá cơ hội đầu tư.
            </p>
          </div>
          <Link
            href="/app/projects/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            <Plus size={16} />
            Dự án mới
          </Link>
        </div>

        {/* Dự án của tôi */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FolderOpen size={18} className="text-primary" />
            Dự án của tôi
          </h2>

          {error && (
            <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/5 text-center">
              <p className="text-sm text-destructive">
                Lỗi khi tải dự án: {error.message}
              </p>
            </div>
          )}

          {!error && (!userProjects || userProjects.length === 0) && (
            <div className="p-12 rounded-xl border border-border bg-card text-center">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Chưa có dự án nào</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Tạo dự án đầu tiên để bắt đầu hành trình sản xuất nội dung với AI.
              </p>
              <Link
                href="/app/projects/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
              >
                <Plus size={16} />
                Tạo dự án đầu tiên
              </Link>
            </div>
          )}

          {userProjects && userProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Dự án đầu tư */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-n-gold" />
            Dự án đầu tư
          </h2>

          {investmentProjects.length === 0 ? (
            <div className="p-8 rounded-xl border border-border bg-card text-center">
              <div className="w-12 h-12 rounded-xl bg-n-gold/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-n-gold" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">Chưa có dự án đầu tư</h3>
              <p className="text-sm text-muted-foreground">Các dự án đầu tư sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {investmentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/app/projects/${project.id}`}
                  className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      project.status === "in_progress"
                        ? "bg-n-green/15 text-n-green border-n-green/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      {project.status === "in_progress" ? "Đang mở" : project.status}
                    </span>
                    <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {project.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DollarSign size={14} className="text-n-gold" />
                      <span className="font-medium">{new Intl.NumberFormat("vi-VN").format(project.investment_target)}đ</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingUp size={14} className="text-n-green" />
                      <span className="font-medium">Hòa vốn: {new Intl.NumberFormat("vi-VN").format(project.break_even)}đ</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
