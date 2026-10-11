"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ResetChildPassword } from "@/components/ekid/ResetChildPassword";
import { SetChildUsername } from "@/components/ekid/SetChildUsername";
import { DAILY_LIMIT_MIN, DAILY_LIMIT_MAX } from "@/lib/ekid/ekid-system";
import type { ConsoleKid } from "./types";

/** Đọc JSON an toàn, kèm thông điệp lỗi tiếng Việt nhất quán. */
async function readError(r: Response, fallback: string): Promise<string> {
  const d = (await r.json().catch(() => ({}))) as { error?: string };
  return d.error || fallback;
}

/** Nhãn trạng thái thân thiện từ status. */
function statusText(status?: string | null): string {
  return status === "khoa" ? "Đang khoá" : "Hoạt động";
}

/**
 * Tab Tài khoản — sửa hồ sơ con, đổi mật khẩu con, khoá/mở khoá và xoá hồ sơ.
 * Chỉ chủ hồ sơ (isOwner) mới thấy các thao tác ghi (khớp quyền server: PATCH/DELETE chỉ OWNER).
 */
export function AccountTab({
  kid,
  isOwner,
  onChanged,
}: {
  kid: ConsoleKid;
  isOwner: boolean;
  onChanged: () => void;
}) {
  const router = useRouter();

  const [name, setName] = useState(kid.name ?? "");
  const [dob, setDob] = useState(kid.date_of_birth ?? "");
  const [emoji, setEmoji] = useState(kid.avatar_emoji ?? "🦊");
  const [limit, setLimit] = useState(
    kid.daily_limit_min != null ? String(kid.daily_limit_min) : "",
  );
  const [birthTime, setBirthTime] = useState(kid.birth_time ?? "");
  const [gender, setGender] = useState(kid.gender ?? "");
  const [birthPlace, setBirthPlace] = useState(kid.birth_place ?? "");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [busyStatus, setBusyStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const locked = kid.status === "khoa";

  const api = `/api/ekid/kids/${kid.id}`;

  // Lưu các trường hồ sơ qua PATCH (server whitelist + tự tính lại định vị nếu đổi ngày sinh).
  async function save() {
    setMsg(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setMsg({ ok: false, text: "Vui lòng nhập tên của con." });
      return;
    }
    if (!dob) {
      setMsg({ ok: false, text: "Vui lòng nhập ngày sinh của con." });
      return;
    }
    const limitNum = limit.trim() === "" ? NaN : Number(limit);
    if (
      Number.isNaN(limitNum) ||
      !Number.isInteger(limitNum) ||
      limitNum < DAILY_LIMIT_MIN ||
      limitNum > DAILY_LIMIT_MAX
    ) {
      setMsg({
        ok: false,
        text: `Giới hạn phút/ngày phải là số nguyên từ ${DAILY_LIMIT_MIN} đến ${DAILY_LIMIT_MAX}.`,
      });
      return;
    }

    setSaving(true);
    try {
      const r = await fetch(api, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          date_of_birth: dob,
          avatar_emoji: emoji.trim() || "🦊",
          daily_limit_min: limitNum,
          birth_time: birthTime.trim() || null,
          gender: gender || null,
          birth_place: birthPlace.trim() || null,
        }),
      });
      if (!r.ok) throw new Error(await readError(r, "Không lưu được thay đổi."));
      // (I-UI2) Dùng kid server trả về để set lại state hiển thị ngay (đã trim/chuẩn hoá).
      const data = (await r.json().catch(() => ({}))) as { kid?: Partial<ConsoleKid> };
      const k = data.kid;
      if (k) {
        if (typeof k.name === "string") setName(k.name);
        if (typeof k.date_of_birth === "string") setDob(k.date_of_birth);
        if (typeof k.avatar_emoji === "string") setEmoji(k.avatar_emoji);
        if (k.daily_limit_min != null) setLimit(String(k.daily_limit_min));
        setBirthTime(k.birth_time ?? "");
        setGender(k.gender ?? "");
        setBirthPlace(k.birth_place ?? "");
      }
      setMsg({ ok: true, text: "Đã lưu thay đổi hồ sơ của con." });
      onChanged();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi lưu." });
    } finally {
      setSaving(false);
    }
  }

  // Khoá / mở khoá tài khoản con (PATCH status).
  async function toggleLock() {
    setMsg(null);
    setBusyStatus(true);
    try {
      const next = locked ? "active" : "khoa";
      const r = await fetch(api, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!r.ok) throw new Error(await readError(r, "Không đổi được trạng thái."));
      setMsg({
        ok: true,
        text: next === "khoa" ? "Đã khoá tài khoản của con." : "Đã mở khoá tài khoản của con.",
      });
      onChanged();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi đổi trạng thái." });
    } finally {
      setBusyStatus(false);
    }
  }

  // Xoá hồ sơ con (xác nhận 2 bước) rồi quay về danh sách con.
  async function remove() {
    setMsg(null);
    setDeleting(true);
    try {
      const r = await fetch(api, { method: "DELETE" });
      if (!r.ok) throw new Error(await readError(r, "Không xoá được hồ sơ."));
      router.push("/app/ekid");
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi xoá hồ sơ." });
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Hồ sơ cơ bản */}
      <section className="rounded-2xl border border-border bg-card/70 p-3 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Hồ sơ của con</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="acc-name">Tên con</Label>
            <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} disabled={!isOwner} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-dob">Ngày sinh</Label>
            <Input id="acc-dob" type="date" max={today} value={dob} onChange={(e) => setDob(e.target.value)} disabled={!isOwner} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-emoji">Biểu tượng</Label>
            <Input id="acc-emoji" className="w-20 text-center" value={emoji} onChange={(e) => setEmoji(e.target.value)} disabled={!isOwner} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-limit">Giới hạn phút/ngày</Label>
            <Input
              id="acc-limit"
              type="number"
              min={DAILY_LIMIT_MIN}
              max={DAILY_LIMIT_MAX}
              step={1}
              inputMode="numeric"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              disabled={!isOwner}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-birthtime">Giờ sinh</Label>
            <Input id="acc-birthtime" type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} disabled={!isOwner} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-gender">Giới tính</Label>
            <Select id="acc-gender" value={gender} onChange={(e) => setGender(e.target.value)} disabled={!isOwner}>
              <option value="">Không xác định</option>
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="acc-birthplace">Nơi sinh</Label>
            <Input id="acc-birthplace" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} disabled={!isOwner} />
          </div>
          {kid.username ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="acc-username">Tên đăng nhập của con</Label>
              <Input id="acc-username" value={kid.username} readOnly disabled />
              <p className="text-[11px] text-muted-foreground">
                Con dùng tên đăng nhập này để vào ekid.nooi.net. Không thể sửa.
              </p>
            </div>
          ) : isOwner ? (
            <div className="sm:col-span-2">
              <SetChildUsername kidId={kid.id} kidName={kid.name} onChanged={onChanged} />
            </div>
          ) : (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Tên đăng nhập của con</Label>
              <p className="text-[11px] text-muted-foreground">
                Hồ sơ này chưa có tài khoản đăng nhập. Chỉ chủ hồ sơ mới đặt được.
              </p>
            </div>
          )}
        </div>

        {msg && (
          <p role="status" className={msg.ok ? "text-sm text-n-green" : "text-sm text-destructive"}>
            {msg.text}
          </p>
        )}

        {isOwner ? (
          <Button type="button" onClick={save} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Bạn là người thân được liên kết — chỉ xem được hồ sơ, không sửa được.
          </p>
        )}
      </section>

      {/* Bảo mật & trạng thái (chỉ chủ hồ sơ) */}
      {isOwner && (
        <section className="rounded-2xl border border-border bg-card/70 p-3 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Bảo mật &amp; trạng thái</h2>

          {kid.username && <ResetChildPassword kidId={kid.id} kidName={kid.name} />}

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={toggleLock}
              disabled={busyStatus}
            >
              {busyStatus ? "Đang xử lý..." : locked ? "🔓 Mở khoá tài khoản" : "🔒 Khoá tài khoản"}
            </Button>
            <span className="text-sm text-muted-foreground">
              Trạng thái hiện tại: <b className="font-semibold text-foreground">{statusText(kid.status)}</b>
            </span>
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <h3 className="text-sm font-semibold text-destructive">Xoá hồ sơ</h3>
            <p className="text-sm text-muted-foreground">
              Xoá vĩnh viễn hồ sơ của con cùng tài khoản đăng nhập, tiến độ và phần thưởng. Không thể hoàn tác.
            </p>
            {!confirmDelete ? (
              <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
                Xoá hồ sơ
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-destructive">Bạn chắc chắn muốn xoá?</span>
                <Button type="button" variant="destructive" onClick={remove} disabled={deleting}>
                  {deleting ? "Đang xoá..." : "Xác nhận xoá"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Huỷ
                </Button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
