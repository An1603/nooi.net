import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * ĐẦU TRANG DÙNG CHUNG CHO MỌI TRANG PHÂN HỆ.
 *
 * Vì sao tách riêng: khách chỉ cần học cách đọc MỘT trang là đọc được cả sáu. Muốn vậy đầu
 * trang phải giống nhau tuyệt đối về thứ tự: đường dẫn › tiêu đề › một câu mô tả › hành động.
 * Đừng chép tay khối này vào từng trang — lệch một chỗ là mất cảm giác “cùng một hệ thống”.
 */
export function DauTrangPhanHe({
  ten,
  moTa,
  duongDan = [],
  hanhDong,
  children,
}: {
  ten: string;
  moTa: string;
  /** các mắt breadcrumb phía sau “Trang chủ” — [{ nhan, href }] */
  duongDan?: { nhan: string; href?: string }[];
  /** nút hành động chính, tối đa 2 nút */
  hanhDong?: { nhan: string; href: string; chinh?: boolean }[];
  /** chỗ chèn thêm (số lượng, dải lọc…) */
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1680px] px-[clamp(16px,3vw,34px)] pb-6 pt-24">
      <nav aria-label="Đường dẫn" className="mb-4 flex flex-wrap items-center gap-1 text-[11.5px] text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Trang chủ
        </Link>
        {duongDan.map((m) => (
          <span key={m.nhan} className="flex items-center gap-1">
            <ChevronRight size={11} className="opacity-50" />
            {m.href ? (
              <Link href={m.href} className="transition-colors hover:text-foreground">
                {m.nhan}
              </Link>
            ) : (
              <span className="text-foreground/80">{m.nhan}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{ten}</h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{moTa}</p>
        </div>
        {hanhDong && hanhDong.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {hanhDong.map((n) => (
              <Link
                key={n.nhan}
                href={n.href}
                className={
                  n.chinh
                    ? "inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
                    : "inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm text-foreground/85 transition-colors hover:border-primary/40 hover:text-foreground"
                }
              >
                {n.nhan}
              </Link>
            ))}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
