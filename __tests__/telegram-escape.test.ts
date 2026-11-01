import { describe, expect, it } from "vitest";
import { escapeTelegramHtml, safeHttpUrl } from "@/lib/telegram/escape";

/** Hồi quy audit run-1: dữ liệu từ DB không được tạo thẻ/link trong tin nhắn bot. */
describe("escapeTelegramHtml", () => {
  it("vô hiệu hoá thẻ HTML do thành viên chèn", () => {
    const attack = '</b><a href="https://evil.example/xac-minh">NOOI: tài khoản sắp bị khoá</a><b>';
    const out = escapeTelegramHtml(attack);
    expect(out).not.toContain("<a ");
    expect(out).not.toContain("</b>");
    expect(out).toContain("&lt;a href=&quot;".replace("&quot;", '"'));
    expect(out).toContain("&gt;");
  });

  it("escape dấu & trước để không tạo entity lồng", () => {
    expect(escapeTelegramHtml("A & B < C")).toBe("A &amp; B &lt; C");
    expect(escapeTelegramHtml("&lt;b&gt;")).toBe("&amp;lt;b&amp;gt;");
  });

  it("giá trị null/undefined thành chuỗi rỗng", () => {
    expect(escapeTelegramHtml(null)).toBe("");
    expect(escapeTelegramHtml(undefined)).toBe("");
  });
});

describe("safeHttpUrl", () => {
  it("nhận http/https", () => {
    expect(safeHttpUrl("https://meet.nooi.net/phong")).toBe("https://meet.nooi.net/phong");
    expect(safeHttpUrl("http://127.0.0.1/x")).toBe("http://127.0.0.1/x");
  });

  it("loại bỏ scheme khác và chuỗi không phải URL", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBe("");
    expect(safeHttpUrl("data:text/html,<script>")).toBe("");
    expect(safeHttpUrl("//evil.example/x")).toBe("");
    expect(safeHttpUrl("evil.example/x")).toBe("");
    expect(safeHttpUrl(null)).toBe("");
  });
});
