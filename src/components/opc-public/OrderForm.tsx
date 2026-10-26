"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Check, Loader2, LockKeyhole } from "lucide-react";
import { datMua } from "@/app/opc-public/actions";
import type { PublicActionState } from "@/lib/opc/diagnostic";

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#0F0718] px-3.5 py-3 text-sm text-[#F5EFE6] placeholder:text-[#6F5D80] focus:border-[#C8943E]/60 focus:outline-none focus:ring-2 focus:ring-[#C8943E]/10";

export default function OrderForm({ ma, ten, tuVan = false }: { ma: string; ten: string; tuVan?: boolean }) {
  const [state, action, pending] = useActionState<PublicActionState, FormData>(datMua, {});

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
          <Check size={24} />
        </span>
        <h3 className="mt-3 text-lg font-bold text-[#F5EFE6]">
          {tuVan ? "Đã ghi nhận yêu cầu tư vấn" : `Đã ghi nhận yêu cầu ${ten}`}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[#C9BCD7]">
          {tuVan
            ? "OPC sẽ liên hệ trong 4 giờ làm việc để trao đổi nhu cầu và xem gói có phù hợp không. Bạn chưa bị trừ tiền."
            : "OPC sẽ liên hệ trong 4 giờ làm việc để xác nhận thông tin, thời gian bắt đầu và hướng dẫn thanh toán. Bạn chưa bị trừ tiền."}
        </p>
        <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/goi"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#C8943E] px-4 py-2.5 text-sm font-bold text-[#160B22] hover:bg-[#E8C07A]"
          >
            Xem gói khác <ArrowRight size={14} />
          </Link>
          <Link
            href="/chan-doan"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-[#F5EFE6] hover:bg-white/5"
          >
            Làm chẩn đoán
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="ma" value={ma} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A797B8]">Tên *</span>
          <input name="ten" required maxLength={120} className={inputCls} placeholder="Nguyễn Văn A" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A797B8]">
            Số điện thoại
          </span>
          <input name="sdt" maxLength={30} className={inputCls} placeholder="09xx xxx xxx" inputMode="tel" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A797B8]">Email</span>
          <input name="email" type="email" maxLength={160} className={inputCls} placeholder="email@domain.vn" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A797B8]">
            Bạn muốn OPC chuẩn bị gì? (không bắt buộc)
          </span>
          <textarea
            name="ghi_chu"
            rows={4}
            maxLength={1200}
            className={inputCls}
            placeholder={`Ví dụ: tôi muốn bắt đầu ${ten} trong tháng này, cần tư vấn thêm về…`}
          />
        </label>
      </div>

      <p className="text-[11px] leading-relaxed text-[#7C6A8E]">
        Cần ít nhất email hoặc số điện thoại. OPC liên hệ xác nhận trong 4 giờ làm việc; bạn chưa thanh toán ở bước này.
      </p>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {state.error ? (
        <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8943E] px-5 py-3.5 text-sm font-bold text-[#160B22] transition-colors hover:bg-[#E8C07A] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {pending ? "Đang gửi…" : "Gửi yêu cầu"}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#7C6A8E]">
        <LockKeyhole size={12} /> Thông tin chỉ dùng để OPC liên hệ về gói này.
      </p>
    </form>
  );
}
