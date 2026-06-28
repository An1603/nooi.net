import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TuViReportClient } from "./TuViReportClient";

export default async function TuViPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If no tuvi data yet, check if they have basic info
  if (!profile?.tuvi_report) {
    // If they don't even have date_of_birth, redirect to setup
    if (!profile?.date_of_birth) {
      redirect("/app/tuvi/setup");
    }
    // If they have DOB but no report, we'll calculate on the client
    // Pass the profile data so the client can calculate
  }

  if (!profile) redirect("/app/tuvi/setup");

  return <TuViReportClient profile={profile} />;
}
