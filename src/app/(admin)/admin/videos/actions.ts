"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { layBunnyId } from "@/lib/video/kenh-phat";

/**
 * Thao tác QUẢN TRỊ trên kho video — thêm · sửa · xoá (kèm xoá bản trên Bunny) · đổi thứ tự.
 *
 * Vì sao dùng khoá dịch vụ (bỏ qua RLS) chứ không dùng phiên của người đang đăng nhập: quản trị
 * phải sửa/xoá được video của NGƯỜI KHÁC, còn RLS của bảng `videos` khoá theo chủ sở hữu. Vì khoá
 * dịch vụ bỏ qua mọi hàng rào, mỗi hàm ở đây phải tự kiểm quyền trước khi làm gì — xem `phaiQuanTri`.
 */

type KetQua = { ok: true } | { error: string };

/** Bắt buộc người gọi là quản trị (có dòng trong `admin_users`); trả về email để ghi log. */
async function phaiQuanTri(): Promise<{ ok: true; email: string; role: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập." };

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminUser) return { error: "Không có quyền quản trị." };
  return { ok: true, email: adminUser.email ?? user.email ?? "", role: adminUser.role };
}

/** Đọc form thành bản ghi video. Không dùng zod ở đây: form quản trị có sẵn ràng buộc HTML. */
function docForm(formData: FormData) {
  const lay = (k: string) => (formData.get(k) ?? "").toString().trim();
  const title = lay("title");
  if (!title) throw new Error("Tiêu đề không được để trống.");

  const kenh = lay("kenh_phat");
  const url = lay("url") || null;

  return {
    title,
    description: lay("description") || null,
    danh_muc: lay("danh_muc") || null,
    url,
    kenh_phat: kenh === "bunny" || kenh === "truc-tiep" ? kenh : "youtube",
    status: ["processing", "ready", "failed", "published"].includes(lay("status"))
      ? lay("status")
      : "processing",
    cong_khai: lay("cong_khai") === "on" || lay("cong_khai") === "true",
    khung_hinh: lay("khung_hinh") === "doc" ? "doc" : "ngang",
    thu_tu: Math.max(0, Math.min(9999, Number(lay("thu_tu")) || 0)),
    thumbnail_url: lay("thumbnail_url") || null,
  };
}

function lamMoi() {
  revalidatePath("/admin/videos");
  revalidatePath("/video");
  revalidatePath("/app/videos");
}

/** THÊM video mới. `user_id` = chính quản trị đang tạo (cột này là chủ sở hữu, không phải tác giả). */
export async function taoVideo(formData: FormData): Promise<KetQua> {
  const qt = await phaiQuanTri();
  if ("error" in qt) return qt;

  let duLieu;
  try {
    duLieu = docForm(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Dữ liệu không hợp lệ." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { error } = await admin.from("videos").insert({ ...duLieu, user_id: user!.id });
  if (error) return { error: error.message };

  lamMoi();
  redirect("/admin/videos");
}

/** SỬA video bất kỳ. */
export async function suaVideo(id: string, formData: FormData): Promise<KetQua> {
  const qt = await phaiQuanTri();
  if ("error" in qt) return qt;

  let duLieu;
  try {
    duLieu = docForm(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Dữ liệu không hợp lệ." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("videos")
    .update({ ...duLieu, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  lamMoi();
  redirect("/admin/videos");
}

/**
 * XOÁ video. Nếu là video Bunny và người dùng chọn `xoaTrenBunny`, xoá luôn bản gốc trên Bunny
 * Stream — làm Bunny TRƯỚC: xoá hàng trong cơ sở dữ liệu trước rồi mới gọi Bunny thì mất thông tin
 * (mã thư viện + mã video) để xoá, và bản trên Bunny sẽ nằm lại vĩnh viễn.
 *
 * Bunny lỗi thì DỪNG, không xoá trong cơ sở dữ liệu — để người quản trị biết mà xử lý, tránh cảnh
 * “đã xoá trên web nhưng vẫn còn trên Bunny” (vẫn phát được bằng link trực tiếp).
 */
export async function xoaVideo(
  id: string,
  xoaTrenBunny: boolean
): Promise<KetQua & { bunny?: string }> {
  const qt = await phaiQuanTri();
  if ("error" in qt) return qt;
  if (qt.role !== "super_admin" && qt.role !== "admin") {
    return { error: "Chỉ quản trị cấp admin trở lên được xoá video." };
  }

  const admin = createAdminClient();
  const { data: video, error: loiDoc } = await admin
    .from("videos")
    .select("id, url, kenh_phat")
    .eq("id", id)
    .maybeSingle();
  if (loiDoc) return { error: loiDoc.message };
  if (!video) return { error: "Không tìm thấy video." };

  let bunny = "";
  if (xoaTrenBunny && video.kenh_phat === "bunny") {
    bunny = await xoaBunny(video.url);
    if (bunny.startsWith("LỖI")) return { error: bunny };
  }

  const { error } = await admin.from("videos").delete().eq("id", id);
  if (error) return { error: error.message };

  lamMoi();
  return { ok: true, bunny: bunny || undefined };
}

/**
 * Gọi API Bunny Stream để xoá một video. Trả về câu mô tả kết quả (hiện lại cho người quản trị),
 * hoặc chuỗi bắt đầu bằng "LỖI" khi thất bại.
 */
async function xoaBunny(url: string | null): Promise<string> {
  const khoa = process.env.BUNNY_STREAM_API_KEY;
  if (!khoa) return "LỖI: thiếu BUNNY_STREAM_API_KEY trên máy chủ.";

  const id = layBunnyId(url);
  if (!id) return "LỖI: không đọc được mã thư viện/mã video Bunny từ đường dẫn của bài này.";

  try {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${id.libraryId}/videos/${id.videoId}`,
      { method: "DELETE", headers: { AccessKey: khoa }, cache: "no-store" }
    );
    if (res.status === 404) return "Bunny: video không còn trên thư viện (đã xoá trước đó).";
    if (!res.ok) {
      const noiDung = await res.text().catch(() => "");
      return `LỖI: Bunny từ chối xoá (HTTP ${res.status}) ${noiDung.slice(0, 120)}`;
    }
    return "Bunny: đã xoá bản gốc.";
  } catch (e) {
    return `LỖI: không gọi được Bunny (${e instanceof Error ? e.message : "lỗi mạng"})`;
  }
}

/**
 * ĐỔI THỨ TỰ MẶC ĐỊNH trong một danh mục — đưa một bài lên/xuống một bậc.
 *
 * Cách làm: đọc cả danh mục theo đúng thứ tự đang hiển thị (thu_tu giảm dần, rồi mới nhất), đổi chỗ
 * hai bài rồi GHI LẠI `thu_tu` cho toàn danh mục theo công thức (số bài − vị trí) × 10. Ghi lại cả
 * loạt thay vì chỉ đổi hai số: nhờ vậy thứ tự luôn liền mạch, không sinh khoảng trống hay trùng số
 * sau nhiều lần kéo, và bài ghim cũ (1000) cũng được đưa về đúng chỗ người quản trị nhìn thấy.
 */
export async function doiThuTu(
  danhMuc: string,
  id: string,
  huong: "len" | "xuong"
): Promise<KetQua> {
  const qt = await phaiQuanTri();
  if ("error" in qt) return qt;

  const admin = createAdminClient();
  let truyVan = admin
    .from("videos")
    .select("id, thu_tu, created_at")
    .order("thu_tu", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);

  truyVan = danhMuc ? truyVan.eq("danh_muc", danhMuc) : truyVan.is("danh_muc", null);

  const { data, error } = await truyVan;
  if (error) return { error: error.message };

  const ds = (data ?? []) as { id: string; thu_tu: number | null; created_at: string }[];
  const i = ds.findIndex((v) => v.id === id);
  if (i === -1) return { error: "Không tìm thấy video trong danh mục này." };

  const j = huong === "len" ? i - 1 : i + 1;
  if (j < 0 || j >= ds.length) return { ok: true }; // đã ở đầu/cuối — không làm gì

  [ds[i], ds[j]] = [ds[j], ds[i]];

  const tong = ds.length;
  for (let k = 0; k < tong; k++) {
    const giaTri = (tong - k) * 10;
    if (ds[k].thu_tu !== giaTri) {
      const { error: loiGhi } = await admin.from("videos").update({ thu_tu: giaTri }).eq("id", ds[k].id);
      if (loiGhi) return { error: loiGhi.message };
    }
  }

  lamMoi();
  revalidatePath("/admin/videos/sap-xep");
  return { ok: true };
}

/** Đặt lại toàn bộ danh mục về thứ tự mới nhất trước (thu_tu = 0 cho tất cả). */
export async function boThuTu(danhMuc: string): Promise<KetQua> {
  const qt = await phaiQuanTri();
  if ("error" in qt) return qt;

  const admin = createAdminClient();
  let truyVan = admin.from("videos").update({ thu_tu: 0 });
  truyVan = danhMuc ? truyVan.eq("danh_muc", danhMuc) : truyVan.is("danh_muc", null);

  const { error } = await truyVan;
  if (error) return { error: error.message };

  lamMoi();
  revalidatePath("/admin/videos/sap-xep");
  return { ok: true };
}
