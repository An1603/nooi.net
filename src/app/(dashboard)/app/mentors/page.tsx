"use client";

import { useState, useEffect } from "react";
import { Users, Star, Search, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Mentor {
  id: string;
  user_id: string;
  title: string;
  bio: string;
  specialties: string[];
  experience_years: number;
  rating: number;
  review_count: number;
  is_active: boolean;
  user_name?: string;
}

export default function MentorHub() {
  const [search, setSearch] = useState("");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [myMentor, setMyMentor] = useState<Mentor | null>(null);
  const [myGroup, setMyGroup] = useState<{ name: string; members: number; schedule: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("mentors").select("*").eq("is_active", true);
        if (data) {
          // Fetch user names from profiles
          const userIds = data.map((m) => m.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", userIds);
          const nameMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.full_name]));
          setMentors(data.map((m) => ({ ...m, user_name: nameMap[m.user_id] || "Mentor" })));
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = mentors.filter((m) =>
    m.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.title?.toLowerCase().includes(search.toLowerCase()) ||
    m.specialties?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const handleConnect = async (mentor: Mentor) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Vui lòng đăng nhập");
      
      const { error } = await supabase.from("mentor_relationships").insert({
        mentor_id: mentor.id,
        mentee_id: user.id,
        status: "active",
      });
      if (error) return alert(error.message);
      
      setMyMentor(mentor);
      setMyGroup({ name: `Nhóm "${mentor.user_name}"`, members: 12, schedule: "T2, T5 20:00" });
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentor Hub</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Kết nối với chuyên gia đồng hành cùng bạn</p>
        </div>
      </div>

      {/* Mentor của tôi */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Mentor của tôi</h2>
        </div>
        {myMentor ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
              {myMentor.user_name?.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium">{myMentor.user_name}</p>
              <p className="text-xs text-muted-foreground">{myMentor.title}</p>
            </div>
            <button className="text-xs bg-primary px-3 py-1.5 rounded-lg text-primary-foreground">📩 Nhắn tin</button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Bạn chưa có mentor. Hãy kết nối với một chuyên gia bên dưới!</p>
          </div>
        )}
      </div>

      {/* Nhóm của tôi */}
      {myGroup && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Nhóm của tôi</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{myGroup.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <Users className="w-3 h-3" /> {myGroup.members} thành viên
                <Clock className="w-3 h-3 ml-2" /> {myGroup.schedule}
              </p>
            </div>
            <button className="text-xs border border-border px-3 py-1.5 rounded-lg">💬 Vào nhóm</button>
          </div>
        </div>
      )}

      {/* Tìm mentor */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text" placeholder="Tìm mentor theo tên hoặc chuyên môn..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-b border-border pb-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-3">
          {filtered.map((mentor) => (
            <div key={mentor.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                  {mentor.user_name?.charAt(0) || "M"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{mentor.user_name || "Mentor"}</h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" /> {mentor.rating} ({mentor.review_count})
                    </span>
                  </div>
                  <p className="text-xs text-primary">{mentor.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">{mentor.bio}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {mentor.specialties?.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">{s}</span>
                    ))}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">{mentor.experience_years} năm KN</span>
                  </div>
                </div>
                <button onClick={() => handleConnect(mentor)}
                  className="shrink-0 text-sm bg-primary px-4 py-2 rounded-lg text-primary-foreground hover:bg-primary/80 transition-colors"
                >Kết nối</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}