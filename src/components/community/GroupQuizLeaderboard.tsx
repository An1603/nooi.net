"use client";

import { useState, useEffect } from "react";
import { Trophy, Users, Zap, Loader2, Crown, Medal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface GroupScore {
  user_id: string;
  name: string;
  score: number;
  level: number;
  rank: number;
}

export default function GroupQuizLeaderboard({ groupId }: { groupId?: string }) {
  const [scores, setScores] = useState<GroupScore[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(groupId);
  const [myGroups, setMyGroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setMyUserId(user.id);

        // Get my groups
        const { data: memberships } = await supabase
          .from("group_members")
          .select("group_id, groups_table(name)")
          .eq("user_id", user.id);

        if (memberships && memberships.length > 0) {
          const groups = memberships.map((m: Record<string, unknown>) => {
            const gt = m.groups_table as Record<string, unknown> | null;
            return { id: m.group_id as string, name: (gt?.name as string) || "Nhóm" };
          });
          setMyGroups(groups);
          if (!selectedGroup) setSelectedGroup(groups[0].id);
        }
      } catch {}
      setLoading(false);
    })();
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroup) return;
    (async () => {
      try {
        const supabase = createClient();

        // Get group members
        const { data: members } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", selectedGroup);

        if (!members || members.length === 0) { setScores([]); return; }

        const userIds = members.map(m => m.user_id);

        // Get practice scores for group members
        const { data: practices } = await supabase
          .from("documents")
          .select("user_id, content")
          .eq("file_type", "practice")
          .in("user_id", userIds);

        // Get journal counts for level calculation
        const { data: journals } = await supabase
          .from("documents")
          .select("user_id")
          .eq("file_type", "journal")
          .in("user_id", userIds);

        const journalCounts: Record<string, number> = {};
        journals?.forEach(j => { journalCounts[j.user_id] = (journalCounts[j.user_id] || 0) + 1; });

        // Get names
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        const nameMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.full_name || "Người dùng"]));

        // Calculate scores
        const scoreMap: Record<string, number> = {};
        practices?.forEach(p => {
          const content = JSON.parse(p.content || "{}");
          scoreMap[p.user_id] = (scoreMap[p.user_id] || 0) + (content.score || 0);
        });

        const thresholds = [0, 100, 300, 700, 1200, 2200, 3500];
        const leaderboard = userIds.map(uid => {
          const n = (journalCounts[uid] || 0) * 10;
          let lvl = 1;
          for (let i = thresholds.length - 1; i >= 0; i--) { if (n >= thresholds[i]) { lvl = i + 1; break; } }
          return {
            user_id: uid,
            name: nameMap[uid] || "Người dùng",
            score: scoreMap[uid] || 0,
            level: lvl,
            rank: 0,
          };
        }).sort((a, b) => b.score - a.score);

        leaderboard.forEach((entry, i) => { entry.rank = i + 1; });
        setScores(leaderboard);
      } catch {}
    })();
  }, [selectedGroup]);

  const levelIcons = ["🌰", "🌱", "🌿", "🌳", "🌲", "🌳", "👑"];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="font-semibold text-sm">Bảng xếp hạng nhóm</h2>
        </div>
        {myGroups.length > 1 && (
          <select
            value={selectedGroup || ""}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="text-xs bg-muted/20 border border-border rounded-lg px-2 py-1"
          >
            {myGroups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : myGroups.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Bạn chưa tham gia nhóm nào</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Tham gia nhóm để thi đua cùng bạn bè</p>
        </div>
      ) : scores.length === 0 ? (
        <div className="text-center py-8">
          <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Chưa có dữ liệu thi đua</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scores.map((s) => (
            <div
              key={s.user_id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                s.user_id === myUserId
                  ? "bg-primary/5 border border-primary/15"
                  : "bg-muted/10"
              }`}
            >
              {/* Rank */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                s.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                s.rank === 2 ? "bg-gray-400/20 text-gray-300" :
                s.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                "bg-muted/20 text-muted-foreground"
              }`}>
                {s.rank === 1 ? <Crown className="w-4 h-4" /> :
                 s.rank === 2 ? <Medal className="w-4 h-4" /> :
                 s.rank}
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {s.name}
                    {s.user_id === myUserId && <span className="text-[11px] text-primary ml-1">(Bạn)</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {levelIcons[s.level - 1]} Lv.{s.level}
                  </p>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{s.score}</p>
                <p className="text-[11px] text-muted-foreground">điểm</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
