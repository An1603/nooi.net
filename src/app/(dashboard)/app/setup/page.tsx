"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateNumerology } from "@/lib/numerology";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, User, Calendar, MapPin, Clock, Users, CheckCircle } from "lucide-react";

const GIO_LIST = [
  { value: 23, label: "Tý (23:00-00:59)" }, { value: 1, label: "Sửu (01:00-02:59)" },
  { value: 3, label: "Dần (03:00-04:59)" }, { value: 5, label: "Mão (05:00-06:59)" },
  { value: 7, label: "Thìn (07:00-08:59)" }, { value: 9, label: "Tỵ (09:00-10:59)" },
  { value: 11, label: "Ngọ (11:00-12:59)" }, { value: 13, label: "Mùi (13:00-14:59)" },
  { value: 15, label: "Thân (15:00-16:59)" }, { value: 17, label: "Dậu (17:00-18:59)" },
  { value: 19, label: "Tuất (19:00-20:59)" }, { value: 21, label: "Hợi (21:00-22:59)" },
];

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "hà nội": { lat: 21.0285, lng: 105.8542 }, "hanoi": { lat: 21.0285, lng: 105.8542 },
  "hcm": { lat: 10.8231, lng: 106.6297 }, "tp hcm": { lat: 10.8231, lng: 106.6297 },
  "hồ chí minh": { lat: 10.8231, lng: 106.6297 }, "saigon": { lat: 10.8231, lng: 106.6297 },
  "đà nẵng": { lat: 16.0544, lng: 108.2022 }, "danang": { lat: 16.0544, lng: 108.2022 },
  "hải phòng": { lat: 20.8449, lng: 106.6881 }, "cần thơ": { lat: 10.0452, lng: 105.7469 },
  "huế": { lat: 16.4637, lng: 107.5909 }, "nha trang": { lat: 12.2388, lng: 109.1967 },
  "vũng tàu": { lat: 10.3458, lng: 107.0843 }, "đà lạt": { lat: 11.9465, lng: 108.4419 },
  "vinh": { lat: 18.6796, lng: 105.6813 }, "thanh hóa": { lat: 19.8069, lng: 105.7852 },
  "hải dương": { lat: 20.9410, lng: 106.3330 }, "bắc ninh": { lat: 21.1861, lng: 106.0763 },
  "quảng ninh": { lat: 20.9371, lng: 107.0746 }, "nam định": { lat: 20.4333, lng: 106.1667 },
  "thái bình": { lat: 20.4569, lng: 106.3331 }, "biên hòa": { lat: 10.9574, lng: 106.8426 },
  "bình dương": { lat: 11.0015, lng: 106.6528 }, "long an": { lat: 10.6056, lng: 106.4268 },
  "tiền giang": { lat: 10.3500, lng: 106.3500 }, "bến tre": { lat: 10.2333, lng: 106.3833 },
  "cà mau": { lat: 9.1833, lng: 105.1500 }, "kiên giang": { lat: 10.0167, lng: 105.0833 },
  "an giang": { lat: 10.3667, lng: 105.4167 }, "đồng tháp": { lat: 10.4500, lng: 105.6333 },
  "vĩnh long": { lat: 10.2500, lng: 105.9667 }, "sóc trăng": { lat: 9.6036, lng: 105.9800 },
  "bạc liêu": { lat: 9.2833, lng: 105.7333 }, "trà vinh": { lat: 9.9333, lng: 106.3500 },
  "quảng ngãi": { lat: 15.1405, lng: 108.7924 }, "bình định": { lat: 13.8833, lng: 109.1167 },
  "phú yên": { lat: 13.1333, lng: 109.3000 }, "khánh hòa": { lat: 12.2500, lng: 109.1833 },
  "bình thuận": { lat: 11.0833, lng: 108.0833 }, "đồng nai": { lat: 10.9447, lng: 106.8243 },
  "hà tĩnh": { lat: 18.3431, lng: 105.9054 }, "ninh bình": { lat: 20.2538, lng: 105.9748 },
  "hà nam": { lat: 20.5833, lng: 105.9833 },
};

function findCoords(city: string): { lat: number; lng: number } {
  return CITY_COORDS[city.toLowerCase().trim().replace(/^(tp|thành phố|tỉnh)\s+/i, '')] || CITY_COORDS["hà nội"];
}

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gioSinh, setGioSinh] = useState(12);
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [noiSinh, setNoiSinh] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "calculating" | "done">("form");
  const [doneCount, setDoneCount] = useState(0);
  const [preloading, setPreloading] = useState(true);

  // Pre-fill from existing profile
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (profile) {
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.date_of_birth) setDateOfBirth(profile.date_of_birth.split("T")[0]);
        if (profile.gio_sinh != null) setGioSinh(profile.gio_sinh);
        if (profile.gioi_tinh) setGioiTinh(profile.gioi_tinh);
        if (profile.noi_sinh) setNoiSinh(profile.noi_sinh);
      }
      setPreloading(false);
    })();
  }, [supabase]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) { setError("Vui lòng nhập họ tên đầy đủ."); return; }
    if (!dateOfBirth) { setError("Vui lòng chọn ngày tháng năm sinh."); return; }
    if (new Date(dateOfBirth) > new Date()) { setError("Ngày sinh không thể ở tương lai."); return; }

    setStep("calculating");
    const coords = findCoords(noiSinh || "Hà Nội");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      const updates: Record<string, unknown> = {
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth,
        gio_sinh: gioSinh,
        gioi_tinh: gioiTinh,
        noi_sinh: noiSinh.trim() || "Hà Nội",
        vi_do: coords.lat,
        kinh_do: coords.lng,
        onboarding_completed: true,
      };

      // 1. Numerology
      try {
        const numerology = calculateNumerology({ fullName: fullName.trim(), dateOfBirth });
        updates.numerology_report = numerology as unknown as Record<string, unknown>;
        setDoneCount(1);
      } catch (e) { console.error("Numerology failed:", e); }

      // 2. Tử Vi
      try {
        const { calculateTuVi } = await import("@/lib/tuvi");
        const tuviResult = calculateTuVi({ fullName: fullName.trim(), ngaySinh: dateOfBirth, gioSinh, gioiTinh });
        updates.tuvi_report = tuviResult as unknown as Record<string, unknown>;
        setDoneCount(2);
      } catch (e) { console.error("TuVi failed:", e); }

      // 3. Chiêm tinh
      try {
        const { calculateAstrology } = await import("@/lib/astrology");
        const astroResult = await calculateAstrology({
          fullName: fullName.trim(), ngaySinh: dateOfBirth, gioSinh, gioiTinh,
          noiSinh: noiSinh.trim() || "Hà Nội", viDo: coords.lat, kinhDo: coords.lng,
        });
        updates.chiem_tinh_report = astroResult as unknown as Record<string, unknown>;
        setDoneCount(3);
      } catch (e) { console.error("Astrology failed:", e); }

      const { error: upsertError } = await supabase.from("profiles").upsert(
        { user_id: user.id, ...updates },
        { onConflict: "user_id" }
      );

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        throw upsertError;
      }

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setStep("form");
    } finally {
      setLoading(false);
    }
  }, [fullName, dateOfBirth, gioSinh, gioiTinh, noiSinh, supabase]);

  if (preloading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === "calculating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse blur-xl opacity-50" />
            <div className="relative w-full h-full flex items-center justify-center">
              <Loader2 className="size-10 animate-spin text-primary" />
            </div>
          </div>
          <h2 className="text-lg font-semibold">Đang tính toán...</h2>
          <div className="space-y-1">
            {["Thần số học", "Tử Vi", "Chiêm tinh"].map((label, i) => (
              <p key={i} className={`text-sm ${i < doneCount ? "text-emerald-400" : "text-muted-foreground animate-pulse"}`}>
                {i < doneCount ? "✅" : "⏳"} {label}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg text-center space-y-6">
          <CheckCircle className="size-14 text-emerald-400 mx-auto" />
          <div>
            <h1 className="text-2xl font-bold">Hoàn tất thiết lập! 🎉</h1>
            <p className="text-muted-foreground mt-2">Tất cả 3 hệ thống đã sẵn sàng. Khám phá bản thân ngay!</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Thần số học", href: "/app/numerology", color: "from-amber-500 to-orange-500", emoji: "🔮" },
              { label: "Tử Vi", href: "/app/tuvi", color: "from-red-600 to-amber-600", emoji: "☀️" },
              { label: "Chiêm tinh", href: "/app/astrology", color: "from-blue-600 to-purple-600", emoji: "🌍" },
            ].map((item) => (
              <button key={item.label} onClick={() => router.push(item.href)}
                className={`p-4 rounded-xl border border-border bg-gradient-to-br ${item.color} bg-opacity-20 hover:scale-105 transition-transform`}>
                <p className="text-2xl">{item.emoji}</p>
                <p className="text-xs font-medium mt-1">{item.label}</p>
              </button>
            ))}
          </div>
          <Button onClick={() => router.push("/app")} className="w-full bg-primary text-primary-foreground">
            Vào Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5" />
      <div className="absolute top-1/4 -right-24 w-72 h-72 bg-accent/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -left-24 w-72 h-72 bg-primary/8 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
            <div className="relative w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
              <Sparkles className="size-7 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Thiết lập hồ sơ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Nhập thông tin để khám phá Thần số học, Tử Vi & Chiêm tinh
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Họ tên đầy đủ *</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="full-name" type="text" placeholder="Nguyễn Văn A"
                  value={fullName} onChange={(e) => { setFullName(e.target.value); setError(null); }}
                  className="pl-8" autoComplete="name" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dob">Ngày tháng năm sinh *</Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="dob" type="date" value={dateOfBirth}
                  onChange={(e) => { setDateOfBirth(e.target.value); setError(null); }}
                  className="pl-8" max={new Date().toISOString().split("T")[0]} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gio">Giờ sinh</Label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <select id="gio" value={gioSinh} onChange={(e) => setGioSinh(Number(e.target.value))}
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none">
                    {GIO_LIST.map((g) => (<option key={g.value} value={g.value}>{g.label}</option>))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Giới tính</Label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <select value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value as "nam" | "nu")}
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none">
                    <option value="nam">Nam</option>
                    <option value="nu">Nữ</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="noi-sinh">Nơi sinh (tỉnh/thành phố)</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="noi-sinh" type="text" placeholder="VD: Hà Nội, TP HCM"
                  value={noiSinh} onChange={(e) => { setNoiSinh(e.target.value); setError(null); }}
                  className="pl-8" />
              </div>
              <p className="text-[10px] text-muted-foreground">Dùng cho Chiêm tinh (cung Mọc). Nếu không rõ, để trống.</p>
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}

            <Button type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:brightness-110">
              {loading ? <><Loader2 className="size-4 animate-spin" /> Đang xử lý...</> :
                <><Sparkles className="size-4" /> Khám phá ngay — 3 hệ thống</>}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              Thông tin của bạn được bảo mật. Có thể cập nhật sau trong Settings.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}