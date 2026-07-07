import { createClient } from "@/lib/supabase/server";
import { LibraryClient } from "./LibraryClient";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; type?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user?.id)
    .neq("file_type", "journal")
    .order("updated_at", { ascending: false });

  // Extract unique categories
  const categories = new Set<string>();
  documents?.forEach((d) => {
    try {
      const c = JSON.parse(d.content || "{}");
      if (c.category) categories.add(c.category);
    } catch {}
  });

  return <LibraryClient documents={documents || []} categories={[...categories].sort()} />;
}
