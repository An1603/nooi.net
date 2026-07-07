"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, RefreshCw, Star, Heart, Zap, Shield, Sun, Moon, Cloud, Droplets, Wind } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── 12 Thẻ chuyển hóa từ Blueprint ────────────────────────────────────────

const CARDS = [
  // ── Level 1: Người mới — Nhận thức cơ bản ──
  { term: "Tánh biết", def: "Bầu trời trong vắt, nơi mọi hiện tượng đến rồi đi", icon: "☀️" },
  { term: "Vô minh", def: "Không biết mình là ai, quên mất bản chất thật", icon: "🌫️" },
  { term: "Chấp ngã", def: "Bám víu vào cái tôi, danh vọng, sở hữu", icon: "🔗" },
  { term: "Tham", def: "Muốn đạt được những thứ cái tôi thấy thích", icon: "🫂" },
  { term: "Sân", def: "Giận dữ với những thứ làm cái tôi đau", icon: "🔥" },
  { term: "Si", def: "Nhìn cuộc đời qua lăng kính méo mó", icon: "🌫️" },
  { term: "Nghiệp", def: "Hành động tạo ra kết quả, quán tính của thói quen", icon: "🔄" },
  { term: "Luân hồi", def: "Vòng xoáy vô minh - chấp ngã - tham sân si", icon: "🌀" },
  { term: "Quan sát", def: "Tách mình khỏi phản ứng tự động của thói quen", icon: "👁️" },
  { term: "Nhận diện", def: "Gọi đúng tên cảm xúc đang hiện diện", icon: "🔍" },
  { term: "Buông bỏ", def: "Thả lỏng sự bám víu vào kết quả mong đợi", icon: "🍃" },
  { term: "Chuyển hóa", def: "Đưa tỉnh thức vào từng hành động hàng ngày", icon: "🦋" },
  { term: "Chánh niệm", def: "Đưa sự chú ý về hiện tại, không phán xét", icon: "🧘" },
  { term: "Tỉnh thức", def: "Biết mình đang làm gì, đang ở đâu, đang là ai", icon: "💡" },
  { term: "Vô thường", def: "Mọi thứ liên tục thay đổi, không có gì cố định", icon: "🌊" },
  { term: "Khổ", def: "Cảm giác bất toại nguyện khi sự việc không như ý", icon: "😔" },

  // ── Level 2: Người tìm kiếm — Hiểu rõ bản thân ──
  { term: "Thân", def: "Cơ thể vật chất, nơi cảm thọ sinh khởi", icon: "🧍" },
  { term: "Tâm", def: "Khu vườn ký ức, nơi lưu giữ mọi trải nghiệm", icon: "🧠" },
  { term: "Hành", def: "Ý chí và hành động xuất phát từ tâm", icon: "🏃" },
  { term: "Cảm thọ", def: "Cảm giác dễ chịu, khó chịu hoặc trung tính", icon: "💭" },
  { term: "Tư duy", def: "Dòng suy nghĩ miên man không dứt", icon: "💬" },
  { term: "Nhận thức", def: "Chiếc kính màu bạn đeo để nhìn đời", icon: "👓" },
  { term: "Ý chí", def: "Sức mạnh đưa nhận thức thành hành động", icon: "⚡" },
  { term: "Thói quen", def: "Hành động lặp đi lặp lại trở thành tự động", icon: "🔁" },
  { term: "Tính cách", def: "Tập hợp thói quen tạo nên con người bạn", icon: "🎭" },
  { term: "Hoàn cảnh", def: "Kết quả của nghiệp, môi trường sống hiện tại", icon: "🌍" },
  { term: "Vô ngã", def: "Không có cái tôi cố định, mọi thứ đều tương quan", icon: "☯️" },
  { term: "Duyên khởi", def: "Mọi sự việc đều do nhiều nhân duyên hòa hợp", icon: "🌐" },
  { term: "Chú tâm", def: "Đặt sự chú ý vào một đối tượng duy nhất", icon: "🎯" },
  { term: "Định", def: "Tâm an trú, không bị xao lãng bởi ngoại cảnh", icon: "⛰️" },
  { term: "Tuệ", def: "Trí tuệ thấy rõ bản chất thật của sự vật", icon: "🪷" },
  { term: "Giới", def: "Nguyên tắc sống giúp tâm không hối hận", icon: "🛡️" },

  // ── Level 3: Học viên — Xây nền tảng ──
  { term: "Hơi thở", def: "Cầu nối giữa thân và tâm, neo giữ hiện tại", icon: "💨" },
  { term: "Thiền", def: "Thực hành đưa tâm về trạng thái an tĩnh", icon: "🧘" },
  { term: "Tọa thiền", def: "Ngồi yên, quán sát thân-tâm không phán xét", icon: "🙏" },
  { term: "Kinh hành", def: "Thiền đi bộ, đưa chánh niệm vào từng bước chân", icon: "🚶" },
  { term: "Quét thân", def: "Quan sát toàn thân từ đầu đến chân", icon: "🔦" },
  { term: "Biết ơn", def: "Chuyển góc nhìn từ thiếu thốn sang đủ đầy", icon: "🙏" },
  { term: "Từ bi", def: "Mong cho mình và người được an vui", icon: "💖" },
  { term: "Hỷ", def: "Vui với thành công và hạnh phúc của người khác", icon: "🎉" },
  { term: "Xả", def: "Tâm bình thản trước lời khen chê, được mất", icon: "⚖️" },
  { term: "Phước", def: "Năng lượng tích cực từ việc làm tốt", icon: "⭐" },
  { term: "Ác", def: "Hành động xuất phát từ tham, sân, si", icon: "💀" },
  { term: "Thiện", def: "Hành động xuất phát từ từ bi và trí tuệ", icon: "😇" },
  { term: "Nhân quả", def: "Mọi hành động đều đưa đến kết quả tương ứng", icon: "🔗" },
  { term: "Trung đạo", def: "Con đường tránh xa hai cực đoan", icon: "☸️" },
  { term: "Buông xả", def: "Không bám víu, không chống đối, để mọi thư tự nhiên", icon: "🍂" },
  { term: "An trú", def: "Sống trọn vẹn trong giây phút hiện tại", icon: "🏡" },

  // ── Level 4-5: Người thực hành / Đồng hành ──
  { term: "Micro-practice", def: "Bài tập 60 giây áp dụng chánh niệm vào đời sống", icon: "⚡" },
  { term: "Sám hối", def: "Nhìn lại lỗi lầm với tâm tha thứ và học hỏi", icon: "🕯️" },
  { term: "Tùy hỷ", def: "Hoan hỷ với điều tốt mình và người đã làm", icon: "🌟" },
  { term: "Hồi hướng", def: "Chia sẻ năng lượng tích cực đến mọi người", icon: "🎐" },
  { term: "Phụng sự", def: "Làm việc tốt mà không mong cầu đền đáp", icon: "🤲" },
  { term: "Khiêm hạ", def: "Nhận ra mình chỉ là một phần của tổng thể", icon: "🌱" },
  { term: "Nhẫn nhục", def: "Giữ tâm bình thản trước nghịch cảnh", icon: "🪨" },
  { term: "Tinh tấn", def: "Nỗ lực không ngừng trong thực hành chuyển hóa", icon: "🔥" },
  { term: "Chân thành", def: "Sống đúng với những gì mình nghĩ và nói", icon: "💎" },
  { term: "Lắng nghe", def: "Mở lòng đón nhận mà không phán xét", icon: "👂" },
  { term: "Đồng cảm", def: "Cảm nhận niềm vui và nỗi đau của người khác", icon: "💗" },
  { term: "Sẻ chia", def: "Cho đi những gì mình có mà không giữ lại", icon: "🤝" },
  { term: "Lợi tha", def: "Hành động vì lợi ích của người khác", icon: "🌈" },
  { term: "Tự giác", def: "Tự mình thấy ra vấn đề mà không cần ai nhắc", icon: "🔔" },
  { term: "Giác ngộ", def: "Thấy rõ bản chất thật của thực tại", icon: "🪷" },
  { term: "Giải thoát", def: "Tự do khỏi mọi ràng buộc của tâm", icon: "🕊️" },

  // ── Level 6-7: Mentor / Master Mentor ──
  { term: "THẤY", def: "Nhìn rõ bản thân, quan sát thực tại không phán xét", icon: "👁️" },
  { term: "HIỂU", def: "Hiểu nguyên nhân gốc rễ của khổ đau", icon: "💡" },
  { term: "SỐNG", def: "Biến hiểu biết thành thực hành mỗi ngày", icon: "🌟" },
  { term: "LAN TỎA", def: "Chia sẻ giá trị với cộng đồng một cách tự nhiên", icon: "🌊" },
  { term: "Bậc thầy nhập thế", def: "Người sống tỉnh thức giữa đời thường", icon: "👑" },
  { term: "Dẫn dắt", def: "Đi trước mở đường, truyền cảm hứng cho người sau", icon: "🧭" },
  { term: "Khai tâm", def: "Giúp người khác mở lòng đón nhận chân lý", icon: "🔑" },
  { term: "Truyền thừa", def: "Trao truyền tri thức và kinh nghiệm cho thế hệ sau", icon: "📜" },
  { term: "Phản tỉnh", def: "Tự vấn bản thân để không ngừng hoàn thiện", icon: "🪞" },
  { term: "Vô trụ", def: "Không dừng lại ở bất kỳ thành tựu nào", icon: "🌊" },
  { term: "Tùy duyên", def: "Ứng xử linh hoạt theo hoàn cảnh, không cố chấp", icon: "🎋" },
  { term: "Bất động", def: "Tâm không lay chuyển trước 8 ngọn gió đời", icon: "🏔️" },
  { term: "Bát chánh đạo", def: "8 con đường đưa đến giải thoát và an vui", icon: "☸️" },
  { term: "Tứ diệu đế", def: "4 chân lý về khổ và con đường thoát khổ", icon: "📖" },
  { term: "Thất giác chi", def: "7 yếu tố của sự giác ngộ", icon: "✨" },
  { term: "Niết bàn", def: "Trạng thái tịch tịnh tuyệt đối, không còn khổ đau", icon: "🌌" },
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
