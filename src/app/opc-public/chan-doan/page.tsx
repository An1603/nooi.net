import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Clock, LockKeyhole, Sparkles } from "lucide-react";
import DiagnosticForm from "@/components/opc-public/DiagnosticForm";

export const metadata: Metadata = {
  title: "Chẩn đoán 10 câu",
  description:
    "Trả lời 10 câu hỏi trong 20 phút để biết điểm nghẽn lớn nhất và gói OPC phù hợp với giai đoạn của bạn.",
};

export default function ChanDoanPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#C8943E]/10 blur-[100px]" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A88AD] hover:text-[#F5EFE6]">
          <ArrowLeft size={14} /> Về trang chủ
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#C8943E]/25 bg-[#C8943E]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8C07A]">
              <Sparkles size={13} /> Miễn phí · không cần thẻ
            </p>
            <h1
              className="mt-4 text-3xl font-bold leading-tight text-[#F5EFE6] md:text-4xl"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Biết mình đang ở đâu
              <br />
              trước khi đầu tư thêm.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#C9BCD7] md:text-base">
              10 câu hỏi ngắn về giai đoạn, pháp lý, quy trình, kênh bán, AI và ngân sách. Kết quả gồm điểm 0–100,
              điểm nghẽn lớn nhất và gói nên xem trước.
            </p>

            <div className="mt-7">
              <DiagnosticForm />
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-white/10 bg-[#160D24] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8943E]">Bạn sẽ nhận được</p>
              <div className="mt-4 space-y-3">
                {[
                  ["Điểm chẩn đoán 0–100", "Một con số để so sánh với lần sau, không phải điểm xếp hạng."],
                  ["Điểm nghẽn lớn nhất", "Một việc nên xử lý trước, không phải danh sách 20 việc."],
                  ["Gói phù hợp", "Gợi ý dựa trên giai đoạn và ngân sách, không dựa trên gói đắt nhất."],
                  ["Bản tóm tắt qua email/Zalo", "OPC gửi lại để bạn lưu và đối chiếu."],
                ].map(([ten, moTa]) => (
                  <div key={ten} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                      <Check size={12} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#F5EFE6]">{ten}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#9A88AD]">{moTa}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-[#C8943E]">
                <Clock size={16} />
                <p className="text-[11px] font-bold uppercase tracking-[0.14em]">20 phút</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#9A88AD]">
                Không cần chuẩn bị gì. Trả lời theo hiện tại, không theo mong muốn — kết quả sẽ hữu ích hơn.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-[#C8943E]">
                <LockKeyhole size={16} />
                <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Riêng tư</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#9A88AD]">
                Thông tin chỉ dùng để OPC liên hệ về chẩn đoán. Không bán, không chia sẻ cho bên thứ ba.
              </p>
            </div>

            <div className="rounded-3xl border border-[#C8943E]/20 bg-[#C8943E]/[0.07] p-5">
              <p className="text-sm font-bold text-[#E8C07A]">Chưa muốn để lại thông tin?</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#D8CBE6]">
                Bạn vẫn có thể xem toàn bộ sản phẩm và giá trước khi quyết định.
              </p>
              <Link href="/goi" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#E8C07A] hover:text-[#F5EFE6]">
                Xem sản phẩm &amp; giá <ArrowLeft size={13} className="rotate-180" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
