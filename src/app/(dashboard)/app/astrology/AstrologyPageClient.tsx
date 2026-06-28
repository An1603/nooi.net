"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  ArrowLeft,
  Globe,
  MapPin,
  Loader2,
  Star,
  Heart,
  Briefcase,
  Activity,
  Shield,
  Compass,
  Sun,
  Moon,
  TrendingUp,
  Scale,
  Flame,
  Mountain,
  Wind,
  Droplet,
  Orbit,
  Telescope,
  Microscope,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AstrologyResult, PlanetPosition, House, Aspect } from "@/lib/astrology";
import { ZODIAC, PLANETS, ELEMENTS } from "@/lib/astrology/constants";

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string | null;
  gio_sinh: number;
  gioi_tinh: "nam" | "nu";
  noi_sinh: string;
  vi_do: number;
  kinh_do: number;
  chiem_tinh_report: AstrologyResult | null;
}
interface Props {
  profile: ProfileData;
}

// City coordinate database
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "hà nội": { lat: 21.0285, lng: 105.8542 },
  hanoi: { lat: 21.0285, lng: 105.8542 },
  hcm: { lat: 10.8231, lng: 106.6297 },
  "tp hcm": { lat: 10.8231, lng: 106.6297 },
  "hồ chí minh": { lat: 10.8231, lng: 106.6297 },
  saigon: { lat: 10.8231, lng: 106.6297 },
  "đà nẵng": { lat: 16.0544, lng: 108.2022 },
  danang: { lat: 16.0544, lng: 108.2022 },
  "hải phòng": { lat: 20.8449, lng: 106.6881 },
  haiphong: { lat: 20.8449, lng: 106.6881 },
  "cần thơ": { lat: 10.0452, lng: 105.7469 },
  cantho: { lat: 10.0452, lng: 105.7469 },
  "huế": { lat: 16.4637, lng: 107.5909 },
  hue: { lat: 16.4637, lng: 107.5909 },
  "nha trang": { lat: 12.2388, lng: 109.1967 },
  nhatrang: { lat: 12.2388, lng: 109.1967 },
  "vũng tàu": { lat: 10.3458, lng: 107.0843 },
  vungtau: { lat: 10.3458, lng: 107.0843 },
  "đà lạt": { lat: 11.9465, lng: 108.4419 },
  dalat: { lat: 11.9465, lng: 108.4419 },
  "biên hòa": { lat: 10.9574, lng: 106.8426 },
  bienhoa: { lat: 10.9574, lng: 106.8426 },
  "hà tĩnh": { lat: 18.3431, lng: 105.9054 },
  vinh: { lat: 18.6796, lng: 105.6813 },
  "thanh hóa": { lat: 19.8069, lng: 105.7852 },
  "hải dương": { lat: 20.941, lng: 106.333 },
  "bắc ninh": { lat: 21.1861, lng: 106.0763 },
  "quảng ninh": { lat: 20.9371, lng: 107.0746 },
  "long an": { lat: 10.6056, lng: 106.4268 },
  "đồng nai": { lat: 10.9447, lng: 106.8243 },
  "bình dương": { lat: 11.0015, lng: 106.6528 },
  "hà nam": { lat: 20.5833, lng: 105.9833 },
  "thái bình": { lat: 20.4569, lng: 106.3331 },
  "nam định": { lat: 20.4333, lng: 106.1667 },
  "ninh bình": { lat: 20.2538, lng: 105.9748 },
  "quảng ngãi": { lat: 15.1405, lng: 108.7924 },
  "bình định": { lat: 13.8833, lng: 109.1167 },
  "phú yên": { lat: 13.1333, lng: 109.3 },
  "khánh hòa": { lat: 12.25, lng: 109.1833 },
  "bình thuận": { lat: 11.0833, lng: 108.0833 },
  "tiền giang": { lat: 10.35, lng: 106.35 },
  "bến tre": { lat: 10.2333, lng: 106.3833 },
  "trà vinh": { lat: 9.9333, lng: 106.35 },
  "sóc trăng": { lat: 9.6036, lng: 105.98 },
  "bạc liêu": { lat: 9.2833, lng: 105.7333 },
  "cà mau": { lat: 9.1833, lng: 105.15 },
  "kiên giang": { lat: 10.0167, lng: 105.0833 },
  "an giang": { lat: 10.3667, lng: 105.4167 },
  "đồng tháp": { lat: 10.45, lng: 105.6333 },
  "vĩnh long": { lat: 10.25, lng: 105.9667 },
};

function findCoords(city: string): { lat: number; lng: number } {
  const clean = city.toLowerCase().trim().replace(/^(tp|thành phố|tỉnh)\s+/i, "");
  return CITY_COORDS[clean] || CITY_COORDS["hà nội"];
}

// --- Helpers ---
function getZodiacEmoji(index: number): string {
  return ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"][index] || "★";
}

function findSignIndex(signVi: string): number {
  const idx = ZODIAC.findIndex((z) => z.vi === signVi);
  return idx >= 0 ? idx : 0;
}

function formatDegrees(deg: number): string {
  if (isNaN(deg) || !isFinite(deg)) deg = 0;
  const whole = Math.floor(deg);
  const minutes = Math.floor((deg - whole) * 60);
  return `${whole}°${String(minutes).padStart(2, "0")}'`;
}

// --- PLANET CARD ---
function PlanetCard({ p }: { p: PlanetPosition }) {
  const z = ZODIAC[p.signIndex];
  const planetMeta = PLANETS.find((pl) => pl.en === p.planetEn);
  const elementColorMap: Record<string, string> = {
    "Lửa": "border-orange-500/30 bg-orange-950/20 text-orange-300",
    "Đất": "border-emerald-500/30 bg-emerald-950/20 text-emerald-300",
    "Khí": "border-blue-500/30 bg-blue-950/20 text-blue-300",
    "Nước": "border-cyan-500/30 bg-cyan-950/20 text-cyan-300",
  };
  const cardClass = z ? elementColorMap[z.element] : "border-border bg-card";

  return (
    <div className={`rounded-xl border ${cardClass} p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-2xl">{p.symbol}</p>
          <p className="font-semibold text-sm mt-1">{p.planet}</p>
          <p className="text-[10px] text-muted-foreground">{p.planetEn}</p>
        </div>
        {p.retrograde && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-medium">
            ℞ Nghịch hành
          </span>
        )}
      </div>
      <div className="space-y-1 text-xs">
        <p className="flex items-center justify-between">
          <span className="text-muted-foreground">Cung</span>
          <span className="font-medium">{getZodiacEmoji(p.signIndex)} {p.sign}</span>
        </p>
        <p className="flex items-center justify-between">
          <span className="text-muted-foreground">Độ</span>
          <span className="font-mono">{formatDegrees(p.degrees)}</span>
        </p>
        <p className="flex items-center justify-between">
          <span className="text-muted-foreground">Nhà</span>
          <span className="font-medium">Nhà {p.house}</span>
        </p>
        {z && (
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground">Nguyên tố</span>
            <span className="font-medium">{z.element}</span>
          </p>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed border-t border-border/50 pt-2">
        {planetMeta?.meaning || p.meaning}
      </p>
    </div>
  );
}

// --- ASPECT CARD ---
function AspectCard({ a }: { a: Aspect }) {
  const color = a.harmonious
    ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
    : "border-red-500/30 bg-red-950/20 text-red-300";
  const aspectSymbolMap: Record<string, string> = {
    conjunction: "☌",
    sextile: "⚹",
    square: "□",
    trine: "△",
    opposition: "☍",
  };
  return (
    <div className={`rounded-lg border ${color} px-3 py-2.5`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">
          {a.planet1} <span className="opacity-60">{aspectSymbolMap[a.type] || "·"}</span> {a.planet2}
        </span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${a.harmonious ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
          {a.harmonious ? "Hài hòa" : "Xung khắc"}
        </span>
      </div>
      <p className="text-[10px] mt-1 opacity-80">
        {a.typeVi} ({a.typeEn}) · {a.angle}° · orb {a.orb}°
      </p>
      <p className="text-[10px] mt-1.5 opacity-70 leading-relaxed">{a.meaning}</p>
    </div>
  );
}

// --- HOUSE ROW ---
function HouseRow({ h }: { h: House }) {
  const signIdx = findSignIndex(h.sign);
  const z = ZODIAC[signIdx];
  return (
    <div className="rounded-lg border border-blue-500/15 bg-purple-950/10 px-4 py-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-semibold text-xs">
          Nhà {h.number} — {h.name.replace(/^Nhà \d+ — /, "")}
        </span>
        <span className="text-xs">{getZodiacEmoji(signIdx)} {h.sign}</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{h.meaning}</p>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
        <span>Cusp: <span className="font-mono">{formatDegrees(((h.cusp % 360) + 360) % 360)}</span></span>
        {z && <span>· {z.element} · {z.quality}</span>}
      </div>
    </div>
  );
}

// --- SECTION TITLE ---
function SectionTitle({ icon: Icon, title, subtitle, color = "text-blue-400" }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/30 flex items-center justify-center">
        <Icon className={`size-4 ${color}`} />
      </div>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// --- SETUP FORM ---
function AstrologySetupForm({ profile, onCalculated }: { profile: ProfileData; onCalculated: () => void }) {
  const supabase = createClient();
  const [noiSinh, setNoiSinh] = useState(profile.noi_sinh || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        const coords = findCoords(noiSinh || "Hà Nội");

        // Save city + coords
        await supabase
          .from("profiles")
          .update({
            noi_sinh: noiSinh.trim() || "Hà Nội",
            vi_do: coords.lat,
            kinh_do: coords.lng,
          })
          .eq("user_id", profile.user_id);

        // Calculate astrology
        const { calculateAstrology } = await import("@/lib/astrology");
        const result = await calculateAstrology({
          fullName: profile.full_name,
          ngaySinh: profile.date_of_birth!,
          gioSinh: profile.gio_sinh ?? 12,
          gioiTinh: profile.gioi_tinh ?? "nam",
          noiSinh: noiSinh.trim() || "Hà Nội",
          viDo: coords.lat,
          kinhDo: coords.lng,
        });

        // Save report
        await supabase
          .from("profiles")
          .update({ chiem_tinh_report: result as unknown as Record<string, unknown> })
          .eq("user_id", profile.user_id);

        onCalculated();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tính chiêm tinh");
      } finally {
        setLoading(false);
      }
    },
    [noiSinh, profile, supabase, onCalculated]
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 blur-xl opacity-50" />
            <div className="relative w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
              <Globe className="size-7 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Chiêm tinh học</h1>
          <p className="text-sm text-muted-foreground mt-1">Bản đồ sao cá nhân — khám phá vũ trụ bên trong bạn</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Thông tin hiện có */}
            <div className="rounded-lg border border-blue-500/20 bg-purple-950/20 p-4 space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Họ tên:</span>{" "}
                <span className="font-medium">{profile.full_name}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Ngày sinh:</span>{" "}
                <span className="font-medium">{profile.date_of_birth}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Giờ sinh:</span>{" "}
                <span className="font-medium">{profile.gio_sinh}:00</span>
              </p>
              <p>
                <span className="text-muted-foreground">Giới tính:</span>{" "}
                <span className="font-medium">{profile.gioi_tinh === "nam" ? "Nam" : "Nữ"}</span>
              </p>
            </div>

            {/* Nơi sinh */}
            <div className="space-y-1.5">
              <Label htmlFor="astro-noi-sinh">🌍 Nơi sinh (thành phố/tỉnh)</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="astro-noi-sinh"
                  type="text"
                  placeholder="VD: Hà Nội, TP HCM, Đà Nẵng..."
                  value={noiSinh}
                  onChange={(e) => {
                    setNoiSinh(e.target.value);
                    setError(null);
                  }}
                  className="pl-8"
                  autoComplete="off"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Nhập tên tỉnh/thành phố — hệ thống tự tra toạ độ. Nếu không rõ, để mặc định Hà Nội.
              </p>
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-red-500/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:brightness-110"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Đang lập bản đồ sao...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Lập bản đồ Chiêm tinh
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- BIG THREE CARD ---
function BigThreeCard({
  label,
  value,
  emoji,
  sub,
  color,
  meaning,
  icon: Icon,
}: {
  label: string;
  value: string;
  emoji: string;
  sub: string;
  color: string;
  meaning?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-purple-950/30 to-blue-950/20 p-4 text-center">
      <Icon className={`size-4 mx-auto mb-1 ${color}`} />
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl ${color}`}>{emoji}</p>
      <p className={`text-base font-bold mt-0.5 ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
      {meaning && <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed border-t border-border/50 pt-2">{meaning}</p>}
    </div>
  );
}

// --- ELEMENT/QUALITY ANALYSIS ---
function ElementQualityCard({ result }: { result: AstrologyResult }) {
  const allBodies = [result.sun, result.moon, ...result.planets];
  const elementCounts: Record<string, number> = { Lửa: 0, Đất: 0, Khí: 0, Nước: 0 };
  const qualityCounts: Record<string, number> = { "Thống lĩnh": 0, "Cố định": 0, "Linh hoạt": 0 };
  allBodies.forEach((p) => {
    const z = ZODIAC[p.signIndex];
    if (z) {
      elementCounts[z.element] = (elementCounts[z.element] || 0) + 1;
      qualityCounts[z.quality] = (qualityCounts[z.quality] || 0) + 1;
    }
  });

  const elementIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    Lửa: Flame,
    Đất: Mountain,
    Khí: Wind,
    Nước: Droplet,
  };
  const elementColors: Record<string, string> = {
    Lửa: "text-orange-400",
    Đất: "text-emerald-400",
    Khí: "text-blue-400",
    Nước: "text-cyan-400",
  };
  const total = allBodies.length || 1;

  return (
    <div className="space-y-4">
      {/* Element breakdown */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Phân bổ Nguyên tố</p>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(elementCounts).map(([el, count]) => {
            const Icon = elementIcons[el];
            const isDominant = el === result.dominantElement;
            return (
              <div
                key={el}
                className={`rounded-lg border p-3 text-center ${
                  isDominant ? "border-blue-500/40 bg-blue-950/30" : "border-border bg-card"
                }`}
              >
                <Icon className={`size-4 mx-auto ${elementColors[el]}`} />
                <p className={`text-xs font-semibold mt-1 ${isDominant ? elementColors[el] : ""}`}>{el}</p>
                <p className="text-[10px] text-muted-foreground">{count}/{total}</p>
                {isDominant && <p className="text-[9px] mt-0.5 text-blue-300 font-medium">★ Chủ đạo</p>}
              </div>
            );
          })}
        </div>
        {ELEMENTS[result.dominantElement as keyof typeof ELEMENTS] && (
          <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            {ELEMENTS[result.dominantElement as keyof typeof ELEMENTS].meaning}
          </p>
        )}
      </div>

      {/* Quality breakdown */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Phân bổ Phẩm chất</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(qualityCounts).map(([q, count]) => {
            const isDominant = q === result.dominantQuality;
            return (
              <div
                key={q}
                className={`rounded-lg border p-3 text-center ${
                  isDominant ? "border-purple-500/40 bg-purple-950/30" : "border-border bg-card"
                }`}
              >
                <p className={`text-xs font-semibold ${isDominant ? "text-purple-300" : ""}`}>{q}</p>
                <p className="text-[10px] text-muted-foreground">{count}/{total}</p>
                {isDominant && <p className="text-[9px] mt-0.5 text-purple-300 font-medium">★ Chủ đạo</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- SCIENTIFIC BASIS ---
function ScientificBasis() {
  return (
    <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 to-purple-950/20 p-6 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/30 flex items-center justify-center">
          <Telescope className="size-4 text-blue-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Cơ sở khoa học & Nguồn gốc Chiêm tinh học</h2>
          <p className="text-[11px] text-muted-foreground">Phương pháp tính toán và nền tảng thiên văn</p>
        </div>
      </div>

      {/* Nguồn gốc */}
      <div>
        <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
          <Microscope className="size-3.5 text-purple-400" /> Nguồn gốc
        </h3>
        <p className="text-xs text-foreground/80 leading-relaxed">
          Chiêm tinh học phương Tây (Western Astrology) có nguồn gốc từ Mesopotamia (khoảng 3000 TCN), được phát triển bởi
          người Babylon, sau đó truyền sang Hy Lạp, Ai Cập và La Mã. Ptolemy (90-168 CN) đã hệ thống hóa trong tác phẩm{" "}
          <em>&ldquo;Tetrabiblos&rdquo;</em>.
        </p>
      </div>

      {/* Cơ sở thiên văn */}
      <div>
        <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
          <Orbit className="size-3.5 text-blue-400" /> Cơ sở thiên văn
        </h3>
        <p className="text-xs text-foreground/80 leading-relaxed mb-2">
          Bản đồ sao (Natal Chart) tính vị trí các hành tinh tại thời điểm sinh, dựa trên:
        </p>
        <ul className="space-y-1.5 text-xs text-foreground/80">
          <li className="flex gap-2">
            <span className="text-yellow-400 mt-0.5">•</span>
            <span>
              <strong>Mặt Trời (Sun):</strong> Vị trí ecliptic longitude — đại diện cho bản ngã.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400 mt-0.5">•</span>
            <span>
              <strong>Mặt Trăng (Moon):</strong> Vị trí địa tâm — đại diện cho cảm xúc.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            <span>
              <strong>Hành tinh:</strong> Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto — vị trí geocentric
              ecliptic.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>
              <strong>Cung Mọc (Ascendant):</strong> Điểm giao giữa hoàng đạo và chân trời phía Đông, phụ thuộc giờ sinh +
              vĩ độ.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>
              <strong>Thiên Đỉnh (Midheaven/MC):</strong> Điểm cao nhất hoàng đạo — sự nghiệp.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-400 mt-0.5">•</span>
            <span>
              <strong>12 Nhà (Houses):</strong> Chia bản đồ thành 12 khu vực cuộc đời.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-pink-400 mt-0.5">•</span>
            <span>
              <strong>Góc chiếu (Aspects):</strong> Góc giữa các hành tinh — Hợp (0°), Lục hợp (60°), Vuông (90°), Tam hợp
              (120°), Xung đối (180°).
            </span>
          </li>
        </ul>
      </div>

      {/* Mô hình AI & Thư viện */}
      <div>
        <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
          <Microscope className="size-3.5 text-emerald-400" /> Mô hình AI & Thư viện
        </h3>
        <p className="text-xs text-foreground/80 leading-relaxed">
          NOOI sử dụng thư viện <code className="px-1 py-0.5 rounded bg-muted text-blue-300 font-mono text-[11px]">astronomy-engine</code>{" "}
          (theo thuật toán Jean Meeus, &ldquo;Astronomical Algorithms&rdquo;, 1991) — chuẩn NASA/JPL — để tính vị trí chính xác
          các hành tinh. Độ chính xác ±0.01°.
        </p>
      </div>

      {/* Phương pháp tính Cung Mọc */}
      <div>
        <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
          <Compass className="size-3.5 text-blue-400" /> Phương pháp tính Cung Mọc
        </h3>
        <p className="text-xs text-foreground/80 leading-relaxed mb-2">
          Sử dụng công thức:
        </p>
        <div className="rounded-lg border border-blue-500/30 bg-blue-950/30 p-3 font-mono text-[11px] text-blue-200 overflow-x-auto">
          ASC = arctan2(-cos(LST), -(sin(LST)·cos(ε) + tan(φ)·sin(ε)))
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
          Trong đó: <strong>LST</strong> = Local Sidereal Time, <strong>ε</strong> = obliquity, <strong>φ</strong> = latitude.
        </p>
      </div>

      {/* Ghi chú */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-3">
        <p className="text-[11px] text-amber-200/80 leading-relaxed">
          <strong>Ghi chú:</strong> Chiêm tinh học kết hợp thiên văn học và biểu tượng học. Vị trí hành tinh tính chính xác
          theo thiên văn, nhưng luận giải mang tính biểu tượng và tham khảo.
        </p>
      </div>
    </div>
  );
}

// --- INTERPRETATION SECTION ---
function InterpretationCard({
  icon: Icon,
  title,
  content,
  color = "text-blue-400",
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
  color?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-purple-950/10 to-blue-950/10 p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/30 flex items-center justify-center">
          <Icon className={`size-4 ${color}`} />
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{content}</p>
      {children}
    </div>
  );
}

// --- REPORT ---
function AstrologyReport({ result, profile }: { result: AstrologyResult; profile: ProfileData }) {
  const { sun, moon, ascendant, midheaven, planets, houses, aspects, interpretations, input } = result;
  const allPlanets = [sun, moon, ...planets];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* HEADER */}
      <div>
        <Link href="/app" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="size-3" /> Về Dashboard
        </Link>
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-purple-950/30 to-blue-950/20 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-4 text-blue-400" />
                <h1 className="text-2xl font-bold tracking-tight">Bản đồ Chiêm tinh</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {profile.full_name} — {profile.date_of_birth} giờ {profile.gio_sinh}:{String(input?.phutSinh ?? 0).padStart(2, "0")} ·{" "}
                {profile.noi_sinh || "Hà Nội"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Vĩ độ {input?.viDo?.toFixed(4) ?? profile.vi_do?.toFixed(4) ?? "21.0285"}° · Kinh độ{" "}
                {input?.kinhDo?.toFixed(4) ?? profile.kinh_do?.toFixed(4) ?? "105.8542"}°
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Cung Mọc</p>
              <p className="text-2xl">{getZodiacEmoji(ascendant.signIndex)}</p>
              <p className="text-base font-bold text-blue-400">{ascendant.sign}</p>
              <p className="text-[10px] text-muted-foreground">{ascendant.signEn}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BIG THREE */}
      <div>
        <SectionTitle
          icon={Star}
          title="Bộ ba Căn bản — The Big Three"
          subtitle="Mặt Trời, Mặt Trăng và Cung Mọc tạo nên cốt lõi bản thân"
          color="text-yellow-400"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <BigThreeCard
            label="Cung Mặt Trời"
            value={sun.sign}
            emoji={getZodiacEmoji(sun.signIndex)}
            sub={sun.signEn}
            color="text-yellow-400"
            meaning={sun.meaning}
            icon={Sun}
          />
          <BigThreeCard
            label="Cung Mặt Trăng"
            value={moon.sign}
            emoji={getZodiacEmoji(moon.signIndex)}
            sub={moon.signEn}
            color="text-cyan-400"
            meaning={moon.meaning}
            icon={Moon}
          />
          <BigThreeCard
            label="Cung Mọc (Ascendant)"
            value={ascendant.sign}
            emoji={getZodiacEmoji(ascendant.signIndex)}
            sub={ascendant.signEn}
            color="text-blue-400"
            meaning={ascendant.meaning}
            icon={Compass}
          />
        </div>
      </div>

      {/* ALL 10 PLANETS */}
      <div>
        <SectionTitle
          icon={Orbit}
          title="Vị trí các Hành tinh"
          subtitle={`${allPlanets.length} hành tinh tại thời điểm sinh — vị trí geocentric ecliptic`}
          color="text-purple-400"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allPlanets.map((p, i) => (
            <PlanetCard key={`${p.planetEn}-${i}`} p={p} />
          ))}
        </div>
      </div>

      {/* ASCENDANT & MIDHEAVEN DETAIL */}
      <div>
        <SectionTitle
          icon={Compass}
          title="Trục Cung Mọc & Thiên Đỉnh"
          subtitle="Các góc quan trọng trong bản đồ sao"
          color="text-blue-400"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 to-purple-950/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass className="size-4 text-blue-400" />
                <h3 className="font-semibold text-sm">Cung Mọc (Ascendant — ASC)</h3>
              </div>
              <span className="text-2xl">{getZodiacEmoji(ascendant.signIndex)}</span>
            </div>
            <div className="space-y-1 text-xs mb-3">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Cung</span>
                <span className="font-medium">{ascendant.sign} ({ascendant.signEn})</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Độ chính xác</span>
                <span className="font-mono">{formatDegrees(ascendant.degrees)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Kinh độ hoàng đạo</span>
                <span className="font-mono">{formatDegrees(((ascendant.longitude % 360) + 360) % 360)}</span>
              </p>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{ascendant.meaning}</p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-950/10 to-purple-950/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-amber-400" />
                <h3 className="font-semibold text-sm">Thiên Đỉnh (Midheaven — MC)</h3>
              </div>
              <span className="text-2xl">{getZodiacEmoji(midheaven.signIndex)}</span>
            </div>
            <div className="space-y-1 text-xs mb-3">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Cung</span>
                <span className="font-medium">{midheaven.sign} ({midheaven.signEn})</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Kinh độ hoàng đạo</span>
                <span className="font-mono">{formatDegrees(((midheaven.longitude % 360) + 360) % 360)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Ý nghĩa</span>
                <span className="font-medium">Sự nghiệp & Danh vọng</span>
              </p>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{midheaven.meaning}</p>
          </div>
        </div>
      </div>

      {/* 12 HOUSES */}
      <div>
        <SectionTitle
          icon={Compass}
          title="12 Nhà (Houses)"
          subtitle="Bản đồ chia thành 12 khu vực cuộc đời"
          color="text-green-400"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {houses.map((h) => (
            <HouseRow key={h.number} h={h} />
          ))}
        </div>
      </div>

      {/* ASPECTS */}
      <div>
        <SectionTitle
          icon={Shield}
          title={`Góc chiếu (Aspects) — ${aspects.length} góc`}
          subtitle="Góc giữa các hành tinh — hài hòa hoặc xung khắc"
          color="text-purple-400"
        />
        {aspects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {aspects.map((a, i) => (
              <AspectCard key={`${a.planet1}-${a.planet2}-${i}`} a={a} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Không có góc chiếu đáng kể trong bản đồ.</p>
        )}
      </div>

      {/* DOMINANT ELEMENT & QUALITY */}
      <div>
        <SectionTitle
          icon={Scale}
          title="Nguyên tố & Phẩm chất chủ đạo"
          subtitle="Phân tích phân bổ nguyên tố và phẩm chất"
          color="text-emerald-400"
        />
        <ElementQualityCard result={result} />
      </div>

      {/* INTERPRETATIONS */}
      <div>
        <SectionTitle
          icon={Sparkles}
          title="Luận giải chi tiết"
          subtitle="Phân tích toàn diện theo bản đồ sao"
          color="text-blue-400"
        />
        <div className="grid gap-4">
          <InterpretationCard icon={Globe} title="🌟 Tổng quan" content={interpretations.tongQuan} color="text-blue-400" />

          <InterpretationCard icon={Star} title="⭐ Tính cách" content={interpretations.tinhCach} color="text-yellow-400">
            {/* Strengths & Weaknesses */}
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-emerald-400 mb-1.5">✓ Điểm mạnh</p>
                <div className="flex flex-wrap gap-1.5">
                  {interpretations.diemManh.map((s, j) => (
                    <span
                      key={j}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    >
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-red-400 mb-1.5">△ Điểm yếu</p>
                <div className="flex flex-wrap gap-1.5">
                  {interpretations.diemYeu.map((w, j) => (
                    <span
                      key={j}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
                    >
                      △ {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </InterpretationCard>

          <InterpretationCard icon={Briefcase} title="💼 Sự nghiệp" content={interpretations.suNghiep} color="text-amber-400" />
          <InterpretationCard icon={Heart} title="❤️ Tình duyên" content={interpretations.tinhDuyen} color="text-pink-400" />
          <InterpretationCard icon={Activity} title="❤️‍🩹 Sức khỏe" content={interpretations.sucKhoe} color="text-emerald-400" />
        </div>
      </div>

      {/* ADVICE */}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-950/30 to-purple-950/30 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Star className="size-4 text-blue-400" />
          <h3 className="font-semibold text-sm">🌟 Lời khuyên</h3>
        </div>
        <p className="text-sm text-blue-200/80 italic whitespace-pre-line">{interpretations.loiKhuyen}</p>
      </div>

      {/* SCIENTIFIC BASIS */}
      <ScientificBasis />

      {/* FOOTER */}
      <div className="text-center pt-4 border-t border-blue-500/20">
        <p className="text-[10px] text-muted-foreground">
          Bản đồ sao tính dựa trên thư viện <code className="font-mono">astronomy-engine</code> (thuật toán Jean Meeus,
          chuẩn NASA/JPL). Độ chính xác ±0.01°.
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">NOOI — Kết nối chuyển mình.</p>
      </div>
    </div>
  );
}

// --- MAIN EXPORT ---
export function AstrologyPageClient({ profile }: Props) {
  // Validate stored report — if corrupted, treat as null
  const storedReport = (() => {
    if (!profile.chiem_tinh_report) return null;
    try {
      const r = profile.chiem_tinh_report;
      if (!r.sun || !r.moon || !r.ascendant || !r.planets || !r.interpretations) return null;
      return r;
    } catch {
      return null;
    }
  })();

  const [result] = useState<AstrologyResult | null>(storedReport);
  const [calculating, setCalculating] = useState(false);

  // If stored report is corrupted, clear it and show setup
  useEffect(() => {
    if (!storedReport && profile.chiem_tinh_report) {
      const supabase = createClient();
      supabase.from("profiles").update({ chiem_tinh_report: null }).eq("user_id", profile.user_id);
    }
  }, []);

  // If we have a report, show it
  if (result) {
    return <AstrologyReport result={result} profile={profile} />;
  }

  // If still calculating
  if (calculating) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 animate-pulse blur-xl opacity-50" />
            <div className="relative w-full h-full flex items-center justify-center">
              <Sparkles className="size-10 animate-pulse text-blue-400" />
            </div>
          </div>
          <h2 className="text-lg font-semibold animate-pulse">Đang lập bản đồ sao...</h2>
          <p className="text-sm text-muted-foreground">Tính toán vị trí các hành tinh theo thiên văn học</p>
        </div>
      </div>
    );
  }

  // Show setup form
  return (
    <AstrologySetupForm
      profile={profile}
      onCalculated={() => {
        setCalculating(true);
        window.location.reload();
      }}
    />
  );
}
