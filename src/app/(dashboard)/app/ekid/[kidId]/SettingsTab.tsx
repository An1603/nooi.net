"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KidCustomReward, KidSettings } from "@/lib/ekid/ekid-system";
import { DAILY_LIMIT_MIN, DAILY_LIMIT_MAX, normalizeKidSettings } from "@/lib/ekid/ekid-system";
import type { ConsoleKid } from "./types";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Đọc JSON an toàn, kèm thông điệp lỗi tiếng Việt nhất quán. */
async function readError(r: Response, fallback: string): Promise<string> {
  const d = (await r.json().catch(() => ({}))) as { error?: string };
  return d.error || fallback;
}

/**
 * Phân tích chuỗi mốc huy hiệu "3, 5, 10" → [3, 5, 10] (đã sắp xếp, bỏ trùng).
 * Trả `null` khi có giá trị không hợp lệ (không phải số nguyên dương).
 */
function parseMilestones(raw: string): number[] | null {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
  if (parts.length === 0) return null;
  const out: number[] = [];
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n <= 0) return null;
    out.push(n);
  }
  return Array.from(new Set(out)).sort((a, b) => a - b);
}

/** Bật/tắt một môn trong danh sách (giữ nguyên thứ tự). */
function toggle(list: string[], value: string, on: boolean): string[] {
  if (on) return list.includes(value) ? list : [...list, value];
  return list.filter((x) => x !== value);
}

/** Một dòng cài đặt chỉ-đọc (nhãn + giá trị). */
function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Tab Cài đặt của MỘT con — 3 khối: Nguyên tắc học, Môn học, Phần thưởng.
 *
 * - Giới hạn phút/ngày ghi vào CỘT `ekid_kids.daily_limit_min` (KHÔNG nằm trong settings);
 *   các cài đặt còn lại gửi trong `settings` đúng shape {@link KidSettings}.
 * - Môn học lấy từ các `core_topic` của LỨA con (GET /api/ekid/lessons?band=);
 *   `subjects` rỗng ⇒ học tất cả các môn.
 * - Chỉ chủ hồ sơ hoặc quản lý (canEdit) mới sửa được (khớp quyền server: PATCH owner/admin).
 */
export function SettingsTab({
  kid,
  settings,
  canEdit,
  onChanged,
}: {
  kid: ConsoleKid;
  settings: KidSettings;
  /** (v2.4) Cho phép sửa cài đặt (chủ hoặc quản lý). */
  canEdit: boolean;
  onChanged: () => void;
}) {
  const band = kid.placement_age_band ?? "";

  // Khối Nguyên tắc
  const [dailyLimit, setDailyLimit] = useState(
    kid.daily_limit_min != null ? String(kid.daily_limit_min) : String(DAILY_LIMIT_MIN),
  );
  const [allowedFrom, setAllowedFrom] = useState(settings.rules.allowedFrom ?? "");
  const [allowedTo, setAllowedTo] = useState(settings.rules.allowedTo ?? "");
  const [maxLessons, setMaxLessons] = useState(String(settings.rules.maxLessonsPerDay));
  const [requirePass, setRequirePass] = useState(settings.rules.requirePassToAdvance);

  // Khối Môn học
  const [topics, setTopics] = useState<string[]>([]);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>(settings.subjects);

  // Khối Phần thưởng
  const [pointsPer, setPointsPer] = useState(String(settings.rewards.pointsPerPassedLesson));
  const [milestones, setMilestones] = useState(settings.rewards.badgeMilestones.join(", "));
  const [custom, setCustom] = useState<KidCustomReward[]>(settings.rewards.custom);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Tải các môn (core_topic) của lứa con; mặc định chọn tất cả khi chưa có lựa chọn.
  useEffect(() => {
    if (!band) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/ekid/lessons?band=${encodeURIComponent(band)}`);
        const d = (await r.json().catch(() => ({}))) as {
          lessons?: { core_topic?: string | null }[];
          error?: string;
        };
        if (!r.ok) throw new Error(d.error || "Không tải được danh sách môn học.");
        if (!alive) return;
        const distinct = Array.from(
          new Set(
            (d.lessons ?? [])
              .map((l) => l.core_topic)
              .filter((t): t is string => typeof t === "string" && t.trim() !== ""),
          ),
        );
        setTopics(distinct);
        // Cài đặt chưa chọn môn nào ⇒ coi như học tất cả ⇒ tích sẵn toàn bộ.
        setSubjects((prev) => (prev.length > 0 ? prev : distinct));
      } catch (e) {
        if (alive) setTopicsError(e instanceof Error ? e.message : "Có lỗi khi tải môn học.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [band]);

  // Bảng môn để hiển thị: gộp môn của lứa với môn đã lưu (phòng khi lứa đổi).
  const allSubjects = Array.from(new Set([...topics, ...settings.subjects]));

  function updateCustom(index: number, patch: Partial<KidCustomReward>) {
    setCustom((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  async function save() {
    setMsg(null);

    const limitNum = Number(dailyLimit);
    if (
      dailyLimit.trim() === "" ||
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

    const fromRaw = allowedFrom.trim();
    const toRaw = allowedTo.trim();
    if ((fromRaw !== "" && !TIME_RE.test(fromRaw)) || (toRaw !== "" && !TIME_RE.test(toRaw))) {
      setMsg({ ok: false, text: "Khung giờ phải theo định dạng HH:MM (hoặc để trống)." });
      return;
    }
    if ((fromRaw === "") !== (toRaw === "")) {
      setMsg({
        ok: false,
        text: "Vui lòng nhập đủ cả giờ bắt đầu và giờ kết thúc, hoặc để trống cả hai.",
      });
      return;
    }

    const maxNum = Number(maxLessons);
    if (maxLessons.trim() === "" || !Number.isInteger(maxNum) || maxNum < 0) {
      setMsg({ ok: false, text: "Số bài tối đa mỗi ngày phải là số nguyên không âm." });
      return;
    }

    const pointsNum = Number(pointsPer);
    if (pointsPer.trim() === "" || !Number.isFinite(pointsNum) || pointsNum < 0) {
      setMsg({ ok: false, text: "Điểm cho mỗi bài đạt phải là số không âm." });
      return;
    }

    const parsedMilestones = parseMilestones(milestones);
    if (!parsedMilestones) {
      setMsg({
        ok: false,
        text: "Mốc huy hiệu phải là các số nguyên dương, cách nhau bởi dấu phẩy.",
      });
      return;
    }

    for (const c of custom) {
      if (c.label.trim() === "") {
        setMsg({ ok: false, text: "Tên phần thưởng tùy chỉnh không được để trống." });
        return;
      }
      if (!Number.isFinite(c.points) || c.points < 0) {
        setMsg({ ok: false, text: "Điểm của phần thưởng tùy chỉnh phải là số không âm." });
        return;
      }
    }
    const cleanCustom: KidCustomReward[] = custom
      .map((c) => ({ label: c.label.trim(), points: c.points }))
      .filter((c) => c.label !== "");

    const payloadSettings: KidSettings = {
      rules: {
        allowedFrom: fromRaw || null,
        allowedTo: toRaw || null,
        maxLessonsPerDay: maxNum,
        requirePassToAdvance: requirePass,
      },
      subjects,
      rewards: {
        pointsPerPassedLesson: pointsNum,
        badgeMilestones: parsedMilestones,
        custom: cleanCustom,
      },
    };

    setSaving(true);
    try {
      const r = await fetch(`/api/ekid/kids/${kid.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_limit_min: limitNum, settings: payloadSettings }),
      });
      if (!r.ok) throw new Error(await readError(r, "Không lưu được cài đặt."));
      // (I-UI2) Đồng bộ lại state hiển thị từ dữ liệu server trả về ngay sau khi lưu.
      const data = (await r.json().catch(() => ({}))) as {
        kid?: { daily_limit_min?: number | null; settings?: unknown };
      };
      const k = data.kid;
      if (k) {
        if (k.daily_limit_min != null) setDailyLimit(String(k.daily_limit_min));
        const s = normalizeKidSettings(k.settings);
        setAllowedFrom(s.rules.allowedFrom ?? "");
        setAllowedTo(s.rules.allowedTo ?? "");
        setMaxLessons(String(s.rules.maxLessonsPerDay));
        setRequirePass(s.rules.requirePassToAdvance);
        setSubjects(s.subjects);
        setPointsPer(String(s.rewards.pointsPerPassedLesson));
        setMilestones(s.rewards.badgeMilestones.join(", "));
        setCustom(s.rewards.custom);
      }
      setMsg({ ok: true, text: "Đã lưu cài đặt cho con." });
      onChanged();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Có lỗi khi lưu." });
    } finally {
      setSaving(false);
    }
  }

  // (v2.8) Người được cấp quyền "Xem" (viewer) chỉ được XEM: ẩn HẾT ô nhập/nút lưu,
  // chỉ hiển thị bảng cài đặt chỉ-đọc. Chủ hồ sơ / quản lý (canEdit) vẫn dùng form như cũ.
  if (!canEdit) {
    const windowText =
      settings.rules.allowedFrom && settings.rules.allowedTo
        ? `${settings.rules.allowedFrom} – ${settings.rules.allowedTo}`
        : "Không giới hạn (học bất cứ lúc nào)";
    const subjectsText =
      settings.subjects.length > 0 ? settings.subjects.join(", ") : "Tất cả các môn";
    const custom = settings.rewards.custom;

    return (
      <div className="space-y-4">
        {/* Khối 1: Nguyên tắc học */}
        <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
          <h2 className="text-sm font-semibold text-foreground">Nguyên tắc học</h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SettingRow label="Giới hạn phút/ngày">
              {kid.daily_limit_min != null ? `${kid.daily_limit_min} phút` : "Không giới hạn"}
            </SettingRow>
            <SettingRow label="Số bài tối đa/ngày">{settings.rules.maxLessonsPerDay}</SettingRow>
            <SettingRow label="Khung giờ học">{windowText}</SettingRow>
            <SettingRow label="Thi đạt mới sang bài">
              {settings.rules.requirePassToAdvance ? "Bật" : "Tắt"}
            </SettingRow>
          </dl>
        </section>

        {/* Khối 2: Môn học */}
        <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
          <h2 className="text-sm font-semibold text-foreground">Môn học</h2>
          <p className="text-sm font-medium text-foreground">{subjectsText}</p>
          <p className="text-[11px] text-muted-foreground">
            Danh sách trống ⇒ con học tất cả các môn.
          </p>
        </section>

        {/* Khối 3: Phần thưởng */}
        <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
          <h2 className="text-sm font-semibold text-foreground">Phần thưởng</h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SettingRow label="Điểm cho mỗi bài đạt">
              {settings.rewards.pointsPerPassedLesson}
            </SettingRow>
            <SettingRow label="Mốc huy hiệu (số bài đạt)">
              {settings.rewards.badgeMilestones.join(", ")}
            </SettingRow>
          </dl>

          <div className="space-y-2 border-t border-border pt-3">
            <h3 className="text-sm font-semibold text-foreground">Phần thưởng tùy chỉnh</h3>
            {custom.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có phần thưởng tùy chỉnh nào.</p>
            ) : (
              <ul className="space-y-1">
                {custom.map((c, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-glass px-3 py-2 text-sm text-foreground"
                  >
                    <span>{c.label}</span>
                    <span className="text-xs text-muted-foreground">{c.points} điểm</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Bạn là người thân được liên kết — chỉ xem được cài đặt, không sửa được.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Khối 1: Nguyên tắc học */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
        <h2 className="text-sm font-semibold text-foreground">Nguyên tắc học</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="set-limit">Giới hạn phút/ngày</Label>
            <Input
              id="set-limit"
              type="number"
              min={DAILY_LIMIT_MIN}
              max={DAILY_LIMIT_MAX}
              step={1}
              inputMode="numeric"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-max">Số bài tối đa/ngày</Label>
            <Input
              id="set-max"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={maxLessons}
              onChange={(e) => setMaxLessons(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-from">Khung giờ học — từ</Label>
            <Input
              id="set-from"
              type="time"
              value={allowedFrom}
              onChange={(e) => setAllowedFrom(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-to">Khung giờ học — đến</Label>
            <Input
              id="set-to"
              type="time"
              value={allowedTo}
              onChange={(e) => setAllowedTo(e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Để trống khung giờ ⇒ con được học bất cứ lúc nào. Khung giờ qua nửa đêm (vd 20:00–06:00)
          vẫn hoạt động.
        </p>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="size-4"
            checked={requirePass}
            onChange={(e) => setRequirePass(e.target.checked)}
            disabled={!canEdit}
          />
          <span>Thi đạt mới sang bài (phải đạt bài trước mới mở bài kế tiếp)</span>
        </label>
      </section>

      {/* Khối 2: Môn học */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
        <h2 className="text-sm font-semibold text-foreground">Môn học</h2>

        {!band ? (
          <p className="text-sm text-muted-foreground">
            Con chưa được định vị lứa tuổi nên chưa có danh sách môn. Hãy cập nhật ngày sinh ở tab
            Tài khoản.
          </p>
        ) : topicsError ? (
          <p className="text-sm text-destructive">{topicsError}</p>
        ) : allSubjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Lứa của con hiện chưa có bài học nào để chọn môn.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {allSubjects.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={subjects.includes(t)}
                    onChange={(e) => setSubjects((prev) => toggle(prev, t, e.target.checked))}
                    disabled={!canEdit}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Bỏ tích hết ⇒ con học tất cả các môn.
            </p>
          </>
        )}
      </section>

      {/* Khối 3: Phần thưởng */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
        <h2 className="text-sm font-semibold text-foreground">Phần thưởng</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="set-points">Điểm cho mỗi bài đạt</Label>
            <Input
              id="set-points"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={pointsPer}
              onChange={(e) => setPointsPer(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-milestones">Mốc huy hiệu (số bài đạt)</Label>
            <Input
              id="set-milestones"
              value={milestones}
              onChange={(e) => setMilestones(e.target.value)}
              placeholder="3, 5, 10"
              disabled={!canEdit}
            />
            <p className="text-[11px] text-muted-foreground">Cách nhau bởi dấu phẩy. Mặc định 3/5/10.</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <h3 className="text-sm font-semibold text-foreground">Phần thưởng tùy chỉnh</h3>
          {custom.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có phần thưởng tùy chỉnh nào.</p>
          )}
          <ul className="space-y-2">
            {custom.map((c, i) => (
              <li key={i} className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label htmlFor={`set-custom-label-${i}`}>Tên phần thưởng</Label>
                  <Input
                    id={`set-custom-label-${i}`}
                    value={c.label}
                    onChange={(e) => updateCustom(i, { label: e.target.value })}
                    placeholder="VD: Đi công viên"
                    disabled={!canEdit}
                  />
                </div>
                <div className="w-28 space-y-1.5">
                  <Label htmlFor={`set-custom-points-${i}`}>Điểm</Label>
                  <Input
                    id={`set-custom-points-${i}`}
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={String(c.points)}
                    onChange={(e) =>
                      updateCustom(i, {
                        points: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    disabled={!canEdit}
                  />
                </div>
                {canEdit && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setCustom((prev) => prev.filter((_, j) => j !== i))}
                  >
                    Xoá
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustom((prev) => [...prev, { label: "", points: 0 }])}
            >
              + Thêm phần thưởng
            </Button>
          )}
        </div>
      </section>

      {msg && (
        <p role="status" className={msg.ok ? "text-sm text-n-green" : "text-sm text-destructive"}>
          {msg.text}
        </p>
      )}

      {canEdit ? (
        <Button type="button" onClick={save} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Bạn là người thân được liên kết — chỉ xem được cài đặt, không sửa được.
        </p>
      )}
    </div>
  );
}
