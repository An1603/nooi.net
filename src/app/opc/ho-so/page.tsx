import Link from "next/link";
import { UserRound, Mail, Calendar, MessagesSquare, MessageCircle, Wallet, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOpcUser } from "@/lib/opc/auth";
import { VAI_TRO_LABEL } from "@/lib/opc/types";
import { formatLuc, formatSo } from "@/lib/opc/format";
import ProfileForm from "@/components/opc/ProfileForm";

export const dynamic = "force-dynamic";

type HoSo = {
  nghe: string | null;
  doanh_thu: string | null;
  so_nhan_su: number | null;
  muc_tieu: string | null;
  diem_chin: number | null;
};

export default async function HoSoPage() {
  const { nguoi, user, vaiTro } = await requireOpcUser();
  if (!nguoi) {
    return (
      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-6 text-sm text-rose-200">
        Chưa tạo được hồ sơ OPC. Vui lòng tải lại trang hoặc liên hệ quản trị.
      </div>
    );
  }

  const supabase = await createClient();
  const [hoSoRes, postCountRes, commentCountRes, orderCountRes] = await Promise.all([
    supabase.from("opc_ho_so").select("nghe, doanh_thu, so_nhan_su, muc_tieu, diem_chin").eq("nguoi_id", nguoi.id).maybeSingle(),
    supabase.from("opc_bai_dang").select("id", { count: "exact", head: true }).eq("nguoi_id", nguoi.id),
    supabase.from("opc_binh_luan").select("id", { count: "exact", head: true }).eq("nguoi_id", nguoi.id),
    supabase.from("opc_don_hang").select("id", { count: "exact", head: true }).eq("nguoi_id", nguoi.id),
  ]);

  const hoSo = (hoSoRes.data || null) as HoSo | null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#C8943E]">Hồ sơ OPC</p>
        <h1 className="mt-1 text-2xl font-bold text-[#F5EFE6] md:text-3xl">Một người — một hồ sơ</h1>
        <p className="mt-1 text-sm text-[#A797B8]">
          Hồ sơ càng đủ, chẩn đoán càng đúng, đồng hành càng nhanh.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-[#D8C8E8]">Thông tin của bạn</h2>
          <ProfileForm
            ten={nguoi.ten || ""}
            sdt={nguoi.sdt || ""}
            nghe={hoSo?.nghe || ""}
            doanhThu={hoSo?.doanh_thu || ""}
            soNhanSu={hoSo?.so_nhan_su ?? 0}
            mucTieu={hoSo?.muc_tieu || ""}
            diemChin={hoSo?.diem_chin ?? 0}
          />
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#C8943E]/20 bg-gradient-to-b from-[#C8943E]/10 to-transparent p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C8943E]/30 bg-[#C8943E]/15 text-lg font-bold text-[#E8C07A]">
                {(nguoi.ten || user.email || "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-[#F5EFE6]">{nguoi.ten || "Thành viên"}</p>
                <p className="truncate text-xs text-[#A797B8]">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-[11px] text-[#B9A9C9]">
              <p className="flex items-center gap-2">
                <UserRound size={12} className="text-[#C8943E]" /> Vai trò: {VAI_TRO_LABEL[vaiTro] || vaiTro}
              </p>
              <p className="flex items-center gap-2">
                <Mail size={12} className="text-[#C8943E]" /> {user.email}
              </p>
              <p className="flex items-center gap-2">
                <Calendar size={12} className="text-[#C8943E]" /> Tham gia: {formatLuc(nguoi.created_at)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#D8C8E8]">Đóng góp</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/[0.03] p-2">
                <MessagesSquare size={14} className="mx-auto text-[#C8943E]" />
                <p className="mt-1 text-lg font-bold text-[#F5EFE6]">{formatSo(postCountRes.count || 0)}</p>
                <p className="text-[10px] text-[#8E7CA3]">Bài</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-2">
                <MessageCircle size={14} className="mx-auto text-[#C8943E]" />
                <p className="mt-1 text-lg font-bold text-[#F5EFE6]">{formatSo(commentCountRes.count || 0)}</p>
                <p className="text-[10px] text-[#8E7CA3]">Bình luận</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-2">
                <Wallet size={14} className="mx-auto text-[#C8943E]" />
                <p className="mt-1 text-lg font-bold text-[#F5EFE6]">{formatSo(orderCountRes.count || 0)}</p>
                <p className="text-[10px] text-[#8E7CA3]">Đơn</p>
              </div>
            </div>
            <Link
              href="/cong-dong"
              className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-[#C8943E]/30 bg-[#C8943E]/10 px-3 py-2 text-xs font-bold text-[#E8C07A] hover:bg-[#C8943E]/20"
            >
              Vào cộng đồng <ArrowRight size={13} />
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] leading-relaxed text-[#8E7CA3]">
              Dữ liệu hồ sơ chỉ dùng để chẩn đoán và đồng hành. Không chia sẻ cho bên thứ ba ngoài phạm vi bạn đồng ý.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
