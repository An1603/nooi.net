import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = createAdminClient();
  const sql = `
    CREATE TABLE IF NOT EXISTS mentors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      title TEXT, bio TEXT, specialties TEXT[] DEFAULT '{}',
      experience_years INTEGER DEFAULT 0, rating DECIMAL(2,1) DEFAULT 0,
      review_count INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS mentor_relationships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
      mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(mentor_id, mentee_id)
    );
    CREATE TABLE IF NOT EXISTS groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL, description TEXT DEFAULT '',
      mentor_id UUID REFERENCES mentors(id) ON DELETE SET NULL,
      max_members INTEGER DEFAULT 20, schedule TEXT,
      is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS group_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','mentor','leader')),
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(group_id, user_id)
    );
    ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
    ALTER TABLE mentor_relationships ENABLE ROW LEVEL SECURITY;
    ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
  `;
  
  const { error } = await supabase.rpc("exec_sql", { sql });
  if (error && error.message.includes("Could not find")) {
    // exec_sql not available, try via raw query
    const { error: e2 } = await supabase.from("mentors").select("id").limit(1);
    if (e2 && e2.message.includes("does not exist")) {
      return NextResponse.json({ error: "Tables don't exist. Please run SQL manually in Supabase dashboard." });
    }
    return NextResponse.json({ message: "Tables already exist or accessible" });
  }
  return NextResponse.json({ message: error ? error.message : "Migration OK" });
}
