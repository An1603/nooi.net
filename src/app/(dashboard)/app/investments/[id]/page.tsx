"use server";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign, Calendar, TrendingUp, Users, CheckCircle2, Clock, XCircle } from "lucide-react";

interface InvestmentRow {
  id: string;
  project_id: string;
  user_id: string;
  amount: number;
  investment_date: string;
  payment_status: string;
  investor_name: string;
  investor_email: string;
  notes: string;
  created_at: string;
}

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  investment_target: number;
  break_even: number;
  roi_estimate: string;
  revenue_share: string;
}

interface ProgressItem {
  progress_percent: number;
  progress_date: string | null;
  milestones_completed: string[] | null;
  description: string | null;
}

export default async function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: investment } = await supabase
    .from("investments")
    .select("*")
    .eq("id", id)
    .single() as { data: InvestmentRow | null };

  if (!investment) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", investment.project_id)
    .single() as { data: ProjectRow | null };

  let progressData: ProgressItem[] = [];
  try {
    const { data } = await supabase
      .from("project_progress")
      .select("*")
      .eq("project_id", investment.project_id)
      .order("progress_date", { ascending: true });
    if (data) progressData = data;
  } catch { /* table may not exist */ }

  const latestProgress = (progressData?.length ?? 0) > 0
    ? progressData![progressData!.length - 1]
    : null;

  const roiData = project?.roi_estimate
    ? JSON.parse(project.roi_estimate)
    : [{ year: 1, rate: 5 }, { year: 2, rate: 7 }, { year: 3, rate: 10 }];

  const share = investment.amount / (project?.investment_target || 1);

  const STATUS_LABELS: Record<string, string> = {
    pending: "Chờ duyệt",
    paid: "Đã duyệt",
    cancelled: "Đã hủy",
    failed: "Thất bại",
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-n-orange/15 text-n-orange border-n-orange/20",
    paid: "bg-n-green/15 text-n-green border-n-green/20",
    cancelled: "bg-muted text-muted-foreground border-border",
    failed: "bg-destructive/15 text-destructive border-destructive/20",
  };

  const STATUS_ICONS: Record<string, React.ReactNode> = {
    pending: <Clock size={14} />,
    paid: <CheckCircle2 size={14} />,
    cancelled: <XCircle size={14} />,
    failed: <XCircle size={14} />,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/app/investments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={14} />
          Đầu tư của tôi
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project?.title || "Dự án"}</h1>
            <p className="text-muted-foreground mt-1 text-sm">Chi tiết khoản đầu tư</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
            STATUS_COLORS[investment.payment_status] || "bg-muted text-muted-foreground border-border"
          }`}>
            {STATUS_ICONS[investment.payment_status]}
            {STATUS_LABELS[investment.payment_status] || investment.payment_status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-n-gold/15 flex items-center justify-center">
                <DollarSign size={20} className="text-n-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Số tiền đầu tư</p>
                <p className="text-xl font-bold text-primary">{new Intl.NumberFormat("vi-VN").format(investment.amount)} VNĐ</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-n-purple/15 flex items-center justify-center">
                <TrendingUp size={20} className="text-n-purple" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cổ phần dự kiến</p>
                <p className="text-xl font-bold text-foreground">{(share * 100).toFixed(2)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-n-teal/15 flex items-center justify-center">
                <Calendar size={20} className="text-n-teal" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ngày đầu tư</p>
                <p className="text-sm font-semibold text-foreground">{investment.investment_date ? new Date(investment.investment_date).toLocaleDateString("vi-VN") : "N/A"}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-n-green/15 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-n-green" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tiến độ dự án</p>
                <p className="text-sm font-semibold text-foreground">{latestProgress ? `${latestProgress.progress_percent}%` : "Chưa cập nhật"}</p>
              </div>
            </div>
          </div>
        </div>

        {latestProgress && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Tiến độ mới nhất</h3>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-n-gold to-n-green"
                  style={{ width: `${Math.min(latestProgress.progress_percent, 100)}%` }}
                />
              </div>
              <span className="text-sm font-bold text-n-gold">{latestProgress.progress_percent}%</span>
            </div>
            {latestProgress.description && <p className="text-sm text-muted-foreground">{latestProgress.description}</p>}
          </div>
        )}

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

        {project?.revenue_share && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Cấu trúc chia lợi nhuận</h3>
            <p className="text-sm text-muted-foreground">{project.revenue_share}</p>
          </div>
        )}
      </div>
    </div>
  );
}
