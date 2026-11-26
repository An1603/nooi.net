import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock, Lock, Sparkles } from "lucide-react";
import { DauTrangPhanHe } from "@/components/public/DauTrangPhanHe";
import { BAI_VIET, timBaiViet } from "@/lib/tri-thuc/bai-viet";
import { nguoiDangXem } from "@/lib/video/nguoi-xem";

/**
 * TRANG ĐỌC MỘT BÀI — cổng gác nằm ở MÁY CHỦ, không ở trình duyệt.
 *
 * Luật: `moDau` hiện cho tất cả; `than` chỉ được gửi xuống khi phiên đăng nhập hợp lệ. Vì
 * vậy người xem mã trang cũng không đọc được phần thân — khác hẳn cách làm “che bằng CSS”
 * (che bằng CSS là gửi nguyên văn cho trình duyệt rồi làm mờ đi).
 */
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return BAI_VIET.map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const bai = timBaiViet(slug);
    if (!bai) return { title: "Không tìm thấy bài viết — NOOI" };
    return {
      title: `${bai.tieuDe} — Kho tri thức NOOI`,
      description: bai.moTa,
      alternates: { canonical: `/kho-tri-thuc/${bai.slug}` },
      openGraph: {
        title: bai.tieuDe,
        description: bai.moTa,
        locale: "vi_VN",
        type: "article",
        siteName: "NOOI",
      },
    };
  });
}

export default async function BaiVietPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bai = timBaiViet(slug);
  if (!bai) notFound();

  const nguoi = await nguoiDangXem();
  const lienQuan = (bai.lienQuan ?? [])
    .map((s) => timBaiViet(s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  return (
    <main className="min-h-[100dvh] bg-background">
      <DauTrangPhanHe
        ten={bai.tieuDe}
        moTa={bai.moTa}
        duongDan={[
          { nhan: "Kho tri thức", href: "/kho-tri-thuc" },
          { nhan: bai.chuDe },
        ]}
      />

      <article className="mx-auto w-full max-w-3xl px-[clamp(16px,3vw,34px)] pb-16">
        <div className="mb-8 flex flex-wrap items-center gap-3 text-[11.5px] text-muted-foreground">
          <span className="rounded-full border border-border px-2.5 py-0.5">{bai.chuDe}</span>
          <span className="flex items-center gap-1">
            <Clock size={11} /> {bai.phut} phút đọc
          </span>
          <span>Cập nhật {new Date(bai.capNhat).toLocaleDateString("vi-VN")}</span>
        </div>

        {/* Phần mở đầu — công khai */}
        <div className="space-y-5">
          {bai.moDau.map((doan, i) => (
            <p key={i} className="text-[15.5px] leading-[1.85] text-foreground/90">
              {doan}
            </p>
          ))}
        </div>
        {nguoi.daDangNhap ? (
          <div className="mt-5 space-y-5">
            {bai.than.map((doan, i) => (
              <p key={i} className="text-[15.5px] leading-[1.85] text-foreground/90">
                {doan}
              </p>
            ))}

            <div className="mt-10 rounded-xl border border-border bg-card/40 p-5">
              <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
                <Sparkles size={14} className="text-primary" />
                Thực hành tiếp trong ứng dụng
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/app/journal"
                  className="rounded-lg bg-primary px-4 py-1.5 text-[12.5px] font-medium text-primary-foreground"
                >
                  Ghi nhật ký hôm nay
                </Link>
                <Link
                  href="/video"
                  className="rounded-lg border border-border px-4 py-1.5 text-[12.5px]"
                >
                  Xem bài giảng liên quan
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative mt-5">
            {/* Ngăn cách mảnh thay cho vạch xám giả chữ: vạch xám trông như trang đang tải
                và gây hiểu nhầm; ở đây chỉ báo “hết phần mở” trước khi tới cổng đăng nhập. */}
            <div aria-hidden className="mb-2 flex items-center justify-center gap-2 text-muted-foreground/40">
              <span className="h-px w-10 bg-border" />
              <span className="text-[16px] leading-none">· · ·</span>
              <span className="h-px w-10 bg-border" />
            </div>

            <div className="mt-2 rounded-xl border border-primary/30 bg-primary/[0.06] p-6 text-center">
              <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 text-primary">
                <Lock size={17} />
              </span>
              <p className="text-[15px] font-semibold">Bài này dành cho thành viên NOOI</p>
              <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                Đăng nhập để đọc phần còn lại, lưu bài vào nhật ký và nhận gợi ý thực hành theo
                trình độ của bạn.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link
                  href={`/login?redirect=/kho-tri-thuc/${bai.slug}`}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
                >
                  Đăng nhập để đọc tiếp
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg border border-border px-5 py-2 text-sm"
                >
                  Tạo tài khoản miễn phí
                </Link>
              </div>
            </div>
          </div>
        )}

        {lienQuan.length > 0 && (
          <section className="mt-14 border-t border-border pt-8">
            <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Đọc tiếp
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {lienQuan.map((b) => (
                <Link
                  key={b.slug}
                  href={`/kho-tri-thuc/${b.slug}`}
                  className="group flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/40"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium leading-snug group-hover:text-primary">
                      {b.tieuDe}
                    </span>
                    <span className="mt-1 block text-[11.5px] text-muted-foreground">
                      {b.chuDe} · {b.phut} phút
                    </span>
                  </span>
                  <ArrowUpRight size={14} className="mt-0.5 opacity-50" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <Link
          href="/kho-tri-thuc"
          className="mt-10 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={13} /> Về kho tri thức
        </Link>
      </article>
    </main>
  );
}
