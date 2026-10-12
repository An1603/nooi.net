// Kiểu dữ liệu dùng chung cho phân hệ con (client components).

/** Tiến độ một bài học (khớp API /api/ekid/library). */
export interface LessonProgress {
  status: string; // "chua-hoc" | "da-hoc" | "da-thi"
  best_score: number | null;
  attempts: number;
}

/** Câu hỏi RÚT GỌN trả về client — chỉ có câu hỏi + lựa chọn, KHÔNG có đáp án. */
export interface PublicExercise {
  question: string;
  options: string[];
}

/** Bài học trong thư viện. */
export interface LibraryLesson {
  id: string;
  title: string;
  part?: string | null;
  core_topic?: string | null;
  difficulty?: number | null;
  video_url?: string | null;
  exercises?: PublicExercise[];
  /** Khoá theo nguyên tắc "thi đạt mới sang bài" (server tính). Không có ⇒ không khoá. */
  locked?: boolean;
  progress: LessonProgress;
}

/** Hồ sơ bé (đã ẩn user_id/child_user_id). */
export interface LibraryKid {
  id: string;
  name: string;
  avatar_emoji?: string | null;
  favorite_voice?: string | null;
  placement_age_band?: string | null;
  placement_level?: number | null;
  daily_limit_min?: number | null;
  /** Bộ nhớ tổng hợp về bé (cột ekid_kids.memory) — nạp vào ngữ cảnh AI. */
  memory?: string | null;
}

/** Nhãn trạng thái thân thiện cho bé. */
export function statusLabel(p: LessonProgress): string {
  if (p.status === "da-thi") {
    return p.best_score != null ? `Đã thi · ${p.best_score} điểm` : "Đã thi";
  }
  if (p.status === "da-hoc") return "Đã học";
  return "Chưa học";
}

/** Emoji đại diện cho bài học, dò theo từ khoá chủ đề; mặc định 📘. */
export function lessonEmoji(lesson: {
  title?: string | null;
  core_topic?: string | null;
}): string {
  const text = `${lesson.title ?? ""} ${lesson.core_topic ?? ""}`.toLowerCase();
  const map: [string, string][] = [
    ["số", "🔢"],
    ["đếm", "🔢"],
    ["hình", "🔷"],
    ["màu", "🎨"],
    ["chữ", "🔤"],
    ["đọc", "📖"],
    ["viết", "✍️"],
    ["động vật", "🐯"],
    ["con vật", "🐯"],
    ["gia đình", "👨‍👩‍👧"],
    ["cơ thể", "🧒"],
    ["cảm xúc", "😊"],
    ["thiên nhiên", "🌳"],
    ["quả", "🍎"],
    ["trái", "🍎"],
    ["đồ ăn", "🍚"],
    ["trường", "🏫"],
    ["phép", "➕"],
    ["tiếng anh", "🇬🇧"],
    ["tiếng việt", "🇻🇳"],
    ["khoa học", "🔬"],
    ["kể chuyện", "🗣️"],
  ];
  for (const [key, emoji] of map) {
    if (text.includes(key)) return emoji;
  }
  return "📘";
}
