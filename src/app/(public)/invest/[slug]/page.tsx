"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createInvestment } from "../actions";
import Link from "next/link";
import { ArrowLeft, DollarSign, Calendar, Shield, BanknoteIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function InvestRegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const slug = use(params).slug;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);

  // Form state
  const [investorName, setInvestorName] = useState("");
  const [investorEmail, setInvestorEmail] = useState("");
  const [investorPhone, setInvestorPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);

      // Try UUID first, then slug
      const slugOrId = slug;
      let { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slugOrId)
        .single();

      if (!projectData) {
        ({ data: projectData } = await supabase
          .from("projects")
          .select("*")
          .eq("id", slugOrId)
          .single());
      }

      if (projectData) {
        setProject(projectData);
        if (u) {
          setInvestorName(u.user_metadata?.full_name || "");
          setInvestorEmail(u.email || "");
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("phone")
            .eq("user_id", u.id)
            .single();
          if (userProfile?.phone) setInvestorPhone(userProfile.phone);

          // Check existing investments
          const { data: myInvestments } = await supabase
            .from("investments")
            .select("*")
            .eq("project_id", projectData.id)
            .eq("user_id", u.id);
          
          if (myInvestments && myInvestments.length > 0) {
            setInvestments(myInvestments);
          }
        }
      }

      setLoading(false);
    }
    load();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("projectId", project.id);
    formData.append("investorName", investorName);
    formData.append("investorEmail", investorEmail);
    formData.append("investorPhone", investorPhone);
    formData.append("amount", amount);
    formData.append("notes", notes);
    formData.append("paymentMethod", paymentMethod);

    try {
      const result = await createInvestment(formData);
      
      if (result.error) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      toast.success("Đăng ký đầu tư thành công!");

      if (result.redirectUrl) {
        setTimeout(() => router.push(result.redirectUrl), 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">📭</div>
        <h1 className="text-2xl font-bold mb-4">Dự án không tìm thấy</h1>
        <Link href="/projects" className="px-6 py-3 bg-primary rounded-lg">
          Xem dự án khác
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle2 size={64} className="mx-auto text-emerald-400 mb-6" />
          <h1 className="text-3xl font-bold mb-4">Đăng ký thành công!</h1>
          <p className="text-gray-300 mb-2">
            Cảm ơn bạn đã đăng ký đầu tư vào dự án <strong>{project.title}</strong>.
          </p>
          <p className="text-gray-400 mb-8 text-sm">
            Chúng tôi sẽ liên hệ với bạn qua email <strong>{investorEmail}</strong> hoặc số điện thoại <strong>{investorPhone}</strong> để xác nhận thông tin.
          </p>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8 text-left">
            <h3 className="font-semibold mb-3">Thông tin đầu tư</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Dự án</span>
                <span>{project.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Số tiền</span>
                <span className="font-semibold text-primary">
                  {parseInt(amount).toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phương thức</span>
                <span>
                  {paymentMethod === "bank_transfer" ? "Chuyển khoản ngân hàng" : 
                   paymentMethod === "credit_card" ? "Thẻ tín dụng" :
                   paymentMethod === "crypto" ? "Tiền điện tử" : paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Trạng thái</span>
                <span className="text-amber-400">Chờ xác nhận</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <Link 
              href={`/projects/${slug}`} 
              className="px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Quay lại dự án
            </Link>
            <Link 
              href="/app/investments" 
              className="px-6 py-3 bg-primary rounded-lg hover:bg-primary/80 transition-colors"
            >
              Xem danh sách đầu tư
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user already has an active investment
  const hasActiveInvestment = investments.some(i => i.payment_status === "pending" || i.payment_status === "paid");
  const totalInvested = investments.filter(i => i.payment_status === "paid").reduce((sum, i) => sum + i.amount, 0);

  const { data: investmentSum } = {} as any;
  let totalRaised = 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back */}
        <Link 
          href={`/projects/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Quay lại dự án
        </Link>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Left: Form */}
          <div className="md:col-span-3">
            <h1 className="text-3xl font-bold mb-2">Đăng ký đầu tư</h1>
            <p className="text-gray-400 mb-8">Điền thông tin để đăng ký đầu tư vào dự án</p>

            {hasActiveInvestment ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={24} className="text-amber-400" />
                  <h2 className="text-lg font-semibold">Bạn đã đầu tư</h2>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  Bạn đã có đăng ký đầu tư tại dự án này.
                  {totalInvested > 0 && ` Tổng số tiền: ${totalInvested.toLocaleString("vi-VN")} đ`}
                </p>
                <Link 
                  href="/app/investments"
                  className="text-primary hover:underline text-sm"
                >
                  Xem danh sách đầu tư của tôi →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Họ tên */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Họ và tên *</label>
                  <input
                    type="text"
                    value={investorName}
                    onChange={(e) => setInvestorName(e.target.value)}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={investorEmail}
                    onChange={(e) => setInvestorEmail(e.target.value)}
                    required
                    placeholder="email@example.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Số điện thoại *</label>
                  <input
                    type="tel"
                    value={investorPhone}
                    onChange={(e) => setInvestorPhone(e.target.value)}
                    required
                    placeholder="0912345678"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Số tiền đầu tư (VNĐ) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      min="1000000"
                      step="100000"
                      placeholder="10.000.000"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pl-10 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Tối thiểu: 1.000.000 VNĐ</p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phương thức thanh toán</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["bank_transfer", "credit_card", "crypto"].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          paymentMethod === method
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500"
                        }`}
                      >
                        {method === "bank_transfer" && "🏦 Chuyển khoản"}
                        {method === "credit_card" && "💳 Thẻ"}
                        {method === "crypto" && "₿ Crypto"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Ghi chú (không bắt buộc)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Bất kỳ thông tin bổ sung nào..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-primary hover:bg-primary/90 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <BanknoteIcon size={20} />
                      Đăng ký đầu tư
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right: Summary */}
          <div className="md:col-span-2">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 sticky top-24">
              <h3 className="font-semibold mb-4">{project.title}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Mục tiêu</span>
                  <span className="font-medium">
                    {project.investment_target 
                      ? project.investment_target.toLocaleString("vi-VN").replace(/\s/g, "") + " đ"
                      : "Chưa công bố"}
                  </span>
                </div>
                {project.break_even && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Điểm hòa vốn</span>
                    <span className="font-medium">{project.break_even.toLocaleString("vi-VN").replace(/\s/g, "")} đ</span>
                  </div>
                )}
                {project.roi_estimate && (
                  <div className="pt-3 mt-3 border-t border-gray-700">
                    <p className="text-gray-400 mb-2">Dự kiến ROI</p>
                    <div className="flex gap-4">
                      {(JSON.parse(project.roi_estimate as string) || []).map((roi: any, i: number) => (
                        <div key={i} className="text-center">
                          <div className="text-primary font-bold">{roi.rate}%</div>
                          <div className="text-xs text-gray-500">Năm {roi.year}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-3 mt-3 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Shield size={12} />
                    Thông tin của bạn được bảo mật
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <CheckCircle2 size={12} />
                    Có thể theo dõi tiến độ đầu tư
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}