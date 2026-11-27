import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LuoiVideoCongKhai } from "@/components/video/LuoiVideoCongKhai";
import { VideoCard, type VideoCardData } from "@/components/content/VideoCard";
import { COT_LUOI_CONG_KHAI, nguoiDangXem } from "@/lib/video/nguoi-xem";
import type { VideoCongKhai } from "@/lib/video/quyen-xem";
import { cn } from "@/lib/utils";
import { Edit3, Library, Plus, UserRound } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * KHO VIDEO CỦA THÀNH VIÊN — một cửa duy nhất cho mọi việc liên quan tới video trong `/app`.
 *
 * Ngài An chốt 27/11/2026: bên ngoài (`/video`) đã tinh chỉnh xong cách hiển thị và cấu trúc xem,
 * nên trong `/app` không giữ ba cửa trùng nhau (`/app/videos` · `/app/danh-muc` · `/app/short`) làm
 * gì nữa. Ba trang đó lặp lại đúng một việc — mở danh sách rồi mở luồng xem — chỉ khác bộ lọc.
 *
 * Cách gộp (giữ đúng nguyên tắc "một cách hiển thị, nhiều bộ lọc"):
 *   • `?tab=thu-vien` (mặc định) — DÙNG LẠI `LuoiVideoCongKhai`, đúng thành phần của trang công
 *     khai: chip danh mục kèm số lượng, tìm, lọc khổ hình, lọc quyền, sắp xếp, điều kiện ghi lên
 *     địa chỉ. Nhờ vậy "vuốt dọc" chỉ còn là bộ lọc `?kh=doc` chứ không phải một trang riêng.
 *   • `?tab=cua-toi` — video của chính mình (mọi trạng thái) để quản lý, kèm nút sửa.
 *
 * Dữ liệu: bài ĐÃ XUẤT BẢN (đọc bằng khoá dịch vụ như trang công khai, vì RLS của bảng `videos`
 * khoá theo chủ sở hữu) + bài CỦA CHÍNH MÌNH (kể cả chưa xuất bản, để xem trước). Trùng mã thì bản
 * của mình thắng — nhờ vậy chủ video vẫn thấy bài nháp của mình trong kho.
 */
export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const dangQuanLy = tab === "cua-toi";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* ── Thẻ "Của tôi": quản lý video của chính mình ── */
  if (dangQuanLy) {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", user?.id ?? "")
      .order("updated_at", { ascending: false });

    const cuaToi = (data ?? []) as VideoCardData[];

    return (
      <div className="page-shell page-shell-wide">
        <DauTrang dangQuanLy />

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="text-sm text-destructive">Lỗi khi tải video: {error.message}</p>
          </div>
        )}

        {!error && cuaToi.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <div className="mb-4 text-4xl">🎬</div>
            <h3 className="mb-2 text-lg font-semibold">Chưa có video nào của bạn</h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
              Đăng video đầu tiên — nó sẽ hiện ngay trong kho video bên thẻ “Thư viện”.
            </p>
            <Link
              href="/app/videos/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              <Plus size={16} /> Thêm video đầu tiên
            </Link>
          </div>
        )}

        {!error && cuaToi.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cuaToi.map((video) => (
              <div key={video.id}>
                <VideoCard video={video} />
                {/* Nút sửa nằm NGOÀI thẻ: thẻ là một <a> (bấm để xem), lồng <a> trong <a> là HTML sai */}
                <Link
                  href={`/app/videos/${video.id}/edit`}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-accent"
                >
                  <Edit3 size={12} /> Chỉnh sửa
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Thẻ "Thư viện": xem như trang công khai, thêm bài của chính mình ── */
  const [nguoi, { data: xuatBan }, { data: cuaToi }] = await Promise.all([
    nguoiDangXem(),
    createAdminClient()
      .from("videos")
      .select(COT_LUOI_CONG_KHAI)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("videos").select(COT_LUOI_CONG_KHAI).eq("user_id", user?.id ?? ""),
  ]);

  const theoMa = new Map<string, VideoCongKhai>();
  for (const v of (xuatBan ?? []) as unknown as VideoCongKhai[]) theoMa.set(v.id, v);
  // Bản của mình ghi đè — video nháp của chủ vẫn nằm trong kho để xem trước
  for (const v of (cuaToi ?? []) as unknown as VideoCongKhai[]) theoMa.set(v.id, v);
  const videos = [...theoMa.values()].sort((a, b) =>
    (b.created_at || "").localeCompare(a.created_at || "")
  );

  return (
    <div className="page-shell page-shell-wide">
      <DauTrang />

      <LuoiVideoCongKhai videos={videos} nguoi={nguoi} tienToBai="/app/videos" />

      <p className="mt-8 text-center text-[11px] text-muted-foreground/70">
        Nội dung thuộc hệ sinh thái NOOI. Vui lòng ghi rõ nguồn khi chia sẻ lại.
      </p>
    </div>
  );
}

/** Đầu trang: tiêu đề + hai thẻ (Thư viện · Của tôi) + nút thêm video. */
function DauTrang({ dangQuanLy = false }: { dangQuanLy?: boolean }) {
  const the = [
    { nhan: "Thư viện", href: "/app/videos", icon: Library, chon: !dangQuanLy },
    { nhan: "Của tôi", href: "/app/videos?tab=cua-toi", icon: UserRound, chon: dangQuanLy },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kho video</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dangQuanLy
            ? "Video của bạn — mọi trạng thái. Sửa từng bài, hoặc mở để xem trước."
            : "Xem như kho công khai, thêm video dành cho thành viên. Lọc theo danh mục, khổ hình (dọc = vuốt như TikTok), quyền xem."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {the.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                t.chon
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon size={14} />
              {t.nhan}
            </Link>
          ))}
        </div>

        <Link
          href="/app/videos/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <Plus size={16} /> Video mới
        </Link>
      </div>
    </div>
  );
}
