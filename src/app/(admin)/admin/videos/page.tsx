import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { DANH_MUC, tenDanhMuc } from "@/lib/video/danh-muc";
import { ArrowUpDown, Play, Plus, Users } from "lucide-react";
import { NutXoa } from "./NutXoa";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { nhan: string; lop: string }> = {
  published: { nhan: "Đã xuất bản", lop: "bg-blue-500/10 text-blue-400" },
  ready: { nhan: "Sẵn sàng", lop: "bg-emerald-500/10 text-emerald-400" },
  processing: { nhan: "Đang xử lý", lop: "bg-amber-500/10 text-amber-400" },
  failed: { nhan: "Thất bại", lop: "bg-red-500/10 text-red-400" },
};

const KENH: Record<string, string> = {
  youtube: "YouTube",
  bunny: "Bunny",
  "truc-tiep": "Tệp trực tiếp",
};

function thoiLuong(giay?: number | null) {
  if (!giay) return "—";
  const m = Math.floor(giay / 60);
  const s = giay % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * QUẢN TRỊ KHO VIDEO — thêm · sửa · xoá (kèm xoá bản gốc trên Bunny) · đặt thứ tự trong danh mục.
 *
 * Đọc bằng khoá dịch vụ vì phải thấy video của MỌI người dùng (RLS của bảng `videos` khoá theo chủ
 * sở hữu). Mọi thao tác ghi nằm trong `actions.ts` — mỗi hàm ở đó tự kiểm quyền quản trị trước khi
 * chạm dữ liệu, vì khoá dịch vụ bỏ qua mọi hàng rào.
 *
 * Thứ tự ở bảng này CỐ Ý khớp lưới xem (`thu_tu` giảm dần, rồi mới nhất trước) để người quản trị
 * nhìn thấy đúng thứ tự khán giả sẽ thấy.
 */
export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ dm?: string; q?: string }>;
}) {
  const { dm = "", q = "" } = await searchParams;
  const supabase = createAdminClient();

  let truyVan = supabase.from("videos").select("*").limit(300);
  if (dm === "__chua-xep") truyVan = truyVan.is("danh_muc", null);
  else if (dm) truyVan = truyVan.eq("danh_muc", dm);
  if (q.trim()) truyVan = truyVan.ilike("title", `%${q.trim()}%`);
  truyVan = truyVan.order("thu_tu", { ascending: false }).order("created_at", { ascending: false });

  const { data: videos, error } = await truyVan;
  const ds = (videos ?? []) as Record<string, unknown>[];

  // Đếm theo danh mục trên TOÀN kho (không theo bộ lọc) để chip biết số lượng
  const { data: demRaw } = await supabase.from("videos").select("danh_muc");
  const dem = new Map<string, number>();
  for (const v of (demRaw ?? []) as { danh_muc: string | null }[]) {
    const k = v.danh_muc ?? "__chua-xep";
    dem.set(k, (dem.get(k) ?? 0) + 1);
  }
  const tong = [...dem.values()].reduce((t, n) => t + n, 0);

  // Tên người đăng (không join được vì thiếu khoá ngoại — giữ cách cũ)
  const userIds = [...new Set(ds.map((v) => v.user_id as string).filter(Boolean))];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
      : { data: [] as { user_id: string; full_name: string }[] };
  const tenNguoi = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Kho video</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thêm · sửa · xoá video và đặt thứ tự mặc định trong từng danh mục.
            {dm || q ? ` Đang lọc: ${ds.length}/${tong} bài.` : ` Tổng: ${ds.length} bài.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/videos/sap-xep"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowUpDown size={15} /> Sắp xếp thứ tự
          </Link>
          <Link
            href="/admin/videos/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            <Plus size={15} /> Thêm video
          </Link>
        </div>
      </div>

      {/* Lọc: danh mục + tìm theo tiêu đề. Dùng GET để chia sẻ được đường dẫn đang lọc. */}
      <form className="flex flex-wrap items-center gap-2" action="/admin/videos">
        <select
          name="dm"
          defaultValue={dm}
          className="rounded-lg border border-border/50 bg-[#111] px-3 py-1.5 text-sm"
        >
          <option value="">Mọi danh mục ({tong})</option>
          {DANH_MUC.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.ten} ({dem.get(d.slug) ?? 0})
            </option>
          ))}
          <option value="__chua-xep">Chưa xếp danh mục ({dem.get("__chua-xep") ?? 0})</option>
        </select>
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm theo tiêu đề…"
          className="min-w-[200px] flex-1 rounded-lg border border-border/50 bg-[#111] px-3 py-1.5 text-sm"
        />
        <button type="submit" className="rounded-lg border border-border/50 px-3 py-1.5 text-sm">
          Lọc
        </button>
        {(dm || q) && (
          <Link href="/admin/videos" className="text-xs text-muted-foreground underline">
            Xoá lọc
          </Link>
        )}
      </form>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Lỗi: {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/50 bg-[#0d0d0d]">
        {ds.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Không có video nào khớp bộ lọc.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Video</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
                    Danh mục
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">
                    Người đăng
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium text-muted-foreground sm:table-cell">
                    Thứ tự
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium text-muted-foreground sm:table-cell">
                    Kênh
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium text-muted-foreground sm:table-cell">
                    Trạng thái
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium text-muted-foreground sm:table-cell">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Việc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {ds.map((v) => {
                  const id = v.id as string;
                  const laBunny = v.kenh_phat === "bunny";
                  const st = STATUS[(v.status as string) ?? ""] ?? STATUS.processing;
                  return (
                    <tr key={id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-red-500/10">
                            {v.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={v.thumbnail_url as string}
                                alt=""
                                className="size-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Play className="size-4 text-red-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/videos/${id}/edit`}
                              className="line-clamp-1 text-sm font-medium hover:text-primary"
                            >
                              {v.title as string}
                            </Link>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {v.khung_hinh === "doc" ? "9:16" : "16:9"} ·{" "}
                              {thoiLuong(v.duration as number)} · {v.cong_khai ? "công khai" : "nội bộ"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                        {v.danh_muc ? tenDanhMuc(v.danh_muc as string) : "—"}
                      </td>

                      <td className="hidden px-4 py-3 text-xs lg:table-cell">
                        <Link
                          href={`/admin/users/${v.user_id}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Users className="size-3 text-muted-foreground" />
                          {tenNguoi.get(v.user_id as string) || String(v.user_id).slice(0, 8)}
                        </Link>
                      </td>

                      <td className="hidden px-4 py-3 text-center text-xs sm:table-cell">
                        {(v.thu_tu as number) ?? 0}
                      </td>

                      <td className="hidden px-4 py-3 text-center text-xs text-muted-foreground sm:table-cell">
                        {KENH[(v.kenh_phat as string) ?? ""] ?? "—"}
                      </td>

                      <td className="hidden px-4 py-3 text-center sm:table-cell">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${st.lop}`}>{st.nhan}</span>
                      </td>

                      <td className="hidden px-4 py-3 text-center text-xs text-muted-foreground sm:table-cell">
                        {new Date(v.created_at as string).toLocaleDateString("vi-VN")}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/videos/${id}/edit`}
                            className="rounded-md border border-border/50 px-2 py-1 text-[11px] hover:text-primary"
                          >
                            Sửa
                          </Link>
                          <NutXoa id={id} tieuDe={v.title as string} laBunny={laBunny} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Bảng xếp đúng như lưới xem: số <strong>thu_tu</strong> lớn đứng trước, chưa đặt thì bài mới
        nhất đứng trước. Đổi nhanh bằng ↑ ↓ ở trang{" "}
        <Link href="/admin/videos/sap-xep" className="underline">
          Sắp xếp thứ tự
        </Link>
        .
      </p>
    </div>
  );
}
