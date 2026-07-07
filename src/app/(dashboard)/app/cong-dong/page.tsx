"use client";

import { useState, useEffect } from "react";
import { Users, MessageCircle, Plus, UserPlus, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  user_id: string;
  full_name: string;
  ref_code: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  schedule: string;
  member_count: number;
}

export default function CommunityPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myGroupIds, setMyGroupIds] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", schedule: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setMyUserId(user.id);

        // Lấy danh sách profiles (bạn học)
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, ref_code")
          .neq("user_id", user.id)
          .limit(20);
        if (profs) setProfiles(profs);

        // Lấy danh sách groups
        const { data: grps } = await supabase.from("groups_table").select("*").eq("is_active", true);
        if (grps) {
          // Đếm thành viên
          const withCounts = await Promise.all(
            grps.map(async (g) => {
              const { count } = await supabase
                .from("group_members")
                .select("id", { count: "exact", head: true })
                .eq("group_id", g.id);
              return { ...g, member_count: count ?? 0 };
            })
          );
          setGroups(withCounts);
        }

        // Lấy nhóm của tôi
        const { data: myGroups } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id);
        if (myGroups) setMyGroupIds(myGroups.map((g) => g.group_id));
      } catch {}
      setLoading(false);
    })();
  }, []);

  async function createGroup() {
    if (!newGroup.name.trim()) return;
    try {
      const supabase = createClient();
      const { data: grp } = await supabase
        .from("groups_table")
        .insert({
          name: newGroup.name,
          description: newGroup.description,
          schedule: newGroup.schedule,
          max_members: 20,
        })
        .select("id")
        .single();
      if (grp && myUserId) {
        await supabase.from("group_members").insert({
          group_id: grp.id,
          user_id: myUserId,
          role: "leader",
        });
      }
      setShowCreate(false);
      setNewGroup({ name: "", description: "", schedule: "" });
      window.location.reload();
    } catch {}
  }

  async function joinGroup(groupId: string) {
    if (!myUserId) return;
    try {
      const supabase = createClient();
      await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: myUserId,
        role: "member",
      });
      setMyGroupIds((prev) => [...prev, groupId]);
    } catch {}
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cộng đồng</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Kết nối với những người cùng hành trình</p>
        </div>
      </div>

      {/* Nhóm của tôi */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Nhóm của tôi</h2>
          <button onClick={() => setShowCreate(!showCreate)} className="text-xs text-primary hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Tạo nhóm
          </button>
        </div>

        {showCreate && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3 mb-4">
            <input value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              placeholder="Tên nhóm" className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm" />
            <input value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              placeholder="Mô tả" className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm" />
            <input value={newGroup.schedule} onChange={(e) => setNewGroup({ ...newGroup, schedule: e.target.value })}
              placeholder="Lịch (VD: T2, T5 20:00)" className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm" />
            <button onClick={createGroup} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm">Tạo</button>
          </div>
        )}

        {groups.filter((g) => myGroupIds.includes(g.id)).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Bạn chưa tham gia nhóm nào.</p>
        )}
        <div className="space-y-2">
          {groups.filter((g) => myGroupIds.includes(g.id)).map((g) => (
            <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
              <div>
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-2"><Users className="w-3 h-3" /> {g.member_count} thành viên</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{g.schedule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Khám phá nhóm */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-sm mb-4">Khám phá nhóm</h2>
        <div className="space-y-3">
          {groups.filter((g) => !myGroupIds.includes(g.id)).map((g) => (
            <div key={g.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div className="flex-1">
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  <Users className="w-3 h-3 inline" /> {g.member_count} · {g.schedule}
                </p>
              </div>
              <button onClick={() => joinGroup(g.id)} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20">
                <UserPlus className="w-3 h-3 inline mr-1" /> Tham gia
              </button>
            </div>
          ))}
          {groups.filter((g) => !myGroupIds.includes(g.id)).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Chưa có nhóm nào.</p>
          )}
        </div>
      </div>

      {/* Bạn học */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-sm mb-4">Bạn học cùng hành trình</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {profiles.slice(0, 9).map((p) => (
            <div key={p.user_id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {p.full_name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{p.full_name || "Người dùng"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{p.ref_code || ""}</p>
              </div>
            </div>
          ))}
        </div>
        {profiles.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Chưa có bạn học nào.</p>}
      </div>
    </div>
  );
}
