import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock } from "lucide-react";
import { DauTrangPhanHe } from "@/components/public/DauTrangPhanHe";
import { BAI_VIET, CHU_DE } from "@/lib/tri-thuc/bai-viet";

export const metadata: Metadata = {
  title: "Kho tri thức NOOI — bài viết về thân, tâm và thực hành",
  description:
    "Bài viết nền tảng và thực hành của NOOI: bốn bước chuyển hóa, bảy tầng, thiền, khí công dưỡng sinh, dinh dưỡng học chức năng và tâm lý học ứng dụng. Đọc phần mở đầu miễn phí.",
  alternates: { canonical: "/kho-tri-thuc" },
  openGraph: {
    title: "Kho tri thức NOOI",
    description: "Bài viết về thân, tâm và thực hành — đọc mở đầu miễn phí.",
    locale: "vi_VN",
    type: "website",
    siteName: "NOOI",
  },
};

/**
 * KHO TRI THỨC — trang hub.
 *
 * Cách trình bày: nhóm theo CHỦ ĐỀ chứ không phải danh sách phẳng, vì người mới cần biết
 * “đọc từ đâu” hơn là thấy 6 tiêu đề ngang hàng. Mỗi nhóm đúng 2 bài ở giai đoạn này; khi
 * số bài tăng thì thêm dải lọc phía trên, không đổi cấu trúc thẻ.
 */
export default function KhoTriThucPage() {
  return (
    <main className="min-h-[100dvh] bg-background">
      <DauTrangPhanHe
        ten="Kho tri thức"
        moTa="Bài viết nền tảng và thực hành của NOOI. Phần mở đầu của mọi bài đều đọc được ngay; phần thân dành cho thành viên."
        duongDan={[{ nhan: "Kho tri thức" }]}
        hanhDong={[
          { nhan: "Bắt đầu miễn phí", href: "/signup", chinh: true },
          { nhan: "Kho video", href: "/video" },
        ]}
      />

      <div className="mx-auto w-full max-w-[1680px] px-[clamp(16px,3vw,34px)] pb-20">
        {CHU_DE.map((chuDe) => {
          const ds = BAI_VIET.filter((b) => b.chuDe === chuDe);
          if (ds.length === 0) return null;
          return (
            <section key={chuDe} className="mb-12">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-[15px] font-semibold tracking-wide">{chuDe}</h2>
                <span className="text-[11.5px] text-muted-foreground">{ds.length} bài</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ds.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/kho-tri-thuc/${b.slug}`}
                    data-track={`tri-thuc-${b.slug}`}
                    className="group flex flex-col rounded-xl border border-border bg-card/40 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
                  >
                    <div className="mb-3 flex items-center gap-2 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                      <BookOpen size={12} />
                      {b.chuDe}
                      <span className="ml-auto flex items-center gap-1 normal-case tracking-normal">
                        <Clock size={11} /> {b.phut} phút
                      </span>
                    </div>
                    <h3 className="text-[16px] font-semibold leading-snug transition-colors group-hover:text-primary">
                      {b.tieuDe}
                    </h3>
                    <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {b.moTa}
                    </p>
                    <span className="mt-4 flex items-center gap-1 text-[12px] font-medium text-foreground/80">
                      Đọc phần mở đầu
                      <ArrowUpRight
                        size={13}
                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <p className="mt-4 text-center text-[11px] text-muted-foreground/70">
          Nội dung do đội ngũ NOOI biên soạn. Vui lòng ghi rõ nguồn khi chia sẻ lại.
        </p>
      </div>
    </main>
  );
}
