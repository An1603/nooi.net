import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { layBunnyId } from "@/lib/video/kenh-phat";

/**
 * Trả về DANH SÁCH MỨC CHẤT LƯỢNG thật của một video Bunny, để nút cài đặt trong luồng xem chỉ
 * hiện những mức có thật (mỗi video Bunny một thang khác nhau — đo 26/11/2026: có bài chỉ tới 720p,
 * có bài tới 1080p).
 *
 * Vì sao phải hỏi máy chủ: trình duyệt không gọi thẳng được API Bunny (không có khoá và bị CORS),
 * và ta cũng không muốn lộ khoá ra trình duyệt.
 *
 * Đệm 1 giờ trong bộ nhớ tiến trình: một video chỉ hỏi Bunny một lần, không tốn hạn mức.
 */
const dem = new Map<string, { luc: number; muc: string[] }>();
const HAN_DEM = 60 * 60 * 1000;

/** 1080p > 720p > 480p > 360p > 240p */
function xepCaoXuong(ds: string[]): string[] {
  const so = (s: string) => Number((s.match(/(\d+)/) ?? [])[1] ?? 0);
  return [...new Set(ds)].sort((a, b) => so(b) - so(a));
}

export async function GET(req: NextRequest) {
  const id = (req.nextUrl.searchParams.get("v") ?? "").trim();
  if (!id) return NextResponse.json({ muc: [] });

  const trongDem = dem.get(id);
  if (trongDem && Date.now() - trongDem.luc < HAN_DEM) {
    return NextResponse.json({ muc: trongDem.muc, dem: true });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("videos")
    .select("url, kenh_phat, status")
    .eq("id", id)
    .maybeSingle();

  // Chỉ trả lời cho bài đã xuất bản — không để lộ thông tin bài nháp
  if (!data || data.status !== "published") return NextResponse.json({ muc: [] });

  const bunny = layBunnyId(data.url as string | null);
  const khoa = process.env.BUNNY_STREAM_API_KEY;
  if (!bunny || !khoa) return NextResponse.json({ muc: [] });

  try {
    const r = await fetch(
      `https://video.bunnycdn.com/library/${bunny.libraryId}/videos/${bunny.videoId}`,
      { headers: { AccessKey: khoa, accept: "application/json" }, cache: "no-store" }
    );
    if (!r.ok) return NextResponse.json({ muc: [] });
    const d = (await r.json()) as { availableResolutions?: string };
    const muc = xepCaoXuong(
      String(d.availableResolutions ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    dem.set(id, { luc: Date.now(), muc });
    return NextResponse.json({ muc });
  } catch {
    return NextResponse.json({ muc: [] });
  }
}
