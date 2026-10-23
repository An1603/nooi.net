import { describe, expect, it } from "vitest";
import {
  canonicalize,
  gradeSpokenAnswer,
  replaceNumberWords,
  stripDiacritics,
  viWordsToNumber,
} from "@/lib/ekid/answer-grade";

/**
 * Đây là bộ test bảo vệ đúng thứ khiến phụ huynh bỏ app: bé nói ĐÚNG mà bị chấm SAI.
 * Mọi ca dưới đây lấy từ chính ngân hàng câu hỏi lớp 3 đang chạy.
 */
describe("đọc số tiếng Việt → chữ số", () => {
  const cases: Array<[string, number]> = [
    ["bon muoi lam nghin hai tram ba muoi", 45230],
    ["bay muoi nghin khong tram linh nam", 70005],
    ["chin tram", 900],
    ["muoi", 10],
    ["muoi lam", 15],
    ["hai muoi mot", 21],
    ["hai muoi tu", 24],
    ["mot tram hai muoi ba", 123],
    ["sau muoi nghin", 60000],
    ["ba nghin bon tram", 3400],
    ["ba nghin khong tram bon muoi", 3040],
    ["mot trieu hai tram nghin", 1200000],
  ];
  for (const [words, n] of cases) {
    it(`"${words}" → ${n}`, () => {
      expect(viWordsToNumber(words.split(" "))).toBe(n);
    });
  }

  it("cụm không phải số → null", () => {
    expect(viWordsToNumber(["con", "meo"])).toBeNull();
  });
});

describe("thay cụm từ-số trong câu nói", () => {
  it("đổi giữa câu, giữ nguyên phần chữ", () => {
    expect(replaceNumberWords("da bon muoi lam nghin hai tram ba muoi a")).toBe("da 45230 a");
  });
  it("'năm' đứng trước năm 4 chữ số thì giữ nguyên", () => {
    expect(replaceNumberWords("thang 5 nam 2020")).toBe("thang 5 nam 2020");
  });
  it("'năm' trong cụm số vẫn đổi", () => {
    expect(replaceNumberWords("nam tram")).toBe("500");
  });
});

describe("chuẩn hoá đơn vị và dấu hàng nghìn", () => {
  it("xăng-ti-mét ↔ cm", () => {
    expect(canonicalize("năm xăng-ti-mét")).toBe(canonicalize("5cm"));
  });
  it("ki-lô-gam ↔ kg", () => {
    expect(canonicalize("ba ki-lô-gam")).toBe(canonicalize("3kg"));
  });
  it("45 230 / 45.230 / 45,230 về cùng một dạng", () => {
    expect(canonicalize("45 230")).toBe("45230");
    expect(canonicalize("45.230")).toBe("45230");
    expect(canonicalize("45,230")).toBe("45230");
  });
  it("số thập phân 0,5 KHÔNG bị gộp", () => {
    expect(canonicalize("0,5")).toBe("0,5");
  });
  it("bỏ dấu tiếng Việt", () => {
    expect(stripDiacritics("Bốn mươi lăm nghìn")).toBe("bon muoi lam nghin");
  });
});

describe("chấm câu trả lời NÓI — các ca thật", () => {
  const readNumber = { value: "bốn mươi lăm nghìn hai trăm ba mươi" };

  it("bé đọc đúng bằng chữ", () => {
    expect(gradeSpokenAnswer(readNumber, "bốn mươi lăm nghìn hai trăm ba mươi")).toBe(true);
  });
  it("bé đọc đúng, có thêm 'dạ … ạ'", () => {
    expect(gradeSpokenAnswer(readNumber, "dạ bốn mươi lăm nghìn hai trăm ba mươi ạ")).toBe(true);
  });
  it("máy nhận giọng trả về CHỮ SỐ thay vì chữ — vẫn đúng", () => {
    expect(gradeSpokenAnswer(readNumber, "45 230")).toBe(true);
    expect(gradeSpokenAnswer(readNumber, "45.230")).toBe(true);
  });
  it("bé đọc sai hàng → sai", () => {
    expect(gradeSpokenAnswer(readNumber, "bốn mươi lăm nghìn hai trăm linh ba")).toBe(false);
  });
  it("bé đọc sai hẳn → sai", () => {
    expect(gradeSpokenAnswer(readNumber, "năm nghìn hai trăm ba mươi")).toBe(false);
  });

  const writeNumber = { value: "70 005", alt: ["70005"] };
  it("đáp án là chữ số, bé nói bằng chữ — vẫn đúng", () => {
    expect(gradeSpokenAnswer(writeNumber, "bảy mươi nghìn không trăm linh năm")).toBe(true);
  });

  const choiceB = { value: "B" };
  it("chọn B: bé nói 'đáp án bê'", () => {
    expect(gradeSpokenAnswer(choiceB, "đáp án bê")).toBe(true);
  });
  it("chọn B: bé nói 'chọn b'", () => {
    expect(gradeSpokenAnswer(choiceB, "chọn b")).toBe(true);
  });
  it("chọn B nhưng bé nói A → sai", () => {
    expect(gradeSpokenAnswer(choiceB, "đáp án a")).toBe(false);
  });

  const place = { value: "hàng chục nghìn" };
  it("câu trả lời là cụm từ, bé nói cả câu chứa cụm → đúng", () => {
    expect(gradeSpokenAnswer(place, "chữ số 7 thuộc hàng chục nghìn ạ")).toBe(true);
  });
  it("bé nói hàng khác → sai", () => {
    expect(gradeSpokenAnswer(place, "hàng nghìn")).toBe(false);
  });

  const unit = { value: "5cm" };
  it("đơn vị: bé nói 'năm xăng-ti-mét'", () => {
    expect(gradeSpokenAnswer(unit, "năm xăng-ti-mét")).toBe(true);
  });

  it("không có đáp án → luôn sai (không khen bừa)", () => {
    expect(gradeSpokenAnswer(null, "bất cứ điều gì")).toBe(false);
    expect(gradeSpokenAnswer({ value: "" }, "bất cứ điều gì")).toBe(false);
  });
});
