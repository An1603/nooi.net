"use client";
import type { ReactNode } from "react";
import type { CoreNumber, NumerologyResult, Cornerstone } from "@/lib/numerology";

/** Thẻ luận giải chi tiết Thần số học Pythagoras — render ĐẦY ĐỦ mọi field của NumerologyResult. */
export function NumerologyDetail({ result }: { result: NumerologyResult | null }) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 p-6 text-center">
        <p className="text-sm text-destructive">
          Không tính được bản đồ Thần số học cho hồ sơ này. Vui lòng kiểm tra lại ngày sinh / họ tên.
        </p>
      </div>
    );
  }

  const coreNumbers: CoreNumber[] = [
    result.lifePath,
    result.destiny,
    result.soulUrge,
    result.personality,
    result.birthDay,
    result.maturity,
    result.balance,
  ];

  return (
    <div className="space-y-5">
      {/* ── 1. Bảy con số cốt lõi ── */}
      <Section title="Bảy con số cốt lõi" icon="🔢">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {coreNumbers.map((n) => (
            <CoreNumberCard key={n.nameEn || String(n.value)} number={n} />
          ))}
        </div>
      </Section>

      {/* ── 2. Chu kỳ vận số (period / pinnacle / challenge) ── */}
      <Section title="Chu kỳ vận số" icon="🔄">
        <div className="space-y-4">
          <CycleGroup
            title="Chu kỳ cá nhân (Period Cycle)"
            hint="Ba giai đoạn lớn của cuộc đời."
            cycles={result.periodCycles.map((c) => ({
              key: `chu-kỳ-${c.period}`,
              label: `Chu kỳ ${c.period}`,
              ageRange: c.ageRange,
              number: c.number,
              meaning: c.meaning,
            }))}
          />
          <CycleGroup
            title="Đỉnh cao cuộc đời (Pinnacle Cycle)"
            hint="Bốn đỉnh cao đánh dấu các giai đoạn thăng hoa."
            cycles={result.pinnacleCycles.map((c) => ({
              key: `đỉnh-${c.pinnacle}`,
              label: `Đỉnh cao ${c.pinnacle}`,
              ageRange: c.ageRange,
              number: c.number,
              meaning: c.meaning,
            }))}
          />
          <CycleGroup
            title="Thử thách (Challenge Number)"
            hint="Những bài học cần vượt qua trong từng giai đoạn."
            cycles={result.challengeNumbers.map((c) => ({
              key: `thử-thách-${c.challenge}`,
              label: `Thử thách ${c.challenge}`,
              ageRange: c.ageRange,
              number: c.number,
              meaning: c.meaning,
            }))}
          />
        </div>
      </Section>

      {/* ── 3. Nghiệp quả, tiềm thức & con số thiếu ── */}
      <Section title="Nghiệp quả, tiềm thức & con số thiếu" icon="🧭">
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-surface-elevated/60 p-3">
            <h4 className="text-sm font-semibold text-foreground">Bài học nghiệp quả (Karmic Lessons)</h4>
            <NumberChips
              numbers={result.karmicLessons}
              hint={
                result.karmicLessons.length === 0
                  ? "Tên gọi đầy đủ các con số 1–9, không có bài học nghiệp quả lớn."
                  : "Những con số chưa xuất hiện trong tên gọi — bài học cần rèn luyện trong đời."
              }
            />
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated/60 p-3">
            <h4 className="text-sm font-semibold text-foreground">Con số tiềm thức (Subconscious Self)</h4>
            <div className="mt-1 flex flex-wrap items-baseline gap-2 text-sm">
              <span className="text-3xl font-bold text-n-gold">{result.subconsciousSelf}</span>
              <span className="text-muted-foreground">
                Số lượng con số riêng biệt hiện diện trong tên gọi — phản ánh mức độ tự tin, bản năng phản ứng trước áp lực.
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated/60 p-3">
            <h4 className="text-sm font-semibold text-foreground">Con số còn thiếu (Missing Numbers)</h4>
            <NumberChips
              numbers={result.missingNumbers}
              hint={
                result.missingNumbers.length === 0
                  ? "Tên gọi đầy đủ, không thiếu con số nào."
                  : "Những con số không xuất hiện trong tên gọi."
              }
            />
          </div>
        </div>
      </Section>

      {/* ── 4. Chữ cái nền tảng (Cornerstones) ── */}
      <Section title="Chữ cái nền tảng (Cornerstones)" icon="🔤">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {result.cornerstones.map((c) => (
            <CornerstoneCard key={c.letter} cornerstone={c} />
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Khối dựng chung
 * ──────────────────────────────────────────────────────────────────────────── */

function Section({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <span aria-hidden>{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Thẻ cho một con số cốt lõi: giá trị + tên + luận giải + điểm mạnh/yếu + nghề nghiệp. */
function CoreNumberCard({ number }: { number: CoreNumber }) {
  return (
    <article className="space-y-3 rounded-2xl border border-border bg-card/70 p-4">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-n-gold">
          {number.value}
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{number.name}</h4>
          {number.nameEn ? <p className="text-xs text-muted-foreground">{number.nameEn}</p> : null}
        </div>
      </header>

      {number.meaning ? (
        <p className="text-sm leading-relaxed text-foreground/90">{number.meaning}</p>
      ) : null}

      {number.positive.length > 0 ? (
        <TraitList title="Điểm mạnh" tone="positive" items={number.positive} />
      ) : null}

      {number.negative.length > 0 ? (
        <TraitList title="Điểm cần khắc phục" tone="negative" items={number.negative} />
      ) : null}

      {number.career ? (
        <div className="rounded-xl border border-border bg-surface-elevated/40 px-3 py-2">
          <p className="text-xs font-medium text-n-purple">Nghề nghiệp phù hợp</p>
          <p className="mt-0.5 text-sm leading-relaxed text-foreground/90">{number.career}</p>
        </div>
      ) : null}
    </article>
  );
}

/** Danh sách điểm mạnh / điểm yếu của một con số cốt lõi. */
function TraitList({ title, tone, items }: { title: string; tone: "positive" | "negative"; items: string[] }) {
  const accent = tone === "positive" ? "text-n-green" : "text-n-rose";
  return (
    <div>
      <p className={`text-xs font-medium ${accent}`}>{title}</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {items.map((t) => (
          <li
            key={t}
            className="rounded-full border border-border bg-glass px-2 py-0.5 text-xs text-foreground/90"
          >
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Dạng chu kỳ đã chuẩn hoá (dùng chung cho Period/Pinnacle/Challenge). */
interface CycleRow {
  key: string;
  label: string;
  ageRange: string;
  number: number;
  meaning: string;
}

/** Nhóm chu kỳ: mỗi phần tử hiển thị số + khoảng tuổi + luận giải. */
function CycleGroup({ title, hint, cycles }: { title: string; hint: string; cycles: CycleRow[] }) {
  if (cycles.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 p-3">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        <p className="mt-2 text-sm text-muted-foreground">Chưa có dữ liệu chu kỳ.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-3">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cycles.map((c) => (
          <div key={c.key} className="space-y-1 rounded-xl border border-border bg-surface-elevated/40 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <span className="text-sm font-medium text-foreground">{c.label}</span>
              <span className="text-xs text-muted-foreground">{c.ageRange}</span>
            </div>
            <p className="text-2xl font-bold text-n-gold">{c.number}</p>
            <p className="text-xs leading-relaxed text-foreground/85">{c.meaning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dãy con số (bài học nghiệp quả / con số thiếu) kèm chú giải. */
function NumberChips({ numbers, hint }: { numbers: number[]; hint: string }) {
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5">
        {numbers.length === 0 ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          numbers.map((n) => (
            <span
              key={n}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-glass text-sm font-semibold text-foreground"
            >
              {n}
            </span>
          ))
        )}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

/** Thẻ chữ cái nền tảng: chữ + số + luận giải. */
function CornerstoneCard({ cornerstone }: { cornerstone: Cornerstone }) {
  return (
    <div className="space-y-1 rounded-2xl border border-border bg-card/70 p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-base font-bold text-n-purple">
          {cornerstone.letter}
        </span>
        <span className="text-lg font-bold text-n-gold">{cornerstone.number}</span>
      </div>
      <p className="text-xs leading-relaxed text-foreground/85">{cornerstone.meaning}</p>
    </div>
  );
}