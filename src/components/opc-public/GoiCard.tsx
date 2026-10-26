import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import {
  formatGia,
  hrefCuaGoi,
  lopMau,
  nhanKy,
  type GoiCongKhai,
} from "@/lib/opc/public";

export default function GoiCard({ goi, noiBat = false }: { goi: GoiCongKhai; noiBat?: boolean }) {
  const mau = lopMau(goi.meta.accent);
  const mienPhi = goi.gia === 0;

  return (
    <article
      id={goi.ma}
      className={`group relative flex h-full flex-col rounded-3xl border bg-white/[0.035] p-5 transition-transform duration-200 hover:-translate-y-0.5 md:p-6 ${
        noiBat ? "border-[#C8943E]/50 bg-[#C8943E]/[0.06] shadow-[0_0_0_1px_rgba(200,148,62,0.12)]" : "border-white/10"
      }`}
    >
      {noiBat ? (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full border border-[#C8943E]/40 bg-[#1A0F2A] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#E8C07A]">
          <Sparkles size={10} /> Được chọn nhiều
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${mau.vien} ${mau.nen} ${mau.chu}`}>
            {goi.meta.badge ?? goi.meta.nhom}
          </span>
          <h3 className="mt-3 text-xl font-bold tracking-tight text-[#F5EFE6]">{goi.ten}</h3>
        </div>
        <span className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${mau.vien} ${mau.nen} ${mau.chu}`}>
          <span className="text-xs font-black">OPC</span>
        </span>
      </div>

      <p className="mt-2 min-h-[2.5rem] text-sm leading-relaxed text-[#B9AAC8]">{goi.meta.tagline}</p>

      <div className="mt-4 flex items-end gap-1.5">
        <span className="text-2xl font-black tracking-tight text-[#F5EFE6]">{formatGia(goi.gia)}</span>
        {!mienPhi ? <span className="pb-0.5 text-xs font-medium text-[#8E7CA3]">{nhanKy(goi.ky)}</span> : null}
      </div>
      {mienPhi ? <p className="mt-1 text-[11px] text-[#8E7CA3]">Không cần thẻ · 20 phút</p> : null}

      <ul className="mt-5 grid gap-2.5 text-sm text-[#D8CBE6]">
        {goi.quyenLoi.slice(0, 3).map((quyen) => (
          <li key={quyen} className="flex items-start gap-2">
            <Check size={15} className={`mt-0.5 shrink-0 ${mau.chu}`} />
            <span className="leading-snug">{quyen}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <Link
          href={hrefCuaGoi(goi)}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${mau.nut}`}
        >
          {goi.meta.cta}
          <ArrowRight size={15} />
        </Link>
        {!mienPhi ? (
          <p className="mt-2 text-center text-[11px] text-[#7C6A8E]">
            OPC liên hệ xác nhận trong 4 giờ làm việc
          </p>
        ) : null}
      </div>
    </article>
  );
}
