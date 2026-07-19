"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ImageSlider from "@/components/projects/ImageSlider";
import ProjectVideo from "@/components/projects/ProjectVideo";
import FinancialReport from "@/components/projects/FinancialReport";
import HtmlSlideViewer from "@/components/projects/HtmlSlideViewer";
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

  const safeParse = (val: unknown, fallback: unknown) => {
    if (!val) return fallback;
    if (typeof val !== "string") return val;
    try { return JSON.parse(val); } catch { return fallback; }
  };

  const galleryImages = safeParse(project.gallery_images, []);
  const highlights = safeParse(project.highlights, []);
  const timeline = safeParse(project.timeline, []);
  const summary = safeParse(project.financial_summary, {});
  const roiData = safeParse(project.roi_estimate, []);

  const { data: { user } } = await userSupabase.auth.getUser();
  let userInvestment: { id: string } | null = null;
  if (user) { try { const { data } = await userSupabase.from("investments").select("id").eq("project_id", project.id).eq("user_id", user.id).limit(1).single(); userInvestment = data; } catch {} }

  const showInvestCTA = project.status === "in_progress" && target > 0;

  const isFullHtmlPage = project.html_content && (project.html_content.trim().toLowerCase().startsWith('<!doctype') || project.html_content.trim().toLowerCase().startsWith('<html'));

  return (
    <div className="min-h-screen font-body relative overflow-hidden" style={{ background: '#1a0a2e' }}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        {project.cover_image ? <img src={project.cover_image} alt="" className="w-full h-full object-cover opacity-[0.12]" />
          : <div className="w-full h-full bg-gradient-to-br from-n-green/8 to-background opacity-40"></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] bg-primary/[0.04] rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full h-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col min-h-screen">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-glass-border pb-4 gap-4">
          <div>
            <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase text-primary/80 hover:text-primary mb-2 transition-colors">
              <ArrowLeft size={12} /> Trở về danh sách
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-wide">{project.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {project.status === "in_progress" && (
                <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-n-green/20 text-n-green border border-n-green/30 uppercase">Đang mở đầu tư</span>
              )}
              {project.location && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} /> {project.location}</span>
              )}
            </div>
          </div>
          
          <div className="text-left md:text-right">
            {target > 0 && (
              <>
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Mục tiêu gọi vốn</p>
                <p className="text-xl md:text-3xl font-bold text-primary">
                  {new Intl.NumberFormat("vi-VN").format(target)}<span className="text-sm font-medium text-primary/80 ml-1">VNĐ</span>
                </p>
              </>
            )}
            {showInvestCTA && !userInvestment && (
              <Link href={`/app/invest/${project.id}`} className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/80 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all border border-primary/40">
                <DollarSign size={16} /> Đầu tư ngay
              </Link>
            )}
            {userInvestment && (
              <Link href={`/app/investments/${userInvestment.id}`} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-glass text-n-green text-sm font-medium border border-n-green/30 hover:bg-glass-hover transition-all">
                <CheckCircle2 size={16} /> Đã đầu tư
              </Link>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-grow pb-10">
          <div className="lg:col-span-8 flex flex-col gap-5">
            {isFullHtmlPage && (
              <div className="rounded-xl overflow-hidden shadow-2xl border border-glass-border bg-card/50 backdrop-blur-sm">
                <HtmlSlideViewer htmlContent={project.html_content} />
              </div>
            )}
            {!isFullHtmlPage && project.html_content && (
              <div className="bg-glass backdrop-blur-md border border-glass-border rounded-xl p-5 md:p-6 prose prose-invert prose-sm max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-primary">
                <div dangerouslySetInnerHTML={{ __html: project.html_content }} />
              </div>
            )}
            {(galleryImages.length > 0 || project.video_url) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {galleryImages.length > 0 && (
                  <div className="bg-glass backdrop-blur-md border border-glass-border rounded-xl p-1 overflow-hidden">
                    <ImageSlider images={galleryImages} title={project.title} />
                  </div>
                )}
                {project.video_url && (
                  <div className="bg-glass backdrop-blur-md border border-glass-border rounded-xl p-1 overflow-hidden flex flex-col justify-center">
                    <ProjectVideo url={project.video_url} poster={project.video_poster} />
                  </div>
                )}
              </div>
            )}
            {highlights.length > 0 && (
              <div className="bg-glass backdrop-blur-md border border-glass-border rounded-xl p-5">
                <h3 className="text-lg text-primary mb-4 border-b border-glass-border pb-2 font-serif">Điểm Nổi Bật</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlights.map((item: { icon: string; title: string; desc: string }, i: number) => (
                    <div key={i} className="flex gap-3 p-3 bg-glass rounded-lg border border-glass-border">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-glass flex items-center justify-center text-lg">{item.icon}</div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <FinancialReport project={project} />
          </div>

          <div className="lg:col-span-4 flex flex-col gap-5">
            {target > 0 && (
              <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 className="text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wider">Tiến Độ Gọi Vốn</h3>
                <div className="flex items-end justify-between mb-2">
                  <div className="text-3xl font-bold text-primary">{percentage}%</div>
                  <div className="text-xs text-muted-foreground/80 mb-1">
                    <span className="text-foreground font-medium">{new Intl.NumberFormat("vi-VN").format(totalRaised)}đ</span> / {new Intl.NumberFormat("vi-VN").format(target)}đ
                  </div>
                </div>
                <div className="w-full bg-white/[0.10] rounded-full h-2.5 mb-5 overflow-hidden border border-white/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-n-gold via-primary to-n-green transition-all duration-1000 shadow-[0_0_8px_rgba(200,148,62,0.5)]" style={{ width: Math.min(percentage, 100) + "%" }}></div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-glass rounded-lg border border-glass-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Hoàn Vốn</div>
                    <div className="font-bold text-foreground">{summary.breakeven_months ? summary.breakeven_months + " tháng" : "N/A"}</div>
                  </div>
                  <div className="p-3 bg-glass rounded-lg border border-glass-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">ROI 3 Năm</div>
                    <div className="font-bold text-n-green">{summary.roi_3year ? summary.roi_3year + "%" : "N/A"}</div>
                  </div>
                  <div className="p-3 bg-glass rounded-lg border border-glass-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">IRR 5 Năm</div>
                    <div className="font-bold text-primary">{summary.irr_5year ? summary.irr_5year + "%" : "N/A"}</div>
                  </div>
                  <div className="p-3 bg-glass rounded-lg border border-glass-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Cổ Đông</div>
                    <div className="font-bold text-foreground">{investments.length}</div>
                  </div>
                </div>
              </div>
            )}
            {timeline.length > 0 && (
              <div className="bg-glass backdrop-blur-md border border-glass-border rounded-xl p-5">
                <h3 className="text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wider">Lộ Trình Triển Khai</h3>
                <div className="space-y-4 relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-[1px] bg-glass-border"></div>
                  {timeline.map((item: { date: string; title: string; desc: string; done: boolean }, i: number) => (
                    <div key={i} className="flex gap-4 relative">
                      <div className={'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all ' + (item.done ? 'bg-n-green/20 border-n-green shadow-[0_0_8px_rgba(74,173,106,0.2)]' : 'bg-muted/80 border-white/[0.15]')}>
                        {item.done ? <CheckCircle2 size={14} className="text-n-green" /> : <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></div>}
                      </div>
                      <div className="pt-1">
                        <div className="text-[10px] font-bold tracking-widest text-primary/80 mb-0.5">{item.date}</div>
                        <h4 className={(item.done ? 'text-foreground' : 'text-muted-foreground') + ' text-sm font-semibold'}>{item.title}</h4>
                        {item.desc && <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {progressData.length > 0 && (
              <div className="bg-glass backdrop-blur-md border border-glass-border rounded-xl p-5">
                <h3 className="text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wider">Cập Nhật Gần Đây</h3>
                <div className="space-y-3">
                  {progressData.map((p, i) => (
                    <div key={i} className="p-3 bg-glass rounded-lg border border-glass-border border-l-2 border-l-n-green">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-foreground">{p.progress_percent}%</span>
                        <span className="text-[10px] text-muted-foreground">{p.progress_date ? new Date(p.progress_date).toLocaleDateString("vi-VN") : ""}</span>
                      </div>
                      {p.description && <p className="text-[11px] text-muted-foreground leading-relaxed">{p.description}</p>}
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
