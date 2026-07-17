"use client";

import { useState, useEffect } from "react";
import { Users, Star, Search, Award, BookOpen, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Mentor {
  id: string;
  full_name: string;
  level: number;
  level_name: string;
  journals: number;
  n: number;
}

export default function MentorHub() {
  const [search, setSearch] = useState("");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [myLevel, setMyLevel] = useState(0);
  const [myName, setMyName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch mentors (users level 6+)
        const res = await fetch("/api/mentors");
        const data = await res.json();
        setMentors(data.mentors || []);

        // Get current user's level
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase
            .from("documents")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id).eq("file_type", "journal");
          const n = (count ?? 0) * 10;
          const thresholds = [0, 100, 300, 700, 1200, 2200, 3500];
          let lvl = 1;
          for (let i = thresholds.length - 1; i >= 0; i--) {
            if (n >= thresholds[i]) { lvl = i + 1; break; }
          }
          setMyLevel(lvl);
          const { data: profile } = await supabase
            .from("profiles").select("full_name").eq("user_id", user.id).single();
          setMyName(profile?.full_name || "");
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = mentors.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.level_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = async (mentor: Mentor) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Vui lòng đăng nhập");

      // Save mentor relationship
      const { error } = await supabase.from("mentor_relationships").insert({
        mentor_id: mentor.id,
        mentee_id: user.id,
        status: "active",
      });
      if (error) return alert(error.message);
      alert(`✅ Đã kết nối với ${mentor.full_name}!`);
    } catch {}
  };

  const isMentor = myLevel >= 6;

  return (
    <div className="page-shell page-shell-wide space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentor Hub</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Kết nối với những người đã đạt cấp Mentor (Level 6+)
          </p>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-green-400">🌟 Cách thức kết nối Mentor</h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>Mentor = Level 6+</strong> — bất kỳ ai đạt 2200N đều là Mentor</p>
          <p>• <strong>Kết nối trực tiếp</strong> — chọn Mentor phù hợp và nhấn &ldquo;Kết nối&rdquo;</p>
          <p>• <strong>Mentor đồng hành</strong> — sau khi kết nối, Mentor sẽ hỗ trợ bạn trên hành trình</p>
          {myLevel >= 6 && <p className="text-green-400/80 mt-2">✅ Bạn đã là Mentor! Hãy sẵn sàng đồng hành cùng học viên.</p>}
        </div>
      </div>

      {/* Your mentor status */}
      <div className={`rounded-xl border p-5 ${isMentor ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}>
        <div className="flex items-center gap-2 mb-3">
          <Star className={`w-5 h-5 ${isMentor ? "text-primary" : "text-muted-foreground"}`} />
          <h2 className="font-semibold">{isMentor ? "Bạn là Mentor!" : "Trở thành Mentor"}</h2>
        </div>
        {isMentor ? (
          <p className="text-sm text-muted-foreground">
            🎉 Chúc mừng! Bạn đã đạt cấp <strong className="text-primary">Mentor (Level {myLevel})</strong>.
            Hãy đồng hành và hướng dẫn những người khác trên hành trình chuyển hóa.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Bất kỳ ai cũng có thể trở thành Mentor! Chỉ cần đạt <strong>Level 6</strong> (2.200 N).
              Mỗi nhật ký = 10 N.
            </p>
            {myLevel > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> Cấp hiện tại: Level {myLevel}</span>
                {myLevel < 6 && (
                  <span className="text-muted-foreground">Cần thêm {(6 - myLevel) * 500 - (myLevel > 0 ? 0 : 0)} N nữa</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text" placeholder="Tìm mentor theo tên hoặc cấp bậc..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-b border-border pb-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-muted-foreground shrink-0">{filtered.length} mentor</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-8"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <Award className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {mentors.length === 0
                ? "Chưa có ai đạt cấp Mentor. Hãy là người đầu tiên!"
                : "Không tìm thấy mentor phù hợp."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((mentor) => (
              <div key={mentor.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${
                    mentor.level >= 7 ? "bg-purple-500/10 text-purple-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {mentor.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{mentor.full_name}</h3>
                      <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${
                        mentor.level >= 7 ? "bg-purple-500/10 text-purple-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {mentor.level === 7 ? "👑 Master" : "⭐ Mentor 🌳"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {mentor.journals} nhật ký</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {mentor.n} N</span>
                    </div>
                  </div>
                  <button onClick={() => handleConnect(mentor)}
                    className="shrink-0 text-sm bg-primary px-4 py-2 rounded-lg text-primary-foreground hover:brightness-110 transition-all"
                  >Kết nối</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
