# Fix Report — I1: link_code không UNIQUE + tra toàn cục (luồng liên kết eKid)

Ngày: 2026-10-11 · Nhánh: `dev` · Nguồn: `relative-review.md` Finding I1 (Important).

## Vấn đề
`ekid_caregivers.link_code` không có ràng buộc duy nhất, trong khi mã được tra
**toàn cục theo `link_code`** (không scope theo `kid_id`). Khi hai lời mời `pending`
trùng mã, truy vấn `.limit(1)` (không `ORDER BY`) chọn tuỳ ý một dòng → người nhập mã
có thể bị **gắn nhầm sang bé khác**. Xác suất tăng theo quy mô (10k pending ≈ 4.55%,
50k ≈ 68.8%).

## Thay đổi

### 1. Migration `supabase/migrations/20261011000004_ekid_link_code_unique.sql`
Partial unique index trên mã **đang chờ**:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_ekid_caregivers_linkcode_pending
  ON public.ekid_caregivers (link_code)
  WHERE status = 'pending' AND link_code IS NOT NULL;
```

- Chỉ ràng buộc dòng `pending` + `link_code NOT NULL`; dòng `linked`/`rejected` giữ mã
  cũ để tra cứu lịch sử mà không chặn mã mới.
- **Đã áp** qua Supabase Management API (token dòng cuối `~/.hermes/.env`, `sbp_…`,
  project `gsnuqrutiauhnsacgzym`): `APPLY status=201`.
- **Đã verify** index tồn tại:
  `CREATE UNIQUE INDEX idx_ekid_caregivers_linkcode_pending ON public.ekid_caregivers USING btree (link_code) WHERE ((status = 'pending'::text) AND (link_code IS NOT NULL))`.

### 2. `src/app/api/ekid/caregivers/route.ts` — POST nhánh tạo lời mời
Bọc insert tạo lời mời (cả nhánh `{kid_id, caregiver_user_id?, role}` lẫn nhánh sinh
`link_code`) trong vòng **RETRY tối đa 5 lần**:

- Chỉ retry khi lỗi là `23505` **và** thông điệp/details/hint có `link_code`
  (đúng partial unique index vừa tạo). Mỗi lần retry gọi `generateLinkCode()` sinh mã mới.
- Lỗi `23505` do ràng buộc khác (vd trùng `kid_id`+`caregiver_user_id`) hoặc lỗi không
  phải `23505` → **dừng ngay**, trả `error.message` như cũ (không đổi hành vi).
- Hết 5 lần vẫn va chạm → `500` thông báo rõ:
  "Không sinh được mã liên kết duy nhất sau 5 lần thử, vui lòng thử lại".
- **Không thay đổi** các nhánh khác (nhập mã `{code}`, GET, PATCH).

## Kiểm chứng
| Bước | Kết quả |
|---|---|
| `npx tsc --noEmit` | exit 0 (sạch, TS strict) |
| `next lint --file src/app/api/ekid/caregivers/route.ts` | ✔ No ESLint warnings or errors |
| `npm run test` | 2 file, **41 test PASS** |
| `npm run build` | exit 0; `.next/BUILD_ID` = `8wmNsTDeWBVnCabDbVJ-8` |
| Index trên Supabase | tồn tại, `UNIQUE … WHERE status='pending' AND link_code IS NOT NULL` |

## Ghi chú
- Index bảo vệ ở tầng DB; retry trong route đảm bảo UX không lỗi khi hiếm gặp trùng mã.
- Finding I2 (rate-limit), M1/M2/M3 nằm ngoài phạm vi fix này.
