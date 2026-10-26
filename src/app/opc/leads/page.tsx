import Link from "next/link";
import { Search, Plus, Users, Phone, Mail, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOpcStaff } from "@/lib/opc/auth";
import { LEAD_COLOR, LEAD_LABEL, LEAD_TRANG_THAI } from "@/lib/opc/types";
import { formatSo, thoiGianTruoc } from "@/lib/opc/format";
import LeadForm from "@/components/opc/LeadForm";

export const dynamic = "force-dynamic";

type Lead = {
  id: string;
  ten: string;
  email: string | null;
  sdt: string | null;
  nguon: string | null;
  kenh: string | null;
  trang_thai: string;
  diem: number;
  created_at: string;
  chu_so_huu: string | null;
  nguoi_phu_trach: { ten: string | null; email: string | null } | { ten: string | null; email: string | null }[] | null;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireOpcStaff();
  const { q, status } = await searchParams;
  const tuKhoa = (q || "").trim().slice(0, 80);
  const locTrangThai = LEAD_TRANG_THAI.some((t) => t.value === status) ? status : "";

  const supabase = await createClient();

  let query = supabase
    .from("opc_lead")
    .select("*, nguoi_phu_trach:opc_nguoi(ten, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (locTrangThai) query = query.eq("trang_thai", locTrangThai);
  if (tuKhoa) {
    const sach = tuKhoa.replace(/[%,()]/g, " ").trim();
    if (sach) query = query.or(`ten.ilike.%${sach}%,sdt.ilike.%${sach}%,email.ilike.%${sach}%`);
  }

  const [leadsRes, statusRes] = await Promise.all([
    query,
    supabase.from("opc_lead").select("trang_thai").limit(5000),
  ]);

  const leads = (leadsRes.data || []) as unknown as Lead[];
  const dem = ((statusRes.data || []) as { trang_thai: string }[]).reduce<Record<string, number>>((acc, l) => {
    acc[l.trang_thai] = (acc[l.trang_thai] || 0) + 1;
    return acc;
  }, {});
  const tong = Object.values(dem).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#C8943E]">CRM · Bán hàng</p>
          <h1 className="mt-1 text-2xl font-bold text-[#F5EFE6] md:text-3xl">Lead & phễu bán</h1>
          <p className="mt-1 text-sm text-[#A797B8]">
            {formatSo(tong)} lead · {formatSo(dem.active || 0)} đang hoạt động · {formatSo(dem.at_risk || 0)} có nguy cơ rời
          </p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <section className="space-y-4">
          <form className="flex flex-col gap-2 sm:flex-row" action="/leads">
            <div className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7C6A8E]" />
              <input
                name="q"
                defaultValue={tuKhoa}
                placeholder="Tìm tên, số điện thoại, email…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-[#F5EFE6] placeholder:text-[#6F5D80] focus:border-[#C8943E]/50 focus:outline-none"
              />
            </div>
            {locTrangThai ? <input type="hidden" name="status" value={locTrangThai} /> : null}
            <button
              type="submit"
              className="rounded-xl border border-[#C8943E]/30 bg-[#C8943E]/10 px-4 py-2.5 text-xs font-bold text-[#E8C07A] hover:bg-[#C8943E]/20"
            >
              Tìm
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            <Link
              href={tuKhoa ? `/leads?q=${encodeURIComponent(tuKhoa)}` : "/leads"}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                !locTrangThai
                  ? "border-[#C8943E]/40 bg-[#C8943E]/15 text-[#E8C07A]"
                  : "border-white/10 bg-white/[0.03] text-[#A797B8] hover:text-[#F5EFE6]"
              }`}
            >
              Tất cả {tong ? `· ${tong}` : ""}
            </Link>
            {LEAD_TRANG_THAI.map((t) => {
              const href = `/leads?${new URLSearchParams({
                ...(tuKhoa ? { q: tuKhoa } : {}),
                status: t.value,
              }).toString()}`;
              return (
                <Link
                  key={t.value}
                  href={href}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                    locTrangThai === t.value
                      ? "border-[#C8943E]/40 bg-[#C8943E]/15 text-[#E8C07A]"
                      : "border-white/10 bg-white/[0.03] text-[#A797B8] hover:text-[#F5EFE6]"
                  }`}
                >
                  {t.label} {dem[t.value] ? `· ${dem[t.value]}` : ""}
                </Link>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <Users size={30} className="text-[#8E7CA3]" />
                <p className="mt-3 text-sm font-semibold text-[#F5EFE6]">Không có lead phù hợp</p>
                <p className="mt-1 max-w-sm text-xs text-[#A797B8]">
                  {tuKhoa || locTrangThai
                    ? "Thử bỏ bộ lọc hoặc từ khoá khác."
                    : "Thêm lead đầu tiên ở khung bên cạnh để bắt đầu."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {leads.map((l) => {
                  const phuTrach = Array.isArray(l.nguoi_phu_trach) ? l.nguoi_phu_trach[0] : l.nguoi_phu_trach;
                  return (
                    <li key={l.id}>
                      <Link href={`/leads/${l.id}`} className="group flex flex-col gap-3 px-4 py-3.5 hover:bg-white/[0.04] md:flex-row md:items-center md:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#C8943E]/20 bg-[#C8943E]/10 text-xs font-bold text-[#E8C07A]">
                            {l.ten.slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#F5EFE6] group-hover:text-[#E8C07A]">{l.ten}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#A797B8]">
                              {l.sdt ? (
                                <span className="flex items-center gap-1">
                                  <Phone size={10} /> {l.sdt}
                                </span>
                              ) : null}
                              {l.email ? (
                                <span className="flex items-center gap-1">
                                  <Mail size={10} /> {l.email}
                                </span>
                              ) : null}
                              <span>{l.nguon || "Chưa rõ nguồn"}{l.kenh ? ` · ${l.kenh}` : ""}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 md:justify-end">
                          <span className="text-[10px] text-[#8E7CA3]">
                            {phuTrach?.ten || phuTrach?.email || "Chưa gán"} · {thoiGianTruoc(l.created_at)}
                          </span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${LEAD_COLOR[l.trang_thai] || ""}`}>
                            {LEAD_LABEL[l.trang_thai] || l.trang_thai}
                          </span>
                          <ArrowRight size={13} className="text-[#6F5D80] group-hover:text-[#E8C07A]" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <aside>
          <div className="sticky top-6 rounded-2xl border border-[#C8943E]/20 bg-white/[0.03] p-4 md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8943E]/15 text-[#E8C07A]">
                <Plus size={16} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#F5EFE6]">Thêm lead</h2>
                <p className="text-[10px] text-[#8E7CA3]">Ghi trong 30 giây, không bỏ sót.</p>
              </div>
            </div>
            <LeadForm />
          </div>
        </aside>
      </div>
    </div>
  );
}
