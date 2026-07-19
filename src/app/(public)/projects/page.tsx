"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Bản nháp",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  archived: "Đã lưu trữ",
};

export default async function PublicProjectsListPage() {
  const supabase = createAdminClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(50);

  // Get investment aggregates for visible projects
  const projectIds = (projects ?? []).map((p) => p.id);
  const investmentMap = new Map<string, { total: number; count: number }>();

  if (projectIds.length > 0) {
    const { data: investments } = await supabase
      .from("investments")
      .select("project_id, amount")
      .in("project_id", projectIds)
      .eq("payment_status", "paid");

    (investments ?? []).forEach((i) => {
      const existing = investmentMap.get(i.project_id) || { total: 0, count: 0 };
      existing.total += i.amount;
      existing.count += 1;
      investmentMap.set(i.project_id, existing);
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl opacity-20" />
        <div className="max-w-6xl mx-auto px-4 py-20 relative">
          <h1 className="text-5xl font-bold mb-6">Dự án đầu tư</h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Khám phá các dự án đầu tư trong hệ sinh thái NOOI — nơi bạn có thể tham gia đầu tư, 
            theo dõi tiến độ và đón nhận cơ hội sinh lời.
          </p>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(projects ?? []).length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 text-center p-12">
              <p className="text-gray-400">Chưa có dự án nào đang mở đầu tư.</p>
            </div>
          ) : (
            (projects ?? []).map((p) => {
              const inv = investmentMap.get(p.id);
              const raised = inv?.total || 0;
              const investors = inv?.count || 0;
              const progress = p.investment_target && p.investment_target > 0 
                ? Math.round((raised / p.investment_target) * 100) 
                : 0;

              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug || p.id}`}
                  className="group bg-gray-800/50 rounded-xl border border-gray-700 hover:border-primary/50 overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                  {/* Header */}
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <TrendingUp size={20} className="text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                          {p.title}
                        </h3>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${
                          p.status === "in_progress" 
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-muted text-muted-foreground border-muted-foreground/20"
                        }`}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </div>
                    </div>

                    {p.description && (
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {p.description}
                      </p>
                    )}

                    {/* Financials */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Huy động</span>
                        <span className="font-medium">
                          {raised.toLocaleString("vi-VN")} đ
                          {p.investment_target && (
                            <span className="text-gray-400"> / {p.investment_target.toLocaleString("vi-VN")} đ</span>
                          )}
                        </span>
                      </div>
                      {investors > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Nhà đầu tư</span>
                          <span className="font-medium">{investors}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Tiến độ</span>
                        <span className={`font-medium ${progress >= 100 ? "text-emerald-400" : "text-primary"}`}>
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            progress >= 100 ? "bg-emerald-500" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
