"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/**
 * Trang DUYỆT nội dung eKid (cổng C2).
 *
 * Người duyệt (Ngài An) chỉ làm đúng hai việc: đọc, rồi bấm "Đạt" hoặc "Cần sửa".
 * Mọi thứ cần để quyết đều nằm trên một màn: lời hỏi, đáp án, 4 bậc gợi ý, và câu chữ
 * gốc của Bộ cho yêu cầu cần đạt đó (để đối chiếu, không phải nhớ).
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

function badge(status: string) {
  if (status === "dat") return "bg-emerald-100 text-emerald-800";
  if (status === "can_sua") return "bg-rose-100 text-rose-800";
  return "bg-amber-100 text-amber-800";
}

export default function DuyetNoiDungPage() {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [totals, setTotals] = useState({ lessons: 0, items: 0, dat: 0, cho: 0, canSua: 0, done: 0 });
  const [subject, setSubject] = useState("");
  const [onlyTodo, setOnlyTodo] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [lessonInfo, setLessonInfo] = useState<{ title: string; slug: string; review_notes: string | null } | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
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
    setTotals(d.totals ?? totals);
    setLoading(false);
  }, [totals]);

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLesson = useCallback(async (id: string) => {
    setActiveId(id);
    setItems([]);
    const r = await fetch(`/api/admin/ekid/review/${id}`, { cache: "no-store" });
    if (!r.ok) {
      toast.error("Không tải được bài");
      return;
    }
    const d = await r.json();
    setItems(d.items ?? []);
    setLessonInfo({ title: d.lesson.title, slug: d.lesson.slug, review_notes: d.lesson.review_notes });
    setNote(d.lesson.review_notes ?? "");
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
          ? `Đã duyệt ${itemIds?.length ? itemIds.length : d.total} câu`
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
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Duyệt nội dung eKid</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Cổng C2: kiến thức đúng, lời hỏi phù hợp lứa tuổi, gợi ý không lộ đáp án sớm. Bài chỉ được coi là xong khi
          mọi câu đã &quot;Đạt&quot;.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { k: "Bài", v: totals.lessons },
          { k: "Bài xong", v: totals.done },
          { k: "Câu", v: totals.items },
          { k: "Đã đạt", v: totals.dat },
          { k: "Chờ duyệt", v: totals.cho },
        ].map((s) => (
          <div key={s.k} className="rounded-xl border bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-neutral-500">{s.k}</div>
            <div className="text-2xl font-bold">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSubject(s.id)}
            className={`rounded-full border px-3 py-1 text-sm ${
              subject === s.id ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-50"
            }`}
          >
            {s.label}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyTodo} onChange={(e) => setOnlyTodo(e.target.checked)} />
          Chỉ hiện bài chưa xong
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="max-h-[70vh] overflow-y-auto rounded-xl border bg-white">
          {loading && <div className="p-4 text-sm text-neutral-500">Đang tải…</div>}
          {!loading && filtered.length === 0 && (
            <div className="p-4 text-sm text-neutral-500">
              Không có bài nào trong bộ lọc này. (Nội dung mới sẽ xuất hiện sau khi nạp.)
            </div>
          )}
          {filtered.map((l) => (
            <button
              key={l.id}
              onClick={() => void loadLesson(l.id)}
              className={`block w-full border-b p-3 text-left last:border-b-0 hover:bg-neutral-50 ${
                activeId === l.id ? "bg-amber-50" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{l.title}</span>
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${badge(l.review_status)}`}>
                  {l.items.dat}/{l.items.total}
                </span>
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {l.subject} · {l.items.canSua} câu cần sửa
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-xl border bg-white p-4">
          {!activeId && <div className="text-sm text-neutral-500">Chọn một bài bên trái để đọc nội dung.</div>}

          {activeId && (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">{lessonInfo?.title}</h2>
                  <div className="text-xs text-neutral-500">{lessonInfo?.slug}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => void act("dat")}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Duyệt cả bài
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void act("can_sua")}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Cần sửa cả bài
                  </button>
                </div>
              </div>

              <label className="mb-4 block">
                <span className="text-xs font-semibold uppercase text-neutral-500">Ghi chú của người duyệt</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: câu 3 gợi ý bậc 2 đã lộ đáp án"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>

              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div key={it.id} className="rounded-xl border p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-neutral-500">Câu {idx + 1}</span>
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px]">
                        mức {it.level} · {KIND_LABEL[it.kind] ?? it.kind}
                      </span>
                      {it.objective?.code_short && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-800">
                          {it.objective.code_short}
                        </span>
                      )}
                      <span className={`ml-auto rounded px-1.5 py-0.5 text-[11px] font-bold ${badge(it.review_status)}`}>
                        {it.review_status === "dat" ? "đạt" : it.review_status === "can_sua" ? "cần sửa" : "chờ"}
                      </span>
                    </div>

                    <div className="text-sm font-semibold">{it.prompt}</div>

                    {it.objective?.statement && (
                      <div className="mt-1 text-[11px] leading-snug text-neutral-500">
                        YCCĐ: {it.objective.statement}
                      </div>
                    )}

                    <div className="mt-2 rounded-lg bg-neutral-50 p-2 text-sm">
                      <span className="font-semibold">Đáp án: </span>
                      {it.answer?.value || <span className="text-rose-600">THIẾU</span>}
                      {it.answer?.alt?.length ? (
                        <span className="text-neutral-500"> (chấp nhận: {it.answer.alt.join(" · ")})</span>
                      ) : null}
                    </div>

                    <ol className="mt-2 space-y-1 text-[13px]">
                      {(it.hint_ladder ?? []).map((h, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="font-bold text-amber-700">{i + 1}.</span>
                          <span>{h}</span>
                        </li>
                      ))}
                      {(it.hint_ladder ?? []).length < 4 && (
                        <li className="text-rose-600">⚠️ Thiếu bậc gợi ý ({(it.hint_ladder ?? []).length}/4)</li>
                      )}
                    </ol>

                    <div className="mt-2 flex gap-2">
                      <button
                        disabled={busy}
                        onClick={() => void act("dat", [it.id])}
                        className="rounded-lg border border-emerald-600 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        Đạt câu này
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => void act("can_sua", [it.id])}
                        className="rounded-lg border border-rose-600 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Cần sửa
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
