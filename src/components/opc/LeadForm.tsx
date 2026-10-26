"use client";

import Link from "next/link";
import { useActionState } from "react";
import { taoLead } from "@/app/opc/actions";
import { LEAD_TRANG_THAI, NGUON_GOI_Y, type OpcActionState } from "@/lib/opc/types";
import { Alert, Field, SubmitButton, inputCls } from "./ui";

export default function LeadForm() {
  const [state, action, pending] = useActionState<OpcActionState, FormData>(taoLead, {});

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tên lead *">
          <input name="ten" required maxLength={120} className={inputCls} placeholder="Nguyễn Văn A" />
        </Field>
        <Field label="Số điện thoại">
          <input name="sdt" maxLength={30} className={inputCls} placeholder="09xx xxx xxx" inputMode="tel" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" maxLength={160} className={inputCls} placeholder="email@domain.vn" />
        </Field>
        <Field label="Nguồn">
          <select name="nguon" className={inputCls} defaultValue="">
            <option value="">Chọn nguồn</option>
            {NGUON_GOI_Y.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kênh / chiến dịch" hint="Ví dụ: TikTok tháng 10, referral đối tác">
          <input name="kenh" maxLength={60} className={inputCls} placeholder="TikTok · tháng 10" />
        </Field>
        <Field label="Trạng thái">
          <select name="trang_thai" className={inputCls} defaultValue="lead">
            {LEAD_TRANG_THAI.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Điểm tiềm năng (0–100)">
          <input name="diem" type="number" min={0} max={100} defaultValue={0} className={inputCls} />
        </Field>
      </div>

      <Field label="Ghi chú">
        <textarea name="ghi_chu" rows={3} maxLength={2000} className={inputCls} placeholder="Nhu cầu, ngân sách, thời điểm quyết định…" />
      </Field>

      <Alert state={state} />

      <div className="flex items-center justify-end gap-3">
        <Link href="/leads" className="text-xs font-semibold text-[#A797B8] hover:text-[#F5EFE6]">
          Huỷ
        </Link>
        <SubmitButton pending={pending}>Lưu lead</SubmitButton>
      </div>
    </form>
  );
}
