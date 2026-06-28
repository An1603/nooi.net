import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Calendar, Clock, MapPin, Star, Sparkles, Moon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  if (!profile) notFound();

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role, email")
    .eq("user_id", id)
    .maybeSingle();

  const numerology = profile.numerology_report as Record<string, unknown> | null;
  const tuvi = profile.tuvi_report as Record<string, unknown> | null;
  const astrology = profile.chiem_tinh_report as Record<string, unknown> | null;

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-3" /> Quay lại danh sách
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{profile.full_name || "Chưa đặt tên"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {adminUser?.email ?? "Không có email"} ·{" "}
            {adminUser?.role === "super_admin" ? (
              <span className="text-primary font-medium">Super Admin</span>
            ) : adminUser?.role === "admin" ? (
              <span className="text-primary">Admin</span>
            ) : (
              "User"
            )}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          profile.onboarding_completed
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-amber-500/10 text-amber-400"
        }`}>
          {profile.onboarding_completed ? "Đã hoàn thành" : "Chưa setup"}
        </span>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {profile.date_of_birth && (
          <InfoCard icon={<Calendar className="size-4" />} label="Ngày sinh" value={profile.date_of_birth?.split?.("T")?.[0] ?? String(profile.date_of_birth)} />
        )}
        {profile.gio_sinh != null && (
          <InfoCard icon={<Clock className="size-4" />} label="Giờ sinh" value={`${profile.gio_sinh}h`} />
        )}
        {profile.gioi_tinh && (
          <InfoCard icon={<User className="size-4" />} label="Giới tính" value={profile.gioi_tinh === "nam" ? "Nam" : "Nữ"} />
        )}
        {profile.noi_sinh && (
          <InfoCard icon={<MapPin className="size-4" />} label="Nơi sinh" value={profile.noi_sinh} />
        )}
      </div>

      {/* Reports */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Báo cáo</h2>

        {/* Numerology */}
        <ReportCard
          icon={<Star className="size-4" />}
          title="Thần số học"
          color="text-amber-400"
          borderColor="border-amber-500/20"
          data={numerology}
        />

        {/* TuVi */}
        <ReportCard
          icon={<Sparkles className="size-4" />}
          title="Tử Vi"
          color="text-red-400"
          borderColor="border-red-500/20"
          data={tuvi}
        />

        {/* Astrology */}
        <ReportCard
          icon={<Moon className="size-4" />}
          title="Chiêm tinh"
          color="text-purple-400"
          borderColor="border-purple-500/20"
          data={astrology}
        />
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/30 bg-white/[0.01] p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon} {label}
      </div>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function ReportCard({
  icon, title, color, borderColor, data,
}: {
  icon: React.ReactNode; title: string; color: string; borderColor: string; data: Record<string, unknown> | null;
}) {
  if (!data) {
    return (
      <div className={`rounded-xl border ${borderColor} bg-white/[0.01] p-4 opacity-50`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={color}>{icon}</span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground">Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${borderColor} bg-white/[0.01] p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={color}>{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <pre className="text-[10px] text-muted-foreground overflow-auto max-h-64 whitespace-pre-wrap leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}