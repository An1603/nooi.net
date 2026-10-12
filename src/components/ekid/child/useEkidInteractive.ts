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
import type { OnToolCall, VoiceTurn } from "@/components/voice/useVoiceAssistant";
import type { ToolFunctionCall, ToolFunctionResponse } from "@/lib/voice/gemini-live";
import type { InteractiveItem, MediaItem } from "@/lib/ekid/interactive";

/** Sự kiện lớp tương tác (gọi công cụ / kết quả bé tương tác) — lưu vào log. */
export interface ToolLogMeta {
  event: "call" | "result";
  tool: string;
  item_id: string;
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface EkidInteractiveController {
  /** Nội dung ĐANG hiển thị trên sân khấu (mỗi tool call THAY THẾ nội dung cũ). */
  current: InteractiveItem | null;
  /** Truyền vào `VoiceAssistant onToolCall`. */
  onToolCall: OnToolCall;
  /** Truyền vào `VoiceAssistant onTurnsChange` — gom lượt BÉ/AI vào log. */
  onTurnsChange: (turns: VoiceTurn[]) => void;
  /** Xử lý khi bé tương tác xong → trả kết quả về model + ghi log. */
  onResolve: (itemId: string, result: { chosen_index?: number; correct?: boolean; shown?: true }) => void;
  /** Log hội thoại đầy đủ (BÉ/AI + sự kiện công cụ) để lưu vào session/memory. */
  getLog: () => EkidLogTurn[];
}

export function useEkidInteractive(): EkidInteractiveController {
  const [current, setCurrent] = useState<InteractiveItem | null>(null);

  const currentRef = useRef<InteractiveItem | null>(null);
  const logRef = useRef<EkidLogTurn[]>([]);
  const convLenRef = useRef(0); // số lượt BÉ/AI đã nạp vào log
  const seqRef = useRef(0); // sinh id item tăng dần
  // respond của mỗi item + item gốc (một batch `tool_call` dùng chung một hàm respond).
  const respondRef = useRef<Map<string, { respond: (res: ToolFunctionResponse[]) => void; item: InteractiveItem }>>(
    new Map(),
  );

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const pushLog = useCallback((turn: EkidLogTurn) => {
    logRef.current = [...logRef.current, turn];
  }, []);

  // Nạp các lượt hội thoại MỚI vào log (giữ đúng thứ tự với sự kiện công cụ).
  const onTurnsChange = useCallback((turns: VoiceTurn[]) => {
    if (turns.length < convLenRef.current) {
      // Phiên bị reset (bắt đầu buổi mới) → đồng bộ lại con trỏ, không nạp lại.
      convLenRef.current = turns.length;
      return;
    }
    for (let i = convLenRef.current; i < turns.length; i++) {
      const t = turns[i];
      if (t) logRef.current = [...logRef.current, t];
    }
    convLenRef.current = turns.length;
  }, []);

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
  const validateMedia = useCallback(
    async (url: string): Promise<{ ok: boolean; kind: "image" | "video" | null }> => {
      try {
        const res = await fetch(`/api/ekid/media/validate?url=${encodeURIComponent(url)}`, {
          method: "GET",
        });
        if (!res.ok) return { ok: false, kind: null };
        const data = (await res.json()) as { ok?: unknown; kind?: unknown };
        const kind = data.kind === "image" || data.kind === "video" ? data.kind : null;
        return { ok: data.ok === true && kind !== null, kind };
      } catch {
        return { ok: false, kind: null };
      }
    },
    [],
  );

  // Xử lý `show_media`: KIỂM TRA link TRƯỚC, chỉ hiện khi hợp lệ; ngược lại thông báo nhẹ.
  const handleShowMedia = useCallback(
    async (call: ToolFunctionCall, respond: (res: ToolFunctionResponse[]) => void) => {
      const url = asString(call.args.url);
      if (!url) {
        respond([{ name: "show_media", response: { shown: false } }]);
        return;
      }

      const { ok, kind } = await validateMedia(url);
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
      };
      respondRef.current.set(item.id, { respond, item });
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

  const onToolCall = useCallback<OnToolCall>(
    (calls, respond) => {
      for (const call of calls) {
        // Media: kiểm tra link bất đồng bộ rồi mới hiện (không chặn lượt gọi khác).
        if (call.name === "show_media") {
          void handleShowMedia(call, respond);
          continue;
        }

        const item = buildExercise(call);
        if (!item) {
          // Công cụ chưa hỗ trợ / tham số thiếu → trả lỗi để model không bị treo.
          respond([{ name: call.name, response: { error: "unsupported_or_invalid" } }]);
          continue;
        }
        respondRef.current.set(item.id, { respond, item });
        // THAY THẾ nội dung đang hiện — sân khấu chỉ có 1 nội dung tại một thời điểm.
        setCurrent(item);
        pushLog({
          role: "tool",
          text: `AI hiện ${item.kind === "exercise" ? "bài tập" : "nội dung"} lên màn hình.`,
          meta: { event: "call", tool: call.name, item_id: item.id, args: call.args },
        });
      }
    },
    [buildExercise, handleShowMedia, pushLog],
  );

  const onResolve = useCallback<EkidInteractiveController["onResolve"]>(
    (itemId, result) => {
      const entry = respondRef.current.get(itemId);
      respondRef.current.delete(itemId);
      const name = entry?.item.kind === "exercise" ? "show_exercise" : "show_media";
      entry?.respond([{ name, response: result as Record<string, unknown> }]);

      // Mô tả kết quả dễ đọc để lưu log.
      let text: string;
      if (typeof result.chosen_index === "number") {
        const letter = String.fromCharCode(65 + result.chosen_index);
        text = result.correct === undefined
          ? `Bé chọn đáp án ${letter}.`
          : `Bé chọn đáp án ${letter} — ${result.correct ? "ĐÚNG" : "SAI"}.`;
      } else {
        text = "Bé đã xem nội dung trên màn hình.";
      }
      pushLog({
        role: "tool",
        text,
        meta: {
          event: "result",
          tool: name,
          item_id: itemId,
          result: result as Record<string, unknown>,
        },
      });
    },
    [pushLog],
  );

  const getLog = useCallback(() => logRef.current, []);

  return { current, onToolCall, onTurnsChange, onResolve, getLog };
}
