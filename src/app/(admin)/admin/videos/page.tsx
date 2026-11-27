import { createAdminClient } from "@/lib/supabase/admin";
import { DANH_MUC, tenDanhMuc } from "@/lib/video/danh-muc";
import { BangVideoQuanTri, type MucChon, type MucVideo } from "./BangVideoQuanTri";

export const dynamic = "force-dynamic";

/**
 * QUẢN TRỊ KHO VIDEO — xem thử · thêm · sửa · xoá (một bài hoặc nhiều bài) · đặt thứ tự.
 *
 * Trang máy chủ chỉ ĐỌC dữ liệu (bằng khoá dịch vụ, vì phải thấy video của mọi người — RLS của
 * bảng `videos` khoá theo chủ sở hữu) rồi truyền xuống `BangVideoQuanTri`; mọi thao tác ghi nằm
 * trong `actions.ts` và tự kiểm quyền quản trị trước khi chạm dữ liệu.
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

  const laThungRac = dm === "__thung-rac";
  let truyVan = supabase.from("videos").select("*").limit(300);
  if (laThungRac) truyVan = truyVan.like("danh_muc", "__thung-rac|%");
  else {
    // Bài trong thùng rác không hiện ở danh sách thường (xem DAU_THUNG_RAC trong actions.ts)
    truyVan = truyVan.not("danh_muc", "like", "__thung-rac|%");
    if (dm === "__chua-xep") truyVan = truyVan.is("danh_muc", null);
    else if (dm) truyVan = truyVan.eq("danh_muc", dm);
  }
  if (q.trim()) truyVan = truyVan.ilike("title", `%${q.trim()}%`);
  truyVan = truyVan.order("thu_tu", { ascending: false }).order("created_at", { ascending: false });

  const { data: videos, error } = await truyVan;
  const ds = (videos ?? []) as Record<string, unknown>[];

  // Đếm theo danh mục trên TOÀN kho (không theo bộ lọc) để ô chọn danh mục biết số lượng
  const { data: demRaw } = await supabase.from("videos").select("danh_muc, status");
  const dem = new Map<string, number>();
  let soThungRac = 0;
  for (const v of (demRaw ?? []) as { danh_muc: string | null; status: string | null }[]) {
    if ((v.danh_muc ?? "").startsWith("__thung-rac|")) {
      soThungRac += 1;
      continue;
    }
    const k = v.danh_muc ?? "__chua-xep";
    dem.set(k, (dem.get(k) ?? 0) + 1);
  }
  const tong = [...dem.values()].reduce((t, n) => t + n, 0);

  const danhSach: MucChon[] = [
    ...DANH_MUC.map((d) => ({ slug: d.slug, ten: d.ten, so: dem.get(d.slug) ?? 0 })),
    ...[...dem.keys()]
      .filter(
        (k) =>
          k &&
          k !== "__chua-xep" &&
          !k.startsWith("__thung-rac") &&
          !DANH_MUC.some((d) => d.slug === k)
      )
      .map((k) => ({ slug: k, ten: tenDanhMuc(k), so: dem.get(k) ?? 0 })),
    { slug: "__chua-xep", ten: "Chưa xếp danh mục", so: dem.get("__chua-xep") ?? 0 },
    { slug: "__thung-rac", ten: "Thùng rác", so: soThungRac },
  ];

  // Tên người đăng (không join được vì thiếu khoá ngoại — giữ cách cũ)
  const userIds = [...new Set(ds.map((v) => v.user_id as string).filter(Boolean))];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
      : { data: [] as { user_id: string; full_name: string }[] };
  const tenNguoi = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

  const muc: MucVideo[] = ds.map((v) => ({
    id: v.id as string,
    title: v.title as string,
    description: (v.description as string) ?? null,
    thumbnail_url: (v.thumbnail_url as string) ?? null,
    url: (v.url as string) ?? null,
    danh_muc: (v.danh_muc as string) ?? null,
    kenh_phat: (v.kenh_phat as string) ?? null,
    khung_hinh: (v.khung_hinh as string) ?? null,
    duration: (v.duration as number) ?? null,
    thu_tu: (v.thu_tu as number) ?? 0,
    status: (v.status as string) ?? null,
    cong_khai: (v.cong_khai as boolean) ?? null,
    created_at: v.created_at as string,
    user_id: (v.user_id as string) ?? null,
    tenNguoi: tenNguoi.get(v.user_id as string) ?? null,
  }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Kho video</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Xem thử · thêm · sửa · chuyển vào thùng rác (tick nhiều dòng để làm một lúc) · đặt thứ tự
          mặc định trong danh mục.
          {dm || q ? ` Đang lọc: ${muc.length}/${tong} bài.` : ` Tổng: ${muc.length} bài.`}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Lỗi: {error.message}
        </div>
      )}

      <BangVideoQuanTri
        videos={muc}
        dm={dm}
        q={q}
        danhSach={danhSach}
        tong={tong}
        thungRac={laThungRac}
      />

      <p className="text-[11px] text-muted-foreground">
        Bảng xếp đúng như lưới xem: số <strong>thu_tu</strong> lớn đứng trước, chưa đặt thì bài mới
        nhất đứng trước. Chọn một danh mục rồi <strong>kéo dòng</strong> (hoặc bấm ↑ ↓ ngay trên
        dòng) để đổi thứ tự — lưu ngay, áp dụng cho cả kho công khai và khu thành viên.
      </p>
    </div>
  );
}
