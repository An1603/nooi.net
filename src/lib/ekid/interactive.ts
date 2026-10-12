// interactive.ts — Lớp tương tác eKid v3.1: khai báo function calling cho Gemini Live.
//
// AI có thể CHỦ ĐỘNG hiện bài tập / ảnh / video lên màn hình trong lúc trò chuyện:
//   - `show_exercise` → thẻ trắc nghiệm bé chạm chọn, AI chấm đúng/sai.
//   - `show_media`    → ảnh (img) hoặc video (YouTube embed / mp4 <video>).
//
// Hạ tầng transport (GeminiLiveClient.sendToolResponse + event `tool_call`) đã có ở
// Task 1. File này chỉ khai báo schema công cụ + đoạn prompt mô tả công cụ để chèn
// vào system instruction (AI biết KHI NÀO nên gọi).

/** Một khai báo hàm theo chuẩn Gemini (functionDeclarations). */
export interface EkidToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/** Loại nội dung hiển thị trên sân khấu tương tác. */
export type InteractiveItemKind = "exercise" | "media" | "notice";

/** Một thẻ bài tập trắc nghiệm. */
export interface ExerciseItem {
  id: string;
  kind: "exercise";
  question: string;
  options: string[];
  /** Vị trí đáp án đúng (nếu AI cung cấp) — để chấm tại client. */
  answerIndex?: number;
  /** Gợi ý loại bài: chon-hinh | nghe-chon | dem | ke-chuyen. */
  exerciseKind?: string;
}

/** Một thẻ media (ảnh hoặc video). */
export interface MediaItem {
  id: string;
  kind: "media";
  url: string;
  mediaType: "image" | "video";
  caption?: string;
}

/** Thông báo NHẸ hiện trong sân khấu (vd: link media không hợp lệ) — không phải khung lỗi. */
export interface NoticeItem {
  id: string;
  kind: "notice";
  text: string;
}

export type InteractiveItem = ExerciseItem | MediaItem | NoticeItem;

/** Phân loại một item để render (dùng cả client & kiểm thử). */
export function isExerciseItem(item: InteractiveItem): item is ExerciseItem {
  return item.kind === "exercise";
}

/** Phân loại media item. */
export function isMediaItem(item: InteractiveItem): item is MediaItem {
  return item.kind === "media";
}

/** Phân loại thông báo nhẹ. */
export function isNoticeItem(item: InteractiveItem): item is NoticeItem {
  return item.kind === "notice";
}

/** Kết quả trả về model sau khi bé tương tác với một item. */
export interface ExerciseResult {
  chosen_index: number;
  /** Chỉ có khi AI cung cấp `answer_index`. */
  correct?: boolean;
}

export interface MediaResult {
  shown: true;
}

// ─── Function declarations (gửi kèm setup của Gemini Live) ────────────────────

/**
 * Khai báo 2 công cụ eKid theo chuẩn Gemini function calling.
 * Truyền vào `VoiceAssistant tools={EKID_TOOLS}`.
 */
export const EKID_TOOLS: EkidToolDeclaration[] = [
  {
    name: "show_exercise",
    description:
      "Hiện một bài tập trắc nghiệm LÊN MÀN HÌNH của bé (đồng thời với hội thoại). " +
      "Dùng khi muốn bé quan sát/luyện tập và tự chạm chọn đáp án. " +
      "Sau khi gọi, hãy ĐỌC TO câu hỏi và các lựa chọn cho bé nghe, rồi chờ bé chọn.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "Câu hỏi ngắn, đơn giản, tiếng Việt, phù hợp lứa tuổi của bé.",
        },
        options: {
          type: "array",
          description: "Danh sách 2-4 lựa chọn (mỗi lựa chọn là một chuỗi ngắn).",
          items: { type: "string" },
        },
        answer_index: {
          type: "integer",
          description:
            "Vị trí (bắt đầu từ 0) của đáp án đúng trong `options`. Bỏ trống nếu muốn " +
            "bé trả lời tự do bằng lời nói.",
        },
        kind: {
          type: "string",
          description:
            "Loại bài tập: chon-hinh | nghe-chon | dem | ke-chuyen (tuỳ chọn).",
          enum: ["chon-hinh", "nghe-chon", "dem", "ke-chuyen"],
        },
      },
      required: ["question", "options"],
    },
  },
  {
    name: "show_media",
    description:
      "Hiện một ẢNH hoặc VIDEO lên màn hình để minh hoạ nội dung đang nói. " +
      "Dùng link ảnh trực tiếp (.jpg/.png/...) hoặc video (YouTube hoặc file .mp4). " +
      "Sau khi hiện, hãy dẫn dắt bé quan sát: mô tả ngắn, đặt 1-2 câu hỏi gợi mở.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL ảnh (jpg/png/webp/gif) hoặc video (YouTube hoặc .mp4/.webm).",
        },
        kind: {
          type: "string",
          description: "Loại nội dung: \"image\" (ảnh) hoặc \"video\" (video).",
          enum: ["image", "video"],
        },
        caption: {
          type: "string",
          description: "Chú thích ngắn hiện dưới nội dung (tuỳ chọn).",
        },
      },
      required: ["url", "kind"],
    },
  },
];

// ─── Prompt mô tả công cụ (chèn vào system instruction) ───────────────────────

/**
 * Đoạn mô tả công cụ để GHÉP vào system instruction — giúp AI biết mình có thể
 * hiện bài tập/ảnh/video lên màn hình và KHI NÀO nên dùng.
 */
export function toolsPromptSection(): string {
  return [
    "CÔNG CỤ HIỂN THỊ LÊN MÀN HÌNH (dùng khi hội thoại cần bé XEM hoặc LÀM ngay):",
    "- `show_exercise`: hiện thẻ BÀI TẬP trắc nghiệm lên màn hình. Dùng khi bạn muốn bé",
    "  luyện tập/kiểm tra qua đồng hồ: đọc to câu hỏi + các lựa chọn, rồi để bé chạm chọn.",
    "  Bé luôn quan sát được màn hình trong khi vẫn nói chuyện với bạn.",
    "- `show_media`: hiện ẢNH hoặc VIDEO minh hoạ (YouTube hoặc file .mp4) lên màn hình.",
    "  Dùng khi bé hỏi về con vật, đồ vật, sự việc, bài hát, hoạt động… mà một hình ảnh",
    "  hoặc đoạn video sẽ giúp bé dễ hiểu hơn.",
    "Nguyên tắc dùng công cụ:",
    "- Chỉ gọi khi thực sự hữu ích cho bài học/buổi trò chuyện; KHÔNG lạm dụng dồn dập.",
    "- Trước/sau khi gọi, hãy NÓI cho bé biết: gọi công cụ ở giữa lượt bạn đang nói,",
    "  sau đó nhận kết quả bé tương tác và phản hồi bằng giọng (khen khi đúng, gợi mở khi sai).",
    "- Nếu công cụ không sẵn sàng, hãy mô tả bằng lời — vẫn giữ buổi học trọn vẹn.",
  ].join("\n");
}
