# OPC Center — Hướng dẫn vận hành kỹ thuật

**Phiên bản:** MVP 1 — 26/10/2026  
**Host:** https://opc.nooi.net  
**Mã nguồn:** `src/app/opc`, `src/components/opc`, `src/lib/opc`  
**Dữ liệu:** Supabase project `gsnuqrutiauhnsacgzym`

---

## 1. Kiến trúc host

`opc.nooi.net` trỏ về cùng service `nooi-web:3000` qua Traefik. Không có process riêng, không thêm RAM.

```
opc.nooi.net/            → middleware rewrite → /opc
opc.nooi.net/leads       → rewrite → /opc/leads
opc.nooi.net/leads/<id>  → rewrite → /opc/leads/<id>
opc.nooi.net/login       → trang /login dùng chung
opc.nooi.net/api/opc/*   → passthrough (route riêng của OPC)
```

Middleware: `src/middleware.ts`, nhánh `OPC_HOST`.

### Phiên đăng nhập

OPC dùng **cookie host-only riêng**: `sb-opc-auth-token`.

- Không dùng chung cookie `.nooi.net` với nooi.net/admin để tránh xung đột chunk
  (đã gây mất phiên khi rewrite path động).
- Đăng nhập một lần trên `opc.nooi.net`; phiên OPC độc lập với phiên nooi.net.
- Logout: `/auth/logout` trả về `/login` của OPC và xoá cookie OPC.
- Cấu hình: `src/lib/supabase/cookies.ts` (`OPC_AUTH_COOKIE_NAME`, `OPC_HOST`).

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
| `opc_goi` | 6 gói niêm yết |
| `opc_don_hang` | Đơn hàng, đối soát |
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
```

---

## 4. Trang

| Đường dẫn | Đối tượng | Chức năng |
|---|---|---|
| `/` | Tất cả | Dashboard theo vai trò |
| `/leads` | Nhân sự | Danh sách, tìm, lọc, thêm lead |
| `/leads/[id]` | Nhân sự | Chi tiết, đổi trạng thái, ghi chú, dòng thời gian |
| `/cong-dong` | Tất cả | Feed, đăng bài, bình luận |
| `/don-hang` | Nhân sự | Gói, đơn, doanh thu tháng |
| `/ho-so` | Tất cả | Hồ sơ cá nhân, đóng góp |

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
# Chưa đăng nhập → 307 về /login
curl -sI https://opc.nooi.net/ | head

# Trang login → 200
curl -sL -o /dev/null -w "%{http_code}\n" https://opc.nooi.net/login

# Với cookie phiên OPC hợp lệ:
#   /, /leads, /leads/<id>, /cong-dong, /don-hang, /ho-so → 200
```

Kiểm thử đã chạy 26/10/2026:

- 329/329 unit test pass.
- Build production pass.
- 6 trang trả 200 với phiên nhân sự.
- Thành viên thường: `/leads`, `/don-hang` bị chặn; RLS `opc_lead` trả rỗng.
- Tạo lead, đổi trạng thái, đăng bài, bình luận: đã chạy thật rồi xoá dữ liệu thử.

---

## 8. Giới hạn MVP hiện tại

- Chưa nối cổng thanh toán; đơn hàng hiển thị để đối soát thủ công.
- Chưa có LMS/khóa học, email/Zalo tự động, báo cáo xuất file.
- Audit mới ghi thao tác CRM (`opc_nhat_ky`), chưa ghi mọi thao tác cộng đồng.
- Chưa có trang quản trị gói/giá; sửa trực tiếp bảng `opc_goi` (chỉ quản trị).
- Phiên OPC tách khỏi nooi.net (đăng nhập riêng trên opc.nooi.net).

## 9. Việc tiếp theo (theo thứ tự)

1. Nhập danh sách lead thật + gán chủ.
2. Cấp vai trò cho 13 nhân sự lõi.
3. Nối cổng thanh toán (PayOS/SePay) → tự tạo `opc_don_hang`.
4. Đồng bộ lead từ Facebook/Zalo về `opc_lead`.
5. Báo cáo tuần tự động từ `opc_kpi_ngay`.
