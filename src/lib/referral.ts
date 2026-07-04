// Referral utility functions

import { createClient } from "@/lib/supabase/client";

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
 * Generate a referral code from a name
 * Pattern: Given name (last word) stripped + up to 4 chars + 4 digits
 * E.g. "Nguyễn Văn An" → "AN8421"
 *       "Trần Thị Bích" → "BICH3952"
 *       "Lê Minh" → "MINH6174"
 */
export function generateRefCode(fullName: string): string {
  // Strip diacritics
  const cleaned = stripDiacritics(fullName)
    .replace(/[^a-zA-Z\s]/g, "") // only letters and spaces
    .trim();

  // Extract last word (given name)
  const words = cleaned.split(/\s+/).filter(Boolean);
  const givenName = words.length > 0 ? words[words.length - 1] : "U";

  // Take max 4 chars, uppercase
  const base = givenName.toUpperCase().slice(0, 4) || "U";
  const digits = Math.floor(1000 + Math.random() * 9000); // 4 digits
  return `${base}${digits}`;
}

/**
 * Look up a user by their referral code
 * Returns the referrer's user_id or null
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
export async function setReferredBy(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  // Check if user already has a referrer
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
  if (!referrerId) {
    return { success: false, error: "Mã giới thiệu không hợp lệ." };
  }
  if (referrerId === userId) {
    return { success: false, error: "Bạn không thể tự giới thiệu chính mình." };
  }

  // Extra safety: only update if referred_by is still NULL (race condition)
  const { error } = await supabase
    .from("profiles")
    .update({ referred_by: referrerId })
    .eq("user_id", userId)
    .is("referred_by", null);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Get the referrer info for a user
 */
export async function getReferrer(
  userId: string
): Promise<{ full_name: string; ref_code: string } | null> {
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

  return referrer
    ? { full_name: referrer.full_name, ref_code: referrer.ref_code ?? "" }
    : null;
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(
  userId: string
): Promise<{ total_referred: number; joined_this_month: number }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_referral_stats", {
    p_user_id: userId,
  });
  if (error || !data) return { total_referred: 0, joined_this_month: 0 };
  const result = data as unknown as {
    total_referred: number;
    joined_this_month: number;
  };
  return result;
}

/**
 * Get referral list for a user
 */
export async function getReferralList(
  userId: string
): Promise<
  {
    referee_id: string;
    full_name: string;
    created_at: string;
    has_onboarding: boolean;
  }[]
> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_referral_list", {
    p_user_id: userId,
  });
  if (error || !data) return [];
  return data as unknown as {
    referee_id: string;
    full_name: string;
    created_at: string;
    has_onboarding: boolean;
  }[];
}

/**
 * Build the referral link for a code
 */
export function getReferralLink(refCode: string): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL || "https://nooi.net"}/signup?ref=${refCode}`;
}

/* ─── Cookie helpers (client-side only) ─── */

const REF_COOKIE_NAME = "nooi_ref";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Save referral code to a 30-day cookie.
 * Overwrites any previous ref code (last one wins).
 */
export function saveRefCodeToCookie(code: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${REF_COOKIE_NAME}=${encodeURIComponent(
    code
  )};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

/**
 * Read the referral code from cookie (if any).
 */
export function getRefCodeFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${REF_COOKIE_NAME}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : "";
}

/**
 * Clear the referral cookie.
 */
export function clearRefCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${REF_COOKIE_NAME}=;path=/;max-age=0;SameSite=Lax`;
}
