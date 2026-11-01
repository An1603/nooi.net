import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// BẢO MẬT (audit 01/11/2026): danh tính lấy từ PHIÊN, không lấy `user_id` trong form.
// Trước đây client gửi user_id tuỳ ý nên ghi được ảnh vào thư mục + hồ sơ người khác
// bằng quyền service-role.
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Validate file type
    const ext = EXT_BY_MIME[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Chỉ chấp nhận JPEG, PNG, WebP, GIF" }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ảnh tối đa 5MB" }, { status: 400 });
    }

    // Service-role client để ghi storage + cập nhật hồ sơ của CHÍNH người gọi
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${user.id}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Không thể upload ảnh" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ public_avatar_url: publicUrl })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: "Không thể cập nhật avatar" }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("Upload handler error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
