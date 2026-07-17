import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BrandFilesClient from "./BrandFilesClient";

export const dynamic = "force-dynamic";

export default async function BrandFilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin-login");

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminUser) redirect("/admin-login");

  return <BrandFilesClient />;
}
