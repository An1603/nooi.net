import { createClient } from "@/lib/supabase/server";
import { LibraryClient } from "./LibraryClient";

// Ngài An's user ID — brand assets owner
const BRAND_OWNER_ID = "6d273d8b-800d-48da-bfce-d37033625e68";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; type?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // User's personal documents
  const { data: userDocs } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user?.id)
    .neq("file_type", "journal")
    .order("updated_at", { ascending: false });

  // Brand assets — visible to everyone
  const { data: brandDocs } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", BRAND_OWNER_ID)
    .neq("file_type", "journal")
    .order("updated_at", { ascending: false });

  // Merge: brand assets first, then user docs
  const documents = [...(brandDocs || []), ...(userDocs || [])];

  // Extract unique categories
  const categories = new Set<string>();
  documents.forEach((d) => {
    try {
      const c = JSON.parse(d.content || "{}");
      if (c.category) categories.add(c.category);
    } catch {}
  });

  return <LibraryClient documents={documents} categories={[...categories].sort()} />;
}
