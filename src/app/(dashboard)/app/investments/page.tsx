"use server";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TrendingUp, DollarSign, Calendar, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  paid: "Đã duyệt",
  cancelled: "Đã hủy",
  failed: "Thất bại",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-n-orange/15 text-n-orange border-n-orange/20",
  paid: "bg-n-green/15 text-n-green border-n-green/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/15 text-destructive border-destructive/20",
};

export default async function InvestmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let investments: Array<{
    id: string;
    amount: number;
    investment_date: string;
    payment_status: string;
    project_id: string;
    project?: { title: string };
  }> = [];

  try {
    const { data } = await supabase
      .from("investments")
      .select("*, project:projects(title)")
      .eq("user_id", user?.id || "")
      .order("created_at", { ascending: false });
    if (data) investments = data;
  } catch { /* table may not exist */ }

  const totalInvested = investments
    .filter((inv) => inv.payment_status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-3 transition-colors">
              <ExternalLink size={14} />
              Danh sách dự án
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Đầu tư của tôi</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Tổng đầu tư</p>
            <p className="text-2xl font-bold text-primary">{new Intl.NumberFormat("vi-VN").format(totalInvested)} VNĐ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-n-green/15 flex items-center justify-center">
                <DollarSign size={20} className="text-n-green" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng đầu tư</p>
                <p className="text-lg font-bold text-foreground">{new Intl.NumberFormat("vi-VN").format(totalInvested)}đ</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-n-purple/15 flex items-center justify-center">
                <TrendingUp size={20} className="text-n-purple" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Số khoản đầu tư</p>
                <p className="text-lg font-bold text-foreground">{investments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-n-teal/15 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-n-teal" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Đã duyệt</p>
                <p className="text-lg font-bold text-foreground">{investments.filter((i) => i.payment_status === "paid").length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Danh sách đầu tư</h2>
          </div>
          {investments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-n-gold/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-n-gold" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">Chưa có khoản đầu tư nào</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">Khám phá các dự án đầu tư trong hệ sinh thái NOOI</p>
              <Link href="/app/projects" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 transition-all">
                Khám phá dự án
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {investments.map((inv) => (
                <Link key={inv.id} href={`/app/investments/${inv.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-n-gold/15 flex items-center justify-center shrink-0">
                      <DollarSign size={18} className="text-n-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{inv.project?.title || "Dự án"}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          STATUS_COLORS[inv.payment_status] || "bg-muted text-muted-foreground border-border"
                        }`}>
                          {STATUS_LABELS[inv.payment_status] || inv.payment_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                        <span>{new Intl.NumberFormat("vi-VN").format(inv.amount)}đ</span>
                        <span>{inv.investment_date ? new Date(inv.investment_date).toLocaleDateString("vi-VN") : ""}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
