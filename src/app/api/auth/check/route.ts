import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/auth/check — kiểm tra session server-side (đọc cookie chính xác)
export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return NextResponse.json({
    loggedIn: !!session,
    user: session?.user ? { id: session.user.id, email: session.user.email } : null,
  });
}
