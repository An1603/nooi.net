/**
 * Gắn tài liệu trình bày (slide) cho từng dự án đầu tư.
 *
 * Thứ tự ưu tiên:
 *   1. `projects.slide_html_url` trong DB (nếu cột đã được thêm)
 *   2. Ánh xạ tường minh theo TÊN dự án (dưới đây) — thêm 1 dòng khi có dự án mới
 *   3. Không có → trả "" (KHÔNG suy slug từ tiêu đề, tránh link hỏng)
 */

export const PROJECT_DECK_URLS: Record<string, string> = {
  "NOOI Forest": "https://slides.nooi.net/nooi-forest/",
};

/** Tài liệu bổ sung (ngoài slide của chính dự án) — theo tên dự án */
export const PROJECT_EXTRA_DOCS: Record<string, Array<{ label: string; url: string }>> = {
  "NOOI Forest": [
    { label: "Cấu trúc NOOI — Bản FINAL v5", url: "https://slides.nooi.net/cau-truc-nooi/" },
  ],
};

export function resolveProjectDocs(project: {
  title?: string | null;
  slide_html_url?: string | null;
}): Array<{ label: string; url: string }> {
  const docs: Array<{ label: string; url: string }> = [];
  const deck = resolveDeckUrl(project);
  if (deck) docs.push({ label: "Hồ sơ dự án (slide)", url: deck });
  const key = (project.title ?? "").trim();
  for (const d of PROJECT_EXTRA_DOCS[key] ?? []) docs.push(d);
  return docs;
}

export function resolveDeckUrl(project: {
  title?: string | null;
  slide_html_url?: string | null;
}): string {
  const fromDb = (project.slide_html_url ?? "").trim();
  if (fromDb) return fromDb;
  const key = (project.title ?? "").trim();
  return PROJECT_DECK_URLS[key] ?? "";
}