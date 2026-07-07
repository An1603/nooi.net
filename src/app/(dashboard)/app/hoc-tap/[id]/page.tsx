"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Play, Sparkles, ChevronRight, Bot } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Nội dung bài học từ Master Blueprint ───────────────────────────────────

const LESSONS: Record<string, {
  title: string; level: number; levelName: string;
  content: string; duration: string;
  videoUrl?: string; practice?: string[];
  nextId?: string; prevId?: string;
}> = {
  "1-1": {
    title: "NOOI là gì?", level: 1, levelName: "Người mới",
    duration: "15:00",
    content: `## NOOI là gì?
    
NOOI là hệ sinh thái giáo dục trải nghiệm và chuyển hóa thân tâm, nơi AI và chuyên gia đồng hành cùng bạn trên hành trình an nhiên, tự tại.

### Triết lý cốt lõi
**THẤY** — Nhìn rõ bản thân, quan sát thực tại không phán xét.
**HIỂU** — Hiểu nguyên nhân gốc rễ của khổ đau.
**SỐNG** — Biến hiểu biết thành thực hành mỗi ngày.
**LAN TỎA** — Chia sẻ giá trị với cộng đồng.

### Sứ mệnh
Kết nối con người với chính mình, với cộng đồng và với những giá trị tốt đẹp, thông qua học tập, thực hành và đồng hành lâu dài.`,
    nextId: "1-2",
  },
  "1-2": {
    title: "Vì sao NOOI ra đời?", level: 1, levelName: "Người mới",
    duration: "12:00",
    content: `## Vì sao NOOI ra đời?

### Vấn đề của con người hiện đại
- **Thành công bên ngoài, trống rỗng bên trong**: Nhiều người có nhà, xe, địa vị nhưng luôn cảm thấy thiếu ý nghĩa.
- **Cô đơn giữa kết nối**: Hàng nghìn bạn bè trên mạng xã hội nhưng không có ai thực sự thấu hiểu.
- **Phân mảnh tâm thức**: Thông tin tràn ngập, không có không gian để tĩnh lặng.

### Khoảng trống giáo dục
Trường học dạy cách **kiếm sống**, nhưng không dạy **cách sống**. NOOI ra đời để lấp đầy khoảng trống đó.`,
    prevId: "1-1", nextId: "1-3",
  },
  "1-3": {
    title: "Bản đồ con người", level: 1, levelName: "Người mới",
    duration: "20:00",
    content: `## Bản đồ con người

### Cấu trúc tâm thức
**Tánh biết** → **Tâm** → **Nhận thức** → **Tư duy** → **Cảm xúc** → **Ý chí** → **Hành động** → **Thói quen** → **Tính cách** → **Nghiệp** → **Hoàn cảnh**

### Các thành tố chính
- **Tánh biết**: Bầu trời trong vắt, nơi mọi hiện tượng đến rồi đi.
- **Tâm**: Khu vườn ký ức, nơi lưu giữ mọi trải nghiệm.
- **Nhận thức**: Chiếc kính màu bạn đeo để nhìn đời.
- **Hành động**: Hạt giống bạn gieo mỗi ngày.

> "Tánh biết là bầu trời, muôn ý niệm là mây, mây bay trời vẫn vậy."`,
    prevId: "1-2", nextId: "1-4",
  },
  "1-4": {
    title: "Bản đồ khổ đau", level: 1, levelName: "Người mới",
    duration: "18:00",
    content: `## Bản đồ khổ đau

### Khổ đau là tín hiệu
Giống như đèn báo trên bảng điều khiển xe hơi — khổ đau không phải kẻ thù, mà là thông điệp.

### Vòng xoáy luân hồi
1. **Vô minh**: Không biết mình là ai.
2. **Chấp ngã**: Bám víu vào cái tôi.
3. **Tham - Sân - Si**: Phản ứng theo thói quen.
4. **Nghiệp**: Hành động tạo ra kết quả.

### Công thức chuyển hóa
**Quan sát** → **Nhận diện** → **Buông bỏ** → **Chuyển hóa**

> "Khổ đau chẳng phải kẻ thù, mà là chuông báo công phu chưa tròn."`,
    prevId: "1-3", nextId: "1-5",
  },
  "1-5": {
    title: "Bắt đầu thực hành", level: 1, levelName: "Người mới",
    duration: "10:00",
    content: `## Bắt đầu thực hành

### Bài tập 1: Micro-practice 60 giây
1. Ngồi thẳng, nhắm mắt.
2. Hít sâu 3 hơi.
3. Đặt tay lên tim.
4. Hỏi: "Điều gì quan trọng nhất với mình hôm nay?"

### Bài tập 2: Nhật ký đầu tiên
Viết 3 điều:
- **Thân**: Cơ thể hôm nay thế nào?
- **Tâm**: Cảm xúc chính là gì?
- **Hành**: Điều gì tốt? Cần rút kinh nghiệm?

### Bài tập 3: Hỏi AI Mentor
Mở AI Mentor và chia sẻ những gì bạn vừa trải nghiệm.`,
    prevId: "1-4",
  },
  "2-1": {
    title: "Quan sát thân-tâm", level: 2, levelName: "Người tìm kiếm",
    duration: "15:00",
    content: `## Quan sát thân-tâm

### Thực hành quan sát
Quan sát là kỹ năng nền tảng của mọi sự chuyển hóa. Khi bạn quan sát, bạn tách mình ra khỏi những phản ứng tự động.

### Bài tập: Quan sát hơi thở
1. Ngồi thoải mái, nhắm mắt.
2. Đưa sự chú ý đến hơi thở vào-ra tại mũi.
3. Khi tâm trí lang thang, nhẹ nhàng đưa về hơi thở.
4. Làm trong 5 phút.

### Ghi nhận
Sau khi thực hành, viết lại cảm nhận của bạn.`,
    prevId: "1-5", nextId: "2-2",
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.id as string;
  const lesson = LESSONS[lessonId];
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("documents")
        .select("content")
        .eq("user_id", user.id)
        .eq("title", lessonId)
        .eq("file_type", "lesson_progress")
        .maybeSingle();
      if (data?.content === "completed") setCompleted(true);
    })();
  }, [lessonId, lesson]);

  async function markComplete() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("documents").upsert({
        user_id: user.id,
        title: lessonId,
        content: "completed",
        file_type: "lesson_progress",
      }, { onConflict: "user_id, title, file_type" });
      if (!error) {
        setCompleted(true);
        // Cộng N
        await fetch("/api/progress", { method: "GET" });
      }
    } catch {}
    setSaving(false);
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
      {/* Back + Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app/hoc-tap" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Học tập
        </Link>
        <span>/</span>
        <span className="text-foreground">{lesson.title}</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            Level {lesson.level}: {lesson.levelName}
          </span>
          <span className="text-[10px] text-muted-foreground">{lesson.duration}</span>
        </div>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
      </div>

      {/* Video placeholder */}
      <div className="rounded-xl bg-muted/30 border border-border aspect-video flex items-center justify-center">
        <div className="text-center">
          <Play className="w-12 h-12 text-primary/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Video bài giảng (đang cập nhật)</p>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="prose prose-invert max-w-none space-y-4">
          {lesson.content.split("\n").map((line, i) => {
            // Chuyển **text** thành <strong>text</strong>
            const formatted = line.replace(/\*\*(.+?)\*\*/g, "<strong class='text-primary'>$1</strong>");
            // Chuyển → thành mũi tên màu
            const withArrow = formatted.replace(/→/g, " <span class='text-primary font-bold mx-1'>→</span> ");

            if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.slice(3)}</h2>;
            if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
            if (line.startsWith("> ")) return <blockquote key={i} className="border-l-2 border-primary/30 pl-4 italic text-muted-foreground my-3" dangerouslySetInnerHTML={{ __html: withArrow.slice(2) }} />;
            if (line.startsWith("- **")) return <p key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: withArrow.replace(/^- /, "") }} />;
            if (line.startsWith("- ")) return <li key={i} className="text-sm ml-4 list-disc" dangerouslySetInnerHTML={{ __html: withArrow.slice(2) }} />;
            if (line.match(/^\d+\. /)) return <li key={i} className="text-sm ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: withArrow.replace(/^\d+\. /, "") }} />;
            if (line.startsWith("**") && line.endsWith("**")) {
              const text = line.slice(2, -2);
              return <h4 key={i} className="font-bold text-primary uppercase tracking-wider mt-4 mb-2">{text}</h4>;
            }
            if (line.trim() === "") return <div key={i} className="h-2" />;
            return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: withArrow }} />;
          })}
        </div>
      </div>

      {/* Practice steps */}
      {lesson.practice && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold">Thực hành</h3>
          </div>
          <ol className="space-y-2">
            {lesson.practice.map((step, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-emerald-400 font-medium shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          {lesson.prevId && (
            <Link href={`/app/hoc-tap/${lesson.prevId}`} className="text-sm text-muted-foreground hover:text-foreground">
              ← Bài trước
            </Link>
          )}
        </div>

        <div className="flex gap-3">
          {!completed ? (
            <button onClick={markComplete} disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? "Đang lưu..." : "Đánh dấu đã học"}
            </button>
          ) : (
            <span className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle className="w-4 h-4" /> Đã hoàn thành
            </span>
          )}

          {lesson.nextId && (
            <Link href={`/app/hoc-tap/${lesson.nextId}`}
              className="flex items-center gap-1 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
            >
              Bài tiếp <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
