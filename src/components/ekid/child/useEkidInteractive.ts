"use client";

// useEkidInteractive — gom logic lớp tương tác eKid v3.1 dùng CHUNG cho EkidTalkCard
// (trang chủ con) và EkidVoiceSession (trong bài học):
//   - Nhận `tool_call` từ Gemini Live → tạo item (bài tập/ảnh/video) + render.
//   - Khi bé tương tác xong → gọi `respond([...])` trả kết quả về model.
//   - Ghi MỖI tool call + kết quả vào LOG hội thoại theo thứ tự (trộn chung lượt BÉ/AI
//     để lưu vào `ekid_sessions.transcript`/memory).
//
// FALLBACK: nếu model Live không hỗ trợ function calling thì đơn giản KHÔNG có
// `tool_call` nào được phát ra — stage rỗng, toàn bộ code vẫn build sạch và buổi
// trò chuyện diễn ra bình thường (không cần nhánh code thừa).

import { useCallback, useEffect, useRef, useState } from "react";
import type { OnToolCall, VoiceTurn } from "@/components/voice/useVoiceAssistant";
import type { ToolFunctionCall, ToolFunctionResponse } from "@/lib/voice/gemini-live";
import type { InteractiveItem } from "@/lib/ekid/interactive";

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
  /** Danh sách item đang hiển thị (mới nhất ở cuối). */
  items: InteractiveItem[];
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
  const [items, setItems] = useState<InteractiveItem[]>([]);

  const itemsRef = useRef<InteractiveItem[]>([]);
  const logRef = useRef<EkidLogTurn[]>([]);
  const convLenRef = useRef(0); // số lượt BÉ/AI đã nạp vào log
  const seqRef = useRef(0); // sinh id item tăng dần
  // respond của mỗi item (một batch `tool_call` dùng chung một hàm respond).
  const respondRef = useRef<Map<string, (res: ToolFunctionResponse[]) => void>>(new Map());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

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

  const buildItem = useCallback((call: ToolFunctionCall): InteractiveItem | null => {
    seqRef.current += 1;
    const id = `ekid-item-${seqRef.current}`;

    if (call.name === "show_exercise") {
      const question = asString(call.args.question);
      const options = asStringArray(call.args.options);
      if (!question || options.length === 0) return null;
      return {
        id,
        kind: "exercise",
        question,
        options,
        answerIndex: asIntOrUndef(call.args.answer_index),
        exerciseKind: asString(call.args.kind) ?? undefined,
      };
    }

    if (call.name === "show_media") {
      const url = asString(call.args.url);
      if (!url) return null;
      const mediaType = call.args.kind === "video" ? "video" : "image";
      return {
        id,
        kind: "media",
        url,
        mediaType,
        caption: asString(call.args.caption) ?? undefined,
      };
    }

    return null;
  }, []);

  const onToolCall = useCallback<OnToolCall>(
    (calls, respond) => {
      for (const call of calls) {
        const item = buildItem(call);
        if (!item) {
          // Công cụ chưa hỗ trợ / tham số thiếu → trả lỗi để model không bị treo.
          respond([{ name: call.name, response: { error: "unsupported_or_invalid" } }]);
          continue;
        }
        respondRef.current.set(item.id, respond);
        // Giữ tối đa 30 item gần nhất — tránh DOM phình vô hạn trong phiên dài.
        setItems((prev) => [...prev, item].slice(-30));
        pushLog({
          role: "tool",
          text: `AI hiện ${item.kind === "exercise" ? "bài tập" : "nội dung"} lên màn hình.`,
          meta: { event: "call", tool: call.name, item_id: item.id, args: call.args },
        });
      }
    },
    [buildItem, pushLog],
  );

  const onResolve = useCallback<EkidInteractiveController["onResolve"]>(
    (itemId, result) => {
      const respond = respondRef.current.get(itemId);
      respondRef.current.delete(itemId);
      const item = itemsRef.current.find((i) => i.id === itemId);
      const name = item?.kind === "exercise" ? "show_exercise" : "show_media";
      respond?.([{ name, response: result as Record<string, unknown> }]);

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

  return { items, onToolCall, onTurnsChange, onResolve, getLog };
}
