import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OpcVaiTro } from "./types";

export type OpcNguoi = {
  id: string;
  user_id: string;
  email: string | null;
  ten: string | null;
  sdt: string | null;
  vai_tro: string;
  created_at: string;
  updated_at: string;
};

export type OpcUser = {
  user: { id: string; email: string | null };
  nguoi: OpcNguoi | null;
  vaiTro: OpcVaiTro;
  isStaff: boolean;
  isAdmin: boolean;
};

const NHAN_VIEN: OpcVaiTro[] = ["quan_tri", "dieu_hanh", "sales", "success"];

export function laNhanVien(vaiTro: string | null | undefined): boolean {
  return NHAN_VIEN.includes((vaiTro || "") as OpcVaiTro);
}

/**
 * Lấy người dùng OPC hiện tại. Tự tạo hồ sơ người lần đầu đăng nhập.
 * Vai trò hiệu lực lấy từ hàm DB opc_vai_tro() — admin.nooi.net luôn là quản trị.
 */
export const getOpcUser = cache(async (): Promise<OpcUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let { data: nguoi } = await supabase
    .from("opc_nguoi")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!nguoi) {
    const ten =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split("@")[0] ||
      "Thành viên";
    const { data: created, error } = await supabase
      .from("opc_nguoi")
      .insert({ user_id: user.id, email: user.email, ten })
      .select("*")
      .single();

    if (!error) {
      nguoi = created;
    } else {
      const { data: again } = await supabase
        .from("opc_nguoi")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      nguoi = again;
    }
  }

  const { data: vaiTroRpc } = await supabase.rpc("opc_vai_tro");
  const vaiTro = ((vaiTroRpc as string | null) ||
    (nguoi?.vai_tro as string | null) ||
    "thanh_vien") as OpcVaiTro;

  return {
    user: { id: user.id, email: user.email ?? null },
    nguoi: (nguoi as OpcNguoi | null) ?? null,
    vaiTro,
    isStaff: laNhanVien(vaiTro),
    isAdmin: vaiTro === "quan_tri",
  };
});

export async function requireOpcUser(): Promise<OpcUser> {
  const data = await getOpcUser();
  if (!data) redirect("/login?redirect=/");
  return data;
}

export async function requireOpcStaff(): Promise<OpcUser> {
  const data = await requireOpcUser();
  if (!data.isStaff) redirect("/");
  return data;
}
