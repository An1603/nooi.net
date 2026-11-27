import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { VideoFormQuanTri, type DuLieuVideo } from "../../VideoFormQuanTri";

export const dynamic = "force-dynamic";

/** Sửa một video bất kỳ — đọc bằng khoá dịch vụ nên không vướng RLS theo chủ sở hữu. */
export default async function SuaVideoQuanTri({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("videos")
    .select("id, title, description, danh_muc, url, kenh_phat, status, cong_khai, khung_hinh, thu_tu, thumbnail_url")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return <VideoFormQuanTri banDau={data as DuLieuVideo} />;
}
