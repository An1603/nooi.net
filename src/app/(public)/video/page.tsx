import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { LuoiVideoCongKhai } from "@/components/video/LuoiVideoCongKhai";
import { COT_LUOI_CONG_KHAI, nguoiDangXem } from "@/lib/video/nguoi-xem";
import type { VideoCongKhai } from "@/lib/video/quyen-xem";

export const dynamic = "force-dynamic";

/**
 * Danh sách video cho lưới — ĐỆM 60 GIÂY.
 *
 * Vì sao: trang vẫn phải chạy động (mỗi người thấy ổ khoá khác nhau theo phiên đăng nhập), nhưng
 * câu truy vấn Supabase thì giống nhau cho mọi người. Đệm lại để lần mở sau không phải chờ thêm
 * một vòng máy chủ — phần chậm nhất của trang.
 */
const layKhoVideo = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("videos")
      .select(COT_LUOI_CONG_KHAI)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(300);
    return (data ?? []) as unknown as VideoCongKhai[];
  },
  ["kho-video-cong-khai"],
  { revalidate: 60, tags: ["videos"] }
);

export const metadata: Metadata = {
  title: "Kho video NOOI",
  description:
    "Kho video NOOI: tư liệu quy hoạch, dự án, bài giảng và chia sẻ. Video dành cho thành viên được đánh dấu ổ khoá — bấm vào để đăng nhập.",
  openGraph: {
    title: "Kho video NOOI",
    description: "Thư viện video của NOOI — xem công khai hoặc đăng nhập để mở video thành viên.",
    locale: "vi_VN",
    type: "website",
    siteName: "NOOI",
  },
};

/**
 * Kho video công khai tại `/video` — kiểu xem như `/gallery` nhưng giữ nhận diện nooi.net.
 *
 * Vì sao đọc bằng khoá dịch vụ (service role) ở máy chủ: bảng `videos` đang khoá theo chủ sở
 * hữu (RLS), đọc bằng khoá ẩn danh sẽ ra rỗng. Trang này chỉ lấy những cột an toàn để vẽ lưới
 * (KHÔNG lấy `url`) và chỉ lấy bài đã xuất bản; video nào cần quyền thì cổng gác `xetQuyenXem`
 * quyết định hiện ổ khoá — đường phát chỉ được lấy ở trang xem và chỉ khi đã qua cổng gác.
 */
export default async function KhoVideoPage() {
  const [videos, nguoi] = await Promise.all([layKhoVideo(), nguoiDangXem()]);

  const soMo = videos.filter((v) => v.cong_khai === true).length;

  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Kho video NOOI</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Tư liệu quy hoạch, dự án và bài giảng của NOOI. {soMo > 0 && <>{soMo} video xem công khai. </>}
            Video nào hiện ổ khoá là video dành cho thành viên — bấm vào để đăng nhập ngay tại chỗ.
          </p>
        </header>

        <LuoiVideoCongKhai videos={videos} nguoi={nguoi} />

        <p className="mt-10 text-center text-[11px] text-muted-foreground/70">
          Nội dung thuộc hệ sinh thái NOOI. Vui lòng ghi rõ nguồn khi chia sẻ lại.
        </p>
      </div>
    </main>
  );
}
