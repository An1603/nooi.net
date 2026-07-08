"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Settings2, Award, TrendingUp, Layers, BookOpen, Sparkles, RefreshCw, Shield, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

// ─── Default config ─────────────────────────────────────────────────────────
interface SystemConfig {
  levelThresholds: number[];
  levelNames: string[];
  nPerJournal: number;
  nPerQuiz: number;
  nPerPractice: number;
  nPerGame: number;
  nPerStreak: number;
  streakMilestones: number[];
  badgeNames: string[];
  maxRefCodeChanges: number;
  mentorLevel: number;
  createGroupLevel: number;
  createLiveLevel: number;
}

const DEFAULT_CONFIG: SystemConfig = {
  levelThresholds: [0, 100, 300, 700, 1200, 2200, 3500],
  levelNames: ["🌰 Member", "Seeker 🌱", "Grower 🌿", "Giver 🌳", "Guider 🌲", "Mentor 🌳", "Master 👑"],
  nPerJournal: 10,
  nPerQuiz: 5,
  nPerPractice: 5,
  nPerGame: 3,
  nPerStreak: 3,
  streakMilestones: [1, 7, 14, 21, 30, 60, 100],
  badgeNames: ["Tia sáng đầu tiên", "Kiên trì tuần", "Hai tuần vững vàng", "Ba tuần chuyển hóa", "Một tháng thay đổi", "Hai tháng vững chãi", "Trăm ngày giác ngộ"],
  maxRefCodeChanges: 3,
  mentorLevel: 6,
  createGroupLevel: 5,
  createLiveLevel: 6,
};

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load from localStorage (since we don't have a settings table yet)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nooi-admin-config");
      if (stored) setConfig(JSON.parse(stored));
    } catch {}
  }, []);

  const save = () => {
    setSaving(true);
    try {
      localStorage.setItem("nooi-admin-config", JSON.stringify(config));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("✅ Đã lưu cấu hình hệ thống!");
    } catch {
      toast.error("❌ Lỗi khi lưu cấu hình");
    }
    setSaving(false);
  };

  const reset = () => {
    if (confirm("Khôi phục cấu hình mặc định?")) {
      setConfig(DEFAULT_CONFIG);
    }
  };

  const updateLevelThreshold = (idx: number, val: string) => {
    const newThresholds = [...config.levelThresholds];
    newThresholds[idx] = Number(val) || 0;
    setConfig({ ...config, levelThresholds: newThresholds });
  };

  const updateLevelName = (idx: number, val: string) => {
    const newNames = [...config.levelNames];
    newNames[idx] = val;
    setConfig({ ...config, levelNames: newNames });
  };

  const updateBadgeName = (idx: number, val: string) => {
    const newNames = [...config.badgeNames];
    newNames[idx] = val;
    setConfig({ ...config, badgeNames: newNames });
  };

  const updateMilestone = (idx: number, val: string) => {
    const newMiles = [...config.streakMilestones];
    newMiles[idx] = Number(val) || 1;
    setConfig({ ...config, streakMilestones: newMiles });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Cấu hình hệ thống</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý cấp bậc, điểm số, badge và các thông số hệ thống</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="h-9 px-3 rounded-lg border border-border bg-background text-xs hover:bg-muted/30 transition-colors flex items-center gap-1">
            <RefreshCw className="size-3.5" /> Mặc định
          </button>
          <button onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 transition-colors flex items-center gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : saved ? <CheckCircle className="size-3.5" /> : <Save className="size-3.5" />}
            {saving ? "Đang lưu..." : saved ? "Đã lưu" : "Lưu cấu hình"}
          </button>
        </div>
      </div>

      {/* ═══════════ LEVEL SYSTEM ═══════════ */}
      <Section icon={Layers} title="Cấp bậc (Level)" desc="7 cấp độ từ Người mới đến Master Mentor">
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {config.levelNames.map((name, i) => {
              const unlocked = i === 0 ? 0 : config.levelThresholds[i];
              return (
                <div key={i} className="rounded-lg border border-border/30 bg-white/[0.02] p-3 text-center">
                  <span className="text-[10px] text-muted-foreground">Level {i + 1}</span>
                  <input
                    value={name}
                    onChange={(e) => updateLevelName(i, e.target.value)}
                    className="w-full text-center text-xs font-bold bg-transparent border-b border-transparent hover:border-primary/30 focus:border-primary outline-none mt-1"
                  />
                  <div className="mt-2 text-[10px] text-muted-foreground">Cần N</div>
                  <input
                    type="number"
                    value={unlocked}
                    onChange={(e) => updateLevelThreshold(i, e.target.value)}
                    className="w-full text-center text-xs font-mono bg-muted/20 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                    min={0}
                    step={100}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Shield className="size-3" />
            Level {config.mentorLevel}+: Mentor · Level {config.createGroupLevel}+: Tạo nhóm · Level {config.createLiveLevel}+: Tạo Live
          </div>
        </div>
      </Section>

      {/* ═══════════ N POINTS ═══════════ */}
      <Section icon={TrendingUp} title="Điểm N" desc="Công thức tính điểm N (NOOI)">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <NField label="Mỗi nhật ký" value={config.nPerJournal} onChange={(v) => setConfig({ ...config, nPerJournal: v })} icon={BookOpen} color="text-cyan-400" />
          <NField label="Quiz đúng" value={config.nPerQuiz} onChange={(v) => setConfig({ ...config, nPerQuiz: v })} icon={Sparkles} color="text-amber-400" />
          <NField label="Thực hành" value={config.nPerPractice} onChange={(v) => setConfig({ ...config, nPerPractice: v })} icon={Award} color="text-purple-400" />
          <NField label="Game thắng" value={config.nPerGame} onChange={(v) => setConfig({ ...config, nPerGame: v })} icon={Sparkles} color="text-green-400" />
          <NField label="Streak daily" value={config.nPerStreak} onChange={(v) => setConfig({ ...config, nPerStreak: v })} icon={Award} color="text-red-400" />
        </div>
      </Section>

      {/* ═══════════ STREAK & BADGE ═══════════ */}
      <Section icon={Award} title="Streak & Huy hiệu (Badge)" desc="Mốc ngày streak và tên huy hiệu tương ứng">
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-2">
            {config.streakMilestones.map((milestone, i) => (
              <div key={i} className="rounded-lg border border-border/20 bg-white/[0.02] p-2.5 text-center">
                <div className="text-[10px] text-muted-foreground">Mốc {i + 1}</div>
                <input
                  type="number"
                  value={milestone}
                  onChange={(e) => updateMilestone(i, e.target.value)}
                  className="w-full text-center text-xs font-bold font-mono bg-muted/20 rounded px-1 py-0.5 mt-1 outline-none focus:ring-1 focus:ring-primary"
                  min={1}
                />
                <span className="text-[10px] text-muted-foreground block mt-1">ngày</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground font-medium mt-1">Tên huy hiệu:</div>
          <div className="grid grid-cols-7 gap-2">
            {config.badgeNames.map((name, i) => (
              <input
                key={i}
                value={name}
                onChange={(e) => updateBadgeName(i, e.target.value)}
                className="text-center text-[10px] bg-muted/20 border border-border/30 rounded-lg px-1 py-1.5 outline-none focus:border-primary"
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ PERMISSIONS ═══════════ */}
      <Section icon={Shield} title="Phân quyền (Level-gated)" desc="Cấp độ tối thiểu để sử dụng các tính năng">
        <div className="grid grid-cols-3 gap-3">
          <PermField label="Mentor (hướng dẫn)" value={config.mentorLevel} onChange={(v) => setConfig({ ...config, mentorLevel: v })} />
          <PermField label="Tạo nhóm" value={config.createGroupLevel} onChange={(v) => setConfig({ ...config, createGroupLevel: v })} />
          <PermField label="Tạo Live Class" value={config.createLiveLevel} onChange={(v) => setConfig({ ...config, createLiveLevel: v })} />
        </div>
        <div className="mt-3 text-[10px] text-muted-foreground">
          <span className="font-medium text-amber-400">⚠️ </span>Thay đổi permission ảnh hưởng đến code trong app — cần cập nhật tương ứng trong code logic.
        </div>
      </Section>

      {/* ═══════════ REFERRAL ═══════════ */}
      <Section icon={RefreshCw} title="Mã giới thiệu (Referral)" desc="Giới hạn đổi mã giới thiệu">
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted-foreground">Số lần đổi mã tối đa:</label>
          <input
            type="number"
            value={config.maxRefCodeChanges}
            onChange={(e) => setConfig({ ...config, maxRefCodeChanges: Number(e.target.value) || 0 })}
            className="w-20 h-9 rounded-lg border border-border bg-background px-3 text-sm text-center outline-none focus:border-primary"
            min={0}
            max={10}
          />
          <span className="text-[10px] text-muted-foreground">lần</span>
        </div>
      </Section>

      {/* ═══════════ SAVE BAR ═══════════ */}
      <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-border/30 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Cấu hình được lưu trong localStorage — cần hardcode vào code cho production</p>
        <button onClick={save} disabled={saving} className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-colors flex items-center gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <CheckCircle className="size-4" /> : <Save className="size-4" />}
          {saving ? "Đang lưu..." : saved ? "Đã lưu" : "Lưu cấu hình"}
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Section({ icon: Icon, title, desc, children }: { icon: React.ElementType; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function NField({ label, value, onChange, icon: Icon, color }: { label: string; value: number; onChange: (v: number) => void; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-lg border border-border/20 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`size-3 ${color}`} />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-16 h-8 rounded border border-border bg-background text-center text-sm font-bold outline-none focus:border-primary"
          min={0}
          max={100}
        />
        <span className="text-xs text-muted-foreground">N</span>
      </div>
    </div>
  );
}

function PermField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-lg border border-border/20 bg-white/[0.02] p-3 flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground">Level</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 1)}
          className="w-12 h-7 rounded border border-border bg-background text-center text-xs font-bold outline-none focus:border-primary"
          min={1}
          max={7}
        />
      </div>
    </div>
  );
}
