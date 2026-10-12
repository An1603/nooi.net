import { describe, it, expect, vi } from "vitest";
import {
  classifyContentType,
  isAllowedHost,
  isAllowedPort,
  isBlockedAddress,
  isHttpUrl,
  isYouTubeUrl,
  validateMediaUrl,
  type DnsAddress,
  type DnsLookupLike,
  type MediaFetchLike,
} from "@/lib/ekid/media-validate";

/** Response giả tối thiểu (cần ok + status + headers.get + body.cancel). */
function fakeRes(contentType: string | null, ok = true, status = 200): Response {
  return {
    ok,
    status,
    headers: {
      get: (k: string) => {
        const key = k.toLowerCase();
        if (key === "content-type") return contentType;
        return null;
      },
    },
    body: { cancel: async () => {} },
  } as unknown as Response;
}

/** Response redirect giả (3xx + Location). */
function redirectRes(location: string, status = 302): Response {
  return {
    ok: false,
    status,
    headers: {
      get: (k: string) => (k.toLowerCase() === "location" ? location : null),
    },
    body: { cancel: async () => {} },
  } as unknown as Response;
}

// Lookup giả: hostname công khai → IP công khai; không bao giờ chạm DNS thật.
const PUBLIC_IP = "93.184.216.34";
const publicLookup: DnsLookupLike = async () => [{ address: PUBLIC_IP, family: 4 }];
const privateLookup: DnsLookupLike = async () => [{ address: "10.1.2.3", family: 4 }];
const failingLookup: DnsLookupLike = async () => {
  throw new Error("ENOTFOUND");
};
// Host "kép": trả BẢN GHI hỗn hợp (một công khai, một nội bộ) → phải bị chặn.
const mixedLookup: DnsLookupLike = async () => [
  { address: PUBLIC_IP, family: 4 },
  { address: "127.0.0.1", family: 4 },
];

/** Fetch giả trả image/png — dùng cho các ca hợp lệ. */
const imageFetch = (() => vi.fn(async () => fakeRes("image/png")))() as unknown as MediaFetchLike;

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

  it("isAllowedPort chỉ cho port mặc định 80/443 (hoặc rỗng)", () => {
    expect(isAllowedPort("")).toBe(true);
    expect(isAllowedPort("80")).toBe(true);
    expect(isAllowedPort("443")).toBe(true);
    expect(isAllowedPort("8080")).toBe(false);
    expect(isAllowedPort("6379")).toBe(false);
    expect(isAllowedPort("22")).toBe(false);
  });
});

describe("media-validate — isBlockedAddress (SSRF, tĩnh)", () => {
  it("chặn hostname nội bộ / metadata", () => {
    expect(isBlockedAddress("localhost")).toBe(true);
    expect(isBlockedAddress("LOCALHOST")).toBe(true);
    expect(isBlockedAddress("foo.localhost")).toBe(true);
    expect(isBlockedAddress("nas.local")).toBe(true);
    expect(isBlockedAddress("cache.internal")).toBe(true);
    expect(isBlockedAddress("metadata.google.internal")).toBe(true);
  });

  it("chặn IPv4 nội bộ/riêng tư/link-local/CGNAT/multicast/reserved", () => {
    expect(isBlockedAddress("127.0.0.1")).toBe(true);
    expect(isBlockedAddress("127.9.9.9")).toBe(true);
    expect(isBlockedAddress("10.0.0.5")).toBe(true);
    expect(isBlockedAddress("172.16.0.9")).toBe(true);
    expect(isBlockedAddress("172.31.255.255")).toBe(true);
    expect(isBlockedAddress("192.168.1.1")).toBe(true);
    expect(isBlockedAddress("169.254.169.254")).toBe(true);
    expect(isBlockedAddress("100.64.0.1")).toBe(true);
    expect(isBlockedAddress("0.0.0.0")).toBe(true);
    expect(isBlockedAddress("224.0.0.1")).toBe(true);
    expect(isBlockedAddress("240.0.0.1")).toBe(true);
    expect(isBlockedAddress("255.255.255.255")).toBe(true);
  });

  it("chặn dải đặc biệt: IETF/TEST-NET/benchmarking/6to4", () => {
    expect(isBlockedAddress("192.0.0.1")).toBe(true); // 192.0.0.0/24 IETF
    expect(isBlockedAddress("192.0.2.1")).toBe(true); // TEST-NET-1
    expect(isBlockedAddress("198.18.0.1")).toBe(true); // benchmarking
    expect(isBlockedAddress("198.19.255.255")).toBe(true); // benchmarking (biên trên)
    expect(isBlockedAddress("198.51.100.1")).toBe(true); // TEST-NET-2
    expect(isBlockedAddress("203.0.113.1")).toBe(true); // TEST-NET-3
    expect(isBlockedAddress("2002:7f00:1::")).toBe(true); // 6to4
  });

  it("chặn IPv6 loopback/ULA/link-local/IPv4-mapped", () => {
    expect(isBlockedAddress("::1")).toBe(true);
    expect(isBlockedAddress("[::1]")).toBe(true);
    expect(isBlockedAddress("fc00::1")).toBe(true);
    expect(isBlockedAddress("fd12:3456::1")).toBe(true);
    expect(isBlockedAddress("fe80::1")).toBe(true);
    expect(isBlockedAddress("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedAddress("::ffff:7f00:1")).toBe(true);
    expect(isBlockedAddress("::")).toBe(true);
  });

  it("KHÔNG chặn IP công khai / hostname thường", () => {
    expect(isBlockedAddress("8.8.8.8")).toBe(false);
    expect(isBlockedAddress("172.15.0.1")).toBe(false);
    expect(isBlockedAddress("192.167.1.1")).toBe(false);
    expect(isBlockedAddress("2606:4700::1111")).toBe(false);
    expect(isBlockedAddress("cdn.example.com")).toBe(false);
  });
});

describe("media-validate — isAllowedHost (SSRF + DNS)", () => {
  it("hostname thường: phân giải công khai → cho phép; nội bộ/lỗi → chặn", async () => {
    expect(await isAllowedHost("cdn.example.com", publicLookup)).toBe(true);
    expect(await isAllowedHost("intranet.corp", privateLookup)).toBe(false);
    expect(await isAllowedHost("nowhere.example", failingLookup)).toBe(false);
    // Một bản ghi nội bộ trong tập kết quả → chặn toàn bộ.
    expect(await isAllowedHost("rebind.example", mixedLookup)).toBe(false);
  });

  it("địa chỉ bị chặn bị từ chối TRƯỚC khi chạm DNS", async () => {
    const spy = vi.fn(publicLookup);
    expect(await isAllowedHost("127.0.0.1", spy)).toBe(false);
    expect(await isAllowedHost("metadata.google.internal", spy)).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("media-validate — validateMediaUrl", () => {
  it("URL sai scheme → ok:false, KHÔNG gọi mạng", async () => {
    const doFetch = vi.fn() as unknown as MediaFetchLike;
    const r = await validateMediaUrl("javascript:alert(1)", doFetch, publicLookup);
    expect(r).toEqual({ ok: false, kind: null, contentType: null });
    expect(doFetch).not.toHaveBeenCalled();
  });

  it("URL rỗng → ok:false", async () => {
    const r = await validateMediaUrl("   ");
    expect(r.ok).toBe(false);
  });

  it("link YouTube → ok:true, kind video, không gọi mạng", async () => {
    const doFetch = vi.fn() as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://youtu.be/abc123", doFetch, publicLookup);
    expect(r.ok).toBe(true);
    expect(r.kind).toBe("video");
    expect(doFetch).not.toHaveBeenCalled();
  });

  it("HEAD trả image/* → ok:true kind image", async () => {
    const doFetch = vi.fn(async () => fakeRes("image/png")) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.example/a.png", doFetch, publicLookup);
    expect(r).toEqual({ ok: true, kind: "image", contentType: "image/png" });
    expect(doFetch).toHaveBeenCalledTimes(1);
    const calls = (doFetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
    expect(calls[0][1].method).toBe("HEAD");
    // (SSRF) fetch không được tự đi theo redirect.
    expect(calls[0][1].redirect).toBe("manual");
  });

  it("HEAD bị chặn (405) → fallback GET Range → video", async () => {
    const doFetch = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === "HEAD" ? fakeRes(null, false, 405) : fakeRes("video/mp4"),
    ) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.example/movie.mp4", doFetch, publicLookup);
    expect(r).toEqual({ ok: true, kind: "video", contentType: "video/mp4" });
    const calls = (doFetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
    expect(calls[1][1].method).toBe("GET");
    expect((calls[1][1].headers as Record<string, string>).Range).toBe("bytes=0-0");
  });

  it("HEAD ok nhưng thiếu content-type → thử GET", async () => {
    const doFetch = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === "HEAD" ? fakeRes(null, true) : fakeRes("image/webp"),
    ) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.example/a.webp", doFetch, publicLookup);
    expect(r).toEqual({ ok: true, kind: "image", contentType: "image/webp" });
  });

  it("content-type không phải ảnh/video → ok:false nhưng giữ contentType", async () => {
    const doFetch = vi.fn(async () => fakeRes("text/html")) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://example.com/page", doFetch, publicLookup);
    expect(r.ok).toBe(false);
    expect(r.kind).toBeNull();
    expect(r.contentType).toBe("text/html");
  });

  it("mạng lỗi (ngoại lệ) → KHÔNG ném, trả ok:false", async () => {
    const doFetch = vi.fn(async () => {
      throw new Error("boom");
    }) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://down.example/a.png", doFetch, publicLookup);
    expect(r).toEqual({ ok: false, kind: null, contentType: null });
  });
});

describe("media-validate — SSRF: URL nội bộ phải ok:false + KHÔNG gọi mạng", () => {
  const blockedUrls = [
    "http://127.0.0.1/",
    "http://127.0.0.1:80/x.png",
    "http://localhost/x.png",
    "http://foo.localhost/x.png",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.0.5/x.jpg",
    "http://172.16.0.9/x.jpg",
    "http://192.168.1.1/x.jpg",
    "http://100.64.0.1/x.jpg",
    "http://0.0.0.0/x.jpg",
    "http://[::1]/x.jpg",
    "http://[fc00::1]/x.jpg",
    "http://[fe80::1]/x.jpg",
    "http://[::ffff:127.0.0.1]/x.jpg",
    "http://metadata.google.internal/computeMetadata/v1/",
    "http://nas.local/x.jpg",
    "http://cache.internal/x.jpg",
    // IPv4 viết kiểu khác nhưng Node chuẩn hoá về 127.0.0.1
    "http://2130706433/x.jpg",
    "http://0x7f000001/x.jpg",
  ];

  for (const url of blockedUrls) {
    it(`${url} → ok:false, không gọi mạng`, async () => {
      const doFetch = vi.fn() as unknown as MediaFetchLike;
      const r = await validateMediaUrl(url, doFetch, publicLookup);
      expect(r.ok).toBe(false);
      expect(r.kind).toBeNull();
      expect(doFetch).not.toHaveBeenCalled();
    });
  }

  it("port lạ (8080) → ok:false dù host công khai", async () => {
    const doFetch = vi.fn() as unknown as MediaFetchLike;
    const r = await validateMediaUrl("http://cdn.example.com:8080/x.png", doFetch, publicLookup);
    expect(r.ok).toBe(false);
    expect(doFetch).not.toHaveBeenCalled();
  });

  it("port nội bộ nguy hiểm (6379) → ok:false", async () => {
    const doFetch = vi.fn() as unknown as MediaFetchLike;
    const r = await validateMediaUrl("http://127.0.0.1:6379/", doFetch, publicLookup);
    expect(r.ok).toBe(false);
    expect(doFetch).not.toHaveBeenCalled();
  });

  it("DNS phân giải về IP nội bộ → ok:false, không gọi mạng", async () => {
    const doFetch = vi.fn() as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://rebind.example/x.png", doFetch, privateLookup);
    expect(r.ok).toBe(false);
    expect(doFetch).not.toHaveBeenCalled();
  });

  it("DNS lookup lỗi → ok:false (best-effort)", async () => {
    const doFetch = vi.fn() as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://nowhere.example/x.png", doFetch, failingLookup);
    expect(r.ok).toBe(false);
    expect(doFetch).not.toHaveBeenCalled();
  });
});

describe("media-validate — SSRF: redirect phải kiểm lại từng hop", () => {
  it("redirect sang địa chỉ nội bộ → ok:false, KHÔNG follow", async () => {
    const doFetch = vi.fn(async () => redirectRes("http://169.254.169.254/")) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.example/x.png", doFetch, publicLookup);
    expect(r.ok).toBe(false);
    // KHÔNG request nào chạm tới host nội bộ — chỉ gọi lại URL gốc (HEAD rồi GET).
    const urls = (doFetch as unknown as { mock: { calls: [string][] } }).mock.calls.map((c) => c[0]);
    expect(urls.length).toBeGreaterThan(0);
    for (const u of urls) expect(u).toBe("https://cdn.example/x.png");
  });

  it("redirect sang localhost → ok:false", async () => {
    const doFetch = vi.fn(async () => redirectRes("http://localhost/secret")) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.example/x.png", doFetch, publicLookup);
    expect(r.ok).toBe(false);
  });

  it("redirect sang port lạ → ok:false", async () => {
    const doFetch = vi.fn(async () => redirectRes("http://cdn.example.com:9000/x.png")) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.example/x.png", doFetch, publicLookup);
    expect(r.ok).toBe(false);
  });

  it("redirect sang https công khai rồi trả ảnh → ok:true", async () => {
    const doFetch = vi.fn(async (url: string) =>
      url === "https://cdn.example/x.png"
        ? redirectRes("https://cdn2.example/y.png")
        : fakeRes("image/jpeg"),
    ) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.example/x.png", doFetch, publicLookup);
    expect(r).toEqual({ ok: true, kind: "image", contentType: "image/jpeg" });
  });

  it("quá nhiều hop redirect (>3) → ok:false", async () => {
    // Mỗi hop trỏ sang một host công khai khác → vượt giới hạn hop.
    let n = 0;
    const doFetch = vi.fn(async () => {
      n += 1;
      return redirectRes(`https://hop${n}.example/z.png`);
    }) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.example/x.png", doFetch, publicLookup);
    expect(r.ok).toBe(false);
  });

  it("redirect thiếu Location → ok:false", async () => {
    const doFetch = vi.fn(async () => redirectRes("")) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.example/x.png", doFetch, publicLookup);
    expect(r.ok).toBe(false);
  });
});

describe("media-validate — link công khai vẫn hoạt động", () => {
  it("ảnh công khai (HEAD image/*) vẫn ok:true", async () => {
    const r = await validateMediaUrl("https://cdn.public-example.com/a.png", imageFetch, publicLookup);
    expect(r.ok).toBe(true);
    expect(r.kind).toBe("image");
  });

  it("video công khai (GET fallback) vẫn ok:true", async () => {
    const doFetch = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === "HEAD" ? fakeRes(null, false, 405) : fakeRes("video/mp4"),
    ) as unknown as MediaFetchLike;
    const r = await validateMediaUrl("https://cdn.public-example.com/v.mp4", doFetch, publicLookup);
    expect(r.ok).toBe(true);
    expect(r.kind).toBe("video");
  });

  it("hostname công khai với DnsAddress đúng kiểu vẫn được chấp nhận", async () => {
    const lookup: DnsLookupLike = async (): Promise<DnsAddress[]> => [
      { address: PUBLIC_IP, family: 4 },
      { address: "2606:4700::1111", family: 6 },
    ];
    const r = await validateMediaUrl("https://cdn.public-example.com/a.png", imageFetch, lookup);
    expect(r.ok).toBe(true);
  });
});
