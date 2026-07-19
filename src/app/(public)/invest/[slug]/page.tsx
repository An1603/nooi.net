"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, DollarSign, Shield, BanknoteIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function InvestRegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const slug = use(params).slug;

  interface Project {
    id: string;
    title: string;
    description?: string;
    investment_target?: number;
    break_even?: number;
    roi_estimate?: string;
    status: string;
    slug?: string;
  }

  interface Investment {
    id: string;
    user_id: string;
    amount: number;
    payment_status: string;
  }

  const [project] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [investorName, setInvestorName] = useState("");
  const [investorEmail, setInvestorEmail] = useState("");
  const [investorPhone, setInvestorPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

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
        (project as any) = projectData;
        setInvestorName(user.user_metadata?.full_name || "");
        setInvestorEmail(user.email || "");
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("user_id", user.id)
          .single();
        if (userProfile?.phone) setInvestorPhone(userProfile.phone);

        const { data: myInvestments } = await supabase
          .from("investments")
          .select("*")
          .eq("project_id", projectData.id)
          .eq("user_id", user.id);
        
        // @ts-ignore
        setInvestments(myInvestments || []);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        project_id: (project as any).id,
        investor_name: investorName,
        investor_email: investorEmail,
        investor_phone: investorPhone,
        amount: parseInt(amount),
        notes: notes || null,
        payment_method: paymentMethod,
        user_id: user?.id,
      };

      const { data, error } = await supabase
        .from("investments")
        .insert(payload)
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      toast.success("Đăng ký đầu tư thành công!");

      setTimeout(() => {
        router.push(`/invest/${slug}`);
      }, 1500);
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

  if ((project as any) === null) {
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
    const p = project as any;
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle2 size={64} className="mx-auto text-emerald-400 mb-6" />
          <h1 className="text-3xl font-bold mb-4">Đăng ký thành công!</h1>
          <p className="text-gray-300 mb-2">
            Cảm ơn bạn đã đăng ký đầu tư vào dự án <strong>{p.title}</strong>.
          </p>
          <p className="text-gray-400 mb-8 text-sm">
            Chúng tôi sẽ liên hệ với bạn qua email <strong>{investorEmail}</strong> hoặc số điện thoại <strong>{investorPhone}</strong> để xác nhận.
          </p>
          <p className="text-xs text-gray-500">
            {/* Placeholder for redirect */}
            Redirecting...
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link 
              href={`/projects/${slug}`} 
              className="px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Quay lại
            </Link>
            <Link 
              href="/app/investments" 
              className="px-6 py-3 bg-primary rounded-lg hover:bg-primary/80 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const p = project as any;
  const hasActiveInvestment = false; // @ts-ignore
  const totalInvested = 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href={`/projects/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Quay lại dự án
        </Link>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <h1 className="text-3xl font-bold mb-2">Đăng ký đầu tư</h1>
            <p className="text-gray-400 mb-8">Điền thông tin để đăng ký đầu tư vào dự án</p>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <div>
                <label className="block text-sm font-medium mb-1.5">Phương thức thanh toán</label>
                <div className="grid grid-cols-3 gap-2">
                  {["bank_transfer", "credit_card", "crypto"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        paymentMethod === m
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {m === "bank_transfer" ? "🏦 Chuyển khoản" : 
                       m === "credit_card" ? "💳 Thẻ" : "₿ Crypto"}
                    </button>
                  ))}
                </div>
              </div>

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
          </div>

          <div className="md:col-span-2">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 sticky top-24">
              <h3 className="font-semibold mb-4">{p.title}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Mục tiêu</span>
                  <span className="font-medium">
                    {p.investment_target 
                      ? p.investment_target.toLocaleString("vi-VN").replace(/\s/g, "") + " đ"
                      : "Chưa công bố"}
                  </span>
                </div>
                {p.break_even && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Điểm hòa vốn</span>
                    <span className="font-medium">{p.break_even.toLocaleString("vi-VN").replace(/\s/g, "")} đ</span>
                  </div>
                )}
                {p.roi_estimate && (
                  <div className="pt-3 mt-3 border-t border-gray-700">
                    <p className="text-gray-400 mb-2">Dự kiến ROI</p>
                    <div className="flex gap-4">
                      {(JSON.parse(p.roi_estimate) as {year: number; rate: number}[]).map((roi, i) => (
                        <div key={i} className="text-center">
                          <div className="text-primary font-bold">{roi.rate}%</div>
                          <div className="text-xs text-gray-500">Năm {roi.year}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-3 mt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Shield size={12} />
                    Bảo mật thông tin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}