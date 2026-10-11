"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { KidAvatar } from "@/components/ekid/KidAvatar";
import { BAND_LABEL, type AgeBand } from "@/lib/ekid/ekid-system";
import { AccountTab } from "./AccountTab";
import { CONSOLE_TABS, TAB_LABEL, type ConsoleTab, type KidDetail, type ConsoleKid } from "./types";

/** Nhãn lứa tuổi từ placement_age_band. */
function bandLabel(band?: string | null): string {
  if (!band) return "Chưa định vị";
  return BAND_LABEL[band as AgeBand] ?? band;
}

/** Khung placeholder cho các tab sẽ hoàn thiện ở bước sau. */
function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </section>
  );
}

/** Thông báo lỗi truy cập (401/403/404/khác) kèm hành động phù hợp. */
function AccessError({ status, message }: { status: number | null; message: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-6 text-center space-y-3">
      <p className="text-sm text-destructive">{message}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/app/ekid"
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          ← Về danh sách con
        </Link>
        {status === 401 && (
          <Link
            href="/login"
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Console của một con: tải chi tiết hồ sơ, hiện header + 4 tab (Tài khoản / Người thân /
 * Báo cáo / Cài đặt). Tab hiện tại do server truyền xuống qua query `?tab=`.
 */
export function KidConsole({ kidId, tab }: { kidId: string; tab: ConsoleTab }) {
  const [detail, setDetail] = useState<KidDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/ekid/kids/${kidId}`);
      if (!r.ok) {
        const d = (await r.json().catch(() => ({}))) as { error?: string };
        setErrorStatus(r.status);
        setError(
          r.status === 401
            ? "Bạn cần đăng nhập để xem hồ sơ này."
            : r.status === 403
              ? "Bạn không có quyền truy cập hồ sơ này."
              : r.status === 404
                ? "Không tìm thấy hồ sơ của con."
                : d.error || "Không tải được hồ sơ của con.",
        );
        return;
      }
      const d = (await r.json()) as KidDetail;
      setDetail(d);
    } catch {
      setErrorStatus(null);
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [kidId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="p-4 text-muted-foreground">Đang tải hồ sơ của con...</div>;
  if (error || !detail) return <AccessError status={errorStatus} message={error ?? "Không tải được hồ sơ của con."} />;

  const kid: ConsoleKid = detail.kid;
  const locked = kid.status === "khoa";

  return (
    <div className="p-2 md:p-4 space-y-4" style={{ background: "#1a0a2e" }}>
      <Link href="/app/ekid" className="inline-flex text-sm text-muted-foreground hover:text-foreground">
        ← Danh sách con
      </Link>

      {/* Header: avatar + tên + lứa + trạng thái + badge level */}
      <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/70 p-3">
        <KidAvatar emoji={kid.avatar_emoji || "🦊"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">{kid.name}</h1>
            <span className="inline-flex items-center rounded-full border border-border bg-glass px-2 py-0.5 text-xs text-foreground">
              Cấp {kid.placement_level ?? 1}
            </span>
            <span
              className={
                locked
                  ? "inline-flex items-center rounded-full border border-destructive/50 bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                  : "inline-flex items-center rounded-full border border-border bg-glass px-2 py-0.5 text-xs text-n-green"
              }
            >
              {locked ? "🔒 Đang khoá" : "✅ Hoạt động"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {bandLabel(kid.placement_age_band)}
            {kid.username ? <> · @{kid.username}</> : null}
          </p>
        </div>
      </header>

      {/* Điều hướng 4 tab (link ?tab=) */}
      <nav className="flex flex-wrap gap-2">
        {CONSOLE_TABS.map((t) => {
          const active = t === tab;
          return (
            <Link
              key={t}
              href={`/app/ekid/${kidId}?tab=${t}`}
              className={
                active
                  ? "rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                  : "rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              }
            >
              {TAB_LABEL[t]}
            </Link>
          );
        })}
      </nav>

      {/* Nội dung tab */}
      {tab === "account" ? (
        <AccountTab kid={kid} isOwner={detail.is_owner} onChanged={load} />
      ) : tab === "relatives" ? (
        <Placeholder title="Người thân" note="Danh sách người theo dõi và quản lý lời mời sẽ có ở bước tiếp theo." />
      ) : tab === "report" ? (
        <Placeholder title="Báo cáo" note="Tiến độ học, thời gian học và phần thưởng sẽ có ở bước tiếp theo." />
      ) : (
        <Placeholder title="Cài đặt" note="Nguyên tắc học, môn học và phần thưởng sẽ có ở bước tiếp theo." />
      )}
    </div>
  );
}
