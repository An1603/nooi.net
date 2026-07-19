"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, DollarSign, CheckCircle2, Loader2, AlertCircle, TrendingUp, Calendar } from "lucide-react";

export default function InvestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<{ id: string; title: string; description: string; investment_target: number; break_even: number } | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    amount: "",
    investorName: "",
    investorEmail: "",
    investorPhone: "",
    notes: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        setUser(u);
        setForm((f) => ({ ...f, investorEmail: u.email || "" }));
      }

      // Try by id first, then by slug
      let proj = null;
      const { data: byId } = await supabase
        .from("projects")
        .select("*")
        .eq("id", slug)
        .single();
      if (byId) proj = byId;
      else {
        const { data: bySlug } = await supabase
          .from("projects")
          .select("*")
          .eq("slug", slug)
          .single();
        if (bySlug) proj = bySlug;
      }

      if (!proj || proj.status !== "in_progress") {
        setLoading(false);
        return;
      }
      setProject(proj);
      setLoading(false);
    }
    load();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !user) return;

    setSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("investments")
      .insert({
        project_id: project.id,
        user_id: user.id,
        amount: parseInt(form.amount),
        investor_name: form.investorName,
        investor_email: form.investorEmail,
        investor_phone: form.investorPhone,
        notes: form.notes,
        payment_status: "pending",
      });

    if (insertError) {
      setError(insertError.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-foreground mb-3">Dự án không tìm thấy</h1>
          <Link href="/app/projects" className="inline-flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-primary-foreground">
            Xem dự án khác
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <DollarSign size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Đăng nhập để đầu tư</h1>
          <p className="text-muted-foreground mb-6">Bạn cần đăng nhập để đăng ký đầu tư vào dự án này.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary rounded-lg text-primary-foreground font-medium">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-n-green/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-n-green" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Đăng ký thành công!</h1>
          <p className="text-muted-foreground mb-6">Cảm ơn bạn đã đăng ký đầu tư. Chúng tôi sẽ liên hệ để xác nhận thanh toán.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/app/investments" className="inline-flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-primary-foreground font-medium">
              Xem đầu tư của tôi
            </Link>
            <Link href="/app/projects" className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors">
              Quay lại dự án
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/app/projects/${project.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={14} />
          {project.title}
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Đăng ký đầu tư</h1>
          <p className="text-muted-foreground mt-1">Dự án: {project.title}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Thông tin dự án</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign size={14} className="text-n-gold" />
              <span className="text-muted-foreground">Mục tiêu:</span>
              <span className="font-medium text-foreground">{new Intl.NumberFormat("vi-VN").format(project.investment_target)}đ</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp size={14} className="text-n-green" />
              <span className="text-muted-foreground">Hòa vốn:</span>
              <span className="font-medium text-foreground">{new Intl.NumberFormat("vi-VN").format(project.break_even)}đ</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Thông tin đầu tư</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Số tiền đầu tư (VNĐ) *</label>
              <input
                type="number"
                required
                min="1000000"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="Tối thiểu 1.000.000 VNĐ"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Họ và tên *</label>
              <input
                type="text"
                required
                value={form.investorName}
                onChange={(e) => setForm((f) => ({ ...f, investorName: e.target.value }))}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
              <input
                type="email"
                required
                value={form.investorEmail}
                onChange={(e) => setForm((f) => ({ ...f, investorEmail: e.target.value }))}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Số điện thoại</label>
              <input
                type="tel"
                value={form.investorPhone}
                onChange={(e) => setForm((f) => ({ ...f, investorPhone: e.target.value }))}
                placeholder="0912345678"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Ghi chú</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder="Ghi chú thêm (nếu có)"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <DollarSign size={18} />
                  Đăng ký đầu tư
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
