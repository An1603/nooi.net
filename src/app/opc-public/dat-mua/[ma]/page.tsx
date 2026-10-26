import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarClock, Check, CreditCard, ShieldCheck } from "lucide-react";
import { formatGia, getGoiTheoMa, lopMau, nhanKy } from "@/lib/opc/public";
import OrderForm from "@/components/opc-public/OrderForm";

export const metadata: Metadata = {
  title: "Đặt mua",
  description: "Để lại thông tin để OPC xác nhận gói và hướng dẫn thanh toán.",
};

type PageProps = {
  params: Promise<{ ma: string }>;
};

export default async function DatMuaPage({ params }: PageProps) {
  const { ma } = await params;
  const goi = await getGoiTheoMa(ma);

  if (!goi) notFound();
  if (goi.gia === 0) redirect("/chan-doan");

  const mau = lopMau(goi.meta.accent);
  const laTuVan = goi.meta.nhom === "mo-rong";

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#C8943E]/10 blur-[100px]" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-violet-500/10 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
        <Link href="/goi" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A88AD] hover:text-[#F5EFE6]">
          <ArrowLeft size={14} /> Tất cả sản phẩm
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${mau.vien} ${mau.nen} ${mau.chu}`}>
              {laTuVan ? "Nhận tư vấn" : "Đặt mua"}
            </p>
            <h1
              className="mt-4 text-3xl font-bold leading-tight text-[#F5EFE6] md:text-4xl"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {laTuVan ? "Bắt đầu bằng một cuộc trao đổi." : `Bắt đầu ${goi.ten}.`}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#C9BCD7] md:text-base">
              {laTuVan
                ? `${goi.ten} đang trong giai đoạn thí điểm. Để lại thông tin, OPC sẽ tư vấn xem gói này có đúng nhu cầu của bạn không trước khi nhận đặt chỗ.`
                : "Để lại thông tin để OPC xác nhận gói, thời gian bắt đầu và hướng dẫn thanh toán. Bạn chưa bị trừ tiền ở bước này."}
            </p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-[#160D24] p-5 md:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8943E]">Thông tin của bạn</p>
              <div className="mt-4">
                <OrderForm ma={goi.ma} ten={goi.ten} tuVan={goi.meta.tuVan} />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: CalendarClock, ten: "Bước 1", moTa: "Gửi thông tin" },
                { icon: ShieldCheck, ten: "Bước 2", moTa: "OPC xác nhận trong 4 giờ" },
                { icon: CreditCard, ten: "Bước 3", moTa: "Thanh toán & bắt đầu" },
              ].map((item) => (
                <div key={item.ten} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <item.icon size={16} className="text-[#C8943E]" />
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9A88AD]">{item.ten}</p>
                  <p className="mt-1 text-sm text-[#F5EFE6]">{item.moTa}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className={`rounded-3xl border bg-[#160D24] p-5 md:p-6 ${mau.vien}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9A88AD]">Bạn đang chọn</p>
                  <h2 className="mt-1 text-2xl font-bold text-[#F5EFE6]">{goi.ten}</h2>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${mau.vien} ${mau.nen} ${mau.chu}`}>
                  <Check size={18} />
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#B9AAC8]">{goi.meta.tagline}</p>

              <div className="mt-5 flex items-end gap-1.5">
                <span className="text-3xl font-black text-[#F5EFE6]">{formatGia(goi.gia)}</span>
                <span className="pb-1 text-xs text-[#8E7CA3]">{nhanKy(goi.ky)}</span>
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9A88AD]">Bao gồm</p>
                <ul className="mt-3 grid gap-2.5">
                  {goi.quyenLoi.map((quyen) => (
                    <li key={quyen} className="flex items-start gap-2 text-sm text-[#D8CBE6]">
                      <Check size={15} className={`mt-0.5 shrink-0 ${mau.chu}`} />
                      <span className="leading-snug">{quyen}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-[11px] leading-relaxed text-[#9A88AD]">
                  {goi.ma === "retreat"
                    ? "Lịch và công suất được xác nhận trước khi thanh toán. OPC sẽ gửi lịch trình và chính sách huỷ."
                    : goi.ma === "residency"
                      ? "Tối thiểu 3 tháng. OPC xác nhận phòng, desk và ngày nhận phòng trước khi thanh toán."
                      : "Chính sách huỷ, hoàn tiền và thời gian bắt đầu được ghi rõ trong xác nhận trước khi thanh toán."}
                </p>
              </div>

              <Link
                href="/chan-doan"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#C8943E] hover:text-[#E8C07A]"
              >
                Chưa chắc? Chẩn đoán 10 câu <ArrowRight size={13} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
