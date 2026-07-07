import { createAdminClient } from "@/lib/supabase/admin";
import { Users2, User, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

interface GroupWithMeta {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  is_active: boolean | null;
  creator_name: string;
  member_count: number;
}

async function getGroups(): Promise<GroupWithMeta[]> {
  const supabase = createAdminClient();

  // Fetch all groups ordered by creation date
  const { data: groups } = await supabase
    .from("groups_table")
    .select("*")
    .order("created_at", { ascending: false });

  if (!groups || groups.length === 0) return [];

  // Deduplicate creator IDs and fetch their profiles
  const creatorIds = [...new Set<string>(groups.map((g) => g.created_by))];

  const { data: creators } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", creatorIds);

  const creatorMap = new Map(
    creators?.map((c) => [c.user_id, c.full_name]) ?? []
  );

  // Count members for each group
  const groupsWithCounts = await Promise.all(
    groups.map(async (g) => {
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", g.id);

      return {
        ...g,
        creator_name: creatorMap.get(g.created_by) || "Không xác định",
        member_count: count ?? 0,
      };
    })
  );

  return groupsWithCounts;
}

export default async function AdminGroupsPage() {
  const groups = await getGroups();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Quản lý nhóm</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Danh sách các nhóm học tập trên hệ thống
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-8 text-center">
          <Users2 className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Chưa có nhóm học tập nào.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="rounded-xl border border-border/50 bg-[#0d0d0d] p-5 hover:border-primary/20 transition-colors space-y-4"
            >
              {/* Name + Description */}
              <div>
                <h3 className="font-semibold text-sm truncate">
                  {group.name}
                </h3>
                {group.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {group.description}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="size-3.5 shrink-0" />
                  <span className="truncate">{group.creator_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users2 className="size-3.5 shrink-0" />
                  <span>
                    {group.member_count.toLocaleString("vi-VN")} thành viên
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 shrink-0" />
                  <span>
                    {new Date(group.created_at).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary bar */}
      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4 flex items-center gap-3">
        <Users2 className="size-4 text-primary" />
        <p className="text-xs text-muted-foreground">
          Tổng số nhóm:{" "}
          <span className="font-medium text-foreground">
            {groups.length.toLocaleString("vi-VN")}
          </span>
        </p>
      </div>
    </div>
  );
}
