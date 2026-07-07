"use client";

import { useState, useEffect } from "react";
import { Video, Calendar, Clock, User, Users, Plus, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LiveSession {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  mentor_name: string;
  link: string;
  max_participants: number;
  registered: number;
  is_registered?: boolean;
}

export default function LivePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", link: "", max_participants: 20 });
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setMyUserId(user.id);

        // Lấy danh sách buổi học
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
              max_participants: c.max_participants || 20,
              registered: c.registered || 0,
              is_registered: false,
            };
          }));
        }

        // Lấy đăng ký của tôi
        const { data: myReg } = await supabase
          .from("documents")
          .select("title")
          .eq("user_id", user.id)
          .eq("file_type", "live_registration");
        if (myReg) setRegisteredIds(myReg.map((r) => r.title));
      } catch {}
    })();
  }, []);

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
          link: form.link || "https://zoom.us/j/",
          mentor_name: "NOOI Mentor",
          max_participants: Number(form.max_participants),
          registered: 0,
        }),
        file_type: "live_session",
      });
      setShowForm(false);
      setForm({ title: "", description: "", date: "", time: "", link: "", max_participants: 20 });
      window.location.reload();
    } catch {}
  }

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
      }
    } catch {}
  }

  const upcoming = sessions.filter((s) => s.date >= new Date().toISOString().split("T")[0]);
  const past = sessions.filter((s) => s.date < new Date().toISOString().split("T")[0]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
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
        <button onClick={() => setShowForm(!showForm)} className="text-sm bg-primary px-4 py-2 rounded-lg text-primary-foreground flex items-center gap-1">
          <Plus className="w-4 h-4" /> Tạo buổi học
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tiêu đề buổi học" className="w-full px-3 py-2 rounded-lg bg-muted/20 border border-border text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả" className="w-full px-3 py-2 rounded-lg bg-muted/20 border border-border text-sm resize-none" rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-3 py-2 rounded-lg bg-muted/20 border border-border text-sm" />
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="px-3 py-2 rounded-lg bg-muted/20 border border-border text-sm" />
          </div>
          <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="Link Zoom/Meet" className="w-full px-3 py-2 rounded-lg bg-muted/20 border border-border text-sm" />
          <button onClick={createSession} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm">Tạo</button>
        </div>
      )}

      {/* Upcoming */}
      <div>
        <h2 className="text-sm font-semibold mb-4">Sắp diễn ra</h2>
        {upcoming.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Video className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Chưa có buổi học nào.</p>
          </div>
        )}
        <div className="space-y-3">
          {upcoming.map((s) => {
            const isRegistered = registeredIds.includes(s.id);
            return (
              <div key={s.id} className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Sắp tới</span>
                    </div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {s.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.time}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {s.mentor_name}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {s.registered}/{s.max_participants}</span>
                    </div>
                  </div>
                  <div className="shrink-0 ml-4">
                    {isRegistered ? (
                      <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Đã đăng ký</span>
                    ) : (
                      <button onClick={() => register(s.id)} className="text-sm bg-primary px-4 py-2 rounded-lg text-primary-foreground">
                        Đăng ký
                      </button>
                    )}
                    {isRegistered && s.link && (
                      <a href={s.link} target="_blank" rel="noreferrer" className="block text-center text-xs text-primary hover:underline mt-2">
                        Vào phòng học →
                      </a>
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
          <h2 className="text-sm font-semibold mb-4">Đã qua</h2>
          <div className="space-y-2">
            {past.map((s) => (
              <div key={s.id} className="rounded-lg border border-border/50 bg-card/50 p-4 opacity-70">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">Đã kết thúc</span>
                  <h3 className="text-sm font-medium">{s.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.date} · {s.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
