"use client";

import { useState } from "react";
import { Sparkles, Brain, Heart, Footprints, Utensils, Sun } from "lucide-react";

const practices = [
  {
    id: "thien",
    icon: Brain,
    title: "Thiền tĩnh lặng",
    time: "5-10 phút",
    color: "border-amber-500/30 bg-amber-500/5",
    steps: [
      "Ngồi thẳng lưng, nhắm mắt.",
      "Tập trung vào hơi thở tự nhiên tại mũi.",
      "Khi tâm trí đi xa, nhẹ nhàng đưa về hơi thở.",
      "Không cố dừng suy nghĩ — chỉ quan sát như mây bay.",
    ],
  },
  {
    id: "quan-chieu",
    icon: Heart,
    title: "Quán chiếu cảm xúc",
    time: "3-5 phút",
    color: "border-red-500/30 bg-red-500/5",
    steps: [
      "Khi cảm xúc mạnh xuất hiện, dừng lại.",
      "Hỏi: 'Cảm xúc này đang ở đâu trên cơ thể?'",
      "Hỏi: 'Mình đang cần điều gì?'",
      "Thở sâu, chấp nhận sự tồn tại của nó.",
    ],
  },
  {
    id: "biet-on",
    icon: Sun,
    title: "Thực hành Biết ơn",
    time: "3 phút",
    color: "border-yellow-500/30 bg-yellow-500/5",
    steps: [
      "Sáng sớm hoặc trước khi ngủ.",
      "Liệt kê 3 điều cụ thể bạn biết ơn.",
      "Không chung chung — viết cụ thể.",
      "Cảm nhận sự ấm áp lan tỏa trong lồng ngực.",
    ],
  },
  {
    id: "di-bo",
    icon: Footprints,
    title: "Đi bộ chánh niệm",
    time: "10-15 phút",
    color: "border-green-500/30 bg-green-500/5",
    steps: [
      "Đi chậm, không điện thoại, không tai nghe.",
      "Cảm nhận bàn chân chạm đất.",
      "Hít vào — bước trái; Thở ra — bước phải.",
      "Tận hưởng từng bước chân, không vội đến đích.",
    ],
  },
  {
    id: "an",
    icon: Utensils,
    title: "Ăn chánh niệm",
    time: "Suốt bữa ăn",
    color: "border-orange-500/30 bg-orange-500/5",
    steps: [
      "Tắt thiết bị điện tử.",
      "Nhìn món ăn, cảm nhận màu sắc và mùi hương.",
      "Nhai chậm, cảm nhận hương vị từng miếng.",
      "Biết ơn hành trình của thức ăn đến bàn ăn.",
    ],
  },
  {
    id: "nhat-ky",
    icon: Sparkles,
    title: "Nhật ký Thân-Tâm-Hành",
    time: "5 phút",
    color: "border-purple-500/30 bg-purple-500/5",
    steps: [
      "Cuối ngày, dành 5 phút viết lại.",
      "Thân: Cơ thể hôm nay thế nào?",
      "Tâm: Cảm xúc chủ đạo là gì?",
      "Hành: Điều gì tốt? Cần rút kinh nghiệm?",
    ],
  },
];

export default function PracticesPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">⚡ Thực hành chuyển hóa</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Những bài tập 60 giây đến 15 phút — chọn một bài phù hợp với bạn hôm nay.
        </p>
      </div>

      {/* Self-Assessment CTA */}
      <a
        href="/app/thuc-hanh/tu-danh-gia"
        className="block rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-rose-500/5 p-5 hover:border-amber-500/40 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center text-2xl shrink-0">
            🪞
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
              Tấm Gương Tự Biết Mình
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              7 trục đánh giá · 35 câu hỏi · 5 phút — khám phá bức tranh bản thân
            </p>
          </div>
          <span className="text-muted-foreground group-hover:text-primary transition-colors">→</span>
        </div>
      </a>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {practices.map((p) => {
          const Icon = p.icon;
          const isActive = activeId === p.id;

          return (
            <div
              key={p.id}
              className={`rounded-xl border p-5 cursor-pointer transition-all ${
                isActive ? `${p.color} ring-2 ring-primary/20` : `border-border bg-card hover:${p.color}`
              }`}
              onClick={() => setActiveId(activeId === p.id ? null : p.id)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/30 shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{p.title}</h3>
                  <p className="text-[11px] text-muted-foreground">⏱ {p.time}</p>
                </div>
                <span className="text-muted-foreground text-sm">{isActive ? "▲" : "▼"}</span>
              </div>

              {isActive && (
                <div className="space-y-2 pt-2 border-t border-border/50 animate-in slide-in-from-top-1 duration-150">
                  {p.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 text-sm text-foreground/90">
                      <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
