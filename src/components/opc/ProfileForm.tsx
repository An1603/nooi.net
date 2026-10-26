"use client";

import { useActionState } from "react";
import { capNhatHoSo } from "@/app/opc/actions";
import type { OpcActionState } from "@/lib/opc/types";
import { Alert, Field, SubmitButton, inputCls } from "./ui";

export default function ProfileForm({
  ten,
  sdt,
  nghe,
  doanhThu,
  soNhanSu,
  mucTieu,
  diemChin,
}: {
  ten: string;
  sdt: string;
  nghe: string;
  doanhThu: string;
  soNhanSu: number;
  mucTieu: string;
  diemChin: number;
}) {
  const [state, action, pending] = useActionState<OpcActionState, FormData>(capNhatHoSo, {});

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Họ tên *">
          <input name="ten" required maxLength={120} defaultValue={ten} className={inputCls} />
        </Field>
        <Field label="Số điện thoại">
          <input name="sdt" maxLength={30} defaultValue={sdt} className={inputCls} inputMode="tel" />
        </Field>
        <Field label="Ngành / nghề">
          <input name="nghe" maxLength={120} defaultValue={nghe} className={inputCls} placeholder="Nông nghiệp, du lịch, giáo dục…" />
        </Field>
        <Field label="Quy mô doanh thu">
          <input name="doanh_thu" maxLength={60} defaultValue={doanhThu} className={inputCls} placeholder="Dưới 1 tỷ / 1–5 tỷ / trên 5 tỷ" />
        </Field>
        <Field label="Số nhân sự">
          <input name="so_nhan_su" type="number" min={0} max={100000} defaultValue={soNhanSu} className={inputCls} />
        </Field>
        <Field label="Điểm chín OPC (0–100)">
          <input name="diem_chin" type="number" min={0} max={100} defaultValue={diemChin} className={inputCls} />
        </Field>
      </div>

      <Field label="Mục tiêu 90 ngày">
        <textarea name="muc_tieu" rows={3} maxLength={1000} defaultValue={mucTieu} className={inputCls} placeholder="Một mục tiêu cụ thể, đo được…" />
      </Field>

      <Alert state={state} />

      <div className="flex justify-end">
        <SubmitButton pending={pending}>Lưu hồ sơ</SubmitButton>
      </div>
    </form>
  );
}
