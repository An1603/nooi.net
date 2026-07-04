// Referral utility functions

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Generate a referral code from a name
 * Pattern: First 4 uppercase chars of name + 4 random digits
 * E.g. "Nguyen Van A" → "NGUY8421"
 */
export function generateRefCode(fullName: string): string {
  // Take first 4 uppercase chars (strip diacritics + non-alpha)
  const cleaned = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove combining diacritical marks
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();

  const base = cleaned.slice(0, 4) || "U";
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
 * Set referred_by for the current user
 */
export async function setReferredBy(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  const referrerId = await lookupRefCode(code);
  if (!referrerId) {
    return { success: false, error: "Mã giới thiệu không hợp lệ." };
  }
  if (referrerId === userId) {
    return { success: false, error: "Bạn không thể tự giới thiệu chính mình." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ referred_by: referrerId })
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Get the referrer info for a user
 */
export async function getReferrer(userId: string): Promise<{ full_name: string; ref_code: string } | null> {
  const supabase = createClient();
  // First get the profile to see who referred us
  const { data: profile } = await supabase
    .from("profiles")
    .select("referred_by")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.referred_by) return null;

  // Then get the referrer's info
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
  const { data, error } = await supabase.rpc("get_referral_stats", {
    p_user_id: userId,
  });
  if (error || !data) return { total_referred: 0, joined_this_month: 0 };
  const result = data as unknown as { total_referred: number; joined_this_month: number };
  return result;
}

/**
 * Get referral list for a user
 */
export async function getReferralList(userId: string): Promise<
  { referee_id: string; full_name: string; created_at: string; has_onboarding: boolean }[]
> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_referral_list", {
    p_user_id: userId,
  });
  if (error || !data) return [];
  return data as unknown as { referee_id: string; full_name: string; created_at: string; has_onboarding: boolean }[];
}

/**
 * Build the referral link for a code
 */
export function getReferralLink(refCode: string): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL || "https://nooi.net"}/signup?ref=${refCode}`;
}
