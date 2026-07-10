"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { RadarChart } from "../tu-danh-gia/RadarChart";
import { SCENARIOS, AXES, computeScores } from "./scenarios-data";

const STORAGE_KEY = "nooi_scenarios_v1";
const TOTAL = SCENARIOS.length; // 21

export default function ScenariosPage() {
  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastChoice, setLastChoice] = useState<{ optionIdx: number; feedback: string } | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const progress = Object.keys(answers).length;

  // ─── Fisher-Yates shuffle toàn bộ 21 scenario ───
  function generateShuffledOrder(): number[] {
    const order = Array.from({ length: TOTAL }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  // ─── Khôi phục tiến trình ───
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }

      // Check Supabase
      const { data: db } = await supabase.from("self_assessments")
        .select("scores, raw_answers, current_question")
        .eq("user_id", user.id).eq("assessment_type", "scenarios_21").maybeSingle();

      if (db) {
        if (db.scores && Object.keys(db.scores).length > 0) {
          setScores(db.scores); setAnswers(db.raw_answers || {}); setStep("result"); setSaved(true);
        } else if (db.raw_answers && Object.keys(db.raw_answers).length > 0) {
          setAnswers(db.raw_answers); setCurrentQ(db.current_question || 0); setShuffledOrder(generateShuffledOrder()); setStep("quiz");
        }
        setProgressCount(db.raw_answers ? Object.keys(db.raw_answers).length : 0);
        setHasProgress(true);
        try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: db.raw_answers || {}, currentQ: db.current_question || 0, shuffledOrder: stored.shuffledOrder || generateShuffledOrder(), scores: db.scores || null })); } catch {}
        setLoaded(true); return;
      }

      // Fallback localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.scores && Object.keys(data.scores).length > 0) {
            setScores(data.scores); setAnswers(data.answers || {}); setStep("result"); setSaved(true);
          } else if (data.answers && Object.keys(data.answers).length > 0) {
            setAnswers(data.answers); setCurrentQ(data.currentQ || 0); setShuffledOrder(data.shuffledOrder || generateShuffledOrder()); setStep("quiz");
          }
          setProgressCount(data.answers ? Object.keys(data.answers).length : 0);
          setHasProgress(true);
        }
      } catch {}
      setLoaded(true);
    })();
  }, [supabase]);

  // ─── Sync ───
  const persist = useCallback((a: Record<number, number>, q: number, order: number[], s?: Record<string, number>) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: a, currentQ: q, shuffledOrder: order, scores: s || null })); } catch {}
  }, []);

  const syncToServer = useCallback(async (a: Record<number, number>, q: number, _order: number[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("self_assessments").upsert({
      user_id: user.id, assessment_type: "scenarios_21",
      raw_answers: a, current_question: q,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,assessment_type" });
  }, [supabase]);

  function selectOption(optionIdx: number) {
    const realIdx = shuffledOrder[currentQ];
    const scenario = SCENARIOS[realIdx];
    const choice = scenario.options[optionIdx];
    const next = { ...answers, [scenario.id]: choice.score };
    setAnswers(next); persist(next, currentQ + 1, shuffledOrder); syncToServer(next, currentQ + 1, shuffledOrder);
    setLastChoice({ optionIdx, feedback: choice.feedback });
    setShowFeedback(true);
  }

  function nextQuestion() {
    setShowFeedback(false);
    setLastChoice(null);
    if (currentQ < TOTAL - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      finish();
    }
  }

  function finish() {
    const result = computeScores(answers);
    const simpleScores: Record<string, number> = {};
    for (const [key, val] of Object.entries(result)) {
      simpleScores[key] = val.score;
    }
    setScores(simpleScores);
    persist(answers, currentQ, shuffledOrder, simpleScores);
    saveResults(simpleScores);
    setStep("result");
  }

  async function saveResults(s: Record<string, number>) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from("self_assessments").upsert({
      user_id: user.id, assessment_type: "scenarios_21",
      scores: s, raw_answers: answers, current_question: currentQ,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,assessment_type" });
    setSaving(false); setSaved(true);
  }

  async function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("self_assessments").delete().eq("user_id", user.id).eq("assessment_type", "scenarios_21");
    setStep("intro"); setAnswers({}); setCurrentQ(0); setScores({}); setSaved(false); setHasProgress(false); setProgressCount(0); setShuffledOrder([]);
  }

  // ─── INTRO ───
  if (step === "intro") {
    if (!loaded) return <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center"><span className="text-3xl">🎬</span></div>
          <h1 className="text-2xl font-bold">Tình Huống Thực Tế</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Bạn sẽ đối diện với 21 tình huống đời thực. Không có đúng sai — chỉ có cách <strong>bạn thực sự phản ứng</strong>.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-sm">📋 7 trục đánh giá</h3>
          <div className="grid grid-cols-1 gap-2">
            {AXES.map(a => <div key={a.key} className="flex items-center gap-3 text-sm"><span className="text-base">{a.icon}</span><span className="font-medium w-20">{a.label}</span><span className="text-muted-foreground text-xs">— {a.desc}</span></div>)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-2 text-sm text-muted-foreground">
          <p>⏱ <strong>10-15 phút</strong> — 21 tình huống</p>
          <p>🎭 <strong>Tình huống thực tế</strong> — câu chuyện đời thường, 4 lựa chọn</p>
          <p>🔒 <strong>Riêng tư tuyệt đối</strong> — chỉ bạn thấy kết quả</p>
          {hasProgress && <p className="text-cyan-400 text-xs mt-2">💡 Bạn có tiến trình đang làm dở</p>}
        </div>
        <div className="space-y-3">
          {hasProgress && <button onClick={() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const d = JSON.parse(raw); if (d.scores && Object.keys(d.scores).length > 0) { setScores(d.scores); setAnswers(d.answers || {}); setStep("result"); setSaved(true); } else if (d.answers) { setAnswers(d.answers); setCurrentQ(d.currentQ || 0); setShuffledOrder(d.shuffledOrder || generateShuffledOrder()); setStep("quiz"); } } } catch {} }} className="w-full py-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-medium hover:bg-cyan-500/20 transition-all">▶ Tiếp tục ({progressCount}/{TOTAL} tình huống)</button>}
          <button onClick={() => { setShuffledOrder(generateShuffledOrder()); setStep("quiz"); }} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all">{hasProgress ? "Bắt đầu lại từ đầu" : "Bắt đầu"}</button>
        </div>
      </div>
    );
  }

  // ─── QUIZ ───
  if (step === "quiz") {
    const realIdx = shuffledOrder[currentQ];
    const scenario = SCENARIOS[realIdx];
    const axis = AXES.find(a => a.key === scenario.axis)!;
    const axisIdx = AXES.indexOf(axis) + 1;

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{axis.icon} Trục {axisIdx}/7 — {axis.label}</span>
            <span>{progress}/{TOTAL} tình huống</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300" style={{width:`${(progress/TOTAL)*100}%`}}/>
          </div>
        </div>

        {/* Axis badge */}
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium">
            {axis.icon} {axis.label} — {axis.desc}
          </span>
        </div>

        {/* Story card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground/60 italic">{scenario.context}</p>
            <p className="text-base leading-relaxed">{scenario.story}</p>
          </div>

          {/* Feedback (after choice) */}
          {showFeedback && lastChoice && (
            <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3 space-y-1 animate-fade-in">
              <p className="text-xs text-cyan-400 font-medium">💡 Phản hồi</p>
              <p className="text-sm text-muted-foreground">{lastChoice.feedback}</p>
              <button onClick={nextQuestion} className="mt-2 w-full py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-all">
                {currentQ < TOTAL - 1 ? "Tiếp tục →" : "Xem kết quả →"}
              </button>
            </div>
          )}

          {/* Options */}
          {!showFeedback && (
            <div className="space-y-2">
              {scenario.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectOption(i)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-cyan-500/30 text-muted-foreground hover:text-foreground transition-all hover:bg-cyan-500/5 group"
                >
                  <span className="text-sm">{opt.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Back button */}
        {!showFeedback && currentQ > 0 && (
          <button onClick={() => setCurrentQ(currentQ - 1)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted/30 transition-colors">← Quay lại</button>
        )}
      </div>
    );
  }

  // ─── RESULT ───
  const resultDetails = computeScores(answers);
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">🎬 Kết Quả Tình Huống</h1>
        <p className="text-muted-foreground text-sm">{saving ? "Đang lưu..." : saved ? "✅ Đã lưu" : "Phản ứng thực của bạn trước cuộc đời"}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 flex justify-center">
        <RadarChart scores={scores} labels={AXES.map(a => a.label)} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm">📊 Chi tiết từng trục</h3>
        {AXES.map(a => {
          const sc = scores[a.key] || 5;
          const detail = resultDetails[a.key];
          return (
            <div key={a.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{a.icon} {a.label}</span>
                <span className="text-muted-foreground">{sc}/10 {detail && `(${detail.avg.toFixed(1)}/4)`}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500" style={{width:`${sc*10}%`}}/>
              </div>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm">💡 Bạn đã hoàn thành 2/3 lớp đánh giá</h3>
        <p className="text-sm text-muted-foreground">Để có NHÂN ẢNH hoàn chỉnh, hãy hoàn thành nốt <strong>Tấm Gương Tự Biết Mình</strong> (35 câu tự đánh giá). Sau đó truy cập <strong>NHÂN ẢNH</strong> để xem bức tranh tổng hợp 3 lớp.</p>
      </div>

      <button onClick={resetAll} className="w-full py-3 rounded-xl border border-border text-sm hover:bg-muted/30 transition-colors">🔄 Làm lại</button>
    </div>
  );
}
