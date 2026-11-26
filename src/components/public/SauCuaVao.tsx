import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PHAN_HE } from "@/lib/phan-he";

/**
 * KHỐI “SÁU CỬA VÀO” — đặt ngay dưới hero trang chủ.
 *
 * Vì sao phải có khối này (chứ không chỉ để trong menu): khách mới không bấm menu. Họ cuộn.
 * Sáu thẻ này trả lời câu “NOOI có gì cho tôi” trong đúng một màn hình, và mỗi thẻ là một
 * đường đi thật — không phải danh sách tính năng để đọc rồi thôi.
 */
export function SauCuaVao() {
  return (
    <section id="phan-he" className="relative px-5 pb-20 pt-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Khám phá hệ sinh thái
            </p>
            <h2 className="text-2xl font-bold md:text-3xl">Sáu cửa vào NOOI</h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Mỗi cửa là một kho tài nguyên riêng — xem công khai, phần dành cho thành viên sẽ
            hiện ổ khoá.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PHAN_HE.map(({ ma, ten, href, moTa, Icon }) => (
            <Link
              key={ma}
              href={href}
              data-track={`cua-${ma}`}
              className="group relative flex items-start gap-4 rounded-xl border border-border bg-card/40 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background/60 text-primary">
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[15px] font-semibold">
                  {ten}
                  <ArrowUpRight
                    size={14}
                    className="opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-60"
                  />
                </span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-muted-foreground">
                  {moTa}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
