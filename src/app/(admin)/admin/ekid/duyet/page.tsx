"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X, RotateCcw, Loader2 } from "lucide-react";

/**
 * Trang DUYỆT nội dung eKid (cổng C2).
 *
 * Người duyệt chỉ làm hai việc: đọc, rồi bấm "Đạt" hoặc "Cần sửa".
 * Mọi thứ cần để quyết đều nằm trên một màn: lời hỏi, đáp án, 4 bậc gợi ý, và câu chữ
 * gốc của Bộ cho yêu cầu cần đạt đó.
 *
 * GIAO DIỆN: bám hệ màu của khu quản trị (nền #0a0a0a, thẻ #0d0d0d, chữ foreground,
 * phụ text-muted-foreground). TUYỆT ĐỐI không dùng bg-white / text-neutral-* —
 * trên nền tối sẽ thành chữ sáng trên nền sáng, không đọc được.
 */

type LessonRow = {
  id: string;
  slug: string;
  title: string;
  subject: string;
  status: string;
  review_status: string;
  est_minutes: number | null;
  items: { total: number; dat: number; canSua: number; cho: number };
  done: boolean;
};

type ItemRow = {
  id: string;
  prompt: string;
  answer: { value?: string; alt?: string[] } | null;
  hint_ladder: string[] | null;
  kind: string;
  level: number;
  review_status: string;
  review_note: string | null;
  objective: { code_short?: string; statement?: string } | null;
};

const SUBJECTS: Array<{ id: string; label: string }> = [
  { id: "", label: "Tất cả" },
  { id: "toan", label: "Toán" },
  { id: "tieng-viet", label: "Tiếng Việt" },
  { id: "tnxh", label: "TN&XH" },
];

const KIND_LABEL: Record<string, string> = {
  noi: "trả lời bằng lời",
  chon: "chọn A/B/C/D",
  giai_thich: "giải thích (chấm theo ý)",
};

const SUBJECT_LABEL: Record<string, string> = {
  toan: "Toán",
  "tieng-viet": "Tiếng Việt",
  tnxh: "TN&XH",
};

function badge(status: string) {
  if (status === "dat") return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
  if (status === "can_sua") return "border-rose-500/40 bg-rose-500/15 text-rose-300";
  return "border-amber-500/40 bg-amber-500/15 text-amber-200";
}

function badgeText(status: string) {
  if (status === "dat") return "đã duyệt";
  if (status === "can_sua") return "cần sửa";
  return "chờ duyệt";
}

export default function DuyetNoiDungPage() {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [totals, setTotals] = useState({ lessons: 0, items: 0, dat: 0, cho: 0, canSua: 0, done: 0 });
  const [subject, setSubject] = useState("");
  const [onlyTodo, setOnlyTodo] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [lessonInfo, setLessonInfo] = useState<{ title: string; slug: string } | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    const r = await fetch("/api/admin/ekid/review", { cache: "no-store" });
    if (!r.ok) {
      toast.error("Không tải được danh sách (kiểm tra đăng nhập admin)");
      setLoading(false);
      return;
    }
    const d = await r.json();
    setLessons(d.lessons ?? []);
    setTotals(d.totals ?? { lessons: 0, items: 0, dat: 0, cho: 0, canSua: 0, done: 0 });
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadLesson = useCallback(async (id: string) => {
    setActiveId(id);
    setItems([]);
    setLoadingItems(true);
    const r = await fetch(`/api/admin/ekid/review/${id}`, { cache: "no-store" });
    if (!r.ok) {
      toast.error("Không tải được bài");
      setLoadingItems(false);
      return;
    }
    const d = await r.json();
    setItems(d.items ?? []);
    setLessonInfo({ title: d.lesson.title, slug: d.lesson.slug });
    setNote(d.lesson.review_notes ?? "");
    setLoadingItems(false);
  }, []);

  const filtered = useMemo(
    () =>
      lessons.filter((l) => {
        if (subject && l.subject !== subject) return false;
        if (onlyTodo && l.done) return false;
        return true;
      }),
    [lessons, subject, onlyTodo],
  );

  async function act(action: "dat" | "can_sua" | "reset", itemIds?: string[]) {
    if (!activeId) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/ekid/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, lesson_id: activeId, item_ids: itemIds, note }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d.error ?? "Lỗi lưu");
        return;
      }
      toast.success(
        action === "dat"
          ? `Đã duyệt ${itemIds?.length ? `${itemIds.length} câu` : `cả bài (${d.total} câu)`}`
          : action === "can_sua"
            ? "Đã đánh dấu cần sửa"
            : "Đã đưa về chờ duyệt",
      );
      await loadLesson(activeId);
      await loadList();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Duyệt nội dung eKid</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Cổng C2: kiến thức đúng, lời hỏi phù hợp lứa tuổi, gợi ý không lộ đáp án sớm. Bài chỉ được coi là xong khi mọi
          câu đã “Đạt”.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { k: "Bài", v: totals.lessons, tone: "text-foreground" },
          { k: "Bài xong", v: totals.done, tone: "text-emerald-300" },
          { k: "Câu", v: totals.items, tone: "text-foreground" },
          { k: "Đã đạt", v: totals.dat, tone: "text-emerald-300" },
          { k: "Chờ duyệt", v: totals.cho, tone: "text-amber-200" },
        ].map((s) => (
          <div key={s.k} className="rounded-xl border border-border/50 bg-[#0d0d0d] px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.k}</div>
            <div className={`mt-0.5 text-2xl font-bold ${s.tone}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSubject(s.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              subject === s.id
                ? "border-primary bg-primary/15 font-semibold text-primary"
                : "border-border/50 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
        <label className="ml-2 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            checked={onlyTodo}
            onChange={(e) => setOnlyTodo(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Chỉ hiện bài chưa xong
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Danh sách bài */}
        <div className="max-h-[72vh] overflow-y-auto rounded-xl border border-border/50 bg-[#0d0d0d]">
          {loading && (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Đang tải…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">Không có bài nào trong bộ lọc này.</div>
          )}
          {filtered.map((l) => (
            <button
              key={l.id}
              onClick={() => void loadLesson(l.id)}
              className={`block w-full border-b border-border/30 p-3 text-left transition-colors last:border-b-0 ${
                activeId === l.id ? "bg-primary/10" : "hover:bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold leading-snug text-foreground">{l.title}</span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${badge(
                    l.done ? "dat" : l.items.canSua > 0 ? "can_sua" : "cho_duyet",
                  )}`}
                >
                  {l.items.dat}/{l.items.total}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {SUBJECT_LABEL[l.subject] ?? l.subject}
                {" · "}
                {l.items.canSua > 0 ? `${l.items.canSua} câu cần sửa` : `${l.items.cho} câu chờ duyệt`}
              </div>
            </button>
          ))}
        </div>

        {/* Chi tiết bài */}
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4">
          {!activeId && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Chọn một bài bên trái để đọc nội dung.
            </div>
          )}

          {activeId && (
            <>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">{lessonInfo?.title}</h2>
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{lessonInfo?.slug}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={busy}
                    onClick={() => void act("dat")}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <Check className="size-4" /> Duyệt cả bài
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void act("can_sua")}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-500/50 px-3 py-2 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                  >
                    <X className="size-4" /> Cần sửa cả bài
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void act("reset")}
                    title="Đưa bài về trạng thái chờ duyệt"
                    className="flex items-center rounded-lg border border-border/50 px-2.5 py-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-50"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                </div>
              </div>

              <label className="mb-4 block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ghi chú của người duyệt
                </span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: câu 3 gợi ý bậc 2 đã lộ đáp án"
                  className="mt-1 w-full rounded-lg border border-border/50 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                />
              </label>

              {loadingItems && (
                <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Đang tải câu hỏi…
                </div>
              )}

              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div key={it.id} className="rounded-xl border border-border/40 bg-[#141414] p-3.5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">Câu {idx + 1}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-foreground">
                        mức {it.level} · {KIND_LABEL[it.kind] ?? it.kind}
                      </span>
                      {it.objective?.code_short && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] text-blue-300">
                          {it.objective.code_short}
                        </span>
                      )}
                      <span
                        className={`ml-auto rounded-full border px-2 py-0.5 text-[11px] font-bold ${badge(
                          it.review_status,
                        )}`}
                      >
                        {badgeText(it.review_status)}
                      </span>
                    </div>

                    <div className="text-sm font-semibold leading-relaxed text-foreground">{it.prompt}</div>

                    {it.objective?.statement && (
                      <div className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                        YCCĐ: {it.objective.statement}
                      </div>
                    )}

                    <div className="mt-2 rounded-lg border border-border/30 bg-white/5 px-3 py-2 text-sm text-foreground">
                      <span className="font-semibold text-emerald-300">Đáp án: </span>
                      {it.answer?.value || <span className="font-semibold text-rose-400">THIẾU</span>}
                      {it.answer?.alt?.length ? (
                        <span className="text-muted-foreground"> (chấp nhận: {it.answer.alt.join(" · ")})</span>
                      ) : null}
                    </div>

                    <ol className="mt-2 space-y-1.5">
                      {(it.hint_ladder ?? []).map((h, i) => (
                        <li key={i} className="flex gap-2 text-[13px] leading-relaxed">
                          <span className={`shrink-0 font-bold ${i === 3 ? "text-emerald-300" : "text-amber-300"}`}>
                            {i + 1}.
                          </span>
                          <span className={i === 3 ? "text-emerald-200" : "text-foreground/90"}>{h}</span>
                        </li>
                      ))}
                      {(it.hint_ladder ?? []).length < 4 && (
                        <li className="text-[13px] font-semibold text-rose-400">
                          ⚠️ Thiếu bậc gợi ý ({(it.hint_ladder ?? []).length}/4)
                        </li>
                      )}
                    </ol>

                    <div className="mt-2.5 flex gap-2">
                      <button
                        disabled={busy}
                        onClick={() => void act("dat", [it.id])}
                        className="flex items-center gap-1 rounded-lg border border-emerald-500/50 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                      >
                        <Check className="size-3.5" /> Đạt câu này
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => void act("can_sua", [it.id])}
                        className="flex items-center gap-1 rounded-lg border border-rose-500/50 px-2.5 py-1 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        <X className="size-3.5" /> Cần sửa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
