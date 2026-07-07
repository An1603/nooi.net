"use client";

import { useState } from "react";
import { X, Sparkles, CheckCircle, Lock, TrendingUp, BookOpen, Award } from "lucide-react";

const LEVELS = [
  { level: 1, name: "Người mới", nRequired: 0, desc: "Bắt đầu hành trình chuyển hóa", icon: "🌱", color: "text-gray-400", bg: "bg-gray-500/10" },
  { level: 2, name: "Người tìm kiếm", nRequired: 100, desc: "Hiểu rõ bản thân", icon: "🔍", color: "text-blue-400", bg: "bg-blue-500/10" },
  { level: 3, name: "Học viên", nRequired: 300, desc: "Xây nền tảng vững chắc", icon: "📚", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { level: 4, name: "Người thực hành", nRequired: 600, desc: "Chuyển hóa hàng ngày", icon: "🔥", color: "text-amber-400", bg: "bg-amber-500/10" },
  { level: 5, name: "Người đồng hành", nRequired: 1000, desc: "Lan tỏa giá trị", icon: "🤝", color: "text-orange-400", bg: "bg-orange-500/10" },
  { level: 6, name: "Mentor", nRequired: 1500, desc: "Hướng dẫn người khác", icon: "⭐", color: "text-red-400", bg: "bg-red-500/10" },
  { level: 7, name: "Master Mentor", nRequired: 2500, desc: "Làm chủ hành trình", icon: "🌟", color: "text-purple-400", bg: "bg-purple-500/10" },
];

const N_RULES = [
  { action: "Viết nhật ký", n: 10, icon: BookOpen },
  { action: "Quiz đúng", n: 5, icon: Sparkles },
  { action: "Thực hành", n: 5, icon: Award },
  { action: "Game thắng", n: 3, icon: Sparkles },
  { action: "Streak check-in", n: 3, icon: TrendingUp },
];

interface Props {
  currentN: number;
  currentLevel: number;
  currentLevelName: string;
  trigger: React.ReactNode;
}

export function LevelInfoModal({ currentN, currentLevel, currentLevelName, trigger }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg bg-[#111] border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div>
                <h2 className="text-base font-bold">Hệ thống cấp bậc NOOI</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bạn đang ở <span className="text-primary font-medium">{currentLevelName}</span> — {currentN} N
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="size-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Level ladder */}
              <div className="space-y-2">
                {LEVELS.map((lvl, i) => {
                  const unlocked = currentN >= lvl.nRequired;
                  const isCurrent = currentLevel === lvl.level;
                  const nextN = i < LEVELS.length - 1 ? LEVELS[i + 1].nRequired - currentN : 0;

                  return (
                    <div
                      key={lvl.level}
                      className={`relative rounded-xl border p-4 transition-all ${
                        isCurrent
                          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                          : unlocked
                          ? "border-border/50 bg-white/[0.02]"
                          : "border-border/30 bg-white/[0.01] opacity-50"
                      }`}
                    >
                      {/* Connector line */}
                      {i < LEVELS.length - 1 && (
                        <div className={`absolute left-7 top-14 w-0.5 h-4 ${unlocked ? "bg-primary/30" : "bg-border/30"}`} />
                      )}

                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`size-12 rounded-full ${lvl.bg} flex items-center justify-center text-lg shrink-0`}>
                          {unlocked ? <CheckCircle className={`size-5 ${lvl.color}`} /> : <Lock className="size-4 text-muted-foreground/50" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">Lv.{lvl.level}</span>
                            <span className={`text-sm font-bold ${isCurrent ? "text-primary" : unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                              {lvl.icon} {lvl.name}
                            </span>
                            {isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Hiện tại</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{lvl.desc}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                            <span>Cần {lvl.nRequired} N</span>
                            {isCurrent && nextN > 0 && <span>Còn {nextN} N để lên cấp</span>}
                          </div>

                          {/* Progress bar cho level hiện tại */}
                          {isCurrent && nextN > 0 && (
                            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                                style={{
                                  width: `${i > 0 ? Math.min(100, ((currentN - LEVELS[i - 1].nRequired) / (lvl.nRequired - LEVELS[i - 1].nRequired)) * 100) : (currentN / LEVELS[1].nRequired) * 100}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* N Rules */}
              <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cách kiếm N (NOOI)</h3>
                <div className="grid grid-cols-2 gap-2">
                  {N_RULES.map((rule) => {
                    const Icon = rule.icon;
                    return (
                      <div key={rule.action} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                        <Icon className="size-3.5 text-primary shrink-0" />
                        <span className="text-[10px] text-muted-foreground flex-1">{rule.action}</span>
                        <span className="text-xs font-bold text-primary">+{rule.n}N</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Perks */}
              <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mở khóa theo cấp</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400 font-mono">Lv.5</span>
                    <span className="text-muted-foreground">Tạo nhóm học tập</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-mono">Lv.6</span>
                    <span className="text-muted-foreground">Trở thành Mentor, tổ chức lớp Live</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">Lv.7</span>
                    <span className="text-muted-foreground">Master Mentor — Toàn quyền hướng dẫn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
