/* eslint-disable @next/next/no-img-element */
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Calendar, DollarSign, ArrowUpRight, CheckCircle2 } from "lucide-react";

const STATUS_COLORS = {
  draft: "bg-muted text-muted-foreground border-muted-foreground/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  archived: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_LABELS = {
  draft: "Bản nháp",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  archived: "Đã lưu trữ",
};

export default async function PublicProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // Query theo id trước (UUID từ URL), nếu không có thì thử theo slug
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
    // Thử theo slug (nếu bảng có cột slug)
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
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center">
            <h1 className="text-4xl font-bold text-red-400 mb-4">Dự án đã kết thúc</h1>
            <p className="text-gray-300 text-lg">{String(project.title)}</p>
            <Link href="/projects" className="mt-6 inline-block px-6 py-3 bg-primary rounded-lg">
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
  const progressColor = percentage >= 100 ? "emerald" : percentage >= 75 ? "blue" : percentage >= 50 ? "amber" : "red";

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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl opacity-30" />
        
        <div className="max-w-6xl mx-auto px-4 py-20 relative">
          <div className="flex items-start gap-4 mb-8">
            <Link 
              href="/projects" 
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              Danh sách dự án
            </Link>
            <span 
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                STATUS_COLORS[project.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.draft
              }`}
            >
              {STATUS_LABELS[project.status as keyof typeof STATUS_LABELS] || project.status}
            </span>
          </div>

          <h1 className="text-5xl font-bold mb-6 leading-tight">
            {project.title}
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl">
            {project.description || "Xem thêm thông tin chi tiết về dự án."}
          </p>

          {/* Investment Progress */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Raised Amount */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={20} className="text-emerald-400" />
                <span className="text-sm text-gray-400">Số tiền huy động</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {new Intl.NumberFormat("vi-VN").format(totalRaised).replace(/\s/g, "")} đ
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {percentage}% mục tiêu ({target > 0 ? new Intl.NumberFormat("vi-VN").format(target).replace(/\s/g, "") + " đ" : "Chưa công bố"})
              </p>
            </div>

            {/* Target */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight size={20} className="text-blue-400" />
                <span className="text-sm text-gray-400">Mục tiêu</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {target > 0 ? new Intl.NumberFormat("vi-VN").format(target).replace(/\s/g, "") + " đ" : "TBD"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {totalRaised > 0 ? `${investments?.length || 0} nhà đầu tư` : "Chưa công bố"}
              </p>
            </div>

            {/* Break Even */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={20} className="text-purple-400" />
                <span className="text-sm text-gray-400">Điểm hòa vốn</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {project.break_even ? new Intl.NumberFormat("vi-VN").format(project.break_even).replace(/\s/g, "") + " đ" : "TBD"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {project.break_even && target > 0 
                  ? `${Math.round((project.break_even / target) * 100)}% mục tiêu` 
                  : "Chưa công bố"}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Tiến độ tài chính</span>
              <span className="text-sm font-medium text-primary">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  progressColor === "emerald" ? "bg-emerald-500" :
                  progressColor === "blue" ? "bg-blue-500" :
                  progressColor === "amber" ? "bg-amber-500" :
                  "bg-red-500"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-primary/10 backdrop-blur-sm rounded-2xl p-8 border border-primary/30">
            <h2 className="text-2xl font-bold mb-4 text-primary">Tham gia đầu tư ngay hôm nay</h2>
            <p className="text-gray-300 mb-6">
              {project.investment_target && project.investment_target - totalRaised > 0 
                ? `Còn lại ${(project.investment_target - totalRaised).toLocaleString("vi-VN").replace(/\s/g, "")} đ để đạt mục tiêu`
                : "Dự án đã hoàn thành mục tiêu"}
            </p>
            <Link 
              href={`/invest/${slug}`}
              className="inline-flex items-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 rounded-xl font-semibold transition-all text-white shadow-lg hover:shadow-xl"
            >
              <ExternalLink size={20} />
              Đăng ký đầu tư
            </Link>
          </div>
        </div>
      </div>

      {/* ROI Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Dự kiến ROI</h2>
        <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
          <div className="grid md:grid-cols-3 gap-8">
            {roiData.map((roi: { year: number, rate: number }, idx: number) => (
              <div key={idx} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{roi.rate}%</div>
                <div className="text-gray-400 mb-1">Năm {roi.year}</div>
                <div className="text-xs text-gray-500">Lợi nhuận trên vốn</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      {progressData && progressData.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Lịch sử tiến độ</h2>
          <div className="space-y-4">
            {progressData.map((progress, idx) => (
              <div key={idx} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">
                    Tiến độ {progress.progress_percent}%
                  </span>
                  <span className="text-sm text-gray-400">
                    {progress.progress_date ? new Date(progress.progress_date).toLocaleDateString("vi-VN") : ""}
                  </span>
                </div>
                {progress.description && (
                  <p className="text-gray-300">{progress.description}</p>
                )}
                {progress.milestones_completed && progress.milestones_completed.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="text-sm font-medium mb-2">Hoàn thành:</div>
                    <div className="flex flex-wrap gap-2">
                      {progress.milestones_completed.map((milestone: string, mIdx: number) => (
                        <span 
                          key={mIdx} 
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                        >
                          {milestone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
