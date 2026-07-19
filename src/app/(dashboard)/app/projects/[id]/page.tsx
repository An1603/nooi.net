"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ImageSlider from "@/components/projects/ImageSlider";
import ProjectVideo from "@/components/projects/ProjectVideo";
import FinancialReport from "@/components/projects/FinancialReport";
import { ArrowLeft, MapPin, CheckCircle2, DollarSign, TrendingUp, Users, Clock } from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminSupabase = createAdminClient();
  const userSupabase = await createClient();

  const { data: project } = await adminSupabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  // Graceful data loading
  let investments: Array<{ amount: number; investor_name: string; investment_date: string }> = [];
  try {
    const { data } = await adminSupabase
      .from("investments")
      .select("amount, investor_name, investment_date")
      .eq("project_id", project.id)
      .eq("payment_status", "paid")
      .order("investment_date", { ascending: false });
    if (data) investments = data;
  } catch {}

  let progressData: Array<{ progress_percent: number; progress_date: string | null; description: string | null }> = [];
  try {
    const { data } = await adminSupabase
      .from("project_progress")
      .select("*")
      .eq("project_id", project.id)
      .order("progress_date", { ascending: true });
    if (data) progressData = data;
  } catch {}

  const totalRaised = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const target = project.investment_target || 0;
  const percentage = target > 0 ? Math.round((totalRaised / target) * 100) : 0;

  const roiData = project.roi_estimate
    ? (typeof project.roi_estimate === "string" ? JSON.parse(project.roi_estimate) : project.roi_estimate)
    : [];

  const galleryImages = project.gallery_images
    ? (typeof project.gallery_images === "string" ? JSON.parse(project.gallery_images) : project.gallery_images)
    : [];

  const highlights = project.highlights
    ? (typeof project.highlights === "string" ? JSON.parse(project.highlights) : project.highlights)
    : [];

  const timeline = project.timeline
    ? (typeof project.timeline === "string" ? JSON.parse(project.timeline) : project.timeline)
    : [];

  const summary = project.financial_summary
    ? (typeof project.financial_summary === "string" ? JSON.parse(project.financial_summary) : project.financial_summary)
    : {};

  // Check user investment
  const { data: { user } } = await userSupabase.auth.getUser();
  let userInvestment: { id: string } | null = null;
  if (user) {
    try {
      const { data } = await userSupabase
        .from("investments").select("id")
        .eq("project_id", project.id).eq("user_id", user.id)
        .limit(1).single();
      userInvestment = data;
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      {project.cover_image && (
        <div className="relative h-56 md:h-72 overflow-hidden">
          <img src={project.cover_image} alt={project.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="max-w-5xl mx-auto">
              <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2 transition-colors">
                <ArrowLeft size={12} /> Danh sách dự án
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.title}</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-n-green/15 text-n-green border border-n-green/20">
                  {project.status === "in_progress" ? "Đang mở đầu tư" : project.status}
                </span>
                {project.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={11} /> {project.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {!project.cover_image && (
          <div className="mb-6">
            <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2">
              <ArrowLeft size={12} /> Danh sách dự án
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
          </div>
        )}

        {/* Full-width stats + progress */}
        {target > 0 && (
          <div className="mb-6 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Mục tiêu</p>
                <p className="text-sm font-bold text-foreground">{new Intl.NumberFormat("vi-VN").format(target)}đ</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Đã huy động</p>
                <p className="text-sm font-bold text-n-green">{new Intl.NumberFormat("vi-VN").format(totalRaised)}đ</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Hòa vốn</p>
                <p className="text-sm font-bold text-foreground">{summary.breakeven_months ? `${summary.breakeven_months} tháng` : "N/A"}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">ROI 3 năm</p>
                <p className="text-sm font-bold text-n-green">{summary.roi_3year ? `${summary.roi_3year}%` : "N/A"}</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Tiến độ huy động</span>
                <span className="text-sm font-bold text-n-gold">{percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-n-gold to-n-green transition-all duration-500"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>{new Intl.NumberFormat("vi-VN").format(totalRaised)}đ đã huy động</span>
                <span>Mục tiêu: {new Intl.NumberFormat("vi-VN").format(target)}đ</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            {galleryImages.length > 0 && (
              <ImageSlider images={galleryImages} title={project.title} />
            )}

            {/* Video */}
            {project.video_url && (
              <ProjectVideo url={project.video_url} poster={project.video_poster} />
            )}

            {/* HTML Content */}
            {project.html_content && (
              <div className="bg-card border border-border rounded-xl p-6 prose prose-invert prose-sm max-w-none
                prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground
                prose-strong:text-foreground prose-blockquote:border-n-gold prose-blockquote:text-muted-foreground">
                <div dangerouslySetInnerHTML={{ __html: project.html_content }} />
              </div>
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-semibold text-foreground mb-3">Điểm nổi bật</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlights.map((item: { icon: string; title: string; desc: string }, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <span className="text-xl shrink-0">{item.icon}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Report */}
            <FinancialReport project={project} />

            {/* Progress */}
            {progressData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-semibold text-foreground mb-3">Tiến độ thực hiện</h2>
                <div className="space-y-3">
                  {progressData.map((p, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-n-purple/15 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={14} className="text-n-purple" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{p.progress_percent}%</span>
                          <span className="text-xs text-muted-foreground">
                            {p.progress_date ? new Date(p.progress_date).toLocaleDateString("vi-VN") : ""}
                          </span>
                        </div>
                        {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {timeline.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-semibold text-foreground mb-3">Lộ trình dự án</h2>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {timeline.map((item: { date: string; title: string; desc: string; done: boolean }, i: number) => (
                    <div key={i} className={`shrink-0 w-40 p-3 rounded-lg border ${
                      item.done ? "bg-n-green/5 border-n-green/20" : "bg-muted border-border"
                    }`}>
                      <p className="text-[10px] text-n-gold font-medium">{item.date}</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                      {item.done && <CheckCircle2 size={12} className="text-n-green mt-1" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* CTA */}
            <div className="bg-gradient-to-br from-primary/10 to-n-purple/10 border border-primary/20 rounded-xl p-5 sticky top-4">
              <h3 className="text-base font-semibold text-foreground mb-1.5">Đăng ký đầu tư</h3>
              <p className="text-xs text-muted-foreground mb-4">Tham gia và nhận lợi nhuận hấp dẫn.</p>
              {project.status === "in_progress" && target > 0 && (
                userInvestment ? (
                  <Link href={`/app/investments/${userInvestment.id}`} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-n-green/15 text-n-green font-medium text-sm hover:bg-n-green/25 transition-all">
                    <CheckCircle2 size={14} /> Đã đầu tư
                  </Link>
                ) : (
                  <Link href={`/app/invest/${project.id}`} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/80 transition-all">
                    <DollarSign size={14} /> Đầu tư ngay
                  </Link>
                )
              )}
            </div>

            {/* Financial Summary Card */}
            {summary.total_capex && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Tóm tắt tài chính</h3>
                <div className="space-y-2.5">
                  {[
                    { label: "Tổng vốn đầu tư", value: new Intl.NumberFormat("vi-VN").format(summary.total_capex) + "đ", icon: <DollarSign size={12} className="text-n-gold" /> },
                    { label: "Doanh thu năm 1", value: new Intl.NumberFormat("vi-VN").format(summary.year1_revenue) + "đ", icon: <TrendingUp size={12} className="text-n-green" /> },
                    { label: "Lợi nhuận năm 2", value: new Intl.NumberFormat("vi-VN").format(summary.year2_profit) + "đ", icon: <TrendingUp size={12} className="text-n-green" /> },
                    { label: "Thời gian hòa vốn", value: summary.breakeven_months + " tháng", icon: <Clock size={12} className="text-n-teal" /> },
                    { label: "IRR 5 năm", value: summary.irr_5year + "%", icon: <TrendingUp size={12} className="text-n-purple" /> },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        {item.icon} {item.label}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Investors */}
            {investments.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Nhà đầu tư ({investments.length})</h3>
                <div className="space-y-2">
                  {investments.slice(0, 5).map((inv, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-n-gold/15 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-n-gold">{(inv.investor_name || "N")[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{inv.investor_name || "Nhà đầu tư"}</p>
                        <p className="text-[10px] text-muted-foreground">{new Intl.NumberFormat("vi-VN").format(inv.amount)}đ</p>
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
