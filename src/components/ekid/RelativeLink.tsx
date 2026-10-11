"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Liên kết người thân với bé (eKid). Hai khối:
 *  (K1) Nhập mã liên kết — luôn hiển thị, để người thân tự liên kết bằng mã.
 *  (K2) Mời người thân — chỉ khi có hồ sơ bé: chọn vai trò, tạo mã mời.
 *  (K3) Người thân hiện tại — danh sách người thân của bé + lời mời gửi đến chính user.
 * KHÔNG còn luồng tìm theo tên (đã bỏ để tránh rò rỉ danh bạ) — chỉ còn mã mời.
 */

type Caregiver = {
  id: string;
  kid_id: string;
  caregiver_user_id: string | null;
  role: string;
  permission: string;
  status: string;
  link_code: string | null;
  kid_name?: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  cha: "Cha",
  me: "Mẹ",
  ong: "Ông",
  ba: "Bà",
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

export function RelativeLink({ kidId }: { kidId: string | null }) {
  // K1 — nhập mã
  const [joinCode, setJoinCode] = useState("");
  const [joinMsg, setJoinMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [joining, setJoining] = useState(false);

  // K2 — mời người thân (tạo mã mời)
  const [role, setRole] = useState("cha");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // K3 — danh sách
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [myInvites, setMyInvites] = useState<Caregiver[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    setListError(null);
    try {
      // Người thân của bé (nếu có hồ sơ) — dùng khi là chủ hồ sơ hoặc người thân đã liên kết.
      if (kidId) {
        const r = await fetch(`/api/ekid/caregivers?kid_id=${encodeURIComponent(kidId)}`);
        const d = await readJson(r);
        if (!r.ok) throw new Error((d.error as string) || "Không tải được người thân");
        setCaregivers((d.caregivers as Caregiver[]) ?? []);
      } else {
        setCaregivers([]);
      }

      // Lời mời/liên kết gửi đến chính user.
      const mr = await fetch("/api/ekid/caregivers");
      const md = await readJson(mr);
      if (!mr.ok) throw new Error((md.error as string) || "Không tải được lời mời");
      setMyInvites((md.caregivers as Caregiver[]) ?? []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Có lỗi khi tải danh sách");
    }
  }, [kidId]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  // K1 — người nhận nhập mã để tự liên kết.
  async function join() {
    const code = joinCode.trim();
    if (!code) return;
    setJoining(true);
    setJoinMsg(null);
    try {
      const r = await fetch("/api/ekid/caregivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Liên kết thất bại");
      setJoinMsg({ ok: true, text: "Liên kết thành công! Bạn đã là người thân của bé." });
      setJoinCode("");
      await loadLists();
    } catch (e) {
      setJoinMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi liên kết" });
    } finally {
      setJoining(false);
    }
  }

  // K2 — tạo mã mời (lời mời chờ) để gửi thủ công cho người thân.
  async function makeInviteCode() {
    if (!kidId) return;
    setInviteMsg(null);
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
      await loadLists();
    } catch (e) {
      setInviteMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi tạo mã" });
    }
  }

  // K3 — chấp nhận / từ chối lời mời gửi tới chính user.
  async function respond(id: string, status: "linked" | "rejected") {
    setListError(null);
    try {
      const r = await fetch("/api/ekid/caregivers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Thao tác thất bại");
      await loadLists();
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Có lỗi khi cập nhật");
    }
  }

  const pendingInvites = myInvites.filter((c) => c.status === "pending");

  return (
    <div className="space-y-6">
      {/* K1 — Nhập mã liên kết (luôn hiển thị) */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Nhập mã liên kết</h2>
        <p className="text-sm text-muted-foreground">
          Nhập mã 6 ký tự mà chủ hồ sơ gửi cho bạn để trở thành người thân của bé.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="VD: AB3D7K"
            maxLength={6}
            className="flex-1 rounded-lg border border-border bg-glass px-3 py-2 text-sm tracking-widest text-foreground"
          />
          <button
            onClick={join}
            disabled={joining || !joinCode.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {joining ? "Đang liên kết..." : "Liên kết"}
          </button>
        </div>
        {joinMsg && (
          <p className={`text-sm ${joinMsg.ok ? "text-secondary" : "text-destructive"}`}>{joinMsg.text}</p>
        )}
      </section>

      {/* K2 — Mời người thân (chỉ khi có hồ sơ bé) */}
      {kidId && (
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Mời người thân</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Vai trò</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="cha">Cha</option>
                <option value="me">Mẹ</option>
                <option value="ong">Ông</option>
                <option value="ba">Bà</option>
                <option value="nguoi-giam-ho">Người giám hộ</option>
              </select>
            </div>
            <button
              onClick={makeInviteCode}
              className="rounded-lg border border-primary px-4 py-2 text-sm text-primary"
            >
              Tạo mã mời
            </button>
            {inviteCode && (
              <p className="text-sm text-muted-foreground sm:self-center">
                Mã mời: <span className="font-semibold tracking-widest text-primary">{inviteCode}</span>
              </p>
            )}
          </div>
          {inviteMsg && (
            <p className={`text-sm ${inviteMsg.ok ? "text-secondary" : "text-destructive"}`}>
              {inviteMsg.text}
            </p>
          )}
        </section>
      )}

      {/* K3 — Người thân hiện tại */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Người thân hiện tại</h2>
        {listError && <p className="text-sm text-destructive">{listError}</p>}

        {pendingInvites.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Lời mời của bạn</h3>
            <ul className="space-y-1">
              {pendingInvites.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-glass px-3 py-2 text-sm text-foreground"
                >
                  <span>
                    {c.kid_name ?? "Hồ sơ bé"} — {roleLabel(c.role)}
                  </span>
                  <span className="flex gap-2">
                    <button
                      onClick={() => respond(c.id, "linked")}
                      className="rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground"
                    >
                      Chấp nhận
                    </button>
                    <button
                      onClick={() => respond(c.id, "rejected")}
                      className="rounded-lg border border-border px-3 py-1 text-xs text-foreground"
                    >
                      Từ chối
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {kidId ? (
          caregivers.length > 0 ? (
            <ul className="space-y-1">
              {caregivers.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-glass px-3 py-2 text-sm text-foreground"
                >
                  <span>{roleLabel(c.role)}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {c.status === "pending" && c.link_code && (
                      <span className="tracking-widest text-primary">Mã: {c.link_code}</span>
                    )}
                    {statusLabel(c.status)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có người thân nào.</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            Bạn chưa sở hữu hồ sơ bé nào. Nhập mã liên kết ở trên nếu bạn được mời.
          </p>
        )}
      </section>
    </div>
  );
}