"use client";
import { useCallback, useEffect, useState } from "react";
import type { NumerologyResult } from "@/lib/numerology";
import type { TuViResult } from "@/lib/tuvi";
import type { AstrologyResult } from "@/lib/astrology";
import { NumerologyDetail } from "./destiny/NumerologyDetail";
import { TuViDetail } from "./destiny/TuViDetail";
import { AstrologyDetail } from "./destiny/AstrologyDetail";

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

/** Ba bản đồ con bên trong tab Bản đồ số mệnh. */
type DestinySubTab = "numerology" | "tuvi" | "astrology";

const SUB_TABS: { key: DestinySubTab; label: string; icon: string }[] = [
  { key: "numerology", label: "Thần số học", icon: "🔢" },
  { key: "tuvi", label: "Tử vi", icon: "☯️" },
  { key: "astrology", label: "Chiêm tinh", icon: "🌌" },
];

async function readJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Tab Bản đồ số mệnh của MỘT con: header 3 sub-tab (Thần số học / Tử vi / Chiêm tinh),
 * fetch destiny MỘT lần rồi phân phát cho sub-component theo tab đang mở. Mỗi bản đồ
 * được tính độc lập nên một bản đồ lỗi (null) không chặn hai bản đồ còn lại. Khi hồ sơ
 * chưa có giờ sinh / nơi sinh, hiển thị cảnh báo nhẹ và gợi ý bổ sung ở tab Tài khoản.
 */
export function DestinyTab({ kidId }: { kidId: string }) {
  const [data, setData] = useState<DestinyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<DestinySubTab>("numerology");

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

      {/* Header 3 sub-tab */}
      <nav className="flex flex-wrap gap-2">
        {SUB_TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              aria-pressed={isActive}
              className={
                isActive
                  ? "rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                  : "rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              }
            >
              <span aria-hidden className="mr-1.5">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Nội dung sub-tab */}
      {active === "numerology" ? (
        <NumerologyDetail result={data.numerology} />
      ) : active === "tuvi" ? (
        <TuViDetail result={data.tuvi} />
      ) : (
        <AstrologyDetail result={data.astrology} />
      )}
    </div>
  );
}