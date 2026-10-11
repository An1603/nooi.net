# eKid v2.1 — Tách eKid thành app riêng (nhóm nhanh)

**Bối cảnh:** Sau khi v2 lên production, Ngài An yêu cầu eKid phải được cấu trúc như **một app riêng**: tài khoản con do người giám sát cấp, độc lập với hệ tài khoản nooi.net; URL gọn; giao diện sáng sinh động cho trẻ; và nhận diện NOOI ở chân trang.

**Phát hiện thực tế (đã kiểm tra code):**
- Cookie phiên nooi.net đặt `domain: ".nooi.net"` (`src/lib/supabase/cookies.ts`) → **dùng chung mọi subdomain** → đăng nhập người lớn trên nooi.net bị nhận nhầm trên ekid.nooi.net (phải dùng ẩn danh). Đây là gốc rễ cần sửa.
- PWA/manifest hiện là của NOOI (`public/manifest.json`, tên "NOOI", theme `#1a0a2e`); root layout (`src/app/layout.tsx`) đăng ký `/sw.js` + render `PWAUpdateToast` → ekid hiện toast "Cài lại… logo & icon mới".
- URL login hiện là `/ekid/login` (do middleware redirect `/login` → `/ekid/login`).

**Quyết định (Ngài An chốt):** tách **trải nghiệm** hoàn toàn (cookie riêng + PWA riêng + UI riêng), **giữ chung Supabase** (không hạ tầng/chi phí mới). "Bản đồ số mệnh" (thần số học + tử vi + chiêm tinh như mỗi tài khoản nooi.net) làm ở **phase sau**.

## Phạm vi v2.1 (nhóm nhanh)
1. **Cookie riêng (host-only) cho ekid** — phiên của ekid không dùng `domain=.nooi.net` → độc lập với nooi.net; hết cần ẩn danh.
2. **URL ngắn:** `ekid.nooi.net/login` (thay vì `/ekid/login`); các path khác giữ gọn (`/`, `/hoc/…`, `/thi/…`, `/thuong`).
3. **UI sáng, sinh động cho trẻ** — tone khác hẳn Design System tối của NOOI (nền sáng, màu tươi, nút lớn bo tròn, emoji, chữ to).
4. **Chân trang:** "Phân hệ eKid thuộc NOOI" + link tới `https://nooi.net` (trang login + trong app).
5. **PWA/manifest/icon riêng cho eKid** — tên "eKid", màu sáng, icon riêng; ẩn toast PWA của NOOI trên host ekid.

## Ngoài phạm vi (phase sau)
- "Bản đồ số mệnh" cho con: thu thập họ tên + ngày sinh + **giờ sinh** + giới tính + nơi sinh → `calculateNumerology` / `calculateTuVi` / `calculateAstrology` (đã có ở `src/lib/{numerology,tuvi,astrology}`) → lưu & hiển thị cho người giám sát.
- Guard auth cho `/api/voice/token` (lỗ hổng cũ).

## Ràng buộc kỹ thuật
- Nhánh `dev`; production = `main` (merge khi deploy). Migration SQL áp TRƯỚC deploy (deploy.sh không chạy migration) — v2.1 không cần migration mới.
- Phân nhánh theo `host` trong `src/middleware.ts` (đã có sẵn cho ekid).
- Không đổi hành vi của nooi.net/admin (host khác).
- TS strict; tiếng Việt; mobile-first.
