"use client";
import { useCallback, useEffect, useState } from "react";
import type { NumerologyResult } from "@/lib/numerology";
import type { TuViResult } from "@/lib/tuvi";
import type { AstrologyResult } from "@/lib/astrology";

/** Payload GET /api/ekid/kids/[kidId]/destiny. */
interface DestinyData {
  kid: {
    name: string;
    date_of_birth: string | null;
    birth_time: string | null;
    gender: string | null;
    birth_place: string | null;
  };
  missing: {
    gio_sinh: boolean;
    noi_sinh: boolean;
  };
  numerology: NumerologyResult | null;
  tuvi: TuViResult | null;
  astrology: AstrologyResult | null;
}

async function readJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Tab Bản đồ số mệnh của MỘT con: hiển thị 3 thẻ tóm tắt bằng tiếng Việt —
 * Thần số học / Tử vi / Chiêm tinh phương Tây. Mỗi bản đồ được tính độc lập nên
 * một bản đồ lỗi (null) không chặn hai bản đồ còn lại. Khi hồ sơ chưa có giờ
 * sinh / nơi sinh, thẻ hiển thị cảnh báo nhẹ và gợi ý bổ sung ở tab Tài khoản.
 */
export function DestinyTab({ kidId }: { kidId: string }) {
  const [data, setData] = useState<DestinyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch(`/api/ekid/kids/${encodeURIComponent(kidId)}/destiny`);
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Không tải được bản đồ số mệnh");
      setData(d as unknown as DestinyData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi khi tải bản đồ số mệnh");
    } finally {
      setLoading(false);
    }
  }, [kidId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="p-4 text-muted-foreground">Đang tính bản đồ số mệnh...</div>;
  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 p-6 text-center">
        <p className="text-sm text-destructive">{error ?? "Không tải được bản đồ số mệnh."}</p>
      </div>
    );
  }

  const { missing } = data;

  return (
    <div className="space-y-4">
      {/* Cảnh báo thiếu dữ liệu sinh để bản đồ chính xác */}
      {(missing.gio_sinh || missing.noi_sinh) && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
          <p className="font-medium text-amber-600">Bản đồ có thể chưa chính xác.</p>
          <p className="mt-0.5 text-muted-foreground">
            {missing.gio_sinh && missing.noi_sinh
              ? "Hồ sơ đang thiếu giờ sinh và nơi sinh."
              : missing.gio_sinh
                ? "Hồ sơ đang thiếu giờ sinh."
                : "Hồ sơ đang thiếu nơi sinh."}{" "}
            Bổ sung giờ sinh/nơi sinh ở tab Tài khoản để bản đồ chính xác hơn.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <NumerologyCard result={data.numerology} />
        <TuViCard result={data.tuvi} />
        <AstrologyCard result={data.astrology} />
      </div>
    </div>
  );
}

/** Ô khung thẻ dùng chung cho cả 3 bản đồ. */
function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span aria-hidden>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Một dòng nhãn + giá trị trong thẻ tóm tắt. */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

/** Thông báo khi một bản đồ không tính được (null). */
function MapError({ what }: { what: string }) {
  return (
    <p className="text-sm text-destructive">
      Không tính được {what} cho hồ sơ này. Vui lòng kiểm tra lại ngày sinh / giờ sinh.
    </p>
  );
}

/** Thần số học Pythagoras: số chủ đạo, số mệnh, linh hồn, tính cách, ngày sinh. */
function NumerologyCard({ result }: { result: NumerologyResult | null }) {
  if (!result) return <Card title="Thần số học" icon="🔢"><MapError what="bản đồ Thần số học" /></Card>;

  return (
    <Card title="Thần số học" icon="🔢">
      <Row label="Số chủ đạo (đường đời)" value={<b>{result.lifePath.value} — {result.lifePath.name}</b>} />
      <Row label="Số mệnh" value={`${result.destiny.value} — ${result.destiny.name}`} />
      <Row label="Số linh hồn" value={`${result.soulUrge.value} — ${result.soulUrge.name}`} />
      <Row label="Số tính cách" value={`${result.personality.value} — ${result.personality.name}`} />
      <Row label="Số ngày sinh" value={`${result.birthDay.value} — ${result.birthDay.name}`} />
      <p className="text-xs leading-relaxed text-muted-foreground">{result.lifePath.meaning}</p>
    </Card>
  );
}

/** Tử Vi phương Đông: bản mệnh, cục, cung Mệnh/Thân, thân chủ. */
function TuViCard({ result }: { result: TuViResult | null }) {
  if (!result) return <Card title="Tử vi" icon="☯️"><MapError what="bản đồ Tử vi" /></Card>;

  return (
    <Card title="Tử vi" icon="☯️">
      <Row label="Mệnh ngũ hành" value={<b>{result.banMenh.napAm}</b>} />
      <Row label="Cục" value={`${result.cuc.name} (${result.cuc.hanh})`} />
      <Row label="Cung Mệnh" value={result.cungMenh.name} />
      <Row label="Cung Thân" value={result.cungThan.name} />
      <Row label="Thân chủ (Can ngày)" value={result.thanChu.name} />
      <p className="text-xs leading-relaxed text-muted-foreground">{result.banMenh.meaning}</p>
    </Card>
  );
}

/** Chiêm tinh phương Tây: Mặt Trời, Mặt Trăng, Mọc, Thiên Đỉnh, yếu tố. */
function AstrologyCard({ result }: { result: AstrologyResult | null }) {
  if (!result) return <Card title="Chiêm tinh" icon="🌌"><MapError what="bản đồ Chiêm tinh" /></Card>;

  return (
    <Card title="Chiêm tinh" icon="🌌">
      <Row label="Cung Mặt Trời" value={<b>{result.sun.sign} ({result.sunSign})</b>} />
      <Row label="Cung Mặt Trăng" value={`${result.moon.sign} (${result.moonSign})`} />
      <Row label="Cung Mọc" value={`${result.ascendant.sign} (${result.risingSign})`} />
      <Row label="Thiên Đỉnh" value={result.midheaven.sign} />
      <Row label="Yếu tố chủ đạo" value={result.dominantElement} />
      <Row label="Phẩm chất" value={result.dominantQuality} />
      <p className="text-xs leading-relaxed text-muted-foreground">{result.interpretations.tongQuan}</p>
    </Card>
  );
}