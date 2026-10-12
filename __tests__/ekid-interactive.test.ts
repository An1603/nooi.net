import { describe, it, expect } from "vitest";
import {
  EKID_TOOLS,
  toolsPromptSection,
  isExerciseItem,
  isMediaItem,
} from "@/lib/ekid/interactive";
import { BAND_ADDRESS, buildSystemInstruction } from "@/lib/ekid/ekid-system";
import { normalizeTurns } from "@/lib/ekid/kid-memory";

describe("ekid interactive — EKID_TOOLS", () => {
  it("có 2 khai báo: show_exercise và show_media", () => {
    const names = EKID_TOOLS.map((t) => t.name);
    expect(names).toEqual(["show_exercise", "show_media"]);
  });

  it("show_exercise yêu cầu question + options", () => {
    const ex = EKID_TOOLS.find((t) => t.name === "show_exercise");
    expect(ex).toBeDefined();
    expect(ex?.parameters.type).toBe("object");
    expect(ex?.parameters.required).toContain("question");
    expect(ex?.parameters.required).toContain("options");
    const props = ex?.parameters.properties as Record<string, { type?: string }>;
    expect(props.options.type).toBe("array");
    expect(props.answer_index.type).toBe("integer");
  });

  it("show_media yêu cầu url + kind (image | video)", () => {
    const md = EKID_TOOLS.find((t) => t.name === "show_media");
    expect(md?.parameters.required).toContain("url");
    expect(md?.parameters.required).toContain("kind");
    const props = md?.parameters.properties as Record<string, { enum?: string[] }>;
    expect(props.kind.enum).toEqual(["image", "video"]);
  });
});

describe("ekid interactive — toolsPromptSection", () => {
  it("mô tả 2 công cụ và hướng dẫn khi nào dùng", () => {
    const p = toolsPromptSection();
    expect(p).toContain("show_exercise");
    expect(p).toContain("show_media");
    expect(p.toLowerCase()).toContain("bài tập");
    expect(p.toLowerCase()).toContain("ảnh");
  });
});

describe("ekid interactive — phân loại item", () => {
  it("isExerciseItem / isMediaItem loại đúng", () => {
    const ex = {
      id: "e1",
      kind: "exercise" as const,
      question: "1+1?",
      options: ["1", "2"],
      answerIndex: 1,
    };
    const md = { id: "m1", kind: "media" as const, url: "x.jpg", mediaType: "image" as const };
    expect(isExerciseItem(ex)).toBe(true);
    expect(isMediaItem(ex)).toBe(false);
    expect(isMediaItem(md)).toBe(true);
    expect(isExerciseItem(md)).toBe(false);
  });
});

describe("ekid — BAND_ADDRESS", () => {
  it("gọi học sinh theo lứa tuổi", () => {
    expect(BAND_ADDRESS["mam-non"].student).toBe("con");
    expect(BAND_ADDRESS["tieu-hoc"].student).toBe("con");
    expect(BAND_ADDRESS["thieu-nien"].student).toBe("em");
  });
});

describe("ekid — buildSystemInstruction persona & xưng hô", () => {
  const base = { kidName: "Bo" };

  it("mầm non: AI tự xưng thầy/cô và gọi 'con'", () => {
    const s = buildSystemInstruction({
      ...base,
      placement: { ageBand: "mam-non", level: 1 },
    });
    expect(s).toContain('"thầy AI"');
    expect(s).toContain('gọi con');
    expect(s).toContain('Bo');
    // không xưng "tôi" lạnh lùng
    expect(s).toContain('KHÔNG xưng "tôi"');
  });

  it("thiếu niên: gọi 'em'", () => {
    const s = buildSystemInstruction({
      ...base,
      placement: { ageBand: "thieu-nien", level: 2 },
    });
    expect(s).toContain('gọi em');
  });

  it("chèn mục CÔNG CỤ (toolsPromptSection)", () => {
    const s = buildSystemInstruction({
      ...base,
      placement: { ageBand: "tieu-hoc", level: 1 },
    });
    expect(s).toContain("CÔNG CỤ HIỂN THỊ LÊN MÀN HÌNH");
    expect(s).toContain("show_exercise");
    expect(s).toContain("show_media");
  });
});

describe("ekid memory — normalizeTurns giữ lượt công cụ (role tool)", () => {
  it("giữ role tool, bỏ role lạ", () => {
    const out = normalizeTurns([
      { role: "user", text: "chào" },
      { role: "tool", text: "AI hiện bài tập lên màn hình." },
      { role: "system", text: "bỏ qua" },
      { role: "ai", text: "ừ" },
    ]);
    expect(out).toEqual([
      { role: "user", text: "chào" },
      { role: "tool", text: "AI hiện bài tập lên màn hình." },
      { role: "ai", text: "ừ" },
    ]);
  });
});
