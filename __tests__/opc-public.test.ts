import { describe, expect, it } from "vitest";
import { CAU_HOI, DIEM_TOI_DA, tinhKetQua } from "@/lib/opc/diagnostic";

function dapAn(value: string): Record<string, string> {
  return Object.fromEntries(CAU_HOI.map((cau) => [cau.id, value]));
}

describe("chẩn đoán OPC — tính điểm", () => {
  it("tổng điểm tối đa khớp bộ câu hỏi", () => {
    expect(DIEM_TOI_DA).toBe(94);
  });

  it("trả lời toàn bộ mức thấp nhất → 0 điểm, người mới", () => {
    const ketQua = tinhKetQua(
      Object.fromEntries(CAU_HOI.map((cau) => [cau.id, cau.options[0].value]))
    );
    expect(ketQua.diem).toBe(0);
    expect(ketQua.muc).toBe("Người mới");
    expect(ketQua.goiGoiY).toBe("khoi-tao");
  });

  it("trả lời toàn bộ mức cao nhất → 100 điểm, gợi ý Residency khi có đội + ngân sách cao", () => {
    const answers = Object.fromEntries(
      CAU_HOI.map((cau) => [cau.id, cau.options[cau.options.length - 1].value])
    );
    const ketQua = tinhKetQua(answers);
    expect(ketQua.diem).toBe(100);
    expect(ketQua.muc).toBe("Sẵn sàng mở rộng");
    expect(ketQua.goiGoiY).toBe("residency");
  });

  it("mức trung bình → gợi ý Pro, có 3 việc làm", () => {
    const ketQua = tinhKetQua({
      q1: "dang-chay",
      q2: "10-30",
      q3: "da-co",
      q4: "co-mau",
      q5: "co-van-ban",
      q6: "mot-kenh",
      q7: "hang-ngay",
      q8: "thin-thoang",
      q9: "on-dinh",
      q10: "3-10",
    });
    expect(ketQua.diem).toBeGreaterThanOrEqual(55);
    expect(ketQua.diem).toBeLessThan(75);
    expect(ketQua.goiGoiY).toBe("pro");
    expect(ketQua.viecLam).toHaveLength(3);
  });

  it("ngân sách dưới 3 triệu nhưng nền tảng khá → gợi ý AI Agent", () => {
    const ketQua = tinhKetQua({
      q1: "dang-chay",
      q2: "30-50",
      q3: "da-co",
      q4: "co-mau",
      q5: "co-van-ban",
      q6: "mot-kenh",
      q7: "hang-ngay",
      q8: "co-nguoi",
      q9: "on-dinh",
      q10: "duoi-3",
    });
    expect(ketQua.diem).toBeGreaterThanOrEqual(55);
    expect(ketQua.goiGoiY).toBe("ai-agent");
  });

  it("câu trả lời rỗng không làm crash, trả 0 điểm", () => {
    const ketQua = tinhKetQua({});
    expect(ketQua.diem).toBe(0);
    expect(ketQua.muc).toBe("Người mới");
  });
});
