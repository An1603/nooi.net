import { describe, it, expect } from "vitest";
import {
  BAND_VOICE_BY_GENDER,
  DEFAULT_SETTINGS,
  FEMALE_VOICES,
  MALE_VOICES,
  TEACHER_PROFILE,
  buildSystemInstruction,
  normalizeKidSettings,
  resolveKidVoice,
  resolveTeacherVoice,
  teacherGenderFromSettings,
  type AgeBand,
} from "@/lib/ekid/ekid-system";

const BANDS: AgeBand[] = ["mam-non", "tieu-hoc", "thieu-nien"];

describe("eKid — giọng theo giới tính giáo viên", () => {
  it("giáo viên là cô → LUÔN giọng nữ, đủ 3 lứa tuổi", () => {
    for (const band of BANDS) {
      const v = resolveTeacherVoice("co", band);
      expect(FEMALE_VOICES).toContain(v);
      expect(MALE_VOICES).not.toContain(v);
    }
  });

  it("giáo viên là thầy → LUÔN giọng nam, đủ 3 lứa tuổi", () => {
    for (const band of BANDS) {
      const v = resolveTeacherVoice("thay", band);
      expect(MALE_VOICES).toContain(v);
      expect(FEMALE_VOICES).not.toContain(v);
    }
  });

  it("hai bảng giọng không dùng chung giọng nào (không thể lẫn giới tính)", () => {
    const co = new Set(Object.values(BAND_VOICE_BY_GENDER.co));
    const thay = new Set(Object.values(BAND_VOICE_BY_GENDER.thay));
    for (const v of co) expect(thay.has(v)).toBe(false);
  });

  it("favorite_voice chỉ được dùng khi ĐÚNG giới tính giáo viên", () => {
    // Bé đã chọn giọng nữ nhưng giáo viên là thầy → phải đổi sang giọng nam.
    expect(resolveKidVoice({ gender: "thay", ageBand: "tieu-hoc", favoriteVoice: "Aoede" })).toBe(
      resolveTeacherVoice("thay", "tieu-hoc"),
    );
    // Bé đã chọn giọng nam nhưng giáo viên là cô → phải đổi sang giọng nữ.
    expect(resolveKidVoice({ gender: "co", ageBand: "mam-non", favoriteVoice: "Puck" })).toBe(
      resolveTeacherVoice("co", "mam-non"),
    );
    // Đúng giới tính → tôn trọng lựa chọn của bé.
    expect(resolveKidVoice({ gender: "co", ageBand: "thieu-nien", favoriteVoice: "Kore" })).toBe(
      "Kore",
    );
    expect(resolveKidVoice({ gender: "thay", ageBand: "mam-non", favoriteVoice: "Puck" })).toBe(
      "Puck",
    );
  });

  it("favorite_voice rỗng/không hợp lệ → giọng chuẩn theo giới tính + lứa tuổi", () => {
    expect(resolveKidVoice({ gender: "co", ageBand: "tieu-hoc", favoriteVoice: null })).toBe(
      resolveTeacherVoice("co", "tieu-hoc"),
    );
    expect(resolveKidVoice({ gender: "thay", ageBand: "thieu-nien", favoriteVoice: "Không-Có" })).toBe(
      resolveTeacherVoice("thay", "thieu-nien"),
    );
  });
});

describe("eKid — cài đặt giáo viên trong hồ sơ", () => {
  it("mặc định là cô (giọng nữ)", () => {
    expect(DEFAULT_SETTINGS.teacher.gender).toBe("co");
    expect(normalizeKidSettings({}).teacher.gender).toBe("co");
    expect(normalizeKidSettings(null).teacher.gender).toBe("co");
  });

  it("nhận lựa chọn thầy và giữ nguyên các cài đặt khác", () => {
    const out = normalizeKidSettings({
      teacher: { gender: "thay" },
      subjects: ["toan"],
    });
    expect(out.teacher.gender).toBe("thay");
    expect(out.subjects).toEqual(["toan"]);
  });

  it("giá trị sai kiểu/lạ → rơi về cô, không ném lỗi", () => {
    expect(normalizeKidSettings({ teacher: { gender: "giao-vien" } }).teacher.gender).toBe("co");
    expect(normalizeKidSettings({ teacher: "thay" }).teacher.gender).toBe("co");
    expect(teacherGenderFromSettings(undefined)).toBe("co");
    expect(teacherGenderFromSettings({ teacher: { gender: "thay" } })).toBe("thay");
  });
});

describe("eKid — system instruction theo giáo viên & ngoại ngữ", () => {
  const prompt = (teacherGender?: "co" | "thay") =>
    buildSystemInstruction({
      kidName: "Bo",
      placement: { ageBand: "tieu-hoc", level: 1 },
      teacherGender,
    });

  it("mặc định (không truyền) vẫn là Cô Mây, xưng cô, giọng nữ", () => {
    const s = prompt();
    expect(s).toContain(`"${TEACHER_PROFILE.co.name}"`);
    expect(s).toContain("cô giáo AI");
    expect(s).toContain('tự xưng là "cô"');
    expect(s).toContain("GIỚI TÍNH GIÁO VIÊN: nữ");
  });

  it("giáo viên là thầy → Thầy Nắng, xưng thầy, giọng nam, KHÔNG còn Cô Mây", () => {
    const s = prompt("thay");
    expect(s).toContain(`"${TEACHER_PROFILE.thay.name}"`);
    expect(s).toContain("thầy giáo AI");
    expect(s).toContain('tự xưng là "thầy"');
    expect(s).toContain("GIỚI TÍNH GIÁO VIÊN: nam");
    expect(s).not.toContain("Cô Mây");
  });

  it("luôn có luật song ngữ: bé nói tiếng Anh thì trả lời tiếng Anh", () => {
    for (const g of ["co", "thay"] as const) {
      const s = prompt(g);
      expect(s).toContain("NGÔN NGỮ & DẠY NGOẠI NGỮ");
      expect(s).toContain("nói tiếng Anh (hoặc ngoại ngữ khác), trả lời NGAY bằng đúng ngôn ngữ đó");
      expect(s).toContain("giáo viên ngoại ngữ");
      expect(s).toContain("70–80% ngôn ngữ đích");
      expect(s).toContain("KHÔNG tự chuyển sang tiếng Anh");
    }
  });

  it("luật sư phạm cũ vẫn còn nguyên (không nêu đáp án, thang gợi ý 4 bậc)", () => {
    const s = prompt("thay");
    expect(s).toContain("LUẬT KHÔNG ĐƯỢC VI PHẠM");
    expect(s).toContain("KHÔNG nêu đáp án");
    expect(s).toContain("thang gợi ý 4 bậc");
  });

  it("câu mẫu trong luật sư phạm xưng đúng giới tính (không lẫn 'cô' khi là thầy)", () => {
    expect(prompt("thay")).toContain("Con kể lại cho thầy nghe");
    expect(prompt("thay")).not.toContain("Con kể lại cho cô nghe");
    expect(prompt("co")).toContain("Con kể lại cho cô nghe");
  });
});
