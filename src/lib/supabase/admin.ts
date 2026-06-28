import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client — uses service_role key for privileged operations.
 * ONLY use in server components that are already admin-gated by middleware + layout.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
