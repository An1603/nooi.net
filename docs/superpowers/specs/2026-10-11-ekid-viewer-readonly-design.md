# eKid v2.8 — Quyền "Xem" = hoàn toàn chỉ-đọc

**Goal (Ngài An):** Khi được phân quyền **"Xem" (viewer)**, người đó **không được chỉnh sửa/cài đặt bất kỳ điều gì** trong phần con → **ẨN HẾT nút và ô nhập** (không phải chỉ mờ/disabled), chỉ còn hiển thị **giá trị chỉ-đọc**.

## Hiện trạng (v2.7)
- `KidConsole`: `canEdit = is_owner || is_admin_caregiver` → viewer `canEdit=false`.
- `AccountTab` / `SettingsTab`: viewer thấy Input/Select **`disabled`** (vẫn hiện) + ẩn nút Lưu. → chưa đạt "ẩn hết".
- `RelativesTab`: non-owner vẫn thấy khối **"Nhập mã liên kết"** (hành động GHI) → phải ẩn với viewer.
- Server đã chặn ghi cho viewer (v2.4 review) — lần này thuần UI.

## Yêu cầu
1. **AccountTab** khi `!canEdit`: render **bảng thông tin chỉ-đọc** (Tên, Ngày sinh, Avatar, Giờ sinh, Giới tính, Nơi sinh, Tên đăng nhập, Trạng thái, Cấp) — **KHÔNG** Input/Select/nút Lưu. Khối quản trị (khoá/xoá/mật khẩu/username) vốn đã chỉ-owner → vẫn ẩn.
2. **SettingsTab** khi `!canEdit`: render **bảng cài đặt chỉ-đọc** (khung giờ học, số buổi/ngày, môn học, nguyên tắc, phần thưởng…) dạng text — **KHÔNG** control/nút Lưu.
3. **RelativesTab**: ẩn khối "Nhập mã liên kết" khi không phải owner (viewer đã liên kết, không cần hành động). Danh sách người giám sát giữ nguyên dạng chỉ-đọc (owner vẫn thấy đủ nút quản trị).
4. Rà soát mọi tab còn lại (destiny/report) đảm bảo không còn control chỉnh sửa hiển thị cho viewer.

## Ràng buộc
- Nhánh `dev`; production = `main`; KHÔNG migration, KHÔNG đổi API/quyền server (đã đúng).
- TS strict; tiếng Việt; NOOI tokens.
- Không đổi hành vi của owner và quản lý (admin caregiver vẫn thấy nút như v2.7).