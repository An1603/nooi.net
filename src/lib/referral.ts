// Referral utility functions

import { createClient } from "@/lib/supabase/client";

/* ─── Helpers ─── */

/**
 * Strip Vietnamese diacritics to ASCII
 */
function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * Extract the base ref code from a full name: given name (last word), uppercase, no truncation.
 * E.g. "Nguyễn Văn An" → "AN", "Trần Thị Bích" → "BICH", "Lê Phương" → "PHUONG"
 */
export function getRefBase(fullName: string): string {
  const cleaned = stripDiacritics(fullName)
    .replace(/[^a-zA-Z\s]/g, "")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const givenName = words.length > 0 ? words[words.length - 1] : "U";
  return givenName.toUpperCase() || "U";
}

/**
 * Generate a unique referral code from a name.
 * Pattern: Given name (full) + sequential number if needed.
 * E.g. "Nguyễn Văn An" → "AN" (if AN not taken), else "AN1", "AN2"…
 */
export async function generateRefCode(fullName: string): Promise<string> {
  const base = getRefBase(fullName);
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("ref_code")
    .ilike("ref_code", `${base}%`)
    .limit(200);

  const existing = new Set((data ?? []).map((r) => r.ref_code));

  // Try without number first
  if (!existing.has(base)) return base;

  // Sequential numbering
  let i = 1;
  while (existing.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

/**
 * Validate a custom ref code: no special chars, not empty, not taken.
 */
export async function validateCustomRefCode(code: string, excludeUserId?: string): Promise<string | null> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return "Mã không được để trống.";
  if (!/^[A-Z0-9]{2,10}$/.test(trimmed))
    return "Mã chỉ gồm chữ hoa và số, từ 2-10 ký tự.";

  try {
    const params = new URLSearchParams({ code: trimmed });
    if (excludeUserId) params.set("userId", excludeUserId);
    const res = await fetch(`/api/ref-code/check?${params}`);
    const data = await res.json();
    return data.available ? null : (data.error || "Mã không khả dụng.");
  } catch {
    return "Không thể kiểm tra mã. Vui lòng thử lại.";
  }
}

/**
 * Look up a user by their referral code (case-insensitive).
 */
export async function lookupRefCode(code: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("lookup_ref_code", {
    code: code.trim().toUpperCase(),
  });
  if (error || !data) return null;
  return data as unknown as string;
}

/**
 * Set referred_by for the current user.
 * Only works ONCE — if user already has a referrer, returns error.
 */
export async function setReferredBy(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("referred_by")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.referred_by) {
    return { success: false, error: "Bạn đã có người giới thiệu, không thể thay đổi." };
  }

  const referrerId = await lookupRefCode(code);
  if (!referrerId) return { success: false, error: "Mã giới thiệu không hợp lệ." };
  if (referrerId === userId) return { success: false, error: "Bạn không thể tự giới thiệu chính mình." };

  const { error } = await supabase
    .from("profiles")
    .update({ referred_by: referrerId })
    .eq("user_id", userId)
    .is("referred_by", null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Get the referrer info for a user
 */
export async function getReferrer(userId: string): Promise<{ full_name: string; ref_code: string } | null> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("referred_by")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.referred_by) return null;

  const { data: referrer } = await supabase
    .from("profiles")
    .select("full_name, ref_code")
    .eq("user_id", profile.referred_by)
    .maybeSingle();

  return referrer ? { full_name: referrer.full_name, ref_code: referrer.ref_code ?? "" } : null;
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(userId: string): Promise<{ total_referred: number; joined_this_month: number }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_referral_stats", { p_user_id: userId });
  if (error || !data) return { total_referred: 0, joined_this_month: 0 };
  return data as unknown as { total_referred: number; joined_this_month: number };
}

/**
 * Get referral list for a user
 */
export async function getReferralList(
  userId: string
): Promise<{ referee_id: string; full_name: string; created_at: string; has_onboarding: boolean }[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_referral_list", { p_user_id: userId });
  if (error || !data) return [];
  return data as unknown as { referee_id: string; full_name: string; created_at: string; has_onboarding: boolean }[];
}

/**
 * Build the referral link for a code
 */
export function getReferralLink(refCode: string): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL || "https://nooi.net"}/signup?ref=${refCode}`;
}

/**
 * Look up a ref code and return the owner's info.
 * Used for confirmation step before claiming.
 */
export async function getRefCodeOwnerInfo(code: string): Promise<{ full_name: string; ref_code: string; user_id: string } | null> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return null;

  const supabase = createClient();
  const { data: owner } = await supabase
    .from("profiles")
    .select("full_name, ref_code, user_id")
    .eq("ref_code", trimmed)
    .maybeSingle();

  if (!owner) return null;
  return {
    full_name: owner.full_name || "Người dùng",
    ref_code: owner.ref_code ?? trimmed,
    user_id: owner.user_id,
  };
}

/**
 * Get how many times the user has changed their ref code.
 * Uses profile.ref_code_changes (DB column, INT DEFAULT 0).
 */
export async function getRefCodeChangeCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("ref_code_changes")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.ref_code_changes as number) ?? 0;
}

/**
 * How many changes remaining (out of 3).
 */
export async function getRefCodeChangesRemaining(userId: string): Promise<number> {
  const count = await getRefCodeChangeCount(userId);
  return Math.max(0, 3 - count);
}

/**
 * Change a user's ref code.
 * - Checks uniqueness
 * - Max 3 changes
 * - Updates relationships are unaffected (tree uses user_id, not ref_code)
 */
export async function changeRefCode(
  userId: string,
  newCode: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = newCode.trim().toUpperCase();
  if (!trimmed) return { success: false, error: "Mã không được để trống." };
  if (!/^[A-Z0-9]{2,10}$/.test(trimmed))
    return { success: false, error: "Mã chỉ gồm chữ hoa và số, từ 2-10 ký tự." };

  try {
    const res = await fetch("/api/ref-code/change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newCode: trimmed }),
    });
    return await res.json();
  } catch {
    return { success: false, error: "Không thể đổi mã. Vui lòng thử lại." };
  }
}

/* ─── Cookie helpers (client-side only) ─── */

const REF_COOKIE_NAME = "nooi_ref";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export function saveRefCodeToCookie(code: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${REF_COOKIE_NAME}=${encodeURIComponent(code)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

export function getRefCodeFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${REF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function clearRefCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${REF_COOKIE_NAME}=;path=/;max-age=0;SameSite=Lax`;
}
