"use client";

import { useState, useEffect } from "react";
import { Users, Plus, UserPlus, Shield, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CommunityLeaderboard from "@/components/community/CommunityLeaderboard";
import BuddyWidget from "@/components/community/BuddyWidget";
import GroupQuizLeaderboard from "@/components/community/GroupQuizLeaderboard";

interface Group {
  id: string; name: string; description: string; schedule: string; member_count: number;
}

const LEVEL_NAMES = ["", "🌰 Member", "Seeker 🌱", "Grower 🌿", "Giver 🌳", "Guider 🌲", "Mentor 🌳", "Master 👑"];

function getLevel(userId: string, journalCounts: Record<string, number>) {
  const n = (journalCounts[userId] || 0) * 10;
  const t = [0, 100, 300, 700, 1200, 2200, 3500];
  for (let i = t.length - 1; i >= 0; i--) if (n >= t[i]) return i + 1;
  return 1;
}

export default function CommunityPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myGroupIds, setMyGroupIds] = useState<string[]>([]);
  const [myLevel, setMyLevel] = useState(1);
  const [allUsers, setAllUsers] = useState<{ user_id: string; name: string; level: number }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", schedule: "" });
  const [addingTo, setAddingTo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setMyUserId(user.id);

        // Lấy journal counts để tính level
        const { data: journals } = await supabase.from("documents").select("user_id").eq("file_type", "journal");
        const counts: Record<string, number> = {};
        journals?.forEach((j) => { counts[j.user_id] = (counts[j.user_id] || 0) + 1; });
        setMyLevel(getLevel(user.id, counts));

        // Lấy danh sách users (trừ tôi)
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name").neq("user_id", user.id);
        if (profs) setAllUsers(profs.map((p) => ({ user_id: p.user_id, name: p.full_name || "Người dùng", level: getLevel(p.user_id, counts) })));

        // Lấy groups
        const { data: grps } = await supabase.from("groups_table").select("*").eq("is_active", true);
        if (grps) {
          const withCounts = await Promise.all(grps.map(async (g) => {
            const { count } = await supabase.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", g.id);
            return { ...g, member_count: count ?? 0 };
          }));
          setGroups(withCounts);
        }

        // Nhóm của tôi
        const { data: myGroups } = await supabase.from("group_members").select("group_id").eq("user_id", user.id);
        if (myGroups) setMyGroupIds(myGroups.map((g) => g.group_id));
      } catch {}
    })();
  }, []);

  async function createGroup() {
    if (!newGroup.name.trim()) return;
    try {
      const supabase = createClient();
      const { data: grp } = await supabase.from("groups_table").insert({ name: newGroup.name, description: newGroup.description, schedule: newGroup.schedule, max_members: 20 }).select("id").single();
      if (grp && myUserId) {
        await supabase.from("group_members").insert({ group_id: grp.id, user_id: myUserId, role: "leader" });
      }
      setShowCreate(false);
      setNewGroup({ name: "", description: "", schedule: "" });
      window.location.reload();
    } catch {}
  }

  async function addMember(groupId: string, targetUserId: string) {
    if (!myUserId) return;
    try {
      const supabase = createClient();
      const targetUser = allUsers.find((u) => u.user_id === targetUserId);
      // Guider (Lv5): add được cấp 1-4. Mentor (Lv6)+: chỉ add được cấp kế cận
      const isEligible = myLevel === 5 ? targetUser && targetUser.level >= 1 && targetUser.level <= 4 : targetUser && targetUser.level === myLevel - 1;
      if (!isEligible) return alert("Chỉ có thể thêm cấp dưới kế cận! Xem quy tắc nhóm ở trên.");
      await supabase.from("group_members").insert({ group_id: groupId, user_id: targetUserId, role: "member" });
      setMyGroupIds((prev) => [...prev, groupId]);
      alert(`✅ Đã thêm ${targetUser!.name} vào nhóm!`);
    } catch {}
  }

  const canManage = myLevel >= 5;
  const eligibleUsers = allUsers.filter((u) => {
    if (myLevel === 5) return u.level >= 1 && u.level <= 4; // Guider: add tất cả cấp dưới
    return u.level === myLevel - 1; // Mentor/Master: chỉ kế cận
  });

  return (
    <div className="page-shell page-shell-wide space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cộng đồng tu học</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Cùng nhau thực hành và chuyển hóa</p>
        </div>
      </div>

      {/* Bạn đồng hành */}
      <BuddyWidget />

      {/* Hướng dẫn cấp độ nhóm */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-amber-400">🛡️ Quy tắc nhóm học tập</h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>🌲 Guider (Lv5)</strong> — tạo nhóm, add được cấp 1→4</p>
          <p>• <strong>🌳 Mentor (Lv6)</strong> — add được cấp 5 (kế cận dưới)</p>
          <p>• <strong>👑 Master (Lv7)</strong> — add được cấp 6 (kế cận dưới)</p>
          <p>• <strong>Cấp dưới được cấp trên chủ động add</strong> — không tự yêu cầu vào nhóm</p>
          {myLevel < 5 && <p className="text-amber-400/80 mt-2">🔒 Bạn cần đạt <strong>Guider (Lv5)</strong> để tạo nhóm. Hiện tại bạn đang ở {LEVEL_NAMES[myLevel]}.</p>}
        </div>
      </div>

      {/* Nhóm của tôi */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Nhóm của tôi</h2>
          {canManage && (
            <button onClick={() => setShowCreate(!showCreate)} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Tạo nhóm
            </button>
          )}
        </div>
        {showCreate && canManage && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3 mb-4">
            <input value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="Tên nhóm" className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm" />
            <input value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })} placeholder="Mô tả" className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm" />
            <input value={newGroup.schedule} onChange={(e) => setNewGroup({ ...newGroup, schedule: e.target.value })} placeholder="Lịch (VD: T2, T5 20:00)" className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm" />
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
                <p className="text-[12px] text-muted-foreground"><Users className="w-3 h-3 inline" /> {g.member_count} thành viên</p>
              </div>
              {canManage && (
                <div className="relative">
                  <button onClick={() => setAddingTo(addingTo === g.id ? null : g.id)} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Thêm
                  </button>
                  {addingTo === g.id && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-card border border-border rounded-xl shadow-2xl z-10 p-2 max-h-48 overflow-y-auto">
                      <p className="text-[12px] text-muted-foreground px-2 py-1">Chọn user cấp thấp hơn để thêm:</p>
                      {eligibleUsers.map((u) => (
                        <button key={u.user_id} onClick={() => addMember(g.id, u.user_id)}
                          className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-muted/20 text-xs">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-bold">{u.name.charAt(0)}</span>
                          <span className="flex-1">{u.name}</span>
                          <span className="text-muted-foreground">Lv.{u.level}</span>
                        </button>
                      ))}
                      {eligibleUsers.length === 0 && <p className="text-xs text-muted-foreground p-2">Không có user nào có cấp thấp hơn.</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Khám phá nhóm (chỉ xem, không tự vào được) */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-sm mb-4">Các nhóm tu học</h2>
        <div className="space-y-3">
          {groups.filter((g) => !myGroupIds.includes(g.id)).map((g) => (
            <div key={g.id} className="p-4 rounded-lg border border-border/50">
              <p className="text-sm font-medium">{g.name}</p>
              <p className="text-xs text-muted-foreground">{g.description}</p>
              <p className="text-[12px] text-muted-foreground mt-1"><Users className="w-3 h-3 inline" /> {g.member_count} thành viên · {g.schedule}</p>
              {canManage && (
                <div className="relative mt-2">
                  <button onClick={() => setAddingTo(addingTo === g.id ? null : g.id)} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Thêm thành viên
                  </button>
                  {addingTo === g.id && (
                    <div className="absolute left-0 top-full mt-1 w-64 bg-card border border-border rounded-xl shadow-2xl z-10 p-2 max-h-48 overflow-y-auto">
                      {eligibleUsers.map((u) => (
                        <button key={u.user_id} onClick={() => addMember(g.id, u.user_id)}
                          className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-muted/20 text-xs">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-bold">{u.name.charAt(0)}</span>
                          <span className="flex-1">{u.name}</span>
                          <span className="text-muted-foreground">Lv.{u.level}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {groups.filter((g) => !myGroupIds.includes(g.id)).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Tất cả nhóm đã tham gia hoặc chưa có nhóm nào.</p>
          )}
        </div>
      </div>

      {/* Bạn học */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-sm mb-4">Cộng đồng tu học</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
          {allUsers.slice(0, 12).map((u) => (
            <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{u.name.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{u.name}</p>
                <p className="text-[12px] text-muted-foreground">Lv.{u.level} {LEVEL_NAMES[u.level]}</p>
              </div>
              <Shield className={`w-3 h-3 ${u.level >= 5 ? "text-primary" : "text-muted-foreground/30"}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Thi đua nhóm */}
      <GroupQuizLeaderboard />

      {/* Bảng xếp hạng */}
      <CommunityLeaderboard />
    </div>
  );
}
