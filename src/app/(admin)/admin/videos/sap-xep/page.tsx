import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { DANH_MUC, tenDanhMuc } from "@/lib/video/danh-muc";
import { ArrowLeft, ArrowUpDown } from "lucide-react";
import { BangSapXep, type MucSapXep } from "./BangSapXep";

export const dynamic = "force-dynamic";

/**
 * SẮP XẾP THỨ TỰ MẶC ĐỊNH của video TRONG TỪNG DANH MỤC.
 *
 * Vì sao tách khỏi trang danh sách: đây là việc làm theo lô (nhìn cả danh mục rồi đẩy lên/đẩy
 * xuống), làm trong bảng 300 dòng thì không thấy được thứ tự thật. Chọn danh mục → danh sách gọn
 * đúng thứ tự khán giả sẽ thấy → bấm ↑ ↓ là lưu ngay.
 */
export default async function SapXepVideoPage({
  searchParams,
}: {
  searchParams: Promise<{ dm?: string }>;
}) {
  const { dm } = await searchParams;
  const supabase = createAdminClient();

  // Đếm theo danh mục để chọn sẵn danh mục có nhiều bài nhất khi người quản trị chưa chọn
  const { data: demRaw } = await supabase.from("videos").select("danh_muc").neq("status", "deleted");
  const dem = new Map<string, number>();
  for (const v of (demRaw ?? []) as { danh_muc: string | null }[]) {
    const k = v.danh_muc ?? "";
    dem.set(k, (dem.get(k) ?? 0) + 1);
  }

  const danhSach = [
    ...DANH_MUC.map((d) => ({ slug: d.slug, ten: d.ten, so: dem.get(d.slug) ?? 0 })),
    ...[...dem.keys()]
      .filter((k) => k && !DANH_MUC.some((d) => d.slug === k))
      .map((k) => ({ slug: k, ten: tenDanhMuc(k), so: dem.get(k) ?? 0 })),
    { slug: "__chua-xep", ten: "Chưa xếp danh mục", so: dem.get("") ?? 0 },
  ];

  // Chưa chọn → lấy danh mục nhiều bài nhất (bỏ qua danh mục rỗng)
  const dangChon =
    dm !== undefined ? dm : [...danhSach].sort((a, b) => b.so - a.so)[0]?.slug ?? "";

  let truyVan = supabase
    .from("videos")
    .select("id, title, thumbnail_url, kenh_phat, khung_hinh, thu_tu, duration, created_at")
    .order("thu_tu", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300)
    .neq("status", "deleted"); // bài trong thùng rác không nằm trong thứ tự hiển thị

  truyVan = dangChon === "__chua-xep" ? truyVan.is("danh_muc", null) : truyVan.eq("danh_muc", dangChon);

  const { data, error } = await truyVan;
  const muc = (data ?? []) as MucSapXep[];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/videos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Kho video
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <ArrowUpDown size={18} className="text-primary" /> Sắp xếp thứ tự trong danh mục
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Thứ tự này là thứ tự MẶC ĐỊNH khi khán giả mở danh mục — áp dụng cho cả kho công khai
            lẫn khu thành viên.
          </p>
        </div>
      </div>

      {/* Chọn danh mục */}
      <div className="flex flex-wrap gap-1.5">
        {danhSach.map((d) => {
          const chon = d.slug === dangChon;
          return (
            <Link
              key={d.slug || "trong"}
              href={`/admin/videos/sap-xep?dm=${encodeURIComponent(d.slug)}`}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                chon
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.ten} ({d.so})
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Lỗi: {error.message}
        </div>
      )}

      {muc.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/50 p-10 text-center text-sm text-muted-foreground">
          Danh mục này chưa có video nào.
        </p>
      ) : (
        <BangSapXep danhMuc={dangChon === "__chua-xep" ? "" : dangChon} muc={muc} />
      )}
    </div>
  );
}
