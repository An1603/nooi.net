import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Calculator,
  Compass,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Map,
  Mic,
  Moon,
  NotebookPen,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react";
import { DauTrangPhanHe } from "@/components/public/DauTrangPhanHe";

export const metadata: Metadata = {
  title: "Tiện ích NOOI — eKid, OPC, GIS và công cụ thân tâm",
  description:
    "Các tiện ích của hệ sinh thái NOOI: eKid, OPC Storefront, bản đồ số GIS, tử vi, thần số học, chiêm tinh, nhật ký thân tâm, trợ lý giọng nói và quản lý đầu tư.",
  alternates: { canonical: "/tien-ich" },
  openGraph: {
    title: "Tiện ích NOOI",
    description: "eKid, OPC, GIS và các công cụ thân tâm trong một tài khoản.",
    locale: "vi_VN",
    type: "website",
    siteName: "NOOI",
  },
};

type TienIch = {
  ten: string;
  moTa: string;
  href: string;
  Icon: LucideIcon;
  /** ngoài = mở tên miền riêng; trong = cần tài khoản NOOI */
  kieu: "ngoai" | "trong";
  nhan: string;
};

/**
 * TIỆN ÍCH — danh sách tĩnh, cố ý.
 *
 * Mỗi dòng ở đây phải là một thứ ĐANG CHẠY được. Không thêm “sắp ra mắt” vào lưới này:
 * khách bấm vào mà không dùng được là mất niềm tin, mà niềm tin là thứ đắt nhất của NOOI.
 * Khi một tiện ích chưa xong, để nó trong lộ trình nội bộ, không đưa ra trang công khai.
 */
const UNG_DUNG: TienIch[] = [
  {
    ten: "eKid",
    moTa: "Trợ lý học tập AI cho bé: bài học theo lớp, luyện tập, báo cáo cho phụ huynh.",
    href: "https://ekid.nooi.net",
    Icon: GraduationCap,
    kieu: "ngoai",
    nhan: "ekid.nooi.net",
  },
  {
    ten: "OPC Storefront",
    moTa: "Cửa hàng và trung tâm OPC: sản phẩm, đơn hàng, hoạt động cộng đồng.",
    href: "https://opc.nooi.net",
    Icon: Store,
    kieu: "ngoai",
    nhan: "opc.nooi.net",
  },
  {
    ten: "Bản đồ số GIS",
    moTa: "Tra thửa đất, xem quy hoạch và dữ liệu địa bàn trên nền bản đồ số.",
    href: "https://gis.nooi.net",
    Icon: Map,
    kieu: "ngoai",
    nhan: "gis.nooi.net",
  },
  {
    ten: "Bài trình bày",
    moTa: "Kho slide nội bộ và cho đối tác, cấp quyền theo tài khoản.",
    href: "https://slides.nooi.net",
    Icon: Landmark,
    kieu: "ngoai",
    nhan: "slides.nooi.net",
  },
];

const TRONG_TAI_KHOAN: TienIch[] = [
  {
    ten: "Tử vi",
    moTa: "Lá số theo giờ sinh, luận giải theo từng giai đoạn.",
    href: "/app/tuvi",
    Icon: Compass,
    kieu: "trong",
    nhan: "Cần đăng nhập",
  },
  {
    ten: "Thần số học",
    moTa: "Bản đồ số của tên và ngày sinh, gợi ý hướng phát triển.",
    href: "/app/numerology",
    Icon: Calculator,
    kieu: "trong",
    nhan: "Cần đăng nhập",
  },
  {
    ten: "Chiêm tinh",
    moTa: "Bản đồ sao cá nhân và các chu kỳ đáng chú ý.",
    href: "/app/astrology",
    Icon: Moon,
    kieu: "trong",
    nhan: "Cần đăng nhập",
  },
  {
    ten: "Nhật ký thân tâm",
    moTa: "Ghi ba dòng mỗi ngày — dữ liệu để bạn tự thấy mình đang đổi.",
    href: "/app/journal",
    Icon: NotebookPen,
    kieu: "trong",
    nhan: "Miễn phí",
  },
  {
    ten: "Trợ lý giọng nói",
    moTa: "Trò chuyện thời gian thực bằng giọng nói, nhắc nhở thực hành mỗi ngày.",
    href: "/app/voice",
    Icon: Mic,
    kieu: "trong",
    nhan: "Miễn phí",
  },
  {
    ten: "Thực hành & tự đánh giá",
    moTa: "Bài thực hành theo trình độ, bài kiểm tra ngắn để biết mình đang ở đâu.",
    href: "/app/thuc-hanh",
    Icon: HeartHandshake,
    kieu: "trong",
    nhan: "Cần đăng nhập",
  },
  {
    ten: "Cộng đồng",
    moTa: "Không gian chia sẻ của người thực hành — hỏi đáp, nhóm theo chủ đề.",
    href: "/app/cong-dong",
    Icon: Sparkles,
    kieu: "trong",
    nhan: "Cần đăng nhập",
  },
  {
    ten: "Dự án & đầu tư",
    moTa: "Hồ sơ dự án, dòng tiền và tiến độ dành cho thành viên, đối tác.",
    href: "/app/investments",
    Icon: Landmark,
    kieu: "trong",
    nhan: "Cần đăng nhập",
  },
];

function The({ x }: { x: TienIch }) {
  const noiDung = (
    <>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background/60 text-primary">
          <x.Icon size={16} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[14px] font-semibold">
            {x.ten}
            {x.kieu === "ngoai" ? (
              <ExternalLink size={12} className="opacity-40" />
            ) : (
              <ArrowUpRight size={12} className="opacity-40" />
            )}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{x.moTa}</p>
        </div>
      </div>
      <p className="mt-3 border-t border-border pt-2.5 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground/75">
        {x.nhan}
      </p>
    </>
  );

  const lop =
    "group flex flex-col rounded-xl border border-border bg-card/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card";

  return x.kieu === "ngoai" ? (
    <a href={x.href} target="_blank" rel="noopener noreferrer" className={lop} data-track={`tien-ich-${x.ten}`}>
      {noiDung}
    </a>
  ) : (
    <Link href={x.href} className={lop} data-track={`tien-ich-${x.ten}`}>
      {noiDung}
    </Link>
  );
}

export default function TienIchPage() {
  return (
    <main className="min-h-[100dvh] bg-background">
      <DauTrangPhanHe
        ten="Tiện ích"
        moTa="Những công cụ đang chạy thật trong hệ sinh thái NOOI — mở riêng tên miền hoặc dùng ngay trong tài khoản của bạn."
        duongDan={[{ nhan: "Tiện ích" }]}
        hanhDong={[
          { nhan: "Bắt đầu miễn phí", href: "/signup", chinh: true },
          { nhan: "Xem dự án", href: "/du-an" },
        ]}
      />

      <div className="mx-auto w-full max-w-[1680px] px-[clamp(16px,3vw,34px)] pb-20">
        <section className="mb-12">
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="text-[15px] font-semibold">Ứng dụng riêng</h2>
            <span className="text-[11.5px] text-muted-foreground">mở tên miền riêng, không cần tài khoản NOOI</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {UNG_DUNG.map((x) => (
              <The key={x.ten} x={x} />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="text-[15px] font-semibold">Trong tài khoản NOOI</h2>
            <span className="text-[11.5px] text-muted-foreground">dùng chung một lần đăng nhập</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRONG_TAI_KHOAN.map((x) => (
              <The key={x.ten} x={x} />
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-[11px] text-muted-foreground/70">
          Chỉ những tiện ích đang hoạt động được đưa lên trang này. Công cụ đang xây dựng sẽ
          xuất hiện khi dùng được thật.
        </p>
      </div>
    </main>
  );
}
