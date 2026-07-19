"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ImageSlider from "@/components/projects/ImageSlider";
import ProjectVideo from "@/components/projects/ProjectVideo";
import FinancialReport from "@/components/projects/FinancialReport";
import { ArrowLeft, MapPin, CheckCircle2, DollarSign, TrendingUp, Clock } from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminSupabase = createAdminClient();
  const userSupabase = await createClient();
  const { data: project } = await adminSupabase.from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  let investments: Array<{ amount: number; investor_name: string; investment_date: string }> = [];
  try { const { data } = await adminSupabase.from("investments").select("amount, investor_name, investment_date").eq("project_id", project.id).eq("payment_status", "paid").order("investment_date", { ascending: false }); if (data) investments = data; } catch {}

  let progressData: Array<{ progress_percent: number; progress_date: string | null; description: string | null }> = [];
  try { const { data } = await adminSupabase.from("project_progress").select("*").eq("project_id", project.id).order("progress_date", { ascending: true }); if (data) progressData = data; } catch {}

  const totalRaised = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const target = project.investment_target || 0;
  const percentage = target > 0 ? Math.round((totalRaised / target) * 100) : 0;

  const galleryImages = project.gallery_images ? (typeof project.gallery_images === "string" ? JSON.parse(project.gallery_images) : project.gallery_images) : [];
  const highlights = project.highlights ? (typeof project.highlights === "string" ? JSON.parse(project.highlights) : project.highlights) : [];
  const timeline = project.timeline ? (typeof project.timeline === "string" ? JSON.parse(project.timeline) : project.timeline) : [];
  const summary = project.financial_summary ? (typeof project.financial_summary === "string" ? JSON.parse(project.financial_summary) : project.financial_summary) : {};

  const { data: { user } } = await userSupabase.auth.getUser();
  let userInvestment: { id: string } | null = null;
  if (user) { try { const { data } = await userSupabase.from("investments").select("id").eq("project_id", project.id).eq("user_id", user.id).limit(1).single(); userInvestment = data; } catch {} }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      {project.cover_image && (
        <div className="relative h-56 md:h-72 overflow-hidden">
          <img src={project.cover_image} alt={project.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="max-w-6xl mx-auto">
              <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2 transition-colors">
                <ArrowLeft size={12} /> Danh sách dự án
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.title}</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-n-green/15 text-n-green border border-n-green/20">
                  {project.status === "in_progress" ? "Đang mở đầu tư" : project.status}
                </span>
                {project.location && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={11} /> {project.location}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {!project.cover_image && (
          <div>
            <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2"><ArrowLeft size={12} /> Danh sách dự án</Link>
            <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
          </div>
        )}

        {/* ======== SECTION 1: Key Metrics Panel ======== */}
        {target > 0 && (
          <div className="bg-card border border-border/50 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Mục tiêu</p>
                <p className="text-lg md:text-xl font-bold text-foreground">{new Intl.NumberFormat("vi-VN").format(target)}đ</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Đã huy động</p>
                <p className="text-lg md:text-xl font-bold text-n-green">{new Intl.NumberFormat("vi-VN").format(totalRaised)}đ</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Hòa vốn</p>
                <p className="text-lg md:text-xl font-bold text-foreground">{summary.breakeven_months ? `${summary.breakeven_months} tháng` : "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">ROI 3 năm</p>
                <p className="text-lg md:text-xl font-bold text-n-green">{summary.roi_3year ? `${summary.roi_3year}%` : "N/A"}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tiến độ huy động</span>
                <span className="text-lg font-bold text-n-gold">{percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-n-gold to-n-green transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <span>{new Intl.NumberFormat("vi-VN").format(totalRaised)}đ</span>
                <span>Target: {new Intl.NumberFormat("vi-VN").format(target)}đ</span>
              </div>
            </div>

            {summary.total_capex && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border">
                {[
                  { icon: <DollarSign size={13} className="text-n-gold" />, label: "Tổng vốn", value: new Intl.NumberFormat("vi-VN").format(summary.total_capex) + "đ" },
                  { icon: <TrendingUp size={13} className="text-n-green" />, label: "Doanh thu năm 1", value: new Intl.NumberFormat("vi-VN").format(summary.year1_revenue) + "đ" },
                  { icon: <TrendingUp size={13} className="text-n-purple" />, label: "Lợi nhuận năm 2", value: new Intl.NumberFormat("vi-VN").format(summary.year2_profit) + "đ" },
                  { icon: <Clock size={13} className="text-n-teal" />, label: "IRR 5 năm", value: summary.irr_5year + "%" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="text-xs font-semibold text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======== SECTION 2: CTA + Gallery (2 cột) ======== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT: Media */}
          <div className="lg:col-span-2 space-y-5">
            {galleryImages.length > 0 && <ImageSlider images={galleryImages} title={project.title} />}
            {project.video_url && <ProjectVideo url={project.video_url} poster={project.video_poster} />}
            {project.html_content && (
              <div className="bg-card border border-border rounded-xl p-5 prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-blockquote:border-n-gold prose-blockquote:text-muted-foreground">
                <div dangerouslySetInnerHTML={{ __html: project.html_content }} />
              </div>
            )}
            {highlights.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-semibold text-foreground mb-3">Điểm nổi bật</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlights.map((item: { icon: string; title: string; desc: string }, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <span className="text-xl shrink-0">{item.icon}</span>
                      <div><h3 className="text-sm font-semibold text-foreground">{item.title}</h3><p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-primary/10 to-n-purple/10 border border-primary/20 rounded-xl p-5 sticky top-4">
              <h3 className="text-base font-semibold text-foreground mb-1.5">Đăng ký đầu tư</h3>
              <p className="text-xs text-muted-foreground mb-4">Tham gia và nhận lợi nhuận hấp dẫn.</p>
              {project.status === "in_progress" && target > 0 && (userInvestment ? (
                <Link href={`/app/investments/${userInvestment.id}`} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-n-green/15 text-n-green font-medium text-sm hover:bg-n-green/25 transition-all"><CheckCircle2 size={14} /> Đã đầu tư</Link>
              ) : (
                <Link href={`/app/invest/${project.id}`} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/80 transition-all"><DollarSign size={14} /> Đầu tư ngay</Link>
              ))}
            </div>

            {investments.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Nhà đầu tư ({investments.length})</h3>
                <div className="space-y-2">
                  {investments.slice(0, 5).map((inv, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-n-gold/15 flex items-center justify-center"><span className="text-[10px] font-bold text-n-gold">{(inv.investor_name || "N")[0].toUpperCase()}</span></div>
                      <div className="flex-1 min-w-0"><p className="text-xs font-medium text-foreground truncate">{inv.investor_name || "Nhà đầu tư"}</p><p className="text-[10px] text-muted-foreground">{new Intl.NumberFormat("vi-VN").format(inv.amount)}đ</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======== SECTION 3: Financial Report Full Width ======== */}
        <FinancialReport project={project} />

        {/* ======== SECTION 4: Progress + Timeline ======== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {progressData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-3">Tiến độ thực hiện</h2>
              <div className="space-y-3">
                {progressData.map((p, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-n-purple/15 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 size={14} className="text-n-purple" /></div>
                    <div className="flex-1"><div className="flex items-center gap-2"><span className="text-sm font-semibold text-foreground">{p.progress_percent}%</span><span className="text-xs text-muted-foreground">{p.progress_date ? new Date(p.progress_date).toLocaleDateString("vi-VN") : ""}</span></div>{p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {timeline.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-3">Lộ trình dự án</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {timeline.map((item: { date: string; title: string; desc: string; done: boolean }, i: number) => (
                  <div key={i} className={`shrink-0 w-40 p-3 rounded-lg border ${item.done ? "bg-n-green/5 border-n-green/20" : "bg-muted border-border"}`}>
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
      </div>
    </div>
  );
}
