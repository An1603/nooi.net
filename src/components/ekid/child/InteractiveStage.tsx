"use client";

// InteractiveStage — sân khấu nội dung tương tác của con (eKid v3.1).
//
// AI (qua Gemini Live function calling) chủ động đẩy bài tập / ảnh / video lên đây
// ĐỒNG THỜI với hội thoại. Bé có thể chạm chọn đáp án ngay trong lúc vẫn đang nói.
// Thẻ MỚI NHẤT được làm nổi bật (viền + bóng); các thẻ cũ giữ lại trong lịch sử cuộn.
// Tông SÁNG theo kid-theme (KHÔNG dùng token tối của NOOI).
//
// Bé tương tác xong → `onResolve(itemId, result)` để cha gửi `toolResponse` về model
// và ghi log hội thoại.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KID } from "@/components/ekid/child/kid-theme";
import {
  isExerciseItem,
  isMediaItem,
  type ExerciseResult,
  type InteractiveItem,
  type MediaResult,
} from "@/lib/ekid/interactive";

export type InteractiveResult = ExerciseResult | MediaResult;

interface InteractiveStageProps {
  items: InteractiveItem[];
  /** Gọi MỘT LẦN khi bé tương tác xong với một item (chọn đáp án / nội dung đã hiện). */
  onResolve: (itemId: string, result: InteractiveResult) => void;
}

export function InteractiveStage({ items, onResolve }: InteractiveStageProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Đáp án bé đã chọn cho từng thẻ bài tập (itemId → index).
  const [chosen, setChosen] = useState<Record<string, number>>({});
  // Thẻ đã "chốt" (không cho chọn lại / không báo lại cho model).
  const resolvedRef = useRef<Set<string>>(new Set());

  // Tự cuộn xuống thẻ mới nhất mỗi khi có nội dung mới.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items.length]);

  const resolve = useCallback(
    (id: string, result: InteractiveResult) => {
      if (resolvedRef.current.has(id)) return;
      resolvedRef.current.add(id);
      onResolve(id, result);
    },
    [onResolve],
  );

  // Media coi như "đã hiện" ngay khi render → báo một lần cho model.
  useEffect(() => {
    for (const item of items) {
      if (isMediaItem(item)) resolve(item.id, { shown: true });
    }
  }, [items, resolve]);

  const choose = useCallback(
    (item: InteractiveItem, index: number) => {
      if (resolvedRef.current.has(item.id)) return;
      const answerIndex = isExerciseItem(item) ? item.answerIndex : undefined;
      const result: ExerciseResult =
        typeof answerIndex === "number"
          ? { chosen_index: index, correct: index === answerIndex }
          : { chosen_index: index };
      setChosen((prev) => ({ ...prev, [item.id]: index }));
      resolve(item.id, result);
    },
    [resolve],
  );

  if (items.length === 0) return null;

  const lastId = items[items.length - 1]?.id;

  return (
    <section
      aria-label="Nội dung tương tác"
      className={`${KID.cardPad} flex flex-col gap-3`}
    >
      <div ref={scrollRef} className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto no-scrollbar">
        {items.map((item) => (
          <div
            key={item.id}
            className={
              item.id === lastId
                ? "animate-slide-up rounded-2xl ring-4 ring-[#ffd93d] ring-offset-2 ring-offset-white"
                : "opacity-90"
            }
          >
            {isExerciseItem(item) ? (
              <ExerciseCard item={item} chosen={chosen[item.id]} onChoose={(i) => choose(item, i)} />
            ) : (
              <MediaCard item={item} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Thẻ bài tập trắc nghiệm ──────────────────────────────────────────────────

function ExerciseCard({
  item,
  chosen,
  onChoose,
}: {
  item: Extract<InteractiveItem, { kind: "exercise" }>;
  chosen: number | undefined;
  onChoose: (index: number) => void;
}) {
  const answered = typeof chosen === "number";
  const hasAnswer = typeof item.answerIndex === "number";

  return (
    <div className="rounded-2xl border-2 border-[#bae6fd] bg-[#f7fcff] p-4">
      <p className="mb-3 text-lg font-extrabold text-[#3b2a20]">
        <span aria-hidden className="mr-1">📝</span>
        {item.question}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {item.options.map((opt, i) => {
          const isChosen = chosen === i;
          const isCorrect = hasAnswer && item.answerIndex === i;
          // Sau khi trả lời: tô xanh đáp án đúng; tô đỏ lựa chọn sai của bé.
          let cls =
            "min-h-[52px] rounded-2xl border-2 border-[#c7e8ff] bg-white px-4 py-3 text-left text-lg font-bold text-[#3b2a20] transition-transform hover:scale-[1.02] active:scale-95";
          if (answered) {
            if (hasAnswer) {
              if (isCorrect) cls =
                "min-h-[52px] rounded-2xl border-2 border-[#16a34a] bg-[#dcfce7] px-4 py-3 text-left text-lg font-bold text-[#166534]";
              else if (isChosen) cls =
                "min-h-[52px] rounded-2xl border-2 border-[#ef4444] bg-[#fee2e2] px-4 py-3 text-left text-lg font-bold text-[#991b1b]";
              else cls =
                "min-h-[52px] rounded-2xl border-2 border-[#e5e7eb] bg-white px-4 py-3 text-left text-lg font-bold text-[#9c8b7e] opacity-70";
            } else if (isChosen) {
              cls =
                "min-h-[52px] rounded-2xl border-2 border-[#4ecdc4] bg-[#e6fffb] px-4 py-3 text-left text-lg font-bold text-[#0d9488]";
            }
          }
          return (
            <button key={i} type="button" className={cls} disabled={answered} onClick={() => onChoose(i)}>
              <span aria-hidden className="mr-2">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && hasAnswer && (
        <p className="mt-3 text-base font-extrabold" role="status">
          {chosen === item.answerIndex ? (
            <span className="text-[#16a34a]">🎉 Đúng rồi, giỏi quá!</span>
          ) : (
            <span className="text-[#ef4444]">
              Gần đúng rồi — đáp án đúng là {String.fromCharCode(65 + (item.answerIndex ?? 0))}. Thử lại nhé! 💪
            </span>
          )}
        </p>
      )}
      {answered && !hasAnswer && (
        <p className="mt-3 text-base font-extrabold text-[#0d9488]" role="status">
          Đã ghi nhận câu trả lời của con. 👍
        </p>
      )}
    </div>
  );
}

// ─── Thẻ media (ảnh / video) ──────────────────────────────────────────────────

function youtubeEmbedUrl(url: string): string | null {
  // Hỗ trợ youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>, /shorts/<id>.
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const m = u.pathname.match(/^\/(embed|shorts|v)\/([^/]+)/);
      if (m) return `https://www.youtube.com/embed/${m[2]}`;
    }
    return null;
  } catch {
    return null;
  }
}

function MediaCard({ item }: { item: Extract<InteractiveItem, { kind: "media" }> }) {
  const embed = item.mediaType === "video" ? youtubeEmbedUrl(item.url) : null;

  const container = useMemo(
    () => "overflow-hidden rounded-2xl border-2 border-[#bae6fd] bg-[#f7fcff]",
    [],
  );

  return (
    <div className={container}>
      <div className="aspect-video w-full bg-white">
        {item.mediaType === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.caption ?? "Hình minh hoạ"}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : embed ? (
          <iframe
            src={embed}
            title={item.caption ?? "Video minh hoạ"}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={item.url}
            controls
            playsInline
            className="h-full w-full"
            aria-label={item.caption ?? "Video minh hoạ"}
          />
        )}
      </div>
      {item.caption && (
        <p className="px-4 py-3 text-base font-semibold text-[#6b5648]">{item.caption}</p>
      )}
    </div>
  );
}
