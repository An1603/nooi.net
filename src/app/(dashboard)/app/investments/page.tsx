"use server";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, TrendingUp, DollarSign, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";

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

export default async function UserInvestmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Vui lòng đăng nhập</h1>
          <p className="text-gray-400 mb-6">Để xem danh sách đầu tư của bạn, vui lòng đăng nhập trước.</p>
          <Link href="/login" className="px-6 py-3 bg-primary rounded-lg">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const { data: investments } = await supabase
    .from("investments")
    .select(`
      *,
      project:project_id (
        id,
        title,
        slug
      )
    `)
    .eq("user_id", user.id)
    .order("investment_date", { ascending: false });

  const { data: investmentsSummary } = await supabase
    .rpc("get_investments_summary", { user_id: user.id });

  const totalInvested = investments?.filter(i => i.payment_status === "paid").reduce((sum, i) => sum + i.amount, 0) || 0;
  const pendingCount = investments?.filter(i => i.payment_status === "pending").length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/app/projects"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Danh sách dự án
          </Link>
          <h1 className="text-3xl font-bold mb-2">Đầu tư của tôi</h1>
          <p className="text-gray-400">Theo dõi tất cả các khoản đầu tư của bạn trong hệ sinh thái NOOI</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={20} className="text-emerald-400" />
              <span className="text-sm text-gray-400">Tổng đầu tư</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {totalInvested.toLocaleString("vi-VN")} đ
            </p>
            <p className="text-xs text-gray-500 mt-1">Tài khoản đã thanh toán</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={20} className="text-amber-400" />
              <span className="text-sm text-gray-400">Đang chờ</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
            <p className="text-xs text-gray-500 mt-1">Yêu cầu đầu tư</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={20} className="text-blue-400" />
              <span className="text-sm text-gray-400">Dự án đã đầu tư</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {investments?.filter(i => i.payment_status === "paid").length || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Dự án đã hoàn thành</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={20} className="text-purple-400" />
              <span className="text-sm text-gray-400">Đã hoàn thành</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {investments?.filter(i => i.payment_status === "paid" && 
                i.project?.status === "completed").length || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Dự án hoàn thành</p>
          </div>
        </div>

        {/* Investments Table */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Danh sách đầu tư</h2>
          </div>

          <div className="divide-y divide-gray-700">
            {(!investments || investments.length === 0) ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold mb-2">Chưa có khoản đầu tư nào</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Bạn chưa đầu tư vào dự án nào. Hãy khám phá các dự án đầu tư ngay hôm nay!
                </p>
                <Link 
                  href="/projects"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <TrendingUp size={16} />
                  Khám phá dự án đầu tư
                </Link>
              </div>
            ) : (
              investments.map((investment) => (
                <div key={investment.id} className="p-6 hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Link 
                          href={`/projects/${investment.project?.slug || investment.project_id}`}
                          className="font-semibold group"
                        >
                          {investment.project?.title || "Dự án đã xóa"}
                        </Link>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            STATUS_COLORS[investment.payment_status as keyof typeof STATUS_COLORS] || "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          }`}
                        >
                          {STATUS_LABELS[investment.payment_status as keyof typeof STATUS_LABELS] || investment.payment_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(investment.investment_date).toLocaleDateString("vi-VN")}
                        </span>
                        {investment.payment_method && (
                          <span>
                            {investment.payment_method === "bank_transfer" && "🏦 Chuyển khoản"}
                            {investment.payment_method === "credit_card" && "💳 Thẻ"}
                            {investment.payment_method === "crypto" && "₿ Crypto"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {investment.amount.toLocaleString("vi-VN")} đ
                      </p>
                      <Link 
                        href={`/app/investments/${investment.id}`}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        Xem chi tiết →
                      </Link>
                    </div>
                  </div>

                  {investment.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-sm text-gray-400 italic">{investment.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}