import type { Metadata } from "next";
import Link from "next/link";
import { Award, BadgeCheck, Star, Users } from "lucide-react";
import { DauTrangPhanHe } from "@/components/public/DauTrangPhanHe";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chuyên gia NOOI — đội ngũ đồng hành thân tâm",
  description:
    "Hồ sơ chuyên gia, mentor của NOOI: thiền, khí công, yoga, tâm lý học ứng dụng, dinh dưỡng. Xem chuyên môn, số năm kinh nghiệm và đặt lịch đồng hành.",
  alternates: { canonical: "/chuyen-gia" },
  openGraph: {
    title: "Chuyên gia NOOI",
    description: "Đội ngũ mentor đồng hành 1-1 trên hành trình thân tâm.",
    locale: "vi_VN",
    type: "website",
    siteName: "NOOI",
  },
};

type MentorRow = {
  id: string;
  user_id: string;
  title: string | null;
  bio: string | null;
  specialties: string[] | null;
  experience_years: number | null;
  rating: number | null;
  review_count: number | null;
};

/**
 * Trang chuyên gia — công khai.
 *
 * Vì sao đọc bằng khoá dịch vụ ở máy chủ: bảng `mentors` khoá theo chủ sở hữu (RLS), đọc
 * bằng khoá ẩn danh sẽ ra rỗng. Ở đây chỉ lấy những cột dùng để giới thiệu — KHÔNG lấy
 * email, số điện thoại hay mã người dùng. Tên hiển thị lấy từ `profiles` và chỉ lấy
 * `full_name`; không đụng tới ngày sinh, lá số hay dữ liệu cá nhân khác.
 */
async function layChuyenGia() {
  try {
    const admin = createAdminClient();
    const { data: mentors } = await admin
      .from("mentors")
      .select("id, user_id, title, bio, specialties, experience_years, rating, review_count")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .limit(60);

    const ds = (mentors ?? []) as MentorRow[];
    if (ds.length === 0) return [];

    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", ds.map((m) => m.user_id));

    const ten = new Map<string, string>();
    (profiles ?? []).forEach((p: { user_id: string; full_name: string | null }) => {
      if (p.full_name) ten.set(p.user_id, p.full_name);
    });

    return ds.map((m) => ({
      ...m,
      hoTen: ten.get(m.user_id) ?? "Chuyên gia NOOI",
    }));
  } catch {
    // Trang công khai không được sập vì cơ sở dữ liệu — hiện trạng thái “đang cập nhật”
    return [];
  }
}

function chuDau(ten: string) {
  return ten
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default async function ChuyenGiaPage() {
  const ds = await layChuyenGia();

  return (
    <main className="min-h-[100dvh] bg-background">
      <DauTrangPhanHe
        ten="Chuyên gia"
        moTa="Người thật, chuyên môn thật. Mỗi hồ sơ ghi rõ lĩnh vực, số năm hành nghề và đánh giá của học viên — để bạn chọn đúng người đồng hành."
        duongDan={[{ nhan: "Chuyên gia" }]}
        hanhDong={[
          { nhan: "Đặt lịch đồng hành", href: "/login?redirect=/app/mentors", chinh: true },
          { nhan: "Trở thành chuyên gia", href: "/signup" },
        ]}
      >
        <div className="mt-6 flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users size={13} /> {ds.length > 0 ? `${ds.length} chuyên gia đang hoạt động` : "Đang cập nhật đội ngũ"}
          </span>
          <span className="flex items-center gap-1.5">
            <BadgeCheck size={13} /> Hồ sơ được NOOI xác minh
          </span>
        </div>
      </DauTrangPhanHe>

      <div className="mx-auto w-full max-w-[1680px] px-[clamp(16px,3vw,34px)] pb-20">
        {ds.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-10 text-center">
            <p className="text-[15px] font-semibold">Đội ngũ đang được cập nhật</p>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-muted-foreground">
              Hồ sơ chuyên gia sẽ hiện tại đây. Trong lúc chờ, bạn có thể xem kho video và kho
              tri thức để bắt đầu thực hành.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/video" className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
                Xem kho video
              </Link>
              <Link href="/kho-tri-thuc" className="rounded-lg border border-border px-5 py-2 text-sm">
                Đọc kho tri thức
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ds.map((m) => (
              <article
                key={m.id}
                className="flex flex-col rounded-xl border border-border bg-card/40 p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/60 text-[15px] font-semibold text-primary">
                    {chuDau(m.hoTen)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold">{m.hoTen}</h2>
                    {m.title && (
                      <p className="truncate text-[12px] text-muted-foreground">{m.title}</p>
                    )}
                  </div>
                </div>

                {m.bio && (
                  <p className="mt-4 line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">
                    {m.bio}
                  </p>
                )}

                {m.specialties && m.specialties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.specialties.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-foreground/75"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-[11.5px] text-muted-foreground">
                  {typeof m.rating === "number" && (
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-primary" />
                      {m.rating.toFixed(1)}
                      {m.review_count ? ` (${m.review_count})` : ""}
                    </span>
                  )}
                  {m.experience_years ? (
                    <span className="flex items-center gap-1">
                      <Award size={12} /> {m.experience_years} năm
                    </span>
                  ) : null}
                  <Link
                    href="/login?redirect=/app/mentors"
                    className="ml-auto text-[12px] font-medium text-foreground/85 hover:text-primary"
                  >
                    Kết nối →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-[11px] text-muted-foreground/70">
          Thông tin chuyên gia do chính chuyên gia cung cấp và được NOOI xác minh trước khi
          hiển thị công khai.
        </p>
      </div>
    </main>
  );
}
