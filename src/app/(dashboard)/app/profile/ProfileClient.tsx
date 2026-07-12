"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Mail,
  Calendar,
  Gift,
  Users,
  Copy,
  Check,
  Share2,
  Search,
  Sparkles,
  Sun,
  Globe,
  ChevronRight,
  LogOut,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalTime } from "@/components/LocalTime";
import { LevelInfoModal } from "@/components/LevelInfoModal";
import { LevelCard } from "@/components/LevelCard";
import { getReferralLink, setReferredBy, getReferrer, getReferralStats, getReferralList, changeRefCode, getRefCodeChangesRemaining, getRefCodeOwnerInfo, validateCustomRefCode } from "@/lib/referral";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  profile: Profile;
}

/* ─── Separator Component ─── */
function SectionSeparator() {
  return <div className="border-t border-border my-6" />;
}

/* ─── Section Header ─── */
function SectionHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

/* ─── Info Row ─── */
function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] break-words">{value}</span>
    </div>
  );
}

/* ─── Copy Button ─── */
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label ? `Đã sao chép ${label}` : "Đã sao chép");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  }, [text, label]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Đã sao chép" : "Sao chép"}
    </button>
  );
}

/* ─── Main Component ─── */
export function ProfileClient({ user, profile }: Props) {
  const supabase = createClient();

  // Referral state
  const [refCode, setRefCode] = useState(profile.ref_code ?? "");
  const [referrer, setReferrer] = useState<{ full_name: string; ref_code: string } | null>(null);
  const [referralStats, setReferralStats] = useState<{ total_referred: number; joined_this_month: number } | null>(null);
  const [referralList, setReferralList] = useState<
    { referee_id: string; full_name: string; created_at: string; has_onboarding: boolean }[]
  >([]);

  // Level / N state
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [journalCount, setJournalCount] = useState(0);
  const [xpProgress, setXpProgress] = useState(0);
  const [nextThreshold, setNextThreshold] = useState(100);
  const levelNames = ["🌰 Member", "Seeker 🌱", "Grower 🌿", "Giver 🌳", "Guider 🌲", "Mentor 🌳", "Master 👑"];
  const levelThresholds = [0, 100, 300, 700, 1200, 2200, 3500];

  // Claim referral code state
  const [claimCode, setClaimCode] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [hasReferrer, setHasReferrer] = useState(!!profile.referred_by);
  const [claimOwner, setClaimOwner] = useState<{ full_name: string; ref_code: string } | null>(null);
  const [claimLookupStatus, setClaimLookupStatus] = useState<"idle" | "found" | "not_found">("idle");

  // Change ref code state
  const [changesRemaining, setChangesRemaining] = useState(3);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [changing, setChanging] = useState(false);
  const [newCodeStatus, setNewCodeStatus] = useState<"idle" | "validating" | "same" | "taken" | "valid" | "invalid_format">("idle");
  const validateTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      // Set ref code from profile (might be null if profile was created before migration)
      if (profile.ref_code) {
        setRefCode(profile.ref_code);
      } else {
        // Try to get it from DB
        const { data } = await supabase
          .from("profiles")
          .select("ref_code")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.ref_code) setRefCode(data.ref_code);
      }

      // Get referrer info
      const ref = await getReferrer(user.id);
      if (ref) setReferrer(ref);

      // Get stats
      const stats = await getReferralStats(user.id);
      setReferralStats(stats);

      // Get list
      if (stats && stats.total_referred > 0) {
        const list = await getReferralList(user.id);
        setReferralList(list);
      }

      // Remaining changes
      const remaining = await getRefCodeChangesRemaining(user.id);
      setChangesRemaining(remaining);

      // Load journal count for XP
      const { data: journalData } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("file_type", "journal");
      const count = journalData?.length ?? 0;
      const totalXp = count * 10;
      setJournalCount(count);
      setXp(totalXp);

      let lvl = 1;
      for (let i = levelThresholds.length - 1; i >= 0; i--) {
        if (totalXp >= levelThresholds[i]) { lvl = i + 1; break; }
      }
      setLevel(lvl);
      const next = levelThresholds[Math.min(lvl, 6)];
      setNextThreshold(next);
      setXpProgress(Math.min(100, Math.round(((totalXp - levelThresholds[lvl - 1]) / (next - levelThresholds[lvl - 1])) * 100)));
    })();
  }, [user.id, profile.ref_code, supabase]);

  // ── Real-time debounced validation for change ref code ──
  useEffect(() => {
    // Clear previous timer
    if (validateTimer.current) clearTimeout(validateTimer.current);

    const trimmed = newCode.trim().toUpperCase();

    // Empty → idle
    if (!trimmed) {
      setNewCodeStatus("idle");
      return;
    }

    // Same as current → no change
    if (trimmed === refCode) {
      setNewCodeStatus("same");
      return;
    }

    // Format check
    if (!/^[A-Z0-9]{2,10}$/.test(trimmed)) {
      setNewCodeStatus("invalid_format");
      return;
    }

    // Debounce DB check (500ms after last keystroke)
    setNewCodeStatus("validating");
    validateTimer.current = setTimeout(async () => {
      const error = await validateCustomRefCode(trimmed, user.id);
      setNewCodeStatus(error ? "taken" : "valid");
    }, 500);

    return () => {
      if (validateTimer.current) clearTimeout(validateTimer.current);
    };
  }, [newCode, refCode, user.id]);

  // Claim referral code
  const handleClaimLookup = useCallback(async () => {
    const code = claimCode.trim();
    if (!code) { setClaimOwner(null); setClaimLookupStatus("idle"); return; }
    const owner = await getRefCodeOwnerInfo(code);
    if (owner) { setClaimOwner(owner); setClaimLookupStatus("found"); }
    else setClaimLookupStatus("not_found");
  }, [claimCode]);

  const handleClaim = useCallback(async () => {
    if (!claimCode.trim()) {
      toast.error("Vui lòng nhập mã giới thiệu.");
      return;
    }
    setClaiming(true);
    const result = await setReferredBy(user.id, claimCode.trim());
    if (result.success) {
      toast.success("✅ Đã liên kết với người giới thiệu!");
      setShowClaimForm(false);
      setClaimCode("");
      // Refresh
      const ref = await getReferrer(user.id);
      if (ref) setReferrer(ref);
      setHasReferrer(true);
    } else {
      toast.error(result.error || "Không thể liên kết. Vui lòng thử lại.");
    }
    setClaiming(false);
  }, [claimCode, user.id]);

  // Change ref code
  const handleChangeRefCode = useCallback(async () => {
    const trimmed = newCode.trim().toUpperCase();
    if (!trimmed) { toast.error("Vui lòng nhập mã mới."); return; }
    if (!/^[A-Z0-9]{2,10}$/.test(trimmed)) {
      toast.error("Mã chỉ gồm chữ hoa và số, từ 2-10 ký tự.");
      return;
    }
    setChanging(true);
    const result = await changeRefCode(user.id, trimmed);
    if (result.success) {
      toast.success("✅ Đã đổi mã giới thiệu thành công!");
      setRefCode(trimmed);
      setShowChangeForm(false);
      setNewCode("");
      const remaining = await getRefCodeChangesRemaining(user.id);
      setChangesRemaining(remaining);
    } else {
      toast.error(result.error || "Không thể đổi mã.");
    }
    setChanging(false);
  }, [newCode, user.id]);

  const referralLink = getReferralLink(refCode);

  const hasNumerology = !!profile.numerology_report;
  const hasTuVi = !!profile.tuvi_report;
  const hasChiemTinh = !!profile.chiem_tinh_report;

  const destinyMaps = [
    {
      label: "Thần số học",
      icon: <Sparkles className="size-5" />,
      href: "/app/numerology",
      available: hasNumerology,
      gradient: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
      iconBg: "bg-purple-500/10 text-purple-400",
    },
    {
      label: "Tử Vi",
      icon: <Sun className="size-5" />,
      href: "/app/tuvi",
      available: hasTuVi,
      gradient: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
    {
      label: "Chiêm tinh",
      icon: <Globe className="size-5" />,
      href: "/app/astrology",
      available: hasChiemTinh,
      gradient: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
      iconBg: "bg-blue-500/10 text-blue-400",
    },
  ] as const;

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hồ sơ của tôi</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Thông tin cá nhân, mã giới thiệu và bản đồ số mệnh của bạn.
          </p>
        </div>
        <form action="/auth/logout" method="POST" onSubmit={() => {
          // Clear SW caches before logout for immediate effect
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
              regs.forEach(reg => reg.unregister());
            });
            caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
          }
        }}>
          <button type="submit"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 px-3 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </form>
      </div>

      {/* ─── SECTION 1: Personal Info ─── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <SectionHeader icon={<User className="size-5" />} title="Thông tin cá nhân" desc="Thông tin tài khoản và hồ sơ NOOI của bạn" />
        </div>

        <div className="px-5 py-2">
          <InfoRow label="Email" value={
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground" />
              {user.email}
            </span>
          } />
          <InfoRow label="Họ tên" value={profile.full_name || "—"} />
          <InfoRow label="Ngày sinh" value={profile.date_of_birth ? formatDate(profile.date_of_birth) : "—"} />
          <InfoRow label="Giới tính" value={profile.gioi_tinh === "nam" ? "Nam" : profile.gioi_tinh === "nu" ? "Nữ" : "—"} />
          <InfoRow label="Nơi sinh" value={profile.noi_sinh || "—"} />
          <InfoRow label="Ngày tham gia" value={
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-muted-foreground" />
              <LocalTime iso={user.created_at} format="short" />
            </span>
          } />
        </div>

        <div className="px-5 py-3 border-t border-border/50 bg-muted/20">
          <Link
            href="/app/settings"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Chỉnh sửa thông tin <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>

      <SectionSeparator />

      {/* ─── SECTION: Public Profile ─── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <SectionHeader icon={<Globe className="size-5" />} title="Trang cá nhân" desc="Trang hồ sơ công khai của bạn trên NOOI" />
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Trang cá nhân công khai</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {profile.ref_code
                  ? `nooi.net/u/${profile.ref_code.toLowerCase()}`
                  : "Chưa có mã giới thiệu — liên hệ Admin để thiết lập"}
              </p>
            </div>
            <Link
              href="/app/settings"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/20 bg-primary/5 text-sm text-primary hover:bg-primary/10 transition-all"
            >
              <ExternalLink className="size-3.5" />
              Tùy chỉnh
            </Link>
          </div>
          {profile.ref_code && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <a
                href={`/u/${profile.ref_code.toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Xem trang cá nhân
                <ChevronRight className="size-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      <SectionSeparator />

      {/* ─── SECTION: Level & NOOI ─── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <SectionHeader icon={<Sparkles className="size-5" />} title="Cấp độ & NOOI (N)" desc="Hành trình chuyển hóa của bạn" />
        </div>
        <div className="px-5 py-4">
          <LevelInfoModal
            currentN={xp}
            currentLevel={level}
            currentLevelName={levelNames[Math.min(level - 1, 6)]}
            trigger={
              <div className="cursor-pointer">
                <LevelCard
                  level={level}
                  levelName={levelNames[Math.min(level - 1, 6)]}
                  n={xp}
                  nForNext={nextThreshold}
                  progressPercent={xpProgress}
                />
              </div>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-border/50">
            <div className="text-center p-3 rounded-lg bg-muted/20">
              <p className="text-lg font-bold text-primary">{journalCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Nhật ký</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/20">
              <p className="text-lg font-bold text-primary">{(xp / 10) || 0}</p>
              <p className="text-xs text-muted-foreground">Số ngày</p>
            </div>
          </div>
        </div>
      </div>

      <SectionSeparator />

      {/* ─── SECTION 2: Referral ─── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <SectionHeader icon={<Gift className="size-5" />} title="Giới thiệu bạn bè" desc="Mời bạn bè tham gia NOOI và theo dõi kết quả" />
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Referrer info (if has one) — LOCKED, cannot change */}
          {hasReferrer && (
            <div className="space-y-3">
              {referrer && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Được giới thiệu bởi</p>
                  <p className="text-sm font-medium mt-0.5">{referrer.full_name} ({referrer.ref_code})</p>
                </div>
              )}
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-2.5">
                <p className="text-xs text-yellow-400/80 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-yellow-400 shrink-0" />
                  Đã liên kết người giới thiệu — không thể thay đổi.
                </p>
              </div>
            </div>
          )}

          {/* Claim referral code (ONLY if no referrer yet) */}
          {!hasReferrer && !showClaimForm && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Bạn chưa có người giới thiệu?</p>
              <button
                onClick={() => setShowClaimForm(true)}
                className="text-sm text-primary hover:underline"
              >
                Nhập mã giới thiệu
              </button>
            </div>
          )}

          {!hasReferrer && showClaimForm && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Lưu ý:</span> Chỉ được nhập <strong>một lần duy nhất</strong>. Không thể thay đổi sau khi xác nhận.
              </p>
              <Label htmlFor="claim-ref" className="text-xs">Nhập mã giới thiệu</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="claim-ref"
                    placeholder="VD: AN8421"
                    value={claimCode}
                    onChange={(e) => { setClaimCode(e.target.value.toUpperCase()); setClaimOwner(null); setClaimLookupStatus("idle"); }}
                    onBlur={handleClaimLookup}
                    className="pl-9 h-10 text-sm font-mono"
                    maxLength={10}
                  />
                </div>
                <Button
                  onClick={handleClaim}
                  disabled={claiming || !claimCode.trim() || claimLookupStatus !== "found"}
                  className="h-10"
                  size="sm"
                >
                  {claiming ? "Đang xử lý..." : "Xác nhận"}
                </Button>
              </div>

              {/* Lookup result */}
              {claimLookupStatus === "found" && claimOwner && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2">
                  <span className="text-xs text-emerald-400">✅</span>
                  <p className="text-xs text-emerald-400">
                    Bạn sắp được giới thiệu bởi <strong>{claimOwner.full_name}</strong> ({claimOwner.ref_code})
                  </p>
                </div>
              )}
              {claimLookupStatus === "not_found" && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2">
                  <span className="text-xs text-red-400">⚠️</span>
                  <p className="text-xs text-red-400">
                    Mã <strong>{claimCode}</strong> không tồn tại trong hệ thống.
                  </p>
                </div>
              )}

              <button
                onClick={() => { setShowClaimForm(false); setClaimCode(""); setClaimOwner(null); setClaimLookupStatus("idle"); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Huỷ
              </button>
            </div>
          )}

          {/* Referral code + link */}
          {refCode && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Mã giới thiệu của bạn</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold tracking-wider text-gradient-gold font-mono">
                    {refCode}
                  </span>
                  <CopyButton text={refCode} label="mã giới thiệu" />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Link giới thiệu</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted/50 px-3 py-2 rounded-lg border border-border truncate font-mono">
                    {referralLink}
                  </code>
                  <CopyButton text={referralLink} label="link giới thiệu" />
                  <button
                    onClick={async () => {
                      try {
                        await navigator.share({ title: "NOOI", text: "Tham gia NOOI với mã của tôi!", url: referralLink });
                      } catch {
                        await navigator.clipboard.writeText(referralLink);
                        toast.success("Đã sao chép link giới thiệu");
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Share2 className="size-3.5" />
                    Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Change ref code ── */}
          {refCode && !showChangeForm && changesRemaining > 0 && (
            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowChangeForm(true)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                ✏️ Đổi mã ({changesRemaining} lần còn lại)
              </button>
            </div>
          )}

          {refCode && showChangeForm && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Lưu ý:</span> Còn <strong>{changesRemaining} lần</strong> đổi mã.
              </p>
              <Label htmlFor="new-ref-code" className="text-xs">Mã giới thiệu mới</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="new-ref-code"
                    placeholder="VD: AN, AN1, BICH..."
                    value={newCode}
                    onChange={(e) => { setNewCode(e.target.value.toUpperCase()); setNewCodeStatus("idle"); }}
                    className={`h-10 text-sm font-mono pr-10 ${
                      newCodeStatus === "valid" ? "border-emerald-500/50 ring-1 ring-emerald-500/20" :
                      newCodeStatus === "taken" || newCodeStatus === "same" ? "border-red-500/50 ring-1 ring-red-500/20" :
                      ""
                    }`}
                    maxLength={10}
                  />
                  {/* Status icon inside input */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {newCodeStatus === "validating" && (
                      <div className="size-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                    )}
                    {newCodeStatus === "valid" && (
                      <svg className="size-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                    {newCodeStatus === "taken" && (
                      <svg className="size-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    )}
                    {newCodeStatus === "same" && (
                      <svg className="size-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                      </svg>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleChangeRefCode}
                  disabled={changing || newCodeStatus !== "valid"}
                  className="h-10"
                  size="sm"
                >
                  {changing ? "Đang xử lý..." : "Xác nhận"}
                </Button>
              </div>

              {/* Status message */}
              {newCodeStatus === "same" && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2">
                  <p className="text-xs text-amber-400">
                    Mã mới giống với mã hiện tại — không có gì thay đổi.
                  </p>
                </div>
              )}
              {newCodeStatus === "taken" && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2">
                  <p className="text-xs text-red-400">
                    Mã <strong>{newCode}</strong> đã tồn tại. Vui lòng chọn mã khác.
                  </p>
                </div>
              )}
              {newCodeStatus === "invalid_format" && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2">
                  <p className="text-xs text-red-400">
                    Mã chỉ gồm chữ hoa và số, từ 2-10 ký tự.
                  </p>
                </div>
              )}
              {newCodeStatus === "valid" && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2">
                  <p className="text-xs text-emerald-400">
                    ✅ Mã <strong>{newCode}</strong> có thể sử dụng được.
                  </p>
                </div>
              )}

              <button
                onClick={() => { setShowChangeForm(false); setNewCode(""); setNewCodeStatus("idle"); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Huỷ
              </button>
            </div>
          )}

          {/* Stats */}
          <SectionSeparator />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="size-4 text-primary" />
              <span className="text-sm font-medium">Thống kê giới thiệu</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
              <div className="p-3 rounded-lg border border-border bg-muted/20 text-center">
                <p className="text-2xl font-bold text-gradient-gold">{referralStats?.total_referred ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Đã mời</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/20 text-center">
                <p className="text-2xl font-bold text-gradient-gold">{referralStats?.joined_this_month ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tháng này</p>
              </div>
            </div>

            {/* Referral list */}
            {referralList.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Danh sách người đã mời</p>
                <div className="space-y-1.5">
                  {referralList.map((r) => (
                    <div
                      key={r.referee_id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/60 bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <span className="text-sm font-medium truncate">{r.full_name || "Người dùng"}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          r.has_onboarding
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}>
                          {r.has_onboarding ? "Đã thiết lập" : "Chưa hoàn tất"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          <LocalTime iso={r.created_at} format="short" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {referralStats && referralStats.total_referred === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">
                Chia sẻ mã giới thiệu của bạn để bắt đầu mời bạn bè!
              </p>
            )}
          </div>
        </div>
      </div>

      <SectionSeparator />

      {/* ─── SECTION 3: 3 Bản đồ số mệnh ─── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <SectionHeader icon={<Sparkles className="size-5" />} title="Bản đồ số mệnh" desc="Khám phá 3 bản đồ luận giải về con người và vận mệnh của bạn" />
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {destinyMaps.map((map) => (
              <Link
                key={map.label}
                href={map.href}
                className={`p-5 rounded-xl border bg-gradient-to-br ${map.gradient} transition-all group hover:shadow-md ${
                  map.available ? "" : "opacity-70"
                }`}
              >
                <div className={`size-10 rounded-xl ${map.iconBg} flex items-center justify-center mb-3`}>
                  {map.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                  {map.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {map.available ? "Xem báo cáo chi tiết →" : "Chưa có báo cáo"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <SectionSeparator />

      {/* ─── SECTION 4: Account Info (Lịch sử) ─── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <SectionHeader icon={<Calendar className="size-5" />} title="Lịch sử tài khoản" desc="Thông tin về tài khoản và hoạt động của bạn" />
        </div>
        <div className="px-5 py-2">
          <InfoRow label="ID tài khoản" value={<code className="text-[10px] text-muted-foreground font-mono">{user.id}</code>} />
          <InfoRow label="Ngày tham gia" value={<LocalTime iso={user.created_at} format="full" />} />
          <InfoRow label="Trạng thái" value={
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Đang hoạt động
            </span>
          } />
          <InfoRow label="Onboarding" value={profile.onboarding_completed ? "✅ Đã hoàn tất" : "⏳ Chưa hoàn tất"} />
        </div>
      </div>
    </div>
  );
}
