import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, MapPin, Sprout } from "lucide-react";
import { DauTrangPhanHe } from "@/components/public/DauTrangPhanHe";
import { NutMoDangNhap } from "@/components/auth/NutMoDangNhap";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dự án NOOI — NOOI Forest, eKid, OPC, GIS",
  description:
    "Các dự án NOOI đang triển khai: NOOI Forest (Măng Đen – Đăk Rve), eKid, OPC Storefront, bản đồ số GIS. Mục tiêu, địa bàn và tiến độ.",
  alternates: { canonical: "/du-an" },
  openGraph: {
    title: "Dự án NOOI",
    description: "NOOI Forest, eKid, OPC Storefront, bản đồ số GIS — mục tiêu và tiến độ.",
    locale: "vi_VN",
    type: "website",
    siteName: "NOOI",
  },
};

type DuAnRow = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  status: string | null;
  cover_image: string | null;
  location: string | null;
  highlights: unknown;
  investment_target: number | null;
};

const NHAN_TRANG_THAI: Record<string, string> = {
  in_progress: "Đang triển khai",
  planning: "Đang chuẩn bị",
  completed: "Đã hoàn thành",
  paused: "Tạm dừng",
};

/** Hệ sinh thái đang chạy trên hạ tầng NOOI — không phải bảng `projects`, là sản phẩm thật. */
const HE_SINH_THAI = [
  {
    ten: "eKid",
    moTa: "Trợ lý học tập AI cho bé — bài học, luyện tập và báo cáo cho phụ huynh.",
    href: "https://ekid.nooi.net",
    nhan: "ekid.nooi.net",
  },
  {
    ten: "OPC Center",
    moTa: "Cửa hàng và trung tâm OPC: sản phẩm, đơn hàng, hoạt động cộng đồng.",
    href: "https://opc.nooi.net",
    nhan: "opc.nooi.net",
  },
  {
    ten: "Bản đồ số GIS",
    moTa: "Tra cứu thửa đất, quy hoạch và dữ liệu địa bàn trên nền bản đồ số.",
    href: "https://gis.nooi.net",
    nhan: "gis.nooi.net",
  },
  {
    ten: "NOOI Slides",
    moTa: "Kho bài trình bày nội bộ và cho đối tác — cấp quyền theo tài khoản.",
    href: "https://slides.nooi.net",
    nhan: "slides.nooi.net",
  },
];

function docDiemNhan(m: unknown): string[] {
  if (!Array.isArray(m)) return [];
  return m
    .map((x) => (typeof x === "string" ? x : typeof x === "object" && x && "text" in x ? String((x as { text: unknown }).text) : ""))
    .filter(Boolean)
    .slice(0, 4);
}

function tien(v: number | null) {
  if (!v || v <= 0) return null;
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 1)} tỷ đồng`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} triệu đồng`;
  return `${v.toLocaleString("vi-VN")} đồng`;
}

async function layDuAn(): Promise<DuAnRow[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("projects")
      .select("id, title, slug, description, status, cover_image, location, highlights, investment_target")
      .order("created_at", { ascending: false })
      .limit(30);
    return (data ?? []) as DuAnRow[];
  } catch {
    return [];
  }
}

/**
 * Trang dự án — công khai.
 *
 * Cách trình bày: mỗi dự án là MỘT khối rộng (ảnh + mô tả + điểm nhấn), không phải lưới thẻ
 * nhỏ. Lý do: dự án cần đọc, không cần lướt; và số dự án luôn ít hơn video rất nhiều.
 */
export default async function DuAnPage() {
  const ds = await layDuAn();

  return (
    <main className="min-h-[100dvh] bg-background">
      <DauTrangPhanHe
        ten="Dự án"
        moTa="Những việc NOOI đang thực sự làm — từ hệ sinh thái rừng tại Măng Đen đến các sản phẩm số đang chạy hằng ngày."
        duongDan={[{ nhan: "Dự án" }]}
        hanhDong={[
          { nhan: "Hợp tác cùng NOOI", href: "/#contact", chinh: true },
          { nhan: "Xem tiện ích", href: "/tien-ich" },
        ]}
      />

      <div className="mx-auto w-full max-w-[1680px] px-[clamp(16px,3vw,34px)] pb-20">
        {ds.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-10 text-center">
            <p className="text-[15px] font-semibold">Danh sách dự án đang được cập nhật</p>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Vui lòng xem phần hệ sinh thái bên dưới hoặc liên hệ trực tiếp.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {ds.map((d) => {
              const diemNhan = docDiemNhan(d.highlights);
              return (
                <article
                  key={d.id}
                  id={d.slug ?? d.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card/40"
                >
                  {d.cover_image && (
                    <div className="relative h-48 w-full overflow-hidden sm:h-64 md:h-72">
                      {/* Dùng <img> chứ không next/image: ảnh dự án có thể đến từ bất kỳ
                          miền nào (ảnh cũ dùng Unsplash), ép qua next/image sẽ phải khai
                          báo từng miền trong next.config — phiền hơn giá trị mang lại. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={d.cover_image}
                        alt={d.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.1em] backdrop-blur">
                        {NHAN_TRANG_THAI[d.status ?? ""] ?? "Đang cập nhật"}
                      </span>
                    </div>
                  )}

                  <div className="p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold md:text-2xl">{d.title}</h2>
                      {d.location && (
                        <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                          <MapPin size={12} /> {d.location}
                        </span>
                      )}
                      {tien(d.investment_target) && (
                        <span className="rounded-full border border-border px-2.5 py-0.5 text-[10.5px] text-muted-foreground">
                          Vốn mục tiêu {tien(d.investment_target)}
                        </span>
                      )}
                    </div>

                    {d.description && (
                      <p className="mt-3 max-w-3xl whitespace-pre-line text-[13.5px] leading-relaxed text-muted-foreground">
                        {d.description}
                      </p>
                    )}

                    {diemNhan.length > 0 && (
                      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                        {diemNhan.map((x) => (
                          <li key={x} className="flex items-start gap-2 text-[12.5px] text-foreground/85">
                            <Sprout size={13} className="mt-0.5 shrink-0 text-primary" />
                            {x}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-6 flex flex-wrap gap-2">
                      <NutMoDangNhap
                        quayLai="/app/projects"
                        lyDo="Đăng nhập để xem hồ sơ dự án đầy đủ, tài liệu và tiến độ cập nhật."
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-[12.5px] font-medium text-primary-foreground"
                      >
                        Xem hồ sơ đầy đủ
                        <ArrowUpRight size={13} />
                      </NutMoDangNhap>
                      <Link
                        href="/#contact"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-1.5 text-[12.5px]"
                      >
                        Liên hệ về dự án
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <section className="mt-14">
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="text-[15px] font-semibold">Hệ sinh thái đang vận hành</h2>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HE_SINH_THAI.map((x) => (
              <a
                key={x.ten}
                href={x.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40"
              >
                <p className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                  {x.ten}
                  <ExternalLink size={12} className="opacity-40 transition-opacity group-hover:opacity-80" />
                </p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{x.moTa}</p>
                <p className="mt-2 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground/70">
                  {x.nhan}
                </p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
