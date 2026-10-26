import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleHelp, Compass, ShieldCheck, Wallet } from "lucide-react";
import { getGoiCongKhai, CAP_DO, goiTheoCap } from "@/lib/opc/public";
import GoiCard from "@/components/opc-public/GoiCard";

export const metadata: Metadata = {
  title: "Sản phẩm & giá",
  description:
    "Mười sản phẩm OPC Center theo ba cấp độ: nền tảng, vận hành và mở rộng — từ Khởi tạo miễn phí đến OPC Partner cho tổ chức.",
};

const FAQ = [
  {
    hoi: "Tôi có cần đến Măng Đen không?",
    dap: "Không. Phần lớn sản phẩm diễn ra online toàn quốc. Retreat và Residency là tầng nâng cấp tại NOOI Forest, không phải điều kiện để bắt đầu.",
  },
  {
    hoi: "Thanh toán như thế nào?",
    dap: "Bạn đặt mua trên website. OPC liên hệ xác nhận trong 4 giờ làm việc, gửi thông tin chuyển khoản hoặc hóa đơn. Chưa thanh toán online trực tiếp ở giai đoạn này.",
  },
  {
    hoi: "Có hoàn tiền không?",
    dap: "Chuẩn hóa hoàn 100% trong 7 ngày nếu bạn chưa học quá 20%. Các gói khác theo cam kết trong hợp đồng; OPC luôn xác nhận chính sách trước khi thu tiền.",
  },
  {
    hoi: "Tôi có thể nâng gói sau không?",
    dap: "Có. Thiết kế khuyến khích đi từng bước. Bạn có thể bắt đầu Khởi tạo, lên Chuẩn hóa, rồi Membership/Pro khi việc trước đã chạy.",
  },
  {
    hoi: "Gói nào phù hợp nếu tôi chưa có doanh thu?",
    dap: "Bắt đầu bằng Khởi tạo miễn phí. Nếu cần làm hồ sơ pháp lý – thuế – ngân hàng nhanh, chọn OPC Launch; nếu cần học và chuẩn hóa trước, chọn Chuẩn hóa.",
  },
];

export default async function GoiPage() {
  const danhSach = await getGoiCongKhai();

  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#C8943E]/10 blur-[100px]" />
          <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-violet-500/10 blur-[110px]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8943E]">Sản phẩm &amp; giá</p>
          <h1
            className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-[#F5EFE6] md:text-5xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Chọn đúng việc tiếp theo,
            <br />
            không phải gói lớn nhất.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#C9BCD7]">
            Mười sản phẩm, ba cấp độ. Mỗi cấp độ có đầu ra riêng; bạn không cần mua tuần tự.
            Mọi gói đều bắt đầu bằng một cuộc chẩn đoán.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/chan-doan"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8943E] px-5 py-3.5 text-sm font-bold text-[#160B22] transition-colors hover:bg-[#E8C07A]"
            >
              Chưa biết chọn gói nào? Chẩn đoán miễn phí
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/#cach-hoat-dong"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3.5 text-sm font-semibold text-[#F5EFE6] transition-colors hover:bg-white/5"
            >
              Cách OPC hoạt động
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8943E]">Ba cấp độ</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#F5EFE6] md:text-3xl">Mỗi cấp độ, một đầu ra</h2>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-[#9A88AD]">
            Chọn cấp độ gần nhất với trạng thái hiện tại. Bạn không cần mua tuần tự — chẩn đoán sẽ giúp xác nhận.
          </p>
        </div>

        <div className="mt-10 space-y-14">
          {CAP_DO.map((cap) => {
            const ds = goiTheoCap(danhSach, cap.ma);
            if (!ds.length) return null;
            return (
              <div key={cap.id} id={cap.id} className="scroll-mt-28">
                <div className="flex flex-col gap-2 border-l-2 border-[#C8943E]/40 pl-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C8943E]">{cap.nhan}</p>
                    <h3 className="mt-1 text-xl font-bold text-[#F5EFE6] md:text-2xl">{cap.ten}</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#9A88AD]">{cap.moTa}</p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-[#7C6A8E]">{ds.length} sản phẩm</p>
                </div>
                <div className={`mt-5 grid gap-4 sm:grid-cols-2 ${ds.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
                  {ds.map((goi) => (
                    <GoiCard key={goi.ma} goi={goi} noiBat={goi.ma === "pro"} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8943E]">Chọn theo nhu cầu</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#F5EFE6] md:text-3xl">Ba câu hỏi để chọn đúng</h2>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Compass,
              hoi: "Tôi cần biết bắt đầu từ đâu",
              dap: "Khởi tạo miễn phí, sau đó Chuẩn hóa hoặc OPC Launch nếu cần làm hộ.",
              href: "/chan-doan",
              cta: "Chẩn đoán trước",
            },
            {
              icon: Wallet,
              hoi: "Tôi đã có doanh thu, cần hệ thống",
              dap: "Membership để không đơn độc, AI Agent để giảm việc lặp, Pro để có người đồng hành 90 ngày.",
              href: "/dat-mua/pro",
              cta: "Xem Đồng hành Pro",
            },
            {
              icon: ShieldCheck,
              hoi: "Tôi cần không gian và thời gian",
              dap: "Retreat 3–7 ngày để chuyển hóa, Residency 1–6 tháng để sống và làm việc tại Forest.",
              href: "/goi#residency",
              cta: "Xem Residency",
            },
          ].map((item) => (
            <Link
              key={item.hoi}
              href={item.href}
              className="group rounded-3xl border border-white/10 bg-[#160D24] p-5 transition-colors hover:border-white/20 hover:bg-[#1A0F2A]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#C8943E]/25 bg-[#C8943E]/10 text-[#E8C07A]">
                <item.icon size={18} />
              </span>
              <h3 className="mt-4 text-base font-bold leading-snug text-[#F5EFE6]">{item.hoi}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9A88AD]">{item.dap}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#C8943E] group-hover:text-[#E8C07A]">
                {item.cta} <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0D0616]">
        <div className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-20">
          <div className="flex items-center gap-2">
            <CircleHelp size={18} className="text-[#C8943E]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8943E]">Câu hỏi thường gặp</p>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#F5EFE6] md:text-3xl">Trước khi bạn quyết định</h2>
          <div className="mt-6 divide-y divide-white/10 rounded-3xl border border-white/10 bg-[#160D24]">
            {FAQ.map((item) => (
              <details key={item.hoi} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#F5EFE6]">
                  {item.hoi}
                  <span className="text-[#C8943E] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#9A88AD]">{item.dap}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-[#C8943E]/20 bg-[#C8943E]/[0.07] p-4">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-[#D8CBE6]">
              <Check size={15} className="mt-0.5 shrink-0 text-[#E8C07A]" />
              OPC không hứa làm giàu. Chúng tôi cam kết nói rõ gói nào làm được gì, ai chịu trách nhiệm và khi nào
              bạn nên dừng lại.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
