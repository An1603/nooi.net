import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  commonsSearchUrl,
  pickCommonsImage,
  sanitizeMediaQuery,
  youtubeWatchUrl,
  ytDlpSearch,
  type FoundMedia,
} from "@/lib/ekid/media-find";
import { checkYouTubeEmbeddable, MEDIA_USER_AGENT } from "@/lib/ekid/media-validate";
import { rateLimited } from "@/lib/ekid/rate-limit";

// Cần Node runtime: gọi `yt-dlp` (tiến trình con) + phân giải DNS khi kiểm link.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface KidRow {
  id: string;
  user_id: string | null;
  child_user_id: string | null;
}

async function permittedKid(userId: string, kidId: string): Promise<KidRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_kids")
    .select("id, user_id, child_user_id")
    .eq("id", kidId)
    .maybeSingle();
  if (!data) return null;
  const kid = data as KidRow;
  if (kid.user_id === userId || kid.child_user_id === userId) return kid;
  return null;
}

const notFound: FoundMedia = { ok: false, kind: null, url: null };

/** Tìm ẢNH thật trên Wikimedia Commons (không cần key). */
async function findImage(query: string): Promise<FoundMedia> {
  try {
    const res = await fetch(commonsSearchUrl(query), {
      headers: { "User-Agent": MEDIA_USER_AGENT },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return notFound;
    const image = pickCommonsImage(await res.json());
    if (!image) return notFound;
    return { ok: true, kind: "image", url: image.url, title: image.title, source: "commons" };
  } catch {
    return notFound;
  }
}

/** Tìm VIDEO YouTube thật (qua `yt-dlp`) rồi chỉ nhận video NHÚNG ĐƯỢC. */
async function findVideo(query: string): Promise<FoundMedia> {
  const candidates = await ytDlpSearch(query, 5);
  for (const c of candidates) {
    if (await checkYouTubeEmbeddable(c.id)) {
      return {
        ok: true,
        kind: "video",
        url: youtubeWatchUrl(c.id),
        videoId: c.id,
        title: c.title,
        source: "youtube",
      };
    }
  }
  return notFound;
}

/**
 * GET /api/ekid/media/find?kid_id=<uuid>&q=<từ khoá>&kind=image|video
 *
 * TÌM nội dung THẬT theo từ khoá để AI không phải tự bịa link (đo được: model Live hay
 * đưa chữ thường hoặc link TRANG WEB → luôn hỏng). Ảnh: Wikimedia Commons (không key).
 * Video: YouTube search bằng `yt-dlp` (không key) + kiểm nhúng qua oEmbed.
 * Quyền: chủ hồ sơ HOẶC tài khoản con. KHÔNG BAO GIỜ ném lỗi ra ngoài.
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const sp = new URL(req.url).searchParams;

    const kidId = (sp.get("kid_id") ?? "").trim();
    if (!UUID_RE.test(kidId)) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
    }
    if (!(await permittedKid(user.id, kidId))) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }
    if (rateLimited(`find:${user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Quá nhiều yêu cầu" }, { status: 429 });
    }

    const query = sanitizeMediaQuery(sp.get("q") ?? "");
    if (!query) return NextResponse.json({ error: "Thiếu từ khoá" }, { status: 400 });

    const kind = (sp.get("kind") ?? "image").trim().toLowerCase();
    if (kind !== "image" && kind !== "video") {
      return NextResponse.json({ error: "Loại nội dung không hợp lệ" }, { status: 400 });
    }

    const found = kind === "video" ? await findVideo(query) : await findImage(query);
    return NextResponse.json(found);
  } catch {
    return NextResponse.json(notFound);
  }
}
