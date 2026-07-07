import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = createAdminClient();
    
    // Check if columns already exist
    const { data: cols } = await supabase
      .from("profiles")
      .select("xp")
      .limit(1);
    
    if (cols !== null) {
      return NextResponse.json({ message: "Columns already exist" });
    }
  } catch { /* columns don't exist, proceed */ }

  // Run raw SQL queries one by one
  const queries = [
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS journal_streak INTEGER NOT NULL DEFAULT 0;`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_journal_date DATE;`,
  ];

  const results = [];
  for (const query of queries) {
    try {
      const { error } = await createAdminClient().rpc("exec_sql", { query });
      results.push({ query: query.substring(0, 60), error: error?.message || null });
    } catch (e) {
      results.push({ query: query.substring(0, 60), error: (e as Error).message });
    }
  }

  return NextResponse.json({ results });
}
