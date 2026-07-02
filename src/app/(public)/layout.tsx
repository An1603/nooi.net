import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";

export const dynamic = 'force-dynamic';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read session server-side so Header knows auth state immediately
  let initialSession = false;
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();
    initialSession = !!session;
  } catch {
    // Not critical — Header will check client-side
  }

  return (
    <>
      <Header initialSession={initialSession} />
      {children}
    </>
  );
}
