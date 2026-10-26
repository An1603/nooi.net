import { ReceiptText, Wallet, Clock, CheckCircle2, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOpcStaff } from "@/lib/opc/auth";
import { formatNgay, formatSo, formatVnd } from "@/lib/opc/format";

export const dynamic = "force-dynamic";

type DonHang = {
  id: string;
  so_tien: number;
  trang_thai: string;
  ma_giao_dich: string | null;
  created_at: string;
  paid_at: string | null;
  nguoi: { ten: string | null; email: string | null } | { ten: string | null; email: string | null }[] | null;
  goi: { ten: string; ky: string } | { ten: string; ky: string }[] | null;
};

type Goi = { ma: string; ten: string; gia: number; ky: string; active: boolean };

const TT: Record<string, { label: string; cls: string }> = {
  cho_tt: { label: "Chờ thanh toán", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  da_tt: { label: "Đã thanh toán", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  huy: { label: "Đã huỷ", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  hoan: { label: "Hoàn tiền", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
};

function mot<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] || null : v;
}

export default async function DonHangPage() {
  await requireOpcStaff();
  const supabase = await createClient();

  const [goiRes, donRes] = await Promise.all([
    supabase.from("opc_goi").select("ma, ten, gia, ky, active").eq("active", true).order("thu_tu"),
    supabase
      .from("opc_don_hang")
      .select("id, so_tien, trang_thai, ma_giao_dich, created_at, paid_at, nguoi:opc_nguoi(ten, email), goi:opc_goi(ten, ky)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const goi = (goiRes.data || []) as Goi[];
  const don = (donRes.data || []) as unknown as DonHang[];
  const daTT = don.filter((d) => d.trang_thai === "da_tt");
  const thangNay = daTT.filter((d) => d.paid_at && new Date(d.paid_at).getMonth() === new Date().getMonth());
  const tongThang = thangNay.reduce((s, d) => s + d.so_tien, 0);
  const choTT = don.filter((d) => d.trang_thai === "cho_tt").length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#C8943E]">Thương mại</p>
        <h1 className="mt-1 text-2xl font-bold text-[#F5EFE6] md:text-3xl">Gói & dòng tiền</h1>
        <p className="mt-1 text-sm text-[#A797B8]">Đối soát đơn hàng, gói đang bán và doanh thu ghi nhận.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A797B8]">Thu tháng này</p>
          <p className="mt-2 text-2xl font-bold text-[#E8C07A]">{formatVnd(tongThang)}</p>
          <p className="mt-1 text-[11px] text-[#8E7CA3]">{thangNay.length} đơn đã thanh toán</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A797B8]">Chờ thanh toán</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">{formatSo(choTT)}</p>
          <p className="mt-1 text-[11px] text-[#8E7CA3]">Cần nhắc trong 24 giờ</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A797B8]">Tổng đơn</p>
          <p className="mt-2 text-2xl font-bold text-[#F5EFE6]">{formatSo(don.length)}</p>
          <p className="mt-1 text-[11px] text-[#8E7CA3]">100 đơn gần nhất</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A797B8]">Gói đang bán</p>
          <p className="mt-2 text-2xl font-bold text-[#F5EFE6]">{formatSo(goi.length)}</p>
          <p className="mt-1 text-[11px] text-[#8E7CA3]">Giá niêm yết</p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[#D8C8E8]">Đơn hàng gần đây</h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {don.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <ReceiptText size={30} className="mx-auto text-[#8E7CA3]" />
                <p className="mt-3 text-sm font-semibold text-[#F5EFE6]">Chưa có đơn hàng</p>
                <p className="mt-1 text-xs text-[#A797B8]">Đơn sẽ xuất hiện khi cổng thanh toán hoặc CRM ghi nhận.</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {don.map((d) => {
                  const n = mot(d.nguoi);
                  const g = mot(d.goi);
                  const tt = TT[d.trang_thai] || TT.cho_tt;
                  return (
                    <li key={d.id} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#F5EFE6]">{n?.ten || n?.email || "Khách"}</p>
                        <p className="text-[11px] text-[#A797B8]">
                          {g?.ten || "Gói"} · {formatNgay(d.paid_at || d.created_at)}
                          {d.ma_giao_dich ? ` · ${d.ma_giao_dich}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#E8C07A]">{formatVnd(d.so_tien)}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tt.cls}`}>{tt.label}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[#D8C8E8]">Gói niêm yết</h2>
          <div className="space-y-2.5">
            {goi.map((g) => (
              <div key={g.ma} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#F5EFE6]">{g.ten}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[#8E7CA3]">
                      {g.ky === "thang" ? "Hằng tháng" : g.ky === "lan" ? "Một lần" : g.ky === "mot_lan" ? "Một lần" : "Miễn phí"}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#E8C07A]">{g.gia ? formatVnd(g.gia) : "Miễn phí"}</span>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed border-white/15 p-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-[#A797B8]">
                <Package size={13} className="text-[#C8943E]" /> Giai đoạn 2
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-[#8E7CA3]">
                Nối cổng thanh toán và tự động tạo đơn. Hiện tại đơn được ghi nhận thủ công để đối soát.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
