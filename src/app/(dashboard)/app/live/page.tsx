"use client";

import { useState, useEffect, useCallback } from "react";
import { Video, Calendar, Clock, User, Users, Plus, CheckCircle, Lock, Copy, Bell, Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Countdown Timer Component ───────────────────────────────────────────────
function CountdownTimer({ target }: { target: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const targetMs = new Date(target).getTime();
    function tick() {
      const diff = targetMs - Date.now();
      if (diff <= 0) { setRemaining("Đang diễn ra"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}g ${m}p ${s}s` : `${m}p ${s}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return <span className="text-[10px] font-mono tabular-nums">{remaining}</span>;
}

// ─── ICS Generator ────────────────────────────────────────────────────────────
function generateICS({ title, description, date, time }: { title: string; description: string; date: string; time: string }) {
  const dtStart = `${date.replace(/-/g, "")}T${time.replace(/:/g, "")}00`;
  const endDate = new Date(`${date}T${time}`);
  endDate.setHours(endDate.getHours() + 1);
  const dtEnd = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "00";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NOOI//Live Class//VN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Nhắc nhở: Buổi học sắp bắt đầu!",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function genMeetingId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) id += chars[Math.floor(Math.random() * chars.length)];
    if (i < 3) id += "-";
  }
  return id; // e.g. "X7K-Q9N-T4B-L2P"
}

function genPassword() {
  const n = Math.floor(Math.random() * 900000) + 100000;
  return String(n); // 6-digit numeric
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface LiveSession {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  mentor_name: string;
  link: string;
  meeting_id: string;
  password: string;
  max_participants: number;
  registered: number;
  is_registered?: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LivePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", date: "", time: "",
    link: "", meeting_id: genMeetingId(), password: genPassword(), max_participants: 20,
  });
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [userLevel, setUserLevel] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [reminderSending, setReminderSending] = useState<string | null>(null);
  const [hasTelegram, setHasTelegram] = useState(false);
  const isMentor = userLevel >= 6;

  const showNotif = useCallback((type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // ── Load data ──
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setMyUserId(user.id);

        // Level từ journal count
        const { count } = await supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("file_type", "journal");
        const n = (count ?? 0) * 10;
        const thresholds = [0, 100, 300, 700, 1200, 2200, 3500];
        let lvl = 1;
        for (let i = thresholds.length - 1; i >= 0; i--) {
          if (n >= thresholds[i]) { lvl = i + 1; break; }
        }
        setUserLevel(lvl);

        // Danh sách buổi học
        const { data } = await supabase
          .from("documents")
          .select("*")
          .eq("file_type", "live_session")
          .order("created_at", { ascending: false });
        if (data) {
          setSessions(data.map((d) => {
            const c = JSON.parse(d.content || "{}");
            return {
              id: d.id,
              title: d.title,
              description: c.description || "",
              date: c.date || "",
              time: c.time || "",
              mentor_name: c.mentor_name || "NOOI",
              link: c.link || "",
              meeting_id: c.meeting_id || "",
              password: c.password || "",
              max_participants: c.max_participants || 20,
              registered: c.registered || 0,
              is_registered: false,
            };
          }));
        }

        // Đăng ký của tôi
        const { data: myReg } = await supabase
          .from("documents")
          .select("title")
          .eq("user_id", user.id)
          .eq("file_type", "live_registration");
        if (myReg) setRegisteredIds(myReg.map((r) => r.title));

        // Kiểm tra đã kết nối Telegram chưa
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("telegram_chat_id")
          .eq("user_id", user.id)
          .maybeSingle();
        setHasTelegram(!!myProfile?.telegram_chat_id);
      } catch {}
    })();
  }, []);

  // ── Tạo buổi học ──
  async function createSession() {
    if (!form.title || !form.date || !form.time) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("documents").insert({
        user_id: user?.id,
        title: form.title,
        content: JSON.stringify({
          description: form.description,
          date: form.date,
          time: form.time,
          link: form.link || "",
          meeting_id: form.meeting_id,
          password: form.password,
          mentor_name: user?.email?.split("@")[0] || "NOOI Mentor",
          max_participants: Number(form.max_participants),
          registered: 0,
        }),
        file_type: "live_session",
      });
      setShowForm(false);
      setForm({ title: "", description: "", date: "", time: "", link: "", meeting_id: genMeetingId(), password: genPassword(), max_participants: 20 });
      showNotif("success", "✅ Đã tạo buổi học thành công!");
      window.location.reload();
    } catch {
      showNotif("error", "❌ Lỗi khi tạo buổi học");
    }
  }

  // ── Đăng ký ──
  async function register(sessionId: string) {
    if (!myUserId) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("documents").insert({
        user_id: myUserId,
        title: sessionId,
        content: JSON.stringify({ registered_at: new Date().toISOString() }),
        file_type: "live_registration",
      });
      if (!error) {
        setRegisteredIds((prev) => [...prev, sessionId]);
        showNotif("success", "🎉 Đã đăng ký thành công! Kiểm tra thông tin phòng học bên dưới.");
      }
    } catch {}
  }

  // ── Gửi nhắc nhở Telegram ──
  async function sendReminder(sessionId: string) {
    setReminderSending(sessionId);
    try {
      const res = await fetch("/api/telegram/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi gửi nhắc nhở");
      showNotif("success", `🔔 Đã gửi nhắc nhở đến ${data.sent} người!`);
    } catch (err) {
      showNotif("error", `❌ ${err instanceof Error ? err.message : "Lỗi gửi nhắc nhở"}`);
    } finally {
      setReminderSending(null);
    }
  }

  // ── Copy text ──
  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().split(":").slice(0, 2).join(":");

  const upcoming = sessions.filter((s) => s.date > today || (s.date === today && s.time >= currentTime));
  const past = sessions.filter((s) => s.date < today || (s.date === today && s.time < currentTime));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Toast notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right
          ${notification.type === "success" ? "bg-green-900/80 text-green-200 border border-green-700" : "bg-red-900/80 text-red-200 border border-red-700"}`}>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lớp học Live</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Học trực tiếp với mentor qua Zoom</p>
          </div>
        </div>
        {isMentor && (
          <button onClick={() => setShowForm(!showForm)} className="text-sm bg-primary px-4 py-2 rounded-lg text-primary-foreground flex items-center gap-1 hover:brightness-110 transition-all">
            <Plus className="w-4 h-4" /> Tạo buổi học
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-in fade-in">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tiêu đề buổi học *" className="w-full px-3 py-2.5 rounded-lg bg-muted/20 border border-border text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả nội dung buổi học" className="w-full px-3 py-2.5 rounded-lg bg-muted/20 border border-border text-sm resize-none" rows={2} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-3 py-2.5 rounded-lg bg-muted/20 border border-border text-sm" />
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="px-3 py-2.5 rounded-lg bg-muted/20 border border-border text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="Link Zoom/Meet" className="px-3 py-2.5 rounded-lg bg-muted/20 border border-border text-sm" />
            <input value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: Number(e.target.value) })} type="number" min={2} max={100} className="px-3 py-2.5 rounded-lg bg-muted/20 border border-border text-sm" />
          </div>
          {/* Meeting info auto-generated */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">ID:</span>
              <input value={form.meeting_id} onChange={(e) => setForm({ ...form, meeting_id: e.target.value })} className="w-full px-9 py-2.5 rounded-lg bg-muted/20 border border-border text-sm font-mono tracking-wider" />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">🔑</span>
              <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-9 py-2.5 rounded-lg bg-muted/20 border border-border text-sm font-mono" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>🔄 ID & mã đã tự động tạo — click vào để sửa</span>
          </div>
          <div className="flex gap-2">
            <button onClick={createSession} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm flex-1 font-medium hover:brightness-110 transition-all">Tạo buổi học</button>
            <button onClick={() => {
              const methods = ["zoom", "google_meet", "zalo", "telegram"];
              const method = methods[Math.floor(Math.random() * methods.length)];
              // Placeholder — user paste link sau
            }} className="bg-muted/30 text-muted-foreground px-3 py-2.5 rounded-lg text-xs border border-border">🔄 Tạo ID mới</button>
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div>
        <h2 className="text-sm font-semibold mb-4">
          Sắp diễn ra
          {upcoming.length > 0 && <span className="text-muted-foreground font-normal ml-2">({upcoming.length})</span>}
        </h2>
        {upcoming.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Video className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Chưa có buổi học nào sắp tới.</p>
          </div>
        )}
        <div className="space-y-3">
          {upcoming.map((s) => {
            const isRegistered = registeredIds.includes(s.id);
            const icsUrl = generateICS({ title: s.title, description: s.description, date: s.date, time: s.time });
            return (
              <div key={s.id} className={`rounded-xl border ${isRegistered ? "border-primary/30 bg-primary/5" : "border-border bg-card"} p-5 transition-all hover:shadow-md`}>
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Sắp tới</span>
                      <CountdownTimer target={`${s.date}T${s.time}:00`} />
                      {isRegistered && (
                        <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Đã đăng ký</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-base">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>

                    {/* Thông tin chi tiết — stack trên mobile */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {s.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.time}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {s.mentor_name}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {s.registered}/{s.max_participants}</span>
                      {s.meeting_id && (
                        <span className="flex items-center gap-1 font-mono text-[10px] opacity-60 col-span-2">ID: {s.meeting_id}</span>
                      )}
                    </div>

                    {/* Nếu đã đăng ký: thông tin phòng + password */}
                    {isRegistered && s.link && (
                      <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-primary flex items-center gap-1"><Lock className="w-3 h-3" /> Thông tin phòng học</span>
                          <div className="flex gap-2">
                            <a href={icsUrl} download={`nooi-${s.meeting_id || "live"}.ics`} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                              <Calendar className="w-3 h-3" /> Thêm vào lịch
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Link:</span>
                          <a href={s.link} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate flex-1">{s.link}</a>
                          <button onClick={() => copyText(s.link, `link-${s.id}`)} className="text-muted-foreground hover:text-primary shrink-0">
                            {copiedId === `link-${s.id}` ? <span className="text-green-400">✓</span> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        {s.password && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Mật khẩu:</span>
                            <code className="bg-muted/30 px-2 py-0.5 rounded text-sm font-mono tracking-wider">{s.password}</code>
                            <button onClick={() => copyText(s.password, `pw-${s.id}`)} className="text-muted-foreground hover:text-primary shrink-0">
                              {copiedId === `pw-${s.id}` ? <span className="text-green-400">✓</span> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                        <a href={s.link} target="_blank" rel="noreferrer" className="block text-center mt-2 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:brightness-110 transition-all">
                          🎥 Vào phòng học
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right: Action */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {!isRegistered && (
                      <button onClick={() => register(s.id)} className="text-sm bg-primary px-5 py-2 rounded-lg text-primary-foreground font-medium hover:brightness-110 transition-all">
                        Đăng ký
                      </button>
                    )}
                    {!isRegistered && (
                      <button
                        onClick={() => {
                          if (hasTelegram) {
                            sendReminder(s.id);
                          } else {
                            showNotif("error", "❌ Bạn chưa kết nối Telegram. Vào Cài đặt để kết nối.");
                          }
                        }}
                        disabled={reminderSending === s.id}
                        className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 disabled:opacity-50"
                      >
                        {reminderSending === s.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Bell className="w-3 h-3" />
                        )}
                        Nhắc tôi
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-4">Đã qua ({past.length})</h2>
          <div className="space-y-2">
            {past.map((s) => (
              <div key={s.id} className="rounded-lg border border-border/50 bg-card/50 p-4 opacity-70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground shrink-0">Đã kết thúc</span>
                    <h3 className="text-sm font-medium truncate">{s.title}</h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{s.date} · {s.time}</span>
                </div>
                {s.registered > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">{s.registered} học viên đã tham gia</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
