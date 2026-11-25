import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DANH_MUC, duongDanDanhMuc, tenDanhMuc } from "@/lib/video/danh-muc";
import { LayoutGrid, Play, Smartphone } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Danh sách danh mục của kho video.
 *
 * Đếm theo mã danh mục đang có trong dữ liệu; mã nào chưa khai trong DANH_MUC vẫn hiện
 * (lấy mã làm tên) nên không bao giờ mất video. Danh mục đã khai mà chưa có video nào
 * vẫn hiện để biết chỗ đưa video vào.
 */
export default async function DanhMucPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("videos").select("danh_muc, khung_hinh, duration");

  const dem = new Map<string, { so: number; doc: number; ngang: number; giay: number }>();
  for (const v of data ?? []) {
    const ma = (v.danh_muc ?? "").trim();
    if (!ma) continue;
    const m = dem.get(ma) ?? { so: 0, doc: 0, ngang: 0, giay: 0 };
    m.so += 1;
    if (v.khung_hinh === "doc") m.doc += 1;
    else m.ngang += 1;
    m.giay += v.duration ?? 0;
    dem.set(ma, m);
  }

  const chuaXep = (data ?? []).filter((v) => !(v.danh_muc ?? "").trim()).length;

  // Danh mục đã khai, rồi tới mã lạ có trong dữ liệu
  const maLa = [...dem.keys()].filter((m) => !DANH_MUC.some((d) => d.slug === m));
  const danhSach = [
    ...DANH_MUC.map((d) => ({ ...d, ...(dem.get(d.slug) ?? { so: 0, doc: 0, ngang: 0, giay: 0 }) })),
    ...maLa.map((m) => ({
      slug: m,
      ten: tenDanhMuc(m),
      moTa: "Danh mục chưa khai trong mã — hiện theo mã dữ liệu.",
      ...dem.get(m)!,
    })),
  ];

  return (
    <div className="page-shell page-shell-wide">
      <div className="mb-8 flex items-center gap-2">
        <LayoutGrid className="size-5 text-accent" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục kho video</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mỗi danh mục là một luồng vuốt riêng. Trong một danh mục, video dọc và ngang xếp chung —
            khung hình tự khớp màn hình, thông tin thu gọn để ưu tiên chỗ cho hình.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          Không đọc được kho video: {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {danhSach.map((d) => (
          <Link
            key={d.slug}
            href={duongDanDanhMuc(d.slug)}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-accent/30 hover:bg-card/80"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{d.ten}</h2>
              <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium">
                {d.so} video
              </span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{d.moTa}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {d.doc > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Smartphone size={13} /> {d.doc} dọc
                </span>
              )}
              {d.ngang > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Play size={13} /> {d.ngang} ngang
                </span>
              )}
              {d.giay > 0 && <span>{Math.round(d.giay / 60)} phút</span>}
            </div>
            <span className="mt-4 text-sm font-medium text-accent">
              {d.so > 0 ? "Mở luồng xem →" : "Chưa có video — vào đây để biết cách thêm"}
            </span>
          </Link>
        ))}
      </div>

      {chuaXep > 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          Còn <strong>{chuaXep}</strong> video chưa xếp danh mục. Vào{" "}
          <Link href="/app/videos" className="text-accent underline">
            kho video
          </Link>{" "}
          để gán danh mục cho từng bài.
        </p>
      )}
    </div>
  );
}
