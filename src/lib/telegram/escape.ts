/**
 * Escape dữ liệu lấy từ DB trước khi ghép vào `parse_mode: "HTML"` của Telegram.
 *
 * Telegram chỉ hiểu một tập thẻ nhỏ (`<b> <i> <u> <s> <a> <code> <pre>`); mọi `<`
 * `>` `&` trong dữ liệu người dùng phải thành entity, nếu không nội dung do thành
 * viên ghi sẽ tạo được liên kết/thẻ mang thương hiệu NOOI (audit 01/11/2026).
 */
export function escapeTelegramHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Chỉ trả URL http/https hợp lệ, còn lại trả "" để bỏ hẳn khỏi tin nhắn. */
export function safeHttpUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (!/^https?:\/\//i.test(raw)) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}
