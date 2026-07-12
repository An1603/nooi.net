import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookHeart, Bot, TrendingUp } from "lucide-react";
import StreakBadgeWidget from "@/components/streak/StreakBadgeWidget";
import QuestWidget from "@/components/quest/QuestWidget";
import DashboardStats from "@/components/stats/DashboardStats";

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

// Level configuration (same as in profile)
const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1200, 2200, 3500];
const LEVEL_NAMES = [
  "🌰 Member",
  "Seeker 🌱",
  "Grower 🌿",
  "Giver 🌳",
  "Guider 🌲",
  "Mentor 🌳",
  "Master 👑",
] as const;

function getLevelInfo(totalN: number) {
  let levelIndex = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalN >= LEVEL_THRESHOLDS[i]) {
      levelIndex = i;
      break;
    }
  }
  const currentThreshold = LEVEL_THRESHOLDS[levelIndex];
  const nextThreshold = LEVEL_THRESHOLDS[levelIndex + 1] ?? LEVEL_THRESHOLDS[levelIndex] + 100; // fallback for beyond last
  const progress =
    nextThreshold > currentThreshold
      ? Math.min(100, Math.round(((totalN - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
      : 100;
  const remaining = nextThreshold - totalN;
  return {
    level: levelIndex + 1,
    levelName: LEVEL_NAMES[levelIndex],
    currentThreshold,
    nextThreshold,
    progress,
    remaining,
  };
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
    return redirect("/app/setup");
  }

  const email = user?.email ?? "Người dùng";
  const name = user?.user_metadata?.full_name ?? email.split("@")[0];

  const [
    { count: projectCount },
    { count: videoCount },
    { count: docCount },
    { count: journalCount },
  ] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("file_type", "journal"),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("file_type", "journal"),
  ]);

  const [recentJournals, journalToday] = await Promise.all([
    getRecentJournals(supabase, user.id),
    hasJournalToday(supabase, user.id),
  ]);

  const totalN = (journalCount ?? 0) * 10;
  const levelInfo = getLevelInfo(totalN);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Level Card */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              {/* Use first character of levelName as simple icon (could be emoji) */}
              <span className="text-primary">{levelInfo.levelName.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-medium">{levelInfo.levelName}</p>
              <p className="text-xs text-muted-foreground">
                Level: {totalN} N
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              Tiến trình đến cấp {levelInfo.level + 1}
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-800/20 rounded-full h-2.5 mb-2">
          <div
            className="bg-gradient-to-r from-amber-400 via-lime-400 to-emerald-400 h-2.5 rounded-full"
            style={{ width: `${levelInfo.progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{levelInfo.currentThreshold} N</span>
          <span>
            {levelInfo.progress === 100
              ? "Đạt tối đa"
              : `Còn ${levelInfo.remaining} N để lên cấp`}
          </span>
        </div>
      </div>

      {/* Welcome */}
      <div className="relative">
        <div className="absolute -inset-x-4 -inset-y-2 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl pointer-events-none" />
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight relative">
          Hi!, <span className="text-gradient-gold">{name}</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm relative">
          Đây là tổng quan không gian làm việc của bạn trên NOOI.
        </p>
      </div>

      {/* AI Mentor suggestion */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 card-elevated relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-start gap-4 relative">
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
                href="/app/voice"
                className="text-sm bg-primary px-4 py-2 rounded-lg text-primary-foreground hover:bg-primary/80 transition-colors"
              >
                🎧 Hỏi AI Mentor
              </Link>
              <Link
                href="/app/journal"
                className="text-sm border border-border px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                📝 Viết nhật ký
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Bắt đầu nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
          {[
            {
              title: "📓 Nhật ký",
              desc: "Ghi lại Thân-Tâm-Hành mỗi ngày",
              href: "/app/journal",
              color: "from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:border-amber-500/30",
            },
            {
              title: "🧘 Thiền",
              desc: "Thực hành chánh niệm cùng hướng dẫn",
              href: "/app/thuc-hanh",
              color: "from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/30",
            },
            {
              title: "🎮 Game",
              desc: "Học qua trò chơi ghép thẻ chuyển hóa",
              href: "/app/game",
              color: "from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-500/30",
            },
          ].map((action) => (
            <Link key={action.title} href={action.href}
              className={`flex flex-col p-4 sm:p-5 rounded-xl border bg-gradient-to-br ${action.color} transition-all hover:scale-[1.02] active:scale-95 touch-target card-elevated-hover`}
            >
              <span className="text-lg mb-1">{action.title}</span>
              <span className="text-xs text-muted-foreground">{action.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats grid — chuyển vào DashboardStats */}
      <StreakBadgeWidget />
      <QuestWidget />
      {/* Journal reminder */}
      {!journalToday && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <BookHeart className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Hôm nay bạn đã viết nhật ký chưa?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chỉ 5 phút để nhìn lại Thân-Tâm-Hành và nhận phản hồi từ AI Mentor.
            </p>
          </div>
          <Link
            href="/app/journal"
            className="shrink-0 text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Viết ngay
          </Link>
        </div>
      )}

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
              {recentJournals.slice(0, 2).map((entry, i) => ({
                date: new Date(entry.created_at).toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                }),
                than: JSON.parse(entry.content).than,
                tam: JSON.parse(entry.content).tam,
                hanh: JSON.parse(entry.content).hanh,
              })).map((entry, i) => (
                <div key={i} className="rounded-lg bg-muted/20 border border-border/50 p-3 text-xs space-y-1">
                  <p className="text-muted-foreground">{entry.date}</p>
                  {entry.than && <p><span className="text-green-400">Thân:</span> {entry.than}</p>}
                  {entry.tam && <p><span className="text-red-400">Tâm:</span> {entry.tam}</p>}
                  {entry.hanh && <p><span className="text-blue-400">Hành:</span> {entry.hanh}</p>}
                </div>
              ))}
              {(journalCount ?? 0) > 2 && (
                <Link href="/app/journal" className="block text-xs text-center text-muted-foreground hover:text-primary py-2">
                  + {(journalCount ?? 0) - 2} nhật ký khác
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Thống kê */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Thống kê</h2>
        <DashboardStats
          projectCount={projectCount ?? 0}
          videoCount={videoCount ?? 0}
          docCount={docCount ?? 0}
          journalCount={journalCount ?? 0}
        />
      </div>
    </div>
  );
}