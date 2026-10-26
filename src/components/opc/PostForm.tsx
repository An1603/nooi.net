"use client";

import { useActionState } from "react";
import { dangBai } from "@/app/opc/actions";
import { NHOM_CONG_DONG, type OpcActionState } from "@/lib/opc/types";
import { Alert, Field, SubmitButton, inputCls } from "./ui";

export default function PostForm() {
  const [state, action, pending] = useActionState<OpcActionState, FormData>(dangBai, {});

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <Field label="Tiêu đề">
          <input name="tieu_de" maxLength={160} className={inputCls} placeholder="Một câu hỏi hoặc một bài học…" />
        </Field>
        <Field label="Nhóm">
          <select name="nhom" className={inputCls} defaultValue="chung">
            {NHOM_CONG_DONG.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Nội dung *">
        <textarea
          name="noi_dung"
          required
          rows={3}
          maxLength={5000}
          className={inputCls}
          placeholder="Chia sẻ ngắn, cụ thể, có thể hành động…"
        />
      </Field>
      <Alert state={state} />
      <div className="flex justify-end">
        <SubmitButton pending={pending}>Đăng bài</SubmitButton>
      </div>
    </form>
  );
}
