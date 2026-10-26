"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { CAU_HOI, tinhKetQua, type PublicActionState } from "@/lib/opc/diagnostic";
import { guiChanDoan } from "@/app/opc-public/actions";

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#0F0718] px-3.5 py-3 text-sm text-[#F5EFE6] placeholder:text-[#6F5D80] focus:border-[#C8943E]/60 focus:outline-none focus:ring-2 focus:ring-[#C8943E]/10";

function DiemVong({ diem }: { diem: number }) {
  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-[#C8943E]/30 bg-[#C8943E]/10">
      <div className="text-center">
        <p className="text-3xl font-black leading-none text-[#E8C07A]">{diem}</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A88AD]">/ 100</p>
      </div>
    </div>
  );
}

export default function DiagnosticForm() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState<PublicActionState, FormData>(guiChanDoan, {});

  const soTraLoi = CAU_HOI.filter((cau) =>
    cau.options.some((opt) => opt.value === answers[cau.id])
  ).length;
  const du = soTraLoi === CAU_HOI.length;
  const xemTruoc = useMemo(() => (du ? tinhKetQua(answers) : null), [answers, du]);
  const ketQua = state.ketQua ?? xemTruoc;

  return (
    <form action={action} className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-[#160D24] p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8943E]">Chẩn đoán OPC</p>
            <p className="mt-1 text-sm text-[#9A88AD]">10 câu · khoảng 20 phút · miễn phí</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-[#D8CBE6]">
            {soTraLoi}/10
          </span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#C8943E] to-[#E8C07A] transition-all duration-300"
            style={{ width: `${(soTraLoi / 10) * 100}%` }}
          />
        </div>
      </div>

      {CAU_HOI.map((cau, index) => (
        <fieldset key={cau.id} className="rounded-3xl border border-white/10 bg-[#160D24] p-5 md:p-6">
          <legend className="sr-only">{cau.label}</legend>
          <div className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#C8943E]/25 bg-[#C8943E]/10 text-[11px] font-black text-[#E8C07A]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold leading-snug text-[#F5EFE6]">{cau.label}</p>
              {cau.hint ? <p className="mt-1 text-xs leading-relaxed text-[#8E7CA3]">{cau.hint}</p> : null}
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {cau.options.map((opt) => {
                  const chon = answers[cau.id] === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-sm transition-colors ${
                        chon
                          ? "border-[#C8943E]/60 bg-[#C8943E]/10 text-[#F5EFE6]"
                          : "border-white/10 bg-white/[0.02] text-[#C9BCD7] hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={cau.id}
                        value={opt.value}
                        checked={chon}
                        onChange={() => setAnswers((cu) => ({ ...cu, [cau.id]: opt.value }))}
                        className="sr-only"
                        required
                      />
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          chon ? "border-[#C8943E] bg-[#C8943E]" : "border-white/25"
                        }`}
                      >
                        {chon ? <span className="h-1.5 w-1.5 rounded-full bg-[#160B22]" /> : null}
                      </span>
                      <span className="leading-snug">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </fieldset>
      ))}

      {ketQua ? (
        <div className="overflow-hidden rounded-3xl border border-[#C8943E]/30 bg-gradient-to-br from-[#C8943E]/15 via-[#1A0F2A] to-[#160D24] p-5 md:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <DiemVong diem={ketQua.diem} />
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#E8C07A]">
                <Sparkles size={13} /> Kết quả {state.ketQua ? "chẩn đoán" : "sơ bộ"}
              </p>
              <h3 className="mt-1 text-xl font-bold text-[#F5EFE6]">{ketQua.muc}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#C9BCD7]">{ketQua.moTa}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {ketQua.viecLam.map((viec, i) => (
              <div key={viec} className="rounded-2xl border border-white/10 bg-black/10 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9A88AD]">Việc {i + 1}</p>
                <p className="mt-1 text-sm leading-snug text-[#F5EFE6]">{viec}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#B9AAC8]">
              Gợi ý: <span className="font-bold text-[#E8C07A]">{ketQua.tenGoi}</span>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={ketQua.goiGoiY === "khoi-tao" ? "/goi#khoi-tao" : `/dat-mua/${ketQua.goiGoiY}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8943E] px-4 py-3 text-sm font-bold text-[#160B22] hover:bg-[#E8C07A]"
              >
                Xem gói {ketQua.tenGoi} <ArrowRight size={15} />
              </Link>
              <Link
                href="/goi"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-[#F5EFE6] hover:bg-white/5"
              >
                So sánh tất cả
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {du ? (
        <div className="rounded-3xl border border-white/10 bg-[#160D24] p-5 md:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8943E]">Nhận bản chẩn đoán đầy đủ</p>
          <h3 className="mt-2 text-lg font-bold text-[#F5EFE6]">Để lại thông tin để OPC gửi bản tóm tắt</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#9A88AD]">
            Không spam. OPC chỉ liên hệ về kết quả chẩn đoán và một buổi tư vấn 20 phút nếu bạn muốn.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
                Điều bạn muốn OPC biết thêm (không bắt buộc)
              </span>
              <textarea
                name="ghi_chu"
                rows={3}
                maxLength={1200}
                className={inputCls}
                placeholder="Ví dụ: tôi đang làm nội dung về sức khỏe, muốn chuẩn hóa quy trình bán hàng…"
              />
            </label>
          </div>
          <p className="mt-2 text-[11px] text-[#7C6A8E]">Cần ít nhất email hoặc số điện thoại để OPC liên hệ.</p>

          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          {state.error ? (
            <p className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {state.error}
            </p>
          ) : null}
          {state.ok ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              <Check size={14} className="mt-0.5 shrink-0" /> {state.ok}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#7C6A8E]">Bằng cách gửi, bạn đồng ý để OPC liên hệ về kết quả.</p>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8943E] px-5 py-3 text-sm font-bold text-[#160B22] transition-colors hover:bg-[#E8C07A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {pending ? "Đang gửi…" : "Nhận bản chẩn đoán"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs text-[#9A88AD]">
          Trả lời đủ 10 câu để xem kết quả và nhận bản tóm tắt.
        </div>
      )}
    </form>
  );
}
