/* eslint-disable @next/next/no-img-element */
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Calendar, DollarSign, ArrowUpRight, CheckCircle2, TrendingUp, Users } from "lucide-react";

interface ProjectRow {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  investment_target?: number | null;
  break_even?: number | null;
  revenue_share?: string | null;
  roi_estimate?: string | null;
  slug?: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  in_progress: "Đang mở",
  completed: "Hoàn thành",
  archived: "Lưu trữ",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-n-green/15 text-n-green",
  completed: "bg-n-teal/15 text-n-teal",
  archived: "bg-muted text-muted-foreground",
};

export default async function PublicProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();

  let project: ProjectRow | null = null;

  // Thử theo id (UUID)
  const { data: byId } = await supabase
    .from("projects")
    .select("*")
    .eq("id", slug)
    .single();

  if (byId) {
    project = byId as unknown as ProjectRow;
  } else {
    // Thử theo slug
    const { data: bySlug } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .single();
    if (bySlug) project = bySlug as unknown as ProjectRow;
  }

  if (!project || project.status !== "in_progress") {
    if (project && project.status !== "in_progress") {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center">
            <h1 className="text-4xl font-bold text-destructive mb-4">Dự án đã kết thúc</h1>
            <p className="text-muted-foreground text-lg">{project.title}</p>
            <Link href="/app/projects" className="mt-6 inline-block px-6 py-3 bg-primary rounded-lg text-primary-foreground">
              Quay lại danh sách dự án
            </Link>
          </div>
        </div>
      );
    }
    notFound();
  }

  let investments: Array<{amount: number; investment_date: string; investor_name: string; investor_email: string}> = [];
  try {
    const { data } = await supabase
      .from("investments")
      .select("amount, investment_date, investor_name, investor_email")
      .eq("project_id", project.id)
      .eq("payment_status", "paid")
      .order("investment_date", { ascending: false });
    if (data) investments = data;
  } catch { /* investments table may not exist yet */ }

  const totalRaised = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const target = project.investment_target || 0;
  const percentage = target > 0 ? Math.round((totalRaised / target) * 100) : 0;
  const progressColor = percentage >= 100 ? "n-green" : percentage >= 75 ? "n-teal" : percentage >= 50 ? "n-gold" : "n-orange";

  const roiData = project.roi_estimate 
    ? JSON.parse(project.roi_estimate) 
    : [{ year: 1, rate: 5 }, { year: 2, rate: 7 }, { year: 3, rate: 10 }];

  let progressData: Array<{progress_percent: number; progress_date: string | null; milestones_completed: string[] | null; description: string | null}> = [];
  try {
    const { data } = await supabase
      .from("project_progress")
      .select("*")
      .eq("project_id", project.id)
      .order("progress_date", { ascending: true });
    if (data) progressData = data;
  } catch { /* project_progress table may not exist yet */ }

  const latestProgress = (progressData?.length ?? 0) > 0 
    ? progressData![progressData!.length - 1] 
    : { progress_percent: 0, progress_date: null, milestones_completed: [] as string[], description: "" };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-n-purple/10 blur-3xl opacity-40" />
        <div className="max-w-6xl mx-auto px-4 py-16 relative">
          <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft size={14} />
            Danh sách dự án
          </Link>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status] || STATUS_COLORS.draft}`}>
                {STATUS_LABELS[project.status] || project.status}
              </span>
              <h1 className="text-4xl font-bold text-foreground mt-3 mb-2">{project.title}</h1>
              <p className="text-muted-foreground text-base max-w-2xl">{project.description}</p>
            </div>
            <Link
              href={`/invest/${project.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/80 transition-all hover:scale-105 shrink-0"
            >
              <DollarSign size={18} />
              Đăng ký đầu tư
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-n-gold" />
                <span className="text-xs text-muted-foreground">Mục tiêu</span>
              </div>
              <p className="text-lg font-bold text-foreground">{new Intl.NumberFormat("vi-VN").format(target)}đ</p>
            </div>
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-n-green" />
                <span className="text-xs text-muted-foreground">Đã huy động</span>
              </div>
              <p className="text-lg font-bold text-foreground">{new Intl.NumberFormat("vi-VN").format(totalRaised)}đ</p>
            </div>
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-n-purple" />
                <span className="text-xs text-muted-foreground">Nhà đầu tư</span>
              </div>
              <p className="text-lg font-bold text-foreground">{investments.length}</p>
            </div>
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-n-teal" />
                <span className="text-xs text-muted-foreground">Hòa vốn</span>
              </div>
              <p className="text-lg font-bold text-foreground">{new Intl.NumberFormat("vi-VN").format(project.break_even || 0)}đ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Funding Progress */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-base font-semibold text-foreground mb-4">Tiến độ huy động vốn</h2>
              <div className="flex items-center gap-4 mb-2">
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r from-n-gold to-${progressColor}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-n-gold">{percentage}%</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                <span>{new Intl.NumberFormat("vi-VN").format(totalRaised)}đ đã huy động</span>
                <span>Mục tiêu: {new Intl.NumberFormat("vi-VN").format(target)}đ</span>
              </div>
            </div>

            {/* ROI Estimate */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-base font-semibold text-foreground mb-4">Dự kiến lợi nhuận (ROI)</h2>
              <div className="grid grid-cols-3 gap-4">
                {roiData.map((roi: { year: number; rate: number }, index: number) => (
                  <div key={index} className="text-center p-4 bg-muted rounded-xl">
                    <p className="text-xs text-muted-foreground">Năm {roi.year}</p>
                    <p className="text-2xl font-bold text-n-green">{roi.rate}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Timeline */}
            {progressData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-base font-semibold text-foreground mb-4">Lịch trình tiến độ</h2>
                <div className="space-y-4">
                  {progressData.map((progress, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-n-purple/15 flex items-center justify-center shrink-0 mt-1">
                        <CheckCircle2 size={16} className="text-n-purple" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-foreground">Tiến độ {progress.progress_percent}%</span>
                          <span className="text-xs text-muted-foreground">
                            {progress.progress_date ? new Date(progress.progress_date).toLocaleDateString("vi-VN") : ""}
                          </span>
                        </div>
                        {progress.description && <p className="text-sm text-muted-foreground">{progress.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* ROI Quick View */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Chỉ số tài chính</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Điểm hòa vốn</span>
                  <span className="text-sm font-medium text-foreground">{new Intl.NumberFormat("vi-VN").format(project.break_even || 0)}đ</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Cổ phần</span>
                  <span className="text-sm font-medium text-foreground">{project.revenue_share || "60-40"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">ROI năm 1</span>
                  <span className="text-sm font-medium text-n-green">{roiData[0]?.rate || 5}%</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-primary/10 to-n-purple/10 border border-primary/20 rounded-xl p-6">
              <h3 className="text-base font-semibold text-foreground mb-2">Đăng ký đầu tư</h3>
              <p className="text-sm text-muted-foreground mb-4">Tham gia đầu tư vào dự án này và nhận lợi nhuận hấp dẫn.</p>
              <Link
                href={`/invest/${project.id}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 transition-all"
              >
                <DollarSign size={16} />
                Đầu tư ngay
              </Link>
            </div>

            {/* Recent investors */}
            {investments.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Nhà đầu tư gần đây</h3>
                <div className="space-y-3">
                  {investments.slice(0, 5).map((inv, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-n-gold/15 flex items-center justify-center">
                        <span className="text-xs font-bold text-n-gold">{(inv.investor_name || "N")[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{inv.investor_name || "Nhà đầu tư"}</p>
                        <p className="text-xs text-muted-foreground">{new Intl.NumberFormat("vi-VN").format(inv.amount)}đ</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
