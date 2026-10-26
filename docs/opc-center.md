# OPC Center — Hướng dẫn vận hành kỹ thuật

**Phiên bản:** MVP 1 — 26/10/2026  
**Host:** https://opc.nooi.net  
**Mã nguồn:** `src/app/opc`, `src/app/opc-public`, `src/components/opc`, `src/lib/opc`  
**Dữ liệu:** Supabase project `gsnuqrutiauhnsacgzym`

---

## 1. Kiến trúc host

`opc.nooi.net` trỏ về cùng service `nooi-web:3000` qua Traefik. Không có process riêng, không thêm RAM.

```
opc.nooi.net/            → chưa đăng nhập: /opc-public (cửa hàng)
                         → đã đăng nhập:  /opc (dashboard)
opc.nooi.net/goi         → rewrite → /opc-public/goi
opc.nooi.net/chan-doan   → rewrite → /opc-public/chan-doan
opc.nooi.net/dat-mua/... → rewrite → /opc-public/dat-mua/...
opc.nooi.net/cam-on      → rewrite → /opc-public/cam-on
opc.nooi.net/leads       → rewrite → /opc/leads
opc.nooi.net/leads/<id>  → rewrite → /opc/leads/<id>
opc.nooi.net/login       → trang /login dùng chung; copy riêng khi vào từ host OPC
opc.nooi.net/api/opc/*   → passthrough (route riêng của OPC)
```

Middleware: `src/middleware.ts`, nhánh `OPC_HOST`.

### Phiên đăng nhập

OPC dùng **chung cookie `.nooi.net`** với nooi.net/app/admin: SSO thật.

- Tên cookie mặc định `sb-gsnuqrutiauhnsacgzym-auth-token`, `Domain=.nooi.net`.
- Đăng nhập một lần ở `nooi.net` **hoặc** `opc.nooi.net`; cả hai nhận phiên.
- Client (`createBrowserClient`), server (`createServerClient`) và middleware dùng
  **cùng** `authCookieOptions(host)` — không còn biến thể host-only gây mất phiên.
- Logout: `POST /auth/logout`; xoá cookie domain `.nooi.net` → đăng xuất cả hai.
  `GET /auth/logout` trả **405** để tránh prefetch/CSRF tự đá phiên.
- Phiên cũ `sb-opc-auth-token` được dọn tự động khi gặp; người dùng cũ đăng nhập lại một lần.
- Cấu hình: `src/lib/supabase/cookies.ts` (`authCookieOptions`, `OPC_HOST`).

---

## 2. Phân quyền

### Vai trò hiệu lực

Hàm DB `public.opc_vai_tro()`:

1. Nếu user có trong `public.admin_users` → `quan_tri` (toàn quyền).
2. Ngược lại lấy `public.opc_nguoi.vai_tro`.

| Vai trò | Quyền chính |
|---|---|
| `quan_tri` | Tất cả, kể cả đổi vai trò, xoá, cấu hình |
| `dieu_hanh` | CRM, cộng đồng, đơn hàng, KPI |
| `sales` | CRM, cộng đồng, đơn hàng |
| `success` | CRM, cộng đồng, ticket |
| `mentor` | Cộng đồng, hồ sơ |
| `thanh_vien` | Cộng đồng, hồ sơ của mình |

### Cấp quyền nhân sự

```sql
-- Chỉ quản trị (admin_users) mới đổi được vai trò.
update public.opc_nguoi
set vai_tro = 'sales'
where email = 'ten@nooi.net';
```

RLS chặn tự nâng quyền: trigger `opc_guard_vai_tro`.

---

## 3. Dữ liệu

| Bảng | Mục đích |
|---|---|
| `opc_nguoi` | Một người — một hồ sơ, gắn `auth.users` |
| `opc_ho_so` | Ngành, quy mô, mục tiêu, điểm chín |
| `opc_lead` | Phễu 7 trạng thái: lead → mql → sql → customer → active → at_risk → churned |
| `opc_hoat_dong` | Dòng thời gian chăm sóc lead |
| `opc_ticket` | Yêu cầu hỗ trợ |
| `opc_goi` | 10 gói niêm yết (6 lõi + 4 mở rộng) |
| `opc_don_hang` | Đơn hàng, đối soát; `lead_id` nối lead công khai |
| `opc_bai_dang` | Bài cộng đồng |
| `opc_binh_luan` | Bình luận |
| `opc_kpi_ngay` | KPI theo ngày |
| `opc_nhat_ky` | Audit thao tác CRM |
| `opc_nguoi_cong_khai` | View tên + vai trò cho cộng đồng (không lộ liên hệ) |

Migration:

```bash
cd ~/nooi.net
python3 scripts/apply-sql-api.py supabase/migrations/20261026000001_opc_center.sql
python3 scripts/apply-sql-api.py supabase/migrations/20261026000002_opc_public_view.sql
python3 scripts/apply-sql-api.py supabase/migrations/20261026000003_opc_public_storefront.sql
python3 scripts/apply-sql-api.py supabase/migrations/20261026000004_opc_membership_values.sql
```

`20261026000004` cập nhật 7 quyền lợi hiển thị của Membership (cộng đồng doanh nhân OPC,
workshop/office hours, kết nối đối tác, sự kiện chuyên gia, ưu đãi pháp lý–kế toán–AI–không gian,
cơ hội giới thiệu, thư viện mẫu). Không đổi giá/kỳ hạn.

---

## 4. Trang

| Đường dẫn | Đối tượng | Chức năng |
|---|---|---|
| `/` | Chưa đăng nhập | Landing 3 cấp độ: người mới, đang vận hành, đi xa hơn; 8 giá trị cộng đồng; block khách hàng hiện hữu |
| `/goi` | Công khai | Danh mục 10 sản phẩm nhóm theo 3 cấp độ + callout giá trị cộng đồng + FAQ |
| `/chan-doan` | Công khai | 10 câu hỏi, kết quả sơ bộ, thu lead |
| `/dat-mua/[ma]` | Công khai | Đặt mua hoặc nhận tư vấn |
| `/cam-on` | Công khai | Xác nhận dự phòng |
| `/login` | Công khai | Đăng nhập; copy “Tiếp tục hành trình OPC” khi vào từ host OPC |
| `/` | Đã đăng nhập | Dashboard theo vai trò |
| `/leads` | Nhân sự | Danh sách, tìm, lọc, thêm lead |
| `/leads/[id]` | Nhân sự | Chi tiết, đổi trạng thái, ghi chú, dòng thời gian |
| `/cong-dong` | Tất cả | Feed, đăng bài, bình luận |
| `/don-hang` | Nhân sự | Gói, đơn, doanh thu tháng |
| `/ho-so` | Tất cả | Hồ sơ cá nhân, đóng góp |

### 4.1 Trang chủ công khai — ba cấp độ khách hàng

Trang chủ phục vụ bốn trạng thái khách, không dùng chung một thông điệp:

| Nhóm | Nội dung chính | CTA |
|---|---|---|
| Người mới | H1 + giải thích OPC = One-Person Company, Cấp 1 (Khởi tạo, Chuẩn hóa, Launch) | Chẩn đoán 20 phút |
| Đang vận hành | Cấp 2 (Membership, Pro, AI Agent) + đầu ra từng gói | Xem gói vận hành |
| Đi xa hơn | Cấp 3 (Retreat, Residency, Partner, Certified) | Xem cấp mở rộng |
| Khách hiện hữu | Block “Đã là khách hàng OPC?” | Đăng nhập không gian của tôi |

Nguyên tắc: nhóm theo cấp thay vì danh sách phẳng 10 gói; giá chính xác ở `/goi`;
chỉ một CTA chính mỗi màn hình; không bắt đăng nhập trước khi chẩn đoán/đặt mua.
`/login` đổi tiêu đề và mô tả theo host để không lẫn với cửa hàng NOOI chung.

### 4.2 Giá trị cộng đồng — `#gia-tri`

Trang chủ có section **“Không chỉ là một gói học”** với 8 thẻ giá trị, đặt sau danh mục sản phẩm:

| Thẻ | Nội dung cốt lõi |
|---|---|
| Hội & chính sách | Gia nhập Hội doanh nhân OPC; kết nối chương trình hỗ trợ nhà nước/tổ chức hỗ trợ |
| Người dẫn đường | Chuyên gia, khách mời, người có ảnh hưởng; mentor theo cấp |
| Kết nối kinh doanh | Đối tác, nhà cung cấp, nguồn hàng, nhân lực, phân phối, thi công |
| Cộng đồng tương hỗ | Nhóm cùng giai đoạn, mastermind, hỏi đáp, accountability |
| Khách hàng & doanh thu | Giới thiệu, bán chéo, mở kênh, case study |
| Năng lực & uy tín | Đào tạo, OPC Certified, hồ sơ năng lực |
| Nguồn lực & vốn | Ưu đãi pháp lý – kế toán, AI, không gian; kết nối ngân hàng/quỹ |
| Chuyển hóa & cân bằng | Retreat, Residency, wellness tại NOOI Forest |

`/goi` có callout ngắn “Giá trị cộng đồng” liên kết về `/#gia-tri`.
Chi tiết 10 giá trị, ranh giới truyền thông và việc cần làm:
`~/hermes-notes/projects/NOOI/opc-center/00-dieu-hanh/OPC-CENTER-GIA-TRI-CONG-DONG-MANG-LUOI-2026-10-26.md`.

---

## 5. Nhập lead từ CSV

Mẫu: `docs/opc-lead-import-template.csv`

```bash
# Kiểm tra trước, không ghi
python3 scripts/opc_import_leads.py --file docs/opc-lead-import-template.csv --dry-run

# Nhập thật
python3 scripts/opc_import_leads.py --file /duong/dan/leads.csv
```

Cột: `ten` (bắt buộc), `sdt`, `email`, `nguon`, `kenh`, `trang_thai`, `diem`, `ghi_chu`,
`chu_so_huu_email`. Nếu `chu_so_huu_email` không khớp `opc_nguoi.email`, lead vẫn được
nhập nhưng chưa gán chủ (có cảnh báo).

---

## 6. Triển khai

```bash
cd ~/nooi.net
npx tsc --noEmit
npm test
bash deploy.sh "feat(opc): mô tả thay đổi"
```

Deploy build → push `dev` → restart `nooi.service` → health check → purge Cloudflare.

Traefik: `/docker/traefik/config/nooi.yml`, rule `nooi-http` và `nooi-https`
đã thêm `Host(\`opc.nooi.net\`)`.

---

## 7. Kiểm thử production

```bash
# Chưa đăng nhập → 200 cửa hàng công khai
curl -sI https://opc.nooi.net/ | head

# Các trang công khai → 200
curl -sL -o /dev/null -w "%{http_code}\n" https://opc.nooi.net/goi
curl -sL -o /dev/null -w "%{http_code}\n" https://opc.nooi.net/chan-doan
curl -sL -o /dev/null -w "%{http_code}\n" https://opc.nooi.net/dat-mua/pro

# Khu vực nội bộ chưa đăng nhập → 307 về /login
curl -sI https://opc.nooi.net/leads | head

# Trang login → 200
curl -sL -o /dev/null -w "%{http_code}\n" https://opc.nooi.net/login

# Với cookie phiên OPC hợp lệ:
#   /, /leads, /leads/<id>, /cong-dong, /don-hang, /ho-so → 200
```

Kiểm thử đã chạy 26/10/2026:

- 344/344 unit test pass (20 file).
- Build production pass.
- Cửa hàng công khai: 5 route 200; chẩn đoán tạo lead 62/100 (`sql`, Pro);
  đặt mua tạo đơn `membership` 399.000đ (`cho_tt`) gắn `lead_id`.
- 6 trang nội bộ trả 200 với phiên nhân sự.
- Thành viên thường: `/leads`, `/don-hang` bị chặn; RLS `opc_lead` trả rỗng.
- Tạo lead, đổi trạng thái, đăng bài, bình luận: đã chạy thật rồi xoá dữ liệu thử.
- Dữ liệu QA của cửa hàng công khai đã xoá sau kiểm thử.

---

## 8. Giới hạn MVP hiện tại

- Chưa nối cổng thanh toán; đơn hàng hiển thị để đối soát thủ công.
- Cửa hàng công khai chưa gửi email/Zalo xác nhận tự động; nhân sự liên hệ tay trong 4 giờ.
- Chưa có LMS/khóa học, email/Zalo tự động, báo cáo xuất file.
- Audit mới ghi thao tác CRM (`opc_nhat_ky`), chưa ghi mọi thao tác cộng đồng.
- Chưa có trang quản trị gói/giá; sửa trực tiếp bảng `opc_goi` (chỉ quản trị).
- Phiên dùng chung `.nooi.net`; chưa có đăng xuất theo từng thiết bị (logout là toàn bộ).
- Rate limit form công khai lưu in-memory theo process; restart sẽ reset.
- Chưa có analytics phễu view → chẩn đoán → đặt mua.

## 9. Việc tiếp theo (theo thứ tự)

1. Nhập danh sách lead thật + gán chủ.
2. Cấp vai trò cho 13 nhân sự lõi.
3. Nối cổng thanh toán (PayOS/SePay) → tự tạo `opc_don_hang`.
4. Gửi email/Zalo xác nhận tự động sau khi đặt mua.
5. Đồng bộ lead từ Facebook/Zalo về `opc_lead`.
6. Báo cáo tuần tự động từ `opc_kpi_ngay`.
