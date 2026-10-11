"use client";
import { useEffect, useState } from "react";
import { KidAvatar } from "@/components/ekid/KidAvatar";
import { KidProgress, type EkidSessionLite } from "@/components/ekid/KidProgress";
import { statusLabel, lessonEmoji, type LessonProgress } from "@/components/ekid/child/types";

interface Kid {
  id: string;
  name: string;
  avatar_emoji?: string | null;
}

interface Badge {
  code: string;
  label: string;
  earned_at: string;
}

interface RewardData {
  total_points: number;
  badges: Badge[];
}

interface LibraryLesson {
  id: string;
  title: string;
  part?: string | null;
  core_topic?: string | null;
  progress: LessonProgress;
}

/** Báo cáo tổng hợp của một bé cho cha/mẹ giám sát. */
interface KidReport {
  kid: Kid;
  totalPoints: number;
  badges: Badge[];
  lessons: LibraryLesson[];
  sessions: EkidSessionLite[];
}

export default function EkidReportPage() {
  const [reports, setReports] = useState<KidReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const kr = await fetch("/api/ekid/kids");
        if (!kr.ok) throw new Error("Không tải được hồ sơ bé");
        const kd = await kr.json();
        const kids = (kd.kids ?? []) as Kid[];

        // Với TỪNG bé: lấy điểm/huy hiệu + thư viện bài (tiến độ) + phiên học gần đây.
        const results = await Promise.all(
          kids.map(async (kid): Promise<KidReport> => {
            const [rw, lib, ses] = await Promise.all([
              fetch(`/api/ekid/rewards?kid_id=${kid.id}`),
              fetch(`/api/ekid/library?kid_id=${kid.id}`),
              fetch(`/api/ekid/session?kid_id=${kid.id}`),
            ]);
            const rewards = rw.ok ? ((await rw.json()) as RewardData) : null;
            const library = lib.ok ? ((await lib.json()) as { lessons?: LibraryLesson[] }) : null;
            const session = ses.ok ? ((await ses.json()) as { sessions?: EkidSessionLite[] }) : null;
            return {
              kid,
              totalPoints: rewards?.total_points ?? 0,
              badges: rewards?.badges ?? [],
              lessons: library?.lessons ?? [],
              sessions: session?.sessions ?? [],
            };
          }),
        );

        setReports(results);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-2 md:p-4 text-sm text-muted-foreground" style={{ background: "#1a0a2e" }}>
        Đang tải...
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 space-y-4" style={{ background: "#1a0a2e" }}>
      <h1 className="text-lg font-semibold text-foreground">Báo cáo học tập của con</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!reports.length && !error && (
        <p className="text-sm text-muted-foreground">
          Chưa có hồ sơ bé nào. Tạo tài khoản cho con tại trang eKid.
        </p>
      )}

      {reports.map(({ kid, totalPoints, badges, lessons, sessions }) => (
        <section key={kid.id} className="rounded-2xl border border-border bg-card/70 p-3 space-y-3">
          <div className="flex items-center gap-3">
            <KidAvatar emoji={kid.avatar_emoji || "🦊"} />
            <div>
              <h2 className="text-base font-semibold text-foreground">{kid.name}</h2>
              <p className="text-sm text-muted-foreground">
                Tổng điểm: <span className="font-semibold text-n-green">{totalPoints}</span>
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground">Huy hiệu</h3>
            {badges.length ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span
                    key={b.code}
                    className="rounded-full border border-border bg-glass px-3 py-1 text-sm text-foreground"
                  >
                    🏅 {b.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có huy hiệu nào.</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground">Danh sách bài học</h3>
            {lessons.length ? (
              <ul className="mt-1 space-y-1.5">
                {lessons.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-glass px-3 py-2 text-sm"
                  >
                    <span className="text-foreground">
                      {lessonEmoji(l)} {l.title}
                    </span>
                    <span className="shrink-0 text-muted-foreground">{statusLabel(l.progress)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có bài học nào.</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground">Buổi học gần đây</h3>
            <div className="mt-1">
              <KidProgress sessions={sessions} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
