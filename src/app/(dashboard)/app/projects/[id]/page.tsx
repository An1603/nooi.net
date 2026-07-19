"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ImageSlider from "@/components/projects/ImageSlider";
import ProjectHighlights from "@/components/projects/ProjectHighlights";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ProjectVideo from "@/components/projects/ProjectVideo";
import { ArrowLeft, DollarSign, Calendar, TrendingUp, Users, CheckCircle2, MapPin } from "lucide-react";

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

  // Graceful fallback for investments
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

  // Graceful fallback for progress
  let progressData: Array<{ progress_percent: number; progress_date: string | null; description: string | null }> = [];
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
    ? (typeof project.roi_estimate === "string" ? JSON.parse(project.roi_estimate) : project.roi_estimate)
    : [{ year: 1, rate: 5 }, { year: 2, rate: 7 }, { year: 3, rate: 10 }];

  const latestProgress = (progressData?.length ?? 0) > 0
    ? progressData![progressData!.length - 1]
    : null;

  const galleryImages = project.gallery_images
    ? (typeof project.gallery_images === "string" ? JSON.parse(project.gallery_images) : project.gallery_images)
    : [];

  const highlights = project.highlights
    ? (typeof project.highlights === "string" ? JSON.parse(project.highlights) : project.highlights)
    : [];

  const timeline = project.timeline
    ? (typeof project.timeline === "string" ? JSON.parse(project.timeline) : project.timeline)
    : [];

  // Check if user already invested
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
      {/* Hero Banner */}
      {project.cover_image ? (
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={project.cover_image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="max-w-4xl mx-auto">
              <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-3 transition-colors">
                <ArrowLeft size={14} />
                Danh sách dự án
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{project.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  project.status === "in_progress"
                    ? "bg-n-green/15 text-n-green border-n-green/20"
                    : "bg-muted text-muted-foreground border-border"
                }`}>
                  {project.status === "in_progress" ? "Đang mở đầu tư" : project.status}
                </span>
                {project.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={12} />
                    {project.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
          <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-3 transition-colors">
            <ArrowLeft size={14} />
            Danh sách dự án
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">{project.title}</h1>
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${
            project.status === "in_progress"
              ? "bg-n-green/15 text-n-green border-n-green/20"
              : "bg-muted text-muted-foreground border-border"
          }`}>
            {project.status === "in_progress" ? "Đang mở đầu tư" : project.status}
          </span>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery Slider */}
            {galleryImages.length > 0 && (
              <ImageSlider images={galleryImages} title={project.title} />
            )}

            {/* Video */}
            {project.video_url && (
              <ProjectVideo url={project.video_url} poster={project.video_poster} />
            )}

            {/* Description */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">Giới thiệu dự án</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{project.description}</p>
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <ProjectHighlights items={highlights} />
            )}

            {/* Timeline */}
            {timeline.length > 0 && (
              <ProjectTimeline items={timeline} />
            )}

            {/* Funding Progress */}
            {target > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Tiến độ huy động vốn</h2>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-n-gold to-n-green"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-xl font-bold text-n-gold">{percentage}%</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{new Intl.NumberFormat("vi-VN").format(totalRaised)}đ đã huy động</span>
                  <span>Mục tiêu: {new Intl.NumberFormat("vi-VN").format(target)}đ</span>
                </div>
              </div>
            )}

            {/* ROI */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Dự kiến lợi nhuận (ROI)</h2>
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
                <h2 className="text-lg font-semibold text-foreground mb-4">Tiến độ thực hiện</h2>
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

            {/* Revenue Share */}
            {project.revenue_share && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">Cấu trúc chia lợi nhuận</h2>
                <p className="text-sm text-muted-foreground">{project.revenue_share}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA */}
            <div className="bg-gradient-to-br from-primary/10 to-n-purple/10 border border-primary/20 rounded-xl p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Đăng ký đầu tư</h3>
              <p className="text-sm text-muted-foreground mb-4">Tham gia đầu tư và nhận lợi nhuận hấp dẫn từ dự án.</p>
              {project.status === "in_progress" && target > 0 && (
                userInvestment ? (
                  <Link href={`/app/investments/${userInvestment.id}`} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-n-green/15 text-n-green font-medium hover:bg-n-green/25 transition-all">
                    <CheckCircle2 size={16} />
                    Đã đầu tư — Xem chi tiết
                  </Link>
                ) : (
                  <Link href={`/app/invest/${project.id}`} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/80 transition-all">
                    <DollarSign size={16} />
                    Đầu tư ngay
                  </Link>
                )
              )}
            </div>

            {/* Quick Stats */}
            {target > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Chỉ số tài chính</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Mục tiêu</span>
                    <span className="text-sm font-medium text-foreground">{new Intl.NumberFormat("vi-VN").format(target)}đ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Đã huy động</span>
                    <span className="text-sm font-medium text-n-green">{new Intl.NumberFormat("vi-VN").format(totalRaised)}đ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Hòa vốn</span>
                    <span className="text-sm font-medium text-foreground">{new Intl.NumberFormat("vi-VN").format(project.break_even || 0)}đ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Nhà đầu tư</span>
                    <span className="text-sm font-medium text-foreground">{investments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Cổ phần</span>
                    <span className="text-sm font-medium text-foreground">{project.revenue_share || "60-40"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent investors */}
            {investments.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Nhà đầu tư gần đây</h3>
                <div className="space-y-3">
                  {investments.slice(0, 5).map((inv, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-n-gold/15 flex items-center justify-center">
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
