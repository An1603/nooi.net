import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/auth/check — kiểm tra session server-side (đọc cookie chính xác)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return NextResponse.json({
    loggedIn: !!user,
    user: user ? { id: user.id, email: user.email } : null,
  });
}
