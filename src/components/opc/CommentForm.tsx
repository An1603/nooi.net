"use client";

import { useActionState } from "react";
import { binhLuan } from "@/app/opc/actions";
import type { OpcActionState } from "@/lib/opc/types";
import { Alert, SubmitButton, inputCls } from "./ui";

export default function CommentForm({ baiDangId }: { baiDangId: string }) {
  const [state, action, pending] = useActionState<OpcActionState, FormData>(binhLuan, {});

  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="bai_dang_id" value={baiDangId} />
      <div className="flex gap-2">
        <input
          name="noi_dung"
          required
          maxLength={1000}
          className={inputCls}
          placeholder="Viết bình luận…"
        />
        <SubmitButton pending={pending} className="shrink-0 px-3">
          Gửi
        </SubmitButton>
      </div>
      <Alert state={state} />
    </form>
  );
}
