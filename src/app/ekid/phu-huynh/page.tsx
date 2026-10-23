"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Kid {
  id: string;
  name: string;
  is_owner: boolean;
  placement_level: number | null;
}

interface DailyReport {
  kidName: string;
  minutes: number;
  sessions: number;
  graded: number;
  correctNoHint: number;
  rateNoHint: number;
  weakObjectives: string[];
  lines: string[];
}

interface Note {
  id: number;
  kind: string;
  body: string | null;
  rating: number | null;
  created_at: string;
}

interface Reward {
  id: string;
  label: string;
  level_required: number;
  status: string;
}

const RATING_LABEL: Record<number, string> = { 1: "Cần cố gắng", 2: "Đạt", 3: "Tốt" };

const card = "rounded-3xl border-2 border-sky-100 bg-white p-5 shadow-sm";
const btn = "rounded-full bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284c7] disabled:opacity-50";
const btnGhost = "rounded-full border-2 border-sky-200 px-4 py-2 text-sm font-bold text-[#0e7490] hover:bg-sky-50";
const input = "w-full rounded-2xl border-2 border-sky-100 px-4 py-2 text-base focus:border-sky-400 focus:outline-none";

/**
 * Bảng của bố mẹ: báo cáo hôm nay, ghi nhận/đánh giá, phần thưởng, đồng thuận.
 * Nguyên tắc: mỗi mục tối đa 1 lần chạm; báo cáo nói về việc học, không nói về app.
 */
export default function ParentPage() {
  const [kids, setKids] = useState<Kid[]>([]);
  const [kidId, setKidId] = useState<string>("");
  const [report, setReport] = useState<DailyReport | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [consent, setConsent] = useState<{ guardian_ok: boolean; child_ok: boolean; sharing_allowed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [noteBody, setNoteBody] = useState("");
  const [rating, setRating] = useState(2);
  const [rewardLabel, setRewardLabel] = useState("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/ekid/kids", { cache: "no-store" });
      const d = (await r.json()) as { kids?: Kid[]; error?: string };
      if (!r.ok) {
        setMessage(d.error ?? "Không tải được hồ sơ");
        setLoading(false);
        return;
      }
      setKids(d.kids ?? []);
      setKidId((prev) => prev || d.kids?.[0]?.id || "");
      setLoading(false);
    })();
  }, []);

  const loadKidData = useCallback(async (id: string) => {
    if (!id) return;
    const q = `kid_id=${encodeURIComponent(id)}`;
    const [rRep, rNote, rRew, rCon] = await Promise.all([
      fetch(`/api/ekid/report/daily?${q}`, { cache: "no-store" }),
      fetch(`/api/ekid/parent/notes?${q}`, { cache: "no-store" }),
      fetch(`/api/ekid/parent/rewards?${q}`, { cache: "no-store" }),
      fetch(`/api/ekid/consent?${q}`, { cache: "no-store" }),
    ]);
    if (rRep.ok) setReport((await rRep.json()) as DailyReport);
    if (rNote.ok) setNotes(((await rNote.json()) as { notes: Note[] }).notes);
    if (rRew.ok) setRewards(((await rRew.json()) as { rewards: Reward[] }).rewards);
    if (rCon.ok) setConsent(await rCon.json());
  }, []);

  useEffect(() => {
    void loadKidData(kidId);
  }, [kidId, loadKidData]);

  async function addNote(kind: "ghi_nhan" | "danh_gia" | "muc_tieu") {
    const body: Record<string, unknown> = { kid_id: kidId, kind };
    if (noteBody.trim()) body.body = noteBody.trim();
    if (kind === "danh_gia") body.rating = rating;
    const r = await fetch("/api/ekid/parent/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = (await r.json()) as { error?: string };
    if (!r.ok) return setMessage(d.error ?? "Không lưu được");
    setNoteBody("");
    setMessage("Đã lưu ✓");
    void loadKidData(kidId);
  }

  async function addReward() {
    if (!rewardLabel.trim()) return;
    const r = await fetch("/api/ekid/parent/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kid_id: kidId, label: rewardLabel.trim() }),
    });
    const d = (await r.json()) as { error?: string };
    if (!r.ok) return setMessage(d.error ?? "Không lưu được");
    setRewardLabel("");
    setMessage("Đã thêm phần thưởng ✓");
    void loadKidData(kidId);
  }

  async function giveReward(id: string) {
    await fetch("/api/ekid/parent/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kid_id: kidId, reward_id: id }),
    });
    void loadKidData(kidId);
  }

  async function consentAs(role: "guardian" | "child") {
    const r = await fetch("/api/ekid/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kid_id: kidId, role }),
    });
    const d = (await r.json()) as { error?: string };
    if (!r.ok) return setMessage(d.error ?? "Không ghi được đồng thuận");
    setMessage(role === "guardian" ? "Bố mẹ đã đồng ý ✓" : "Con đã xác nhận ✓");
    void loadKidData(kidId);
  }

  if (loading) return <p className="p-8 text-center text-lg font-bold text-slate-600">Đang mở bảng của bố mẹ…</p>;

  if (kids.length === 0) {
    return (
      <div className={`mx-auto mt-10 max-w-md ${card} text-center`}>
        <p className="text-lg font-bold text-slate-700">Chưa có hồ sơ con</p>
        <Link href="/ekid/khoa" className={`${btn} mt-4 inline-block`}>
          Tạo hồ sơ cho con
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-[#0e7490]">Bảng của bố mẹ</h1>
        <div className="flex items-center gap-2">
          <select value={kidId} onChange={(e) => setKidId(e.target.value)} className={input + " w-auto"}>
            {kids.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} · cấp {k.placement_level ?? 1}
              </option>
            ))}
          </select>
          <Link href="/ekid" className={btnGhost}>
            Về phòng học
          </Link>
        </div>
      </div>

      {message && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">{message}</p>
      )}

      {/* Báo cáo hôm nay */}
      <section className={card}>
        <h2 className="text-lg font-bold text-slate-800">Hôm nay</h2>
        {report && report.graded > 0 ? (
          <>
            <ul className="mt-2 space-y-1 text-base text-slate-700">
              {report.lines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-sky-50 p-3">
                <p className="text-2xl font-extrabold text-sky-700">{report.minutes}</p>
                <p className="text-xs font-semibold text-slate-500">phút học</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3">
                <p className="text-2xl font-extrabold text-sky-700">{report.correctNoHint}</p>
                <p className="text-xs font-semibold text-slate-500">câu đúng, không gợi ý</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3">
                <p className="text-2xl font-extrabold text-sky-700">{report.rateNoHint}%</p>
                <p className="text-xs font-semibold text-slate-500">tỷ lệ tự làm</p>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-2 text-base text-slate-600">Hôm nay con chưa có phiên học nào.</p>
        )}
      </section>

      {/* Ghi nhận / đánh giá */}
      <section className={card}>
        <h2 className="text-lg font-bold text-slate-800">Ghi nhận của bố mẹ</h2>
        <textarea
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
          rows={2}
          placeholder="Ví dụ: hôm nay con tự giác, không cần nhắc"
          className={input + " mt-2"}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => addNote("ghi_nhan")} className={btn} disabled={!noteBody.trim()}>
            Lưu ghi nhận
          </button>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className={input + " w-auto"}>
            {[3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {RATING_LABEL[r]}
              </option>
            ))}
          </select>
          <button onClick={() => addNote("danh_gia")} className={btnGhost}>
            Đánh giá
          </button>
          <button onClick={() => addNote("muc_tieu")} className={btnGhost} disabled={!noteBody.trim()}>
            Đặt làm mục tiêu
          </button>
        </div>
        {notes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {notes.slice(0, 5).map((n) => (
              <li key={n.id} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="mr-2 font-bold text-sky-700">
                  {n.kind === "danh_gia" ? RATING_LABEL[n.rating ?? 2] : n.kind === "muc_tieu" ? "Mục tiêu" : "Ghi nhận"}
                </span>
                {n.body ?? ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Phần thưởng */}
      <section className={card}>
        <h2 className="text-lg font-bold text-slate-800">Phần thưởng con sẽ nhận</h2>
        <p className="mt-1 text-sm text-slate-500">
          Con chỉ thấy phần thưởng đã mở khoá. Việc trao là của bố mẹ — app không tự thưởng.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={rewardLabel}
            onChange={(e) => setRewardLabel(e.target.value)}
            placeholder="Ví dụ: đi công viên thứ Bảy"
            className={input}
          />
          <button onClick={addReward} className={btn} disabled={!rewardLabel.trim()}>
            Thêm
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {rewards.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-700">
                {r.label} · cấp {r.level_required}
              </span>
              {r.status === "unlocked" ? (
                <button onClick={() => giveReward(r.id)} className={btn}>
                  Đã trao
                </button>
              ) : (
                <span className="text-xs font-bold uppercase text-slate-400">
                  {r.status === "given" ? "Đã trao" : "Đang khoá"}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Đồng thuận */}
      <section className={card}>
        <h2 className="text-lg font-bold text-slate-800">Đồng thuận dữ liệu</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cần hai tầng: bố mẹ đồng ý ở cấp tài khoản, và chính con xác nhận. Không có đủ hai tầng thì mọi
          tính năng chia sẻ/so sánh đều tắt.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${consent?.guardian_ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            Bố mẹ: {consent?.guardian_ok ? "đã đồng ý" : "chưa"}
          </span>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${consent?.child_ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            Con: {consent?.child_ok ? "đã xác nhận" : "chưa"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!consent?.guardian_ok && (
            <button onClick={() => consentAs("guardian")} className={btn}>
              Bố mẹ đồng ý
            </button>
          )}
          {consent?.guardian_ok && !consent?.child_ok && (
            <p className="text-sm font-semibold text-amber-700">
              Còn thiếu bước của con: con đăng nhập bằng tài khoản của mình và bấm xác nhận — bố mẹ không
              bấm thay được.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
