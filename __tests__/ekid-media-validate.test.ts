import { describe, it, expect, vi } from "vitest";
import {
  classifyContentType,
  isHttpUrl,
  isYouTubeUrl,
  validateMediaUrl,
  type MediaFetchLike,
} from "@/lib/ekid/media-validate";

/** Response giả tối thiểu (chỉ cần ok + headers.get + body.cancel). */
function fakeRes(contentType: string | null, ok = true): Response {
  return {
    ok,
    headers: {
      get: (k: string) => (k.toLowerCase() === "content-type" ? contentType : null),
    },
    body: { cancel: async () => {} },
  } as unknown as Response;
}

describe("media-validate — hàm thuần", () => {
  it("isHttpUrl chỉ nhận http/https, chặn scheme nguy hiểm", () => {
    expect(isHttpUrl("https://a.com/x.jpg")).toBe(true);
    expect(isHttpUrl("http://a.com/x.mp4")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("data:image/png;base64,AAAA")).toBe(false);
    expect(isHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isHttpUrl("vbscript:msgbox")).toBe(false);
    expect(isHttpUrl("không-phải-url")).toBe(false);
  });

  it("isYouTubeUrl nhận các dạng link YouTube", () => {
    expect(isYouTubeUrl("https://www.youtube.com/watch?v=abc")).toBe(true);
    expect(isYouTubeUrl("https://youtu.be/abc")).toBe(true);
    expect(isYouTubeUrl("https://m.youtube.com/watch?v=abc")).toBe(true);
    expect(isYouTubeUrl("https://music.youtube.com/watch?v=abc")).toBe(true);
    expect(isYouTubeUrl("https://youtube-nocookie.com/embed/abc")).toBe(true);
    expect(isYouTubeUrl("https://example.com/watch?v=abc")).toBe(false);
  });

  it("classifyContentType quy về image/video hoặc null", () => {
    expect(classifyContentType("image/png")).toBe("image");
    expect(classifyContentType("IMAGE/JPEG; charset=utf-8")).toBe("image");
    expect(classifyContentType("video/mp4")).toBe("video");
    expect(classifyContentType("text/html")).toBeNull();
    expect(classifyContentType("application/json")).toBeNull();
    expect(classifyContentType(null)).toBeNull();
  });
});

describe("media-validate — validateMediaUrl", () => {
  it("URL sai scheme → ok:false, KHÔNG gọi mạng", async () => {
    const doFetch = vi.fn() as unknown as MediaFetchLike;
    const r = await validateMediaUrl("javascript:alert(1)", doFetch);
    expect(r).toEqual({ ok: false, kind: null, contentType: null });
    expect(doFetch).not.toHaveBeenCalled();
  });

  it("URL rỗng → ok:false", async () => {
    const r = await validateMediaUrl("   ");
    expect(r.ok).toBe(false);
  });

  it("link YouTube → ok:true, kind video, không gọi mạng", async () => {
    const doFetch = vi.fn() as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://youtu.be/abc123", doFetch);
    expect(r.ok).toBe(true);
    expect(r.kind).toBe("video");
    expect(doFetch).not.toHaveBeenCalled();
  });

  it("HEAD trả image/* → ok:true kind image", async () => {
    const doFetch = vi.fn(async () => fakeRes("image/png")) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.example/a.png", doFetch);
    expect(r).toEqual({ ok: true, kind: "image", contentType: "image/png" });
    expect(doFetch).toHaveBeenCalledTimes(1);
    expect((doFetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0][1].method).toBe("HEAD");
  });

  it("HEAD bị chặn (405) → fallback GET Range → video", async () => {
    const doFetch = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === "HEAD" ? fakeRes(null, false) : fakeRes("video/mp4"),
    ) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.example/movie.mp4", doFetch);
    expect(r).toEqual({ ok: true, kind: "video", contentType: "video/mp4" });
    const calls = (doFetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
    expect(calls[1][1].method).toBe("GET");
    expect((calls[1][1].headers as Record<string, string>).Range).toBe("bytes=0-0");
  });

  it("HEAD ok nhưng thiếu content-type → thử GET", async () => {
    const doFetch = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === "HEAD" ? fakeRes(null, true) : fakeRes("image/webp"),
    ) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.example/a.webp", doFetch);
    expect(r).toEqual({ ok: true, kind: "image", contentType: "image/webp" });
  });

  it("content-type không phải ảnh/video → ok:false nhưng giữ contentType", async () => {
    const doFetch = vi.fn(async () => fakeRes("text/html")) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://example.com/page", doFetch);
    expect(r.ok).toBe(false);
    expect(r.kind).toBeNull();
    expect(r.contentType).toBe("text/html");
  });

  it("mạng lỗi (ngoại lệ) → KHÔNG ném, trả ok:false", async () => {
    const doFetch = vi.fn(async () => {
      throw new Error("boom");
    }) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://down.example/a.png", doFetch);
    expect(r).toEqual({ ok: false, kind: null, contentType: null });
  });
});
