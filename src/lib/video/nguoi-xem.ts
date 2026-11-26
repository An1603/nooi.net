import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { authCookieOptions } from "@/lib/supabase/cookies";
import type { NguoiXem } from "@/lib/video/quyen-xem";

/**
 * Ai đang xem — chỉ chạy ở phía máy chủ (đọc cookie phiên).
 *
 * Vì sao không dùng cách khác: trang `/video` là công khai nên phải tự đọc phiên ở máy chủ rồi
 * truyền kết quả xuống, KHÔNG để trình duyệt tự hỏi (đọc cookie trong trình duyệt sẽ lộ luồng
 * và không dùng lại được cho trang xem `/video/<mã>`).
 *
 * `capDo` / `diem` / `soDu` chưa có cột trong cơ sở dữ liệu nên để trống — khi nào có, chỉ cần
 * đọc thêm ở đây là cổng gác `xetQuyenXem` tự dùng.
 */
export async function nguoiDangXem(): Promise<NguoiXem> {
  try {
    const [cookieStore, h] = [await cookies(), await headers()];
    const host = h.get("host") || "";
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
        cookieOptions: authCookieOptions(host),
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { daDangNhap: false };
    return { daDangNhap: true, email: user.email ?? null };
  } catch {
    // Chưa đăng nhập / cookie hỏng đều coi như khách — không được để trang công khai sập vì việc này
    return { daDangNhap: false };
  }
}

/**
 * Cột lấy ra cho lưới công khai.
 *
 * Cố ý KHÔNG lấy `url` (đường dẫn phát nội bộ của video): lưới chỉ cần ảnh bìa + tên + danh mục,
 * còn đường phát thì chỉ trang xem `/video/<mã>` lấy ra và chỉ khi đã qua cổng gác.
 */
export const COT_LUOI_CONG_KHAI =
  "id, title, description, thumbnail_url, duration, khung_hinh, danh_muc, cong_khai, created_at";
