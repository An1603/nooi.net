import { describe, it, expect } from "vitest";
import {
  sanitizeMediaQuery,
  parseYtDlpSearch,
  pickCommonsImage,
  youtubeWatchUrl,
} from "@/lib/ekid/media-find";

describe("media-find — sanitizeMediaQuery", () => {
  it("gộp khoảng trắng, bỏ ký tự điều khiển", () => {
    expect(sanitizeMediaQuery("  con   mèo\n\tđáng yêu  ")).toBe("con mèo đáng yêu");
  });

  it("rỗng / chỉ khoảng trắng → chuỗi rỗng", () => {
    expect(sanitizeMediaQuery("   ")).toBe("");
    expect(sanitizeMediaQuery("")).toBe("");
  });

  it("cắt tối đa 120 ký tự", () => {
    expect(sanitizeMediaQuery("a".repeat(500)).length).toBe(120);
  });
});

describe("media-find — parseYtDlpSearch", () => {
  it("đọc các dòng '<id>\\t<title>'", () => {
    const out = parseYtDlpSearch(
      "1FpOVqqgusY\tChú Mèo Con - Nhạc Thiếu Nhi\n9phfObS9kxs\tBài Hát Thiếu Nhi Con Vật\n",
    );
    expect(out).toEqual([
      { id: "1FpOVqqgusY", title: "Chú Mèo Con - Nhạc Thiếu Nhi" },
      { id: "9phfObS9kxs", title: "Bài Hát Thiếu Nhi Con Vật" },
    ]);
  });

  it("bỏ dòng hỏng/mã xấu + khử trùng mã, tối đa 5", () => {
    const out = parseYtDlpSearch(
      "abc123\tA\n\tNoId\nbad id with space\tB\nabc123\tA lần 2\n" +
        "id0001\tC1\nid0002\tC2\nid0003\tC3\nid0004\tC4\nid0005\tC5\nid0006\tC6\n",
    );
    expect(out.map((x) => x.id)).toEqual(["abc123", "id0001", "id0002", "id0003", "id0004"]);
  });

  it("rỗng → []", () => {
    expect(parseYtDlpSearch("")).toEqual([]);
    expect(parseYtDlpSearch("\n\n")).toEqual([]);
  });
});

describe("media-find — pickCommonsImage", () => {
  const payload = {
    query: {
      pages: {
        "2": {
          title: "File:Trang web.html",
          imageinfo: [{ mime: "text/html", thumburl: "https://x/page" }],
        },
        "1": {
          title: "File:BEN Bengalian kitten.jpg",
          imageinfo: [{ mime: "image/jpeg", thumburl: "https://thumb.wikimedia.org/abc.jpg" }],
        },
      },
    },
  };

  it("chọn ảnh thật (bỏ qua mục không phải ảnh)", () => {
    expect(pickCommonsImage(payload)).toEqual({
      url: "https://thumb.wikimedia.org/abc.jpg",
      title: "BEN Bengalian kitten.jpg",
    });
  });

  it("không có kết quả → null", () => {
    expect(pickCommonsImage(null)).toBeNull();
    expect(pickCommonsImage({})).toBeNull();
    expect(pickCommonsImage({ query: {} })).toBeNull();
    expect(pickCommonsImage({ query: { pages: {} } })).toBeNull();
  });

  it("chỉ có mục không phải ảnh → null", () => {
    const only = {
      query: { pages: { "9": { title: "File:x", imageinfo: [{ mime: "video/webm", thumburl: "u" }] } } },
    };
    expect(pickCommonsImage(only)).toBeNull();
  });
});

describe("media-find — youtubeWatchUrl", () => {
  it("dựng link watch từ mã video", () => {
    expect(youtubeWatchUrl("dQw4w9WgXcQ")).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });
});
