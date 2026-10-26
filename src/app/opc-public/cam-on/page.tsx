import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock, MailCheck } from "lucide-react";
import { getGoiTheoMa } from "@/lib/opc/public";

export const metadata: Metadata = {
  title: "Đã ghi nhận",
  description: "OPC đã nhận yêu cầu của bạn và sẽ liên hệ xác nhận.",
};

type PageProps = {
  searchParams: Promise<{ loai?: string; goi?: string }>;
};

export default async function CamOnPage({ searchParams }: PageProps) {
  const { loai, goi: maGoi } = await searchParams;
  const goi = maGoi ? await getGoiTheoMa(maGoi) : null;
  const laDatMua = loai === "dat-mua";

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-16 text-center md:px-6 md:py-24">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
          <Check size={30} />
        </span>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">
          {laDatMua ? "Đã ghi nhận yêu cầu" : "Đã ghi nhận"}
        </p>
        <h1
          className="mt-3 text-3xl font-bold leading-tight text-[#F5EFE6] md:text-4xl"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {laDatMua && goi ? `OPC đã nhận yêu cầu ${goi.ten}.` : "Cảm ơn bạn đã bắt đầu."}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#C9BCD7]">
          {laDatMua
            ? "Đội ngũ OPC sẽ liên hệ trong 4 giờ làm việc để xác nhận thông tin, thời gian bắt đầu và hướng dẫn thanh toán. Bạn chưa bị trừ tiền."
            : "OPC sẽ liên hệ trong 24 giờ làm việc để gửi bản tóm tắt và trả lời câu hỏi của bạn."}
        </p>

        <div className="mx-auto mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Clock size={16} className="text-[#C8943E]" />
            <p className="mt-2 text-sm font-semibold text-[#F5EFE6]">Thời gian phản hồi</p>
            <p className="mt-1 text-xs text-[#9A88AD]">{laDatMua ? "4 giờ làm việc" : "24 giờ làm việc"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <MailCheck size={16} className="text-[#C8943E]" />
            <p className="mt-2 text-sm font-semibold text-[#F5EFE6]">Kênh liên hệ</p>
            <p className="mt-1 text-xs text-[#9A88AD]">Điện thoại, Zalo hoặc email bạn đã để lại</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/goi"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8943E] px-5 py-3.5 text-sm font-bold text-[#160B22] hover:bg-[#E8C07A]"
          >
            Xem các gói khác <ArrowRight size={15} />
          </Link>
          <Link
            href="/chan-doan"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3.5 text-sm font-semibold text-[#F5EFE6] hover:bg-white/5"
          >
            Làm chẩn đoán 10 câu
          </Link>
        </div>

        <p className="mt-6 text-[11px] text-[#7C6A8E]">
          Nếu cần gấp, gọi OPC qua số trên trang liên hệ hoặc nhắn Zalo OA.
        </p>
      </div>
    </main>
  );
}
