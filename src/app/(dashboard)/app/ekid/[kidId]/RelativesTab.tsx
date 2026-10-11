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
  status: string;
  link_code: string | null;
};

type UserResult = { user_id: string; full_name: string };

const ROLE_LABEL: Record<string, string> = {
  cha: "Cha",
  me: "Mẹ",
  "nguoi-giam-ho": "Người giám hộ",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ liên kết",
  linked: "Đã liên kết",
  rejected: "Đã từ chối",
};

function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
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
 * Tab Người thân của MỘT con: danh sách người theo dõi (vai trò + trạng thái),
 * thêm người thân bằng **mã mời** hoặc **tìm theo tên**, và **gỡ liên kết**.
 * Chỉ chủ hồ sơ (isOwner) mới thêm/gỡ; người thân chỉ xem (khớp quyền server).
 */
export function RelativesTab({ kidId, isOwner }: { kidId: string; isOwner: boolean }) {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Thêm người thân
  const [role, setRole] = useState("cha");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Gỡ liên kết
  const [busyId, setBusyId] = useState<string | null>(null);

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

  // Tìm người dùng theo tên để mời liên kết.
  async function search() {
    setSearching(true);
    setMsg(null);
    try {
      const r = await fetch(
        `/api/ekid/caregivers?q=${encodeURIComponent(q)}&kid_id=${encodeURIComponent(kidId)}`,
      );
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Tìm kiếm thất bại");
      setResults((d.users as UserResult[]) ?? []);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi tìm kiếm" });
    } finally {
      setSearching(false);
    }
  }

  // Mời trực tiếp một người dùng đã tìm thấy.
  async function inviteUser(u: UserResult) {
    setMsg(null);
    try {
      const r = await fetch("/api/ekid/caregivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kid_id: kidId, caregiver_user_id: u.user_id, role }),
      });
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Mời thất bại");
      setMsg({ ok: true, text: `Đã gửi lời mời tới ${u.full_name}.` });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi mời" });
    }
  }

  // Tạo mã mời (lời mời chờ) để gửi thủ công cho người thân.
  async function makeInviteCode() {
    setMsg(null);
    try {
      const r = await fetch("/api/ekid/caregivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kid_id: kidId, role }),
      });
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Tạo mã thất bại");
      const cg = d.caregiver as Caregiver | undefined;
      setInviteCode(cg?.link_code ?? null);
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi tạo mã" });
    }
  }

  // Gỡ một liên kết/lời mời (chỉ chủ hồ sơ).
  async function remove(id: string) {
    setBusyId(id);
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
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Thêm người thân (chỉ chủ hồ sơ) */}
      {isOwner && (
        <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
          <h2 className="text-sm font-semibold text-foreground">Thêm người thân</h2>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="rel-role">Vai trò</Label>
              <Select id="rel-role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="cha">Cha</option>
                <option value="me">Mẹ</option>
                <option value="nguoi-giam-ho">Người giám hộ</option>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="rel-q">Tìm theo tên</Label>
              <Input
                id="rel-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={search}
              disabled={searching || q.trim().length < 3}
            >
              {searching ? "Đang tìm..." : "Tìm"}
            </Button>
          </div>

          {results.length > 0 && (
            <ul className="space-y-1">
              {results.map((u) => (
                <li
                  key={u.user_id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-glass px-3 py-2 text-sm text-foreground"
                >
                  <span>{u.full_name}</span>
                  <Button type="button" size="sm" onClick={() => inviteUser(u)}>
                    Mời liên kết
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <Button type="button" variant="outline" onClick={makeInviteCode}>
              Tạo mã mời
            </Button>
            {inviteCode && (
              <p className="text-sm text-muted-foreground">
                Mã mời:{" "}
                <span className="font-semibold tracking-widest text-primary">{inviteCode}</span>
              </p>
            )}
          </div>

          {msg && (
            <p role="status" className={msg.ok ? "text-sm text-n-green" : "text-sm text-destructive"}>
              {msg.text}
            </p>
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
            {caregivers.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-glass px-3 py-2 text-sm text-foreground"
              >
                <span className="font-medium">{roleLabel(c.role)}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {c.status === "pending" && c.link_code && (
                    <span className="tracking-widest text-primary">Mã: {c.link_code}</span>
                  )}
                  <span>{statusLabel(c.status)}</span>
                  {isOwner && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(c.id)}
                      disabled={busyId === c.id}
                    >
                      {busyId === c.id ? "Đang gỡ..." : "Gỡ liên kết"}
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {!isOwner && (
          <p className="text-sm text-muted-foreground">
            Bạn là người thân được liên kết — chỉ xem được danh sách, không thêm/gỡ được.
          </p>
        )}
      </section>
    </div>
  );
}
