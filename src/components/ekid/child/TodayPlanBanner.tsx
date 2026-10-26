"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PlanSlot {
  slot: number;
  kind: "on_cu" | "bai_moi" | "kiem_tra" | "bo_tro";
  lessonId: string | null;
  title: string | null;
  estMinutes: number | null;
  done: boolean;
}

interface TodayPlan {
  date: string;
  minutesCap: number;
  slots: PlanSlot[];
}

const KIND_LABEL: Record<PlanSlot["kind"], string> = {
  on_cu: "Ôn lại",
  bai_moi: "Học mới",
  kiem_tra: "Kiểm tra",
  bo_tro: "Củng cố",
};

/**
 * Lịch học hôm nay của bé — 1 nút lớn, không cho chọn môn, không hiện phần trăm.
 * Bấm "Bắt đầu" là vào đúng bài đã xếp, AI mở phiên bằng 3 câu hồi tưởng.
 */
export function TodayPlanBanner({ kidId }: { kidId: string }) {
  const [plan, setPlan] = useState<TodayPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/ekid/plan/today?kid_id=${encodeURIComponent(kidId)}`, { cache: "no-store" });
        const d = (await r.json()) as { plan?: TodayPlan; error?: string };
        if (!alive) return;
        if (!r.ok) throw new Error(d.error ?? "Không tải được lịch hôm nay");
        setPlan(d.plan ?? null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Lỗi tải lịch");
      }
    })();
    return () => {
      alive = false;
    };
  }, [kidId]);

  if (error) {
    return (
      <p className="mb-3 rounded-2xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
        {error}
      </p>
    );
  }
  if (!plan) return null;

  const nextSlot = plan.slots.find((s) => !s.done && s.lessonId);
  const totalMin = plan.slots.reduce((sum, s) => sum + (s.estMinutes ?? 0), 0);

  return (
    <div className="mb-4 rounded-3xl border-2 border-[#7dd3fc]/70 bg-white/85 p-4 shadow-lg shadow-sky-200/50">
      <p className="text-sm font-bold uppercase tracking-wide text-[#0e7490]">Hôm nay của con</p>
      <ul className="mt-2 space-y-1">
        {plan.slots.length === 0 && (
          <li className="text-base font-semibold text-[#3b2a20]">
            Hôm nay chưa có bài nào được xếp. Thầy/cô AI sẽ chuẩn bị bài mới nhé!
          </li>
        )}
        {plan.slots.map((s) => (
          <li key={s.slot} className="flex items-center justify-between gap-2 text-base text-[#3b2a20]">
            <span>
              <span className="mr-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">
                {KIND_LABEL[s.kind]}
              </span>
              {s.title ?? "Củng cố kiến thức cũ"}
            </span>
            <span className="shrink-0 text-sm font-semibold text-[#0e7490]">
              {s.estMinutes ? `${s.estMinutes} phút` : ""}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[#6b5545]">
          Tổng khoảng {totalMin} phút · tối đa {plan.minutesCap} phút/ngày
        </span>
        {nextSlot && (
          <Link
            href={`/ekid/hoc/${nextSlot.lessonId}?plan=1`}
            className="rounded-full bg-[#0ea5e9] px-5 py-2 text-base font-bold text-white shadow-md shadow-sky-300 transition hover:bg-[#0284c7]"
          >
            Bắt đầu
          </Link>
        )}
      </div>
    </div>
  );
}
