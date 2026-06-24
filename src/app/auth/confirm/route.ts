import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type) {
    // TODO: Confirm email with Supabase
    return NextResponse.redirect(`${origin}/login?confirmed=true`);
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
