"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { TrendingUp, DollarSign, ArrowUpRight } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  investment_target: number;
  break_even: number;
  status: string;
  created_at: string;
}

export default async function ProjectsPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const allProjects = (data || []) as unknown as Project[];

  // Lọc dự án đầu tư (có investment_target > 0), nếu không có thì hiển thị tất cả
  const investmentProjects = allProjects.filter((p) => (p.investment_target ?? 0) > 0);
  const projects = investmentProjects.length > 0 ? investmentProjects : allProjects;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dự án</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Khám phá và đăng ký đầu tư vào các dự án trong hệ sinh thái NOOI.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 rounded-xl border border-border bg-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-n-gold/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={32} className="text-n-gold" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có dự án</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Các dự án sẽ hiển thị tại đây khi được admin thêm vào hệ thống.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
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

                {(project.investment_target ?? 0) > 0 && (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DollarSign size={14} className="text-n-gold" />
                      <span className="font-medium">{new Intl.NumberFormat("vi-VN").format(project.investment_target)}đ</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingUp size={14} className="text-n-green" />
                      <span className="font-medium">Hòa vốn: {new Intl.NumberFormat("vi-VN").format(project.break_even ?? 0)}đ</span>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
