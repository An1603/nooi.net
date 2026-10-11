"use client";
import { useCallback, useEffect, useState } from "react";
import { BAND_LABEL, type AgeBand } from "@/lib/ekid/ekid-system";
import { KidProgress, type EkidSessionLite } from "@/components/ekid/KidProgress";
import type { ConsoleKid } from "./types";

/** Bài học + tiến độ trả về từ GET /api/ekid/library?kid_id=. */
type LessonRow = {
  id: string;
  title: string | null;
  part: string | null;
  core_topic: string | null;
  difficulty: number | null;
  locked: boolean;
  progress: { status: string; best_score: number | null; attempts: number };
};

type RewardRow = {
  id: string;
  kind: string;
  code: string | null;
  label: string;
  points: number;
  reason: string | null;
  created_at: string;
};

type BadgeRow = { code: string; label: string; earned_at: string };

const STATUS_LABEL: Record<string, string> = {
  "chua-hoc": "Chưa học",
  "da-hoc": "Đã học",
  "da-thi": "Đã thi",
};

function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

function bandLabel(band?: string | null): string {
  if (!band) return "Chưa định vị";
  return BAND_LABEL[band as AgeBand] ?? band;
}

async function readJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// Gom bài học theo core_topic, giữ thứ tự xuất hiện (server đã sắp theo sort_order/difficulty).
function groupByTopic(lessons: LessonRow[]): { topic: string; items: LessonRow[] }[] {
  const order: string[] = [];
  const map = new Map<string, LessonRow[]>();
  for (const l of lessons) {
    const topic = l.core_topic?.trim() || "Khác";
    if (!map.has(topic)) {
      map.set(topic, []);
      order.push(topic);
    }
    map.get(topic)!.push(l);
  }
  return order.map((topic) => ({ topic, items: map.get(topic)! }));
}

/**
 * Tab Báo cáo của MỘT con: level + lứa; tiến độ từng bài (theo nhóm/chủ đề);
 * thời gian học (đã dùng hôm nay / giới hạn + phiên gần đây); tổng điểm,
 * huy hiệu và hoạt động thưởng gần đây. Tái dùng KidProgress cho danh sách phiên.
 */
export function ReportTab({ kidId, kid }: { kidId: string; kid: ConsoleKid }) {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [sessions, setSessions] = useState<EkidSessionLite[]>([]);
  const [minutesUsed, setMinutesUsed] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [recent, setRecent] = useState<RewardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [libRes, sesRes, rewRes] = await Promise.all([
        fetch(`/api/ekid/library?kid_id=${encodeURIComponent(kidId)}`),
        fetch(`/api/ekid/session?kid_id=${encodeURIComponent(kidId)}`),
        fetch(`/api/ekid/rewards?kid_id=${encodeURIComponent(kidId)}`),
      ]);
      const [lib, ses, rew] = await Promise.all([
        readJson(libRes),
        readJson(sesRes),
        readJson(rewRes),
      ]);
      if (!libRes.ok) throw new Error((lib.error as string) || "Không tải được tiến độ bài học");
      if (!sesRes.ok) throw new Error((ses.error as string) || "Không tải được thời gian học");
      if (!rewRes.ok) throw new Error((rew.error as string) || "Không tải được phần thưởng");

      setLessons((lib.lessons as LessonRow[]) ?? []);
      setSessions((ses.sessions as EkidSessionLite[]) ?? []);
      setMinutesUsed((ses.minutes_used as number) ?? 0);
      setRemaining((ses.remaining as number) ?? null);
      setTotalPoints((rew.total_points as number) ?? 0);
      setBadges((rew.badges as BadgeRow[]) ?? []);
      setRecent((rew.recent as RewardRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  }, [kidId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="p-4 text-muted-foreground">Đang tải báo cáo...</div>;
  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const groups = groupByTopic(lessons);
  const dailyLimit = kid.daily_limit_min ?? null;
  const attempted = lessons.filter((l) => l.progress.attempts > 0).length;
  const passed = lessons.filter((l) => (l.progress.best_score ?? 0) >= 70).length;

  return (
    <div className="space-y-4">
      {/* Level + lứa */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Cấp độ" value={String(kid.placement_level ?? 1)} />
        <Stat label="Lứa tuổi" value={bandLabel(kid.placement_age_band)} />
        <Stat label="Bài đã làm" value={`${attempted}/${lessons.length}`} />
        <Stat label="Bài đạt (≥70%)" value={String(passed)} />
      </section>

      {/* Thời gian học */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
        <h2 className="text-sm font-semibold text-foreground">Thời gian học hôm nay</h2>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-foreground">
            Đã dùng: <b className="font-semibold">{minutesUsed ?? 0} phút</b>
          </span>
          <span className="text-muted-foreground">
            Giới hạn: {dailyLimit != null ? `${dailyLimit} phút` : "không giới hạn"}
          </span>
          {remaining != null && dailyLimit != null && (
            <span className={remaining > 0 ? "text-n-green" : "text-destructive"}>
              Còn lại: {remaining} phút
            </span>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Phiên học gần đây
          </h3>
          <KidProgress sessions={sessions.slice(0, 10)} />
        </div>
      </section>

      {/* Tiến độ từng bài, gom theo nhóm/chủ đề */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
        <h2 className="text-sm font-semibold text-foreground">Tiến độ bài học</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có bài học nào cho lứa tuổi của con.</p>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.topic} className="space-y-1">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">{g.topic}</h3>
                <ul className="space-y-1">
                  {g.items.map((l) => (
                    <li
                      key={l.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-glass px-3 py-2 text-sm text-foreground"
                    >
                      <span className="flex items-center gap-2">
                        {l.locked && <span title="Chưa mở khoá">🔒</span>}
                        <span>{l.title || "Bài học"}</span>
                      </span>
                      <span className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{statusLabel(l.progress.status)}</span>
                        <span>
                          Điểm cao nhất:{" "}
                          {l.progress.best_score != null ? `${l.progress.best_score}%` : "—"}
                        </span>
                        <span>{l.progress.attempts} lần thi</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tổng điểm + huy hiệu */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Điểm &amp; huy hiệu</h2>
          <span className="text-sm text-foreground">
            Tổng điểm: <b className="font-semibold text-primary">{totalPoints ?? 0}</b>
          </span>
        </div>
        {badges.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có huy hiệu nào.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <li
                key={b.code}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-glass px-3 py-1 text-xs text-foreground"
                title={new Date(b.earned_at).toLocaleDateString("vi-VN")}
              >
                🏅 {b.label}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Hoạt động gần đây */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
        <h2 className="text-sm font-semibold text-foreground">Hoạt động gần đây</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có hoạt động thưởng nào.</p>
        ) : (
          <ul className="space-y-1">
            {recent.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-glass px-3 py-2 text-sm text-foreground"
              >
                <span>{r.label}</span>
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {r.kind === "diem" ? `+${r.points} điểm` : "Huy hiệu"}
                  </span>
                  <span>{new Date(r.created_at).toLocaleDateString("vi-VN")}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Ô số liệu nhỏ (nhãn + giá trị) theo tông màu NOOI. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
