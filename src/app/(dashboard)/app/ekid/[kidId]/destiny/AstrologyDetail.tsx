"use client";
import type { ReactNode } from "react";
import type {
  Aspect,
  Ascendant,
  AstrologyResult,
  House,
  Midheaven,
  PlanetPosition,
} from "@/lib/astrology";
import { ELEMENTS } from "@/lib/astrology/constants";

/** Các lĩnh vực luận giải chiêm tinh — key ánh xạ sang nhãn + icon. */
const INTERP_FIELDS: { key: "tinhCach" | "suNghiep" | "tinhDuyen" | "sucKhoe"; label: string; icon: string }[] = [
  { key: "tinhCach", label: "Tính cách", icon: "💬" },
  { key: "suNghiep", label: "Sự nghiệp", icon: "💼" },
  { key: "tinhDuyen", label: "Tình duyên", icon: "💞" },
  { key: "sucKhoe", label: "Sức khỏe", icon: "💪" },
];

/** Luận giải ngắn cho từng tính chất (quality) của cung. */
const QUALITY_MEANING: Record<string, string> = {
  "Thống lĩnh": "Chủ động, thích khởi xướng và dẫn dắt. Người thuộc nhóm này năng nổ, quyết đoán, luôn muốn bắt đầu điều mới.",
  "Cố định": "Ổn định, kiên trì và bền bỉ. Người thuộc nhóm này giữ vững mục tiêu, đáng tin cậy và khó lung lay.",
  "Linh hoạt": "Thích ứng, linh hoạt và cởi mở. Người thuộc nhóm này dễ thay đổi, dễ hoà nhập và giàu khả năng xoay chuyển.",
};

/** Định dạng độ: `12°30'` (độ + phút cung). */
function formatDeg(deg: number): string {
  if (Number.isNaN(deg) || !Number.isFinite(deg)) return "—";
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}'`;
}

/**
 * Thẻ luận giải chi tiết Chiêm tinh phương Tây — render ĐẦY ĐỦ mọi field của
 * AstrologyResult: Mặt Trời / Mặt Trăng / Cung Mọc / Thiên Đỉnh, danh sách hành
 * tinh, 12 nhà, góc chiếu, nguyên tố & tính chất nổi trội, cùng luận giải chi tiết.
 */
export function AstrologyDetail({ result }: { result: AstrologyResult | null }) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 p-6 text-center">
        <p className="text-sm text-destructive">
          Không tính được bản đồ Chiêm tinh cho hồ sơ này. Vui lòng kiểm tra lại ngày sinh, giờ sinh và nơi sinh.
        </p>
      </div>
    );
  }

  const { sun, moon, ascendant, midheaven, houses, aspects, dominantElement, dominantQuality, interpretations } = result;
  const elementMeta = ELEMENTS[dominantElement as keyof typeof ELEMENTS];

  return (
    <div className="space-y-5">
      {/* ── 1. Bộ ba sáng & góc trời ── */}
      <Section title="Mặt Trời, Mặt Trăng & Góc trời" icon="🌌">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <PlanetCard planet={sun} emphasized />
          <PlanetCard planet={moon} emphasized />
          <AngleCard title="Cung Mọc" subtitle="Ascendant — cách người khác nhìn nhận bạn" angle={ascendant} />
          <MidheavenCard title="Thiên Đỉnh" subtitle="Midheaven — sự nghiệp & mục tiêu cuộc đời" mc={midheaven} />
        </div>
      </Section>

      {/* ── 2. Hành tinh ── */}
      <Section title="Hành tinh" icon="🪐">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.planets.map((p) => (
            <PlanetCard key={p.planetEn} planet={p} />
          ))}
        </div>
      </Section>

      {/* ── 3. Mười hai nhà ── */}
      <Section title="Mười hai nhà" icon="🏛️">
        <HouseGrid houses={houses} />
      </Section>

      {/* ── 4. Góc chiếu (Aspects) ── */}
      <Section title="Góc chiếu giữa các hành tinh" icon="🔗">
        <AspectList aspects={aspects} />
      </Section>

      {/* ── 5. Nguyên tố & Tính chất nổi trội ── */}
      <Section title="Nguyên tố & Tính chất nổi trội" icon="🧭">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <DominanceCard
            title="Nguyên tố nổi trội"
            value={dominantElement}
            hint={elementMeta?.en ?? ""}
            meaning={elementMeta?.meaning ?? ""}
          />
          <DominanceCard
            title="Tính chất nổi trội"
            value={dominantQuality}
            hint={QUALITY_MEANING[dominantQuality] ? "" : ""}
            meaning={QUALITY_MEANING[dominantQuality] ?? ""}
          />
        </div>
      </Section>

      {/* ── 6. Luận giải tổng quan & 4 lĩnh vực ── */}
      <Section title="Luận giải chi tiết" icon="📖">
        <div className="space-y-3">
          <OverviewCard tongQuan={interpretations.tongQuan} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {INTERP_FIELDS.map((f) => (
              <AreaCard key={f.key} icon={f.icon} label={f.label} text={interpretations[f.key]} />
            ))}
          </div>
        </div>
      </Section>

      {/* ── 7. Điểm mạnh, điểm yếu & lời khuyên ── */}
      <Section title="Điểm mạnh, điểm yếu & lời khuyên" icon="🌟">
        <div className="space-y-3">
          <TraitPanel
            title="Điểm mạnh"
            tone="positive"
            items={interpretations.diemManh}
          />
          <TraitPanel
            title="Điểm yếu cần khắc phục"
            tone="negative"
            items={interpretations.diemYeu}
          />
          <AdviceCard loiKhuyen={interpretations.loiKhuyen} />
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

/** Thẻ một hành tinh (Mặt Trời / Mặt Trăng / Sao Thủy…): ký hiệu + cung + độ + nhà + nghịch hành + luận giải. */
function PlanetCard({ planet, emphasized = false }: { planet: PlanetPosition; emphasized?: boolean }) {
  return (
    <article className={`space-y-2 rounded-2xl border border-border p-4 ${emphasized ? "bg-surface-elevated/60" : "bg-card/70"}`}>
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl text-n-gold">
          {planet.symbol}
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{planet.planet}</h4>
          <p className="text-xs text-muted-foreground">{planet.planetEn}</p>
        </div>
        {planet.retrograde ? (
          <span className="ml-auto shrink-0 rounded-full border border-n-rose/40 bg-n-rose/10 px-2 py-0.5 text-xs font-medium text-n-rose">
            Nghịch hành ℞
          </span>
        ) : null}
      </header>

      <p className="text-lg font-bold text-n-gold">
        {planet.sign} <span className="text-sm font-medium text-foreground/80">{formatDeg(planet.degrees)}</span>
      </p>

      <div className="flex flex-wrap gap-1.5 text-xs text-foreground/80">
        <span className="rounded-full bg-glass px-2 py-0.5">Nhà {planet.house}</span>
        {planet.signEn ? (
          <span className="rounded-full bg-glass px-2 py-0.5">{planet.signEn}</span>
        ) : null}
      </div>

      {planet.meaning ? (
        <p className="text-xs leading-relaxed text-foreground/85">{planet.meaning}</p>
      ) : null}
    </article>
  );
}

/** Thẻ cung Mọc (Ascendant): cung + độ + luận giải. */
function AngleCard({ title, subtitle, angle }: { title: string; subtitle: string; angle: Ascendant }) {
  return (
    <article className="space-y-2 rounded-2xl border border-border bg-card/70 p-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <p className="text-lg font-bold text-n-gold">
        {angle.sign} <span className="text-sm font-medium text-foreground/80">{formatDeg(angle.degrees)}</span>
      </p>
      {angle.signEn ? <p className="text-xs text-muted-foreground">{angle.signEn}</p> : null}
      {angle.meaning ? (
        <p className="text-xs leading-relaxed text-foreground/85">{angle.meaning}</p>
      ) : null}
    </article>
  );
}

/** Thẻ Thiên Đỉnh (Midheaven): cung + luận giải. */
function MidheavenCard({ title, subtitle, mc }: { title: string; subtitle: string; mc: Midheaven }) {
  return (
    <article className="space-y-2 rounded-2xl border border-border bg-card/70 p-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <p className="text-lg font-bold text-n-gold">{mc.sign}</p>
      {mc.signEn ? <p className="text-xs text-muted-foreground">{mc.signEn}</p> : null}
      {mc.meaning ? (
        <p className="text-xs leading-relaxed text-foreground/85">{mc.meaning}</p>
      ) : null}
    </article>
  );
}

/** Lưới đủ 12 nhà: số + cung + tên + luận giải. */
function HouseGrid({ houses }: { houses: House[] }) {
  if (houses.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 p-4">
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu 12 nhà.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {houses.map((h) => (
        <div key={h.number} className="space-y-1.5 rounded-xl border border-border bg-card/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-n-purple">
              {h.number}
            </span>
            <span className="truncate text-right text-sm font-medium text-foreground">{h.name}</span>
          </div>
          <p className="text-xs font-semibold text-n-gold">Đỉnh nhà: {h.sign}</p>
          {h.meaning ? (
            <p className="text-xs leading-relaxed text-foreground/80">{h.meaning}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Danh sách góc chiếu: cặp hành tinh + loại + hài hoà/xung khắc + luận giải. */
function AspectList({ aspects }: { aspects: Aspect[] }) {
  if (aspects.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 p-4">
        <p className="text-sm text-muted-foreground">Không ghi nhận góc chiếu đáng kể nào.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {aspects.map((a, i) => (
        <div key={`${a.planet1}-${a.planet2}-${i}`} className="space-y-1.5 rounded-xl border border-border bg-card/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              {a.planet1} — {a.planet2}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                a.harmonious
                  ? "border border-n-green/40 bg-n-green/10 text-n-green"
                  : "border border-n-rose/40 bg-n-rose/10 text-n-rose"
              }`}
            >
              {a.typeVi}
              {a.harmonious ? " · Hài hoà" : " · Thử thách"}
            </span>
          </div>
          {a.meaning ? (
            <p className="text-xs leading-relaxed text-foreground/85">{a.meaning}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Thẻ nguyên tố / tính chất nổi trội: giá trị + luận giải. */
function DominanceCard({
  title,
  value,
  hint,
  meaning,
}: {
  title: string;
  value: string;
  hint?: string;
  meaning?: string;
}) {
  return (
    <article className="space-y-2 rounded-2xl border border-border bg-card/70 p-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-2xl font-bold text-n-gold">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {meaning ? <p className="text-xs leading-relaxed text-foreground/85">{meaning}</p> : null}
    </article>
  );
}

/** Thẻ tổng quan (phần mở đầu luận giải). */
function OverviewCard({ tongQuan }: { tongQuan: string }) {
  return (
    <article className="space-y-2 rounded-2xl border border-border bg-surface-elevated/50 p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span aria-hidden>🔭</span>
        Tổng quan
      </h4>
      {tongQuan ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{tongQuan}</p>
      ) : null}
    </article>
  );
}

/** Thẻ luận giải một lĩnh vực (tính cách / sự nghiệp / tình duyên / sức khỏe). */
function AreaCard({ icon, label, text }: { icon: string; label: string; text: string }) {
  return (
    <article className="space-y-2 rounded-2xl border border-border bg-card/70 p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span aria-hidden>{icon}</span>
        {label}
      </h4>
      {text ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{text}</p>
      ) : null}
    </article>
  );
}

/** Bảng điểm mạnh / điểm yếu (dạng chip). */
function TraitPanel({ title, tone, items }: { title: string; tone: "positive" | "negative"; items: string[] }) {
  const accent = tone === "positive" ? "text-n-green" : "text-n-rose";
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4">
      <p className={`text-xs font-medium ${accent}`}>{title}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">—</li>
        ) : (
          items.map((t) => (
            <li
              key={t}
              className="rounded-full border border-border bg-glass px-2 py-0.5 text-xs text-foreground/90"
            >
              {t}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

/** Thẻ lời khuyên nổi bật. */
function AdviceCard({ loiKhuyen }: { loiKhuyen: string }) {
  if (!loiKhuyen) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated/40 p-4">
      <p className="text-xs font-medium text-n-purple">Lời khuyên</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{loiKhuyen}</p>
    </div>
  );
}