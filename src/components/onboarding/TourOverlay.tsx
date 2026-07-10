"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, Check } from "lucide-react";

const STEPS = [
  {
    icon: "📓",
    title: "Viết nhật ký mỗi ngày",
    desc: "Ghi lại Thân-Tâm-Hành để nhận phản hồi từ AI Mentor và theo dõi hành trình chuyển hóa.",
  },
  {
    icon: "📚",
    title: "Học theo lộ trình",
    desc: "7 cấp độ từ Người mới đến Master Mentor. Mỗi bài học có video, quiz và thảo luận.",
  },
  {
    icon: "🏆",
    title: "Giữ streak & nhận badge",
    desc: "Vào app mỗi ngày để giữ chuỗi, nhận huy hiệu và lên cấp. Cùng cộng đồng tu học.",
  },
];

export default function TourOverlay() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("nooi-tour-done");
    if (!done) setShow(true);
  }, []);

  function finish() {
    localStorage.setItem("nooi-tour-done", "1");
    setShow(false);
  }

  if (!show) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-primary/20 bg-card shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted/30">
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        {/* Close */}
        <button onClick={finish} className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-muted/50 flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="p-6 text-center space-y-4">
          <div className="text-5xl mb-2 animate-fade-in-up">{s.icon}</div>
          <h2 className="text-lg font-bold">{s.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>

          {/* Dots */}
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === step ? "bg-primary" : "bg-muted/30"}`} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center pt-2">
            {!isLast ? (
              <button onClick={() => setStep((s) => s + 1)}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/80"
              >
                Tiếp theo <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            ) : (
              <button onClick={finish}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/80"
              >
                Bắt đầu <Check className="w-4 h-4 inline ml-1" />
              </button>
            )}
            <button onClick={finish} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2.5">
              Bỏ qua
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
