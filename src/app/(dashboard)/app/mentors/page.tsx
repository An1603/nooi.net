"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Star, MessageCircle, ChevronRight, Search, UserPlus, CheckCircle, Clock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Data mẫu ───────────────────────────────────────────────────────────────

const SAMPLE_MENTORS = [
  {
    id: "m1", name: "Nguyễn Văn An", title: "Chuyên gia Thiền & Khí công",
    specialties: ["Thiền Vipassana", "Khí công dưỡng sinh", "Chánh niệm"],
    rating: 4.8, reviews: 20, experience: 5,
    bio: "Tôi đồng hành cùng bạn trên hành trình tĩnh lặng giữa cuộc sống hiện đại.",
    available: true,
  },
  {
    id: "m2", name: "Trần Thị Bích", title: "Chuyên gia Tâm lý học",
    specialties: ["Tâm lý học", "NLP", "Tham vấn"],
    rating: 4.9, reviews: 35, experience: 8,
    bio: "Giúp bạn thấu hiểu cảm xúc và xây dựng đời sống nội tâm vững mạnh.",
    available: true,
  },
  {
    id: "m3", name: "Lê Minh Cường", title: "Huấn luyện Thiền & Yoga",
    specialties: ["Yoga", "Thiền", "Dinh dưỡng"],
    rating: 4.7, reviews: 15, experience: 3,
    bio: "Kết nối thân-tâm qua thực hành thể chất và tĩnh tâm.",
    available: false,
  },
];

export default function MentorHub() {
  const [search, setSearch] = useState("");
  const [myMentor, setMyMentor] = useState<typeof SAMPLE_MENTORS[0] | null>(null);
  const [myGroup, setMyGroup] = useState<{ name: string; members: number; schedule: string } | null>(null);
  const [pending, setPending] = useState(false);

  const filtered = SAMPLE_MENTORS.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

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
              {myMentor.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium">{myMentor.name}</p>
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
                  {mentor.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{mentor.name}</h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" /> {mentor.rating} ({mentor.reviews})
                    </span>
                  </div>
                  <p className="text-xs text-primary">{mentor.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">{mentor.bio}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {mentor.specialties.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">{s}</span>
                    ))}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">{mentor.experience} năm KN</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!mentor.available) return;
                    setPending(true);
                    setTimeout(() => {
                      setMyMentor(mentor);
                      setMyGroup({ name: `Nhóm "${mentor.name}"`, members: 12, schedule: "T2, T5 20:00" });
                      setPending(false);
                    }, 1000);
                  }}
                  disabled={!mentor.available || pending}
                  className="shrink-0 text-sm bg-primary px-4 py-2 rounded-lg text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
                >
                  {pending ? "Đang gửi..." : mentor.available ? "Kết nối" : "Tạm đầy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}