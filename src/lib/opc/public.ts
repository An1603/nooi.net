import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export type GoiMeta = {
  nhom: "loi" | "mo-rong";
  tagline: string;
  badge?: string;
  accent: "gold" | "green" | "violet" | "rose" | "cyan";
  cta: string;
  /** Gói tư vấn: chỉ tạo lead, không tạo đơn hàng. */
  tuVan?: boolean;
};

export type GoiCongKhai = {
  ma: string;
  ten: string;
  gia: number;
  ky: string;
  quyenLoi: string[];
  thuTu: number;
  meta: GoiMeta;
};

export type CapDo = {
  id: string;
  nhan: string;
  ten: string;
  moTa: string;
  ma: readonly string[];
};

/**
 * Ba cấp độ đồng hành — dùng cho trang chủ và trang sản phẩm.
 * Thứ tự `ma` quyết định thứ tự thẻ trong từng cấp.
 */
export const CAP_DO: CapDo[] = [
  {
    id: "nen-tang",
    nhan: "Cấp 1 · Mới bắt đầu",
    ten: "Nền tảng",
    moTa: "Biết mình đang ở đâu, có một quy trình đủ chuẩn để bán ổn định và bộ hồ sơ tối thiểu để vận hành.",
    ma: ["khoi-tao", "chuan-hoa", "launch"],
  },
  {
    id: "van-hanh",
    nhan: "Cấp 2 · Đang có doanh thu",
    ten: "Vận hành",
    moTa: "Giữ nhịp mỗi tháng, giảm việc lặp bằng AI và có người đồng hành 90 ngày để tăng trưởng có kiểm soát.",
    ma: ["membership", "pro", "ai-agent"],
  },
  {
    id: "mo-rong",
    nhan: "Cấp 3 · Đi xa hơn",
    ten: "Mở rộng",
    moTa: "Không gian chuyển hóa tại NOOI Forest, ở dài để làm việc, hợp tác với tổ chức và chứng nhận năng lực.",
    ma: ["retreat", "residency", "partner", "certified"],
  },
];

/** Lọc và sắp xếp gói theo đúng thứ tự của một cấp độ. */
export function goiTheoCap(danhSach: GoiCongKhai[], ma: readonly string[]): GoiCongKhai[] {
  const thuTu = new Map(ma.map((item, index) => [item, index]));
  return danhSach
    .filter((goi) => thuTu.has(goi.ma))
    .sort((a, b) => (thuTu.get(a.ma) ?? 0) - (thuTu.get(b.ma) ?? 0));
}

const META: Record<string, GoiMeta> = {
  "khoi-tao": {
    nhom: "loi",
    tagline: "Biết mình đang ở đâu trước khi đầu tư.",
    badge: "Bắt đầu",
    accent: "gold",
    cta: "Chẩn đoán miễn phí",
  },
  "chuan-hoa": {
    nhom: "loi",
    tagline: "Một quy trình đủ chuẩn để bán ổn định.",
    badge: "Phổ biến",
    accent: "green",
    cta: "Đặt mua",
  },
  membership: {
    nhom: "loi",
    tagline: "Không đơn độc trên đường vận hành.",
    badge: "Cộng đồng",
    accent: "violet",
    cta: "Đặt mua",
  },
  pro: {
    nhom: "loi",
    tagline: "Ba KPI tăng trưởng trong 90 ngày.",
    badge: "Đồng hành",
    accent: "gold",
    cta: "Đặt mua",
  },
  "ai-agent": {
    nhom: "loi",
    tagline: "Tiết kiệm 10–20 giờ mỗi tháng.",
    badge: "Tự động",
    accent: "cyan",
    cta: "Đặt mua",
  },
  retreat: {
    nhom: "loi",
    tagline: "Dừng lại, nhìn lại, chuyển hóa.",
    badge: "Măng Đen",
    accent: "rose",
    cta: "Đặt chỗ",
  },
  launch: {
    nhom: "mo-rong",
    tagline: "Từ ý tưởng đến doanh nghiệp chạy được trong 30 ngày.",
    badge: "Mới",
    accent: "gold",
    cta: "Nhận tư vấn",
    tuVan: true,
  },
  residency: {
    nhom: "mo-rong",
    tagline: "Sống và làm việc 1–6 tháng tại NOOI Forest.",
    badge: "Mới",
    accent: "green",
    cta: "Nhận tư vấn",
    tuVan: true,
  },
  partner: {
    nhom: "mo-rong",
    tagline: "Mang OPC đến hội viên của tổ chức bạn.",
    badge: "B2B",
    accent: "violet",
    cta: "Nhận tư vấn",
    tuVan: true,
  },
  certified: {
    nhom: "mo-rong",
    tagline: "Bằng chứng năng lực OPC cho khách và đối tác.",
    badge: "Tùy chọn",
    accent: "cyan",
    cta: "Nhận tư vấn",
    tuVan: true,
  },
};

const META_DU_PHONG: GoiMeta = {
  nhom: "mo-rong",
  tagline: "Một bước tiến tiếp theo trong hệ sinh thái OPC.",
  accent: "gold",
  cta: "Nhận tư vấn",
};

function chuanHoaQuyenLoi(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        return String(obj.label ?? obj.ten ?? obj.text ?? "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

export const getGoiCongKhai = cache(async (): Promise<GoiCongKhai[]> => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("opc_goi")
    .select("ma, ten, gia, ky, quyen_loi, thu_tu")
    .eq("active", true)
    .order("thu_tu", { ascending: true });

  if (error) {
    console.error("[opc-public] Không tải được gói:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const ma = String(row.ma);
    return {
      ma,
      ten: String(row.ten),
      gia: Number(row.gia ?? 0),
      ky: String(row.ky ?? "mot_lan"),
      quyenLoi: chuanHoaQuyenLoi(row.quyen_loi),
      thuTu: Number(row.thu_tu ?? 0),
      meta: META[ma] ?? META_DU_PHONG,
    };
  });
});

export async function getGoiTheoMa(ma: string): Promise<GoiCongKhai | null> {
  const danhSach = await getGoiCongKhai();
  return danhSach.find((goi) => goi.ma === ma) ?? null;
}

export function formatGia(gia: number): string {
  if (!gia) return "Miễn phí";
  return `${new Intl.NumberFormat("vi-VN").format(gia)} đ`;
}

export function nhanKy(ky: string): string {
  switch (ky) {
    case "thang":
      return "/tháng";
    case "nam":
      return "/năm";
    case "lan":
    case "mot_lan":
      return "/lần";
    default:
      return "";
  }
}

export function hrefCuaGoi(goi: GoiCongKhai): string {
  if (goi.gia === 0) return "/chan-doan";
  return `/dat-mua/${goi.ma}`;
}

export function lopMau(accent: GoiMeta["accent"]): {
  vien: string;
  chu: string;
  nen: string;
  nut: string;
} {
  switch (accent) {
    case "green":
      return {
        vien: "border-emerald-400/25",
        chu: "text-emerald-300",
        nen: "bg-emerald-400/10",
        nut: "bg-emerald-400 text-[#07130C] hover:bg-emerald-300",
      };
    case "violet":
      return {
        vien: "border-violet-400/25",
        chu: "text-violet-300",
        nen: "bg-violet-400/10",
        nut: "bg-violet-400 text-[#12081F] hover:bg-violet-300",
      };
    case "rose":
      return {
        vien: "border-rose-400/25",
        chu: "text-rose-300",
        nen: "bg-rose-400/10",
        nut: "bg-rose-400 text-[#1A0810] hover:bg-rose-300",
      };
    case "cyan":
      return {
        vien: "border-cyan-400/25",
        chu: "text-cyan-300",
        nen: "bg-cyan-400/10",
        nut: "bg-cyan-400 text-[#061218] hover:bg-cyan-300",
      };
    default:
      return {
        vien: "border-[#C8943E]/30",
        chu: "text-[#E8C07A]",
        nen: "bg-[#C8943E]/10",
        nut: "bg-[#C8943E] text-[#160B22] hover:bg-[#E8C07A]",
      };
  }
}
