"use client";

// useEkidInteractive — gom logic lớp tương tác eKid dùng CHUNG cho EkidTalkScreen
// (trang chủ con) và EkidVoiceSession (trong bài học):
//   - Nhận `tool_call` từ Gemini Live → tạo item (bài tập/ảnh/video) + render.
//   - Mỗi tool call THAY THẾ nội dung đang hiện (sân khấu chỉ có 1 nội dung: `current`).
//   - Khi bé tương tác xong → gọi `respond([...])` trả kết quả về model.
//   - Ghi MỖI tool call + kết quả vào LOG hội thoại theo thứ tự (trộn chung lượt BÉ/AI
//     để lưu vào `ekid_sessions.transcript`/memory) — log vẫn ĐẦY ĐỦ dù stage chỉ 1 item.
//
// FALLBACK: nếu model Live không hỗ trợ function calling thì đơn giản KHÔNG có
// `tool_call` nào được phát ra — stage rỗng, toàn bộ code vẫn build sạch và buổi
// trò chuyện diễn ra bình thường (không cần nhánh code thừa).

import { useCallback, useEffect, useRef, useState } from "react";
import type { OnToolCall, VoiceStatus, VoiceTurn } from "@/components/voice/useVoiceAssistant";
import type { ToolFunctionCall, ToolFunctionResponse } from "@/lib/voice/gemini-live";
import {
  answerNudge,
  describeAnswer,
  EKID_MEDIA_VIEW_ENABLED,
  exerciseShownInstruction,
  gradeExercise,
  isExerciseItem,
  overlapsQuestion,
  parseSpokenAnswer,
  proxiedMediaUrl,
  type AnswerSource,
  type ExerciseItem,
  type ExerciseResult,
  type InteractiveItem,
  type MediaItem,
} from "@/lib/ekid/interactive";

// Độ trễ "im lặng" trước khi ép AI đọc bài mới: đủ để AI nói hết câu tổng kết và
// không chen vào đầu lượt kế tiếp, đủ ngắn để bé không phải chờ.
const ANNOUNCE_QUIET_MS = 800;

/** Sự kiện lớp tương tác (gọi công cụ / kết quả bé tương tác) — lưu vào log. */
export interface ToolLogMeta {
  event: "call" | "result";
  tool: string;
  item_id: string;
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
  /** Bé trả lời bằng cách nào (chỉ có ở sự kiện `result` của bài tập). */
  source?: AnswerSource;
  /** Nguyên văn lời bé nói (chỉ khi trả lời bằng lời). */
  spoken?: string;
}

/**
 * Kết quả đã ghi nhận cho nội dung ĐANG hiện — nguồn DUY NHẤT cho cả 2 đường
 * (bé bấm trên màn hình `tap` hoặc trả lời bằng lời `voice`).
 */
export interface ExerciseResolution extends ExerciseResult {
  itemId: string;
}

/** Một lượt trong log mở rộng: lượt hội thoại (BÉ/AI) hoặc sự kiện công cụ. */
export type EkidLogTurn =
  | VoiceTurn
  | { role: "tool"; text: string; meta: ToolLogMeta };

// ─── Trích xuất an toàn từ `args` của tool call ───────────────────────────────

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim() !== "");
}

function asIntOrUndef(v: unknown): number | undefined {
  return typeof v === "number" && Number.isInteger(v) ? v : undefined;
}

/** Phản hồi của `GET /api/ekid/media/find`. */
interface FoundMediaResponse {
  ok?: unknown;
  url?: unknown;
  videoId?: unknown;
  title?: unknown;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface EkidInteractiveController {
  /** Nội dung ĐANG hiển thị trên sân khấu (mỗi tool call THAY THẾ nội dung cũ). */
  current: InteractiveItem | null;
  /** Truyền vào `VoiceAssistant onToolCall`. */
  onToolCall: OnToolCall;
  /** Truyền vào `VoiceAssistant onTurnsChange` — gom lượt BÉ/AI vào log. */
  onTurnsChange: (turns: VoiceTurn[]) => void;
  /**
   * Kết quả ĐÃ ghi nhận cho nội dung đang hiện (đúng/sai + bé trả lời bằng cách nào).
   * Có cùng lúc với cả 2 đường: bé bấm trên màn hình hoặc trả lời bằng lời.
   */
  resolution: ExerciseResolution | null;
  /**
   * Xử lý khi bé BẤM trên màn hình (bài tập) hoặc media đã hiện xong
   * → trả kết quả về model + ghi log. Đường trả lời bằng lời đi qua công cụ
   * `answer_exercise` và ghi nhận vào CÙNG một chỗ.
   */
  onResolve: (itemId: string, result: { chosen_index?: number; shown?: true }) => void;
  /** Log hội thoại đầy đủ (BÉ/AI + sự kiện công cụ) để lưu vào session/memory. */
  getLog: () => EkidLogTurn[];
  /**
   * Truyền vào `VoiceAssistant onUserSpeech` — lưới an toàn tự chấm khi bé nói
   * đáp án mà model không gọi `answer_exercise`.
   */
  onUserSpeech: (text: string) => void;
}

export function useEkidInteractive(
  kidId?: string,
  opts?: {
    /** Gửi một lượt văn bản vào phiên Live (ép AI đọc đúng nội dung vừa hiện). */
    speak?: (text: string) => void;
    /**
     * Trạng thái phiên giọng nói. Dùng để KHÔNG cắt lời AI đang nói: khi AI đang
     * tổng kết câu trả lời, việc chuyển bài chỉ hiện thẻ, còn lời đọc bài mới được
     * gửi sau khi AI nói xong.
     */
    status?: VoiceStatus | null;
  },
): EkidInteractiveController {
  const [current, setCurrent] = useState<InteractiveItem | null>(null);
  // Kết quả đã ghi nhận cho nội dung đang hiện (bé bấm HOẶC trả lời bằng lời).
  const [resolution, setResolution] = useState<ExerciseResolution | null>(null);

  const currentRef = useRef<InteractiveItem | null>(null);
  const resolutionRef = useRef<ExerciseResolution | null>(null);
  const logRef = useRef<EkidLogTurn[]>([]);
  const convLenRef = useRef(0); // số lượt BÉ/AI đã nạp vào log
  const seqRef = useRef(0); // sinh id item tăng dần

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const pushLog = useCallback((turn: EkidLogTurn) => {
    logRef.current = [...logRef.current, turn];
  }, []);

  // Giữ hàm speak mới nhất (không đưa vào deps của onToolCall).
  const speakRef = useRef<((text: string) => void) | null>(null);
  useEffect(() => {
    speakRef.current = opts?.speak ?? null;
  }, [opts?.speak]);

  // ── Hàng đợi "đọc bài mới" — KHÔNG cắt lời AI đang nói ─────────────────────
  // Thẻ bài hiện NGAY (bé thấy ngay), nhưng lượt văn bản ép AI đọc chỉ gửi khi:
  //   - AI đã nói xong lượt hiện tại (status ≠ speaking), VÀ
  //   - im lặng thêm một nhịp ngắn (tránh gửi chen vào đầu lượt kế tiếp).
  // Nếu model tự đọc bài mới luôn thì nhịp im lặng này giữ client không đọc lặp.
  const statusRef = useRef<VoiceStatus | null>(opts?.status ?? null);
  const pendingAnnounceRef = useRef<string | null>(null);
  const pendingQuestionRef = useRef<string | null>(null);
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAnnounceTimer = useCallback(() => {
    if (announceTimerRef.current) {
      clearTimeout(announceTimerRef.current);
      announceTimerRef.current = null;
    }
  }, []);

  const flushAnnounce = useCallback(() => {
    clearAnnounceTimer();
    const text = pendingAnnounceRef.current;
    if (!text) return;
    if (statusRef.current === "speaking") return; // AI đang nói → để effect sau xử lý
    pendingAnnounceRef.current = null;
    pendingQuestionRef.current = null;
    speakRef.current?.(text);
  }, [clearAnnounceTimer]);

  const scheduleAnnounce = useCallback(() => {
    clearAnnounceTimer();
    if (!pendingAnnounceRef.current || statusRef.current === "speaking") return;
    announceTimerRef.current = setTimeout(flushAnnounce, ANNOUNCE_QUIET_MS);
  }, [clearAnnounceTimer, flushAnnounce]);

  useEffect(() => {
    statusRef.current = opts?.status ?? null;
    if (!pendingAnnounceRef.current) return;
    if (opts?.status === "speaking") {
      // AI đang tổng kết/chuyển ý → hoãn, không cắt lời.
      clearAnnounceTimer();
      return;
    }
    scheduleAnnounce();
  }, [opts?.status, clearAnnounceTimer, scheduleAnnounce]);

  useEffect(() => clearAnnounceTimer, [clearAnnounceTimer]);

  /**
   * Sau khi hiện bài: (1) trả toolResponse NGAY để model không bị treo chờ,
   * (2) xếp hàng lượt văn bản chứa ĐÚNG nội dung đã hiện — gửi khi AI nói xong.
   */
  const announceExercise = useCallback(
    (item: ExerciseItem, respond: (res: ToolFunctionResponse[]) => void, callId?: string) => {
      respond([
        {
          ...(callId ? { id: callId } : {}),
          name: "show_exercise",
          response: { shown: true, question: item.question, options: item.options },
        },
      ]);
      pendingAnnounceRef.current = exerciseShownInstruction(item);
      pendingQuestionRef.current = item.question;
      // AI đang nói → KHÔNG gửi ngay (sẽ cắt câu tổng kết); effect theo status sẽ gửi sau.
      if (statusRef.current !== "speaking") scheduleAnnounce();
    },
    [scheduleAnnounce],
  );

  // Nạp các lượt hội thoại MỚI vào log (giữ đúng thứ tự với sự kiện công cụ).
  const onTurnsChange = useCallback((turns: VoiceTurn[]) => {
    if (turns.length < convLenRef.current) {
      // Phiên bị reset (bắt đầu buổi mới) → đồng bộ lại con trỏ, không nạp lại.
      convLenRef.current = turns.length;
      return;
    }
    for (let i = convLenRef.current; i < turns.length; i++) {
      const t = turns[i];
      if (!t) continue;
      logRef.current = [...logRef.current, t];
      // AI đã TỰ đọc câu hỏi của bài mới → huỷ lời đọc đang xếp hàng (chống lặp).
      if (t.role === "ai" && overlapsQuestion(t.text, pendingQuestionRef.current)) {
        pendingAnnounceRef.current = null;
        pendingQuestionRef.current = null;
        clearAnnounceTimer();
      }
    }
    convLenRef.current = turns.length;
  }, [clearAnnounceTimer]);

  // Sinh id item tăng dần (mọi loại item dùng chung một dãy để không trùng id).
  const nextItemId = useCallback((): string => {
    seqRef.current += 1;
    return `ekid-item-${seqRef.current}`;
  }, []);

  // CHỈ dựng item đồng bộ cho bài tập; media phải qua validate (bất đồng bộ) trước.
  const buildExercise = useCallback(
    (call: ToolFunctionCall): InteractiveItem | null => {
      const question = asString(call.args.question);
      const options = asStringArray(call.args.options);
      if (!question || options.length === 0) return null;
      return {
        id: nextItemId(),
        kind: "exercise",
        question,
        options,
        answerIndex: asIntOrUndef(call.args.answer_index),
        exerciseKind: asString(call.args.kind) ?? undefined,
      };
    },
    [nextItemId],
  );

  // Gọi API kiểm tra link media — KHÔNG BAO GIỜ ném lỗi; mọi trục trặc → { ok:false }.
  // (SSRF) API yêu cầu `kid_id` để phân quyền (chủ hồ sơ / tài khoản con) — thiếu thì không gọi.
  const validateMedia = useCallback(
    async (
      url: string,
    ): Promise<{ ok: boolean; kind: "image" | "video" | null; videoId: string | null }> => {
      if (!kidId) return { ok: false, kind: null, videoId: null };
      try {
        const res = await fetch(
          `/api/ekid/media/validate?kid_id=${encodeURIComponent(kidId)}&url=${encodeURIComponent(url)}`,
          { method: "GET" },
        );
        if (!res.ok) return { ok: false, kind: null, videoId: null };
        const data = (await res.json()) as { ok?: unknown; kind?: unknown; videoId?: unknown };
        const kind = data.kind === "image" || data.kind === "video" ? data.kind : null;
        const videoId = typeof data.videoId === "string" && data.videoId ? data.videoId : null;
        return { ok: data.ok === true && kind !== null, kind, videoId };
      } catch {
        return { ok: false, kind: null, videoId: null };
      }
    },
    [kidId],
  );

  // Xử lý `find_media`: TÌM nội dung THẬT theo từ khoá rồi mới hiện (AI không tự bịa link).
  const handleFindMedia = useCallback(
    async (call: ToolFunctionCall, respond: (res: ToolFunctionResponse[]) => void) => {
      const query = asString(call.args.query);
      const kind = call.args.kind === "video" ? "video" : "image";
      const id = nextItemId();

      const fail = (text: string) => {
        setCurrent({ id, kind: "notice", text });
        pushLog({
          role: "tool",
          text: `AI tìm "${query ?? ""}" nhưng không có nội dung phù hợp.`,
          meta: { event: "call", tool: call.name, item_id: id, args: call.args, result: { shown: false } },
        });
        respond([{ name: "find_media", response: { shown: false } }]);
      };

      if (!query) {
        respond([{ name: "find_media", response: { shown: false, reason: "missing_query" } }]);
        return;
      }

      let found: FoundMediaResponse | null = null;
      try {
        const res = await fetch(
          `/api/ekid/media/find?kid_id=${encodeURIComponent(kidId ?? "")}` +
            `&q=${encodeURIComponent(query)}&kind=${kind}`,
          { method: "GET" },
        );
        if (res.ok) found = (await res.json()) as FoundMediaResponse;
      } catch {
        found = null;
      }

      const url = typeof found?.url === "string" ? found.url : null;
      const videoId = typeof found?.videoId === "string" && found.videoId ? found.videoId : null;
      const title = typeof found?.title === "string" && found.title ? found.title : undefined;

      if (found?.ok !== true || !url) {
        fail("Không tìm thấy nội dung phù hợp");
        return;
      }

      const item: MediaItem = {
        id,
        kind: "media",
        url,
        mediaType: kind,
        caption: title,
        ...(videoId ? { videoId } : {}),
        // Ảnh: phát lại qua domain mình (hết chặn hotlink/mixed content/chặn vùng).
        ...(kind === "image" ? { displayUrl: proxiedMediaUrl(kidId ?? "", url) ?? undefined } : {}),
      };
      // Trả toolResponse NGAY (ảnh/video không cần ép đọc như bài tập).
      respond([
        {
          ...(call.id ? { id: call.id } : {}),
          name: call.name,
          response: { shown: true, caption: title ?? query ?? "" },
        },
      ]);
      setCurrent(item);
      pushLog({
        role: "tool",
        text: `AI tìm và hiện ${kind === "video" ? "video" : "hình ảnh"}: ${title ?? query}.`,
        meta: { event: "call", tool: call.name, item_id: item.id, args: call.args },
      });
    },
    [kidId, nextItemId, pushLog],
  );

  // Xử lý `show_media`: KIỂM TRA link TRƯỚC, chỉ hiện khi hợp lệ; ngược lại thông báo nhẹ.
  const handleShowMedia = useCallback(
    async (call: ToolFunctionCall, respond: (res: ToolFunctionResponse[]) => void) => {
      const url = asString(call.args.url);
      if (!url) {
        respond([{ name: "show_media", response: { shown: false } }]);
        return;
      }

      const { ok, kind, videoId } = await validateMedia(url);
      const id = nextItemId();

      if (!ok || !kind) {
        // Không tìm thấy nội dung phù hợp → thông báo NHẸ (không khung lỗi to) + ghi log.
        setCurrent({ id, kind: "notice", text: "Không tìm thấy nội dung phù hợp" });
        pushLog({
          role: "tool",
          text: "AI không tìm thấy nội dung phù hợp để hiện.",
          meta: {
            event: "call",
            tool: call.name,
            item_id: id,
            args: call.args,
            result: { shown: false },
          },
        });
        respond([{ name: "show_media", response: { shown: false } }]);
        return;
      }

      const item: MediaItem = {
        id,
        kind: "media",
        url,
        mediaType: kind,
        caption: asString(call.args.caption) ?? undefined,
        // Với YouTube: mã video đã kiểm chứng nhúng được (server trả về).
        ...(videoId ? { videoId } : {}),
        // Ảnh: phát lại qua domain mình (hết chặn hotlink/mixed content/chặn vùng).
        ...(kind === "image" ? { displayUrl: proxiedMediaUrl(kidId ?? "", url) ?? undefined } : {}),
      };
      respond([
        {
          ...(call.id ? { id: call.id } : {}),
          name: call.name,
          response: { shown: true },
        },
      ]);
      // THAY THẾ nội dung đang hiện — sân khấu chỉ có 1 nội dung tại một thời điểm.
      setCurrent(item);
      pushLog({
        role: "tool",
        text: "AI hiện nội dung lên màn hình.",
        meta: { event: "call", tool: call.name, item_id: item.id, args: call.args },
      });
    },
    [nextItemId, validateMedia, pushLog],
  );

  /**
   * Ghi nhận câu trả lời cho bài tập ĐANG hiện — ĐƯỜNG DUY NHẤT cho cả hai cách:
   * bé BẤM trên màn hình (`tap`) hoặc TRẢ LỜI BẰNG LỜI (`voice`, qua công cụ
   * `answer_exercise`). Làm cùng lúc 3 việc:
   *   (1) chốt kết quả → màn hình hiện đúng/sai dù bé trả lời bằng cách nào;
   *   (2) trả kết quả về model → AI phản hồi bằng giọng;
   *   (3) ghi log kèm NGUỒN trả lời + nguyên văn lời bé nói.
   */
  const resolveExercise = useCallback(
    (
      itemId: string,
      chosenIndex: number,
      source: AnswerSource,
      spoken?: string,
    ): { ok: boolean; result?: ExerciseResult; reason?: string } => {
      if (resolutionRef.current?.itemId === itemId) return { ok: false, reason: "already_answered" };

      const item = currentRef.current;
      if (!item || item.id !== itemId || !isExerciseItem(item)) {
        return { ok: false, reason: "no_active_exercise" };
      }
      if (!Number.isInteger(chosenIndex) || chosenIndex < 0 || chosenIndex >= item.options.length) {
        return { ok: false, reason: "invalid_index" };
      }

      const result = gradeExercise(item, chosenIndex, source, spoken);
      const next: ExerciseResolution = { itemId, ...result };
      resolutionRef.current = next;
      setResolution(next);

      // LƯU Ý: toolResponse cho `show_exercise` đã gửi NGAY lúc hiện bài (xem
      // `announceExercise`). Kết quả của bé đi về model bằng một LƯỢT VĂN BẢN
      // (`useAnswerSpeech`) — đo trên Gemini Live: gửi toolResponse muộn không làm
      // model lên tiếng, còn lượt văn bản thì có.

      pushLog({
        role: "tool",
        text: describeAnswer(result),
        meta: {
          event: "result",
          tool: "show_exercise",
          item_id: itemId,
          result: result as unknown as Record<string, unknown>,
          source,
          spoken: result.spoken,
        },
      });
      return { ok: true, result };
    },
    [pushLog],
  );

  const onToolCall = useCallback<OnToolCall>(
    (calls, respond) => {
      for (const call of calls) {
        // ── Bé TRẢ LỜI BẰNG LỜI cho bài tập đang hiện ────────────────────────
        // AI tự gọi `answer_exercise` khi bé nói câu trả lời; ghi nhận vào CÙNG
        // một đường với bấm trên màn hình → kết quả đồng bộ ở mọi nơi.
        if (call.name === "answer_exercise") {
          const index = asIntOrUndef(call.args.chosen_index);
          const spoken = asString(call.args.spoken) ?? undefined;
          const item = currentRef.current;

          let response: Record<string, unknown>;
          if (index === undefined) {
            response = { ok: false, reason: "missing_chosen_index" };
          } else if (!item || !isExerciseItem(item)) {
            response = { ok: false, reason: "no_active_exercise" };
          } else {
            const done = resolveExercise(item.id, index, "voice", spoken);
            response =
              done.ok && done.result
                ? {
                    ok: true,
                    chosen_index: done.result.chosen_index,
                    ...(done.result.correct !== undefined ? { correct: done.result.correct } : {}),
                    // Nhắc model NGAY trong kết quả trả về: phải nói kết quả cho bé nghe.
                    instruction: answerNudge(done.result),
                  }
                : { ok: false, reason: done.reason ?? "unknown" };
          }
          respond([{ name: call.name, response }]);
          continue;
        }

        // ẢNH/VIDEO đang TẠM DỪNG: model không được cấp công cụ này, nhưng nếu vẫn gọi
        // (prompt cũ/hallucination) → từ chối gọn để lượt nói không bị treo.
        if (!EKID_MEDIA_VIEW_ENABLED && (call.name === "find_media" || call.name === "show_media")) {
          respond([{ name: call.name, response: { shown: false, reason: "media_disabled" } }]);
          continue;
        }

        // Media: TÌM nội dung thật theo từ khoá (cách chính) — không chặn lượt gọi khác.
        if (call.name === "find_media") {
          void handleFindMedia(call, respond);
          continue;
        }

        // Media: kiểm tra link bất đồng bộ rồi mới hiện (không chặn lượt gọi khác).
        if (call.name === "show_media") {
          void handleShowMedia(call, respond);
          continue;
        }

        const item = buildExercise(call);
        if (!item || !isExerciseItem(item)) {
          // Công cụ chưa hỗ trợ / tham số thiếu → trả lỗi để model không bị treo.
          respond([{ name: call.name, response: { error: "unsupported_or_invalid" } }]);
          continue;
        }
        // THAY THẾ nội dung đang hiện — sân khấu chỉ có 1 nội dung tại một thời điểm.
        setCurrent(item);
        // Trả toolResponse NGAY + buộc AI đọc ĐÚNG câu hỏi vừa hiện (đo được: nếu
        // không có bước này model im lặng hoặc nói lệch nội dung thẻ).
        announceExercise(item, respond, call.id);
        pushLog({
          role: "tool",
          text: "AI hiện bài tập lên màn hình.",
          meta: { event: "call", tool: call.name, item_id: item.id, args: call.args },
        });
      }
    },
    [announceExercise, buildExercise, handleFindMedia, handleShowMedia, pushLog, resolveExercise],
  );

  const onResolve = useCallback<EkidInteractiveController["onResolve"]>(
    (itemId, result) => {
      // Bài tập: bé bấm trên màn hình → đi vào CÙNG đường với trả lời bằng lời.
      if (typeof result.chosen_index === "number") {
        resolveExercise(itemId, result.chosen_index, "tap");
        return;
      }

      // Media: nội dung đã hiện xong (toolResponse đã gửi ngay lúc hiện) → chỉ ghi log.
      pushLog({
        role: "tool",
        text: "Bé đã xem nội dung trên màn hình.",
        meta: { event: "result", tool: "show_media", item_id: itemId, result: { shown: true } },
      });
    },
    [pushLog, resolveExercise],
  );

  /**
   * LƯỚI AN TOÀN: bé nói đáp án mà model không gọi `answer_exercise` (đo được là có
   * xảy ra) → client tự chấm, để bé luôn nhận phản hồi thay vì im lặng.
   * Chỉ nhận câu RÕ RÀNG ("con chọn B", "đáp án số 2"…) và chỉ khi bài CHƯA trả lời.
   */
  const onUserSpeech = useCallback(
    (text: string) => {
      const item = currentRef.current;
      if (!item || !isExerciseItem(item)) return;
      if (resolutionRef.current?.itemId === item.id) return;
      const index = parseSpokenAnswer(text, item.options.length);
      if (index === null) return;
      resolveExercise(item.id, index, "voice", text);
    },
    [resolveExercise],
  );

  const getLog = useCallback(() => logRef.current, []);

  return { current, resolution, onToolCall, onTurnsChange, onResolve, onUserSpeech, getLog };
}
