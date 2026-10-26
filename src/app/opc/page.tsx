import Link from "next/link";
import {
  Users,
  UserCheck,
  Wallet,
  Ticket,
  MessagesSquare,
  TrendingUp,
  ArrowRight,
  Clock,
  AlertTriangle,
  Sparkles,
  CircleDollarSign,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOpcUser } from "@/lib/opc/auth";
import { LEAD_COLOR, LEAD_LABEL, LEAD_TRANG_THAI } from "@/lib/opc/types";
import { formatLuc, formatSo, formatVnd, thoiGianTruoc } from "@/lib/opc/format";

export const dynamic = "force-dynamic";

type LeadRow = { trang_thai: string; created_at: string; chu_so_huu: string | null };
type PostRow = {
  id: string;
  tieu_de: string | null;
  noi_dung: string;
  created_at: string;
  nguoi: { ten: string | null } | { ten: string | null }[] | null;
};
type ActivityRow = {
  id: string;
  loai: string;
  noi_dung: string;
  luc: string;
  nguoi: { ten: string | null } | { ten: string | null }[] | null;
  lead: { ten: string | null } | { ten: string | null }[] | null;
};

function tenNguoi(v: PostRow["nguoi"] | ActivityRow["nguoi"]): string {
  const x = Array.isArray(v) ? v[0] : v;
  return x?.ten || "Thành viên";
}

function KpiCard({
  icon: Icon,
  label,
  value,
  note,
  accent = "gold",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  note?: string;
  accent?: "gold" | "green" | "violet" | "rose";
}) {
  const map = {
    gold: "bg-[#C8943E]/12 text-[#E8C07A] border-[#C8943E]/25",
    green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    violet: "bg-violet-500/10 text-violet-300 border-violet-500/25",
    rose: "bg-rose-500/10 text-rose-300 border-rose-500/25",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A797B8]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#F5EFE6] md:text-[28px]">{value}</p>
          {note ? <p className="mt-1 text-[11px] text-[#8E7CA3]">{note}</p> : null}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${map[accent]}`}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function SectionTitle({ children, href, cta }: { children: React.ReactNode; href?: string; cta?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#D8C8E8]">{children}</h2>
      {href && cta ? (
        <Link href={href} className="flex items-center gap-1 text-[11px] font-semibold text-[#C8943E] hover:text-[#E8C07A]">
          {cta} <ArrowRight size={12} />
        </Link>
      ) : null}
    </div>
  );
}

export default async function OpcDashboard() {
  const { nguoi, vaiTro, isStaff, isAdmin } = await requireOpcUser();
  const supabase = await createClient();

  const bayNgay = new Date(Date.now() - 7 * 864e5).toISOString();
  const dauThang = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const leadsRes = isStaff
    ? await supabase.from("opc_lead").select("trang_thai, created_at, chu_so_huu").limit(5000)
    : { data: [] as LeadRow[] };

  const leads = (leadsRes.data || []) as LeadRow[];
  const theoTrangThai = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.trang_thai] = (acc[l.trang_thai] || 0) + 1;
    return acc;
  }, {});
  const tongLead = leads.length;
  const leadMoi7 = leads.filter((l) => l.created_at >= bayNgay).length;
  const dangTuVan = (theoTrangThai.mql || 0) + (theoTrangThai.sql || 0);
  const khachTraPhi = (theoTrangThai.customer || 0) + (theoTrangThai.active || 0);
  const khongChu = leads.filter((l) => !l.chu_so_huu && !["churned"].includes(l.trang_thai)).length;
  const coNguyCo = theoTrangThai.at_risk || 0;

  const [postsCountRes, ticketsRes, ordersRes, kpiRes, recentPostsRes, activitiesRes] = await Promise.all([
    supabase.from("opc_bai_dang").select("id", { count: "exact", head: true }).eq("trang_thai", "hien"),
    isStaff
      ? supabase
          .from("opc_ticket")
          .select("id, tieu_de, muc_do, han_xu_ly, trang_thai")
          .neq("trang_thai", "dong")
          .order("created_at", { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [] as { id: string; tieu_de: string; muc_do: string; han_xu_ly: string | null; trang_thai: string }[] }),
    isStaff
      ? supabase
          .from("opc_don_hang")
          .select("so_tien, paid_at, trang_thai")
          .eq("trang_thai", "da_tt")
          .gte("paid_at", dauThang)
      : supabase
          .from("opc_don_hang")
          .select("so_tien, paid_at, trang_thai")
          .eq("trang_thai", "da_tt")
          .gte("paid_at", dauThang),
    isStaff
      ? supabase.from("opc_kpi_ngay").select("*").order("ngay", { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("opc_bai_dang")
      .select("id, tieu_de, noi_dung, created_at, nguoi:opc_nguoi(ten)")
      .eq("trang_thai", "hien")
      .order("created_at", { ascending: false })
      .limit(4),
    isStaff
      ? supabase
          .from("opc_hoat_dong")
          .select("id, loai, noi_dung, luc, nguoi:opc_nguoi(ten), lead:opc_lead(ten)")
          .order("luc", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] as ActivityRow[] }),
  ]);

  const postsCount = postsCountRes.count || 0;
  const tickets = (ticketsRes.data || []) as { id: string; tieu_de: string; muc_do: string; han_xu_ly: string | null; trang_thai: string }[];
  const doanhThuThang = ((ordersRes.data || []) as { so_tien: number }[]).reduce((s, x) => s + (x.so_tien || 0), 0);
  const kpi = (kpiRes.data || null) as { mrr: number; nps: number | null; ngay: string } | null;
  const recentPosts = (recentPostsRes.data || []) as unknown as PostRow[];
  const activities = (activitiesRes.data || []) as unknown as ActivityRow[];

  const quaHan = tickets.filter((t) => t.han_xu_ly && new Date(t.han_xu_ly).getTime() < Date.now()).length;

  const hoSoFields = [nguoi?.ten, nguoi?.sdt].filter(Boolean).length;

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#C8943E]">M03 · OPC Center</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#F5EFE6] md:text-3xl">
            {isStaff ? "Tổng quan vận hành" : "Không gian của tôi"}
          </h1>
          <p className="mt-1 text-sm text-[#A797B8]">
            {isStaff
              ? "Một màn hình đủ để biết hôm nay phải làm gì, ai làm, và dòng tiền đang ở đâu."
              : "Hồ sơ, cộng đồng và hành trình OPC của bạn."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[#C8943E]/25 bg-[#C8943E]/10 px-3 py-1 text-[11px] font-semibold text-[#E8C07A]">
            {isAdmin ? "Quản trị" : isStaff ? "Nhân sự OPC" : "Thành viên"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-[#A797B8]">
            {formatLuc(new Date().toISOString())}
          </span>
        </div>
      </header>

      {isStaff ? (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <KpiCard icon={Users} label="Lead mới · 7 ngày" value={formatSo(leadMoi7)} note={`Tổng ${formatSo(tongLead)} lead`} />
            <KpiCard icon={UserCheck} label="Đang tư vấn" value={formatSo(dangTuVan)} note="MQL + SQL" accent="violet" />
            <KpiCard icon={CircleDollarSign} label="Khách trả phí" value={formatSo(khachTraPhi)} note="Customer + Active" accent="green" />
            <KpiCard
              icon={Wallet}
              label="Thu trong tháng"
              value={doanhThuThang ? formatVnd(doanhThuThang) : "0 đ"}
              note={kpi?.mrr ? `MRR kỳ trước ${formatVnd(kpi.mrr)}` : "Chưa có dữ liệu MRR"}
            />
          </section>

          <div className="grid gap-5 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <SectionTitle href="/leads" cta="Mở CRM">Phễu bán hàng</SectionTitle>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
                {tongLead === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Users size={30} className="text-[#8E7CA3]" />
                    <p className="mt-3 text-sm font-semibold text-[#F5EFE6]">Chưa có lead nào</p>
                    <p className="mt-1 max-w-sm text-xs text-[#A797B8]">
                      Thêm lead đầu tiên để bắt đầu đo phễu: lead → MQL → SQL → khách hàng.
                    </p>
                    <Link
                      href="/leads"
                      className="mt-4 rounded-xl bg-[#C8943E] px-4 py-2 text-xs font-bold text-[#160B22] hover:bg-[#E8C07A]"
                    >
                      Thêm lead
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {LEAD_TRANG_THAI.map((t) => {
                      const n = theoTrangThai[t.value] || 0;
                      const pct = tongLead ? Math.max(2, Math.round((n / tongLead) * 100)) : 0;
                      return (
                        <div key={t.value}>
                          <div className="mb-1 flex items-center justify-between text-[11px]">
                            <span className="font-medium text-[#D8C8E8]">{t.label}</span>
                            <span className="text-[#A797B8]">
                              {formatSo(n)} · {tongLead ? Math.round((n / tongLead) * 100) : 0}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#C8943E] to-[#E8C07A]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section>
              <SectionTitle>Việc hôm nay</SectionTitle>
              <div className="space-y-3">
                <Link href="/leads" className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#C8943E]/30">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#D8C8E8]">
                      <Users size={14} className="text-[#C8943E]" /> Lead chưa có chủ
                    </span>
                    <span className="text-lg font-bold text-[#E8C07A]">{formatSo(khongChu)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#8E7CA3]">Gán chủ trong 24 giờ để không rơi lead.</p>
                </Link>
                <Link href="/leads?status=at_risk" className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#C8943E]/30">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#D8C8E8]">
                      <AlertTriangle size={14} className="text-orange-300" /> Khách có nguy cơ rời
                    </span>
                    <span className="text-lg font-bold text-orange-300">{formatSo(coNguyCo)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#8E7CA3]">Liên hệ trước khi hết hạn 30 ngày.</p>
                </Link>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#D8C8E8]">
                      <Ticket size={14} className="text-violet-300" /> Ticket đang mở
                    </span>
                    <span className="text-lg font-bold text-violet-300">{formatSo(tickets.length)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#8E7CA3]">
                    {quaHan > 0 ? `${quaHan} ticket quá hạn — xử lý ngay.` : "Không có ticket quá hạn."}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#D8C8E8]">
                      <MessagesSquare size={14} className="text-emerald-300" /> Bài cộng đồng
                    </span>
                    <span className="text-lg font-bold text-emerald-300">{formatSo(postsCount)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#8E7CA3]">Bài đang hiển thị.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section>
              <SectionTitle href="/leads" cta="Xem tất cả">Lead gần đây</SectionTitle>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {leads.length === 0 ? (
                  <p className="p-5 text-xs text-[#A797B8]">Chưa có lead.</p>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {leads.slice(0, 5).map((l, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${l.trang_thai === "at_risk" ? "bg-orange-400" : "bg-[#C8943E]"}`} />
                          <span className="truncate text-xs text-[#D8C8E8]">{LEAD_LABEL[l.trang_thai] || l.trang_thai}</span>
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${LEAD_COLOR[l.trang_thai] || ""}`}>
                          {LEAD_LABEL[l.trang_thai] || l.trang_thai}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section>
              <SectionTitle>Hoạt động gần đây</SectionTitle>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                {activities.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#A797B8]">Chưa có hoạt động. Mọi thao tác CRM sẽ được ghi ở đây.</p>
                ) : (
                  <ul className="space-y-3">
                    {activities.map((a) => (
                      <li key={a.id} className="flex gap-3">
                        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C8943E]/10 text-[10px] font-bold text-[#E8C07A]">
                          {tenNguoi(a.nguoi).slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs text-[#D8C8E8]">
                            <b className="font-semibold text-[#F5EFE6]">{tenNguoi(a.nguoi)}</b> · {a.noi_dung}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-[#8E7CA3]">
                            {Array.isArray(a.lead) ? a.lead[0]?.ten : a.lead?.ten ? `Lead: ${a.lead.ten} · ` : ""}
                            {thoiGianTruoc(a.luc)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <KpiCard icon={UserCheck} label="Hồ sơ" value={`${hoSoFields}/2`} note="Tên + số điện thoại" />
            <KpiCard icon={MessagesSquare} label="Bài của tôi" value={formatSo(postsCount)} note="Trong cộng đồng" accent="violet" />
            <KpiCard icon={Wallet} label="Đơn đã thanh toán" value={formatSo((ordersRes.data || []).length)} note="Trong tháng" accent="green" />
            <KpiCard icon={Sparkles} label="Cấp độ" value={nguoi?.vai_tro === "mentor" ? "Mentor" : "Thành viên"} note="OPC Center" />
          </section>

          <div className="grid gap-5 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <SectionTitle href="/cong-dong" cta="Vào cộng đồng">Bài mới trong cộng đồng</SectionTitle>
              <div className="space-y-3">
                {recentPosts.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                    <MessagesSquare size={28} className="mx-auto text-[#8E7CA3]" />
                    <p className="mt-3 text-sm font-semibold text-[#F5EFE6]">Cộng đồng đang chờ bài đầu tiên</p>
                    <p className="mt-1 text-xs text-[#A797B8]">Chia sẻ một câu hỏi hoặc một bài học vận hành.</p>
                  </div>
                ) : (
                  recentPosts.map((p) => (
                    <article key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-[11px] text-[#A797B8]">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2A1538] text-[10px] font-bold text-[#E8C07A]">
                          {tenNguoi(p.nguoi).slice(0, 1).toUpperCase()}
                        </span>
                        <b className="font-semibold text-[#D8C8E8]">{tenNguoi(p.nguoi)}</b>
                        <span>· {thoiGianTruoc(p.created_at)}</span>
                      </div>
                      {p.tieu_de ? <h3 className="mt-2 text-sm font-bold text-[#F5EFE6]">{p.tieu_de}</h3> : null}
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[#B9A9C9]">{p.noi_dung}</p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section>
              <SectionTitle href="/ho-so" cta="Cập nhật">Hồ sơ OPC</SectionTitle>
              <div className="rounded-2xl border border-[#C8943E]/20 bg-gradient-to-b from-[#C8943E]/10 to-transparent p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E8C07A]">Hành trình của bạn</p>
                <p className="mt-2 text-lg font-bold text-[#F5EFE6]">{nguoi?.ten || "Thành viên"}</p>
                <p className="mt-1 text-xs text-[#A797B8]">{nguoi?.email}</p>
                <div className="mt-4 space-y-2 text-[11px] text-[#B9A9C9]">
                  <p className="flex items-center gap-2">
                    <Clock size={12} className="text-[#C8943E]" /> Tham gia: {formatLuc(nguoi?.created_at)}
                  </p>
                  <p className="flex items-center gap-2">
                    <TrendingUp size={12} className="text-[#C8943E]" /> Vai trò:{" "}
                    {nguoi?.vai_tro === "mentor" ? "Mentor" : "Thành viên"}
                  </p>
                </div>
                <Link
                  href="/ho-so"
                  className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-[#C8943E] px-3 py-2 text-xs font-bold text-[#160B22] hover:bg-[#E8C07A]"
                >
                  Hoàn thiện hồ sơ <ArrowRight size={13} />
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
