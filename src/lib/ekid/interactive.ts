// interactive.ts — Lớp tương tác eKid v3.1: khai báo function calling cho Gemini Live.
//
// AI có thể CHỦ ĐỘNG hiện bài tập / ảnh / video lên màn hình trong lúc trò chuyện:
//   - `show_exercise` → thẻ trắc nghiệm bé chạm chọn, AI chấm đúng/sai.
//   - `show_media`    → ảnh (img) hoặc video (YouTube embed / mp4 <video>).
//
// Hạ tầng transport (GeminiLiveClient.sendToolResponse + event `tool_call`) đã có ở
// Task 1. File này chỉ khai báo schema công cụ + đoạn prompt mô tả công cụ để chèn
// vào system instruction (AI biết KHI NÀO nên gọi).

/**
 * BẬT/TẮT hiển thị ẢNH – VIDEO trong phiên trò chuyện với AI.
 *
 * `false` = TẠM DỪNG (đang dùng): AI chỉ hiện BÀI TẬP lên màn hình; khi bé muốn xem
 * con vật/đồ vật/sự việc, AI mô tả bằng lời, mời bé tưởng tượng — không tìm/hiện media.
 * `true`  = bật lại đầy đủ như trước (find_media + show_media).
 *
 * Đây là CÔNG TẮC DUY NHẤT: đổi giá trị này là đổi cả khai báo công cụ gửi model,
 * đoạn prompt dặn AI, và bộ chặn ở client. Không phải sửa chỗ nào khác.
 */
export const EKID_MEDIA_VIEW_ENABLED = false;

/** Tên các công cụ liên quan hiển thị ảnh/video (bị gỡ khi tạm dừng). */
const MEDIA_TOOL_NAMES: readonly string[] = ["find_media", "show_media"];

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
  /** Mã video YouTube đã kiểm chứng nhúng được (nếu là video YouTube). */
  videoId?: string;
  /**
   * URL PHÁT LẠI qua domain mình (ảnh) — trình duyệt chỉ tải từ `ekid.nooi.net` nên
   * không bị chặn hotlink/mixed content. Không có thì dùng `url`.
   */
  displayUrl?: string;
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

/**
 * Nguồn của một câu trả lời: bé BẤM trên màn hình hay TRẢ LỜI BẰNG LỜI NÓI.
 * Dùng để log phản ánh đúng thực tế (bé đã trả lời bằng cách nào).
 */
export type AnswerSource = "tap" | "voice";

/** Kết quả trả về model sau khi bé tương tác với một item (đã chấm nếu AI cho đáp án). */
export interface ExerciseResult {
  chosen_index: number;
  /** Chỉ có khi AI cung cấp `answer_index`. */
  correct?: boolean;
  /** Bé trả lời bằng cách nào — bấm màn hình hay nói. */
  source: AnswerSource;
  /** Nguyên văn lời bé nói (chỉ khi `source === "voice"`), đã cắt tối đa 200 ký tự. */
  spoken?: string;
}

export interface MediaResult {
  shown: true;
}

// ─── Chấm & mô tả kết quả (dùng CHUNG cho cả 2 đường: bấm và lời nói) ─────────

const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Chữ cái của một lựa chọn (0 → A, 1 → B…). */
export function optionLetter(index: number): string {
  return OPTION_LETTERS[index] ?? String(index + 1);
}

/**
 * Chấm một lựa chọn cho bài tập. Hàm THUẦN — một đường duy nhất dùng cho cả
 * bấm trên màn hình lẫn bé trả lời bằng lời, nên kết quả luôn đồng bộ.
 */
export function gradeExercise(
  item: Pick<ExerciseItem, "answerIndex">,
  chosenIndex: number,
  source: AnswerSource,
  spoken?: string,
): ExerciseResult {
  const result: ExerciseResult = { chosen_index: chosenIndex, source };
  if (typeof item.answerIndex === "number") result.correct = chosenIndex === item.answerIndex;
  const trimmed = spoken?.trim();
  if (trimmed) result.spoken = trimmed.slice(0, 200);
  return result;
}

/** Câu mô tả kết quả để ghi log/session — nói rõ bé trả lời BẰNG LỜI hay BẤM. */
export function describeAnswer(result: ExerciseResult): string {
  const letter = optionLetter(result.chosen_index);
  const how =
    result.source === "voice"
      ? `Bé trả lời bằng lời${result.spoken ? `: "${result.spoken}"` : ""} → chọn đáp án ${letter}`
      : `Bé bấm chọn đáp án ${letter}`;
  if (result.correct === undefined) return `${how} — đã ghi nhận.`;
  return `${how} — ${result.correct ? "ĐÚNG" : "SAI"}.`;
}

/**
 * Câu lệnh GỬI THẲNG vào phiên Gemini Live để ÉP AI nói ngay kết quả vừa ghi nhận
 * (không phụ thuộc việc model có tự phát lượt hay không). Bé trả lời bằng BẤM hay
 * bằng LỜI đều được nói rõ, nên lời đáp luôn khớp với thực tế.
 */
export function answerSpeechInstruction(result: ExerciseResult): string {
  const letter = optionLetter(result.chosen_index);
  const how = result.source === "voice" ? "vừa trả lời bằng lời" : "vừa bấm trên màn hình";
  const head = `[KẾT QUẢ BÀI TẬP] Bé ${how}, chọn đáp án ${letter}`;
  if (result.correct === true) {
    return `${head} — ĐÚNG. Hãy nói ngay 1-2 câu khen bé thật vui vẻ, rồi mời bé làm tiếp.`;
  }
  if (result.correct === false) {
    return `${head} — SAI. Hãy nói ngay 1-2 câu động viên nhẹ nhàng và gợi mở để bé thử lại, không chê bé.`;
  }
  return `${head}. Hãy nói ngay 1-2 câu phản hồi về câu trả lời của bé.`;
}

/**
 * Câu lệnh gửi NGAY sau khi thẻ bài tập đã hiện — ĐO ĐƯỢC trên Gemini Live:
 * model KHÔNG tự nói tiếp sau khi gọi công cụ; chỉ khi nhận một lượt văn bản
 * chứa ĐÚNG nội dung đã hiện thì nó mới đọc khớp (thí nghiệm: khớp 100%).
 *
 * Vì vậy câu lệnh này chứa nguyên văn câu hỏi + lựa chọn, không để model tự nhớ.
 */
export function exerciseShownInstruction(item: Pick<ExerciseItem, "question" | "options">): string {
  const opts = item.options
    .slice(0, 6)
    .map((o, i) => `${optionLetter(i)}. ${o}`)
    .join(", ");
  return (
    `[HỆ THỐNG] Thẻ bài tập ĐÃ hiện trên màn hình. Câu hỏi: "${item.question}". ` +
    `Các lựa chọn: ${opts}. Hãy ĐỌC TO đúng câu hỏi và các lựa chọn này cho bé nghe ngay, ` +
    `rồi mời bé chọn. KHÔNG đổi nội dung, KHÔNG nói đáp án đúng, KHÔNG thêm câu hỏi khác.`
  );
}

/**
 * Đọc ĐÁP ÁN BẰNG LỜI từ câu bé nói — lưới an toàn khi model không gọi
 * `answer_exercise` (đo được: có lượt model bỏ qua, bé nói mà không ai chấm).
 *
 * Chỉ nhận những câu RÕ RÀNG là chọn đáp án; nói chuyện bình thường → null.
 * Trả về vị trí (0-based) hoặc null.
 */
export function parseSpokenAnswer(text: string | null | undefined, optionCount: number): number | null {
  if (!text || optionCount <= 0) return null;
  const t = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (!t) return null;

  const letterToIndex = (ch: string): number | null => {
    const i = OPTION_LETTERS.toLowerCase().indexOf(ch);
    return i >= 0 && i < optionCount ? i : null;
  };

  // "con chọn b", "đáp án là c", "chọn đáp án a", "chọn câu b"
  const byLetter = t.match(/(?:chọn|chon|đáp án|dap an|khoanh)\s*(?:là|la|số|so|câu|cau)?\s*([a-f])(?![a-zà-ỹ])/);
  if (byLetter) {
    const idx = letterToIndex(byLetter[1]);
    if (idx !== null) return idx;
  }

  // "con chọn 2", "đáp án số 3", "chọn cái thứ 2"
  const byNumber = t.match(/(?:chọn|chon|đáp án|dap an|số|so|cái|cai|thứ|thu)\s*(?:là|la)?\s*(\d{1,2})(?!\d)/);
  if (byNumber) {
    const n = Number(byNumber[1]);
    // Chấp nhận cả cách đếm từ 1 và cách đọc "số 0/1" của trẻ lớn.
    if (n >= 1 && n <= optionCount) return n - 1;
    if (n >= 0 && n < optionCount) return n;
  }

  // Câu RẤT NGẮN chỉ là một chữ cái: "b", "ý b"
  if (t.length <= 4) {
    const m = t.match(/^(?:ý|y)?\s*([a-f])$/);
    if (m) return letterToIndex(m[1]);
  }

  return null;
}

/**
 * AI đã nói nội dung của câu hỏi này chưa? Dùng để HUỶ lời đọc đang xếp hàng khi
 * model tự đọc bài mới (tránh đọc lặp).
 */
export function overlapsQuestion(spoken: string | null | undefined, question: string | null | undefined): boolean {
  if (!spoken || !question) return false;
  // AI ĐỌC ký hiệu thành lời ("5 + 3" → "5 cộng 3") nên phải quy đổi trước khi so.
  const SYMBOL_WORDS: Array<[RegExp, string]> = [
    [/\+/g, " cộng "],
    [/[−–]/g, " trừ "],
    [/[×*]/g, " nhân "],
    [/[:÷]/g, " chia "],
    [/=/g, " bằng "],
  ];
  const norm = (s: string) => {
    let x = s.toLowerCase();
    for (const [re, word] of SYMBOL_WORDS) x = x.replace(re, word);
    return x.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  };
  const q = norm(question);
  const t = norm(spoken);
  if (!q || !t) return false;
  if (t.includes(q)) return true;
  // Câu hỏi dài: khớp một mảnh đủ dài (12 ký tự) là coi như đã đọc.
  const probeLen = 12;
  if (q.length <= probeLen) return false;
  for (let i = 0; i + probeLen <= q.length; i += 4) {
    if (t.includes(q.slice(i, i + probeLen))) return true;
  }
  return false;
}

/**
 * Lời nhắc NGẮN gắn ngay trong kết quả `answer_exercise` trả về model — để model
 * phản hồi trong CHÍNH lượt đang xử lý (đường bé nói thường bị model kết thúc lượt
 * im lặng).
 */
export function answerNudge(result: ExerciseResult): string {
  const letter = optionLetter(result.chosen_index);
  const outcome = result.correct === undefined ? "" : result.correct ? " (ĐÚNG)" : " (SAI)";
  return (
    `Bé đã chọn đáp án ${letter}${outcome}. Hãy LÊN TIẾNG ngay kết quả cho bé nghe, ` +
    `rồi hiện bài tiếp theo trong cùng lượt.`
  );
}

/**
 * Dựng URL PHÁT LẠI ảnh qua domain mình (`/api/ekid/media/proxy`).
 *
 * Nhờ vậy trình duyệt của bé chỉ nói chuyện với `ekid.nooi.net` → hết chặn hotlink
 * theo Referer, hết mixed content, hết đòi cookie, hết chặn theo vùng. Trả null khi
 * thiếu `kid_id` hoặc URL không phải http(s) → nơi gọi dùng link gốc.
 */
export function proxiedMediaUrl(kidId: string, url: string): string | null {
  if (!kidId || !/^https?:\/\//i.test(url)) return null;
  return `/api/ekid/media/proxy?kid_id=${encodeURIComponent(kidId)}&url=${encodeURIComponent(url)}`;
}

/**
 * Bé có nên TẠM DỪNG trò chuyện khi nội dung này đang hiện không?
 * Có — chỉ với VIDEO: vừa để bé nghe rõ, vừa không tốn voice live trong lúc xem.
 */
export function mediaShouldPauseVoice(item: InteractiveItem | null): boolean {
  return !!item && item.kind === "media" && item.mediaType === "video";
}

/**
 * Gợi ý ngắn cho khung "ghi chú" cột trái màn hình con — bám theo nội dung
 * đang hiện (`current`) và kết quả đã ghi nhận (`resolution`).
 */
export function stageHint(
  current: InteractiveItem | null,
  resolution: { itemId: string; correct?: boolean } | null,
): string {
  if (!current) return 'Bấm mic rồi nói điều con muốn: hỏi bài, kể chuyện hoặc luyện nói.';
  if (current.kind === "media") {
    return current.mediaType === "video"
      ? "Con xem video nhé — trò chuyện tạm dừng để con nghe rõ. Bấm nút ▶ để nói tiếp."
      : "Con xem thật kỹ rồi kể cho thầy/cô AI nghe nhé!";
  }
  if (current.kind === "notice") return "Thầy/cô AI đang tìm nội dung khác cho con.";

  const answered = resolution && resolution.itemId === current.id ? resolution : null;
  if (!answered) return 'Con hãy bấm một đáp án, hoặc nói: "con chọn A" (B, C…).';
  if (answered.correct === true) return "Con trả lời đúng rồi — nghe thầy/cô AI khen nhé! 🎉";
  if (answered.correct === false) return "Đã ghi nhận câu trả lời — nghe thầy/cô AI gợi mở nhé! 💪";
  return "Đã ghi nhận câu trả lời của con. 👍";
}

// ─── Function declarations (gửi kèm setup của Gemini Live) ────────────────────

/**
 * Khai báo 2 công cụ eKid theo chuẩn Gemini function calling.
 * Truyền vào `VoiceAssistant tools={EKID_TOOLS}`.
 */
export const EKID_TOOL_DECLARATIONS: EkidToolDeclaration[] = [
  {
    name: "find_media",
    description:
      "TÌM và hiện ẢNH hoặc VIDEO THẬT theo TỪ KHOÁ. " +
      "DÙNG CÔNG CỤ NÀY khi bé muốn xem hình/video — KHÔNG tự đưa link. " +
      "Hệ thống sẽ tìm nội dung thật, đúng chủ đề, đã kiểm chứng xem được. " +
      "`kind`: \"image\" (ảnh) hoặc \"video\" (video YouTube). " +
      "Sau khi hiện, hãy dẫn dắt bé quan sát: mô tả ngắn, đặt 1-2 câu hỏi gợi mở.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Từ khoá NGẮN, tiếng Việt, đúng thứ bé muốn xem (vd \"con mèo\", \"khủng long\", " +
            "\"biển\"). Đừng đưa cả câu dài.",
        },
        kind: {
          type: "string",
          description: "Loại nội dung cần tìm: \"image\" (ảnh) hoặc \"video\" (video).",
          enum: ["image", "video"],
        },
      },
      required: ["query", "kind"],
    },
  },
  {
    name: "show_exercise",
    description:
      "Hiện một bài tập trắc nghiệm LÊN MÀN HÌNH của bé (đồng thời với hội thoại). " +
      "Dùng khi muốn bé quan sát/luyện tập và tự chạm chọn đáp án. " +
      "Sau khi gọi, hãy ĐỌC TO câu hỏi và các lựa chọn cho bé nghe, rồi chờ bé chọn. " +
      "Khi đã có kết quả của bài trước, hãy gọi công cụ này NGAY trong cùng lượt để bé " +
      "thấy bài tiếp theo không phải chờ.",
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
      "ẢNH: dùng link ảnh trực tiếp (.jpg/.png/.webp/.gif) của nội dung thật sự xem được. " +
      "VIDEO: CHỈ dùng link YouTube — TUYỆT ĐỐI KHÔNG dùng file .mp4/.webm hay link tải video. " +
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
  {
    name: "answer_exercise",
    description:
      "GHI NHẬN câu trả lời của bé cho bài tập ĐANG hiện trên màn hình khi bé trả lời " +
      "BẰNG LỜI NÓI (ví dụ bé nói \"con chọn B\", \"đáp án là số 2\", \"con nghĩ là ba\"). " +
      "CHỈ gọi khi trên màn hình đang có thẻ bài tập chưa được trả lời. " +
      "KHÔNG gọi khi bé bấm trên màn hình — lúc đó hệ thống tự ghi nhận. " +
      "Sau khi gọi, hãy LÊN TIẾNG ngay kết quả (khen khi đúng, gợi mở khi sai) VÀ hiện " +
      "bài tiếp theo trong cùng lượt nói.",
    parameters: {
      type: "object",
      properties: {
        chosen_index: {
          type: "integer",
          description:
            "Vị trí (bắt đầu từ 0) của lựa chọn mà bé vừa nói — dựa trên đúng thứ tự " +
            "`options` của bài tập đang hiện.",
        },
        spoken: {
          type: "string",
          description: "Nguyên văn lời bé vừa nói (để ghi log trung thực).",
        },
      },
      required: ["chosen_index"],
    },
  },
];

/**
 * Công cụ gửi kèm setup Gemini Live — LỌC theo công tắc {@link EKID_MEDIA_VIEW_ENABLED}.
 * Khi tạm dừng xem ảnh/video, model KHÔNG còn thấy `find_media`/`show_media` nên
 * không thể gọi; phần còn lại (bài tập) giữ nguyên.
 */
export const EKID_TOOLS: EkidToolDeclaration[] = EKID_MEDIA_VIEW_ENABLED
  ? EKID_TOOL_DECLARATIONS
  : EKID_TOOL_DECLARATIONS.filter((t) => !MEDIA_TOOL_NAMES.includes(t.name));

// ─── Prompt mô tả công cụ (chèn vào system instruction) ───────────────────────

/**
 * Đoạn mô tả công cụ để GHÉP vào system instruction — giúp AI biết mình có thể
 * hiện BÀI TẬP (và ảnh/video khi {@link EKID_MEDIA_VIEW_ENABLED}) lên màn hình,
 * cùng KHI NÀO nên dùng.
 *
 * Khi tạm dừng xem ảnh/video: KHÔNG nhắc tên công cụ media (model không còn thấy
 * chúng) mà dặn rõ AI mô tả bằng lời — tránh việc model gọi công cụ không tồn tại
 * làm nghẽn lượt nói.
 */
export function toolsPromptSection(): string {
  const lines = [
    "CÔNG CỤ HIỂN THỊ LÊN MÀN HÌNH (dùng khi hội thoại cần bé XEM hoặc LÀM ngay):",
    "- `show_exercise`: hiện thẻ BÀI TẬP trắc nghiệm lên màn hình. Dùng khi bạn muốn bé",
    "  luyện tập/kiểm tra qua đồng hồ: đọc to câu hỏi + các lựa chọn, rồi để bé chạm chọn.",
    "  Bé luôn quan sát được màn hình trong khi vẫn nói chuyện với bạn.",
    "  NỘI DUNG KHỚP: câu hỏi và các lựa chọn bạn đưa vào công cụ CHÍNH LÀ nội dung bé",
    "  nhìn thấy. Khi đọc, phải đọc ĐÚNG NGUYÊN VĂN câu hỏi và đúng thứ tự lựa chọn đó —",
    "  KHÔNG đổi số liệu, KHÔNG đọc đáp án khác, KHÔNG hỏi sang câu khác trong cùng lượt.",
  ];

  if (EKID_MEDIA_VIEW_ENABLED) {
    lines.push(
      "- `find_media`: TÌM VÀ HIỆN ảnh/video THẬT theo từ khoá — ĐÂY LÀ CÁCH CHÍNH để bé xem",
      "  hình/video. Chỉ đưa TỪ KHOÁ ngắn tiếng Việt (vd \"con mèo\", \"khủng long\", \"biển\");",
      "  `kind`: \"image\" hoặc \"video\". Hệ thống tự tìm nội dung thật + kiểm chứng xem được.",
      "  TUYỆT ĐỐI KHÔNG tự bịa link, KHÔNG đưa link trang web.",
      "- `show_media`: chỉ dùng khi bạn ĐÃ có sẵn link ảnh trực tiếp (.jpg/.png/.webp) hoặc link",
      "  YouTube cụ thể. Nếu không chắc → dùng `find_media`.",
      "  VIDEO: CHỈ dùng link YouTube (video còn tồn tại và cho phép nhúng). TUYỆT ĐỐI KHÔNG",
      "  dùng file .mp4/.webm hay link tải video — hệ thống sẽ từ chối.",
      "  Dùng khi bé hỏi về con vật, đồ vật, sự việc, bài hát, hoạt động… mà một hình ảnh",
      "  hoặc đoạn video sẽ giúp bé dễ hiểu hơn.",
    );
  } else {
    lines.push(
      "- HIỆN TẠI CHƯA HIỂN THỊ ĐƯỢC ẢNH/VIDEO lên màn hình. Khi bé muốn xem con vật, đồ vật,",
      "  sự việc hay bài hát nào, hãy MÔ TẢ THẬT SINH ĐỘNG bằng lời (hình dáng, màu sắc, âm",
      "  thanh) và mời bé tưởng tượng, đặt câu hỏi để bé cùng nghĩ. TUYỆT ĐỐI KHÔNG hứa",
      "  \"để thầy/cô mở hình/video cho con xem\", KHÔNG đọc link, KHÔNG nói về lỗi kỹ thuật.",
    );
  }

  lines.push(
    "- `answer_exercise`: GHI NHẬN câu trả lời khi bé trả lời BẰNG LỜI NÓI cho thẻ bài tập",
    "  đang hiện trên màn hình (ví dụ bé nói \"con chọn B\"). Bé có thể trả lời bằng cách",
    "  BẤM trên màn hình hoặc NÓI — cả hai đường đều được ghi nhận như nhau, kết quả hiện",
    "  ngay trên thẻ. Bé bấm rồi thì KHÔNG gọi lại công cụ này.",
    "- BẮT BUỘC: ngay khi nhận được kết quả bài tập (bé bấm hoặc bé nói), bạn phải LÊN",
    "  TIẾNG ngay 1-2 câu về kết quả đó — khen khi đúng, động viên + gợi mở khi sai.",
    "  TUYỆT ĐỐI KHÔNG im lặng sau khi có kết quả.",
    "- CHUYỂN TIẾP NHANH: trong CÙNG lượt đó, hãy gọi luôn `show_exercise` để hiện BÀI TIẾP THEO",
    "  (không chờ bé giục, không hỏi lại \"con làm tiếp không\"). Bé chỉ cần nghe bạn nhận xét",
    "  ngắn 1 câu là đã thấy bài mới trên màn hình.",
  );

  if (EKID_MEDIA_VIEW_ENABLED) {
    lines.push(
      "- Khi hiện ảnh/video: chỉ dùng link THẬT SỰ xem được. Video YouTube phải là video",
      "  còn tồn tại và cho phép nhúng; nếu hệ thống báo không hiện được thì hãy mô tả bằng",
      "  lời và mời bé hỏi tiếp, đừng thử lại y nguyên link đó.",
    );
  }

  lines.push(
    "Nguyên tắc dùng công cụ:",
    "- Chỉ gọi khi thực sự hữu ích cho bài học/buổi trò chuyện; KHÔNG lạm dụng dồn dập.",
    "- Trước/sau khi gọi, hãy NÓI cho bé biết: gọi công cụ ở giữa lượt bạn đang nói,",
    "  sau đó nhận kết quả bé tương tác và phản hồi bằng giọng (khen khi đúng, gợi mở khi sai).",
    "- Nếu công cụ không sẵn sàng, hãy mô tả bằng lời — vẫn giữ buổi học trọn vẹn.",
  );

  return lines.join("\n");
}
