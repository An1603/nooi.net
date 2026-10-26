import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  Compass,
  Leaf,
  MapPin,
  MessageSquareText,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { getGoiCongKhai, CAP_DO, goiTheoCap } from "@/lib/opc/public";
import GoiCard from "@/components/opc-public/GoiCard";

export const metadata: Metadata = {
  title: { absolute: "OPC Center — Từ ý tưởng đến doanh nghiệp vận hành" },
  description:
    "OPC Center đồng hành cùng người làm kinh doanh một mình: chẩn đoán 10 câu miễn phí, 3 cấp độ sản phẩm, online toàn quốc và offline tại NOOI Forest.",
};

const BUOC = [
  {
    so: "01",
    ten: "Chẩn đoán",
    moTa: "10 câu hỏi, 20 phút. Bạn nhận bản tóm tắt điểm mạnh, điểm nghẽn và việc nên làm trước.",
    icon: Compass,
  },
  {
    so: "02",
    ten: "Chọn đúng cấp độ",
    moTa: "Không bán gói lớn nhất. Chọn cấp độ vừa với trạng thái và ngân sách của bạn.",
    icon: Target,
  },
  {
    so: "03",
    ten: "Làm cùng nhau",
    moTa: "Khóa học, làm hộ, mentor 1-1 hoặc AI — tùy việc bạn cần làm, không phải tùy thứ OPC muốn bán.",
    icon: Users,
  },
  {
    so: "04",
    ten: "Đo và nâng cấp",
    moTa: "Kết thúc bằng kết quả 30/90 ngày. Chỉ nâng gói khi việc cũ đã chạy.",
    icon: BriefcaseBusiness,
  },
];

export default async function OpcPublicHome() {
  const danhSach = await getGoiCongKhai();

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#C8943E]/10 blur-[100px]" />
          <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-14 md:px-6 md:pb-24 md:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#C8943E]/25 bg-[#C8943E]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8C07A]">
              <Sparkles size={13} />
              Dành cho người làm kinh doanh một mình
            </p>
            <p className="mt-2 text-xs font-medium tracking-wide text-[#9A88AD]">
              OPC = One-Person Company — bạn không cần có công ty để bắt đầu.
            </p>
            <h1
              className="mt-5 max-w-2xl text-[clamp(1.8rem,8vw,2.25rem)] font-bold leading-[1.08] tracking-tight text-[#F5EFE6] md:text-5xl xl:text-[3.5rem]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Từ một ý tưởng,
              <br />
              <span className="md:hidden">
                đến một
                <br />
                doanh nghiệp
                <br />
                <span className="text-[#C8943E]">vận hành.</span>
              </span>
              <span className="hidden md:inline">
                <span className="md:whitespace-nowrap">đến một doanh nghiệp</span>
                <br />
                <span className="text-[#C8943E]">vận hành.</span>
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#C9BCD7] md:text-lg">
              OPC Center giúp bạn nhìn rõ mình đang kẹt ở đâu, chọn đúng việc tiếp theo và có người đồng hành
              đến khi việc đó chạy. Dù bạn mới có ý tưởng, đang vận hành hay cần một không gian để đi xa hơn —
              bắt đầu từ đúng cấp độ của bạn.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/chan-doan"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8943E] px-5 py-3.5 text-sm font-bold text-[#160B22] transition-colors hover:bg-[#E8C07A]"
              >
                Chẩn đoán miễn phí — 10 câu
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/goi"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3.5 text-sm font-semibold text-[#F5EFE6] transition-colors hover:bg-white/5"
              >
                Xem 10 sản phẩm
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <p className="mt-4 text-xs text-[#7C6A8E]">
              Miễn phí để bắt đầu · Không cần thẻ · Online toàn quốc
            </p>

            <div className="mt-7 grid max-w-lg grid-cols-3 gap-3">
              {[
                ["3", "cấp độ"],
                ["10", "sản phẩm"],
                ["90", "ngày"],
              ].map(([so, nhan]) => (
                <div key={nhan} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-2xl font-black text-[#E8C07A]">{so}</p>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[#9A88AD]">{nhan}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Lộ trình trực quan */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#C8943E]/20 via-transparent to-violet-500/10 blur-2xl" />
            <div className="relative rounded-[1.75rem] border border-white/10 bg-[#1A0F2A]/90 p-5 shadow-2xl backdrop-blur md:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9A88AD]">Bạn mới bắt đầu?</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#8E7CA3]">
                Từ chẩn đoán đến việc đầu tiên trong 20 phút.
              </p>
              <div className="mt-4 space-y-4">
                {[
                  { buoc: "1", ten: "Chẩn đoán 10 câu", moTa: "Biết điểm nghẽn lớn nhất", mau: "bg-[#C8943E]" },
                  { buoc: "2", ten: "Nhận 1 việc ưu tiên", moTa: "Không phải mười việc", mau: "bg-emerald-400" },
                  { buoc: "3", ten: "Chọn cấp độ phù hợp", moTa: "0đ, 2,5 triệu hoặc 9,8 triệu", mau: "bg-violet-400" },
                  { buoc: "4", ten: "Làm đến khi chạy", moTa: "Đo kết quả 30/90 ngày", mau: "bg-cyan-400" },
                ].map((item, index) => (
                  <div key={item.buoc} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-[#12081F] ${item.mau}`}>
                        {item.buoc}
                      </span>
                      {index < 3 ? <span className="mt-1 h-full w-px bg-white/10" /> : null}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-semibold text-[#F5EFE6]">{item.ten}</p>
                      <p className="mt-0.5 text-xs text-[#9A88AD]">{item.moTa}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-[#C8943E]/20 bg-[#C8943E]/[0.07] p-3.5">
                <p className="text-[11px] leading-relaxed text-[#D8CBE6]">
                  <span className="font-bold text-[#E8C07A]">Không cần đến Măng Đen trước.</span> Bạn có thể bắt đầu
                  hoàn toàn online, rồi chọn Forest khi cần một không gian để dừng lại và thiết kế lại.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BẠN ĐANG Ở ĐÂU ──────────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8943E]">Ba cấp độ đồng hành</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#F5EFE6] md:text-3xl">
              Bạn đang ở cấp độ nào?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9A88AD]">
              Chọn cấp độ gần nhất với trạng thái hiện tại. Không cần chọn đúng ngay — chẩn đoán sẽ giúp bạn nhìn rõ hơn.
            </p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Compass,
                nhan: "Cấp 1 · Mới bắt đầu",
                tieuDe: "Tôi có ý tưởng nhưng chưa biết bắt đầu từ đâu",
                moTa: "Chẩn đoán giúp bạn thấy việc ưu tiên. Nếu cần làm hộ pháp lý – thuế – ngân hàng trong 30 ngày, chọn OPC Launch.",
                muc: "Từ 0đ đến 9,8 triệu",
                href: "/chan-doan",
                cta: "Chẩn đoán miễn phí",
                mau: "text-[#E8C07A] bg-[#C8943E]/10 border-[#C8943E]/25",
              },
              {
                icon: BriefcaseBusiness,
                nhan: "Cấp 2 · Đang vận hành",
                tieuDe: "Tôi đã có doanh thu nhưng hệ thống còn rời rạc",
                moTa: "Chuẩn hóa một quy trình, vào Membership để giữ nhịp, hoặc Pro để có người đồng hành 90 ngày.",
                muc: "Từ 399.000đ/tháng",
                href: "/goi#van-hanh",
                cta: "Xem gói vận hành",
                mau: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
              },
              {
                icon: Leaf,
                nhan: "Cấp 3 · Đi xa hơn",
                tieuDe: "Tôi cần không gian, đối tác hoặc uy tín",
                moTa: "Retreat/Residency tại NOOI Forest, Partner cho tổ chức, Certified cho năng lực cá nhân.",
                muc: "Từ 1,5 triệu",
                href: "/goi#mo-rong",
                cta: "Xem cấp mở rộng",
                mau: "text-violet-300 bg-violet-400/10 border-violet-400/25",
              },
            ].map((item) => (
              <Link
                key={item.nhan}
                href={item.href}
                className="group flex flex-col rounded-3xl border border-white/10 bg-[#160D24] p-5 transition-colors hover:border-white/20 hover:bg-[#1A0F2A]"
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${item.mau}`}>
                  <item.icon size={18} />
                </span>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9A88AD]">{item.nhan}</p>
                <h3 className="mt-1.5 text-base font-bold leading-snug text-[#F5EFE6]">{item.tieuDe}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#9A88AD]">{item.moTa}</p>
                <p className="mt-3 text-[11px] font-semibold text-[#8E7CA3]">{item.muc}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#C8943E] group-hover:text-[#E8C07A]">
                  {item.cta} <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SẢN PHẨM THEO CẤP ĐỘ ────────────────────────────────────────── */}
      <section id="san-pham" className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8943E]">Ba cấp độ</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#F5EFE6] md:text-3xl">
              Đi từ đúng chỗ, không nhảy cóc.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9A88AD]">
              Mỗi cấp độ có sản phẩm và đầu ra riêng. Bạn có thể bắt đầu ở cấp 1, 2 hoặc 3 —
              chẩn đoán sẽ giúp xác nhận đâu là việc tiếp theo.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[#8E7CA3]">
              Mới bắt đầu? Bạn chỉ cần xem <span className="font-bold text-[#C8943E]">Cấp 1</span>.
              Hai cấp còn lại để dành khi bạn sẵn sàng.
            </p>
          </div>
          <Link href="/goi" className="inline-flex items-center gap-2 text-sm font-bold text-[#C8943E] hover:text-[#E8C07A]">
            So sánh tất cả <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-10 space-y-12">
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

      {/* ── KHÁCH HÀNG HIỆN HỮU ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="flex flex-col justify-between gap-5 rounded-3xl border border-violet-400/20 bg-violet-400/[0.06] p-5 md:flex-row md:items-center md:p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-300">Đã là khách hàng OPC?</p>
            <h2 className="mt-1.5 text-xl font-bold text-[#F5EFE6]">Tiếp tục từ nơi bạn đã dừng.</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#B9AAC8]">
              Đăng nhập để xem lộ trình, đơn hàng, cộng đồng và người phụ trách của bạn.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-300/30 bg-violet-400/10 px-4 py-3 text-sm font-bold text-violet-100 hover:bg-violet-400/15"
          >
            Đăng nhập không gian của tôi <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── CÁCH HOẠT ĐỘNG ──────────────────────────────────────────────── */}
      <section id="cach-hoat-dong" className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8943E]">Cách hoạt động</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#F5EFE6] md:text-3xl">
            Bốn bước, không vòng vo.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#9A88AD]">
            Mỗi bước có đầu ra rõ. Bạn luôn biết mình đang ở đâu và bước tiếp theo là gì.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {BUOC.map((buoc) => (
            <div key={buoc.so} className="rounded-3xl border border-white/10 bg-[#160D24] p-5">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-white/10">{buoc.so}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#C8943E]/25 bg-[#C8943E]/10 text-[#E8C07A]">
                  <buoc.icon size={17} />
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-[#F5EFE6]">{buoc.ten}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#9A88AD]">{buoc.moTa}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ONLINE → FOREST ─────────────────────────────────────────────── */}
      <section id="forest" className="border-y border-white/10 bg-[#0D0616]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">Online toàn quốc → Offline tại Forest</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#F5EFE6] md:text-3xl">
              Bắt đầu từ nơi bạn đang sống. Đi xa hơn khi bạn sẵn sàng.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#B9AAC8]">
              Phần lớn công việc có thể làm online: chẩn đoán, chuẩn hóa, mentor 1-1, AI. NOOI Forest là tầng nâng cấp
              cho những lúc cần dừng lại, nhìn lại và thiết kế lại.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Online", "Toàn quốc · làm việc với OPC qua video, Zalo, email"],
                ["OPC Day", "Hà Nội · TP.HCM · Đà Nẵng · Quảng Ngãi — 1 ngày"],
                ["Retreat", "Măng Đen · 3–7 ngày · chuyển hóa và kế hoạch 90 ngày"],
                ["Residency", "Măng Đen · 1–6 tháng · sống và làm việc tại Forest"],
              ].map(([ten, moTa]) => (
                <div key={ten} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-bold text-[#F5EFE6]">{ten}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#9A88AD]">{moTa}</p>
                </div>
              ))}
            </div>
            <Link
              href="/goi"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-200 transition-colors hover:bg-emerald-400/15"
            >
              Xem Retreat &amp; Residency <ArrowRight size={15} />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-400/15 bg-gradient-to-br from-emerald-500/10 via-[#160D24] to-[#0D0616] p-6 md:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                <MapPin size={13} /> Măng Đen · Kon Tum
              </span>
              <h3
                className="mt-5 text-3xl font-bold leading-tight text-[#F5EFE6]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Một nơi để làm việc
                <br />
                mà không bị cuốn đi.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#B9AAC8]">
                Rừng, khí hậu mát, không gian tĩnh và một cộng đồng nhỏ đang làm những việc nghiêm túc.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  ["Retreat 3–7 ngày", "Từ 15 triệu"],
                  ["Residency 1–6 tháng", "Từ 7 triệu/tháng"],
                  ["Day pass", "990.000 đ/ngày"],
                ].map(([ten, gia]) => (
                  <div key={ten} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3">
                    <span className="text-sm text-[#D8CBE6]">{ten}</span>
                    <span className="text-sm font-bold text-[#E8C07A]">{gia}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-[#7C6A8E]">
                Lịch và công suất thay đổi theo mùa. OPC xác nhận trước khi bạn thanh toán.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAM KẾT ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: MessageSquareText,
              ten: "Không hứa làm giàu",
              moTa: "OPC không bán giấc mơ. Chúng tôi giúp bạn làm đúng việc, đo đúng chỉ số và tiến từng bước.",
            },
            {
              icon: Target,
              ten: "Có lộ trình, có đầu ra",
              moTa: "Mỗi gói gắn với kết quả 30/90 ngày, không phải số giờ video hay số bài học.",
            },
            {
              icon: Users,
              ten: "Có người thật đồng hành",
              moTa: "Khi cần, bạn có một người phụ trách, một nhịp họp và một nơi để hỏi — không chỉ là chatbot.",
            },
          ].map((item) => (
            <div key={item.ten} className="rounded-3xl border border-white/10 bg-[#160D24] p-5 md:p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#C8943E]/25 bg-[#C8943E]/10 text-[#E8C07A]">
                <item.icon size={18} />
              </span>
              <h3 className="mt-4 text-base font-bold text-[#F5EFE6]">{item.ten}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9A88AD]">{item.moTa}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA CUỐI ────────────────────────────────────────────────────── */}
      <section className="px-4 pb-16 md:px-6 md:pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-[#C8943E]/25 bg-gradient-to-br from-[#C8943E]/15 via-[#1A0F2A] to-[#160D24] p-6 md:p-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#C8943E]/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8C07A]">
                <Check size={14} /> Miễn phí · 20 phút · Không cần thẻ
              </p>
              <h2
                className="mt-3 text-2xl font-bold leading-tight text-[#F5EFE6] md:text-3xl"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Việc tiếp theo của bạn là gì?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#C9BCD7]">
                Trả lời 10 câu. OPC sẽ chỉ ra điểm nghẽn lớn nhất và gói phù hợp — không cần để lại thẻ.
              </p>
            </div>
            <Link
              href="/chan-doan"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C8943E] px-5 py-4 text-sm font-bold text-[#160B22] transition-colors hover:bg-[#E8C07A]"
            >
              Bắt đầu chẩn đoán
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
