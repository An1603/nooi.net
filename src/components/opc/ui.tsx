"use client";

import type { ReactNode } from "react";
import type { OpcActionState } from "@/lib/opc/types";

export const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#0F0718] px-3 py-2 text-sm text-[#F5EFE6] placeholder:text-[#6F5D80] focus:border-[#C8943E]/60 focus:outline-none focus:ring-2 focus:ring-[#C8943E]/10";

export const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A797B8]";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[10px] text-[#7C6A8E]">{hint}</span> : null}
    </label>
  );
}

export function Alert({ state }: { state: OpcActionState }) {
  if (state.error) {
    return (
      <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
        {state.ok}
      </p>
    );
  }
  return null;
}

export function SubmitButton({
  pending,
  children,
  className = "",
}: {
  pending: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8943E] px-4 py-2 text-xs font-bold text-[#160B22] transition-colors hover:bg-[#E8C07A] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending ? "Đang lưu…" : children}
    </button>
  );
}
