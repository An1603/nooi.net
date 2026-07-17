import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditDocumentClient from "./EditDocumentClient";

export const dynamic = "force-dynamic";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Dùng admin client để load document + projects (bypass RLS)
  const adminClient = createAdminClient();
  const { data: doc } = await adminClient
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!doc) redirect("/app/library");

  // Load projects của user
  const { data: projects } = await adminClient
    .from("projects")
    .select("id, title")
    .eq("user_id", user.id)
    .order("title");

  return <EditDocumentClient doc={doc} projects={projects || []} />;
}
