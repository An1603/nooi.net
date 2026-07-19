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
    <div className="min-h-screen bg-background font-body relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-n-gold/8 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-n-green/8 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 relative z-10">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-3">Hệ sinh thái NOOI</p>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Cơ Hội Đầu Tư</h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Khám phá và đồng hành cùng các dự án xanh, mang lại giá trị bền vững cho cộng đồng và sinh lời vượt trội.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 rounded-2xl border border-glass-border bg-glass backdrop-blur-md text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-n-green/15 border border-n-green/20 flex items-center justify-center mx-auto mb-5">
              <TrendingUp size={32} className="text-n-green" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Chưa có dự án</h3>
            <p className="text-sm text-muted-foreground">Các dự án sẽ sớm được công bố. Vui lòng quay lại sau.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/app/projects/${project.id}`}
                className="group relative flex flex-col bg-glass backdrop-blur-xl border border-glass-border rounded-2xl overflow-hidden hover:bg-glass-hover hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 shadow-xl"
              >
                <div className="absolute top-4 left-4 z-20">
                  <span className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full border uppercase ${
                    project.status === "in_progress"
                      ? "bg-n-green/20 text-n-green border-n-green/30"
                      : "bg-muted/80 text-muted-foreground border-glass-border"
                  }`}>
                    {project.status === "in_progress" ? "Đang mở" : project.status}
                  </span>
                </div>
                <div className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-glass backdrop-blur-md border border-glass-border flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 text-muted-foreground">
                  <ArrowUpRight size={16} />
                </div>
                <div className="h-32 bg-gradient-to-br from-n-green/20 to-card relative overflow-hidden border-b border-glass-border"></div>
                <div className="p-6 flex-1 flex flex-col relative z-10 -mt-8">
                  <div className="bg-background border border-glass-border w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <DollarSign className="text-primary" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{project.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1 leading-relaxed">{project.description}</p>
                  {(project.investment_target ?? 0) > 0 && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-glass-border">
                      <div>
                        <p className="text-[10px] text-muted-foreground/70 uppercase tracking-widest mb-1">Mục Tiêu</p>
                        <div className="font-bold text-primary text-sm">{new Intl.NumberFormat("vi-VN", { notation: "compact", compactDisplay: "short" }).format(project.investment_target)}</div>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground/70 uppercase tracking-widest mb-1">Hòa Vốn</p>
                        <div className="font-bold text-n-green text-sm">{new Intl.NumberFormat("vi-VN", { notation: "compact", compactDisplay: "short" }).format(project.break_even ?? 0)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
