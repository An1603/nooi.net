import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookHeart, Bot, TrendingUp } from "lucide-react";

async function getRecentJournals(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("documents")
    .select("content, created_at")
    .eq("user_id", userId)
    .eq("file_type", "journal")
    .order("created_at", { ascending: false })
    .limit(3);
  return data || [];
}

async function hasJournalToday(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const todayStart = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("file_type", "journal")
    .gte("created_at", todayStart);
  return (data?.length ?? 0) > 0;
}

function parseJournal(content: string) {
  try {
    return JSON.parse(content) as { than?: string; tam?: string; hanh?: string };
  } catch {
    return { than: content };
  }
}

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, numerology_report, full_name, date_of_birth")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_completed || !profile.numerology_report || !profile.full_name || !profile.date_of_birth) {
    redirect("/app/setup");
  }

  const email = user?.email ?? "Người dùng";
  const name = user?.user_metadata?.full_name ?? email.split("@")[0];

  const [{ count: projectCount }, { count: videoCount }, { count: docCount }, { count: journalCount }] =
    await Promise.all([
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user?.id),
      supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", user?.id),
      supabase.from("documents").select("*", { count: "exact", head: true }).eq("user_id", user?.id).neq("file_type", "journal"),
      supabase.from("documents").select("*", { count: "exact", head: true }).eq("user_id", user?.id).eq("file_type", "journal"),
    ]);

  const [recentJournals, journalToday] = await Promise.all([
    getRecentJournals(supabase, user.id),
    hasJournalToday(supabase, user.id),
  ]);

  const stats = [
    { label: "Dự án", value: String(projectCount ?? 0), icon: "📁" },
    { label: "Video", value: String(videoCount ?? 0), icon: "🎬" },
    { label: "Tài liệu", value: String(docCount ?? 0), icon: "📄" },
    { label: "Nhật ký", value: String(journalCount ?? 0), icon: "📓" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Xin chào, <span className="text-gradient-ai">{name}</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Đây là tổng quan không gian làm việc của bạn trên NOOI.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-card hover:bg-card/80 transition-colors">
            <span className="text-lg mb-1.5 block">{s.icon}</span>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Journal reminder */}
      {!journalToday && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <BookHeart className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Hôm nay bạn đã viết nhật ký chưa?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Chỉ 5 phút để nhìn lại Thân-Tâm-Hành và nhận phản hồi từ AI Mentor.</p>
          </div>
          <Link
            href="/app/journal"
            className="shrink-0 text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Viết ngay
          </Link>
        </div>
      )}

      {/* Transformation progress + Journal section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transformation path */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Hành trình chuyển hóa</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "THẤY — Nhìn rõ bản thân", progress: 80, color: "bg-amber-500" },
              { label: "HIỂU — Hiểu nguyên nhân", progress: 60, color: "bg-emerald-500" },
              { label: "SỐNG — Thực hành mỗi ngày", progress: 35, color: "bg-blue-500" },
              { label: "LAN TỎA — Chia sẻ giá trị", progress: 15, color: "bg-purple-500" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{item.progress}%</span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-4">
            Dựa trên tổng số bài học & nhật ký đã hoàn thành
          </p>
        </div>

        {/* Recent journal */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookHeart className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Nhật ký gần đây</h2>
            </div>
            <Link href="/app/journal" className="text-xs text-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>
          {journalCount === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Chưa có nhật ký nào.</p>
              <Link
                href="/app/journal"
                className="inline-block mt-3 text-sm bg-primary px-4 py-2 rounded-lg text-primary-foreground hover:bg-primary/80"
              >
                Viết nhật ký đầu tiên
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJournals.slice(0, 2).map((entry, i) => {
                const data = parseJournal(entry.content);
                const date = new Date(entry.created_at).toLocaleDateString("vi-VN", {
                  weekday: "long", day: "2-digit", month: "2-digit",
                });
                return (
                  <div key={i} className="rounded-lg bg-muted/20 border border-border/50 p-3 text-xs space-y-1">
                    <p className="text-muted-foreground">{date}</p>
                    {data.than && <p><span className="text-green-400">Thân:</span> {data.than}</p>}
                    {data.tam && <p><span className="text-red-400">Tâm:</span> {data.tam}</p>}
                    {data.hanh && <p><span className="text-blue-400">Hành:</span> {data.hanh}</p>}
                  </div>
                );
              })}
              {(journalCount ?? 0) > 2 && (
                <Link href="/app/journal" className="block text-xs text-center text-muted-foreground hover:text-primary py-2">
                  + {(journalCount ?? 0) - 2} nhật ký khác
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Mentor suggestion */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold mb-1">NOOI AI Mentor</h2>
            <p className="text-sm text-muted-foreground mb-3">
              {(journalCount ?? 0) > 0
                ? "Bạn đã ghi nhật ký. Hãy chia sẻ để AI Mentor phân tích và đồng hành cùng bạn."
                : "Bắt đầu hành trình chuyển hóa — viết nhật ký đầu tiên và nhận phản hồi từ AI Mentor."}
            </p>
            <div className="flex gap-3">
              <Link
                href="/app/journal"
                className="text-sm bg-primary px-4 py-2 rounded-lg text-primary-foreground hover:bg-primary/80 transition-colors"
              >
                {(journalCount ?? 0) > 0 ? "📝 Viết nhật ký" : "📝 Bắt đầu"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Bắt đầu nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "📓 Nhật ký",
              desc: "Ghi lại Thân-Tâm-Hành mỗi ngày",
              href: "/app/journal",
              color: "from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:border-amber-500/30",
            },
            {
              title: "⚡ Thực hành",
              desc: "Bài tập 60 giây chuyển hóa",
              href: "/app/thuc-hanh",
              color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30",
            },
            {
              title: "🎙 Trợ lý giọng nói",
              desc: "Trò chuyện với AI Mentor",
              href: "/app/voice",
              color: "from-violet-500/10 to-violet-500/5 border-violet-500/20 hover:border-violet-500/30",
            },
          ].map((card, i) => (
            <Link
              key={i}
              href={card.href}
              className={`p-5 rounded-xl border bg-gradient-to-br ${card.color} transition-all group`}
            >
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
              <p className="text-xs text-muted-foreground">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
