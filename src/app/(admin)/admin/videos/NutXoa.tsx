"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { xoaVideo } from "./actions";

/**
 * Nút CHUYỂN VIDEO VÀO THÙNG RÁC (kèm hộp xác nhận).
 *
 * Ngài An 27/11/2026: xoá phải có đường lùi. Nút này KHÔNG xoá khỏi cơ sở dữ liệu — chỉ đổi
 * `status` thành "deleted" để bài biến khỏi mọi danh sách; muốn xoá thật thì vào Thùng rác.
 * Nhờ vậy một cú bấm nhầm (hoặc thao tác hàng loạt) không làm mất dữ liệu.
 */
export function NutXoa({
  id,
  tieuDe,
}: {
  id: string;
  tieuDe: string;
  laBunny?: boolean;
}) {
  const [mo, setMo] = useState(false);
  const [loi, setLoi] = useState("");
  const [dangXoa, batDau] = useTransition();

  function xacNhan() {
    setLoi("");
    batDau(async () => {
      const kq = await xoaVideo(id);
      if (kq && "error" in kq) {
        setLoi(kq.error);
        return;
      }
      setMo(false);
      // Tải lại cả trang: `router.refresh()` có lúc vẫn dùng lại gói dữ liệu đã đệm nên dòng vừa
      // đổi trạng thái vẫn nằm trên bảng (đã gặp 27/11/2026).
      window.location.reload();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMo(true)}
        title="Chuyển vào thùng rác"
        className="inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 text-[11px] hover:border-red-500/40 hover:text-red-400"
      >
        <Trash2 size={12} /> Bỏ
      </button>

      {mo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Chuyển video vào thùng rác"
        >
          <div className="w-full max-w-md rounded-xl border border-border/50 bg-[#0d0d0d] p-5">
            <h2 className="text-sm font-semibold">Chuyển video vào thùng rác?</h2>
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{tieuDe}</p>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Bài sẽ biến khỏi mọi danh sách nhưng vẫn nằm trong <strong>Thùng rác</strong> — lấy lại
              được. Tệp trên Bunny chưa bị đụng tới.
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
                Vào thùng rác
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
