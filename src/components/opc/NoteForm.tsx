"use client";

import { useActionState } from "react";
import { themGhiChu } from "@/app/opc/actions";
import type { OpcActionState } from "@/lib/opc/types";
import { Alert, SubmitButton, inputCls } from "./ui";

export default function NoteForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState<OpcActionState, FormData>(themGhiChu, {});

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="lead_id" value={leadId} />
      <textarea
        name="noi_dung"
        required
        rows={2}
        maxLength={2000}
        className={inputCls}
        placeholder="Ghi lại cuộc gọi, tin nhắn hoặc bước tiếp theo…"
      />
      <Alert state={state} />
      <div className="flex justify-end">
        <SubmitButton pending={pending}>Thêm ghi chú</SubmitButton>
      </div>
    </form>
  );
}
