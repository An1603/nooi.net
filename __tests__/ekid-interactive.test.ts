import { describe, it, expect } from "vitest";
import {
  EKID_TOOLS,
  toolsPromptSection,
  isExerciseItem,
  isMediaItem,
  isNoticeItem,
  gradeExercise,
  describeAnswer,
  optionLetter,
  stageHint,
  answerSpeechInstruction,
  answerNudge,
  proxiedMediaUrl,
  mediaShouldPauseVoice,
} from "@/lib/ekid/interactive";

// `youtubeEmbedSrc` là hàm thuần, an toàn cho client — nhập trực tiếp để kiểm thử.
import { youtubeEmbedSrc } from "@/lib/ekid/youtube";
import { BAND_ADDRESS, buildSystemInstruction } from "@/lib/ekid/ekid-system";
import { normalizeTurns } from "@/lib/ekid/kid-memory";

describe("ekid interactive — EKID_TOOLS", () => {
  it("có 4 khai báo: find_media, show_exercise, show_media, answer_exercise", () => {
    const names = EKID_TOOLS.map((t) => t.name);
    expect(names).toEqual(["find_media", "show_exercise", "show_media", "answer_exercise"]);
  });

  it("find_media yêu cầu query + kind (image|video)", () => {
    const fm = EKID_TOOLS.find((t) => t.name === "find_media");
    expect(fm?.parameters.required).toContain("query");
    expect(fm?.parameters.required).toContain("kind");
    const props = fm?.parameters.properties as Record<string, { enum?: string[] }>;
    expect(props.kind.enum).toEqual(["image", "video"]);
  });

  it("answer_exercise yêu cầu chosen_index (vị trí lựa chọn bé nói)", () => {
    const ans = EKID_TOOLS.find((t) => t.name === "answer_exercise");
    expect(ans).toBeDefined();
    expect(ans?.parameters.required).toContain("chosen_index");
    const props = ans?.parameters.properties as Record<string, { type?: string }>;
    expect(props.chosen_index.type).toBe("integer");
    expect(props.spoken.type).toBe("string");
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
  it("toolsPromptSection: yêu cầu trả lời kết quả VÀ hiện bài tiếp theo trong CÙNG lượt", () => {
    const p = toolsPromptSection();
    // Chống chậm chuyển tiếp: AI không được chờ bé giục mới hiện bài kế tiếp.
    expect(p).toContain("CÙNG");
    expect(p.toLowerCase()).toContain("bài tiếp theo");
  });

  it("toolsPromptSection mô tả các công cụ và hướng dẫn khi nào dùng", () => {
    const p = toolsPromptSection();
    expect(p).toContain("show_exercise");
    expect(p).toContain("find_media");
    expect(p).toContain("show_media");
    // Cách CHÍNH để xem hình/video là TÌM THẬT, không tự bịa link.
    expect(p).toContain("KHÔNG tự bịa link");
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

  it("isNoticeItem nhận diện thông báo nhẹ", () => {
    const notice = { id: "n1", kind: "notice" as const, text: "Không tìm thấy nội dung phù hợp" };
    expect(isNoticeItem(notice)).toBe(true);
    expect(isNoticeItem({ id: "m1", kind: "media" as const, url: "x.jpg", mediaType: "image" as const })).toBe(false);
    expect(isNoticeItem({ id: "e1", kind: "exercise" as const, question: "?", options: ["a"] })).toBe(false);
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

describe("ekid interactive — ghi nhận kết quả 2 đường (bấm màn hình & lời nói)", () => {
  const ex = {
    id: "e1",
    kind: "exercise" as const,
    question: "1+1 bằng mấy?",
    options: ["1", "2", "3"],
    answerIndex: 1,
  };

  it("gradeExercise: bấm trúng đáp án → correct true, nguồn tap", () => {
    expect(gradeExercise(ex, 1, "tap")).toEqual({ chosen_index: 1, correct: true, source: "tap" });
  });

  it("gradeExercise: bấm lệch đáp án → correct false", () => {
    expect(gradeExercise(ex, 0, "tap")).toEqual({ chosen_index: 0, correct: false, source: "tap" });
  });

  it("gradeExercise: trả lời bằng lời → giữ nguyên văn bé nói, nguồn voice", () => {
    expect(gradeExercise(ex, 1, "voice", "  con chọn B  ")).toEqual({
      chosen_index: 1,
      correct: true,
      source: "voice",
      spoken: "con chọn B",
    });
  });

  it("gradeExercise: AI không cho answer_index → KHÔNG chấm đúng/sai", () => {
    expect(gradeExercise({ answerIndex: undefined }, 0, "tap")).toEqual({
      chosen_index: 0,
      source: "tap",
    });
  });

  it("gradeExercise: cắt lời bé nói quá dài (cap 200 ký tự)", () => {
    const long = "a".repeat(500);
    const r = gradeExercise(ex, 0, "voice", long);
    expect(r.spoken?.length).toBe(200);
  });

  it("optionLetter: 0 → A, 25 → Z", () => {
    expect(optionLetter(0)).toBe("A");
    expect(optionLetter(1)).toBe("B");
    expect(optionLetter(25)).toBe("Z");
  });

  it("describeAnswer: nói rõ BẤM hay BẰNG LỜI + kết quả đúng/sai", () => {
    expect(describeAnswer({ chosen_index: 1, correct: true, source: "tap" })).toBe(
      "Bé bấm chọn đáp án B — ĐÚNG.",
    );
    expect(
      describeAnswer({ chosen_index: 0, correct: false, source: "voice", spoken: "con chọn 1" }),
    ).toBe('Bé trả lời bằng lời: "con chọn 1" → chọn đáp án A — SAI.');
  });

  it("describeAnswer: không có đáp án đúng → chỉ ghi nhận, KHÔNG chấm", () => {
    const text = describeAnswer({ chosen_index: 2, source: "voice", spoken: "con nghĩ là ba" });
    expect(text).not.toContain("ĐÚNG");
    expect(text).not.toContain("SAI");
    expect(text).toContain("đã ghi nhận");
  });
});

describe("ekid interactive — answerSpeechInstruction (ÉP AI nói kết quả)", () => {
  it("bấm đúng → đòi AI khen, nêu rõ bé BẤM", () => {
    const s = answerSpeechInstruction({ chosen_index: 1, correct: true, source: "tap" });
    expect(s).toContain("bấm");
    expect(s).toContain("B");
    expect(s).toContain("ĐÚNG");
    expect(s).toContain("khen");
  });

  it("nói sai → đòi AI động viên + gợi mở, nêu rõ bé NÓI", () => {
    const s = answerSpeechInstruction({
      chosen_index: 0,
      correct: false,
      source: "voice",
      spoken: "con chọn một",
    });
    expect(s).toContain("bằng lời");
    expect(s).toContain("SAI");
    expect(s).toContain("động viên");
  });

  it("không có đáp án đúng → vẫn đòi AI phản hồi, KHÔNG chấm đúng/sai", () => {
    const s = answerSpeechInstruction({ chosen_index: 2, source: "tap" });
    expect(s).not.toContain("ĐÚNG");
    expect(s).not.toContain("SAI");
    expect(s).toContain("phản hồi");
  });

  it("answerNudge: nhắc model nói kết quả + hiện bài tiếp theo, có nêu đúng/sai", () => {
    const ok = answerNudge({ chosen_index: 0, correct: true, source: "voice" });
    expect(ok).toContain("A");
    expect(ok).toContain("ĐÚNG");
    expect(ok.toLowerCase()).toContain("bài tiếp theo");
    expect(answerNudge({ chosen_index: 1, correct: false, source: "tap" })).toContain("SAI");
    expect(answerNudge({ chosen_index: 1, source: "tap" })).not.toContain("SAI");
  });
});

describe("ekid interactive — proxiedMediaUrl (ảnh đi qua domain mình)", () => {
  const KID = "11111111-2222-3333-4444-555555555555";

  it("dựng URL proxy có kid_id + url đã mã hoá", () => {
    const out = proxiedMediaUrl(KID, "https://cdn.example/a b.png?x=1");
    expect(out).toBe(
      `/api/ekid/media/proxy?kid_id=${KID}&url=${encodeURIComponent("https://cdn.example/a b.png?x=1")}`,
    );
  });

  it("thiếu kid_id hoặc URL không phải http(s) → null (dùng link gốc)", () => {
    expect(proxiedMediaUrl("", "https://cdn.example/a.png")).toBeNull();
    expect(proxiedMediaUrl(KID, "javascript:alert(1)")).toBeNull();
    expect(proxiedMediaUrl(KID, "data:image/png;base64,AAAA")).toBeNull();
  });
});

describe("ekid interactive — video: tự phát + tạm dừng voice (v3.4.2)", () => {
  it("youtubeEmbedSrc: nhúng nocookie, tự phát, không gợi video lạ", () => {
    const src = youtubeEmbedSrc("dQw4w9WgXcQ");
    expect(src).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(src).toContain("autoplay=1");
    expect(src).toContain("rel=0");
    expect(src).toContain("playsinline=1");
  });

  it("mediaShouldPauseVoice: chỉ VIDEO mới tạm dừng trò chuyện", () => {
    const video = { id: "m1", kind: "media" as const, url: "https://youtu.be/x", mediaType: "video" as const };
    const image = { id: "m2", kind: "media" as const, url: "https://x/a.png", mediaType: "image" as const };
    const ex = { id: "e1", kind: "exercise" as const, question: "1+1?", options: ["1", "2"] };
    const notice = { id: "n1", kind: "notice" as const, text: "..." };
    expect(mediaShouldPauseVoice(video)).toBe(true);
    expect(mediaShouldPauseVoice(image)).toBe(false);
    expect(mediaShouldPauseVoice(ex)).toBe(false);
    expect(mediaShouldPauseVoice(notice)).toBe(false);
    expect(mediaShouldPauseVoice(null)).toBe(false);
  });
});

describe("ekid interactive — stageHint (khung ghi chú cột trái)", () => {
  const ex = {
    id: "e1",
    kind: "exercise" as const,
    question: "1+1?",
    options: ["1", "2"],
    answerIndex: 1,
  };

  it("chưa có nội dung → gợi ý bấm mic", () => {
    expect(stageHint(null, null)).toContain("mic");
  });

  it("bài tập CHƯA trả lời → gợi ý bấm hoặc nói 'con chọn'", () => {
    const h = stageHint(ex, null);
    expect(h).toContain("bấm");
    expect(h).toContain("con chọn");
  });

  it("bài tập ĐÃ trả lời đúng → khen con", () => {
    expect(stageHint(ex, { itemId: "e1", correct: true })).toContain("đúng");
  });

  it("bài tập ĐÃ trả lời sai → động viên, không chê", () => {
    const h = stageHint(ex, { itemId: "e1", correct: false });
    expect(h).not.toContain("sai quá");
    expect(h).toContain("ghi nhận");
  });

  it("kết quả của item KHÁC không ảnh hưởng item đang hiện", () => {
    const h = stageHint(ex, { itemId: "e-old", correct: true });
    expect(h).toContain("con chọn");
  });

  it("media → mời con quan sát", () => {
    const md = { id: "m1", kind: "media" as const, url: "https://x/y.png", mediaType: "image" as const };
    expect(stageHint(md, null)).toContain("xem");
  });

  it("video → báo trò chuyện tạm dừng + cách nói tiếp", () => {
    const vd = { id: "v1", kind: "media" as const, url: "https://youtu.be/x", mediaType: "video" as const };
    const h = stageHint(vd, null);
    expect(h).toContain("tạm dừng");
    expect(h).toContain("▶");
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
