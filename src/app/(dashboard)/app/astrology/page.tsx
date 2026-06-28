import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AstrologyPageClient } from "./AstrologyPageClient";

export default async function AstrologyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/app/setup");
  if (!profile?.date_of_birth) redirect("/app/setup");

  return <AstrologyPageClient profile={profile} />;
}
