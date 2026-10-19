import { describe, it, expect } from "vitest";
import {
  filterLessonsByQuery,
  filterLessonsBySubject,
  libraryViewMode,
  subjectChips,
} from "@/lib/ekid/lesson-filter";

type L = { title: string; subject?: string | null; core_topic?: string | null };

const lessons: L[] = [
  { title: "Cộng trừ trong phạm vi 20", subject: "toan", core_topic: "Toán cơ bản" },
  { title: "Đọc hiểu đoạn ngắn", subject: "tieng-viet", core_topic: "Đọc hiểu" },
  { title: "Chính tả cơ bản", subject: "tieng-viet", core_topic: "Viết đúng chính tả" },
  { title: "Bài chưa gán", subject: null, core_topic: null },
];

describe("ekid lesson-filter — chip chủ đề", () => {
  it("luôn có 'Tất cả' đứng đầu với tổng số bài", () => {
    const chips = subjectChips(lessons, "tieu-hoc");
    expect(chips[0]).toMatchObject({ slug: null, label: "Tất cả", count: 4 });
  });

  it("chỉ sinh chip cho chủ đề CÓ BÀI (không có ô trống)", () => {
    const slugs = subjectChips(lessons, "tieu-hoc").map((c) => c.slug);
    expect(slugs).toContain("toan");
    expect(slugs).toContain("tieng-viet");
    // Chủ đề hợp lệ nhưng không có bài trong dữ liệu → KHÔNG hiện.
    expect(slugs).not.toContain("tieng-anh");
    expect(slugs).not.toContain("khoa-hoc-tu-nhien");
  });

  it("đếm đúng số bài mỗi chủ đề", () => {
    const byslug = new Map(subjectChips(lessons, "tieu-hoc").map((c) => [c.slug, c.count]));
    expect(byslug.get("toan")).toBe(1);
    expect(byslug.get("tieng-viet")).toBe(2);
  });

  it("sắp theo thứ tự của lứa tuổi (Toán trước Tiếng Việt ở tiểu học)", () => {
    const ordered = subjectChips(lessons, "tieu-hoc")
      .map((c) => c.slug)
      .filter((s): s is string => s !== null);
    expect(ordered.indexOf("toan")).toBeLessThan(ordered.indexOf("tieng-viet"));
  });

  it("bài chưa gán chủ đề gom vào chip 'Khác' ở cuối", () => {
    const chips = subjectChips(lessons, "tieu-hoc");
    const last = chips[chips.length - 1];
    expect(last.label).toBe("Khác");
    expect(last.count).toBe(1);
  });

  it("không có bài chưa gán → không có chip 'Khác'", () => {
    const only = lessons.filter((l) => l.subject);
    expect(subjectChips(only, "tieu-hoc").some((c) => c.label === "Khác")).toBe(false);
  });

  it("slug lạ (dữ liệu chưa chuẩn hoá) gom vào 'Khác' — không đẻ chip rác", () => {
    const chips = subjectChips([{ title: "X", subject: "mon-moi" }], "tieu-hoc");
    expect(chips.some((c) => c.slug === "mon-moi")).toBe(false);
    const other = chips.find((c) => c.label === "Khác");
    expect(other?.count).toBe(1);
    // Vẫn lọc được bài đó qua chip "Khác".
    expect(filterLessonsBySubject([{ title: "X", subject: "mon-moi" }], "__khac__")).toHaveLength(1);
  });
});

describe("ekid lesson-filter — chế độ hiển thị theo lứa tuổi", () => {
  it("mầm non: KHÔNG có ô tìm chữ, chip to", () => {
    expect(libraryViewMode("mam-non")).toEqual({ showSearch: false, bigChips: true });
  });

  it("tiểu học và thiếu niên: có ô tìm chữ, chip thường", () => {
    expect(libraryViewMode("tieu-hoc")).toEqual({ showSearch: true, bigChips: false });
    expect(libraryViewMode("thieu-nien")).toEqual({ showSearch: true, bigChips: false });
  });

  it("chưa rõ lứa tuổi → có ô tìm chữ (không chặn nhầm người lớn tìm bài)", () => {
    expect(libraryViewMode(null)).toEqual({ showSearch: true, bigChips: false });
  });
});

describe("ekid lesson-filter — lọc", () => {
  it("subject null → trả TẤT CẢ", () => {
    expect(filterLessonsBySubject(lessons, null)).toHaveLength(4);
  });

  it("lọc đúng chủ đề", () => {
    const only = filterLessonsBySubject(lessons, "tieng-viet");
    expect(only.map((l) => l.title)).toEqual(["Đọc hiểu đoạn ngắn", "Chính tả cơ bản"]);
  });

  it("chip 'Khác' → chỉ bài chưa gán", () => {
    const other = filterLessonsBySubject(lessons, "__khac__");
    expect(other.map((l) => l.title)).toEqual(["Bài chưa gán"]);
  });

  it("slug không còn tồn tại → trả TẤT CẢ (bé không thấy màn hình trống)", () => {
    expect(filterLessonsBySubject(lessons, "khong-co")).toHaveLength(4);
  });

  it("tìm theo tên, không phân biệt hoa/thường; rỗng → tất cả", () => {
    expect(filterLessonsByQuery(lessons, "CHÍNH tả").map((l) => l.title)).toEqual([
      "Chính tả cơ bản",
    ]);
    expect(filterLessonsByQuery(lessons, "  ")).toHaveLength(4);
  });

  it("tìm theo core_topic (chủ đề gốc của người soạn bài)", () => {
    expect(filterLessonsByQuery(lessons, "viết đúng").map((l) => l.title)).toEqual([
      "Chính tả cơ bản",
    ]);
  });

  it("không sửa mảng gốc", () => {
    const snapshot = lessons.map((l) => l.title);
    filterLessonsBySubject(lessons, "toan").pop();
    filterLessonsByQuery(lessons, "toán").pop();
    expect(lessons.map((l) => l.title)).toEqual(snapshot);
  });
});
