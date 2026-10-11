"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Caregiver = {
  id: string;
  kid_id: string;
  caregiver_user_id: string | null;
  role: string;
  permission: string;
  status: string;
  link_code: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  cha: "Cha",
  me: "Mẹ",
  ong: "Ông",
  ba: "Bà",
  "nguoi-giam-ho": "Người giám hộ",
};

const ROLE_OPTIONS = ["cha", "me", "ong", "ba", "nguoi-giam-ho"] as const;

const PERMISSION_LABEL: Record<string, string> = {
  admin: "Quản lý",
  viewer: "Xem",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ liên kết",
  linked: "Đã liên kết",
  rejected: "Đã từ chối",
};

function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}

function permissionLabel(permission: string): string {
  return PERMISSION_LABEL[permission] ?? permission;
}

function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

// Đọc JSON an toàn (kể cả khi body rỗng hoặc không phải JSON).
async function readJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Tab Người thân của MỘT con: danh sách người giám sát (quan hệ + quyền + trạng thái).
 * - Chủ hồ sơ (isOwner): thêm bằng **mã mời**, đổi quyền/quan hệ, gỡ liên kết.
 * - Người thân (non-owner): chỉ xem danh sách + nhập mã liên kết; không có thao tác quản trị.
 * KHÔNG còn luồng tìm theo tên (đã bỏ để tránh rò rỉ danh bạ) — chỉ còn mã mời.
 */
export function RelativesTab({ kidId, isOwner }: { kidId: string; isOwner: boolean }) {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Thêm người giám sát theo mã giới thiệu (chỉ chủ hồ sơ)
  const [refRole, setRefRole] = useState("cha");
  const [refPermission, setRefPermission] = useState("viewer");
  const [refCode, setRefCode] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [adding, setAdding] = useState(false);

  // Nhập mã liên kết (người được mời)
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Thao tác đang chạy trên một dòng: `${id}:${action}`.
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setListError(null);
    try {
      const r = await fetch(`/api/ekid/caregivers?kid_id=${encodeURIComponent(kidId)}`);
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Không tải được danh sách người thân");
      setCaregivers((d.caregivers as Caregiver[]) ?? []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Có lỗi khi tải danh sách");
    } finally {
      setLoading(false);
    }
  }, [kidId]);

  useEffect(() => {
    void load();
  }, [load]);

  // PATCH một liên kết (đổi quyền / đổi quan hệ) — chỉ chủ hồ sơ.
  async function patchCaregiver(id: string, body: { permission?: string; role?: string }) {
    setBusyKey(`${id}:patch`);
    setMsg(null);
    try {
      const r = await fetch("/api/ekid/caregivers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Cập nhật thất bại");
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi cập nhật" });
    } finally {
      setBusyKey(null);
    }
  }

  // Tra cứu mã giới thiệu để xác nhận đúng người (chỉ chủ hồ sơ).
  async function resolveRefCode() {
    const code = refCode.trim();
    if (!code) return;
    setResolving(true);
    setResolvedName(null);
    setMsg(null);
    try {
      const r = await fetch("/api/ekid/caregivers/resolve-ref", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref_code: code }),
      });
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Không tìm thấy mã giới thiệu");
      setResolvedName((d.full_name as string) ?? "Người dùng");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Không tìm thấy mã giới thiệu" });
    } finally {
      setResolving(false);
    }
  }

  // Thêm người giám sát theo mã giới thiệu (liên kết ngay) — chỉ chủ hồ sơ.
  async function addByRefCode() {
    const code = refCode.trim();
    if (!code || !resolvedName) return;
    setAdding(true);
    setMsg(null);
    try {
      const r = await fetch("/api/ekid/caregivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kid_id: kidId,
          ref_code: code,
          role: refRole,
          permission: refPermission,
        }),
      });
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Thêm giám sát thất bại");
      setMsg({ ok: true, text: "Đã thêm người giám sát thành công." });
      setRefCode("");
      setResolvedName(null);
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi thêm giám sát" });
    } finally {
      setAdding(false);
    }
  }

  // Nhập mã liên kết để tự trở thành người thân (người được mời).
  async function join() {
    const code = joinCode.trim();
    if (!code) return;
    setJoining(true);
    setMsg(null);
    try {
      const r = await fetch("/api/ekid/caregivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Liên kết thất bại");
      setMsg({ ok: true, text: "Liên kết thành công! Bạn đã là người thân của bé." });
      setJoinCode("");
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi liên kết" });
    } finally {
      setJoining(false);
    }
  }

  // Gỡ một liên kết/lời mời (chỉ chủ hồ sơ).
  async function remove(id: string) {
    setBusyKey(`${id}:remove`);
    setMsg(null);
    try {
      const r = await fetch(`/api/ekid/caregivers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Không gỡ được liên kết");
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi gỡ liên kết" });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-4">
      {msg && (
        <p role="status" className={msg.ok ? "text-sm text-n-green" : "text-sm text-destructive"}>
          {msg.text}
        </p>
      )}

      {/* Người được mời: nhập mã liên kết */}
      {!isOwner && (
        <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
          <h2 className="text-sm font-semibold text-foreground">Nhập mã liên kết</h2>
          <p className="text-sm text-muted-foreground">
            Nhập mã 6 ký tự mà chủ hồ sơ gửi cho bạn để trở thành người thân của bé.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="VD: AB3D7K"
              maxLength={6}
              className="tracking-widest"
            />
            <Button
              type="button"
              onClick={join}
              disabled={joining || joinCode.trim().length === 0}
            >
              {joining ? "Đang liên kết..." : "Liên kết"}
            </Button>
          </div>
        </section>
      )}

      {/* Thêm người thân (chỉ chủ hồ sơ) */}
      {/* Thêm người giám sát theo mã giới thiệu (chỉ chủ hồ sơ) */}
      {isOwner && (
        <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
          <h2 className="text-sm font-semibold text-foreground">Thêm người giám sát bằng mã giới thiệu</h2>
          <p className="text-sm text-muted-foreground">
            Nhập mã giới thiệu của người dùng khác để thêm họ vào theo dõi con. Mã giúp xác nhận
            đúng người trước khi thêm.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="ref-role">Quan hệ</Label>
              <Select id="ref-role" value={refRole} onChange={(e) => setRefRole(e.target.value)}>
                <option value="cha">Cha</option>
                <option value="me">Mẹ</option>
                <option value="ong">Ông</option>
                <option value="ba">Bà</option>
                <option value="nguoi-giam-ho">Người giám hộ</option>
              </Select>
            </div>

            <div className="space-y-1.5 sm:flex-1">
              <Label htmlFor="ref-code">Mã giới thiệu</Label>
              <Input
                id="ref-code"
                value={refCode}
                onChange={(e) => {
                  setRefCode(e.target.value.toUpperCase());
                  setResolvedName(null);
                }}
                placeholder="VD: AB3D7K"
                className="tracking-widest"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={resolveRefCode}
              disabled={resolving || refCode.trim().length === 0}
            >
              {resolving ? "Đang tra cứu..." : "Tra cứu"}
            </Button>
          </div>

          {resolvedName && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <p className="text-sm text-muted-foreground sm:self-center">
                Đúng người cần thêm:{" "}
                <span className="font-semibold text-primary">{resolvedName}</span>
              </p>

              <div className="space-y-1.5 sm:ml-auto">
                <Label htmlFor="ref-permission">Quyền</Label>
                <Select
                  id="ref-permission"
                  value={refPermission}
                  onChange={(e) => setRefPermission(e.target.value)}
                >
                  <option value="admin">Quản lý</option>
                  <option value="viewer">Xem</option>
                </Select>
              </div>

              <Button type="button" onClick={addByRefCode} disabled={adding}>
                {adding ? "Đang thêm..." : "Thêm giám sát"}
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Danh sách người thân của con */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
        <h2 className="text-sm font-semibold text-foreground">Người thân hiện tại</h2>
        {listError && <p className="text-sm text-destructive">{listError}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : caregivers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có người thân nào theo dõi con.</p>
        ) : (
          <ul className="space-y-1">
            {caregivers.map((c) => {
              const patchBusy = busyKey === `${c.id}:patch`;
              const removeBusy = busyKey === `${c.id}:remove`;
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-glass px-3 py-2 text-sm text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{roleLabel(c.role)}</span>
                    <span
                      className={
                        c.permission === "admin"
                          ? "rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                          : "rounded-full border border-border bg-glass px-2 py-0.5 text-xs text-muted-foreground"
                      }
                    >
                      {permissionLabel(c.permission)}
                    </span>
                    {c.status === "pending" && c.link_code && (
                      <span className="tracking-widest text-primary">Mã: {c.link_code}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{statusLabel(c.status)}</span>
                  </span>

                  {isOwner && (
                    <span className="flex flex-wrap items-center gap-2">
                      {/* Đổi quan hệ (role) */}
                      <Select
                        aria-label="Đổi quan hệ"
                        value={c.role}
                        disabled={patchBusy}
                        onChange={(e) => patchCaregiver(c.id, { role: e.target.value })}
                        className="h-8 w-auto"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </Select>

                      {/* Đổi quyền (toggle Quản lý ↔ Xem) */}
                      <Button
                        type="button"
                        variant={c.permission === "admin" ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          patchCaregiver(c.id, {
                            permission: c.permission === "admin" ? "viewer" : "admin",
                          })
                        }
                        disabled={patchBusy}
                      >
                        {patchBusy ? "Đang lưu..." : c.permission === "admin" ? "Quản lý" : "Xem"}
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(c.id)}
                        disabled={removeBusy}
                      >
                        {removeBusy ? "Đang gỡ..." : "Gỡ liên kết"}
                      </Button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!isOwner && (
          <p className="text-sm text-muted-foreground">
            Bạn là người thân được liên kết — chỉ xem được danh sách, không thay đổi được.
          </p>
        )}
      </section>
    </div>
  );
}