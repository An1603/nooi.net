"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, RefreshCw, Star, Heart, Zap, Shield, Sun, Moon, Cloud, Droplets, Wind } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── 12 Thẻ chuyển hóa từ Blueprint ────────────────────────────────────────

const CARDS = [
  { term: "Tánh biết", def: "Bầu trời trong vắt, nơi mọi hiện tượng đến rồi đi", icon: "☀️" },
  { term: "Vô minh", def: "Không biết mình là ai, quên mất bản chất thật", icon: "🌫️" },
  { term: "Chấp ngã", def: "Bám víu vào cái tôi, danh vọng, sở hữu", icon: "🔗" },
  { term: "Tham", def: "Muốn đạt được những thứ cái tôi thích", icon: "🫂" },
  { term: "Sân", def: "Giận dữ với những thứ làm cái tôi đau", icon: "🔥" },
  { term: "Si", def: "Nhìn cuộc đời qua lăng kính méo mó", icon: "🌫️" },
  { term: "Nghiệp", def: "Hành động tạo ra kết quả, quán tính của thói quen", icon: "🔄" },
  { term: "Quan sát", def: "Tách mình khỏi phản ứng tự động", icon: "👁️" },
  { term: "Buông bỏ", def: "Thả lỏng sự bám víu vào kết quả", icon: "🍃" },
  { term: "Chuyển hóa", def: "Đưa tỉnh thức vào hành động", icon: "🦋" },
  { term: "Chánh niệm", def: "Đưa sự chú ý về hiện tại", icon: "🧘" },
  { term: "Biết ơn", def: "Chuyển góc nhìn từ thiếu thốn sang đủ đầy", icon: "🙏" },
];

const DIFFICULTIES = [
  { level: "Dễ", options: 3, time: 15, nReward: 1 },
  { level: "Trung bình", options: 4, time: 10, nReward: 2 },
  { level: "Khó", options: 5, time: 8, nReward: 3 },
];

export default function GamePage() {
  const [difficulty, setDifficulty] = useState(0);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentCard, setCurrentCard] = useState(CARDS[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const diff = DIFFICULTIES[difficulty];

  function shuffle(arr: string[]) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function nextQuestion() {
    if (question >= 9) { setGameOver(true); return; }
    const card = CARDS[Math.floor(Math.random() * CARDS.length)];
    setCurrentCard(card);
    const wrongDefs = shuffle(CARDS.filter((c) => c.term !== card.term).map((c) => c.def)).slice(0, diff.options - 1);
    setOptions(shuffle([card.def, ...wrongDefs]));
    setSelected(null);
    setResult(null);
    setQuestion((q) => q + 1);
    setTimeLeft(diff.time);
  }

  useEffect(() => {
    if (!started || gameOver) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); handleAnswer(-1); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [question, started, gameOver]);

  function handleAnswer(index: number) {
    if (result) return;
    clearInterval(timerRef.current!);
    const correct = options[index] === currentCard.def;
    setSelected(index);
    setResult(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + diff.nReward);
    setTotal((t) => t + 1);
    setTimeout(nextQuestion, 1500);
  }

  async function saveScore() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("documents").insert({
        user_id: user.id,
        title: `game-${Date.now()}`,
        content: JSON.stringify({ score, total, difficulty: diff.level }),
        file_type: "practice",
      });
    } catch {}
  }

  function startGame() {
    setScore(0); setQuestion(0); setTotal(0); setGameOver(false); setStarted(true);
    setTimeout(nextQuestion, 100);
  }

  if (!started) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Game học — Ghép thẻ chuyển hóa</h1>
        <p className="text-muted-foreground text-sm">Chọn định nghĩa đúng cho mỗi khái niệm. Càng nhanh, càng nhiều N!</p>
        <div className="grid gap-4 max-w-sm mx-auto">
          {DIFFICULTIES.map((d, i) => (
            <button key={i} onClick={() => { setDifficulty(i); startGame(); }}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors text-left"
            >
              <p className="font-semibold">{d.level}</p>
              <p className="text-xs text-muted-foreground">{d.options} lựa chọn · {d.time}s · +{d.nReward} N/câu</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-2xl font-bold">Kết thúc!</h1>
        <div className="text-4xl font-bold text-primary">{score} N</div>
        <p className="text-sm text-muted-foreground">Đúng {score}/{total} câu</p>
        <div className="flex gap-3 justify-center">
          <button onClick={startGame} className="rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/80">
            <RefreshCw className="w-4 h-4 inline mr-1" /> Chơi lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-muted-foreground">Câu {question}/10</span>
          <p className="text-lg font-bold">{currentCard.term} {currentCard.icon}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Điểm</p>
          <p className="text-lg font-bold text-primary">{score} N</p>
        </div>
      </div>

      {/* Timer */}
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft < 5 ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${(timeLeft / diff.time) * 100}%` }} />
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((opt, i) => {
          let className = "w-full text-left p-4 rounded-xl border text-sm transition-all ";
          if (result && i === selected) {
            className += result === "correct" ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400";
          } else if (result && i !== selected && options[i] === currentCard.def) {
            className += "border-green-500/50 bg-green-500/5 text-green-400/70";
          } else {
            className += "border-border bg-card hover:border-primary/30";
          }
          return (
            <button key={i} onClick={() => handleAnswer(i)} disabled={!!result}
              className={className}
            >{opt}</button>
          );
        })}
      </div>
    </div>
  );
}
