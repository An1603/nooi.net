"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EkidVoiceSession } from "@/components/ekid/EkidVoiceSession";
import type { EkidKidLite, EkidLessonLite } from "@/components/ekid/EkidVoiceSession";
import type { LibraryKid } from "@/components/ekid/child/types";
import { KID } from "@/components/ekid/child/kid-theme";
import type { AgeBand } from "@/lib/ekid/ekid-system";

// Bài học đầy đủ trả từ /api/ekid/lessons (kèm video_url dùng để phát hướng dẫn).
type FullLesson = EkidLessonLite & { video_url?: string | null };

async function readJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Chuyển URL YouTube (watch/short/embed) sang URL nhúng iframe; null nếu không phải YouTube. */
function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/embed/")[1];
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/shorts/")[1];
    }
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

/**
 * Trang học của bé — video hướng dẫn (nếu có) + phiên luyện giọng nói với AI,
 * cùng nút chuyển sang bài thi.
 */
export default function EkidLessonPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;

  const [kid, setKid] = useState<EkidKidLite | null>(null);
  const [lesson, setLesson] = useState<FullLesson | null>(null);
  const [remaining, setRemaining] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Hồ sơ bé (không truyền kid_id — server tự suy ra từ tài khoản con).
      const lr = await fetch("/api/ekid/library");
      const ld = await readJson(lr);
      if (!lr.ok) throw new Error((ld.error as string) || "Không tải được hồ sơ bé");
      const libKid = (ld.kid as LibraryKid) ?? null;
      if (!libKid) throw new Error("Không tìm thấy hồ sơ bé");

      const kidLite: EkidKidLite = {
        id: libKid.id,
        name: libKid.name,
        favorite_voice: libKid.favorite_voice ?? null,
        placement_age_band: (libKid.placement_age_band as AgeBand | null) ?? null,
        placement_level: libKid.placement_level ?? null,
        avatar_emoji: libKid.avatar_emoji ?? null,
        daily_limit_min: libKid.daily_limit_min ?? null,
      };
      setKid(kidLite);

      // 2) Chi tiết bài học (đầy đủ, phục vụ phiên luyện giọng nói).
      const er = await fetch(`/api/ekid/lessons?band=${encodeURIComponent(libKid.placement_age_band ?? "")}`);
      const ed = await readJson(er);
      if (!er.ok) throw new Error((ed.error as string) || "Không tải được bài học");
      const all = (ed.lessons as FullLesson[]) ?? [];
      const found = all.find((l) => l.id === lessonId) ?? null;
      if (!found) throw new Error("Không tìm thấy bài học");
      setLesson(found);

      // 3) Số phút còn lại hôm nay của bé.
      const sr = await fetch(`/api/ekid/session?kid_id=${encodeURIComponent(libKid.id)}`);
      const sd = await readJson(sr);
      if (sr.ok && typeof sd.remaining === "number") {
        setRemaining(sd.remaining);
      } else {
        setRemaining(kidLite.daily_limit_min ?? 30);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi khi tải bài học");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <p className="py-10 text-center text-xl font-bold text-[#3b2a20]">
        Đang mở bài học...
      </p>
    );
  }

  if (error || !kid || !lesson) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border-2 border-[#ff7a59]/50 bg-white/85 p-6 text-center shadow-lg shadow-sky-200/60">
        <p className="text-xl font-bold text-[#e15a3a]">
          {error ?? "Không tìm thấy bài học"}
        </p>
        <Link href="/ekid" className={`mt-4 ${KID.btnPrimary}`}>
          ⬅ Về thư viện
        </Link>
      </div>
    );
  }

  const videoUrl = lesson.video_url ?? null;
  const embed = videoUrl ? toYouTubeEmbed(videoUrl) : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={KID.h1}>{lesson.core_topic}</h1>
        <Link href="/ekid" className={KID.btnGhost}>
          ⬅ Thư viện
        </Link>
      </div>

      {videoUrl ? (
        <div className="overflow-hidden rounded-3xl border-2 border-[#bae6fd] bg-white/85 shadow-lg shadow-sky-200/50">
          <div className="aspect-video w-full">
            <iframe
              src={embed ?? videoUrl}
              title={lesson.core_topic}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>
      ) : null}

      <EkidVoiceSession kid={kid} lesson={lesson} remaining={remaining} />

      <Link href={`/ekid/thi/${lessonId}`} className={`self-center ${KID.btnHero}`}>
        Làm bài thi →
      </Link>
    </div>
  );
}
