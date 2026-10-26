"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOpcStaff, requireOpcUser } from "@/lib/opc/auth";
import type { OpcActionState } from "@/lib/opc/types";
import { LEAD_LABEL } from "@/lib/opc/types";

const TRANG_THAI = ["lead", "mql", "sql", "customer", "active", "at_risk", "churned"] as const;
const NHOM = ["chung", "hoi-vien", "mentor", "dia-phuong", "nganh"] as const;

const leadSchema = z.object({
  ten: z.string().trim().min(1, "Tên không được để trống").max(120, "Tên quá dài"),
  email: z.string().trim().email("Email không hợp lệ").optional().or(z.literal("")),
  sdt: z.string().trim().max(30, "Số điện thoại quá dài").optional().or(z.literal("")),
  nguon: z.string().trim().max(60).optional().or(z.literal("")),
  kenh: z.string().trim().max(60).optional().or(z.literal("")),
  trang_thai: z.enum(TRANG_THAI).default("lead"),
  diem: z.coerce.number().int().min(0).max(100).default(0),
  ghi_chu: z.string().trim().max(2000, "Ghi chú quá dài").optional().or(z.literal("")),
});

const capNhatLeadSchema = z.object({
  lead_id: z.string().uuid("Lead không hợp lệ"),
  trang_thai: z.enum(TRANG_THAI),
  chu_so_huu: z.string().uuid().optional().or(z.literal("")),
  ghi_chu: z.string().trim().max(2000).optional().or(z.literal("")),
});

const ghiChuSchema = z.object({
  lead_id: z.string().uuid("Lead không hợp lệ"),
  noi_dung: z.string().trim().min(1, "Nội dung không được để trống").max(2000, "Nội dung quá dài"),
});

const baiDangSchema = z.object({
  tieu_de: z.string().trim().max(160, "Tiêu đề quá dài").optional().or(z.literal("")),
  noi_dung: z.string().trim().min(1, "Nội dung không được để trống").max(5000, "Nội dung quá dài"),
  nhom: z.enum(NHOM).default("chung"),
});

const binhLuanSchema = z.object({
  bai_dang_id: z.string().uuid("Bài đăng không hợp lệ"),
  noi_dung: z.string().trim().min(1, "Bình luận không được để trống").max(1000, "Bình luận quá dài"),
});

const hoSoSchema = z.object({
  ten: z.string().trim().min(1, "Tên không được để trống").max(120, "Tên quá dài"),
  sdt: z.string().trim().max(30).optional().or(z.literal("")),
  nghe: z.string().trim().max(120).optional().or(z.literal("")),
  doanh_thu: z.string().trim().max(60).optional().or(z.literal("")),
  so_nhan_su: z.coerce.number().int().min(0).max(100000).optional(),
  muc_tieu: z.string().trim().max(1000).optional().or(z.literal("")),
  diem_chin: z.coerce.number().int().min(0).max(100).default(0),
});

function loi(err: z.ZodError): string {
  return err.issues.map((i) => i.message).join(" · ");
}

async function nhatKy(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nguoiId: string | null,
  hanhDong: string,
  doiTuong: string,
  doiTuongId: string,
  duLieu?: Record<string, unknown>
) {
  if (!nguoiId) return;
  await supabase.from("opc_nhat_ky").insert({
    nguoi_id: nguoiId,
    hanh_dong: hanhDong,
    doi_tuong: doiTuong,
    doi_tuong_id: doiTuongId,
    du_lieu: duLieu ?? null,
  });
}

// ── CRM ─────────────────────────────────────────────────────────────────────
export async function taoLead(_prev: OpcActionState, formData: FormData): Promise<OpcActionState> {
  const { nguoi } = await requireOpcStaff();
  const parsed = leadSchema.safeParse({
    ten: formData.get("ten"),
    email: formData.get("email") || "",
    sdt: formData.get("sdt") || "",
    nguon: formData.get("nguon") || "",
    kenh: formData.get("kenh") || "",
    trang_thai: formData.get("trang_thai") || "lead",
    diem: formData.get("diem") || 0,
    ghi_chu: formData.get("ghi_chu") || "",
  });
  if (!parsed.success) return { error: loi(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opc_lead")
    .insert({
      ten: parsed.data.ten,
      email: parsed.data.email || null,
      sdt: parsed.data.sdt || null,
      nguon: parsed.data.nguon || null,
      kenh: parsed.data.kenh || null,
      trang_thai: parsed.data.trang_thai,
      diem: parsed.data.diem,
      ghi_chu: parsed.data.ghi_chu || null,
      chu_so_huu: nguoi?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("opc_hoat_dong").insert({
    lead_id: data.id,
    nguoi_id: nguoi?.id ?? null,
    loai: "he_thong",
    noi_dung: `Tạo lead từ ${parsed.data.nguon || "chưa rõ nguồn"}`,
  });
  await nhatKy(supabase, nguoi?.id ?? null, "tao_lead", "opc_lead", data.id, { ten: parsed.data.ten });

  revalidatePath("/opc");
  revalidatePath("/opc/leads");
  revalidatePath("/leads");
  redirect(`/leads/${data.id}`);
}

export async function capNhatLead(_prev: OpcActionState, formData: FormData): Promise<OpcActionState> {
  const { nguoi } = await requireOpcStaff();
  const parsed = capNhatLeadSchema.safeParse({
    lead_id: formData.get("lead_id"),
    trang_thai: formData.get("trang_thai"),
    chu_so_huu: formData.get("chu_so_huu") || "",
    ghi_chu: formData.get("ghi_chu") || "",
  });
  if (!parsed.success) return { error: loi(parsed.error) };

  const supabase = await createClient();
  const { data: cu } = await supabase
    .from("opc_lead")
    .select("trang_thai, ghi_chu")
    .eq("id", parsed.data.lead_id)
    .maybeSingle();

  const { error } = await supabase
    .from("opc_lead")
    .update({
      trang_thai: parsed.data.trang_thai,
      chu_so_huu: parsed.data.chu_so_huu || null,
      ghi_chu: parsed.data.ghi_chu || null,
    })
    .eq("id", parsed.data.lead_id);

  if (error) return { error: error.message };

  if (cu && cu.trang_thai !== parsed.data.trang_thai) {
    await supabase.from("opc_hoat_dong").insert({
      lead_id: parsed.data.lead_id,
      nguoi_id: nguoi?.id ?? null,
      loai: "trang_thai",
      noi_dung: `Chuyển trạng thái: ${LEAD_LABEL[cu.trang_thai] || cu.trang_thai} → ${
        LEAD_LABEL[parsed.data.trang_thai] || parsed.data.trang_thai
      }`,
    });
  }
  await nhatKy(supabase, nguoi?.id ?? null, "cap_nhat_lead", "opc_lead", parsed.data.lead_id, {
    trang_thai: parsed.data.trang_thai,
  });

  revalidatePath("/opc");
  revalidatePath(`/opc/leads/${parsed.data.lead_id}`);
  revalidatePath("/opc/leads");
  revalidatePath(`/leads/${parsed.data.lead_id}`);
  revalidatePath("/leads");
  return { ok: "Đã lưu thay đổi" };
}

export async function themGhiChu(_prev: OpcActionState, formData: FormData): Promise<OpcActionState> {
  const { nguoi } = await requireOpcStaff();
  const parsed = ghiChuSchema.safeParse({
    lead_id: formData.get("lead_id"),
    noi_dung: formData.get("noi_dung"),
  });
  if (!parsed.success) return { error: loi(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("opc_hoat_dong").insert({
    lead_id: parsed.data.lead_id,
    nguoi_id: nguoi?.id ?? null,
    loai: "ghi_chu",
    noi_dung: parsed.data.noi_dung,
  });
  if (error) return { error: error.message };

  revalidatePath(`/opc/leads/${parsed.data.lead_id}`);
  revalidatePath(`/leads/${parsed.data.lead_id}`);
  return { ok: "Đã thêm ghi chú" };
}

// ── CỘNG ĐỒNG ───────────────────────────────────────────────────────────────
export async function dangBai(_prev: OpcActionState, formData: FormData): Promise<OpcActionState> {
  const { nguoi } = await requireOpcUser();
  if (!nguoi) return { error: "Chưa có hồ sơ OPC. Vui lòng tải lại trang." };

  const parsed = baiDangSchema.safeParse({
    tieu_de: formData.get("tieu_de") || "",
    noi_dung: formData.get("noi_dung"),
    nhom: formData.get("nhom") || "chung",
  });
  if (!parsed.success) return { error: loi(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("opc_bai_dang").insert({
    nguoi_id: nguoi.id,
    tieu_de: parsed.data.tieu_de || null,
    noi_dung: parsed.data.noi_dung,
    nhom: parsed.data.nhom,
  });
  if (error) return { error: error.message };

  revalidatePath("/opc/cong-dong");
  revalidatePath("/cong-dong");
  revalidatePath("/opc");
  return { ok: "Đã đăng bài" };
}

export async function binhLuan(_prev: OpcActionState, formData: FormData): Promise<OpcActionState> {
  const { nguoi } = await requireOpcUser();
  if (!nguoi) return { error: "Chưa có hồ sơ OPC." };

  const parsed = binhLuanSchema.safeParse({
    bai_dang_id: formData.get("bai_dang_id"),
    noi_dung: formData.get("noi_dung"),
  });
  if (!parsed.success) return { error: loi(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("opc_binh_luan").insert({
    bai_dang_id: parsed.data.bai_dang_id,
    nguoi_id: nguoi.id,
    noi_dung: parsed.data.noi_dung,
  });
  if (error) return { error: error.message };

  revalidatePath("/opc/cong-dong");
  revalidatePath("/cong-dong");
  return { ok: "Đã gửi bình luận" };
}

// ── HỒ SƠ ───────────────────────────────────────────────────────────────────
export async function capNhatHoSo(_prev: OpcActionState, formData: FormData): Promise<OpcActionState> {
  const { nguoi } = await requireOpcUser();
  if (!nguoi) return { error: "Chưa có hồ sơ OPC." };

  const parsed = hoSoSchema.safeParse({
    ten: formData.get("ten"),
    sdt: formData.get("sdt") || "",
    nghe: formData.get("nghe") || "",
    doanh_thu: formData.get("doanh_thu") || "",
    so_nhan_su: formData.get("so_nhan_su") || 0,
    muc_tieu: formData.get("muc_tieu") || "",
    diem_chin: formData.get("diem_chin") || 0,
  });
  if (!parsed.success) return { error: loi(parsed.error) };

  const supabase = await createClient();
  const { error: loiNguoi } = await supabase
    .from("opc_nguoi")
    .update({ ten: parsed.data.ten, sdt: parsed.data.sdt || null })
    .eq("id", nguoi.id);
  if (loiNguoi) return { error: loiNguoi.message };

  const { error: loiHoSo } = await supabase.from("opc_ho_so").upsert(
    {
      nguoi_id: nguoi.id,
      nghe: parsed.data.nghe || null,
      doanh_thu: parsed.data.doanh_thu || null,
      so_nhan_su: parsed.data.so_nhan_su ?? 0,
      muc_tieu: parsed.data.muc_tieu || null,
      diem_chin: parsed.data.diem_chin,
    },
    { onConflict: "nguoi_id" }
  );
  if (loiHoSo) return { error: loiHoSo.message };

  revalidatePath("/opc/ho-so");
  revalidatePath("/ho-so");
  revalidatePath("/opc");
  return { ok: "Đã lưu hồ sơ" };
}
