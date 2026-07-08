"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { RadarChart } from "./RadarChart";

const STORAGE_KEY = "nooi_self_assessment_v1";

/* ============================================================
   35 câu hỏi — 7 trục × 5 câu
   Mỗi câu: text (kết thúc bằng ?), scale (5 label riêng), trap (nội bộ)
   ============================================================ */

interface Question {
  text: string;
  trap?: boolean;       // internal only — không hiển thị cho user
  scale: string[];      // 5 labels phù hợp với câu hỏi
}

interface Axis {
  key: string;
  label: string;
  desc: string;
  questions: Question[];
}

const AXES: Axis[] = [
  {
    key: "thay", label: "THẤY", desc: "Quan sát bản thân",
    questions: [
      { text: "Khi đang giận, bạn có nhận ra mình đang giận trước khi nói điều gì đó không?", trap: false, scale: ["Không bao giờ", "Hiếm khi", "Thỉnh thoảng", "Thường xuyên", "Luôn luôn"] },
      { text: "Tuần này, có bao nhiêu lần bạn nói điều gì đó trong lúc nóng giận rồi mới nhận ra?", trap: true, scale: ["Rất nhiều lần", "Khá nhiều", "Vài lần", "1-2 lần", "Không lần nào"] },
      { text: "Bạn có thể ngồi yên 5 phút và quan sát dòng suy nghĩ mà không bị cuốn theo không?", trap: false, scale: ["Không thể", "Rất khó", "Đôi khi được", "Thường được", "Dễ dàng"] },
      { text: "Khi bị chỉ trích, phản ứng đầu tiên của bạn thường là phòng thủ hay lắng nghe?", trap: false, scale: ["Luôn phòng thủ", "Thường phòng thủ", "Nửa nửa", "Thường lắng nghe", "Luôn lắng nghe"] },
      { text: "Bạn có thường 'bắt' được mình đang làm điều gì đó theo thói quen vô thức không?", trap: false, scale: ["Không bao giờ", "Hiếm khi", "Thỉnh thoảng", "Thường xuyên", "Luôn luôn"] },
    ],
  },
  {
    key: "hieu", label: "HIỂU", desc: "Thấu triệt nhân quả",
    questions: [
      { text: "Khi gặp chuyện không như ý, bạn có tự hỏi 'điều gì trong mình đã góp phần vào chuyện này' không?", trap: false, scale: ["Không bao giờ", "Hiếm khi", "Thỉnh thoảng", "Thường xuyên", "Luôn luôn"] },
      { text: "Gần đây, có lần nào bạn đổ lỗi cho hoàn cảnh hoặc người khác thay vì nhận trách nhiệm không?", trap: true, scale: ["Rất nhiều lần", "Khá nhiều", "Vài lần", "1-2 lần", "Không lần nào"] },
      { text: "Bạn có thấy được mối liên hệ giữa suy nghĩ → cảm xúc → hành động của mình không?", trap: false, scale: ["Không thấy", "Hiếm khi thấy", "Đôi khi", "Thường thấy", "Rất rõ ràng"] },
      { text: "Khi ai đó giải thích điều bạn đã biết, bạn có thường ngắt lời để thể hiện mình cũng biết không?", trap: false, scale: ["Luôn ngắt lời", "Thường ngắt lời", "Thỉnh thoảng", "Hiếm khi", "Không bao giờ"] },
      { text: "Bạn có thể giải thích vì sao mình phản ứng như vậy trong một tình huống cụ thể không?", trap: false, scale: ["Không thể", "Rất khó", "Đôi khi được", "Thường được", "Luôn hiểu rõ"] },
    ],
  },
  {
    key: "buong", label: "BUÔNG", desc: "Xả bỏ chấp trước",
    questions: [
      { text: "Khi một mối quan hệ thân thiết kết thúc, bạn mất bao lâu để thực sự buông bỏ?", trap: false, scale: ["Nhiều tháng/năm", "Vài tháng", "Vài tuần", "Vài ngày", "Gần như ngay"] },
      { text: "Bạn có còn giữ món đồ nào từ 3 năm trước mà không dùng nhưng không nỡ bỏ không?", trap: true, scale: ["Rất nhiều món", "Khá nhiều", "Vài món", "1-2 món", "Không có gì"] },
      { text: "Bạn có thể tha thứ cho người đã làm tổn thương mình mà không cần họ xin lỗi không?", trap: false, scale: ["Không thể", "Rất khó", "Đang cố gắng", "Gần như được", "Hoàn toàn được"] },
      { text: "Khi làm mất một món đồ giá trị, bạn bị ám ảnh bao lâu?", trap: false, scale: ["Cả tuần hoặc hơn", "Vài ngày", "1-2 ngày", "Vài giờ", "Vài phút là quên"] },
      { text: "Bạn có thường nhai đi nhai lại những chuyện cũ trong đầu không?", trap: false, scale: ["Luôn luôn", "Thường xuyên", "Thỉnh thoảng", "Hiếm khi", "Không bao giờ"] },
    ],
  },
  {
    key: "antru", label: "AN TRÚ", desc: "Bình an nội tại",
    questions: [
      { text: "Giữa lúc mọi thứ xung quanh hỗn loạn, bạn có giữ được bình tĩnh bên trong không?", trap: false, scale: ["Không bao giờ", "Hiếm khi", "Thỉnh thoảng", "Thường xuyên", "Luôn luôn"] },
      { text: "Đêm qua bạn ngủ thế nào?", trap: true, scale: ["Thức trắng", "Trằn trọc mãi", "Ngủ chập chờn", "Khá ngon", "Ngủ ngon, sâu giấc"] },
      { text: "Bạn có cần người khác công nhận để cảm thấy mình có giá trị không?", trap: false, scale: ["Rất cần", "Khá cần", "Bình thường", "Ít cần", "Không cần"] },
      { text: "Khi kế hoạch bị thay đổi đột ngột, bạn cảm thấy thế nào?", trap: false, scale: ["Rất khó chịu", "Hơi bực", "Bình thường", "Nhanh thích nghi", "Hoàn toàn bình thản"] },
      { text: "Bạn có thể ngồi một mình 30 phút, không điện thoại, không làm gì, mà vẫn thấy ổn không?", trap: false, scale: ["Không thể", "Rất khó", "Được vài phút", "Gần được", "Hoàn toàn ổn"] },
    ],
  },
  {
    key: "bieton", label: "BIẾT ƠN", desc: "Lòng tri ân",
    questions: [
      { text: "Sáng thức dậy, điều đầu tiên bạn nghĩ đến là những gì mình đang có hay đang thiếu?", trap: false, scale: ["Luôn nghĩ đến thiếu", "Thường nghĩ thiếu", "Nửa nửa", "Thường nghĩ đến có", "Luôn biết ơn"] },
      { text: "Hãy thử: kể nhanh những điều bạn thấy thiếu trong cuộc sống — bạn kể được bao nhiêu?", trap: true, scale: [">5 điều, kể ngay", "3-5 điều", "1-2 điều", "Phải nghĩ rất lâu", "Không nghĩ ra điều gì"] },
      { text: "Bạn có thường so sánh mình với người khác và thấy thua kém không?", trap: false, scale: ["Luôn luôn", "Thường xuyên", "Thỉnh thoảng", "Hiếm khi", "Không bao giờ"] },
      { text: "Bạn có cảm nhận được lòng biết ơn với những điều nhỏ nhặt — một tách trà nóng, một tin nhắn hỏi thăm?", trap: false, scale: ["Không bao giờ", "Hiếm khi", "Thỉnh thoảng", "Thường xuyên", "Luôn luôn"] },
      { text: "Bạn có xu hướng tập trung vào điều chưa đạt được hơn là điều đã đạt được không?", trap: false, scale: ["Luôn luôn", "Thường xuyên", "Thỉnh thoảng", "Hiếm khi", "Không bao giờ"] },
    ],
  },
  {
    key: "phungsu", label: "PHỤNG SỰ", desc: "Cho đi vô điều kiện",
    questions: [
      { text: "Bạn có chủ động giúp đỡ người khác mà không mong được đáp lại hay ghi nhận không?", trap: false, scale: ["Không bao giờ", "Hiếm khi", "Thỉnh thoảng", "Thường xuyên", "Luôn luôn"] },
      { text: "Lần cuối bạn giúp ai đó, bạn có kể cho người khác nghe về việc mình đã làm không?", trap: true, scale: ["Có, kể ngay", "Có, nhưng kín đáo", "Kể với 1-2 người", "Chỉ vô tình nhắc", "Giữ cho riêng mình"] },
      { text: "Bạn có sẵn sàng dành thời gian cuối tuần cho hoạt động tình nguyện không?", trap: false, scale: ["Không bao giờ", "Hiếm khi", "Nếu được rủ", "Thường xuyên", "Luôn sẵn sàng"] },
      { text: "Khi ai đó thành công hơn bạn, cảm xúc đầu tiên của bạn là gì?", trap: false, scale: ["Ghen tị, khó chịu", "Hơi chạnh lòng", "Bình thường", "Vui cho họ", "Hoan hỷ, truyền cảm hứng"] },
      { text: "Khi lắng nghe người khác, bạn có toàn tâm toàn ý không, hay đang nghĩ mình sẽ đáp lại thế nào?", trap: false, scale: ["Luôn nghĩ đáp lại", "Thường nghĩ đáp lại", "Nửa nửa", "Khá tập trung", "Hoàn toàn lắng nghe"] },
    ],
  },
  {
    key: "tinhthuc", label: "TỈNH THỨC", desc: "Chánh niệm thường trực",
    questions: [
      { text: "Bạn có duy trì được chánh niệm trong các hoạt động hàng ngày — ăn, đi, làm việc không?", trap: false, scale: ["Không bao giờ", "Hiếm khi", "Thỉnh thoảng", "Thường xuyên", "Luôn luôn"] },
      { text: "Hôm nay bạn đã 'lướt' điện thoại bao nhiêu lần mà không có mục đích cụ thể?", trap: true, scale: ["Không đếm được", "Rất nhiều", "Khá nhiều", "Vài lần", "Không lần nào"] },
      { text: "Bạn có một thực hành tâm linh hoặc chánh niệm đều đặn hàng ngày không?", trap: false, scale: ["Không có", "Thỉnh thoảng", "Vài lần/tuần", "Hầu như mỗi ngày", "Đều đặn mỗi ngày"] },
      { text: "Bạn có thường cảm thấy mình đang sống trên 'chế độ tự động', như một cái máy không?", trap: false, scale: ["Luôn luôn", "Thường xuyên", "Thỉnh thoảng", "Hiếm khi", "Không bao giờ"] },
      { text: "Khi tâm trí lang thang, bạn có thể nhận ra và nhẹ nhàng đưa nó quay về hiện tại không?", trap: false, scale: ["Không thể", "Rất khó", "Đôi khi được", "Thường được", "Dễ dàng"] },
    ],
  },
];
// Compute scores: sum of 5 questions per axis → average → 1-10 scale
function computeScores(answers: Record<number, number>) {
  const result: Record<string, number> = {};
  AXES.forEach((axis, ai) => {
    let sum = 0;
    for (let q = 0; q < 5; q++) {
      const idx = ai * 5 + q;
      sum += answers[idx] || 3;
    }
    result[axis.key] = Math.round((sum / 5) * 2);
  });
  return result;
}

export default function SelfAssessmentPage() {
  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
  const [hasProgress, setHasProgress] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const supabase = useMemo(() => createClient(), []);
  const totalQ = 35;
  const progress = Object.keys(answers).length;
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Khôi phục: Supabase trước → localStorage fallback ───
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }

      // 1. Check Supabase
      const { data: db } = await supabase.from("self_assessments")
        .select("scores, raw_answers, current_question")
        .eq("user_id", user.id).eq("assessment_type", "self_7axes").maybeSingle();

      if (db) {
        if (db.scores && Object.keys(db.scores).length > 0) {
          setScores(db.scores); setAnswers(db.raw_answers || {}); setStep("result"); setSaved(true);
        } else if (db.raw_answers && Object.keys(db.raw_answers).length > 0) {
          setAnswers(db.raw_answers); setCurrentQ(db.current_question || 0); setStep("quiz");
        }
        setProgressCount(db.raw_answers ? Object.keys(db.raw_answers).length : 0);
        // Sync localStorage
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: db.raw_answers || {}, currentQ: db.current_question || 0, scores: db.scores || null })); } catch {}
        setHasProgress(true);
        setLoaded(true); return;
      }

      // 2. Fallback localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.scores && Object.keys(data.scores).length > 0) {
            setScores(data.scores); setAnswers(data.answers || {}); setStep("result"); setSaved(true);
          } else if (data.answers && Object.keys(data.answers).length > 0) {
            setAnswers(data.answers); setCurrentQ(data.currentQ || 0); setStep("quiz");
          }
          setProgressCount(data.answers ? Object.keys(data.answers).length : 0);
          setHasProgress(true);
        }
      } catch {}
      setLoaded(true);
    })();
  }, [supabase]);

  // ─── Shuffle: trộn thứ tự câu hỏi trong từng trục ───
  function generateShuffledOrder(): number[] {
    const order: number[] = [];
    for (let a = 0; a < 7; a++) {
      // 5 câu trong trục a: indices [a*5 .. a*5+4]
      const indices = [0, 1, 2, 3, 4].map((i) => a * 5 + i);
      // Fisher-Yates shuffle trong nhóm
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      order.push(...indices);
    }
    return order;
  }

  // ─── Lưu localStorage + đồng bộ Supabase ───
  const persist = useCallback((a: Record<number, number>, q: number, s?: Record<string, number>) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: a, currentQ: q, scores: s || null })); } catch {}
  }, []);

  const syncToServer = useCallback(async (a: Record<number, number>, q: number) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("self_assessments").upsert({
        user_id: user.id, assessment_type: "self_7axes",
        raw_answers: a, current_question: q,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,assessment_type" });
    }, 800); // debounce 800ms
  }, [supabase]);

  function answer(qIdx: number, value: number) {
    // qIdx = display position; map to original flat index via shuffledOrder
    const realIdx = shuffledOrder[qIdx];
    const next = { ...answers, [realIdx]: value };
    setAnswers(next); persist(next, qIdx); syncToServer(next, qIdx);
    if (qIdx < totalQ - 1) setTimeout(() => setCurrentQ(qIdx + 1), 200);
  }

  function finish() { const s = computeScores(answers); setScores(s); persist(answers, currentQ, s); setStep("result"); saveResults(s); }

  async function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("self_assessments").delete().eq("user_id", user.id).eq("assessment_type", "self_7axes");
    setStep("intro"); setAnswers({}); setCurrentQ(0); setScores({}); setSaved(false); setShuffledOrder([]);
  }

  async function saveResults(s: Record<string, number>) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from("self_assessments").upsert({
      user_id: user.id, assessment_type: "self_7axes", scores: s, raw_answers: answers, current_question: currentQ, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,assessment_type" });
    setSaving(false); setSaved(true);
  }

  function getQuestion(idx: number) { const ai = Math.floor(idx / 5); return AXES[ai].questions[idx % 5]; }

  if (step === "intro") {
    if (!loaded) return <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center"><span className="text-3xl">🪞</span></div>
          <h1 className="text-2xl font-bold">Tấm Gương Tự Biết Mình</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Đây không phải bài kiểm tra &ldquo;đúng sai&rdquo;. Không ai chấm điểm bạn.<br/>Đây là <strong>tấm gương</strong> — giúp bạn nhìn thấy chính mình rõ hơn.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-sm">📋 7 trục đánh giá</h3>
          <div className="grid grid-cols-1 gap-2">
            {AXES.map(a => <div key={a.key} className="flex items-center gap-3 text-sm"><span className="w-2 h-2 rounded-full bg-primary/60"/><span className="font-medium w-20">{a.label}</span><span className="text-muted-foreground text-xs">— {a.desc}</span></div>)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-2 text-sm text-muted-foreground">
          <p>⏱ <strong>5-7 phút</strong> — 35 câu hỏi</p>
          <p>🔒 <strong>Riêng tư tuyệt đối</strong> — chỉ bạn thấy kết quả</p>
          <p>🔄 Làm lại mỗi 30 ngày để theo dõi tiến trình</p>
          {hasProgress && <p className="text-amber-400 text-xs mt-2">💡 Bạn có tiến trình đang làm dở</p>}
        </div>
        <div className="space-y-3">
          {hasProgress && <button onClick={() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const d = JSON.parse(raw); if (d.scores && Object.keys(d.scores).length > 0) { setScores(d.scores); setAnswers(d.answers || {}); setStep("result"); setSaved(true); } else if (d.answers) { setAnswers(d.answers); setCurrentQ(d.currentQ || 0); setShuffledOrder(generateShuffledOrder()); setStep("quiz"); } } } catch {} }} className="w-full py-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium hover:bg-amber-500/20 transition-all">▶ Tiếp tục ({progressCount}/35 câu)</button>}
          <button onClick={() => { setShuffledOrder(generateShuffledOrder()); setStep("quiz"); }} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all">{hasProgress ? "Bắt đầu lại từ đầu" : "Bắt đầu"}</button>
        </div>
      </div>
    );
  }

  if (step === "quiz") {
    const qi = currentQ;
    const realIdx = shuffledOrder[qi];
    const axisIdx = Math.floor(realIdx / 5);
    const axis = AXES[axisIdx];
    const q = getQuestion(realIdx);
    const cur = answers[realIdx];
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Trục {axisIdx+1}/7 — {axis.label}</span><span>{progress}/{totalQ} câu</span></div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300" style={{width:`${(progress/totalQ)*100}%`}}/></div>
        </div>
        <div className="text-center"><span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{axis.label} — {axis.desc}</span></div>
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <p className="text-lg leading-relaxed">{q.text}</p>
          <div className="space-y-2">
            {q.scale.map((label, i) => { const val = i+1; const sel = cur === val; return <button key={val} onClick={() => answer(qi, val)} className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${sel ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/30 text-muted-foreground"}`}><span className="text-sm">{label}</span></button>; })}
          </div>
        </div>
        <div className="flex gap-3">
          {qi > 0 && <button onClick={() => setCurrentQ(qi-1)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted/30 transition-colors">← Quay lại</button>}
          <div className="flex-1"/>
          {progress === totalQ && <button onClick={finish} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all">Xem kết quả →</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2"><h1 className="text-2xl font-bold">🪞 Bức Tranh Bản Thân</h1><p className="text-muted-foreground text-sm">{saving ? "Đang lưu..." : saved ? "✅ Đã lưu" : ""}</p></div>
      <div className="rounded-xl border border-border bg-card p-4 flex justify-center"><RadarChart scores={scores} labels={AXES.map(a => a.label)}/></div>
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm">📊 Chi tiết từng trục</h3>
        {AXES.map(a => { const sc = scores[a.key] || 5; return <div key={a.key} className="space-y-1"><div className="flex items-center justify-between text-sm"><span className="font-medium">{a.label}</span><span className="text-muted-foreground">{sc}/10</span></div><div className="w-full h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{width:`${sc*10}%`}}/></div><p className="text-xs text-muted-foreground">{a.desc}</p></div>; })}
      </div>
      <button onClick={resetAll} className="w-full py-3 rounded-xl border border-border text-sm hover:bg-muted/30 transition-colors">🔄 Làm lại</button>
    </div>
  );
}
