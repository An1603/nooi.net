# NOOI — Thư viện ảnh

> **Ghi chú lưu trữ (24/09/2026).** Đây là bản sao bộ pipeline scrape/download/kiểm tra
> của Thư viện ảnh, lưu trong repo `nooi.net` tại `scripts/gallery-pipeline/` **sau khi
> thư mục gốc `~/hermes-notes/dev/nooi-gallery` được xoá** (bản cũ đồng bộ 2 chiều qua
> Syncthing nên xoá ở Mac là mất luôn bản trên VPS).
>
> - **Ảnh đang phục vụ production**: `public/gallery/` trong repo này (447MB, **không
>   commit vào Git** — xem `.gitignore`). nooi.net/gallery phục vụ trực tiếp từ đó.
> - **Cần thêm ảnh/board mới?** Dựng lại thư mục làm việc theo cấu trúc ở mục
>   "Cấu trúc" bên dưới, copy `boards.json` + `data/` vào, rồi chạy các script này trên
>   máy có Chrome (đúng như README gốc). Sau đó đồng bộ vào `public/gallery/` bằng
>   `bash scripts/sync-gallery.sh` (script tự thêm thẻ `<base href="/gallery/">`).
> - ⚠️ **`index.html`, `styles.css`, `app.js` giờ CHỈ tồn tại ở `public/gallery/`** —
>   bản gốc trong vault đã bị xoá cùng thư mục. Mọi chỉnh sửa giao diện thư viện phải
>   làm trực tiếp trên `public/gallery/`. Khi dựng lại thư mục làm việc để refresh, nhớ
>   copy 3 file này (và `assets/`) từ `public/gallery/` sang, để bản mới không ghi đè
>   các thay đổi đã deploy (vd: logo góc trái là link về nooi.net, thẻ `<base>`).
> - `data/pins-raw.json` (13MB dữ liệu thô) không được giữ — scrape lại được.

Webapp quản lý & chia sẻ thư viện ảnh lấy từ các board Pinterest của
[NOOI_Net](https://www.pinterest.com/NOOI_Net/). `boards.json` có **17 board**,
trong đó **1 board đang ẩn** (`Xúc, hút`) — nên web hiện **16 board / 1.738 ảnh**:

| Board | Pin | Ảnh |
|---|---|---|
| [NOOI Work](https://www.pinterest.com/NOOI_Net/nooi-work/) | 194 | 165 |
| [Cap_ray](https://www.pinterest.com/NOOI_Net/cap_ray/) | 68 | 57 |
| [CAMP, Glamping](https://www.pinterest.com/NOOI_Net/camp-glamping/) | 42 | 40 |
| [HOME Mobile](https://www.pinterest.com/NOOI_Net/home-mobile/) | 36 | 34 |
| [HOME, Villa, Box](https://www.pinterest.com/NOOI_Net/home-villa-box/) | 458 | 436 |
| [Toan khu](https://www.pinterest.com/NOOI_Net/toan-khu/) | 55 | 55 |
| [Nha Trung Tam](https://www.pinterest.com/NOOI_Net/nha-trung-tam/) | 70 | 64 |
| [San, luoi, lau](https://www.pinterest.com/NOOI_Net/san-luoi-lau/) | 287 | 257 |
| [Be Boi](https://www.pinterest.com/NOOI_Net/be-boi/) | 6 | 6 |
| [VuiChoi](https://www.pinterest.com/NOOI_Net/vuichoi/) | 68 | 64 |
| [Hang rao, chan](https://www.pinterest.com/NOOI_Net/hang-rao-chan/) | 122 | 117 |
| [Trang trí nhà cửa](https://www.pinterest.com/NOOI_Net/trang-tr%C3%AD-nh%C3%A0-c%E1%BB%ADa/) | 19 | 19 |
| [Sân khấu, hội trường](https://www.pinterest.com/NOOI_Net/s%C3%A2n-kh%E1%BA%A5u-h%E1%BB%99i-tr%C6%B0%E1%BB%9Dng/) | 24 | 24 |
| [Trang trí cảnh quan](https://www.pinterest.com/NOOI_Net/trang-tr%C3%AD-c%E1%BA%A3nh-quan/) | 156 | 155 |
| [Đường, cổng](https://www.pinterest.com/NOOI_Net/%C4%91%C6%B0%E1%BB%9Dng-c%E1%BB%95ng/) | 251 | 205 |
| [Đồ trang trí (Ý Đạo)](https://www.pinterest.com/NOOI_Net/%C4%91%E1%BB%93-trang-tr%C3%AD-%C3%BD-%C4%91%E1%BA%A1o/) | 40 | 40 |
| ~~Xúc, hút~~ *(đang ẩn)* | 13 | — |
| **Tổng đang hiện** | **1.896** | **1.738** |

Toàn bộ ảnh được tải về máy (**~456 MB** cho phần đang hiện), nên trang chạy độc
lập hoàn toàn — không phụ thuộc Pinterest lúc xem, kể cả khi board bị đổi hoặc xoá.

Danh sách board nằm trong `boards.json`, thêm/bớt/ẩn board chỉ cần sửa file đó.

## Mở thư viện

**Cách 1 — nhấp đúp:** mở file `Mở thư viện ảnh.command`, trình duyệt tự bật lên.

**Cách 2 — dòng lệnh:**

```bash
npm run serve
```

Rồi mở http://127.0.0.1:8123/

**Cách 3 — gửi cho người khác:** copy/nén cả thư mục này rồi gửi. Người nhận
nhấp đúp `index.html` là xem được ngay, không cần cài gì và không cần server
(dữ liệu đã nhúng sẵn trong `data/gallery.js`).

## Tính năng

| | |
|---|---|
| **Lưới masonry** | Nhiều cột, tự cân chiều cao, số cột đổi theo bề rộng màn hình |
| **Nhiều board** | Gộp 16 board vào một thư viện, lọc riêng từng board; nhóm lọc tự ẩn nếu chỉ có 1 board |
| **Ẩn / hiện board** | Cờ `"hidden": true` trong `boards.json` — board biến khỏi web nhưng ảnh vẫn giữ trên máy, bỏ cờ là hiện lại ngay |
| **Thanh lọc gọn** | Chip board nằm trong dải cuộn ngang (có mờ dần ở mép báo còn board phía sau) nên thêm board không làm header cao lên |
| **Logo NOOI** | Logo khoá ngang ở góc trên trái, logo đầy đủ + tagline ở chân trang, favicon riêng |
| **Thống kê** | Số ảnh + số board ở góc trên phải, cạnh nút đổi chế độ sáng/tối |
| **Không nhảy layout** | Kích thước ảnh đã biết trước nên lưới hiện đúng ngay từ đầu |
| **Lazy-load** | Chỉ tải ảnh khi sắp vào tầm nhìn, hiện dần mượt mà |
| **Lọc ảnh** | Lọc theo board, hướng (dọc / ngang / vuông) và tông màu (ấm / xanh lá / xanh dương / trung tính) — kết hợp được với nhau |
| **Lightbox** | Bấm ảnh để xem bản lớn, tối đa 1600px; có ghi rõ ảnh thuộc board nào |
| **Bàn phím** | `Tab` tới ảnh · `Enter`/`Space` mở · `←` `→` chuyển ảnh · `Esc` đóng và trả focus về ảnh vừa xem |
| **Sáng / tối** | Nút góc phải, tự nhớ lựa chọn; mặc định theo hệ thống. Logo tự đổi bản màu ↔ trắng theo chế độ |
| **Mobile** | Vuốt trái/phải **hoặc** lên/xuống đều chuyển ảnh (vuốt trái/lên → ảnh sau, vuốt phải/xuống → ảnh trước); thanh lọc gộp thành 2 hàng cuộn ngang, bộ đếm ghim ở mép phải |
| **Không cần server** | Dữ liệu nhúng sẵn nên nhấp đúp `index.html` vẫn xem được |

## Thêm / bớt board

Sửa `boards.json`:

```json
{
  "user": "NOOI_Net",
  "boards": [
    { "slug": "nooi-work",       "path": "/NOOI_Net/nooi-work/" },
    { "slug": "xuc-hut",         "path": "/NOOI_Net/x%C3%BAc-h%C3%BAt/", "hidden": true },
    { "slug": "camp-glamping",   "path": "/NOOI_Net/camp-glamping/" },
    { "slug": "home-villa-box",  "path": "/NOOI_Net/home-villa-box/" },
    { "slug": "duong-cong",      "path": "/NOOI_Net/%C4%91%C6%B0%E1%BB%9Dng-c%E1%BB%95ng/" }
  ]
}
```

`slug` là tên dùng trong dữ liệu, `path` là đường dẫn board trên Pinterest.
Thêm dòng mới rồi chạy `npm run refresh`.

### Ẩn / hiện một board

Thêm `"hidden": true` vào board muốn giấu:

```json
{ "slug": "xuc-hut", "path": "/NOOI_Net/x%C3%BAc-h%C3%BAt/", "hidden": true }
```

Rồi chạy `npm run download` (không cần scrape lại).

Board bị ẩn sẽ **biến khỏi webapp** — không còn chip lọc, ảnh không hiện, không
tính vào tổng số. Nhưng:

- **Ảnh vẫn nằm trên máy**, script vẫn tải bù/cập nhật như thường.
- **Không xoá gì cả.** Bỏ `"hidden"` đi rồi chạy `npm run download` là board hiện
  lại ngay, không phải scrape lại từ Pinterest.

Nói cách khác: `hidden` là công tắc hiển thị, không phải lệnh xoá.

> **Vì sao `slug` viết không dấu?** Board có tên tiếng Việt (`Đường, cổng`) dùng
> slug ASCII (`duong-cong`) để làm khoá dữ liệu và thuộc tính HTML cho an toàn;
> phần dấu vẫn giữ nguyên trong `path`. Tên hiển thị thì lấy từ Pinterest lúc
> scrape, nên trên web vẫn ra đúng "Đường, cổng".

Trước khi thêm, nên kiểm tra board có công khai không:

```bash
node scripts/board-info.mjs https://www.pinterest.com/NOOI_Net/ten-board/
node scripts/board-info.mjs --user NOOI_Net      # liệt kê mọi board công khai
```

Board không tồn tại hoặc để riêng tư sẽ bị Pinterest chuyển hướng về `/ideas/` —
script phát hiện và **bỏ qua board đó**, ghi lỗi vào manifest chứ không làm hỏng
cả thư viện.

> **Board riêng tư (secret board) không lấy được.** Pinterest chuyển hướng người
> chưa đăng nhập về `/ideas/`, và board cũng không xuất hiện trong danh sách board
> công khai — nên script không có cách nào thấy nó. Cách xử lý: vào board →
> `⋯` → *Chỉnh sửa board* → tắt **"Giữ board này ở chế độ riêng tư"** → Lưu, chạy
> `npm run refresh`, rồi bật lại chế độ riêng tư. Ảnh đã nằm trên máy nên thư viện
> vẫn xem được bình thường sau khi board được đặt riêng tư trở lại.
>
> *Board `Cap_ray` ban đầu ở chế độ riêng tư và đã được lấy theo cách này.*

## Logo

Logo NOOI được đưa vào 3 chỗ: **góc trên trái** (logo khoá ngang — ký hiệu + chữ
NOOI + tagline), **chân trang** (logo đầy đủ + tagline), và **favicon**.

Góc trên trái chỉ có logo, không kèm chữ. Tiêu đề `<h1>NOOI</h1>` vẫn có nhưng
đặt `.sr-only` — chỉ trình đọc màn hình thấy, để trang không mất tiêu đề cấp 1
mà phần nhìn vẫn sạch. Số ảnh / số board chuyển sang **góc trên phải**, cạnh nút
đổi chế độ sáng/tối.

Bộ nhận diện gốc nằm ở `~/Desktop/MEDIA/NOOi_Brand/OK_New_icon`. Không dùng thẳng
file gốc được, vì:

- File gốc 1630×750 nhưng phần hình chỉ chiếm giữa, thừa nhiều lề trong suốt.
- `Nooi_icon_c.png` / `Nooi_icon_w_c.png` có một **vòng tròn mờ (alpha ~50%)** phía
  sau ký hiệu. Đưa thẳng vào web thì trên nền sáng vòng tròn gần như tàng hình,
  trên nền tối lại thành một đĩa sáng — hai chế độ nhìn khác hẳn nhau.
- **`Nooi_Logo_iconNew_w.png` là bản trắng**, chỉ dùng được trên nền tối. Trên nền
  sáng nó gần như mất hút. Vì webapp có cả hai chế độ nên cần **cả cặp**.

`scripts/logo-assets.mjs` xử lý hết: cắt sát nội dung, **trừ nền theo alpha** để
tách ký hiệu khỏi vòng tròn, rồi xuất ra `assets/`:

| File | Dùng ở đâu |
|---|---|
| `nooi-header.png` | Logo khoá ngang, góc trên trái, chế độ sáng |
| `nooi-header-white.png` | Logo khoá ngang, góc trên trái, chế độ tối |
| `nooi-logo.png` | Logo đầy đủ + tagline, chân trang, chế độ sáng |
| `nooi-logo-white.png` | Logo đầy đủ + tagline, chân trang, chế độ tối |
| `nooi-mark.png`, `nooi-mark-white.png` | Ký hiệu trơ (dự phòng, chưa dùng trên trang) |
| `favicon.png`, `apple-touch-icon.png` | Nền tím đặc + ký hiệu trắng |

> **Vì sao header và footer dùng hai file khác nhau?** Nội dung logo có tỉ lệ
> 1386×577 ≈ **2.40:1**. Bản footer để trong canvas 640×320 (2:1) nên bị thừa lề
> trên/dưới. Bản header dùng đúng tỉ lệ 560×233 để khối logo không bị đội thêm
> khoảng trong suốt — nhờ vậy canh lề dọc trong header mới chuẩn.

Chạy lại khi có bộ nhận diện mới:

```bash
node scripts/logo-assets.mjs
```

Màu thương hiệu: **`#6c2c9c`** (biến CSS `--brand`).

> **Vì sao favicon dùng nền tím đặc?** Bản đầu mình làm nền `#fafaf9` cho nhẹ — nhưng
> trên thanh tab sáng thì nền đó gần như vô hình, favicon thành ra chỉ có mỗi ký hiệu
> tím lơ lửng. Nền tím đặc thì hiện rõ trên cả tab sáng lẫn tab tối, lại đúng màu
> thương hiệu.

## Cập nhật thư viện

Khi bạn thêm ảnh mới lên Pinterest:

```bash
npm run refresh     # lấy pin mới + tải ảnh mới về
```

Hoặc chạy riêng từng bước:

```bash
npm run scrape      # chỉ lấy danh sách pin  -> data/pins-raw.json
npm run download    # chỉ tải ảnh + sinh manifest -> data/gallery.json
```

`download` **chỉ thêm file, không bao giờ xoá**. Ảnh đã có thì bỏ qua, ảnh thiếu
thì tải bù — nên chạy lại rất nhanh và luôn an toàn.

Nếu script dừng giữa đường, cứ chạy lại `npm run download` để tải nốt phần thiếu.

## Cấu trúc

```
nooi-gallery/
├── index.html            # khung trang
├── styles.css            # giao diện masonry + lightbox
├── app.js                # dàn lưới, lazy-load, lọc, lightbox
├── boards.json           # danh sách board cần lấy (17 board, 1 đang ẩn)
├── Mở thư viện ảnh.command
├── assets/               # logo đã xử lý (xem mục "Logo")
├── data/
│   ├── pins-raw.json     # dữ liệu thô từ Pinterest (1.909 pin / 17 board)
│   ├── gallery.json      # manifest app đọc (1.738 ảnh / 16 board)
│   └── gallery.js        # chính manifest đó, nhúng sẵn để chạy bằng file://
├── images/
│   ├── thumbs/           # 236px — dùng cho lưới (~34 MB)
│   └── full/             # tối đa 1600px — dùng cho lightbox (~422 MB)
└── scripts/
    ├── scrape.mjs        # lấy pin từ mọi board trong boards.json
    ├── download.mjs      # tải ảnh + sinh manifest (tôn trọng cờ `hidden`)
    ├── serve.mjs         # server tĩnh
    ├── board-info.mjs    # soi 1 board, hoặc liệt kê board của 1 user
    ├── logo-assets.mjs   # xử lý bộ logo -> assets/
    ├── verify.mjs        # kiểm tra tự động (lọc board/hướng/màu, trạng thái rỗng, board ẩn, lightbox, file://, logo, bàn phím)
    ├── responsive.mjs    # kiểm tra ở 5 kích thước màn hình
    ├── many-boards.mjs   # kiểm tra thanh lọc khi có nhiều board (header không cao lên, chip không bị bóp)
    └── final-shot.mjs    # chụp ảnh nghiệm thu lưới + lightbox
```

Tổng dung lượng: **~456 MB** cho phần đang hiện (1.738 ảnh × 2 cỡ, trong đó 422 MB
bản lớn + 34 MB bản nhỏ). Trên đĩa còn thêm ~3 MB ảnh của board đang ẩn.

## Ghi chú kỹ thuật

**Vì sao 1.909 pin thành 1.738 ảnh?** Hai lý do, đừng nhầm lẫn:

- **158 pin dùng lại đúng một ảnh đã có trong cùng board** (trùng `image_signature`)
  → gộp lại, không hiện ảnh trùng trong lưới.
- **13 pin thuộc board đang ẩn** (`Xúc, hút`) → không vào thư viện.

1.909 − 13 (ẩn) = 1.896 pin đang hiện; 1.896 − 158 (trùng) = **1.738 ảnh**.

**Ảnh trùng giữa các board thì sao?** Khoá gộp là `board + chữ ký ảnh`, nên nếu
cùng một ảnh được ghim ở nhiều board thì nó hiện ở tất cả — lọc theo board nào
cũng thấy đúng. Chỉ những ảnh trùng *trong cùng một board* mới bị gộp. Vì vậy
**1.738 ảnh nhưng chỉ có 1.702 file trên đĩa**: 36 ảnh được hai board dùng chung,
mỗi ảnh chỉ lưu một lần.

**Vì sao số pin Pinterest báo thường cao hơn số lấy được?** Pinterest báo board
*NOOI Work* có 196 pin nhưng feed chỉ trả 194; *Cap_ray* 71 so với 68; *HOME, Villa,
Box* báo 465 nhưng lấy được 458. Đã kiểm tra: board không có pin nào bị sót trong
dải id — đây là bộ đếm của Pinterest bị lệch (chuyện thường gặp), không phải mất
dữ liệu.

**Ảnh lightbox lấy từ đâu?** Từ bản `originals` của Pinterest, thu nhỏ về tối đa
1600px bằng `sips` có sẵn trên macOS. Bản `736x` không đủ nét trên màn hình lớn,
nên phải dùng bản gốc. Script **chỉ thu nhỏ, không bao giờ phóng to** — 1.443/1.738
ảnh gốc vốn nhỏ hơn 1600px nên được giữ nguyên, tránh làm mờ giả tạo và phình dung
lượng. 295 ảnh còn lại chạm trần 1600px.

> **Lỗi đã sửa (1):** bước thu nhỏ từng chỉ chạy ở đường *nâng cấp nguồn ảnh*, không
> chạy ở đường *tải bù ảnh thiếu*. Hệ quả là ảnh tải bù giữ nguyên cỡ gốc — lần quét
> sau phát hiện **146 ảnh vượt 1600px** (nặng tới 510 MB). Nay mọi ảnh lớn đều đi qua
> `.tmp` → thu nhỏ → rename, và script còn có bước quét sửa những ảnh đã lỡ vượt cỡ
> (thu nhỏ tại chỗ, không tải lại, không xoá gì).

> **Lỗi đã sửa (2) — WebP đội lốt `.jpg`:** Pinterest có lúc trả **ảnh WebP ở URL
> kết thúc bằng `.jpg`**. `sips -Z` (sửa tại chỗ) **không ghi được WebP** nên báo lỗi,
> và vì lỗi không được bắt nên **4 ảnh bị loại khỏi thư viện**. Nay script đọc
> **magic bytes** để biết file thật sự là JPEG hay không, và nếu không phải thì chuyển
> định dạng bằng `sips -s format jpeg` ra file mới rồi mới rename — lần chạy gần nhất
> đã chuyển **72 ảnh** kiểu này. Quan trọng hơn: nếu bước chuẩn hoá lỗi thì script
> **vẫn giữ file gốc** — thà có ảnh hơi nặng còn hơn mất ảnh.

**Lọc theo tông màu dựa trên gì?** Dùng `dominant_color` mà Pinterest trả kèm mỗi
pin — không cần gắn nhãn thủ công. Cách phân loại ưu tiên **độ bão hoà và độ sáng
trước, rồi mới tới hue**: ảnh kiến trúc/nội thất phần lớn là tông trung tính, nếu
gán bừa theo hue sẽ phân loại sai. Ngưỡng: bão hoà < 0.12 hoặc độ sáng < 0.20 →
"trung tính"; còn lại chia theo hue (ấm < 70°, xanh lá < 165°, xanh dương < 260°).

Phân bố thực tế (1.738 ảnh): ấm 942 · xanh lá 382 · trung tính 320 · xanh dương 94.
Hướng ảnh: dọc 1.149 · ngang 378 · vuông 211.

**Thanh lọc khi có 16 board.** Nếu để chip board xuống dòng thì thanh lọc dính trên
đầu trang sẽ cao dần theo số board. Nên chip board nằm trong một dải **cuộn ngang**
(`.filters__scroll`, có mask mờ dần ở mép báo còn board phía sau), còn phần còn lại
(hướng, tông màu, bộ đếm) ghim bên phải và **không co lại**. Hai lỗi đã gặp ở đây:

- `.filters__rest` để `flex: 1 1 auto` thì nó co lại trong khi nội dung bên trong
  không co được → **tràn cả trang 400px**. Phải là `flex: 0 0 auto`.
- `.filters__scroll` để `display: block` thì `#boardGroup` nhận `width: 100%` thay vì
  co theo nội dung, khiến chip bị flex-shrink **bóp chữ xuống dòng**. Phải là
  `display: flex`.

`npm run many-boards` là test canh hai lỗi này: dựng manifest 16 board rồi khẳng định
header không quá 30% chiều cao màn hình, trang không tràn, dải board cuộn được, và
chip không bị bóp.

**Cách lấy dữ liệu.** Endpoint `BoardFeedResource` của Pinterest trả **403**
nếu thiếu header `X-APP-VERSION` khớp với bản build hiện tại. Script mở board
bằng Chrome thật để lấy session, đọc `appVersion` từ `script#__PWS_DATA__`,
rồi gọi API ngay trong context của trang và lặp theo bookmark.

Vì `appVersion` thay đổi theo thời gian, script **luôn đọc động** — không
hardcode. Nếu Pinterest đổi cấu trúc và script hỏng, đây là chỗ cần xem trước tiên.

**Trình duyệt.** Dùng Chrome có sẵn trên máy (`channel: 'chrome'`) nên không
phải tải Chromium. Nếu máy chưa có Chrome, sửa `channel` trong `scrape.mjs`
hoặc cài Chromium qua Playwright.

**Lưu ý sử dụng.** Script chỉ đọc board công khai của chính bạn và tải ảnh về
máy để xem nội bộ. Hãy tôn trọng Điều khoản dịch vụ của Pinterest.
