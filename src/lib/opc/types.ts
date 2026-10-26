export type OpcVaiTro =
  | "quan_tri"
  | "dieu_hanh"
  | "sales"
  | "success"
  | "mentor"
  | "thanh_vien";

export type LeadTrangThai =
  | "lead"
  | "mql"
  | "sql"
  | "customer"
  | "active"
  | "at_risk"
  | "churned";

export const VAI_TRO_LABEL: Record<string, string> = {
  quan_tri: "Quản trị",
  dieu_hanh: "Điều hành",
  sales: "Kinh doanh",
  success: "Chăm sóc",
  mentor: "Mentor",
  thanh_vien: "Thành viên",
  khach: "Khách",
};

export const LEAD_TRANG_THAI: { value: LeadTrangThai; label: string; color: string }[] = [
  { value: "lead", label: "Lead", color: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  { value: "mql", label: "MQL", color: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  { value: "sql", label: "SQL", color: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  { value: "customer", label: "Khách hàng", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { value: "active", label: "Đang hoạt động", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { value: "at_risk", label: "Có nguy cơ rời", color: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  { value: "churned", label: "Đã rời", color: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
];

export const LEAD_LABEL: Record<string, string> = Object.fromEntries(
  LEAD_TRANG_THAI.map((x) => [x.value, x.label])
);

export const LEAD_COLOR: Record<string, string> = Object.fromEntries(
  LEAD_TRANG_THAI.map((x) => [x.value, x.color])
);

export const NGUON_GOI_Y = [
  "Facebook",
  "TikTok",
  "YouTube",
  "Zalo",
  "Giới thiệu",
  "Website",
  "Sự kiện",
  "Khác",
];

export const NHOM_CONG_DONG = [
  { value: "chung", label: "Chung" },
  { value: "hoi-vien", label: "Hội viên" },
  { value: "mentor", label: "Mentor" },
  { value: "dia-phuong", label: "Địa phương" },
  { value: "nganh", label: "Ngành" },
];

export type OpcActionState = { error?: string; ok?: string };
