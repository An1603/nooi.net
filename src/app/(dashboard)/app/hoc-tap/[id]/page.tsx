"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Play, Sparkles, ChevronRight, Clock, Award, Bot } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LessonComments from "@/components/comment/LessonComments";

// ─── Dữ liệu bài học ───────────────────────────────────────────────────────

const LESSONS: Record<string, {
  title: string; level: number; levelName: string;
  content: string; duration: string; durationSec: number;
  quiz: { question: string; options: string[]; correct: number }[];
  nextId?: string; prevId?: string;
}> = {
  "1-1": {
    title: "NOOI là gì?", level: 1, levelName: "Người mới",
    duration: "15:00", durationSec: 900,
    content: `## NOOI là gì?
    
NOOI là hệ sinh thái giáo dục trải nghiệm và chuyển hóa thân tâm, nơi AI và chuyên gia đồng hành cùng bạn trên hành trình an nhiên, tự tại.

### Triết lý cốt lõi
**THẤY** — Nhìn rõ bản thân, quan sát thực tại không phán xét.
**HIỂU** — Hiểu nguyên nhân gốc rễ của khổ đau.
**SỐNG** — Biến hiểu biết thành thực hành mỗi ngày.
**LAN TỎA** — Chia sẻ giá trị với cộng đồng.

### Sứ mệnh
Kết nối con người với chính mình, với cộng đồng và với những giá trị tốt đẹp.`,
    quiz: [
      { question: "NOOI có mấy trụ cột?", options: ["2", "3", "4", "5"], correct: 2 },
      { question: "Trụ cột thứ 3 của NOOI là gì?", options: ["THẤY", "HIỂU", "SỐNG", "LAN TỎA"], correct: 2 },
    ],
    nextId: "1-2",
  },
  "1-2": {
    title: "Vì sao NOOI ra đời?", level: 1, levelName: "Người mới",
    duration: "12:00", durationSec: 720,
    content: `## Vì sao NOOI ra đời?
    
### Vấn đề của con người hiện đại
- **Thành công bên ngoài, trống rỗng bên trong**
- **Cô đơn giữa kết nối**
- **Phân mảnh tâm thức**

### Khoảng trống giáo dục
Trường học dạy cách **kiếm sống**, nhưng không dạy **cách sống**.`,
    quiz: [
      { question: "NOOI ra đời để lấp đầy khoảng trống gì?", options: ["Kiếm tiền", "Cách sống", "Kỹ năng mềm", "Ngoại ngữ"], correct: 1 },
    ],
    prevId: "1-1", nextId: "1-3",
  },
  "1-3": {
    title: "Bản đồ con người", level: 1, levelName: "Người mới",
    duration: "20:00", durationSec: 1200,
    content: `## Bản đồ con người
    
**Tánh biết** → **Tâm** → **Nhận thức** → **Tư duy** → **Cảm xúc** → **Ý chí** → **Hành động** → **Thói quen** → **Tính cách** → **Nghiệp** → **Hoàn cảnh**

### Các thành tố chính
- **Tánh biết**: Bầu trời trong vắt.
- **Tâm**: Khu vườn ký ức.
- **Nhận thức**: Chiếc kính màu.
- **Hành động**: Hạt giống.`,
    quiz: [
      { question: "Tánh biết được ví như?", options: ["Đám mây", "Bầu trời", "Cơn mưa", "Ngọn lửa"], correct: 1 },
      { question: "Điều gì đứng giữa Nhận thức và Cảm xúc?", options: ["Tánh biết", "Tư duy", "Ý chí", "Hành động"], correct: 1 },
    ],
    prevId: "1-2", nextId: "1-4",
  },
  "1-4": {
    title: "Bản đồ khổ đau", level: 1, levelName: "Người mới",
    duration: "18:00", durationSec: 1080,
    content: `## Bản đồ khổ đau

### Khổ đau là tín hiệu
Giống như **đèn báo trên xe hơi**.

### Vòng xoáy luân hồi
1. **Vô minh** → 2. **Chấp ngã** → 3. **Tham-Sân-Si** → 4. **Nghiệp**

### Công thức chuyển hóa
**Quan sát** → **Nhận diện** → **Buông bỏ** → **Chuyển hóa**`,
    quiz: [
      { question: "Khổ đau được ví như?", options: ["Kẻ thù", "Đèn báo xe", "Cơn ác mộng", "Bài học"], correct: 1 },
    ],
    prevId: "1-3", nextId: "1-5",
  },
  "1-5": {
    title: "Bắt đầu thực hành", level: 1, levelName: "Người mới",
    duration: "10:00", durationSec: 600,
    content: `## Bắt đầu thực hành

### Micro-practice 60 giây
1. Ngồi thẳng, nhắm mắt.
2. Hít sâu 3 hơi.
3. Hỏi: "Điều gì quan trọng nhất với mình hôm nay?"

### Nhật ký đầu tiên
- **Thân**: Cơ thể thế nào?
- **Tâm**: Cảm xúc chính là gì?
- **Hành**: Điều gì tốt?`,
    quiz: [
      { question: "Micro-practice nên kéo dài bao lâu?", options: ["10 giây", "60 giây", "5 phút", "15 phút"], correct: 1 },
    ],
    prevId: "1-4",
  },
  "2-1": {
    title: "Quan sát thân-tâm", level: 2, levelName: "Người tìm kiếm",
    duration: "15:00", durationSec: 900,
    content: `## Quan sát thân-tâm

Quan sát là kỹ năng nền tảng của mọi sự chuyển hóa.

### Bài tập: Quan sát hơi thở
1. Ngồi thoải mái, nhắm mắt.
2. Đưa sự chú ý đến hơi thở.
3. Khi tâm trí lang thang, nhẹ nhàng đưa về.`,
    quiz: [
      { question: "Kỹ năng nền tảng của chuyển hóa là gì?", options: ["Suy nghĩ", "Quan sát", "Hành động", "Nói chuyện"], correct: 1 },
    ],
    prevId: "1-5", nextId: "2-2",
  },
};

// ─── Tính % hoàn thành ──────────────────────────────────────────────────────

function calcProgress(progress: { timeSpent: number; quizScore: number; quizTotal: number }) {
  const videoDone = progress.timeSpent > 0; // simplified
  const quizDone = progress.quizTotal > 0 && progress.quizScore >= progress.quizTotal * 0.7;
  const pct = videoDone && quizDone ? 100 : quizDone ? 70 : videoDone ? 30 : 0;
  return { pct, completed: pct >= 100 };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.id as string;
  const lesson = LESSONS[lessonId];
  const [progress, setProgress] = useState({ timeSpent: 0, quizScore: 0, quizTotal: 0, pct: 0, completed: false });
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(0);
  const [quizLocked, setQuizLocked] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const startTime = useRef(Date.now());
  const savedRef = useRef(false);

  // ── Load progress ──
  useEffect(() => {
    if (!lesson) return;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("documents")
        .select("content").eq("user_id", user.id).eq("title", lessonId).eq("file_type", "lesson_progress")
        .maybeSingle();
      if (data?.content) {
        try {
          const p = JSON.parse(data.content);
          setProgress(p);
          if (p.quizAnswers) setQuizAnswers(p.quizAnswers);
          if (p.quizSubmitted) setQuizSubmitted(true);
          if (p.quizScore !== undefined) setQuizResult(p.quizScore);
          // Mở khóa quiz nếu đã xem đủ video
          if ((p.timeSpent || 0) >= lesson.durationSec * 0.7) setQuizLocked(false);
          if (p.quizSubmitted) setQuizLocked(false);
        } catch {}
      }
      // Nếu chưa có progress, lock quiz
    })();
  }, [lessonId, lesson]);

  // ── Auto-save progress khi rời trang ──
  useEffect(() => {
    if (!lesson) return;
    const save = async () => {
      if (savedRef.current) return;
      savedRef.current = true;
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const existing = progress.timeSpent || 0;
      const totalTime = existing + timeSpent;
      if (totalTime >= lesson.durationSec * 0.7) setQuizLocked(false);
      const { pct, completed } = calcProgress({ timeSpent: totalTime, quizScore: quizResult, quizTotal: lesson.quiz.length });
      await supabase.from("documents").upsert({
        user_id: user.id, title: lessonId, file_type: "lesson_progress",
        content: JSON.stringify({ timeSpent: totalTime, quizScore: quizResult, quizTotal: lesson.quiz.length, quizAnswers, quizSubmitted, completed, pct }),
      }, { onConflict: "user_id, title, file_type" });
      setProgress(prev => ({ ...prev, pct, completed }));
    };
    window.addEventListener("beforeunload", save);
    return () => { save(); window.removeEventListener("beforeunload", save); };
  }, [lessonId, lesson, quizResult, quizAnswers, quizSubmitted, lesson?.quiz.length]);

  // ── Submit Quiz ──
  async function submitQuiz() {
    let correct = 0;
    lesson.quiz.forEach((q, i) => { if (quizAnswers[i] === q.correct) correct++; });
    setQuizResult(correct);
    setQuizSubmitted(true);
    savedRef.current = false; // force re-save
  }

  // ── Retry Quiz (trừ N) ──
  async function retryQuiz() {
    const penalty = lesson.level * 5; // Level 1=5N, Level 2=10N...
    if (!confirm(`Làm lại quiz sẽ mất ${penalty} N. Tiếp tục?`)) return;
    setRetrying(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Trừ N bằng cách xóa 1 journal entry (nếu có)
      const { data: journals } = await supabase.from("documents")
        .select("id").eq("user_id", user.id).eq("file_type", "journal").limit(penalty / 10);
      if (journals && journals.length > 0) {
        const ids = journals.slice(0, Math.ceil(penalty / 10)).map((j) => j.id);
        await supabase.from("documents").delete().in("id", ids);
      }
    } catch {}
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setQuizResult(0);
    setRetrying(false);
    savedRef.current = false;
  }

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-muted-foreground">Bài học không tồn tại.</p>
        <Link href="/app/hoc-tap" className="text-primary hover:underline mt-4 inline-block">← Về học tập</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app/hoc-tap" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Học tập
        </Link>
        <span>/</span>
        <span className="text-foreground">{lesson.title}</span>
      </div>

      {/* Header + Progress */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Level {lesson.level}: {lesson.levelName}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {lesson.duration}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
        </div>
        {/* Progress circle */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 border-4 border-primary/30 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">{progress.pct}%</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {progress.completed ? "✅ Hoàn thành" : "Đang học"}
          </p>
        </div>
      </div>

      {/* Video placeholder */}
      <div className="rounded-xl bg-muted/30 border border-border aspect-video flex items-center justify-center">
        <div className="text-center">
          <Play className="w-12 h-12 text-primary/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Video bài giảng</p>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="prose prose-invert max-w-none space-y-4">
          {lesson.content.split("\n").map((line, i) => {
            const formatted = line.replace(/\*\*(.+?)\*\*/g, "<strong class='text-primary'>$1</strong>");
            const withArrow = formatted.replace(/→/g, " <span class='text-primary font-bold mx-1'>→</span> ");
            if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.slice(3)}</h2>;
            if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
            if (line.startsWith("> ")) return <blockquote key={i} className="border-l-2 border-primary/30 pl-4 italic text-muted-foreground my-3" dangerouslySetInnerHTML={{ __html: withArrow.slice(2) }} />;
            if (line.startsWith("- **")) return <p key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: withArrow.replace(/^- /, "") }} />;
            if (line.startsWith("- ")) return <li key={i} className="text-sm ml-4 list-disc" dangerouslySetInnerHTML={{ __html: withArrow.slice(2) }} />;
            if (line.match(/^\d+\. /)) return <li key={i} className="text-sm ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: withArrow.replace(/^\d+\. /, "") }} />;
            if (line.trim() === "") return <div key={i} className="h-2" />;
            if (/^\*\*[^*]+\*\*$/.test(line.trim())) return <h4 key={i} className="font-bold text-primary uppercase tracking-wider mt-4 mb-2">{line.trim().slice(2, -2)}</h4>;
            return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: withArrow }} />;
          })}
        </div>
      </div>

      {/* Quiz */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Award className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Kiểm tra kiến thức</h3>
          {quizSubmitted && (
            <span className="text-sm ml-auto">
              {quizResult}/{lesson.quiz.length} ({Math.round((quizResult / lesson.quiz.length) * 100)}%)
            </span>
          )}
          {quizLocked && !quizSubmitted && (
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
              🔒 Xem video trước
            </span>
          )}
        </div>

        {quizLocked && !quizSubmitted ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Xem hết video để mở khóa bài kiểm tra</p>
            <p className="text-xs mt-1">Cần xem ít nhất 70% thời lượng</p>
          </div>
        ) : (
          <div className="space-y-5">
            {lesson.quiz.map((q, qi) => (
              <div key={qi}>
                <p className="text-sm font-medium mb-2">Câu {qi + 1}: {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const selected = quizAnswers[qi] === oi;
                    const isCorrect = quizSubmitted && oi === q.correct;
                    const isWrong = quizSubmitted && selected && oi !== q.correct;
                    return (
                      <button key={oi} disabled={quizSubmitted}
                        onClick={() => { const newA = [...quizAnswers]; newA[qi] = oi; setQuizAnswers(newA); }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm border transition-colors ${
                          quizSubmitted
                            ? isCorrect ? "border-green-500/50 bg-green-500/10 text-green-400"
                              : isWrong ? "border-red-500/50 bg-red-500/10 text-red-400"
                              : "border-border/50 opacity-60"
                            : selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                        }`}
                      >{opt}</button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          {!quizSubmitted && !quizLocked && (
            <button onClick={submitQuiz} disabled={quizAnswers.length < lesson.quiz.length}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
            >Nộp bài</button>
          )}
          {quizSubmitted && (
            <button onClick={retryQuiz} disabled={retrying}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
            >{retrying ? "Đang xử lý..." : `🔄 Làm lại (mất ${lesson.level * 5} N)`}</button>
          )}
        </div>
      </div>

      {/* Comments */}
      <LessonComments lessonId={lessonId} />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          {lesson.prevId && <Link href={`/app/hoc-tap/${lesson.prevId}`} className="text-sm text-muted-foreground hover:text-foreground">← Bài trước</Link>}
        </div>
        {lesson.nextId && (
          <Link href={`/app/hoc-tap/${lesson.nextId}`}
            className="flex items-center gap-1 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
          >
            Bài tiếp <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
