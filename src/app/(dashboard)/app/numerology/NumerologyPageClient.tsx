"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateNumerology } from "@/lib/numerology";
import type {
  NumerologyResult,
  CoreNumber,
  PeriodCycle,
  PinnacleCycle,
  ChallengeNumber,
} from "@/lib/numerology";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Sparkles,
  User,
  Calendar,
  ArrowLeft,
  Star,
  Compass,
  Heart,
  Eye,
  Cake,
  TrendingUp,
  Scale,
  Repeat,
  Mountain,
  Target,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";
import Link from "next/link";

interface ProfileData {
  numerology_report: NumerologyResult | null;
  full_name: string;
  date_of_birth: string | null;
  onboarding_completed: boolean;
  user_id: string;
}
interface Props {
  profile: ProfileData | null;
  email?: string;
}

// --- Color map for numbers ---
const NUMBER_COLORS: Record<number, string> = {
  1: "from-amber-500 to-orange-500",
  2: "from-blue-500 to-cyan-500",
  3: "from-yellow-500 to-amber-500",
  4: "from-emerald-500 to-green-500",
  5: "from-purple-500 to-pink-500",
  6: "from-rose-500 to-red-500",
  7: "from-indigo-500 to-violet-500",
  8: "from-gray-500 to-slate-500",
  9: "from-teal-500 to-emerald-500",
  11: "from-violet-500 to-purple-500",
  22: "from-orange-500 to-red-500",
  33: "from-pink-500 to-rose-500",
  0: "from-slate-500 to-gray-500",
};

function colorFor(value: number): string {
  return NUMBER_COLORS[value] ?? NUMBER_COLORS[1];
}

// --- Reusable number badge ---
function NumberBadge({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const c = colorFor(value);
  const sizeCls =
    size === "lg"
      ? "w-14 h-14 text-2xl"
      : size === "sm"
        ? "w-8 h-8 text-xs"
        : "w-10 h-10 text-sm";
  return (
    <span
      className={`shrink-0 ${sizeCls} rounded-full bg-gradient-to-br ${c} flex items-center justify-center font-bold text-white shadow-lg`}
    >
      {value}
    </span>
  );
}

// --- Section heading ---
function SectionHeading({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-primary">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// --- Core Number Card (Life Path, Destiny, Soul Urge, Personality) ---
function CoreNumberCard({
  icon: Icon,
  label,
  number,
}: {
  icon: React.ElementType;
  label: string;
  number: CoreNumber;
}) {
  const c = colorFor(number.value);
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
      <div className="flex items-start gap-3 mb-3">
        <div className={`shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${c} flex items-center justify-center`}>
          <Icon className="size-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-sm font-bold text-primary leading-tight">{number.name}</p>
        </div>
        <NumberBadge value={number.value} size="lg" />
      </div>

      <p className="text-sm leading-relaxed text-foreground/90 mb-3">{number.meaning}</p>

      {number.positive.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {number.positive.map((t, i) => (
            <span
              key={`p${i}`}
              className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              ✓ {t}
            </span>
          ))}
        </div>
      )}
      {number.negative.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {number.negative.map((t, i) => (
            <span
              key={`n${i}`}
              className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
            >
              △ {t}
            </span>
          ))}
        </div>
      )}

      {number.career && (
        <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Hướng nghiệp</p>
          <p className="text-xs leading-relaxed text-foreground/80">{number.career}</p>
        </div>
      )}
    </div>
  );
}

// --- Secondary Number Card (Birth Day, Maturity, Balance) ---
function SecondaryNumberCard({
  icon: Icon,
  label,
  number,
}: {
  icon: React.ElementType;
  label: string;
  number: CoreNumber;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="size-4 text-primary" />
        </div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex-1">{label}</p>
        <NumberBadge value={number.value} />
      </div>
      <p className="text-xs font-semibold text-primary mb-1.5">{number.name}</p>
      <p className="text-sm leading-relaxed text-foreground/90">{number.meaning}</p>
    </div>
  );
}

// --- Cycle Card (Period / Pinnacle / Challenge) ---
function CycleCard({
  index,
  ageRange,
  number,
  meaning,
  variant = "period",
}: {
  index: number;
  ageRange: string;
  number: number;
  meaning: string;
  variant?: "period" | "pinnacle" | "challenge";
}) {
  const variantLabel =
    variant === "pinnacle"
      ? "Đỉnh cao"
      : variant === "challenge"
        ? "Thách thức"
        : "Chu kỳ";
  const variantColor =
    variant === "pinnacle"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : variant === "challenge"
        ? "text-red-400 bg-red-500/10 border-red-500/20"
        : "text-blue-400 bg-blue-500/10 border-blue-500/20";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${variantColor}`}>
          {variantLabel} {index}
        </span>
        <span className="text-[11px] text-muted-foreground ml-auto">{ageRange}</span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <NumberBadge value={number} />
        <p className="text-sm leading-relaxed text-foreground/90 flex-1">{meaning || "—"}</p>
      </div>
    </div>
  );
}

// --- Expandable Detailed Interpretation ---
function DetailedInterpretation({
  icon: Icon,
  label,
  number,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  label: string;
  number: CoreNumber;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-primary truncate">{number.name}</p>
        </div>
        <NumberBadge value={number.value} />
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/60">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Giải nghĩa chi tiết</p>
            <p className="text-sm leading-relaxed text-foreground/90">{number.meaning}</p>
          </div>
          {number.meaningEn && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">English</p>
              <p className="text-xs leading-relaxed italic text-muted-foreground">{number.meaningEn}</p>
            </div>
          )}
          {number.career && (
            <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Hướng nghiệp</p>
              <p className="text-xs leading-relaxed text-foreground/80">{number.career}</p>
              {number.careerEn && (
                <p className="text-[11px] leading-relaxed italic text-muted-foreground mt-1">{number.careerEn}</p>
              )}
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Đặc điểm tích cực</p>
            <div className="flex flex-wrap gap-1">
              {number.positive.length > 0 ? (
                number.positive.map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  >
                    ✓ {t}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Đặc điểm cần chú ý</p>
            <div className="flex flex-wrap gap-1">
              {number.negative.length > 0 ? (
                number.negative.map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    △ {t}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>
          {number.reductionSteps.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Quá trình rút gọn</p>
              <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                {number.originalSum !== number.value && (
                  <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/60">
                    Tổng: {number.originalSum}
                  </span>
                )}
                {number.reductionSteps.map((s, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="size-3" />}
                    <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/60">{s}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Scientific Basis Section ---
function ScientificBasis() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BookOpen className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-primary">Cơ sở khoa học & Nguồn gốc Thần số học</h2>
          <p className="text-xs text-muted-foreground">Hiểu về hệ thống Pythagoras và các chỉ số</p>
        </div>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
        <div>
          <h3 className="text-sm font-semibold text-primary mb-1">Hệ thống Pythagoras</h3>
          <p>
            Thần số học (Numerology) theo hệ thống Pythagoras được phát triển bởi Pythagoras
            (≈570–495 TCN), nhà toán học và triết học Hy Lạp. Ông tin rằng{" "}
            <em>&ldquo;mọi thứ đều là số&rdquo;</em> và vũ trụ được cấu tạo bởi các rung động số học.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary mb-1">Bảng chữ cái Pythagoras</h3>
          <p className="mb-2">Mỗi chữ cái được gán giá trị số 1–9 theo bảng:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
            {[
              { n: 1, l: "A, J, S" },
              { n: 2, l: "B, K, T" },
              { n: 3, l: "C, L, U" },
              { n: 4, l: "D, M, V" },
              { n: 5, l: "E, N, W" },
              { n: 6, l: "F, O, X" },
              { n: 7, l: "G, P, Y" },
              { n: 8, l: "H, Q, Z" },
              { n: 9, l: "I, R" },
            ].map((row) => (
              <div
                key={row.n}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5"
              >
                <NumberBadge value={row.n} size="sm" />
                <span className="text-foreground/80">{row.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary mb-1">Các chỉ số chính</h3>
          <ul className="space-y-1.5 text-xs">
            <li>
              <span className="font-medium text-foreground">Đường đời (Life Path)</span>: Tổng ngày+tháng+năm sinh,
              rút gọn về 1 chữ số (hoặc Master Number 11, 22, 33). Đại diện cho con đường cuộc đời.
            </li>
            <li>
              <span className="font-medium text-foreground">Sứ mệnh (Destiny/Expression)</span>: Tổng giá trị chữ cái
              trong họ tên. Đại diện cho tiềm năng và sứ mệnh.
            </li>
            <li>
              <span className="font-medium text-foreground">Linh hồn (Soul Urge)</span>: Tổng nguyên âm. Đại diện cho
              khao khát nội tâm.
            </li>
            <li>
              <span className="font-medium text-foreground">Nhân cách (Personality)</span>: Tổng phụ âm. Đại diện cho
              cách người khác nhìn nhận.
            </li>
            <li>
              <span className="font-medium text-foreground">Chu kỳ (Period Cycles)</span>: 3 giai đoạn cuộc đời dựa
              trên tháng, ngày, năm sinh.
            </li>
            <li>
              <span className="font-medium text-foreground">Đỉnh cao (Pinnacles)</span>: 4 giai đoạn đỉnh cao dựa trên
              tổng các thành phần ngày sinh.
            </li>
            <li>
              <span className="font-medium text-foreground">Thách thức (Challenges)</span>: 4 bài học dựa trên hiệu
              các thành phần ngày sinh.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary mb-1">Master Numbers</h3>
          <p>
            Số <strong>11</strong> (Người giác ngộ), <strong>22</strong> (Người kiến tạo vĩ đại),{" "}
            <strong>33</strong> (Người chữa lành) không rút gọn, mang năng lượng đặc biệt.
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex gap-2">
          <Info className="size-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/90">
            <strong>Ghi chú:</strong> Thần số học là hệ thống biểu tượng học, không phải khoa học thực nghiệm. Thông
            tin mang tính tham khảo và phát triển bản thân.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Numerology Report ---
function NumerologyReport({
  result,
  fullName,
  dateOfBirth,
}: {
  result: NumerologyResult;
  fullName: string;
  dateOfBirth: string | null;
}) {
  const formattedDob = dateOfBirth
    ? new Date(dateOfBirth).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back link */}
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Về Dashboard
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/60 p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles className="size-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-primary">Bản đồ Thần số học</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <User className="size-3.5" />
                {fullName || "—"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                {formattedDob}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">
              Báo cáo chi tiết theo hệ thống Pythagoras, bao gồm các chỉ số cốt lõi, chu kỳ cuộc đời,
              bài học karmic và nền tảng khoa học của Thần số học.
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Đường đời", value: result.lifePath.value, color: colorFor(result.lifePath.value) },
          { label: "Sứ mệnh", value: result.destiny.value, color: colorFor(result.destiny.value) },
          { label: "Linh hồn", value: result.soulUrge.value, color: colorFor(result.soulUrge.value) },
          { label: "Nhân cách", value: result.personality.value, color: colorFor(result.personality.value) },
        ].map((item) => (
          <div key={item.label} className="p-3 rounded-xl border border-border bg-card text-center">
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <div
              className={`mx-auto mt-1 w-9 h-9 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-base font-bold text-white`}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Core Numbers */}
      <section>
        <SectionHeading
          icon={Star}
          title="Chỉ số Cốt lõi"
          subtitle="Bốn con số quan trọng nhất định hình bản dạng của bạn"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CoreNumberCard icon={Compass} label="Đường đời (Life Path)" number={result.lifePath} />
          <CoreNumberCard icon={Target} label="Sứ mệnh (Destiny)" number={result.destiny} />
          <CoreNumberCard icon={Heart} label="Linh hồn (Soul Urge)" number={result.soulUrge} />
          <CoreNumberCard icon={Eye} label="Nhân cách (Personality)" number={result.personality} />
        </div>
      </section>

      {/* Secondary Numbers */}
      <section>
        <SectionHeading
          icon={Scale}
          title="Chỉ số Phụ trợ"
          subtitle="Các con số bổ trợ cho bức tranh tổng thể"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SecondaryNumberCard icon={Cake} label="Ngày sinh (Birth Day)" number={result.birthDay} />
          <SecondaryNumberCard icon={TrendingUp} label="Trưởng thành (Maturity)" number={result.maturity} />
          <SecondaryNumberCard icon={Scale} label="Cân bằng (Balance)" number={result.balance} />
        </div>
      </section>

      {/* Period Cycles */}
      <section>
        <SectionHeading
          icon={Repeat}
          title="Chu kỳ Cuộc đời (Period Cycles)"
          subtitle="3 giai đoạn lớn chia cắt đời người"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {result.periodCycles.map((c: PeriodCycle) => (
            <CycleCard
              key={`period-${c.period}`}
              index={c.period}
              ageRange={c.ageRange}
              number={c.number}
              meaning={c.meaning}
              variant="period"
            />
          ))}
        </div>
      </section>

      {/* Pinnacle Cycles */}
      <section>
        <SectionHeading
          icon={Mountain}
          title="Đỉnh cao (Pinnacles)"
          subtitle="4 giai đoạn đỉnh năng lượng trong đời"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.pinnacleCycles.map((c: PinnacleCycle) => (
            <CycleCard
              key={`pin-${c.pinnacle}`}
              index={c.pinnacle}
              ageRange={c.ageRange}
              number={c.number}
              meaning={c.meaning}
              variant="pinnacle"
            />
          ))}
        </div>
      </section>

      {/* Challenge Numbers */}
      <section>
        <SectionHeading
          icon={Target}
          title="Thách thức (Challenges)"
          subtitle="4 bài học cần vượt qua trong từng giai đoạn"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.challengeNumbers.map((c: ChallengeNumber) => (
            <CycleCard
              key={`ch-${c.challenge}`}
              index={c.challenge}
              ageRange={c.ageRange}
              number={c.number}
              meaning={c.meaning}
              variant="challenge"
            />
          ))}
        </div>
      </section>

      {/* Karmic Lessons & Subconscious Self */}
      <section>
        <SectionHeading
          icon={BookOpen}
          title="Bài học Karmic & Tiềm thức"
          subtitle="Những con số thiếu vắng trong tên của bạn"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Karmic Lessons */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
              Bài học Karmic (số thiếu)
            </p>
            {result.karmicLessons.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {result.karmicLessons.map((n) => (
                    <NumberBadge key={n} value={n} size="sm" />
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-foreground/80">
                  Đây là những con số không xuất hiện trong tên của bạn. Chúng đại diện cho những năng
                  lượng thiếu hụt — những bài học mà bạn cần ý thức phát triển trong đời này để đạt
                  đến sự viên mãn.
                </p>
              </>
            ) : (
              <p className="text-sm text-foreground/80">
                Tên của bạn chứa đầy đủ các con số từ 1–9. Bạn không có bài học karmic đặc biệt nào —
                một dấu hiệu của sự cân bằng tự nhiên.
              </p>
            )}
          </div>

          {/* Subconscious Self */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
              Tiềm thức (Subconscious Self)
            </p>
            <div className="flex items-center gap-3 mb-3">
              <NumberBadge value={result.subconsciousSelf} size="lg" />
              <div className="text-sm">
                <span className="font-semibold text-primary">{result.subconsciousSelf}/9</span>
                <span className="text-muted-foreground"> con số hiện diện</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-foreground/80">
              {result.subconsciousSelf >= 7
                ? "Bạn có nền tảng tâm lý vững chắc và tự tin vào khả năng ứng phó với các tình huống. Tiềm thức của bạn phản hồi nhanh và linh hoạt."
                : result.subconsciousSelf >= 4
                  ? "Bạn có khả năng ứng phó ở mức trung bình. Một số tình huống bất ngờ có thể khiến bạn lúng túng — hãy chủ động trau dồi thêm các kỹ năng còn thiếu."
                  : "Bạn cần thời gian để thích nghi với các thay đổi bất ngờ. Việc phát triển các năng lượng còn thiếu sẽ giúp bạn tự tin và linh hoạt hơn."}
            </p>
          </div>
        </div>
      </section>

      {/* Cornerstones */}
      <section>
        <SectionHeading
          icon={BookOpen}
          title="Cornerstones (Chữ cái đầu)"
          subtitle="Cách bạn tiếp cận cuộc sống qua chữ cái đầu mỗi phần tên"
        />
        {result.cornerstones.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {result.cornerstones.map((cs, i) => (
              <div
                key={`cs-${i}`}
                className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
                  <span className="text-base font-bold text-primary">{cs.letter || "—"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <NumberBadge value={cs.number} size="sm" />
                    <span className="text-[10px] text-muted-foreground">giá trị {cs.number}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/80">
                    {cs.meaning || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground rounded-xl border border-border bg-card p-4">
            Không có dữ liệu cornerstones.
          </p>
        )}
      </section>

      {/* Detailed Interpretations */}
      <section>
        <SectionHeading
          icon={Info}
          title="Giải nghĩa Chi tiết"
          subtitle="Nhấp để mở rộng từng chỉ số cốt lõi"
        />
        <div className="space-y-2">
          <DetailedInterpretation icon={Compass} label="Đường đời" number={result.lifePath} defaultOpen />
          <DetailedInterpretation icon={Target} label="Sứ mệnh" number={result.destiny} />
          <DetailedInterpretation icon={Heart} label="Linh hồn" number={result.soulUrge} />
          <DetailedInterpretation icon={Eye} label="Nhân cách" number={result.personality} />
          <DetailedInterpretation icon={Cake} label="Ngày sinh" number={result.birthDay} />
          <DetailedInterpretation icon={TrendingUp} label="Trưởng thành" number={result.maturity} />
          <DetailedInterpretation icon={Scale} label="Cân bằng" number={result.balance} />
        </div>
      </section>

      {/* Scientific Basis */}
      <section>
        <ScientificBasis />
      </section>

      {/* Footer */}
      <p className="text-[10px] text-center text-muted-foreground">
        NOOI — Thần số học Pythagoras · Báo cáo mang tính tham khảo
      </p>
    </div>
  );
}

// --- INLINE FORM ---
function NumerologyForm({ profile, email }: { profile: ProfileData; email?: string }) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    profile.date_of_birth?.split("T")[0] || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!fullName.trim()) {
        setError("Nhập họ tên.");
        return;
      }
      if (!dateOfBirth) {
        setError("Chọn ngày sinh.");
        return;
      }
      setLoading(true);
      try {
        const numerology = calculateNumerology({
          fullName: fullName.trim(),
          dateOfBirth,
        });
        await supabase
          .from("profiles")
          .upsert(
            {
              user_id: profile.user_id,
              full_name: fullName.trim(),
              date_of_birth: dateOfBirth,
              numerology_report: numerology as unknown as Record<string, unknown>,
              onboarding_completed: true,
            },
            { onConflict: "user_id" }
          );
        setDone(true);
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi");
      } finally {
        setLoading(false);
      }
    },
    [fullName, dateOfBirth, supabase, profile.user_id]
  );

  if (done)
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="max-w-md mx-auto space-y-6 py-12">
      <div className="text-center">
        <span className="text-4xl">🔮</span>
        <h2 className="text-xl font-bold mt-2">Thần số học</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Nhập tên + ngày sinh để khám phá bản thân
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-card/80 border border-border rounded-2xl p-6 space-y-4"
      >
        <div className="space-y-1.5">
          <Label>Họ tên đầy đủ *</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-8"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Ngày sinh *</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="pl-8"
              required
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground hover:brightness-110"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Đang tính...
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> Lập bản Thần số học
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

// --- MAIN ---
export function NumerologyPageClient({ profile, email }: Props) {
  if (profile?.numerology_report) {
    return (
      <NumerologyReport
        result={profile.numerology_report}
        fullName={profile.full_name}
        dateOfBirth={profile.date_of_birth}
      />
    );
  }
  return (
    <NumerologyForm
      profile={
        profile || {
          full_name: "",
          date_of_birth: null,
          onboarding_completed: false,
          user_id: "",
          numerology_report: null,
        }
      }
      email={email}
    />
  );
}
