"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { DollarSign, TrendingUp, Users, Search, Filter, CheckCircle2, XCircle, Clock } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  failed: "bg-gray-600/10 text-gray-400 border-gray-600/20",
};

const STATUS_LABELS = {
  pending: "Chờ xác nhận",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
  failed: "Thất bại",
};

export default async function AdminInvestmentsPage() {
  const supabase = createAdminClient();

  const { data: investments, error } = await supabase
    .from("investments")
    .select(`
      *,
      project:project_id (id, title, slug, investment_target, status),
      investor:user_id (email)
    `)
    .order("investment_date", { ascending: false })
    .limit(200);

  if (error) {
    return <div className="p-6 text-red-400">Lỗi: {error.message}</div>;
  }

  const totalPending = investments?.filter(i => i.payment_status === "pending").length || 0;
  const totalPaid = investments?.filter(i => i.payment_status === "paid").length || 0;
  const totalAmount = investments?.filter(i => i.payment_status === "paid").reduce((sum, i) => sum + i.amount, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quản lý đầu tư</h1>
          <p className="text-sm text-muted-foreground mt-1">Tất cả lượt đăng ký đầu tư trên hệ thống</p>
        </div>
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-primary/30 transition-colors"
        >
          <TrendingUp size={16} />
          Xem dự án
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-emerald-400" />
            <span className="text-xs text-muted-foreground">Tổng đã đầu tư</span>
          </div>
          <p className="text-xl font-bold">{totalAmount.toLocaleString("vi-VN")} đ</p>
          <p className="text-xs text-muted-foreground mt-1">{totalPaid} giao dịch</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-amber-400" />
            <span className="text-xs text-muted-foreground">Chờ xác nhận</span>
          </div>
          <p className="text-xl font-bold text-amber-400">{totalPending}</p>
          <p className="text-xs text-muted-foreground mt-1">Cần xử lý</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-blue-400" />
            <span className="text-xs text-muted-foreground">Nhà đầu tư</span>
          </div>
          <p className="text-xl font-bold">{new Set(investments?.map(i => i.user_id).filter(Boolean)).size}</p>
          <p className="text-xs text-muted-foreground mt-1">Người đã đầu tư</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-purple-400" />
            <span className="text-xs text-muted-foreground">Tổng giao dịch</span>
          </div>
          <p className="text-xl font-bold">{investments?.length || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Lượt đăng ký</p>
        </div>
      </div>

      {/* Investments Table */}
      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-semibold">Danh sách đầu tư</h2>
        </div>
        <div className="divide-y divide-border/30">
          {(!investments || investments.length === 0) ? (
            <p className="text-xs text-muted-foreground p-8 text-center">Chưa có lượt đầu tư nào.</p>
          ) : (
            investments.map((item) => (
              <div key={item.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/admin/projects`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {item.project?.title || "Không xác định"}
                      </Link>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                        STATUS_COLORS[item.payment_status] || "bg-gray-500/10 text-gray-400"
                      }`}>
                        {STATUS_LABELS[item.payment_status] || item.payment_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{item.investor_name || item.investor_email || item.user_id?.slice(0, 8)}</span>
                      <span>{item.investor_email}</span>
                      <span>{item.investor_phone}</span>
                      <span>{new Date(item.investment_date).toLocaleDateString("vi-VN")}</span>
                    </div>
                    {item.notes && (
                      <p className="text-[11px] text-muted-foreground mt-1 italic">{item.notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-primary">
                      {item.amount.toLocaleString("vi-VN")} đ
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.payment_method === "bank_transfer" ? "🏦 Chuyển khoản" : 
                       item.payment_method === "credit_card" ? "💳 Thẻ" :
                       item.payment_method === "crypto" ? "₿ Crypto" : item.payment_method}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}