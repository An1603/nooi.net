import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NumerologyPageClient } from "./NumerologyPageClient";

export default async function NumerologyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("numerology_report, full_name, date_of_birth, onboarding_completed, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return <NumerologyPageClient profile={profile} email={user.email} />;
}