"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield, UserPlus, Trash2, Loader2, X, Mail, User, Search,
} from "lucide-react";
import { toast } from "sonner";
import { LocalTime } from "@/components/LocalTime";

interface AdminRole {
  id: string;
  user_id: string;
  email: string;
  role: string;
  full_name: string;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Moderator" },
];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Assign
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRole, setAssignRole] = useState("admin");
  const [assigning, setAssigning] = useState(false);

  // Change role
  const [changeRoleId, setChangeRoleId] = useState<string | null>(null);
  const [changeRoleValue, setChangeRoleValue] = useState("admin");
  const [changingRole, setChangingRole] = useState(false);

  // Remove
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles");
      const data = await res.json();
      setRoles(data.roles ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const filtered = roles.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.user_id.toLowerCase().includes(q) ||
      r.role.toLowerCase().includes(q)
    );
  });

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !assignEmail) {
      toast.error("User ID và Email là bắt buộc");
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          user_id: assignUserId,
          email: assignEmail,
          role: assignRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gán role thất bại");
      toast.success("Đã gán role admin!");
      setShowAssign(false);
      setAssignUserId("");
      setAssignEmail("");
      setAssignRole("admin");
      loadRoles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gán role thất bại");
    } finally {
      setAssigning(false);
    }
  };

  const handleChangeRole = async () => {
    if (!changeRoleId) return;
    setChangingRole(true);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_role",
          user_id: changeRoleId,
          role: changeRoleValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đổi role thất bại");
      toast.success("Đã đổi role!");
      setChangeRoleId(null);
      loadRoles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Đổi role thất bại");
    } finally {
      setChangingRole(false);
    }
  };

  const handleRemove = async () => {
    if (!removeUserId) return;
    setRemoving(true);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          user_id: removeUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xoá thất bại");
      toast.success("Đã xoá admin!");
      setRemoveUserId(null);
      loadRoles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xoá thất bại");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Phân quyền</h1>
          <p className="text-xs text-muted-foreground">{roles.length} admins</p>
        </div>
        <Button
          onClick={() => setShowAssign(true)}
          className="bg-primary text-primary-foreground hover:brightness-110 text-sm gap-1.5 h-9"
        >
          <UserPlus className="size-4" /> Gán role
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, email, ID hoặc role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Người dùng
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Từ ngày
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.01]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {(r.full_name || r.email || "A")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {r.full_name || "Chưa đặt tên"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {r.user_id.slice(0, 12)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                      {r.email}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        <Shield
                          className={`size-3 ${
                            r.role === "admin"
                              ? "text-primary"
                              : "text-emerald-400"
                          }`}
                        />
                        <span
                          className={
                            r.role === "admin"
                              ? "text-primary"
                              : "text-emerald-400"
                          }
                        >
                          {r.role === "admin" ? "Admin" : "Moderator"}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      <LocalTime iso={r.created_at} format="short" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setChangeRoleId(r.user_id);
                            setChangeRoleValue(r.role);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-blue-400 transition-colors"
                          title="Đổi role"
                        >
                          <Shield className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setRemoveUserId(r.user_id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Xoá"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground p-4 text-center">
              Không tìm thấy admin nào.
            </p>
          )}
        </div>
      )}

      {/* Assign modal */}
      {showAssign && (
        <Modal onClose={() => setShowAssign(false)} title="Gán role admin">
          <form onSubmit={handleAssign} className="space-y-3">
            <Field icon={User} label="User ID *">
              <Input
                placeholder="UUID của user"
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                className="pl-8 h-9 text-sm"
                required
              />
            </Field>
            <Field icon={Mail} label="Email *">
              <Input
                type="email"
                placeholder="user@example.com"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                className="pl-8 h-9 text-sm"
                required
              />
            </Field>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <select
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              className="w-full h-9 bg-primary text-primary-foreground hover:brightness-110 text-sm"
              disabled={assigning}
            >
              {assigning ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                  Đang gán...
                </>
              ) : (
                "Gán role"
              )}
            </Button>
          </form>
        </Modal>
      )}

      {/* Change role modal */}
      {changeRoleId && (
        <Modal
          onClose={() => setChangeRoleId(null)}
          title="Đổi role admin"
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Role mới</Label>
              <select
                value={changeRoleValue}
                onChange={(e) => setChangeRoleValue(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setChangeRoleId(null)}
                className="flex-1 h-9 text-sm"
              >
                Huỷ
              </Button>
              <Button
                onClick={handleChangeRole}
                disabled={changingRole}
                className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                {changingRole ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                    Đang đổi...
                  </>
                ) : (
                  "Đổi role"
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Remove modal */}
      {removeUserId && (
        <Modal
          onClose={() => setRemoveUserId(null)}
          title="Xoá admin?"
          borderRed
        >
          <p className="text-xs text-muted-foreground mb-4">
            Người dùng này sẽ mất toàn bộ quyền admin/moderator. Hành động này
            không thể hoàn tác.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setRemoveUserId(null)}
              className="flex-1 h-9 text-sm"
            >
              Huỷ
            </Button>
            <Button
              onClick={handleRemove}
              disabled={removing}
              className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white text-sm"
            >
              {removing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                  Đang xoá...
                </>
              ) : (
                "Xoá"
              )}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  onClose,
  title,
  children,
  borderRed,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  borderRed?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm bg-[#111] border ${
          borderRed ? "border-red-500/20" : "border-border"
        } rounded-2xl p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-base font-semibold ${borderRed ? "text-red-400" : ""}`}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}
