import { createAdminClient } from "@/lib/supabase/admin";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Calendar, Clock, MapPin, Star, Sparkles, Moon, RefreshCw, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", id).maybeSingle();
  if (!profile) notFound();
  const { data: adminUser } = await supabase.from("admin_users").select("role, email").eq("user_id", id).maybeSingle();

  const num = profile.numerology_report as any;
  const tuvi = profile.tuvi_report as any;
  const ast = profile.chiem_tinh_report as any;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" /> Quay lại danh sách</Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">{profile.full_name || "Chưa đặt tên"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {adminUser?.email ?? "—"} ·{" "}
            {adminUser?.role === "super_admin" ? <span className="text-primary font-medium">Super Admin</span> : adminUser?.role === "admin" ? <span className="text-primary">Admin</span> : "User"}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${profile.onboarding_completed ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
          {profile.onboarding_completed ? "Đã hoàn thành" : "Chưa setup"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {profile.date_of_birth && <ICard i={Calendar} l="Ngày sinh" v={String(profile.date_of_birth).split("T")[0]} />}
        {profile.gio_sinh != null && <ICard i={Clock} l="Giờ sinh" v={`${profile.gio_sinh}h`} />}
        {profile.gioi_tinh && <ICard i={User} l="Giới tính" v={profile.gioi_tinh === "nam" ? "Nam" : "Nữ"} />}
        {profile.noi_sinh && <ICard i={MapPin} l="Nơi sinh" v={profile.noi_sinh} />}
      </div>

      <NumerologyReport num={num} />
      <TuViReport tuvi={tuvi} />
      <AstrologyReport ast={ast} />
    </div>
  );
}

/* ====== Numerology ====== */

function NumerologyReport({ num }: { num: any }) {
  if (!num) return <Sec icon={Star} color="text-amber-400" border="border-amber-500/20" title="Thần số học"><Empt /></Sec>;
  const keys = ["lifePath","destiny","soulUrge","personality","birthDay","maturity","balance"] as const;
  const lb: Record<string,string> = {lifePath:"Đường đời",destiny:"Sứ mệnh",soulUrge:"Linh hồn",personality:"Tính cách",birthDay:"Ngày sinh",maturity:"Trưởng thành",balance:"Cân bằng"};
  return (
    <Sec icon={Star} color="text-amber-400" border="border-amber-500/20" title="Thần số học">
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {keys.map(k => {
            const n = num[k]; if (!n) return null;
            return <div key={k} className="rounded-lg border border-border/20 bg-white/[0.02] p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{n.value}</p>
              <p className="text-[10px] text-muted-foreground">{lb[k]}</p>
              <p className="text-[11px] font-medium mt-0.5">{n.name || ""}</p>
              {n.meaning && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{n.meaning}</p>}
            </div>;
          })}
        </div>
        {num.periodCycles?.length > 0 && <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><RefreshCw className="size-3" /> Chu kỳ cuộc đời</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {num.periodCycles.map((pc: any, i: number) => <div key={i} className="rounded-lg border border-border/20 bg-white/[0.02] p-2">
              <span className="text-xs font-medium text-amber-400">{pc.number}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">{pc.ageRange}</span>
              {pc.meaning && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{pc.meaning}</p>}
            </div>)}
          </div>
        </div>}
      </div>
    </Sec>
  );
}

/* ====== TuVi ====== */

function TuViReport({ tuvi }: { tuvi: any }) {
  if (!tuvi) return <Sec icon={Sparkles} color="text-red-400" border="border-red-500/20" title="Tử Vi"><Empt /></Sec>;
  return (
    <Sec icon={Sparkles} color="text-red-400" border="border-red-500/20" title="Tử Vi">
      <div className="space-y-4">
        {tuvi.tuTru && <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Tứ Trụ</h4>
          <div className="grid grid-cols-4 gap-2">
            {(["nam","thang","ngay","gio"] as const).map(k => {
              const t = tuvi.tuTru[k]; if (!t) return null;
              const labels: Record<string,string> = {nam:"Năm",thang:"Tháng",ngay:"Ngày",gio:"Giờ"};
              return <div key={k} className="rounded-lg border border-border/20 bg-white/[0.02] p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">{labels[k]}</p>
                <p className="text-sm font-bold">{t.fullName}</p>
                <p className="text-[10px] text-muted-foreground">{t.can?.hanh || ""} {t.can?.amDuong || ""}</p>
              </div>;
            })}
          </div>
        </div>}
        {tuvi.lunarDate && <div className="text-xs text-muted-foreground">Âm lịch: {tuvi.lunarDate.ngay}/{tuvi.lunarDate.thang}/{tuvi.lunarDate.nam}{tuvi.lunarDate.nhuan ? " (nhuận)" : ""}</div>}
        <div className="flex flex-wrap gap-3">
          {tuvi.banMenh && <Badge label="Bản Mệnh" value={tuvi.banMenh.napAm || tuvi.banMenh.hanhName || tuvi.banMenh.hanh} color="bg-amber-500/10 text-amber-400" />}
          {tuvi.cuc && <Badge label="Cục" value={`${tuvi.cuc.name || tuvi.cuc.value} — ${tuvi.cuc.hanh || ""}`} color="bg-purple-500/10 text-purple-400" />}
          {tuvi.cungMenh && <Badge label="Cung Mệnh" value={tuvi.cungMenh.name || tuvi.cungMenh} color="bg-red-500/10 text-red-400" />}
          {tuvi.cungThan && <Badge label="Cung Thân" value={tuvi.cungThan.name || tuvi.cungThan} color="bg-blue-500/10 text-blue-400" />}
        </div>
        {tuvi.daiHan?.length > 0 && <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><TrendingUp className="size-3" /> Đại hạn</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tuvi.daiHan.map((dh: any, i: number) => <div key={i} className="rounded-lg border border-border/20 bg-white/[0.02] p-2">
              <span className="text-[10px] text-muted-foreground">{dh.thoiGian}</span>
              <p className="text-xs font-medium text-red-400 mt-0.5">{dh.cung?.fullName || dh.cung}</p>
            </div>)}
          </div>
        </div>}
      </div>
    </Sec>
  );
}

/* ====== Astrology ====== */

function AstrologyReport({ ast }: { ast: any }) {
  if (!ast) return <Sec icon={Moon} color="text-purple-400" border="border-purple-500/20" title="Chiêm tinh"><Empt /></Sec>;
  return (
    <Sec icon={Moon} color="text-purple-400" border="border-purple-500/20" title="Chiêm tinh">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <ABig label="Mặt Trời" val={ast.sunSign || ast.sun?.sign} icon="☀️" color="text-amber-400" />
          <ABig label="Mặt Trăng" val={ast.moonSign || ast.moon?.sign} icon="🌙" color="text-blue-300" />
          <ABig label="Cung Mọc" val={ast.risingSign || ast.ascendant?.sign} icon="🌅" color="text-purple-400" />
        </div>
        {ast.planets?.length > 0 && <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Hành tinh</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {ast.planets.map((p: any, i: number) => <div key={i} className="rounded-lg border border-border/20 bg-white/[0.02] p-2 text-center">
              <p className="text-sm font-medium">{p.symbol || ""} {p.planet}</p>
              <p className="text-[11px] text-purple-400">{p.sign}</p>
              <p className="text-[10px] text-muted-foreground">Nhà {p.house}{p.retrograde ? " ℞" : ""}</p>
            </div>)}
          </div>
        </div>}
        <div className="flex flex-wrap gap-3">
          {ast.dominantElement && <Badge label="Nguyên tố" value={ast.dominantElement} color="bg-cyan-500/10 text-cyan-400" />}
          {ast.dominantQuality && <Badge label="Đặc tính" value={ast.dominantQuality} color="bg-pink-500/10 text-pink-400" />}
        </div>
        {ast.interpretations && <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Luận giải</h4>
          {(["tongQuan","tinhCach","suNghiep","tinhDuyen","sucKhoe"] as const).map(k => {
            const v = ast.interpretations[k]; if (!v) return null;
            const lb: Record<string,string> = {tongQuan:"Tổng quan",tinhCach:"Tính cách",suNghiep:"Sự nghiệp",tinhDuyen:"Tình duyên",sucKhoe:"Sức khoẻ"};
            return <div key={k} className="rounded-lg border border-border/20 bg-white/[0.02] p-3"><p className="text-[11px] font-medium text-purple-400 mb-0.5">{lb[k]}</p><p className="text-xs text-muted-foreground leading-relaxed">{v}</p></div>;
          })}
          {ast.interpretations.loiKhuyen && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3"><p className="text-[11px] font-medium text-primary mb-0.5">💡 Lời khuyên</p><p className="text-xs text-muted-foreground">{ast.interpretations.loiKhuyen}</p></div>}
        </div>}
        {ast.aspects?.length > 0 && <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Góc chiếu ({ast.aspects.length})</h4>
          <div className="flex flex-wrap gap-1.5">
            {ast.aspects.map((a: any, i: number) => <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${a.harmonious ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{a.planet1} {a.typeVi || a.type} {a.planet2}</span>)}
          </div>
        </div>}
      </div>
    </Sec>
  );
}

/* ===== Shared ===== */

function ICard({ i: I, l, v }: { i: any; l: string; v: string }) {
  return <div className="rounded-lg border border-border/30 bg-white/[0.01] p-3"><div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5"><I className="size-3.5" /> {l}</div><p className="text-sm font-medium">{v}</p></div>;
}

function Sec({ icon: I, color, border, title, children }: { icon: any; color: string; border: string; title: string; children: React.ReactNode }) {
  return <div className={`rounded-xl border ${border} bg-white/[0.01] p-5`}><div className="flex items-center gap-2 mb-4"><I className={`size-4 ${color}`} /><h2 className="text-base font-semibold">{title}</h2></div>{children}</div>;
}

function Empt() { return <p className="text-xs text-muted-foreground py-2">Chưa có dữ liệu báo cáo.</p>; }

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className={`rounded-lg px-3 py-1.5 ${color} text-xs font-medium`}>{label}: {value}</div>;
}

function ABig({ label, val, icon, color }: { label: string; val: string; icon: string; color: string }) {
  return <div className="rounded-lg border border-border/20 bg-white/[0.02] p-3 text-center"><p className="text-lg mb-0.5">{icon}</p><p className={`text-sm font-bold ${color}`}>{val || "—"}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>;
}