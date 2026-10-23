/**
 * Chấm câu trả lời NÓI của bé lớp 3.
 *
 * Vì sao cần module riêng: máy nhận giọng nói trả về chữ, còn đáp án trong ngân hàng
 * câu hỏi là chữ do người soạn. Hai bên lệch nhau ở ba chỗ rất thường gặp, và nếu so
 * chuỗi thô thì bé nói ĐÚNG vẫn bị chấm SAI — đúng loại lỗi làm phụ huynh bỏ app:
 *
 *  1. Số: đáp án "45 230" — bé nói "bốn mươi lăm nghìn hai trăm ba mươi" (hoặc ngược lại).
 *  2. Đơn vị: đáp án "5cm" — bé nói "năm xăng-ti-mét".
 *  3. Chọn đáp án: đáp án "B" — bé nói "đáp án bê" / "chọn b".
 *
 * Nguyên tắc: chuẩn hoá CẢ HAI PHÍA về cùng một dạng chuẩn, rồi mới so. Không đoán ý
 * bé ngoài những quy tắc tất định dưới đây — thà chấm sai theo hướng "chưa đúng, thử
 * lại" còn hơn khen sai.
 */

/** Bỏ dấu tiếng Việt + hạ chữ thường + gom khoảng trắng. Giữ chữ số và dấu phân cách. */
export function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s.,/%+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Từ số tiếng Việt → chữ số ────────────────────────────────────────────────
// Dùng token đã bỏ dấu: "muoi", "lam", "bon", "tu", "linh", "le", "tram", "nghin"...

const DIGIT_WORDS: Record<string, number> = {
  khong: 0,
  mot: 1,
  hai: 2,
  ba: 3,
  bon: 4,
  tu: 4,
  nam: 5,
  lam: 5,
  sau: 6,
  bay: 7,
  tam: 8,
  chin: 9,
};

const SCALE_WORDS: Record<string, number> = {
  nghin: 1_000,
  trieu: 1_000_000,
  ty: 1_000_000_000,
};

/** Từ nối, không mang giá trị: "linh", "lẻ", "không trăm". */
const FILLER = new Set(["linh", "le"]);

function isNumberWord(t: string): boolean {
  return t in DIGIT_WORDS || t in SCALE_WORDS || t === "muoi" || t === "tram" || FILLER.has(t);
}

/**
 * Đọc một cụm từ số đã bỏ dấu thành số nguyên. Trả null nếu cụm không hợp lệ.
 * Ví dụ: "bon muoi lam nghin hai tram ba muoi" → 45230.
 */
export function viWordsToNumber(words: string[]): number | null {
  let value = 0; // phần đã chốt theo đơn vị nghìn/triệu/tỷ
  let cur = 0; // cụm đang cộng dồn (0..999)
  let sawAny = false;

  for (const t of words) {
    if (FILLER.has(t)) continue;
    if (t in DIGIT_WORDS) {
      cur += DIGIT_WORDS[t];
      sawAny = true;
      continue;
    }
    if (t === "muoi") {
      // "mười" (đứng một mình) hoặc "X mươi": nhân hàng chục, giữ nguyên hàng trăm.
      const hundreds = Math.floor(cur / 100) * 100;
      const tens = cur % 100;
      cur = hundreds + (tens === 0 ? 10 : tens * 10);
      sawAny = true;
      continue;
    }
    if (t === "tram") {
      // "không trăm" phải là 0 (số 70 005 đọc "bảy mươi nghìn không trăm linh năm").
      cur *= 100;
      sawAny = true;
      continue;
    }
    if (t in SCALE_WORDS) {
      const mult = SCALE_WORDS[t];
      if (cur === 0) return null; // "nghìn" mà không có số đứng trước → không hợp lệ
      value += cur * mult;
      cur = 0;
      sawAny = true;
      continue;
    }
    return null; // gặp từ không phải số → cụm không hợp lệ
  }
  if (!sawAny) return null;
  return value + cur;
}

/**
 * Thay mọi cụm từ-số trong chuỗi đã bỏ dấu bằng chữ số.
 * "be noi bon muoi lam nghin hai tram ba muoi" → "be noi 45230".
 */
export function replaceNumberWords(norm: string): string {
  const tokens = norm.split(" ");
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (!isNumberWord(tokens[i])) {
      out.push(tokens[i]);
      i += 1;
      continue;
    }
    // "năm" vừa là số 5 vừa là "year" — đừng đổi khi đứng riêng trước một năm 4 chữ số
    // hoặc sau "tháng"/"ngày" ("tháng 5 năm 2020").
    if (
      tokens[i] === "nam" &&
      (tokens[i + 1] ?? "").match(/^\d{4}$/) &&
      !["thang", "ngay"].includes(tokens[i - 1] ?? "")
    ) {
      out.push(tokens[i]);
      i += 1;
      continue;
    }
    // Gom cụm dài nhất có thể, thử từ dài xuống ngắn để không cắt vụn câu.
    let j = i;
    while (j < tokens.length && isNumberWord(tokens[j])) j += 1;
    let replaced = false;
    for (let end = j; end > i; end -= 1) {
      const n = viWordsToNumber(tokens.slice(i, end));
      if (n !== null) {
        out.push(String(n));
        i = end;
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      out.push(tokens[i]);
      i += 1;
    }
  }
  return out.join(" ");
}

// ── Đơn vị đo: viết tắt ↔ đọc đầy đủ ────────────────────────────────────────
const UNIT_ALIASES: Array<[RegExp, string]> = [
  [/\bxang[\s-]?ti[\s-]?met\b/g, "cm"],
  [/\bxi[\s-]?met\b/g, "cm"],
  [/\bki[\s-]?lo[\s-]?met\b/g, "km"],
  [/\bki[\s-]?lo[\s-]?gam\b/g, "kg"],
  [/\bki[\s-]?lo\b/g, "kg"],
  [/\bmi[\s-]?li[\s-]?met\b/g, "mm"],
  [/\bde[\s-]?xi[\s-]?met\b/g, "dm"],
  [/\bmet\s?vuong\b/g, "m2"],
  [/\bxang[\s-]?ti[\s-]?met\s?vuong\b/g, "cm2"],
  [/\bmet\b/g, "m"],
  [/\bgram\b/g, "g"],
  [/\blit\b/g, "l"],
  [/\bgio\b/g, "h"],
  [/\bphut\b/g, "min"],
];

function unifyUnits(s: string): string {
  let out = s;
  for (const [re, to] of UNIT_ALIASES) out = out.replace(re, to);
  return out;
}

/**
 * Bỏ dấu phân cách hàng nghìn: "45 230", "45.230", "45,230" → "45230".
 * Chỉ bỏ khi nhóm sau đúng 3 chữ số (để "0,5" vẫn là "0,5").
 */
function collapseThousands(s: string): string {
  return s.replace(/(\d)[.,\s](?=\d{3}(?!\d))/g, "$1");
}

/** Dạng chuẩn để so: bỏ dấu, đổi số-viết-bằng-chữ → chữ số, gom đơn vị, gom số. */
export function canonicalize(text: string): string {
  const base = stripDiacritics(text);
  const withDigits = replaceNumberWords(base);
  const withUnits = unifyUnits(withDigits);
  // "5 cm" và "5cm" phải là một.
  const glued = withUnits.replace(/\b(\d)\s+(cm2|cm|kg|km|mm|dm|m2|g|l|h|min|m)\b/g, "$1$2");
  return collapseThousands(glued).replace(/\s+/g, " ").trim();
}

function digitsOf(s: string): string {
  return s.replace(/[^0-9]/g, "");
}

const CHOICE_LETTER = /^[a-d]$/;

/** Bé nói "đáp án bê" / "chọn b" / "ý b" — nhận diện chữ cái lựa chọn. */
function spokenChoice(raw: string): string | null {
  // Tên chữ cái tiếng Việt: a, bê, xê, dê.
  const norm = raw
    .replace(/\bbe\b/g, "b")
    .replace(/\bxe\b/g, "c")
    .replace(/\bde\b/g, "d");
  const m = norm.match(/\b(?:dap an|phuong an|lua chon|chon|y)\s+([a-d])\b/);
  if (m) return m[1];
  if (CHOICE_LETTER.test(norm)) return norm;
  // Chữ cái đứng một mình trong câu ngắn: "b a" (máy nghe hay tách) → lấy chữ đầu.
  const single = norm.match(/(?:^|\s)([a-d])(?:\s|$)/g);
  if (single && norm.split(" ").length <= 4) {
    const letters = single.map((x) => x.trim());
    if (letters.length === 1) return letters[0];
  }
  return null;
}

export type AnswerKey = { value: string; alt?: string[] };

/**
 * Chấm câu trả lời nói. Trả true nếu khớp đáp án (hoặc một biến thể trong `alt`).
 *
 * Chấp nhận câu nói chứa trọn đáp án ("dạ bốn mươi lăm nghìn ạ") nhưng KHÔNG chấp nhận
 * khi bé nói thêm một đáp án khác — tránh trường hợp bé đọc cả 4 lựa chọn mà vẫn đúng.
 */
export function gradeSpokenAnswer(answer: AnswerKey | null | undefined, spoken: string): boolean {
  if (!answer?.value) return false;
  const target = canonicalize(answer.value);
  const got = canonicalize(spoken ?? "");
  if (!target || !got) return false;

  const candidates = [target, ...(answer.alt ?? []).map(canonicalize).filter(Boolean)];

  for (const c of candidates) {
    if (got === c) return true;

    // Chọn A/B/C/D: đáp án là một chữ cái.
    if (CHOICE_LETTER.test(c)) {
      const picked = spokenChoice(got);
      if (picked && picked === c) return true;
      continue;
    }

    // Số: so phần chữ số (bỏ hết dấu phân cách hai phía).
    const cd = digitsOf(c);
    if (cd.length >= 1 && cd === c.replace(/\s/g, "") && cd.length >= 2) {
      const gd = digitsOf(got);
      if (gd === cd) return true;
      if (gd.length > cd.length && gd.includes(cd)) {
        // Bé nói nhiều số (ví dụ đọc cả 4 lựa chọn) → không tính là đúng.
        const others = (gd.match(/\d+/g) ?? []).filter((x) => x !== cd);
        if (others.length === 0) return true;
      }
      continue;
    }

    // Chữ: chấp nhận khi câu nói chứa trọn cụm đáp án, theo ranh giới từ.
    if (c.length >= 2 && new RegExp(`(^|\\s)${escapeRe(c)}(\\s|$)`).test(got)) {
      // Nhưng nếu câu nói chứa một đáp án khác dài hơn cùng loại → không chấm đúng.
      if (got !== c && got.split(" ").length > c.split(" ").length + 6) continue;
      return true;
    }
  }
  return false;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
