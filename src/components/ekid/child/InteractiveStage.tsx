"use client";

// InteractiveStage — sân khấu nội dung tương tác của con (eKid v3.2).
//
// Chỉ hiển thị MỘT nội dung tại một thời điểm (`item` — bài tập/ảnh/video) và TỰ VỪA
// KHUNG theo kích thước màn hình (object-contain + min-h). Nội dung mới THAY NGAY nội
// dung cũ (không lịch sử cuộn). Bài tập GIỮ trạng thái đúng/sai sau khi bé chọn cho tới
// khi có nội dung kế tiếp. Tông SÁNG theo kid-theme (KHÔNG dùng token tối của NOOI).
//
// Bé tương tác xong → `onResolve(itemId, result)` để cha gửi `toolResponse` về model
// và ghi log hội thoại.

import { useCallback, useEffect, useRef, useState } from "react";
import { youtubeVideoId } from "@/lib/ekid/youtube";
import {
  isExerciseItem,
  isMediaItem,
  isNoticeItem,
  type InteractiveItem,
  type NoticeItem,
} from "@/lib/ekid/interactive";

/**
 * Kết quả bé tương tác: chọn một lựa chọn (bài tập) hoặc đã xem xong media.
 * KHÔNG mang `correct` — việc chấm nằm ở MỘT chỗ duy nhất trong `useEkidInteractive`,
 * dùng chung cho cả bấm màn hình lẫn trả lời bằng lời.
 */
export type InteractiveResult = { chosen_index?: number; shown?: true };

interface InteractiveStageProps {
  /** Nội dung đang trình chiếu (null → cha tự hiện trạng thái chờ). */
  item: InteractiveItem | null;
  /**
   * Kết quả ĐÃ ghi nhận cho nội dung đang hiện (bé bấm HOẶC trả lời bằng lời) —
   * do `useEkidInteractive` giữ. Sân khấu chỉ ĐỌC để tô đúng/sai, không tự chấm.
   */
  resolution?: { itemId: string; chosen_index: number } | null;
  /** Gọi MỘT LẦN khi bé tương tác xong với một item (chọn đáp án / nội dung đã hiện). */
  onResolve: (itemId: string, result: InteractiveResult) => void;
}

export function InteractiveStage({ item, resolution, onResolve }: InteractiveStageProps) {
  // Các item đã "chốt" ở phía sân khấu (không cho bấm lại / không báo lại model).
  // Bé trả lời bằng lời cũng khoá nút qua `resolution` (nút `disabled`) và phía hook
  // chặn trùng bằng `already_answered`.
  const resolvedRef = useRef<Set<string>>(new Set());

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
    if (item && isMediaItem(item)) resolve(item.id, { shown: true });
  }, [item, resolve]);

  const choose = useCallback(
    (target: InteractiveItem, index: number) => {
      if (resolvedRef.current.has(target.id)) return;
      resolve(target.id, { chosen_index: index });
    },
    [resolve],
  );

  if (!item) return null;

  // Kết quả chỉ áp cho ĐÚNG item đang hiện (kết quả của item cũ không lây sang).
  const chosenIndex =
    resolution && resolution.itemId === item.id ? resolution.chosen_index : undefined;

  return (
    <section
      aria-label="Nội dung tương tác"
      className="flex min-h-[50vh] w-full flex-1 items-center justify-center"
    >
      <div key={item.id} className="w-full animate-slide-up">
        {isExerciseItem(item) ? (
          <ExerciseCard item={item} chosen={chosenIndex} onChoose={(i) => choose(item, i)} />
        ) : isNoticeItem(item) ? (
          <NoticeCard item={item} />
        ) : (
          <MediaCard item={item} />
        )}
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
    <div className="mx-auto w-full max-w-2xl rounded-2xl border-2 border-[#bae6fd] bg-[#f7fcff] p-4 sm:p-6">
      <p className="mb-3 text-lg font-extrabold text-[#3b2a20] sm:text-xl">
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

/** Khung báo nội dung không xem được — thay cho khung vỡ/trắng. */
function MediaBrokenNotice({ kind }: { kind: "image" | "video" }) {
  return (
    <div className="flex h-full min-h-[40vh] w-full items-center justify-center px-4 text-center">
      <p className="rounded-2xl bg-white/80 px-5 py-4 text-lg font-semibold text-[#6b5648]">
        <span aria-hidden className="mr-1">
          🔎
        </span>
        {kind === "video"
          ? "Video này không xem được. Con thử hỏi thầy/cô AI nội dung khác nhé!"
          : "Ảnh này không xem được. Con thử hỏi thầy/cô AI hình khác nhé!"}
      </p>
    </div>
  );
}

/** Chỉ cho phép scheme http/https — chặn javascript:, data:, vbscript:, file:... */
function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** Thông báo khi URL do AI cung cấp không phải http/https (phòng thủ). */
function UnsafeNotice() {
  return (
    <div className="flex h-full w-full items-center justify-center px-4 text-center text-base font-semibold text-[#6b5648]">
      Không hiển thị được nội dung này.
    </div>
  );
}

// ─── Thẻ thông báo NHẸ (vd: link media không hợp lệ) ──────────────────────────
// Không phải khung lỗi to — chỉ một dòng nhắc nhẹ trong sân khấu, tông sáng.

function NoticeCard({ item }: { item: NoticeItem }) {
  return (
    <div className="flex h-full w-full items-center justify-center px-4 text-center">
      <p className="rounded-2xl bg-white/70 px-5 py-4 text-lg font-semibold text-[#6b5648]">
        <span aria-hidden className="mr-1">🔎</span>
        {item.text}
      </p>
    </div>
  );
}

function MediaCard({ item }: { item: Extract<InteractiveItem, { kind: "media" }> }) {
  // Theo dõi khi CHÍNH TRÌNH DUYỆT không tải được (hotlink, hết hạn, mạng) → báo nhẹ
  // thay vì để khung ảnh/khung video vỡ.
  const [broken, setBroken] = useState(false);

  // Ưu tiên mã video server ĐÃ kiểm chứng nhúng được; không có thì tự suy từ URL.
  const ytId = item.mediaType === "video" ? (item.videoId ?? youtubeVideoId(item.url)) : null;
  const embed = ytId ? `https://www.youtube-nocookie.com/embed/${ytId}` : null;
  // Ảnh đi qua domain mình (proxy) → hết chặn hotlink/mixed content; không có thì link gốc.
  const imgSrc = item.displayUrl ?? item.url;
  const safe = isSafeUrl(item.url);

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[#bae6fd] bg-[#f7fcff]">
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-white/60 p-2 sm:p-3">
        {broken ? (
          <MediaBrokenNotice kind={item.mediaType} />
        ) : item.mediaType === "image" ? (
          safe ? (
            // `loading="eager"`: hiện NGAY khi AI vừa gọi (không trễ như lazy) vì sân khấu
            // chỉ có một nội dung. Ảnh đã qua proxy nên không cần `referrerPolicy`.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={item.caption ?? "Hình minh hoạ"}
              className="max-h-[65vh] w-auto max-w-full object-contain"
              loading="eager"
              decoding="async"
              onError={() => setBroken(true)}
            />
          ) : (
            <UnsafeNotice />
          )
        ) : embed ? (
          <iframe
            src={embed}
            title={item.caption ?? "Video minh hoạ"}
            className="aspect-video w-full max-w-4xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : safe ? (
          <video
            src={item.url}
            controls
            playsInline
            className="max-h-[65vh] w-auto max-w-full object-contain"
            aria-label={item.caption ?? "Video minh hoạ"}
            onError={() => setBroken(true)}
          />
        ) : (
          <UnsafeNotice />
        )}
      </div>
      {item.caption && (
        <p className="px-4 py-3 text-base font-semibold text-[#6b5648]">{item.caption}</p>
      )}
    </div>
  );
}
