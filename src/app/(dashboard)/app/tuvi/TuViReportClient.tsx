"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Star,
  Heart,
  Briefcase,
  Activity,
  Home,
  DollarSign,
  ArrowLeft,
  AlertCircle,
  Sun,
  Compass,
  ScrollText,
  BookOpen,
  Clock,
  User,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { TuViResult, PhanTichItem, NguHanhTuongSinh } from "@/lib/tuvi";
import type { NguHanh, CanChi, Cuc } from "@/lib/tuvi/types";
import {
  NGU_HANH,
  HOA_GIAP_60,
  CUNG_12,
  GIO_CHI_LABELS,
  getSinhKhac,
} from "@/lib/tuvi/constants";

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string | null;
  gio_sinh: number;
  gioi_tinh: "nam" | "nu";
  tuvi_report: TuViResult | null;
}

interface Props {
  profile: ProfileData;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function formatHour(gio: number): string {
  const label = GIO_CHI_LABELS.find((g) => g.chi === ((gio >= 23 || gio < 1) ? 0 : Math.floor((gio + 1) / 2) % 12));
  if (!label) return `${gio}h`;
  return `${gio}:00 — ${label.label} (${label.range})`;
}

const HANH_COLORS: Record<NguHanh, { bg: string; text: string; border: string; ring: string }> = {
  kim:  { bg: "bg-yellow-500/10",  text: "text-yellow-400",  border: "border-yellow-500/30",  ring: "ring-yellow-500/20" },
  moc:  { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", ring: "ring-emerald-500/20" },
  thuy: { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/30",    ring: "ring-blue-500/20" },
  hoa:  { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/30",     ring: "ring-red-500/20" },
  tho:  { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30",   ring: "ring-amber-500/20" },
};

function hanhColor(hanh: NguHanh) {
  return HANH_COLORS[hanh] ?? HANH_COLORS.moc;
}

const NGU_HANH_NAMES: Record<NguHanh, string> = {
  kim: "Kim", moc: "Mộc", thuy: "Thủy", hoa: "Hỏa", tho: "Thổ"
};

const SINH_KHAC_LABEL: Record<NguHanhTuongSinh, { vi: string; tone: string; border: string; bg: string; icon: string }> = {
  tuong_sinh: { vi: "Tương sinh",   tone: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-950/20", icon: "🟢" },
  tuong_khac: { vi: "Tương khắc",   tone: "text-red-400",     border: "border-red-500/30",    bg: "bg-red-950/20",     icon: "🔴" },
  binh_thuong:{ vi: "Bình thường",  tone: "text-muted-foreground", border: "border-border",   bg: "bg-muted/30",       icon: "⚪" },
};

// ------------------- Sub-components -------------------

function PillarCard({ label, cc, accent }: { label: string; cc: CanChi; accent: "red" | "amber" }) {
  const canColor = hanhColor(cc.can.hanh);
  const chiColor = hanhColor(cc.chi.hanh);
  const napAmEntry = HOA_GIAP_60.find((h) => h.canIndex === cc.can.value && h.chiIndex === cc.chi.value);
  const accentBar = accent === "red" ? "from-red-600 to-rose-500" : "from-amber-500 to-yellow-500";
  return (
    <div className={`rounded-xl border border-amber-500/20 bg-gradient-to-b from-red-950/20 to-amber-950/10 p-4`}>
      <div className={`h-1 w-full rounded-full bg-gradient-to-r ${accentBar} mb-3`} />
      <p className="text-[10px] text-amber-300/70 mb-1 uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-xl font-bold text-amber-200">{cc.fullName}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className={`rounded-md ${canColor.bg} ${canColor.border} border px-2 py-1.5`}>
          <p className="text-muted-foreground">Thiên Can</p>
          <p className={`font-semibold ${canColor.text}`}>{cc.can.name} · {NGU_HANH_NAMES[cc.can.hanh]}</p>
          <p className="text-muted-foreground/70 text-[10px] mt-0.5">{cc.can.amDuong === "duong" ? "Dương" : "Âm"}</p>
        </div>
        <div className={`rounded-md ${chiColor.bg} ${chiColor.border} border px-2 py-1.5`}>
          <p className="text-muted-foreground">Địa Chi</p>
          <p className={`font-semibold ${chiColor.text}`}>{cc.chi.name} · {NGU_HANH_NAMES[cc.chi.hanh]}</p>
          <p className="text-muted-foreground/70 text-[10px] mt-0.5">{cc.chi.amDuong === "duong" ? "Dương" : "Âm"}</p>
        </div>
      </div>
      {napAmEntry && (
        <p className="text-[10px] text-amber-300/80 mt-2 border-t border-amber-500/10 pt-2">
          Nạp âm: <span className="text-amber-200 font-medium">{napAmEntry.napAm}</span>
        </p>
      )}
    </div>
  );
}

function PhanTichSection({ icon: Icon, title, accent, data }: {
  icon: React.ElementType; title: string; accent: "red" | "amber" | "rose"; data?: PhanTichItem;
}) {
  if (!data) return null;
  const grad = accent === "red" ? "from-red-600 to-rose-500" : accent === "amber" ? "from-amber-500 to-yellow-500" : "from-rose-600 to-red-500";
  return (
    <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-red-950/15 to-amber-950/5 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg shadow-red-950/30`}>
          <Icon className="size-4 text-white" />
        </div>
        <h3 className="font-semibold text-base text-amber-100">{title}</h3>
      </div>
      <p className="text-sm text-foreground/85 leading-relaxed">{data.noidung}</p>
      {data.chiTiet.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {data.chiTiet.map((item, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
              <span className="text-red-400 mt-1 shrink-0">◆</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 p-3 rounded-lg bg-amber-950/30 border border-amber-500/20">
        <p className="text-[11px] text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
          <Sparkles className="size-3 text-amber-400" /> Lời khuyên
        </p>
        <p className="text-xs text-amber-200/80 italic leading-relaxed">{data.loiKhuyen}</p>
      </div>
    </div>
  );
}

function CungCard({ cung, accent }: { cung: Cuc; accent: "red" | "amber" }) {
  const color = hanhColor(cung.hanh);
  const grad = accent === "red" ? "from-red-600/30 to-rose-700/20" : "from-amber-500/30 to-yellow-600/20";
  return (
    <div className={`rounded-xl border ${color.border} bg-gradient-to-br ${grad} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={`font-semibold ${color.text}`}>{cung.name}</h4>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${color.bg} ${color.text} border ${color.border}`}>
          {NGU_HANH_NAMES[cung.hanh]}
        </span>
      </div>
      <p className="text-xs text-foreground/70 leading-relaxed">{cung.meaning}</p>
    </div>
  );
}

function SinhKhacBadge({ label, value }: { label: string; value: NguHanhTuongSinh }) {
  const v = SINH_KHAC_LABEL[value];
  return (
    <div className={`px-3 py-2.5 rounded-lg border ${v.border} ${v.bg}`}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-xs font-semibold mt-0.5 ${v.tone}`}>
        {v.icon} {v.vi}
      </p>
    </div>
  );
}

// ------------------- Main component -------------------

export function TuViReportClient({ profile }: Props) {
  const [result, setResult] = useState<TuViResult | null>(profile.tuvi_report);
  const [calculating, setCalculating] = useState(!profile.tuvi_report);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!profile.tuvi_report && profile.date_of_birth) {
      (async () => {
        try {
          const { calculateTuVi } = await import("@/lib/tuvi");
          const tuviResult = calculateTuVi({
            fullName: profile.full_name,
            ngaySinh: profile.date_of_birth!,
            gioSinh: profile.gio_sinh ?? 12,
            gioiTinh: profile.gioi_tinh ?? "nam",
          });
          const { error: saveError } = await supabase
            .from("profiles")
            .update({ tuvi_report: tuviResult as unknown as Record<string, unknown> })
            .eq("user_id", profile.user_id);
          if (saveError) console.error("Failed to save tuvi report:", saveError);
          setResult(tuviResult);
          setCalculating(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Lỗi tính toán Tử Vi");
          setCalculating(false);
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (calculating) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-600 to-amber-500 animate-pulse blur-xl opacity-50" />
            <div className="relative w-full h-full flex items-center justify-center">
              <Sparkles className="size-10 animate-pulse text-red-400" />
            </div>
          </div>
          <h2 className="text-lg font-semibold animate-pulse text-amber-200">Đang luận giải Tử Vi...</h2>
          <p className="text-sm text-muted-foreground">
            Hệ thống đang tính Tứ trụ, Nạp âm và phân tích vận mệnh theo Can Chi — Ngũ hành
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="size-12 text-red-400 mx-auto" />
          <p className="text-red-400">{error}</p>
          <Link href="/app/tuvi/setup" className="text-sm text-primary hover:underline">
            Quay lại nhập thông tin
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Chưa có dữ liệu Tử Vi</p>
          <Link href="/app/tuvi/setup" className="text-primary hover:underline">
            Nhập thông tin để luận giải
          </Link>
        </div>
      </div>
    );
  }

  const banMenhHanh = result.banMenh.hanh;
  const color = hanhColor(banMenhHanh);
  const tuTru = result.tuTru;
  const phanTich = result.phanTich;

  // Ngũ hành info for the menh
  const menhInfo = NGU_HANH[banMenhHanh];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* ---------- HEADER ---------- */}
      <div>
        <Link href="/app" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-amber-300 mb-3 transition-colors">
          <ArrowLeft className="size-3" /> Về Dashboard
        </Link>
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-red-950/25 via-amber-950/10 to-transparent p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-amber-100 flex items-center gap-2">
                <ScrollText className="size-6 text-amber-400" />
                Lá số Tử Vi — {result.input.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><User className="size-3 text-amber-400" /> {result.input.gioiTinh === "nam" ? "Nam mạng" : "Nữ mạng"}</span>
                <span className="flex items-center gap-1"><Calendar className="size-3 text-amber-400" /> {formatDate(profile.date_of_birth)}</span>
                <span className="flex items-center gap-1"><Clock className="size-3 text-amber-400" /> {formatHour(result.input.gioSinh)}</span>
              </div>
              <p className="text-[11px] text-amber-300/70 mt-1">
                Âm lịch: {result.lunarDate.ngay}/{result.lunarDate.thang}{result.lunarDate.nhuan ? " (nhuận)" : ""}/{result.lunarDate.nam}
              </p>
            </div>
            <div className={`px-3.5 py-2 rounded-full text-xs font-semibold ${color.bg} ${color.text} border ${color.border}`}>
              {NGU_HANH_NAMES[banMenhHanh].toUpperCase()} — {result.banMenh.napAm}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- BẢN MỆNH / CỤC / THÂN CHỦ (Quick summary) ---------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-xl border ${color.border} ${color.bg} p-3`}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bản Mệnh (Nạp âm)</p>
          <p className={`text-sm font-bold mt-1 ${color.text}`}>{result.banMenh.napAm}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{NGU_HANH_NAMES[banMenhHanh]} · {menhInfo.direction}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cục</p>
          <p className="text-sm font-bold mt-1 text-amber-300">{result.cuc.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Số {result.cuc.value} · {NGU_HANH_NAMES[result.cuc.hanh]}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Thân chủ (Can ngày)</p>
          <p className="text-sm font-bold mt-1 text-red-300">{result.thanChu.name} {tuTru.ngay.chi.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{NGU_HANH_NAMES[result.thanChu.hanh]} · {result.thanChu.amDuong === "duong" ? "Dương" : "Âm"}</p>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Âm lịch sinh</p>
          <p className="text-sm font-bold mt-1 text-rose-300">{result.lunarDate.ngay}/{result.lunarDate.thang}/{result.lunarDate.nam}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{result.lunarDate.nhuan ? "Tháng nhuận" : "Tháng thường"}</p>
        </div>
      </div>

      {/* ---------- TỨ TRỤ (Four Pillars) ---------- */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-amber-100">
          <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-amber-500 rounded-full inline-block" />
          Tứ Trụ (Bát tự — Can Chi)
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Bốn trụ Năm — Tháng — Ngày — Giờ sinh, mỗi trụ gồm 1 Thiên Can + 1 Địa Chi, kết hợp với 60 Hoa Giáp và Nạp âm.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <PillarCard label="Trụ Năm (Niên trụ)" cc={tuTru.nam} accent="red" />
          <PillarCard label="Trụ Tháng (Nguyệt trụ)" cc={tuTru.thang} accent="amber" />
          <PillarCard label="Trụ Ngày (Nhật trụ — chủ)" cc={tuTru.ngay} accent="red" />
          <PillarCard label="Trụ Giờ (Thời trụ)" cc={tuTru.gio} accent="amber" />
        </div>
        <div className="mt-3 p-3 rounded-lg border border-amber-500/10 bg-amber-950/10">
          <p className="text-[11px] text-amber-200/70 leading-relaxed">
            <span className="font-semibold text-amber-300">Ý nghĩa:</span> Thân chủ là Can của ngày sinh
            (<span className="text-amber-300">{result.thanChu.name}</span>) — {result.thanChu.meaning.split(".")[0]}.
            Trụ Năm phản ánh dòng họ & nguồn gốc; Tháng phản ánh cha mẹ anh em; Ngày là bản thân; Giờ là con cái & cuối đời.
          </p>
        </div>
      </section>

      {/* ---------- BẢN MỆNH & CỤC (deep) ---------- */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-amber-100">
          <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-amber-500 rounded-full inline-block" />
          Bản Mệnh — Cục — Ngũ Hành
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Bản mệnh */}
          <div className={`rounded-xl border ${color.border} ${color.bg} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold ${color.text}`}>Bản Mệnh — Nạp Âm</h3>
              <span className={`text-xs px-2.5 py-1 rounded-full ${color.bg} ${color.text} border ${color.border}`}>
                {result.banMenh.napAm}
              </span>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">{result.banMenh.meaning}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-background/40">
                <p className="text-muted-foreground">Hành</p>
                <p className={`font-semibold ${color.text}`}>{NGU_HANH_NAMES[banMenhHanh]} ({menhInfo.nameEn})</p>
              </div>
              <div className="p-2 rounded-lg bg-background/40">
                <p className="text-muted-foreground">Phương / Mùa</p>
                <p className={`font-semibold ${color.text}`}>{menhInfo.direction} · {menhInfo.mua}</p>
              </div>
            </div>
            <div className="mt-3 text-[11px] space-y-1.5">
              <p className="text-emerald-400">Tính tích cực: {menhInfo.positive.join(", ")}</p>
              <p className="text-red-400/80">Tính tiêu cực: {menhInfo.negative.join(", ")}</p>
              <p className="text-amber-300/80">Bộ phận liên quan: {menhInfo.body}</p>
            </div>
          </div>
          {/* Cục */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/15 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-amber-300">Cục (Cơ quan vận hạn)</h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {result.cuc.name}
              </span>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">{result.cuc.meaning}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-background/40">
                <p className="text-muted-foreground">Số cục</p>
                <p className="font-semibold text-amber-300">{result.cuc.value}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/40">
                <p className="text-muted-foreground">Hành</p>
                <p className="font-semibold text-amber-300">{NGU_HANH_NAMES[result.cuc.hanh]}</p>
              </div>
            </div>
            <div className="mt-3 p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/10">
              <p className="text-[11px] text-amber-200/80">
                Cục quyết định độ tuổi khởi hạn của Đại hạn. Cục {result.cuc.value} → khởi hạn từ {result.daiHan[0]?.tuoiBatDau ?? "?"} tuổi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CUNG MỆNH & CUNG THÂN ---------- */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-amber-100">
          <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-amber-500 rounded-full inline-block" />
          Cung Mệnh — Cung Thân
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <CungCard cung={result.cungMenh} accent="red" />
          <CungCard cung={result.cungThan} accent="amber" />
        </div>
        <div className="mt-3 grid sm:grid-cols-3 gap-2 text-[11px]">
          {CUNG_12.slice(0, 6).map((c) => (
            <div key={c.value} className="p-2 rounded-lg border border-amber-500/10 bg-amber-950/5">
              <p className="text-amber-300 font-medium">{c.name}</p>
              <p className="text-muted-foreground mt-0.5 line-clamp-2">{c.meaning.split("—")[1]?.trim() ?? c.meaning}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- NGŨ HÀNH TƯƠNG SINH TƯƠNG KHẮC ---------- */}
      <section className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-red-950/15 to-amber-950/5 p-5">
        <h3 className="font-semibold text-sm mb-1 flex items-center gap-2 text-amber-100">
          <Compass className="size-4 text-amber-400" />
          Ngũ Hành Tương Sinh — Tương Khắc
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Mối quan hệ giữa các trụ và Mệnh-Cục. Tương sinh = hỗ trợ, tương khắc = kìm kẹp.
          Cơ chế: Kim sinh Thủy, Thủy sinh Mộc, Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim.
          Khắc: Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <SinhKhacBadge label="Mệnh ↔ Cục" value={result.tuongSinhKhac.menhCuc} />
          <SinhKhacBadge label="Năm ↔ Tháng" value={result.tuongSinhKhac.namThang} />
          <SinhKhacBadge label="Tháng ↔ Ngày" value={result.tuongSinhKhac.thangNgay} />
          <SinhKhacBadge label="Ngày ↔ Giờ" value={result.tuongSinhKhac.ngayGio} />
        </div>
        {/* Extra inter-pillar analysis */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
          {[
            { a: "Năm → Ngày", h: getSinhKhac(tuTru.nam.can.hanh, tuTru.ngay.can.hanh) },
            { a: "Năm → Giờ", h: getSinhKhac(tuTru.nam.can.hanh, tuTru.gio.can.hanh) },
            { a: "Mệnh → Thân", h: getSinhKhac(banMenhHanh, result.thanChu.hanh) },
          ].map((x) => {
            const v = SINH_KHAC_LABEL[x.h];
            return (
              <div key={x.a} className={`px-2.5 py-2 rounded-md border ${v.border} ${v.bg}`}>
                <p className="text-muted-foreground">{x.a}</p>
                <p className={`font-medium ${v.tone}`}>{v.icon} {v.vi}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- LUẬN GIẢI CHI TIẾT ---------- */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-amber-100">
          <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-amber-500 rounded-full inline-block" />
          Luận giải chi tiết — 7 phương diện
        </h2>
        <div className="grid gap-4">
          <PhanTichSection icon={Star} title="Tính cách — Bản chất" accent="red" data={phanTich.tinhCach} />
          <PhanTichSection icon={Briefcase} title="Sự nghiệp — Công danh" accent="amber" data={phanTich.suNghiep} />
          <PhanTichSection icon={Heart} title="Tình duyên — Hôn nhân" accent="rose" data={phanTich.tinhDuyen} />
          <PhanTichSection icon={Activity} title="Sức khỏe — Bệnh tật" accent="red" data={phanTich.sucKhoe} />
          <PhanTichSection icon={Home} title="Gia đạo — Phụ mẫu" accent="amber" data={phanTich.giaDao} />
          <PhanTichSection icon={DollarSign} title="Tài lộc — Phú quý" accent="rose" data={phanTich.taiLoc} />
          <PhanTichSection icon={Sun} title="Vận hạn — Thời thế" accent="red" data={phanTich.vanHan} />
        </div>
      </section>

      {/* ---------- ĐẠI HẠN (10-year cycles) ---------- */}
      {result.daiHan.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2 text-amber-100">
            <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-amber-500 rounded-full inline-block" />
            Đại Hạn — Các giai đoạn 10 năm
          </h2>
          <p className="text-[11px] text-muted-foreground mb-3">
            Mỗi Đại hạn kéo dài 10 năm, ứng với một Cung (Can Chi) nhất định, quyết định vận trình sự nghiệp, tài lộc, tình duyên giai đoạn đó.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {result.daiHan.map((dh, i) => {
              const napAm = HOA_GIAP_60.find((h) => h.canIndex === dh.cung.can.value && h.chiIndex === dh.cung.chi.value);
              const c = hanhColor(dh.cung.can.hanh);
              return (
                <div key={i} className={`rounded-lg border ${c.border} ${c.bg} p-3`}>
                  <p className="text-[10px] text-muted-foreground">{dh.thoiGian}</p>
                  <p className={`text-sm font-bold mt-0.5 ${c.text}`}>{dh.cung.fullName}</p>
                  {napAm && <p className="text-[10px] text-muted-foreground mt-0.5">{napAm.napAm}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------- NĂM HIỆN TẠI ---------- */}
      {result.namHienTai && (
        <section className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/25 to-red-950/15 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-amber-100">
              <Sun className="size-4 text-amber-400" />
              Năm {result.namHienTai.nam} — {result.namHienTai.amLich}
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              result.namHienTai.tuongKhacTuoi
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}>
              {result.namHienTai.tuongKhacTuoi ? "Xung khắc tuổi" : "Hợp tuổi"}
            </span>
          </div>
          <p className="text-sm text-amber-100/85 leading-relaxed">{result.namHienTai.meaning}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
              <Star className="size-2.5" /> Sao: {result.namHienTai.sao}
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <AlertCircle className="size-2.5" /> Hạn: {result.namHienTai.han}
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
              <Compass className="size-2.5" /> Hành: {NGU_HANH_NAMES[result.namHienTai.hanh]}
            </span>
          </div>
          <p className="text-[10px] text-amber-300/60 mt-2">
            Cập nhật: {result.ngayHienTai}
          </p>
        </section>
      )}

      {/* ---------- CƠ SỞ KHOA HỌC & NGUỒN GỐC ---------- */}
      <section className="rounded-2xl border border-amber-500/25 bg-gradient-to-b from-red-950/20 via-amber-950/10 to-transparent p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-200">
          <BookOpen className="size-5 text-amber-400" />
          Cơ sở khoa học & Nguồn gốc Tử Vi Phương Đông
        </h2>

        <div className="space-y-4 text-sm leading-relaxed">
          <div>
            <h3 className="font-semibold text-amber-300 mb-1.5 flex items-center gap-1.5">
              <ScrollText className="size-3.5" /> Nguồn gốc
            </h3>
            <p className="text-foreground/80">
              Tử Vi Đẩu Số (紫微斗數) là hệ thống chiêm tinh học phương Đông, được phát triển từ thời
              Đường-Tống (khoảng thế kỷ 7-10) tại Trung Quốc. Truyền thuyết cho rằng
              <span className="text-amber-300 font-medium"> Trần Đoàn (陈抟, 871-989) </span>
              là người hệ thống hóa Tử Vi.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
              <Compass className="size-3.5" /> Cơ sở lý luận
            </h3>
            <ul className="space-y-2 text-foreground/80">
              <li className="flex gap-2"><span className="text-red-400 shrink-0">◆</span>
                <span><span className="text-amber-300 font-medium">Âm Dương Ngũ Hành:</span> Mọi hiện tượng vũ trụ đều thuộc Âm hoặc Dương, và 5 hành: Kim, Mộc, Thủy, Hỏa, Thổ.</span>
              </li>
              <li className="flex gap-2"><span className="text-red-400 shrink-0">◆</span>
                <span><span className="text-amber-300 font-medium">Thiên Can (10):</span> Giáp, Ất, Bính, Đinh, Mậu, Kỷ, Canh, Tân, Nhâm, Quý — đại diện cho năng lượng thiên.</span>
              </li>
              <li className="flex gap-2"><span className="text-red-400 shrink-0">◆</span>
                <span><span className="text-amber-300 font-medium">Địa Chi (12):</span> Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi — đại diện cho năng lượng địa.</span>
              </li>
              <li className="flex gap-2"><span className="text-red-400 shrink-0">◆</span>
                <span><span className="text-amber-300 font-medium">60 Hoa Giáp:</span> Kết hợp 10 Can × 12 Chi = 60 năm lặp lại, mỗi năm có Nạp Âm (bản chất ngũ hành).</span>
              </li>
              <li className="flex gap-2"><span className="text-red-400 shrink-0">◆</span>
                <span><span className="text-amber-300 font-medium">Tứ Trụ:</span> Năm, tháng, ngày, giờ sinh — mỗi trụ gồm 1 Can + 1 Chi.</span>
              </li>
              <li className="flex gap-2"><span className="text-red-400 shrink-0">◆</span>
                <span><span className="text-amber-300 font-medium">Cung Mệnh:</span> Xác định bản chất con người dựa trên tháng sinh + giờ sinh.</span>
              </li>
              <li className="flex gap-2"><span className="text-red-400 shrink-0">◆</span>
                <span><span className="text-amber-300 font-medium">Đại hạn:</span> Mỗi 10 năm một giai đoạn vận hạn.</span>
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-lg border border-amber-500/15 bg-amber-950/15">
            <h3 className="font-semibold text-amber-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Mô hình AI
            </h3>
            <p className="text-foreground/80">
              NOOI sử dụng thuật toán chuyển đổi Dương lịch → Âm lịch chính xác (1900-2100), tính Tứ Trụ dựa trên thuật toán thiên văn
              <span className="text-amber-300"> Jean Meeus</span>, và Nạp Âm theo 60 Hoa Giáp chuẩn.
            </p>
          </div>

          <div className="pt-2 border-t border-amber-500/15">
            <p className="text-[11px] text-muted-foreground italic">
              <span className="text-amber-400 font-medium">Ghi chú:</span> Tử Vi là di sản văn hóa phương Đông, kết hợp thiên văn học cổ đại và triết học Âm Dương. Thông tin mang tính tham khảo.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <div className="text-center pt-2 border-t border-amber-500/15">
        <p className="text-[10px] text-muted-foreground">
          Lá số Tử Vi được luận giải dựa trên Tứ trụ (Bát tự) — Can Chi và Ngũ hành.
          Thông tin mang tính tham khảo và phát triển bản thân.
        </p>
        <p className="text-[10px] text-amber-300/60 mt-1">
          NOOI — Kết nối chuyển mình.
        </p>
      </div>
    </div>
  );
}
