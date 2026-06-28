"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateNumerology } from "@/lib/numerology";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, CheckCircle, User, Calendar, Clock, Users, Globe } from "lucide-react";

interface Props {
  user: {
    email: string;
    id: string;
    createdAt: string;
  };
  profile: {
    full_name: string;
    date_of_birth: string | null;
    gio_sinh: number | null;
    gioi_tinh: "nam" | "nu" | null;
    noi_sinh: string | null;
    vi_do: number | null;
    kinh_do: number | null;
    numerology_report: boolean;
    tuvi_report: boolean;
    chiem_tinh_report: boolean;
  } | null;
}

const GIO_LIST = [
  { value: 23, label: "Tý (23:00-00:59)" },
  { value: 1, label: "Sửu (01:00-02:59)" },
  { value: 3, label: "Dần (03:00-04:59)" },
  { value: 5, label: "Mão (05:00-06:59)" },
  { value: 7, label: "Thìn (07:00-08:59)" },
  { value: 9, label: "Tỵ (09:00-10:59)" },
  { value: 11, label: "Ngọ (11:00-12:59)" },
  { value: 13, label: "Mùi (13:00-14:59)" },
  { value: 15, label: "Thân (15:00-16:59)" },
  { value: 17, label: "Dậu (17:00-18:59)" },
  { value: 19, label: "Tuất (19:00-20:59)" },
  { value: 21, label: "Hợi (21:00-22:59)" },
];

export function SettingsForm({ user, profile }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth?.split("T")[0] ?? "");
  const [gioSinh, setGioSinh] = useState<number>(profile?.gio_sinh ?? 12);
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">(profile?.gioi_tinh ?? "nam");
  const [noiSinh, setNoiSinh] = useState(profile?.noi_sinh ?? "");
  const [viDo, setViDo] = useState(profile?.vi_do ?? 21.0285);
  const [kinhDo, setKinhDo] = useState(profile?.kinh_do ?? 105.8542);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError("Vui lòng nhập họ tên.");
      return;
    }

    setLoading(true);

    try {
      // 1. Base profile updates
      const updates: Record<string, unknown> = {
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth || null,
        gio_sinh: gioSinh,
        gioi_tinh: gioiTinh,
        noi_sinh: noiSinh.trim() || "Hà Nội",
        vi_do: viDo,
        kinh_do: kinhDo,
      };

      // 2. Auto-recalculate Numerology if name + DOB available
      if (fullName.trim() && dateOfBirth) {
        try {
          const numerology = calculateNumerology({
            fullName: fullName.trim(),
            dateOfBirth,
          });
          updates.numerology_report = numerology as unknown as Record<string, unknown>;
          updates.onboarding_completed = true;
        } catch (err) {
          console.error("Numerology recalc failed:", err);
        }
      }

      // 3. Auto-recalculate Tử Vi if full info available
      if (fullName.trim() && dateOfBirth && gioSinh !== undefined && gioiTinh) {
        try {
          const { calculateTuVi } = await import("@/lib/tuvi");
          const tuviResult = calculateTuVi({
            fullName: fullName.trim(),
            ngaySinh: dateOfBirth,
            gioSinh,
            gioiTinh,
          });
          updates.tuvi_report = tuviResult as unknown as Record<string, unknown>;
        } catch (err) {
          console.error("TuVi recalc failed:", err);
        }
      }

      // 4. Auto-recalculate Chiêm tinh (server-side: uses astronomy-engine)
      if (fullName.trim() && dateOfBirth && gioSinh !== undefined && gioiTinh) {
        try {
          const { calculateAstrology } = await import("@/lib/astrology");
          const astroResult = await calculateAstrology({
            fullName: fullName.trim(),
            ngaySinh: dateOfBirth,
            gioSinh,
            gioiTinh,
            noiSinh: noiSinh.trim() || "Hà Nội",
            viDo,
            kinhDo,
          });
          updates.chiem_tinh_report = astroResult as unknown as Record<string, unknown>;
        } catch (err) {
          console.error("Astrology recalc failed:", err);
        }
      }

      // 5. Save everything in one call
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      const statusParts = ["✅ Đã cập nhật thông tin"];
      if (updates.numerology_report) statusParts.push("Thần số học");
      if (updates.tuvi_report) statusParts.push("Tử Vi");
      if (updates.chiem_tinh_report) statusParts.push("Chiêm tinh");
      setSuccess(statusParts.join(" · ") + " tự động cập nhật!");

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [fullName, dateOfBirth, gioSinh, gioiTinh, supabase, user.id, router]);

  const handleRegenerateNumerology = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) { setError("Vui lòng nhập họ tên."); return; }
    if (!dateOfBirth) { setError("Vui lòng chọn ngày sinh."); return; }

    setLoading(true);
    try {
      const numerology = calculateNumerology({ fullName: fullName.trim(), dateOfBirth });

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          date_of_birth: dateOfBirth,
          numerology_report: numerology as unknown as Record<string, unknown>,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;
      setSuccess("✅ Đã tạo lại bản thần số học!");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [fullName, dateOfBirth, supabase, user.id, router]);

  const handleRegenerateTuVi = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) { setError("Vui lòng nhập họ tên."); return; }
    if (!dateOfBirth) { setError("Vui lòng chọn ngày sinh."); return; }

    setLoading(true);
    try {
      const { calculateTuVi } = await import("@/lib/tuvi");
      const tuviResult = calculateTuVi({
        fullName: fullName.trim(),
        ngaySinh: dateOfBirth,
        gioSinh: gioSinh,
        gioiTinh: gioiTinh,
      });

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          date_of_birth: dateOfBirth,
          gio_sinh: gioSinh,
          gioi_tinh: gioiTinh,
          tuvi_report: tuviResult as unknown as Record<string, unknown>,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;
      setSuccess("✅ Đã tạo lại lá số Tử Vi!");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [fullName, dateOfBirth, gioSinh, gioiTinh, supabase, user.id, router]);

  return (
    <div className="rounded-xl border border-border bg-card mb-6">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold">Hồ sơ cá nhân</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Thông tin cơ bản về tài khoản của bạn. Họ tên, ngày sinh, giờ sinh, giới tính dùng cho Thần số học và Tử Vi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {/* Static info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Email</label>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Thần số học</label>
            <p className="text-sm">
              {profile?.numerology_report ? (
                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="size-3" /> Đã có</span>
              ) : (
                <span className="text-muted-foreground">Chưa tạo</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Tử Vi</label>
            <p className="text-sm">
              {profile?.tuvi_report ? (
                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="size-3" /> Đã có</span>
              ) : (
                <span className="text-muted-foreground">Chưa tạo</span>
              )}
            </p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="border-t border-border/50 pt-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">✏️ Thông tin thay đổi được</p>

          {/* Họ tên */}
          <div className="space-y-1.5">
            <Label htmlFor="settings-name">Họ tên đầy đủ</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="settings-name" type="text" placeholder="Nhập họ tên khai sinh"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setSuccess(null); }}
                className="pl-8" autoComplete="name" />
            </div>
          </div>

          {/* Ngày sinh */}
          <div className="space-y-1.5">
            <Label htmlFor="settings-dob">Ngày tháng năm sinh</Label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="settings-dob" type="date" value={dateOfBirth}
                onChange={(e) => { setDateOfBirth(e.target.value); setSuccess(null); }}
                className="pl-8"
                max={new Date().toISOString().split("T")[0]} />
            </div>
          </div>

          {/* Giờ sinh — mới thêm */}
          <div className="space-y-1.5">
            <Label htmlFor="settings-gio">Giờ sinh</Label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
              <select id="settings-gio" value={gioSinh}
                onChange={(e) => { setGioSinh(Number(e.target.value)); setSuccess(null); }}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none">
                {GIO_LIST.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Giờ sinh ảnh hưởng trực tiếp đến Tứ Trụ (giờ Can Chi) trong Tử Vi. Nếu không biết, chọn Ngọ (11:00-12:59).
            </p>
          </div>

          {/* Giới tính — mới thêm */}
          <div className="space-y-1.5">
            <Label>Giới tính</Label>
            <div className="relative">
              <Users className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
              <select value={gioiTinh}
                onChange={(e) => { setGioiTinh(e.target.value as "nam" | "nu"); setSuccess(null); }}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none">
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
              </select>
            </div>
          </div>

          {/* Nơi sinh — mới thêm cho Chiêm tinh */}
          <div className="space-y-1.5">
            <Label htmlFor="settings-noi-sinh">Nơi sinh (thành phố)</Label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="settings-noi-sinh" type="text" placeholder="VD: Hà Nội, TP HCM"
                value={noiSinh}
                onChange={(e) => { setNoiSinh(e.target.value); setSuccess(null); }}
                className="pl-8" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Dùng để tính vị trí Cung Mọc và 12 Nhà trong Chiêm tinh học
            </p>
          </div>
        </div>

        {/* Success */}
        {success && (
          <div role="status" className="rounded-lg border border-emerald-500/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-400">
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="outline" disabled={loading} className="text-sm">
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
            💾 Lưu thông tin
          </Button>

          <Button type="button" onClick={handleRegenerateNumerology}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:brightness-110 text-sm">
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {profile?.numerology_report ? "Tạo lại Thần số học" : "Tạo Thần số học"}
          </Button>

          <Button type="button" onClick={handleRegenerateTuVi}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-amber-600 text-white hover:brightness-110 text-sm">
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {profile?.tuvi_report ? "Tạo lại Tử Vi" : "Tạo Tử Vi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
