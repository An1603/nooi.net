"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, User, Calendar, Clock, Users } from "lucide-react";

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

export default function TuViSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gioSinh, setGioSinh] = useState(12);
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) { setError("Vui lòng nhập họ tên."); return; }
    if (!dateOfBirth) { setError("Vui lòng chọn ngày sinh."); return; }

    const dob = new Date(dateOfBirth);
    if (dob > new Date()) { setError("Ngày sinh không thể ở tương lai."); return; }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      // Save basic info to profile
      const { error: upsertError } = await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth,
        gio_sinh: gioSinh,
        gioi_tinh: gioiTinh,
      }, { onConflict: "user_id" });

      if (upsertError) throw upsertError;

      // Navigate to tuvi report page — it will calculate on the fly
      router.push("/app/tuvi");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [fullName, dateOfBirth, gioSinh, gioiTinh, supabase, router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      {/* Effects - red/gold tones */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-background to-amber-950/20" />
      <div className="absolute top-1/4 -right-24 w-72 h-72 bg-red-900/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -left-24 w-72 h-72 bg-amber-900/8 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl" />
            <div className="relative w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-amber-500">
              <Sparkles className="size-7 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Tử Vi Phương Đông</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Luận giải vận mệnh theo Tứ trụ — Can Chi, Ngũ hành, Bản mệnh
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="tuvi-name">Họ tên đầy đủ</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="tuvi-name" type="text" placeholder="Nhập họ tên khai sinh" value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setError(null); }}
                  className="pl-8" autoComplete="name" required disabled={loading} />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <Label htmlFor="tuvi-dob">Ngày tháng năm sinh (Dương lịch)</Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="tuvi-dob" type="date" value={dateOfBirth}
                  onChange={(e) => { setDateOfBirth(e.target.value); setError(null); }}
                  className="pl-8" required disabled={loading}
                  max={new Date().toISOString().split("T")[0]} />
              </div>
            </div>

            {/* Birth Hour */}
            <div className="space-y-1.5">
              <Label htmlFor="tuvi-gio">Giờ sinh</Label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
                <select id="tuvi-gio" value={gioSinh}
                  onChange={(e) => { setGioSinh(Number(e.target.value)); setError(null); }}
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none"
                  disabled={loading}>
                  {GIO_LIST.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Nếu không biết giờ sinh, chọn giữa trưa (Ngọ: 11:00-12:59)
              </p>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <Label>Giới tính</Label>
              <div className="relative">
                <Users className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
                <select value={gioiTinh}
                  onChange={(e) => { setGioiTinh(e.target.value as "nam" | "nu"); setError(null); }}
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none"
                  disabled={loading}>
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="rounded-lg border border-red-500/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full bg-gradient-to-r from-red-600 to-amber-600 text-white hover:brightness-110"
              disabled={loading}>
              {loading ? (
                <><Loader2 className="size-4 animate-spin" /> Đang luận giải...</>
              ) : (
                <><Sparkles className="size-4" /> Lập lá số Tử Vi</>
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              Thông tin được bảo mật và chỉ dùng để luận giải theo Tứ trụ phương Đông
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
