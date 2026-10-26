"use client";

import { useActionState } from "react";
import { capNhatLead } from "@/app/opc/actions";
import { LEAD_TRANG_THAI, type OpcActionState } from "@/lib/opc/types";
import { Alert, Field, SubmitButton, inputCls } from "./ui";

export default function LeadDetailForm({
  leadId,
  trangThai,
  chuSoHuu,
  ghiChu,
  nhanVien,
}: {
  leadId: string;
  trangThai: string;
  chuSoHuu: string | null;
  ghiChu: string | null;
  nhanVien: { id: string; ten: string | null; email: string | null }[];
}) {
  const [state, action, pending] = useActionState<OpcActionState, FormData>(capNhatLead, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="lead_id" value={leadId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Trạng thái">
          <select name="trang_thai" className={inputCls} defaultValue={trangThai}>
            {LEAD_TRANG_THAI.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Người phụ trách">
          <select name="chu_so_huu" className={inputCls} defaultValue={chuSoHuu || ""}>
            <option value="">Chưa gán</option>
            {nhanVien.map((n) => (
              <option key={n.id} value={n.id}>
                {n.ten || n.email || n.id}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Ghi chú nội bộ">
        <textarea name="ghi_chu" rows={3} maxLength={2000} defaultValue={ghiChu || ""} className={inputCls} />
      </Field>

      <Alert state={state} />

      <div className="flex justify-end">
        <SubmitButton pending={pending}>Cập nhật lead</SubmitButton>
      </div>
    </form>
  );
}
