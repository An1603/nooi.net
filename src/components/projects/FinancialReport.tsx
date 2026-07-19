"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Calculator, ChevronDown, ChevronUp } from "lucide-react";

interface CapexItem { item: string; amount: number; depreciation_years: number; note: string; }
interface OpexItem { item: string; monthly: number; }
interface RevenuePhase { phase: string; description: string; monthly_revenue: number; occupancy: number; }
interface CashflowItem { month: number; revenue: number; expense: number; note: string; }
interface FinancialSummary {
  total_capex: number;
  annual_depreciation: number;
  monthly_opex_avg: number;
  year1_revenue: number;
  year1_profit: number;
  year2_revenue: number;
  year2_profit: number;
  year3_revenue: number;
  year3_profit: number;
  breakeven_months: number;
  irr_5year: number;
  roi_3year: number;
}

function parseJson(val: unknown) {
  if (!val) return [];
  if (typeof val === "string") try { return JSON.parse(val); } catch { return []; }
  return val;
}

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

export default function FinancialReport({ project }: { project: Record<string, unknown> }) {
  const [openSection, setOpenSection] = useState<string | null>("summary");

  const capex: CapexItem[] = parseJson(project.financial_capex);
  const opex: OpexItem[] = parseJson(project.financial_opex);
  const revenuePhases: RevenuePhase[] = parseJson(project.revenue_phases);
  const cashflow: CashflowItem[] = parseJson(project.cashflow);
  const summary: FinancialSummary = parseJson(project.financial_summary);

  const totalCapex = capex.reduce((s, c) => s + c.amount, 0);
  const monthlyOpex = opex.reduce((s, o) => s + o.monthly, 0);

  function toggle(section: string) {
    setOpenSection(openSection === section ? null : section);
  }

  function Section({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
    const isOpen = openSection === id;
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggle(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            {icon} {title}
          </span>
          {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>
        {isOpen && <div className="px-4 pb-4 border-t border-border">{children}</div>}
      </div>
    );
  }

  if (capex.length === 0 && opex.length === 0 && revenuePhases.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Calculator size={18} className="text-n-gold" />
        Báo cáo tài chính
      </h2>

      {/* Summary */}
      {summary.total_capex && (
        <Section id="summary" title="Tóm tắt" icon={<DollarSign size={14} className="text-n-gold" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
            {[
              { label: "Tổng vốn đầu tư", value: fmt(summary.total_capex) + "đ", color: "text-n-gold" },
              { label: "Hòa vốn", value: summary.breakeven_months + " tháng", color: "text-n-teal" },
              { label: "ROI 3 năm", value: summary.roi_3year + "%", color: "text-n-green" },
              { label: "IRR 5 năm", value: summary.irr_5year + "%", color: "text-n-purple" },
            ].map((item, i) => (
              <div key={i} className="text-center p-3 bg-muted rounded-lg">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className={`text-lg font-bold ${item.color} mt-0.5`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Revenue vs Profit 3 years */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              { year: "Năm 1", rev: summary.year1_revenue, profit: summary.year1_profit },
              { year: "Năm 2", rev: summary.year2_revenue, profit: summary.year2_profit },
              { year: "Năm 3", rev: summary.year3_revenue, profit: summary.year3_profit },
            ].map((y, i) => (
              <div key={i} className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium text-foreground mb-2">{y.year}</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><TrendingUp size={10} className="text-n-green" /> Doanh thu</span>
                    <span className="text-[11px] font-semibold text-foreground">{fmt(y.rev)}đ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {y.profit >= 0 ? <TrendingUp size={10} className="text-n-green" /> : <TrendingDown size={10} className="text-destructive" />}
                      Lợi nhuận
                    </span>
                    <span className={`text-[11px] font-semibold ${y.profit >= 0 ? "text-n-green" : "text-destructive"}`}>
                      {fmt(y.profit)}đ
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* CAPEX */}
      {capex.length > 0 && (
        <Section id="capex" title="Chi phí đầu tư (CAPEX)" icon={<DollarSign size={14} className="text-n-gold" />}>
          <div className="pt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-medium">Hạng mục</th>
                  <th className="text-right pb-2 font-medium">Số tiền</th>
                  <th className="text-right pb-2 font-medium">Khấu hao</th>
                  <th className="text-left pb-2 font-medium hidden sm:table-cell">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {capex.map((c, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 text-foreground">{c.item}</td>
                    <td className="py-2 text-right font-medium text-foreground">{fmt(c.amount)}đ</td>
                    <td className="py-2 text-right text-muted-foreground">{c.depreciation_years > 0 ? `${c.depreciation_years} năm` : "—"}</td>
                    <td className="py-2 text-muted-foreground text-xs hidden sm:table-cell">{c.note}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2 text-foreground">Tổng cộng</td>
                  <td className="py-2 text-right text-n-gold">{fmt(totalCapex)}đ</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* OPEX */}
      {opex.length > 0 && (
        <Section id="opex" title="Chi phí vận hành hàng tháng (OPEX)" icon={<TrendingDown size={14} className="text-n-orange" />}>
          <div className="pt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-medium">Hạng mục</th>
                  <th className="text-right pb-2 font-medium">Chi phí/tháng</th>
                </tr>
              </thead>
              <tbody>
                {opex.map((o, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 text-foreground">{o.item}</td>
                    <td className="py-2 text-right font-medium text-foreground">{fmt(o.monthly)}đ</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2 text-foreground">Tổng chi phí/tháng</td>
                  <td className="py-2 text-right text-n-orange">{fmt(monthlyOpex)}đ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Revenue Phases */}
      {revenuePhases.length > 0 && (
        <Section id="revenue" title="Dự tính doanh thu theo giai đoạn" icon={<TrendingUp size={14} className="text-n-green" />}>
          <div className="pt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-medium">Giai đoạn</th>
                  <th className="text-right pb-2 font-medium">Doanh thu/tháng</th>
                  <th className="text-right pb-2 font-medium">Tỷ lệ lấp đầy</th>
                  <th className="text-left pb-2 font-medium hidden sm:table-cell">Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {revenuePhases.map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 text-foreground font-medium">{r.phase}</td>
                    <td className="py-2 text-right text-n-green font-medium">{fmt(r.monthly_revenue)}đ</td>
                    <td className="py-2 text-right text-muted-foreground">{r.occupancy}%</td>
                    <td className="py-2 text-muted-foreground text-xs hidden sm:table-cell">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Cashflow */}
      {cashflow.length > 0 && (
        <Section id="cashflow" title="Dòng tiền 12 tháng" icon={<Calculator size={14} className="text-n-teal" />}>
          <div className="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="text-left pb-2 font-medium">Tháng</th>
                    <th className="text-right pb-2 font-medium">Thu</th>
                    <th className="text-right pb-2 font-medium">Chi</th>
                    <th className="text-right pb-2 font-medium">Ròng</th>
                    <th className="text-left pb-2 font-medium hidden sm:table-cell">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {cashflow.map((c, i) => {
                    const net = c.revenue - c.expense;
                    return (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1.5 text-foreground">Tháng {c.month}</td>
                        <td className="py-1.5 text-right text-n-green">{c.revenue > 0 ? fmt(c.revenue) + "đ" : "—"}</td>
                        <td className="py-1.5 text-right text-destructive">{fmt(c.expense)}đ</td>
                        <td className={`py-1.5 text-right font-medium ${net >= 0 ? "text-n-green" : "text-destructive"}`}>
                          {net >= 0 ? "+" : ""}{fmt(net)}đ
                        </td>
                        <td className="py-1.5 text-muted-foreground text-xs hidden sm:table-cell">{c.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cumulative bar */}
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Dòng tiền tích lũy</p>
              <div className="flex items-end gap-1 h-16">
                {(() => {
                  let cumulative = 0;
                  return cashflow.map((c, i) => {
                    cumulative += c.revenue - c.expense;
                    const maxAbs = Math.max(...cashflow.map(x => Math.abs(x.revenue - x.expense)), 1);
                    const h = Math.abs(cumulative) / maxAbs * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className={`w-full rounded-sm transition-all ${cumulative >= 0 ? "bg-n-green/60" : "bg-destructive/60"}`}
                          style={{ height: `${Math.min(h, 100)}%`, minHeight: "2px" }}
                        />
                        <span className="text-[8px] text-muted-foreground">{c.month}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
