"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateNumerology } from "@/lib/numerology";
import type { NumerologyResult } from "@/lib/numerology";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, User, Calendar, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";

interface ProfileData {
  numerology_report: NumerologyResult | null;
  full_name: string;
  date_of_birth: string | null;
  onboarding_completed: boolean;
  user_id: string;
}
interface Props { profile: ProfileData | null; email?: string; }

/* ── SIMPLE REPORT (same as original) ── */
function CoreNumberCard({ icon: Icon, label, number, traits }: {
  icon: React.ElementType; label: string; number: { value: number; name: string; meaning: string; positive: string[]; negative: string[] }; traits?: { positive: string[]; negative: string[] };
}) {
  const colorMap: Record<number, string> = {
    1: "from-amber-500 to-orange-500", 2: "from-blue-500 to-cyan-500", 3: "from-yellow-500 to-amber-500",
    4: "from-emerald-500 to-green-500", 5: "from-purple-500 to-pink-500", 6: "from-rose-500 to-red-500",
    7: "from-indigo-500 to-violet-500", 8: "from-gray-500 to-slate-500", 9: "from-teal-500 to-emerald-500",
    11: "from-violet-500 to-purple-500", 22: "from-orange-500 to-red-500", 33: "from-pink-500 to-rose-500",
  };
  const c = colorMap[number.value] || colorMap[1];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${c} flex items-center justify-center`}>
          <Icon className="size-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-primary">{number.name}</p>
            <span className={`shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${c} flex items-center justify-center text-sm font-bold text-white`}>{number.value}</span>
          </div>
          <p className="text-sm mt-2 leading-relaxed">{number.meaning}</p>
          {traits && (
            <div className="flex flex-wrap gap-1 mt-2">
              {traits.positive.map((t, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ {t}</span>
              ))}
              {traits.negative.map((t, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">△ {t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NumerologyReport({ result, fullName, dateOfBirth }: { result: NumerologyResult; fullName: string; dateOfBirth: string | null }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <Link href="/app" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
        <ArrowLeft className="size-3" /> Về Dashboard
      </Link>
      <h1 className="text-2xl font-bold">Bản đồ Thần số học</h1>
      <p className="text-sm text-muted-foreground">{fullName}{dateOfBirth ? ` • ${new Date(dateOfBirth).toLocaleDateString("vi-VN")}` : ""}</p>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Đường đời", value: result.lifePath.value },
          { label: "Sứ mệnh", value: result.destiny.value },
          { label: "Linh hồn", value: result.soulUrge.value },
          { label: "Nhân cách", value: result.personality.value },
        ].map((item) => (
          <div key={item.label} className="p-3 rounded-xl border border-border bg-card text-center">
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-bold text-primary">{item.value}</p>
          </div>
        ))}
      </div>
      <CoreNumberCard icon={Star} label="Chỉ số Đường đời" number={result.lifePath} traits={{ positive: result.lifePath.positive, negative: result.lifePath.negative }} />
      <CoreNumberCard icon={Star} label="Chỉ số Sứ mệnh" number={result.destiny} traits={{ positive: result.destiny.positive, negative: result.destiny.negative }} />
      <CoreNumberCard icon={Star} label="Chỉ số Linh hồn" number={result.soulUrge} traits={{ positive: result.soulUrge.positive, negative: result.soulUrge.negative }} />
      <CoreNumberCard icon={Star} label="Chỉ số Nhân cách" number={result.personality} traits={{ positive: result.personality.positive, negative: result.personality.negative }} />
      <CoreNumberCard icon={Star} label="Chỉ số Ngày sinh" number={result.birthDay} />
      <CoreNumberCard icon={Star} label="Chỉ số Trưởng thành" number={result.maturity} />
      <p className="text-[10px] text-center text-muted-foreground">NOOI — Thần số học Pythagoras</p>
    </div>
  );
}

/* ── FORM ── */
function NumerologyForm({ profile, email }: { profile: ProfileData; email?: string }) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth?.split("T")[0] || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!fullName.trim()) { setError("Nhập họ tên."); return; }
    if (!dateOfBirth) { setError("Chọn ngày sinh."); return; }
    setLoading(true);
    try {
      const numerology = calculateNumerology({ fullName: fullName.trim(), dateOfBirth });
      await supabase.from("profiles").upsert({
        user_id: profile.user_id, full_name: fullName.trim(), date_of_birth: dateOfBirth,
        numerology_report: numerology as unknown as Record<string, unknown>,
        onboarding_completed: true,
      }, { onConflict: "user_id" });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tính toán");
    } finally { setLoading(false); }
  }, [fullName, dateOfBirth, supabase, profile.user_id]);

  return (
    <div className="max-w-md mx-auto space-y-6 py-12">
      <div className="text-center"><span className="text-4xl">🔮</span><h2 className="text-xl font-bold mt-2">Thần số học</h2><p className="text-sm text-muted-foreground mt-1">Nhập tên + ngày sinh để khám phá bản thân</p></div>
      <form onSubmit={handleSubmit} className="bg-card/80 border border-border rounded-2xl p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Họ tên đầy đủ *</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Nguyễn Văn A" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-8" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Ngày sinh *</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="pl-8" required max={new Date().toISOString().split("T")[0]} />
          </div>
        </div>
        {error && <div className="rounded-lg border border-red-500/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">{error}</div>}
        <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:brightness-110">
          {loading ? <><Loader2 className="size-4 animate-spin" /> Đang tính...</> : <><Sparkles className="size-4" /> Lập bản Thần số học</>}
        </Button>
      </form>
    </div>
  );
}

/* ── MAIN ── */
export function NumerologyPageClient({ profile, email }: Props) {
  // Auto-calculate if user has full_name + DOB but no report yet
  const [autoCalculated, setAutoCalculated] = useState(false);
  const [report, setReport] = useState<NumerologyResult | null>(profile?.numerology_report || null);
  const [calculating, setCalculating] = useState(false);

  const hasInfo = profile?.full_name && profile?.date_of_birth;

  // Auto-calculate on mount if info exists but no report
  if (hasInfo && !report && !autoCalculated && !calculating) {
    setAutoCalculated(true);
    setCalculating(true);
    const supabase = createClient();
    try {
      const result = calculateNumerology({ fullName: profile!.full_name, dateOfBirth: profile!.date_of_birth! });
      setReport(result);
      supabase.from("profiles").upsert({
        user_id: profile!.user_id,
        numerology_report: result as unknown as Record<string, unknown>,
      }, { onConflict: "user_id" });
    } catch (e) {
      // fall back to form
    }
    setCalculating(false);
  }

  if (calculating) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="size-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tính toán Thần số học...</p>
        </div>
      </div>
    );
  }

  if (report) {
    return <NumerologyReport result={report} fullName={profile?.full_name || ""} dateOfBirth={profile?.date_of_birth || null} />;
  }

  return (
    <NumerologyForm
      profile={profile || { full_name: "", date_of_birth: null, onboarding_completed: false, user_id: "", numerology_report: null }}
      email={email}
    />
  );
}