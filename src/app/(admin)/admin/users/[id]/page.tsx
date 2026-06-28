import { createAdminClient } from "@/lib/supabase/admin";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Calendar, Clock, MapPin,
  Star, Sparkles, Moon, Hash, Target, Heart, Eye,
  RefreshCw, TrendingUp, AlertTriangle, Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("user_id", id).maybeSingle();
  if (!profile) notFound();

  const { data: adminUser } = await supabase
    .from("admin_users").select("role, email").eq("user_id", id).maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const numerology = profile.numerology_report as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tuvi = profile.tuvi_report as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const astrology = profile.chiem_tinh_report as any;

  return (
    <div className="p-6 space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3" /> Quay lại danh sách
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">{profile.full_name || "Chưa đặt tên"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {adminUser?.email ?? "Không có email"} ·{" "}
            {adminUser?.role === "super_admin" ? <span className="text-primary font-medium">Super Admin</span>
             : adminUser?.role === "admin" ? <span className="text-primary">Admin</span> : "User"}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          profile.onboarding_completed ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
        }`}>
          {profile.onboarding_completed ? "Đã hoàn thành" : "Chưa setup"}
        </span>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {profile.date_of_birth && <InfoCard icon={Calendar} label="Ngày sinh" value={String(profile.date_of_birth).split("T")[0]} />}
        {profile.gio_sinh != null && <InfoCard icon={Clock} label="Giờ sinh" value={`${profile.gio_sinh}h`} />}
        {profile.gioi_tinh && <InfoCard icon={User} label="Giới tính" value={profile.gioi_tinh === "nam" ? "Nam" : "Nữ"} />}
        {profile.noi_sinh && <InfoCard icon={MapPin} label="Nơi sinh" value={profile.noi_sinh} />}
      </div>

      {/* ====== Numerology Report ====== */}
      <Section title="Thần số học" icon={Star} color="text-amber-400" border="border-amber-500/20">
        {numerology ? (
          <div className="space-y-4">
            {/* Core numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {(["lifePath","destiny","soulUrge","personality","birthDay","maturity","balance"] as const).map((key) => {
                const cn = numerology[key];
                if (!cn) return null;
                const labels: Record<string,string> = {lifePath:"Đường đời",destiny:"Sứ mệnh",soulUrge:"Linh hồn",personality:"Tính cách",birthDay:"Ngày sinh",maturity:"Trưởng thành",balance:"Cân bằng"};
                return (
                  <div key={key} className="rounded-lg border border-border/20 bg-white/[0.02] p-3 text-center">
                    <p className="text-2xl font-bold text-amber-400">{cn.value}</p>
                    <p className="text-xs text-muted-foreground">{labels[key]||key}</p>
                    <p className="text-[11px] font-medium mt-0.5">{cn.name||""}</p>
                    {cn.meaning && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{cn.meaning}</p>}
                  </div>
                );
              })}
            </div>
            {/* Cycles */}
            {numerology.periodCycles?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><RefreshCw className="size-3"/> Chu kỳ cuộc đời</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {numerology.periodCycles.map((pc: any,i: number) => (
                    <div key={i} className="rounded-lg border border-border/20 bg-white/[0.02] p-2">
                      <span className="text-xs font-medium text-amber-400">{pc.number}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">{pc.ageRange}</span>
                      {pc.meaning && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{pc.meaning}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : <EmptyReport />}
      </Section>

      {/* ====== TuVi Report ====== */}
      <Section title="Tử Vi" icon={Sparkles} color="text-red-400" border="border-red-500/20">
        {tuvi ? (
          <div className="space-y-4">
            {/* Can Chi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tuvi.namCanChi && <TuViCard label="Năm" value={tuvi.namCanChi.fullName||tuvi.namCanChi} hanh={tuvi.namCanChi?.can?.hanh||tuvi.namCanChi?.hanh} />}
              {tuvi.thangCanChi && <TuViCard label="Tháng" value={tuvi.thangCanChi.fullName||tuvi.thangCanChi} hanh={tuvi.thangCanChi?.can?.hanh||tuvi.thangCanChi?.hanh} />}
              {tuvi.ngayCanChi && <TuViCard label="Ngày" value={tuvi.ngayCanChi.fullName||tuvi.ngayCanChi} hanh={tuvi.ngayCanChi?.can?.hanh||tuvi.ngayCanChi?.hanh} />}
              {tuvi.gioCanChi && <TuViCard label="Giờ" value={tuvi.gioCanChi.fullName||tuvi.gioCanChi} hanh={tuvi.gioCanChi?.can?.hanh||tuvi.gioCanChi?.hanh} />}
            </div>
            {/* Lunar date */}
            {tuvi.amLich && (
              <div className="text-xs text-muted-foreground">
                Âm lịch: {tuvi.amLich.ngay}/{tuvi.amLich.thang}/{tuvi.amLich.nam}
                {tuvi.amLich.nhuan ? " (nhuận)" : ""}
              </div>
            )}
            {/* Menh & Than */}
            <div className="flex flex-wrap gap-3">
              {tuvi.menh && <Badge label="Mệnh" value={tuvi.menh} color="bg-red-500/10 text-red-400"/>}
              {tuvi.than && <Badge label="Thân" value={tuvi.than} color="bg-blue-500/10 text-blue-400"/>}
              {tuvi.cuc && <Badge label="Cục" value={tuvi.cuc} color="bg-purple-500/10 text-purple-400"/>}
            </div>
            {/* Ngu Hanh */}
            {tuvi.nguHanh && (
              <HanhDisplay hanh={tuvi.nguHanh} />
            )}
          </div>
        ) : <EmptyReport />}
      </Section>

      {/* ====== Astrology Report ====== */}
      <Section title="Chiêm tinh" icon={Moon} color="text-purple-400" border="border-purple-500/20">
        {astrology ? (
          <div className="space-y-4">
            {/* Big 3 */}
            <div className="grid grid-cols-3 gap-3">
              <AstroBigCard label="Mặt Trời" value={astrology.sunSign||astrology.sun?.sign} icon="☀️" color="text-amber-400" />
              <AstroBigCard label="Mặt Trăng" value={astrology.moonSign||astrology.moon?.sign} icon="🌙" color="text-blue-300" />
              <AstroBigCard label="Cung Mọc" value={astrology.risingSign||astrology.ascendant?.sign} icon="🌅" color="text-purple-400" />
            </div>
            {/* Planets */}
            {astrology.planets?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Hành tinh</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {astrology.planets.map((p: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border/20 bg-white/[0.02] p-2 text-center">
                      <p className="text-sm font-medium">{p.symbol||""} {p.planet}</p>
                      <p className="text-[11px] text-purple-400">{p.sign}</p>
                      <p className="text-[10px] text-muted-foreground">Nhà {p.house}{p.retrograde ? " ℞" : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Dominant */}
            <div className="flex flex-wrap gap-3">
              {astrology.dominantElement && <Badge label="Nguyên tố" value={astrology.dominantElement} color="bg-cyan-500/10 text-cyan-400"/>}
              {astrology.dominantQuality && <Badge label="Đặc tính" value={astrology.dominantQuality} color="bg-pink-500/10 text-pink-400"/>}
            </div>
            {/* Interpretations */}
            {astrology.interpretations && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Luận giải</h4>
                {(["tongQuan","tinhCach","suNghiep","tinhDuyen","sucKhoe"] as const).map((k) => {
                  const val = astrology.interpretations[k];
                  if (!val) return null;
                  const labels: Record<string,string> = {tongQuan:"Tổng quan",tinhCach:"Tính cách",suNghiep:"Sự nghiệp",tinhDuyen:"Tình duyên",sucKhoe:"Sức khoẻ"};
                  return (
                    <div key={k} className="rounded-lg border border-border/20 bg-white/[0.02] p-3">
                      <p className="text-[11px] font-medium text-purple-400 mb-0.5">{labels[k]||k}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{val}</p>
                    </div>
                  );
                })}
                {astrology.interpretations.loiKhuyen && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-[11px] font-medium text-primary mb-0.5">💡 Lời khuyên</p>
                    <p className="text-xs text-muted-foreground">{astrology.interpretations.loiKhuyen}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : <EmptyReport />}
      </Section>
    </div>
  );
}

/* ── Shared components ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/30 bg-white/[0.01] p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5"><Icon className="size-3.5"/> {label}</div>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function Section({ title, icon: Icon, color, border, children }: {
  title: string; icon: any; color: string; border: string; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border ${border} bg-white/[0.01] p-5`}>
      <div className="flex items-center gap-2 mb-4"><Icon className={`size-4 ${color}`}/><h2 className="text-base font-semibold">{title}</h2></div>
      {children}
    </div>
  );
}

function EmptyReport() {
  return <p className="text-xs text-muted-foreground py-2">Chưa có dữ liệu báo cáo.</p>;
}

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-lg px-3 py-1.5 ${color} text-xs font-medium`}>
      {label}: {value}
    </div>
  );
}

function TuViCard({ label, value, hanh }: { label: string; value: string; hanh?: string }) {
  const hanhColor: Record<string,string> = {kim:"text-yellow-300",moc:"text-green-400",thuy:"text-blue-400",hoa:"text-red-400",tho:"text-amber-500"};
  return (
    <div className="rounded-lg border border-border/20 bg-white/[0.02] p-2.5 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
      {hanh && <p className={`text-[10px] ${hanhColor[hanh]||"text-muted-foreground"}`}>{hanh}</p>}
    </div>
  );
}

function HanhDisplay({ hanh }: { hanh: any }) {
  if (typeof hanh !== "object") return <Badge label="Ngũ hành" value={String(hanh)} color="bg-amber-500/10 text-amber-400"/>;
  const entries = Object.entries(hanh).filter(([_,v]) => typeof v === "number");
  if (!entries.length) return null;
  const max = Math.max(...entries.map(([_,v]) => v as number), 1);
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted-foreground">Cân bằng Ngũ Hành</p>
      <div className="flex gap-2">
        {entries.map(([k,v]) => {
          const pct = Math.round(((v as number)/max)*100);
          const colors: Record<string,string> = {kim:"bg-yellow-400",moc:"bg-green-400",thuy:"bg-blue-400",hoa:"bg-red-400",tho:"bg-amber-600"};
          return (
            <div key={k} className="flex-1 text-center">
              <div className="h-12 bg-white/5 rounded mb-1 relative overflow-hidden">
                <div className={`absolute bottom-0 w-full ${colors[k]||"bg-gray-400"} rounded transition-all`} style={{height:`${pct}%`}}/>
              </div>
              <span className="text-[10px] text-muted-foreground">{k}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AstroBigCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="rounded-lg border border-border/20 bg-white/[0.02] p-3 text-center">
      <p className="text-lg mb-0.5">{icon}</p>
      <p className={`text-sm font-bold ${color}`}>{value||"—"}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}