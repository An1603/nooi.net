"use server";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign, Calendar, TrendingUp, User, ExternalLink } from "lucide-react";

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

const PAYMENT_METHODS = {
  bank_transfer: "Chuyển khoản ngân hàng",
  credit_card: "Thẻ tín dụng",
  crypto: "Tiền điện tử",
};

export default async function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: investment } = await supabase
    .from("investments")
    .select(`
      *,
      project:project_id (
        id,
        title,
        slug,
        description,
        investment_target,
        break_even,
        roi_estimate,
        status,
        updated_at
      )
    `)
    .eq("id", id)
    .single();

  if (!investment) {
    notFound();
  }

  // Get progress data
  const { data: progressData } = await supabase
    .from("project_progress")
    .select("*")
    .eq("project_id", investment.project_id)
    .order("progress_date", { ascending: true });

  const latestProgress = progressData?.length > 0 
    ? progressData[progressData.length - 1] 
    : null;

  // Calculate funding progress
  const { data: allInvestments } = await supabase
    .from("investments")
    .select("amount")
    .eq("project_id", investment.project_id)
    .eq("payment_status", "paid");

  const totalRaised = allInvestments?.reduce((sum, i) => sum + i.amount, 0) || 0;
  const target = investment.project?.investment_target || 0;
  const percentage = target > 0 ? Math.round((totalRaised / target) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back */}
        <Link 
          href="/app/investments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách đầu tư
        </Link>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Left: Investment Info */}
          <div className="md:col-span-3 space-y-6">
            {/* Investment Summary */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl font-bold">Chi tiết đầu tư</h1>
                <Link 
                  href={`/projects/${investment.project?.slug || investment.project_id}`}
                  target="_blank"
                  className="text-sm text-primary flex items-center gap-1 hover:underline"
                >
                  Xem dự án <ExternalLink size={14} />
                </Link>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-gray-400 mb-1">Dự án</span>
                    <span className="font-medium">{investment.project?.title || "Không xác định"}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-1">Ngày đầu tư</span>
                    <span className="font-medium">
                      {new Date(investment.investment_date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-1">Số tiền</span>
                    <span className="text-lg font-bold text-primary">
                      {investment.amount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-1">Trạng thái</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{
                        background: STATUS_COLORS[investment.payment_status] 
                          ? STATUS_COLORS[investment.payment_status].match(/text-(\w+)-400/)[1] + 
                            (STATUS_COLORS[investment.payment_status].match(/bg-\w+(-\w+)?\/10 text-\w+-400 border-\w+-400\/20/)[0]?.includes ? "green" : "red")
                          : "#666"
                      }} />
                      <span className={`font-medium ${STATUS_COLORS[investment.payment_status]?.match(/text-\w+-400/) ? STATUS_COLORS[investment.payment_status].match(/text-(\w+)-400/)[1] : "text-gray-400"}`}>
                        {STATUS_LABELS[investment.payment_status] || investment.payment_status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-1">Phương thức</span>
                    <span className="font-medium">
                      {PAYMENT_METHODS[investment.payment_method as keyof typeof PAYMENT_METHODS] || investment.payment_method}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-1">ID đầu tư</span>
                    <code className="text-xs bg-gray-900 px-2 py-1 rounded">{investment.id}</code>
                  </div>
                </div>

                {investment.notes && (
                  <div className="pt-4 border-t border-gray-700">
                    <span className="block text-gray-400 mb-1">Ghi chú</span>
                    <p className="text-sm italic">{investment.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Info */}
            {investment.project && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">{investment.project.title}</h2>
                
                {investment.project.description && (
                  <p className="text-sm text-gray-300 mb-4">{investment.project.description}</p>
                )}

                {/* Financial Info */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mục tiêu</span>
                    <span className="font-medium">{investment.project.investment_target.toLocaleString("vi-VN").replace(/\s/g, "")} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Đã huy động</span>
                    <span className="font-medium text-emerald-400">{totalRaised.toLocaleString("vi-VN").replace(/\s/g, "")} đ ({percentage}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Điểm hòa vốn</span>
                    <span className="font-medium">
                      {investment.project.break_even 
                        ? investment.project.break_even.toLocaleString("vi-VN").replace(/\s/g, "") + " đ" 
                        : "Chưa công bố"}
                    </span>
                  </div>
                </div>

                {/* Investment Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400">Tiến độ huy động vốn</span>
                    <span className={percentage >= 100 ? "text-emerald-400" : "text-primary"}>{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        percentage >= 100 ? "bg-emerald-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* ROI */}
                {investment.project.roi_estimate && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h3 className="text-sm font-medium mb-3">Dự kiến ROI</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {(JSON.parse(investment.project.roi_estimate as string) || []).map((roi: any, i: number) => (
                        <div key={i} className="text-center p-3 bg-gray-900/50 rounded-lg">
                          <div className="text-2xl font-bold text-primary">{roi.rate}%</div>
                          <div className="text-xs text-gray-500">Năm {roi.year}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Project Timeline */}
            {latestProgress && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-bold mb-4">Tiến độ dự án</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cập nhật lần cuối</span>
                    <span className="font-medium">
                      {new Date(latestProgress.progress_date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tiến độ hiện tại</span>
                    <span className="font-medium">{latestProgress.progress_percent}%</span>
                  </div>
                </div>
                {latestProgress.description && (
                  <p className="text-sm text-gray-300 mt-3">{latestProgress.description}</p>
                )}
                {latestProgress.milestones_completed && latestProgress.milestones_completed.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <span className="text-sm text-gray-400 block mb-2">Hoàn thành:</span>
                    <div className="flex flex-wrap gap-2">
                      {latestProgress.milestones_completed.map((milestone: string, idx: number) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full">
                          {milestone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: ROI Chart & Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Your Investment */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold mb-4">Khoản đầu tư của bạn</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Số tiền</span>
                  <span className="text-xl font-bold text-primary">
                    {investment.amount.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                {investment.project?.investment_target && investment.project.investment_target > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">% trong dự án</span>
                    <span className="text-xl font-bold">
                      {Math.round((investment.amount / investment.project.investment_target) * 100)}%
                    </span>
                  </div>
                )}
                {investment.project?.roi_estimate && (
                  <>
                    <div className="pt-4 border-t border-gray-700">
                      <span className="text-gray-400 block mb-2">Lợi nhuận dự kiến</span>
                      <div className="space-y-1">
                        {(JSON.parse(investment.project.roi_estimate as string) || []).map((roi: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-400">Năm {roi.year}</span>
                            <span className="font-medium text-emerald-400">{(investment.amount * roi.rate / 100).toLocaleString("vi-VN").replace(/\s/g, "") + " đ"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <h3 className="font-semibold mb-2 text-blue-400">Cần hỗ trợ?</h3>
              <p className="text-sm text-gray-300 mb-3">
                Nếu có bất kỳ câu hỏi nào về khoản đầu tư này, vui lòng liên hệ chúng tôi.
              </p>
              <a href="mailto:support@nooi.net" className="text-sm text-blue-400 hover:underline">
                support@nooi.net
              </a>
            </div>

            {/* Help */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="font-semibold mb-3">Thông tin hữu ích</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Theo dõi tiến độ dự án tại trang <Link href="/app/projects" className="text-primary hover:underline">dự án</Link></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Thông tin thanh toán được mã hóa bảo mật</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Không mất phí khi đăng ký đầu tư</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}