import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, MessageSquare, Clock, UserRound, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOpcStaff } from "@/lib/opc/auth";
import { LEAD_COLOR, LEAD_LABEL } from "@/lib/opc/types";
import { formatLuc, formatSo, thoiGianTruoc } from "@/lib/opc/format";
import LeadDetailForm from "@/components/opc/LeadDetailForm";
import NoteForm from "@/components/opc/NoteForm";

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
  ghi_chu: string | null;
  created_at: string;
  updated_at: string;
  chu_so_huu: string | null;
  nguoi_phu_trach: { ten: string | null; email: string | null } | { ten: string | null; email: string | null }[] | null;
};

type HoatDong = {
  id: string;
  loai: string;
  noi_dung: string;
  luc: string;
  nguoi: { ten: string | null } | { ten: string | null }[] | null;
};

const LOAI_ICON: Record<string, typeof MessageSquare> = {
  goi: Phone,
  email: Mail,
  ghi_chu: MessageSquare,
  hen: Clock,
  trang_thai: Activity,
  he_thong: Activity,
};

function tenNguoi(v: { ten: string | null } | { ten: string | null }[] | null): string {
  const x = Array.isArray(v) ? v[0] : v;
  return x?.ten || "Hệ thống";
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOpcStaff();
  const { id } = await params;
  const supabase = await createClient();

  const [leadRes, hoatDongRes, nhanVienRes] = await Promise.all([
    supabase.from("opc_lead").select("*, nguoi_phu_trach:opc_nguoi(ten, email)").eq("id", id).maybeSingle(),
    supabase
      .from("opc_hoat_dong")
      .select("*, nguoi:opc_nguoi(ten)")
      .eq("lead_id", id)
      .order("luc", { ascending: false })
      .limit(50),
    supabase.from("opc_nguoi").select("id, ten, email").order("ten", { ascending: true }),
  ]);

  const lead = leadRes.data as unknown as Lead | null;
  if (!lead) notFound();

  const hoatDong = (hoatDongRes.data || []) as unknown as HoatDong[];
  const nhanVien = (nhanVienRes.data || []) as { id: string; ten: string | null; email: string | null }[];
  const phuTrach = Array.isArray(lead.nguoi_phu_trach) ? lead.nguoi_phu_trach[0] : lead.nguoi_phu_trach;

  return (
    <div className="space-y-6">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A797B8] hover:text-[#E8C07A]">
        <ArrowLeft size={14} /> Về danh sách lead
      </Link>

      <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#C8943E]/10 via-white/[0.03] to-transparent p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#C8943E]/30 bg-[#C8943E]/15 text-xl font-bold text-[#E8C07A]">
              {lead.ten.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[#F5EFE6] md:text-2xl">{lead.ten}</h1>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${LEAD_COLOR[lead.trang_thai] || ""}`}>
                  {LEAD_LABEL[lead.trang_thai] || lead.trang_thai}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#A797B8]">
                {lead.nguon || "Chưa rõ nguồn"}
                {lead.kenh ? ` · ${lead.kenh}` : ""} · Tạo {thoiGianTruoc(lead.created_at)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lead.sdt ? (
                  <a
                    href={`tel:${lead.sdt}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#D8C8E8] hover:border-[#C8943E]/30"
                  >
                    <Phone size={12} className="text-[#C8943E]" /> {lead.sdt}
                  </a>
                ) : null}
                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#D8C8E8] hover:border-[#C8943E]/30"
                  >
                    <Mail size={12} className="text-[#C8943E]" /> {lead.email}
                  </a>
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#D8C8E8]">
                  <UserRound size={12} className="text-[#C8943E]" /> {phuTrach?.ten || phuTrach?.email || "Chưa gán"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#D8C8E8]">
                  <Activity size={12} className="text-[#C8943E]" /> Điểm {formatSo(lead.diem)}/100
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-[#8E7CA3]">Cập nhật {formatLuc(lead.updated_at)}</p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-[#D8C8E8]">Trạng thái & phụ trách</h2>
          <LeadDetailForm
            leadId={lead.id}
            trangThai={lead.trang_thai}
            chuSoHuu={lead.chu_so_huu}
            ghiChu={lead.ghi_chu}
            nhanVien={nhanVien}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[#D8C8E8]">Dòng thời gian</h2>
          <NoteForm leadId={lead.id} />
          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {hoatDong.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#A797B8]">Chưa có hoạt động.</p>
            ) : (
              hoatDong.map((h) => {
                const Icon = LOAI_ICON[h.loai] || MessageSquare;
                return (
                  <div key={h.id} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0F0718] text-[#C8943E]">
                      <Icon size={12} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-relaxed text-[#D8C8E8]">{h.noi_dung}</p>
                      <p className="mt-0.5 text-[10px] text-[#8E7CA3]">
                        {tenNguoi(h.nguoi)} · {thoiGianTruoc(h.luc)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
