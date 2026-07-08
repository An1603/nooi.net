import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AIMentorFloating from "@/components/ai/AIMentorFloating";
import TourOverlay from "@/components/onboarding/TourOverlay";
import InstallPrompt from "@/components/InstallPrompt";
import { RouteLoader } from "@/components/Loading";
import SessionGuard from "@/components/SessionGuard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Route loading bar */}
      <RouteLoader />

      {/* Session guard: client-side auth + SW cleanup */}
      <SessionGuard>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile topbar */}
        <Topbar />
        <div className="flex-1 p-4 md:p-6 overflow-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* Floating AI Mentor */}
      <AIMentorFloating />

      {/* Tour onboarding */}
      <TourOverlay />

      {/* Install PWA prompt */}
      <InstallPrompt />
    </SessionGuard>
    </div>
  );
}
