"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUp, GripVertical, Loader2, RotateCcw, Save } from "lucide-react";
import { doiThuTu, boThuTu, luuThuTu } from "../actions";

export interface MucSapXep {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  kenh_phat?: string | null;
  khung_hinh?: string | null;
  thu_tu?: number | null;
  duration?: number | null;
}

/**
 * BẢNG SẮP XẾP THỨ TỰ MẶC ĐỊNH trong một danh mục.
 *
 * Ngài An yêu cầu 27/11/2026: đặt được thứ tự mặc định cho video trong danh mục. Cách làm: ↑ ↓ đổi
 * chỗ một bậc, LƯU NGAY (không có nút "Lưu" phải nhớ bấm — quên bấm là mất công sắp). Thứ tự xếp
 * theo `thu_tu` giảm dần rồi mới tới ngày tạo, đúng như lưới xem; máy chủ ghi lại cả danh mục nên
 * sau nhiều lần bấm thứ tự vẫn liền mạch, không sinh số trùng.
 */
export function BangSapXep({ danhMuc, muc }: { danhMuc: string; muc: MucSapXep[] }) {
  const [ds, setDs] = useState(muc);
  const [dangChay, batDau] = useTransition();
  const [dongDangDoi, setDongDangDoi] = useState<string | null>(null);
  const [loi, setLoi] = useState("");
  /** Vị trí đang kéo và vị trí đang rê lên — chỉ để vẽ phản hồi trên màn hình */
  const [dangKeo, setDangKeo] = useState<number | null>(null);
  /**
   * Bản ghi vị trí đang kéo bằng ref: `drop` có thể xảy ra NGAY sau `dragstart` (chuột kéo nhanh,
   * hoặc trình duyệt tự động), khi đó state chưa kịp cập nhật và thao tác thả sẽ bị bỏ qua.
   */
  const dangKeoRef = useRef<number | null>(null);
  const [trenDiem, setTrenDiem] = useState<number | null>(null);

  // Máy chủ trả danh sách mới sau khi ghi → đồng bộ lại (giữ đúng thứ tự thật trong cơ sở dữ liệu)
  useEffect(() => setDs(muc), [muc]);

  function doi(id: string, huong: "len" | "xuong") {
    setLoi("");
    // Đổi ngay trên màn hình để bấm liền mấy nhịp vẫn thấy phản hồi
    const i = ds.findIndex((v) => v.id === id);
    const j = huong === "len" ? i - 1 : i + 1;
    if (i === -1 || j < 0 || j >= ds.length) return;
    const moi = [...ds];
    [moi[i], moi[j]] = [moi[j], moi[i]];
    setDs(moi);

    setDongDangDoi(id);
    batDau(async () => {
      const kq = await doiThuTu(danhMuc, id, huong);
      if (kq && "error" in kq) {
        setLoi(kq.error);
        setDs(ds); // trả về thứ tự cũ nếu máy chủ từ chối
      }
      setDongDangDoi(null);
    });
  }

  function datLai() {
    setLoi("");
    batDau(async () => {
      const kq = await boThuTu(danhMuc);
      if (kq && "error" in kq) setLoi(kq.error);
    });
  }

  /**
   * KÉO–THẢ: thả xuống vị trí nào thì chèn bài đang kéo vào vị trí đó, rồi LƯU cả danh mục.
   *
   * Lưu cả danh sách (chứ không chỉ đổi hai số) vì thứ tự sau khi kéo là một DÃY mới — ghi lại toàn
   * bộ thì lần kéo sau luôn tính từ đúng thứ tự đang thấy, không bị lệch dần.
   */
  function tha(viTriTha: number) {
    const tu = dangKeoRef.current;
    if (tu === null || tu === viTriTha) {
      dangKeoRef.current = null;
      setDangKeo(null);
      setTrenDiem(null);
      return;
    }
    const truoc = ds;
    const moi = [...ds];
    const [mucKeo] = moi.splice(tu, 1);
    moi.splice(viTriTha, 0, mucKeo);
    setDs(moi);
    dangKeoRef.current = null;
    setDangKeo(null);
    setTrenDiem(null);
    setLoi("");

    batDau(async () => {
      const kq = await luuThuTu(danhMuc, moi.map((x) => x.id));
      if (kq && "error" in kq) {
        setLoi(kq.error);
        setDs(truoc); // máy chủ từ chối thì trả về thứ tự cũ
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {ds.length} bài · bài trên cùng là bài hiện ra ĐẦU TIÊN khi xem danh mục này.
        </p>
        <button
          type="button"
          onClick={datLai}
          disabled={dangChay}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-60"
        >
          <RotateCcw size={13} /> Bỏ thứ tự đặt tay (về mới nhất trước)
        </button>
      </div>

      {loi && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {loi}
        </p>
      )}

      <ol className="divide-y divide-border/10 overflow-hidden rounded-xl border border-border/50 bg-[#0d0d0d]">
        {ds.map((v, i) => (
          <li
            key={v.id}
            draggable
            onDragStart={() => {
              dangKeoRef.current = i;
              setDangKeo(i);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setTrenDiem(i);
            }}
            onDragLeave={() => setTrenDiem((x) => (x === i ? null : x))}
            onDrop={(e) => {
              e.preventDefault();
              tha(i);
            }}
            onDragEnd={() => {
              dangKeoRef.current = null;
              setDangKeo(null);
              setTrenDiem(null);
            }}
            className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
              dangKeo === i ? "opacity-40" : "hover:bg-white/[0.02]"
            } ${trenDiem === i && dangKeo !== null && dangKeo !== i ? "border-t-2 border-primary" : ""}`}
          >
            <span
              className="cursor-grab text-muted-foreground active:cursor-grabbing"
              title="Kéo để đổi thứ tự"
              aria-hidden
            >
              <GripVertical size={14} />
            </span>
            <span className="w-6 shrink-0 text-center text-xs font-mono text-muted-foreground">
              {i + 1}
            </span>

            <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-black/40">
              {v.thumbnail_url ? (
                <Image
                  src={v.thumbnail_url}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-[10px] text-muted-foreground">—</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/videos/${v.id}/edit`}
                className="line-clamp-1 text-sm font-medium hover:text-primary"
              >
                {v.title}
              </Link>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {v.khung_hinh === "doc" ? "9:16" : "16:9"} ·{" "}
                {v.kenh_phat === "bunny" ? "Bunny" : v.kenh_phat === "truc-tiep" ? "Tệp trực tiếp" : "YouTube"}{" "}
                · thứ tự {v.thu_tu ?? 0}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {dongDangDoi === v.id && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
              <button
                type="button"
                onClick={() => doi(v.id, "len")}
                disabled={i === 0 || dangChay}
                aria-label={`Đưa “${v.title}” lên`}
                className="grid size-7 place-items-center rounded-md border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => doi(v.id, "xuong")}
                disabled={i === ds.length - 1 || dangChay}
                aria-label={`Đưa “${v.title}” xuống`}
                className="grid size-7 place-items-center rounded-md border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowDown size={13} />
              </button>
            </div>
          </li>
        ))}
      </ol>

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Save size={12} /> KÉO–THẢ dòng để đổi thứ tự, hoặc bấm ↑ ↓ — mỗi lần đổi là lưu ngay, không
        cần bấm thêm nút nào.
      </p>
    </div>
  );
}
