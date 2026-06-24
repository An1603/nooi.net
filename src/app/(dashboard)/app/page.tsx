import { createClient } from "@/lib/supabase/server";

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email ?? "Người dùng";
  const name = user?.user_metadata?.full_name ?? email.split("@")[0];

  const stats = [
    { label: "Dự án", value: "—", icon: "📁" },
    { label: "Video", value: "—", icon: "🎬" },
    { label: "Tài liệu", value: "—", icon: "📄" },
    { label: "Lưu trữ", value: "—", icon: "💾" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Xin chào, <span className="text-gradient-gold">{name}</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Đây là tổng quan không gian làm việc của bạn trên NOOI.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map((s, i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-border bg-card hover:bg-card/80 transition-colors"
          >
            <span className="text-xl mb-2 block">{s.icon}</span>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Bắt đầu nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Tạo dự án mới",
              desc: "Bắt đầu một dự án sản xuất nội dung với AI",
              href: "/app/projects/new",
              color: "from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:border-amber-500/30",
            },
            {
              title: "Upload video",
              desc: "Đưa video lên nền tảng và quản lý thư viện",
              href: "/app/videos/upload",
              color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30",
            },
            {
              title: "Khám phá tài liệu",
              desc: "Truy cập kho tài liệu và hướng dẫn học tập",
              href: "/app/library",
              color: "from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/30",
            },
          ].map((card, i) => (
            <a
              key={i}
              href={card.href}
              className={`p-5 rounded-xl border bg-gradient-to-br ${card.color} transition-all group`}
            >
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-muted-foreground">{card.desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Hoạt động gần đây</h2>
        <div className="p-8 rounded-xl border border-border bg-card text-center">
          <p className="text-muted-foreground text-sm">
            Chưa có hoạt động nào. Hãy bắt đầu bằng cách tạo dự án đầu tiên!
          </p>
        </div>
      </div>
    </div>
  );
}
