"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { CAU_HOI, tinhKetQua, type PublicActionState } from "@/lib/opc/diagnostic";
import { getGoiTheoMa } from "@/lib/opc/public";

/* ── Chống spam nhẹ (VPS một tiến trình, đủ cho MVP) ─────────────────────── */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 6;
const rateStore = new Map<string, number[]>();

function choPhep(ip: string, scope: string): boolean {
  const key = `${scope}:${ip || "unknown"}`;
  const now = Date.now();
  const recent = (rateStore.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    rateStore.set(key, recent);
    return false;
  }
  recent.push(now);
  rateStore.set(key, recent);
  return true;
}

async function layIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/* ── Schema ──────────────────────────────────────────────────────────────── */
const lienHeSchema = z
  .object({
    ten: z.string().trim().min(2, "Vui lòng nhập tên").max(120, "Tên quá dài"),
    email: z.string().trim().email("Email không hợp lệ").max(160).optional().or(z.literal("")),
    sdt: z
      .string()
      .trim()
      .regex(/^[0-9+().\s-]{8,20}$/, "Số điện thoại không hợp lệ")
      .optional()
      .or(z.literal("")),
    ghi_chu: z.string().trim().max(1200, "Ghi chú quá dài").optional().or(z.literal("")),
  })
  .refine((d) => Boolean(d.email || d.sdt), {
    message: "Cần email hoặc số điện thoại để OPC liên hệ",
    path: ["email"],
  });

type Admin = ReturnType<typeof createAdminClient>;
type LeadTrangThai = "lead" | "mql" | "sql" | "customer" | "active" | "at_risk" | "churned";

const THU_TU_TRANG_THAI: LeadTrangThai[] = [
  "lead",
  "mql",
  "sql",
  "customer",
  "active",
  "at_risk",
  "churned",
];

function caoHon(a: string | null | undefined, b: LeadTrangThai): LeadTrangThai {
  const ia = THU_TU_TRANG_THAI.indexOf((a || "lead") as LeadTrangThai);
  const ib = THU_TU_TRANG_THAI.indexOf(b);
  return THU_TU_TRANG_THAI[Math.max(ia, ib)] ?? b;
}

async function timLead(admin: Admin, email: string | null, sdt: string | null) {
  if (email) {
    const { data } = await admin
      .from("opc_lead")
      .select("id, diem, trang_thai, ghi_chu")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }
  if (sdt) {
    const { data } = await admin
      .from("opc_lead")
      .select("id, diem, trang_thai, ghi_chu")
      .eq("sdt", sdt)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }
  return null;
}

type LuuLeadInput = {
  ten: string;
  email: string | null;
  sdt: string | null;
  kenh: string;
  trang_thai: LeadTrangThai;
  diem: number;
  ghi_chu: string;
};

async function luuLead(admin: Admin, input: LuuLeadInput): Promise<{ id?: string; error?: string }> {
  const cu = await timLead(admin, input.email, input.sdt);

  if (cu) {
    const ghiChu = [cu.ghi_chu, input.ghi_chu].filter(Boolean).join("\n---\n").slice(0, 2000);
    const { error } = await admin
      .from("opc_lead")
      .update({
        diem: Math.max(Number(cu.diem ?? 0), input.diem),
        trang_thai: caoHon(cu.trang_thai, input.trang_thai),
        ghi_chu: ghiChu || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cu.id);
    if (error) {
      console.error("[opc-public] cập nhật lead lỗi:", error.message);
      return { error: "Chưa lưu được thông tin. Vui lòng thử lại." };
    }
    return { id: String(cu.id) };
  }

  const { data, error } = await admin
    .from("opc_lead")
    .insert({
      ten: input.ten,
      email: input.email,
      sdt: input.sdt,
      nguon: "Website OPC",
      kenh: input.kenh,
      trang_thai: input.trang_thai,
      diem: input.diem,
      ghi_chu: input.ghi_chu || null,
      chu_so_huu: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[opc-public] tạo lead lỗi:", error?.message);
    return { error: "Chưa lưu được thông tin. Vui lòng thử lại." };
  }
  return { id: String(data.id) };
}

async function ghiHoatDong(admin: Admin, leadId: string, noiDung: string) {
  const { error } = await admin.from("opc_hoat_dong").insert({
    lead_id: leadId,
    nguoi_id: null,
    loai: "he_thong",
    noi_dung: noiDung.slice(0, 2000),
  });
  if (error) console.error("[opc-public] ghi hoạt động lỗi:", error.message);
}

/* ── Chẩn đoán 10 câu ────────────────────────────────────────────────────── */
export async function guiChanDoan(
  _prev: PublicActionState,
  formData: FormData
): Promise<PublicActionState> {
  const ip = await layIp();
  if (!choPhep(ip, "chan-doan")) {
    return { error: "Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau 10 phút." };
  }

  // Honeypot: bot điền vào ô ẩn → giả vờ thành công, không ghi DB.
  if (String(formData.get("website") || "").trim()) {
    return { ok: "Đã ghi nhận." };
  }

  const parsed = lienHeSchema.safeParse({
    ten: formData.get("ten"),
    email: formData.get("email") || "",
    sdt: formData.get("sdt") || "",
    ghi_chu: formData.get("ghi_chu") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" · ") };
  }

  const answers: Record<string, string> = {};
  for (const cau of CAU_HOI) {
    const value = String(formData.get(cau.id) || "");
    if (!cau.options.some((o) => o.value === value)) {
      return { error: "Vui lòng trả lời đủ 10 câu hỏi." };
    }
    answers[cau.id] = value;
  }

  const ketQua = tinhKetQua(answers);
  const chiTiet = CAU_HOI.map((cau) => {
    const chon = cau.options.find((o) => o.value === answers[cau.id]);
    return `${cau.label} ${chon?.label ?? "—"}`;
  }).join(" · ");

  const admin = createAdminClient();
  const ghiChu = [
    `[Chẩn đoán 10 câu] ${ketQua.diem}/100 · ${ketQua.muc}`,
    `Gợi ý: ${ketQua.tenGoi}`,
    chiTiet,
    parsed.data.ghi_chu ? `Khách ghi: ${parsed.data.ghi_chu}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 2000);

  const lead = await luuLead(admin, {
    ten: parsed.data.ten,
    email: parsed.data.email || null,
    sdt: parsed.data.sdt || null,
    kenh: "Chẩn đoán 10 câu",
    trang_thai: ketQua.diem >= 55 ? "sql" : ketQua.diem >= 30 ? "mql" : "lead",
    diem: ketQua.diem,
    ghi_chu: ghiChu,
  });

  if (lead.error || !lead.id) return { error: lead.error || "Chưa lưu được kết quả." };

  await ghiHoatDong(
    admin,
    lead.id,
    `Hoàn thành chẩn đoán: ${ketQua.diem}/100 · ${ketQua.muc} · gợi ý ${ketQua.tenGoi}`
  );

  revalidatePath("/leads");
  revalidatePath("/opc/leads");

  return {
    ok: "Đã ghi nhận. OPC sẽ liên hệ trong 24 giờ làm việc.",
    ketQua,
  };
}

/* ── Đặt mua / nhận tư vấn ───────────────────────────────────────────────── */
const datMuaSchema = z.object({
  ma: z.string().trim().regex(/^[a-z0-9-]{2,40}$/, "Gói không hợp lệ"),
});

export async function datMua(
  _prev: PublicActionState,
  formData: FormData
): Promise<PublicActionState> {
  const ip = await layIp();
  if (!choPhep(ip, "dat-mua")) {
    return { error: "Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau 10 phút." };
  }

  if (String(formData.get("website") || "").trim()) {
    return { ok: "Đã ghi nhận." };
  }

  const goiParsed = datMuaSchema.safeParse({ ma: formData.get("ma") });
  if (!goiParsed.success) return { error: "Gói không hợp lệ." };

  const parsed = lienHeSchema.safeParse({
    ten: formData.get("ten"),
    email: formData.get("email") || "",
    sdt: formData.get("sdt") || "",
    ghi_chu: formData.get("ghi_chu") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" · ") };
  }

  const goi = await getGoiTheoMa(goiParsed.data.ma);
  if (!goi) return { error: "Gói này không còn hoạt động. Vui lòng chọn gói khác." };
  if (goi.gia === 0) redirect("/chan-doan");

  const admin = createAdminClient();
  const lead = await luuLead(admin, {
    ten: parsed.data.ten,
    email: parsed.data.email || null,
    sdt: parsed.data.sdt || null,
    kenh: `Đặt mua: ${goi.ten}`,
    trang_thai: "sql",
    diem: ["pro", "launch", "partner"].includes(goi.ma) ? 80 : 70,
    ghi_chu: [
      `[Đặt mua] ${goi.ten} · ${goi.gia.toLocaleString("vi-VN")} đ`,
      parsed.data.ghi_chu ? `Khách ghi: ${parsed.data.ghi_chu}` : "",
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 2000),
  });

  if (lead.error || !lead.id) return { error: lead.error || "Chưa lưu được yêu cầu." };

  const { error: orderError } = await admin.from("opc_don_hang").insert({
    lead_id: lead.id,
    nguoi_id: null,
    goi_ma: goi.ma,
    so_tien: goi.gia,
    trang_thai: "cho_tt",
    ma_giao_dich: null,
    ghi_chu: [
      `Đặt mua từ website: ${goi.ten}`,
      `Liên hệ: ${parsed.data.ten}`,
      parsed.data.email ? `Email: ${parsed.data.email}` : "",
      parsed.data.sdt ? `ĐT: ${parsed.data.sdt}` : "",
      parsed.data.ghi_chu ? `Ghi chú: ${parsed.data.ghi_chu}` : "",
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 2000),
  });

  if (orderError) {
    console.error("[opc-public] tạo đơn lỗi:", orderError.message);
    return { error: "Chưa tạo được đơn. Vui lòng thử lại hoặc gọi OPC." };
  }

  await ghiHoatDong(admin, lead.id, `Đặt mua gói ${goi.ten} — chờ xác nhận thanh toán`);

  revalidatePath("/leads");
  revalidatePath("/opc/leads");
  revalidatePath("/opc/don-hang");
  revalidatePath("/don-hang");

  return { ok: "Đã ghi nhận yêu cầu. OPC sẽ liên hệ trong 4 giờ làm việc." };
}
