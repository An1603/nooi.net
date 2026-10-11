# eKid v2.7 — Bản đồ số mệnh đầy đủ chi tiết + luận giải

**Goal (Ngài An):** "Bản đồ số mệnh" phải **thật đầy đủ chi tiết, luận giải dễ hiểu**, 3 bản đồ trình bày thành **3 tab** (Thần số học · Tử vi · Chiêm tinh).

## Hiện trạng
- API `GET /api/ekid/kids/[kidId]/destiny` đã trả **đầy đủ** object `numerology` / `tuvi` / `astrology` (mỗi field kèm `meaning` luận giải tiếng Việt sẵn).
- `DestinyTab.tsx` (v2.6) chỉ render **tóm tắt** vài field — cần nâng lên **toàn bộ**.

## Cấu trúc result (để render đủ, không bỏ sót)

**NumerologyResult** (`src/lib/numerology/types.ts`):
- Core numbers: `lifePath, destiny, soulUrge, personality, birthDay, maturity, balance` — mỗi `CoreNumber{value, name, meaning, positive[], negative[], career}`.
- `periodCycles[]` `{period, ageRange, number, meaning}`; `pinnacleCycles[]` `{pinnacle, ageRange, number, meaning}`; `challengeNumbers[]` `{challenge, ageRange, number, meaning}`.
- `karmicLessons[]`, `subconsciousSelf`, `missingNumbers[]`, `cornerstones[]` `{letter, number, meaning}`.

**TuViResult** (`src/lib/tuvi/types.ts`):
- `lunarDate{nam,thang,ngay,nhuan}`; `tuTru{nam,thang,ngay,gio}` (mỗi là `CanChi{can:{name,hanh,meaning}, chi:{name,hanh}, fullName}`); `thanChu` (Thiên can ngày).
- `banMenh{napAm, hanhName, meaning}`; `cuc{name, hanh, value, meaning}`; `cungMenh` / `cungThan` `Cung{name, hanh, meaning}`; `daiHan[]` `{tuoiBatDau, tuoiKetThuc, cung.fullName, thoiGian}`.
- `tuongSinhKhac{menhCuc, namThang, thangNgay, ngayGio}`; `phanTich{tinhCach, suNghiep, tinhDuyen, sucKhoe, giaDao, taiLoc, vanHan}` mỗi `PhanTichItem{noidung, chiTiet[], loiKhuyen}`; `namHienTai{nam, amLich, hanh, tuongKhacTuoi, sao, han, meaning}`.

**AstrologyResult** (`src/lib/astrology/types.ts`):
- `sun` / `moon` (`PlanetPosition{planet, symbol, sign, signIndex, degrees, house, retrograde, meaning}`); `planets[]`; `ascendant` / `midheaven` (`{sign, degrees, meaning}`).
- `houses[]` `{number, sign, name, meaning}`; `aspects[]` `{planet1, planet2, typeVi, harmony?, meaning}`; `dominantElement`, `dominantQuality`, `sunSign`, `moonSign`, `risingSign`.
- `interpretations{tongQuan, tinhCach, suNghiep, tinhDuyen, sucKhoe, diemManh[], diemYeu[], loiKhuyen}`.

## UI
- DestinityTab → **3 sub-tab** (phía trên): `Thần số học` | `Tử vi` | `Chiêm tinh`.
- Mỗi sub-tab = renderer **chi tiết đầy đủ**, bố cục thẻ theo từng nhóm, mỗi field hiển thị **giá trị + `meaning`** (luận giải) rõ ràng — KHÔNG bỏ sót field, KHÔNG dump JSON.
- Mảng (period/pinnacle/challenge/daiHan/houses/planets/aspects/...) render dạng **danh sách thẻ** (grid/stack) đầy đủ từng phần tử.
- `phanTich`/`interpretations`/`meaning`/`positive`/`negative` hiển thị đầy đủ văn bản luận giải.
- Giữ cảnh báo thiếu giờ/nơi sinh (amber) ở đầu tab.

## Ràng buộc
- Nhánh `dev`; production = `main`; KHÔNG migration. TS strict; tiếng Việt; NOOI tokens.
- Reuse API destiny hiện có (không đổi API). Không đụng 3 trang báo cáo của nooi.net.