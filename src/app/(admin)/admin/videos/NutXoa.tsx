"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, X } from "lucide-react";
import { xoaVideo } from "./actions";

/**
 * Nút XOÁ video kèm hộp xác nhận.
 *
 * Video Bunny có thêm lựa chọn "xoá cả bản gốc trên Bunny Stream" — mặc định BẬT, vì xoá mỗi hàng
 * trong cơ sở dữ liệu thì tệp vẫn nằm trên Bunny (vẫn phát được bằng link trực tiếp, vẫn tốn dung
 * lượng). Người quản trị vẫn có thể bỏ chọn nếu chỉ muốn gỡ khỏi web.
 */
export function NutXoa({
  id,
  tieuDe,
  laBunny,
}: {
  id: string;
  tieuDe: string;
  laBunny: boolean;
}) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [xoaBunny, setXoaBunny] = useState(true);
  const [loi, setLoi] = useState("");
  const [dangXoa, batDau] = useTransition();

  function xacNhan() {
    setLoi("");
    batDau(async () => {
      const kq = await xoaVideo(id, laBunny && xoaBunny);
      if (kq && "error" in kq) {
        setLoi(kq.error);
        return;
      }
      setMo(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMo(true)}
        title="Xoá video"
        className="inline-flex items-center gap-1 rounded-md border border-red-500/30 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/10"
      >
        <Trash2 size={12} /> Xoá
      </button>

      {mo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận xoá video"
        >
          <div className="w-full max-w-md rounded-xl border border-border/50 bg-[#0d0d0d] p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold">Xoá video này?</h2>
              <button type="button" onClick={() => setMo(false)} aria-label="Đóng">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            <p className="line-clamp-2 text-sm text-muted-foreground">{tieuDe}</p>

            {laBunny && (
              <label className="mt-3 flex items-start gap-2 rounded-lg border border-border/40 bg-[#111] p-3 text-sm">
                <input
                  type="checkbox"
                  checked={xoaBunny}
                  onChange={(e) => setXoaBunny(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--primary)]"
                />
                <span>
                  Xoá cả bản gốc trên <strong>Bunny Stream</strong>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    Bỏ chọn nếu chỉ muốn gỡ khỏi web và giữ tệp trên Bunny.
                  </span>
                </span>
              </label>
            )}

            <p className="mt-3 text-[11px] text-muted-foreground">
              Xoá khỏi cơ sở dữ liệu là không khôi phục được.
            </p>

            {loi && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {loi}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMo(false)}
                className="rounded-lg border border-border/50 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={xacNhan}
                disabled={dangXoa}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {dangXoa ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Xoá video
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
