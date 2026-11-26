import Link from "next/link";
import { ArrowRight, Flower2, HeartHandshake, Wind } from "lucide-react";

/**
 * ĐỘI NGŨ — khối giới thiệu trên trang chủ, KHÔNG phải danh sách chuyên gia.
 *
 * Vì sao không tải hồ sơ thật ở đây: trang chủ là client component, gọi thêm một vòng dữ
 * liệu cho 3 thẻ làm chậm đúng phần quan trọng nhất. Hồ sơ thật nằm ở `/chuyen-gia` (máy
 * chủ đọc, có đánh giá, số năm). Ba thẻ dưới đây chỉ mô tả ba nhóm chuyên môn đang có thật.
 */
const NHOM = [
  {
    Icon: Flower2,
    ten: "Thiền & khí công",
    moTa: "Thiền Vipassana, chánh niệm, khí công dưỡng sinh — nền tảng tĩnh lặng.",
  },
  {
    Icon: HeartHandshake,
    ten: "Tâm lý học ứng dụng",
    moTa: "Tham vấn, NLP, làm việc với cảm xúc và các khuôn mẫu lặp lại.",
  },
  {
    Icon: Wind,
    ten: "Yoga & dinh dưỡng",
    moTa: "Thân thể, hơi thở và cách ăn — ba chân của sức khỏe bền.",
  },
];

export function DoiNgu() {
  return (
    <section id="doi-ngu" className="relative px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Con người
            </p>
            <h2 className="text-2xl font-bold md:text-3xl">Đội ngũ đồng hành</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Công nghệ giữ nhịp, con người giữ hướng. Mỗi học viên có thể làm việc 1-1 với
              chuyên gia đúng chuyên môn mình cần.
            </p>
          </div>
          <Link
            href="/chuyen-gia"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] transition-colors hover:border-primary/40"
          >
            Xem hồ sơ chuyên gia <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {NHOM.map(({ Icon, ten, moTa }) => (
            <div
              key={ten}
              className="rounded-xl border border-border bg-card/40 p-5 transition-colors hover:border-primary/30"
            >
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-border text-primary">
                <Icon size={16} strokeWidth={1.75} />
              </span>
              <p className="text-[14px] font-semibold">{ten}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{moTa}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
