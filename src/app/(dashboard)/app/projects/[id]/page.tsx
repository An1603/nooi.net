"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign, Calendar, TrendingUp, Users, CheckCircle2 } from "lucide-react";

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  status: string;
  investment_target: number;
  break_even: number;
  roi_estimate: string;
  revenue_share: string;
  created_at: string;
}

interface ProgressItem {
  progress_percent: number;
  progress_date: string | null;
  milestones_completed: string[] | null;
  description: string | null;
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminSupabase = createAdminClient();
  const userSupabase = await createClient();

  // Lấy project
  const { data: project } = await adminSupabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single() as { data: ProjectRow | null };

  if (!project) notFound();

  // Lấy investments
  let investments: Array<{ amount: number; investor_name: string; investment_date: string }> = [];
  try {
    const { data } = await adminSupabase
      .from("investments")
      .select("amount, investor_name, investment_date")
      .eq("project_id", project.id)
      .eq("payment_status", "paid")
      .order("investment_date", { ascending: false });
    if (data) investments = data;
  } catch { /* table may not exist */ }

  // Lấy progress
  let progressData: ProgressItem[] = [];
  try {
    const { data } = await adminSupabase
      .from("project_progress")
      .select("*")
      .eq("project_id", project.id)
      .order("progress_date", { ascending: true });
    if (data) progressData = data;
  } catch { /* table may not exist */ }

  const totalRaised = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const target = project.investment_target || 0;
  const percentage = target > 0 ? Math.round((totalRaised / target) * 100) : 0;

  const roiData = project.roi_estimate
    ? JSON.parse(project.roi_estimate)
    : [{ year: 1, rate: 5 }, { year: 2, rate: 7 }, { year: 3, rate: 10 }];

  const latestProgress = (progressData?.length ?? 0) > 0
    ? progressData![progressData!.length - 1]
    : null;

  // Kiểm tra user đã đầu tư chưa
  const { data: { user } } = await userSupabase.auth.getUser();
  let userInvestment: { id: string } | null = null;
  if (user) {
    try {
      const { data } = await userSupabase
        .from("investments")
        .select("id")
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .limit(1)
        .single();
      userInvestment = data;
    } catch { /* no investment */ }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={14} />
          Danh sách dự án
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
            <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full border ${
              project.status === "in_progress"
                ? "bg-n-green/15 text-n-green border-n-green/20"
                : "bg-muted text-muted-foreground border-border"
            }`}>
              {project.status === "in_progress" ? "Đang mở đầu tư" : project.status}
            </span>
          </div>
          {project.status === "in_progress" && (
            userInvestment ? (
              <Link href={`/app/investments/${userInvestment.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-n-green/15 text-n-green font-medium hover:bg-n-green/25 transition-all">
                <CheckCircle2 size={16} />
                Đã đầu tư
              </Link>
            ) : (
              <Link href={`/app/invest/${project.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 transition-all">
                <DollarSign size={16} />
                Đăng ký đầu tư
              </Link>
            )
          )}
        </div>

        {/* Mô tả */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Giới thiệu dự án</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{project.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-n-gold/15 flex items-center justify-center mb-2">
              <DollarSign size={16} className="text-n-gold" />
            </div>
            <p className="text-xs text-muted-foreground">Mục tiêu</p>
            <p className="text-sm font-bold text-foreground">{new Intl.NumberFormat("vi-VN").format(target)}đ</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-n-green/15 flex items-center justify-center mb-2">
              <TrendingUp size={16} className="text-n-green" />
            </div>
            <p className="text-xs text-muted-foreground">Đã huy động</p>
            <p className="text-sm font-bold text-foreground">{new Intl.NumberFormat("vi-VN").format(totalRaised)}đ</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-n-purple/15 flex items-center justify-center mb-2">
              <Users size={16} className="text-n-purple" />
            </div>
            <p className="text-xs text-muted-foreground">Nhà đầu tư</p>
            <p className="text-sm font-bold text-foreground">{investments.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-n-teal/15 flex items-center justify-center mb-2">
              <Calendar size={16} className="text-n-teal" />
            </div>
            <p className="text-xs text-muted-foreground">Hòa vốn</p>
            <p className="text-sm font-bold text-foreground">{new Intl.NumberFormat("vi-VN").format(project.break_even)}đ</p>
          </div>
        </div>

        {/* Funding Progress */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Tiến độ huy động</h3>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-n-gold to-n-green"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-n-gold">{percentage}%</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{new Intl.NumberFormat("vi-VN").format(totalRaised)}đ đã huy động</span>
            <span>Mục tiêu: {new Intl.NumberFormat("vi-VN").format(target)}đ</span>
          </div>
        </div>

        {/* ROI */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Dự kiến lợi nhuận (ROI)</h3>
          <div className="grid grid-cols-3 gap-3">
            {roiData.map((roi: { year: number; rate: number }, index: number) => (
              <div key={index} className="text-center p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Năm {roi.year}</p>
                <p className="text-lg font-bold text-n-green">{roi.rate}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        {latestProgress && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Tiến độ dự án</h3>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-n-purple to-n-teal"
                  style={{ width: `${Math.min(latestProgress.progress_percent, 100)}%` }}
                />
              </div>
              <span className="text-sm font-bold text-n-purple">{latestProgress.progress_percent}%</span>
            </div>
            {latestProgress.description && <p className="text-sm text-muted-foreground">{latestProgress.description}</p>}
          </div>
        )}

        {/* Revenue share */}
        {project.revenue_share && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Cấu trúc chia lợi nhuận</h3>
            <p className="text-sm text-muted-foreground">{project.revenue_share}</p>
          </div>
        )}
      </div>
    </div>
  );
}
