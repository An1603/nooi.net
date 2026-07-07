import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "NOOI — Kết nối chuyển mình | Thân khỏe, Tâm minh",
  description:
    "Hệ sinh thái giáo dục trải nghiệm và chuyển hóa thân tâm. AI Mentor đồng hành, nhật ký Thân-Tâm-Hành, thiền định, khí công, và cộng đồng an nhiên.",
  keywords: [
    "NOOI", "kết nối chuyển mình", "thân khỏe tâm minh", "chuyển hóa thân tâm",
    "thiền định", "AI Mentor", "nhật ký", "phát triển bản thân", "healing",
  ],
  openGraph: {
    title: "NOOI — Kết nối chuyển mình",
    description: "Thân khỏe, Tâm minh — Hệ sinh thái chuyển hóa toàn diện.",
    locale: "vi_VN",
    type: "website",
    siteName: "NOOI",
  },
  twitter: {
    card: "summary",
    title: "NOOI — Kết nối chuyển mình",
    description: "Thân khỏe, Tâm minh — Hệ sinh thái chuyển hóa toàn diện.",
  },
  robots: { index: true, follow: true },
};

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
