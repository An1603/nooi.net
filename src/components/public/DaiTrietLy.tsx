import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * DẢI TRIẾT LÝ — một dòng, hai liên kết.
 *
 * Vì sao phải gọn như vậy: bốn bước và bảy tầng là TRI THỨC, không phải lời chào bán. Đặt
 * nguyên hai khối lớn trên trang chủ làm khách phải đọc 3–4 màn hình triết học trước khi
 * biết NOOI bán gì. Ở đây chỉ giữ đúng phần “có một khung nền đấy, xem khi cần”.
 */
const BUOC = ["THẤY", "HIỂU", "SỐNG", "LAN TỎA"];

export function DaiTrietLy() {
  return (
    <section className="relative border-y border-border/70 px-5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Triết lý nền
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-lg font-semibold md:text-xl">
            {BUOC.map((b, i) => (
              <span key={b} className="flex items-center gap-3">
                {b}
                {i < BUOC.length - 1 && <span className="text-muted-foreground/40">—</span>}
              </span>
            ))}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Bốn bước chuyển hóa và bảy tầng tỉnh thức — khung nền của mọi bài thực hành trong
            NOOI.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/kho-tri-thuc/bon-buoc-chuyen-hoa"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] transition-colors hover:border-primary/40"
          >
            Đọc bốn bước <ArrowRight size={13} />
          </Link>
          <Link
            href="/kho-tri-thuc/bay-tang-chuyen-hoa"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] transition-colors hover:border-primary/40"
          >
            Xem bảy tầng <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
