import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CircleHelp,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  CAP_DO,
  formatGia,
  getGoiCongKhai,
  getGoiTheoMa,
  hrefCuaGoi,
  lopMau,
  nhanKy,
  type GoiCongKhai,
} from "@/lib/opc/public";
import { chiTietCuaGoi } from "@/lib/opc/goi-chi-tiet";

type PageProps = { params: Promise<{ ma: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ma } = await params;
  const goi = await getGoiTheoMa(ma);
  if (!goi) return { title: "Không tìm thấy sản phẩm" };
  const ct = chiTietCuaGoi(goi.ma);
  const moTa = ct?.dinhVi ?? goi.meta.tagline;
  return {
    title: { absolute: `${goi.ten} — ${goi.meta.tagline} · OPC Center` },
    description: moTa,
    alternates: { canonical: `https://opc.nooi.net/goi/${goi.ma}` },
    openGraph: {
      title: `${goi.ten} · OPC Center`,
      description: moTa,
      url: `https://opc.nooi.net/goi/${goi.ma}`,
      type: "website",
      locale: "vi_VN",
    },
  };
}

/** Một khối nội dung có tiêu đề + mô tả. */
function Section({
  nhan,
  tieuDe,
  moTa,
  children,
  id,
}: {
  nhan: string;
  tieuDe: string;
  moTa?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/10 py-12 md:py-16">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8943E]">{nhan}</p>
      <h2
        className="mt-2 max-w-3xl text-2xl font-bold leading-tight text-[#F5EFE6] md:text-3xl"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {tieuDe}
      </h2>
      {moTa ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9A88AD]">{moTa}</p> : null}
      <div className="mt-7">{children}</div>
    </section>
  );
}

export default async function ChiTietGoiPage({ params }: PageProps) {
  const { ma } = await params;
  const goi = await getGoiTheoMa(ma);
  if (!goi) notFound();

  const ct = chiTietCuaGoi(goi.ma);
  if (!ct) notFound();

  const mau = lopMau(goi.meta.accent);
  const mienPhi = goi.gia === 0;
  const cap = CAP_DO.find((c) => c.ma.includes(goi.ma));
  const danhSach = await getGoiCongKhai();
  const lienQuan: { ma: string; moTa: string; goi: GoiCongKhai }[] = ct.soSanh
    .map((item) => {
      const goiLienQuan = danhSach.find((g) => g.ma === item.ma);
      return goiLienQuan ? { ma: item.ma, moTa: item.moTa, goi: goiLienQuan } : null;
    })
    .filter((item): item is { ma: string; moTa: string; goi: GoiCongKhai } => item !== null);

  const ctaHref = hrefCuaGoi(goi);
  const ctaLabel = goi.meta.cta;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: goi.ten,
    description: ct.dinhVi,
    brand: { "@type": "Brand", name: "OPC Center" },
    category: cap?.ten ?? "Sản phẩm OPC",
    offers: {
      "@type": "Offer",
      price: goi.gia,
      priceCurrency: "VND",
      availability: "https://schema.org/InStock",
      url: `https://opc.nooi.net/goi/${goi.ma}`,
    },
  };

  return (
    <main className="relative overflow-hidden pb-24 lg:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#C8943E]/10 blur-[110px]" />
        <div className="absolute right-0 top-32 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <nav className="flex flex-wrap items-center gap-1.5 pt-6 text-[11px] font-semibold text-[#8E7CA3]">
          <Link href="/" className="hover:text-[#F5EFE6]">OPC Center</Link>
          <span aria-hidden>/</span>
          <Link href="/goi" className="hover:text-[#F5EFE6]">Sản phẩm</Link>
          {cap ? (
            <>
              <span aria-hidden>/</span>
              <Link href={`/goi#${cap.id}`} className="hover:text-[#F5EFE6]">{cap.ten}</Link>
            </>
          ) : null}
          <span aria-hidden>/</span>
          <span className="text-[#C9BCD7]">{goi.ten}</span>
        </nav>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div className="grid gap-10 pb-12 pt-7 md:pt-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-start lg:gap-12">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {cap ? (
                <span className="inline-flex rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C9BCD7]">
                  {cap.nhan}
                </span>
              ) : null}
              <span
                className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] ${mau.vien} ${mau.nen} ${mau.chu}`}
              >
                {goi.meta.badge ?? "Sản phẩm OPC"}
              </span>
            </div>

            <h1
              className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-[#F5EFE6] md:text-5xl"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {goi.ten}
            </h1>
            <p className={`mt-3 text-lg font-semibold ${mau.chu}`}>{goi.meta.tagline}</p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#C9BCD7] md:text-base">
              {ct.dinhVi}
            </p>

            <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E7CA3]">
                  <Clock size={12} /> Thời gian
                </dt>
                <dd className="mt-1.5 text-xs font-semibold leading-snug text-[#E6DBF2]">{ct.thoiGian}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E7CA3]">
                  <MapPin size={12} /> Hình thức
                </dt>
                <dd className="mt-1.5 text-xs font-semibold leading-snug text-[#E6DBF2]">{ct.hinhThuc}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E7CA3]">
                  <ShieldCheck size={12} /> Cam kết
                </dt>
                <dd className="mt-1.5 text-xs font-semibold leading-snug text-[#E6DBF2]">
                  {ct.chinhSach[0]}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={ctaHref}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-colors ${mau.nut}`}
              >
                {ctaLabel} <ArrowRight size={16} />
              </Link>
              <Link
                href="/chan-doan"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3.5 text-sm font-semibold text-[#F5EFE6] transition-colors hover:bg-white/5"
              >
                Chưa chắc phù hợp? Chẩn đoán miễn phí
              </Link>
            </div>
          </div>

          {/* ── Thẻ giá (sticky desktop) ─────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24">
            <div className={`rounded-3xl border bg-[#160D24] p-5 md:p-6 ${mau.vien}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9A88AD]">
                    {mienPhi ? "Miễn phí" : "Học phí / phí dịch vụ"}
                  </p>
                  <div className="mt-2 flex items-end gap-1.5">
                    <span className="text-3xl font-black tracking-tight text-[#F5EFE6]">
                      {formatGia(goi.gia)}
                    </span>
                    {!mienPhi ? (
                      <span className="pb-1 text-xs text-[#8E7CA3]">{nhanKy(goi.ky)}</span>
                    ) : null}
                  </div>
                  {mienPhi ? (
                    <p className="mt-1 text-[11px] text-[#8E7CA3]">Không cần thẻ · 20 phút</p>
                  ) : null}
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${mau.vien} ${mau.nen} ${mau.chu}`}>
                  <BadgeCheck size={18} />
                </span>
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9A88AD]">
                  Bao gồm
                </p>
                <ul className="mt-3 grid gap-2.5">
                  {goi.quyenLoi.map((quyen) => (
                    <li key={quyen} className="flex items-start gap-2 text-sm text-[#D8CBE6]">
                      <Check size={15} className={`mt-0.5 shrink-0 ${mau.chu}`} />
                      <span className="leading-snug">{quyen}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={ctaHref}
                className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${mau.nut}`}
              >
                {ctaLabel} <ArrowRight size={15} />
              </Link>
              <p className="mt-2 text-center text-[11px] leading-relaxed text-[#7C6A8E]">
                {mienPhi
                  ? "Không cần thẻ, không cam kết mua gói."
                  : "OPC xác nhận trong 4 giờ làm việc. Bạn chưa bị trừ tiền ở bước này."}
              </p>
            </div>
          </aside>
        </div>

        {/* ── Phù hợp / không phù hợp ────────────────────────────────────── */}
        <Section
          nhan="Tự nhận diện"
          tieuDe="Bạn có đang ở đúng chỗ này không?"
          moTa="Gói tốt là gói khớp với việc bạn đang làm. Nếu phần lớn dấu hiệu dưới đây không đúng, đừng mua — hãy chọn gói khác."
          id="phu-hop"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                Phù hợp nếu
              </p>
              <ul className="mt-4 grid gap-3">
                {ct.phuHop.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#DCEFE6]">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9A88AD]">
                Chưa phù hợp nếu
              </p>
              <ul className="mt-4 grid gap-3">
                {ct.khongPhuHop.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#B9AAC8]">
                    <X size={16} className="mt-0.5 shrink-0 text-[#8E7CA3]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed text-[#8E7CA3]">
                Nếu bạn thuộc nhóm thứ hai, OPC sẽ nói thẳng và gợi ý gói đúng hơn — không bán bằng mọi giá.
              </p>
            </div>
          </div>
        </Section>

        {/* ── Đầu ra ────────────────────────────────────────────────────── */}
        <Section
          nhan="Đầu ra"
          tieuDe="Bạn ra khỏi gói với cái gì?"
          moTa="Ba thứ cầm được trên tay — không phải cảm giác đã học xong."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {ct.dauRa.map((item, i) => (
              <div
                key={item.ten}
                className="rounded-3xl border border-white/10 bg-[#160D24] p-5 transition-colors hover:border-white/20"
              >
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl border text-xs font-black ${mau.vien} ${mau.nen} ${mau.chu}`}>
                  0{i + 1}
                </span>
                <h3 className="mt-4 text-base font-bold leading-snug text-[#F5EFE6]">{item.ten}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9A88AD]">{item.moTa}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Bên trong gói ─────────────────────────────────────────────── */}
        <Section
          nhan="Bên trong"
          tieuDe="Bạn nhận được gì trong từng giai đoạn"
          moTa="Cấu phần cụ thể, để bạn so được với bất kỳ lựa chọn nào khác trên thị trường."
        >
          <ol className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-[#160D24]">
            {ct.noiDung.map((item, i) => (
              <li key={item.ten} className="flex gap-4 p-5 transition-colors hover:bg-white/[0.03]">
                <span className="mt-0.5 text-xs font-black tabular-nums text-[#7C6A8E]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-bold text-[#F5EFE6]">{item.ten}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#9A88AD]">{item.moTa}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── Cách hoạt động ────────────────────────────────────────────── */}
        <Section
          nhan="Cách hoạt động"
          tieuDe="Bạn sẽ đi qua những bước nào"
          moTa="Không mơ hồ: mỗi bước có việc của bạn, việc của OPC và dấu hiệu hoàn tất."
          id="cach-hoat-dong"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ct.cachHoatDong.map((item, i) => (
              <div key={item.buoc} className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-black ${mau.vien} ${mau.nen} ${mau.chu}`}>
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-bold text-[#F5EFE6]">{item.buoc}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#9A88AD]">{item.moTa}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Chính sách ────────────────────────────────────────────────── */}
        <Section
          nhan="Minh bạch"
          tieuDe="Giá, chính sách và điều kiện"
          moTa="Những điều bạn cần biết trước khi trả tiền. OPC không giấu điều khoản trong bước xác nhận."
          id="chinh-sach"
        >
          <div className="grid gap-4 rounded-3xl border border-white/10 bg-[#160D24] p-5 md:grid-cols-2 md:p-6">
            <ul className="grid gap-3">
              {ct.chinhSach.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#D8CBE6]">
                  <ShieldCheck size={16} className={`mt-0.5 shrink-0 ${mau.chu}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9A88AD]">
                Cam kết xử lý
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#C9BCD7]">
                OPC phản hồi trong 4 giờ làm việc, xác nhận rõ gói – thời gian – chính sách huỷ trước khi
                thu tiền, và không thêm phí ngoài báo giá đã xác nhận.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[#8E7CA3]">
                Cần kiểm tra trước khi trả tiền? Gọi hoặc để lại thông tin ở bước đặt mua — OPC sẽ nói rõ
                gói này có đúng nhu cầu hay không.
              </p>
            </div>
          </div>
        </Section>

        {/* ── So sánh ───────────────────────────────────────────────────── */}
        {lienQuan.length > 0 ? (
          <Section
            nhan="So sánh"
            tieuDe="Gói này so với lựa chọn gần nhất"
            moTa="Ba gói không thay thế nhau. Chọn theo việc bạn cần xong, không theo giá."
            id="so-sanh"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {lienQuan.map((item) => (
                <Link
                  key={item.goi.ma}
                  href={`/goi/${item.goi.ma}`}
                  className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-[#C8943E]/40 hover:bg-[#C8943E]/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8E7CA3]">
                        {formatGia(item.goi.gia)} {item.goi.gia ? nhanKy(item.goi.ky) : ""}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-[#F5EFE6]">{item.goi.ten}</h3>
                    </div>
                    <ArrowRight
                      size={16}
                      className="mt-1 shrink-0 text-[#8E7CA3] transition-transform group-hover:translate-x-0.5 group-hover:text-[#E8C07A]"
                    />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#9A88AD]">{item.moTa}</p>
                </Link>
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <Section
          nhan="Hỏi đáp"
          tieuDe="Câu hỏi thường gặp về gói này"
          id="faq"
        >
          <div className="divide-y divide-white/10 rounded-3xl border border-white/10 bg-[#160D24]">
            {ct.faq.map((item) => (
              <details key={item.hoi} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#F5EFE6]">
                  {item.hoi}
                  <span className="text-[#C8943E] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#9A88AD]">{item.dap}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* ── CTA cuối ──────────────────────────────────────────────────── */}
        <section className="border-t border-white/10 py-12 md:py-16">
          <div className="relative overflow-hidden rounded-3xl border border-[#C8943E]/25 bg-[#C8943E]/[0.07] p-6 md:p-9">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#C8943E]/15 blur-3xl" />
            <div className="relative max-w-2xl">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8C07A]">
                <Sparkles size={12} /> Bước tiếp theo
              </p>
              <h2
                className="mt-3 text-2xl font-bold leading-tight text-[#F5EFE6] md:text-3xl"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {mienPhi ? "Bắt đầu bằng 20 phút chẩn đoán." : `Bắt đầu ${goi.ten} khi bạn đã rõ việc cần làm.`}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#D8CBE6]">
                {mienPhi
                  ? "Không cần thẻ, không cam kết. Bạn nhận bản chẩn đoán 1 trang và lộ trình 30 ngày."
                  : "Để lại thông tin để OPC xác nhận gói, thời gian bắt đầu và chính sách trước khi thanh toán."}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={ctaHref}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-colors ${mau.nut}`}
                >
                  {ctaLabel} <ArrowRight size={16} />
                </Link>
                <Link
                  href="/goi"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3.5 text-sm font-semibold text-[#F5EFE6] transition-colors hover:bg-white/5"
                >
                  <ArrowLeft size={15} /> Xem tất cả sản phẩm
                </Link>
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#9A88AD]">
                <CircleHelp size={14} className="mt-0.5 shrink-0 text-[#C8943E]" />
                Chưa chắc nên chọn gói nào? Chẩn đoán miễn phí sẽ chỉ ra việc nên làm trước — kể cả khi câu
                trả lời là “chưa cần mua gói nào”.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ── CTA dính đáy trên mobile ─────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#12081F]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E7CA3]">{goi.ten}</p>
            <p className="text-base font-black text-[#F5EFE6]">
              {formatGia(goi.gia)}
              {!mienPhi ? <span className="ml-1 text-[11px] font-medium text-[#8E7CA3]">{nhanKy(goi.ky)}</span> : null}
            </p>
          </div>
          <Link
            href={ctaHref}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold ${mau.nut}`}
          >
            {ctaLabel} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </main>
  );
}
