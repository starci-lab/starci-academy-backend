# PRINCIPLES — bảng điều hướng · LUÔN nạp mỗi lượt

> 🧭 **Trang này trả lời "giá trị này ĐÚNG hay SAI".** Câu đứng TRƯỚC nó — *"cụm nội dung này thì
> lấy COMPONENT nào ra dùng"* — nằm ở [`../matrix.md`](../matrix.md). Chọn sai vỏ thì cả 15 trục
> dưới đây đúng hết cũng vô nghĩa, nên khi đang DỰNG cái mới thì tra `matrix.md` trước; 15 trục
> này dùng khi SOI một giá trị cụ thể.

> Mỗi **trục thiết kế** là một thư mục, và mỗi trục có **đúng hai** file:
>
> **`context.md`** = thang · cây quyết định · vét cạn ca dễ lẫn · vạch cấm. **LLM đọc để QUYẾT.**
>
> **`example.html`** = **RENDER THẬT** mọi ca sai cạnh ca đúng, kèm phép phân định, lý do,
> nguyên lý, và neo `src` đã đọc lại. **Mắt người soi.** Trang này **không được trỏ sang file nào
> bắt người đọc tự mở** — mọi tình huống phải hiện ra ngay trên trang (thầy chốt 2026-07-29).
>
> Chia theo NGƯỜI ĐỌC nên hai file không trùng nội dung, do đó không thể lệch nhau.
> Bản `example.md` cũ đã bỏ: nó toàn bảng trỏ `file:line`, đúng thứ bắt người đọc đi tra.
>
> **Trục chưa đủ hai file là trục CHƯA XONG.** Ghi ở đây thay vì ghi vào một danh sách việc
> rời, vì một đề xuất nằm ngoài khuôn là một đề xuất sẽ bị rơi.
>
> Xem `example.html`: `npm run` cấu hình `principles` (cổng **8083**), rồi mở
> `http://localhost:8083/<trục>/example.html`.
>
> Trang này ngắn có chủ đích. Nạp trang này mỗi lượt; chỉ mở `<trục>/context.md` khi
> chạm đúng trục đó. Nạp cả 12 trục mỗi lượt là quay lại đúng bệnh của `principles.md`
> 1 408 dòng: dài quá nên không ai đọc.

---

## Đang phân vân về gì → mở file nào

Cột cuối: ✅ đủ hai file · 🔨 có `context.md` nhưng **nợ `example.html`** · ⬜ chưa dựng.
Trục mới thêm sau này bắt đầu ở ⬜ và chỉ được tick ✅ khi có ĐỦ hai file.

| Câu hỏi trong đầu | Mở | Xong? |
|---|---|---|
| khoảng cách giữa hai thứ này bao nhiêu? `gap` nào? | [`seam/context.md`](seam/context.md) | ✅ |
| padding trong khung này bao nhiêu? | [`inset/context.md`](inset/context.md) | ✅ |
| chữ này cỡ nào, đậm bao nhiêu, màu gì? | [`text/context.md`](text/context.md) | ✅ |
| nút này `variant` gì? primary hay secondary hay ghost? | [`button/context.md`](button/context.md) | ✅ |
| chỗ này có được tô màu accent không? | [`color/context.md`](color/context.md) | ✅ |
| icon nào, cỡ nào, weight nào? | [`icon/context.md`](icon/context.md) | ✅ |
| chuỗi này render markdown tới mức nào? | [`markdown/context.md`](markdown/context.md) | ✅ |
| dùng khung nào: Stack · Cluster · Grid · Split · Container? | [`frame/context.md`](frame/context.md) | ✅ |
| component này có cần `isSkeleton` không, hình shimmer ra sao? | [`skeleton/context.md`](skeleton/context.md) | ✅ |
| rỗng · lỗi · đang tải thì vẽ gì? | [`async/context.md`](async/context.md) | ✅ |
| đặt tên component/story/type thế nào? | [`naming/context.md`](naming/context.md) | ✅ |
| bo góc · viền · đổ bóng bao nhiêu? | [`surface/context.md`](surface/context.md) | ✅ |
| bấm vào thứ này thì nó phản hồi thế nào? | [`press/context.md`](press/context.md) | ✅ |
| thứ này nên nổi tới mức nào so với thứ quanh nó — cơ chế nào, không phải màu nào? | [`prominence/context.md`](prominence/context.md) | ✅ |
| chữ/khối này căn theo lề nào, đọc theo dòng nào? | [`reading-flow/context.md`](reading-flow/context.md) | ✅ |

**15/15 trục đủ hai file** (2026-07-30 — sửa từ "12/12" ghi sai ngày 2026-07-29: bảng ở trên bỏ
sót ba trục `press`/`prominence`/`reading-flow` dù cả ba đã có đủ `context.md` + `example.html`
trên đĩa từ trước, chỉ là chưa được liệt ở đây). Đo trên đĩa: mỗi thư mục đúng 2 file, mọi
`example.html` đủ 8 mục và kết thúc bằng `</html>` (không bị cắt giữa chừng).

Khuôn của `example.html` là [`seam/example.html`](seam/example.html) — bảy phần:

| # | Phần | Nội dung |
|---|---|---|
| 0 | thang | thanh đo trực quan, mỗi bậc một dòng |
| 1 | nguyên lý vét cạn | phép tính `C(N,2)` + ma trận phân ba nhóm |
| 2 | cặp dễ lẫn | render **hai chiều sai** cạnh bản đúng, kèm phép phân định · vì sao · nguyên lý |
| 3 | bẫy cấu trúc | chọn đúng bậc mà vẫn sai, cũng render thật |
| 4 | lỗi thật đã cắn | bảng, và điều chỉ lộ ra khi xếp chúng cạnh nhau |
| 5 | cặp không render | **nói rõ vì sao**, không lặng lẽ bỏ qua |
| 6-7 | neo `src` + cách đo | giá trị đọc lại tận nơi, snippet `getComputedStyle` |

---

## Checklist trước khi báo xong

Mỗi dòng một trục. Không tick được dòng nào thì mở `context.md` của trục đó, đừng đoán.

- [ ] mọi `gap` đã qua cây quyết định `seam`, không chỗ nào chọn theo cảm giác
- [ ] mọi `padding` đúng thang `InsetScale`
- [ ] mọi cỡ chữ/độ đậm truy được về một vai trò, không tự nâng cỡ
- [ ] mọi `variant` nút truy được về vai trò trong cụm
- [ ] mọi chỗ tô accent trả lời được "vì sao chỗ này, không phải chỗ kia"
- [ ] mọi icon nằm trong bộ đã chốt, size/weight theo vị trí
- [ ] mọi field chữ đúng tầng markdown (title · richtext nhỏ · bài viết)
- [ ] mọi khung chọn theo cây, không mặc định `Stack` cho mọi thứ
- [ ] mọi component sở hữu hình thì sở hữu skeleton của hình đó
- [ ] rỗng/lỗi/tải đều có đường đi, không rơi ra card trắng
- [ ] mọi tên theo khuôn, không có tên mô tả cơ chế
- [ ] mọi bo góc lồng nhau theo công thức đồng tâm
- [ ] mọi phản hồi khi bấm truy được về đúng bậc của `press`, không tự chế hiệu ứng riêng
- [ ] mọi chỗ nổi bật chọn ĐÚNG CƠ CHẾ (accent/chip/button) trước khi hỏi màu gì
- [ ] mọi khối/chữ căn lề và dòng đọc theo `reading-flow`, không lệch mắt đọc tự nhiên

---

## Ba luật xuyên trục

1. **NEO THẬT GHI ĐÈ SUY LUẬN.** Component có nguồn `src` thật thì ĐO nguồn đó và dùng số
   đo được, kể cả khi cây quyết định ra đáp án khác. Cây chỉ là đường lui khi không có nguồn.
2. **HAI COMPONENT GIỐNG HÌNH KHÔNG BẮT BUỘC GIỐNG SỐ.** Mỗi cái neo `src` riêng của nó.
   Neo đo được: cùng "cột nội dung" mà `QuestionRow` là `gap-1` còn `CommentItem` là `gap-2` —
   cả hai đều ĐÚNG.
3. **PHÂN VÂN GIỮA HAI GIÁ TRỊ CÁCH NHAU ≥2 BẬC LÀ DẤU HIỆU CÂY VẼ SAI**, không phải chọn sai.
   Dừng lại vẽ lại cấu trúc trước khi chọn tiếp.

---

## Tên tầng chính thức (chốt 2026-07-29 — ĐĨA là trọng tài)

Trước ngày này có **năm** nguồn khai năm danh sách khác nhau: thư mục trên đĩa, `check-seams.mjs`,
`check-padding.mjs`, `rules/4-organization.md`, và trường `tier` trong `ANNOTATE` của story.
Chốt lấy **tên thư mục thật** làm chuẩn, vì đĩa là thứ duy nhất không nói dối được.

**Tầng và app là HAI TRỤC VUÔNG GÓC.** Tầng dùng chung nằm ở gốc; tầng theo app nằm dưới `<app>/`.

| Tầng | Thư mục | File | Vai |
|---|---|---|---|
| `heroui` | *không có thư mục* | — | vendor. Chỉ tồn tại trong `ANNOTATE` (đo được 273 lần) để badge một node do HeroUI vẽ |
| `atom` | `atoms/` | 47 | bọc HeroUI, sở hữu hình nhỏ nhất |
| `behavior` | `behaviors/` | 2 | **primitive KHÔNG HÌNH.** Đo được: không import gì từ `@sb-components`, chỉ cấp hành vi (`DragScrollArea`, `ResizableRail`) |
| `frame` | `frames/` | 7 | khung slot-trơ, sở hữu nhịp (`gap`) và lề trong (`padding`) |
| `composite` | `composites/` | 48 | sở hữu nội dung của chính nó, không biết miền |
| `block` | `<app>/blocks/` | 118 | biết miền, lắp composite lại |
| `layout` | `<app>/layouts/` | 5 | khung trang, khung app |
| `overlay` | `<app>/overlays/` | 10 | modal · drawer |
| `page` | `<app>/pages/` | 21 | một màn hoàn chỉnh |

App hiện có: `starci` (đủ 4 tầng) · `miamia` và `nivo` (mới có `layouts` · `overlays` · `pages`).

**Tên đã CHẾT, không nguồn nào được dùng lại:** `design`/`designs` (tầng đã xoá 2026-07-28) ·
`screen`/`screens` (thư mục thật tên là `pages`) · `Primitives` · `Layouts` (tên tier-1 cũ của
story title). `viewer` KHÔNG phải một tầng — nó là **họ con** `composites/viewers/`, chỉ tồn tại
riêng trong `check-padding.mjs` vì họ đó được miễn luật `child-margin`.

## Từ vựng — định nghĩa trước khi dùng

Chữ nào tự đặt trong nhà thì phải định nghĩa ở đây, vì LLM chưa gặp nó lúc huấn luyện và
người mới cũng vậy. Neo: thầy đã phải hỏi *"seam là gì?"* — chữ đó được dùng suốt canon mà
chưa nơi nào định nghĩa. Một từ nhà làm mà không có dòng định nghĩa là một từ sẽ bị hiểu sai.

| Từ | Nghĩa | Vì sao không dùng từ quen hơn |
|---|---|---|
| **seam** | chỗ **nối** giữa hai thứ đứng cạnh nhau, như đường may nối hai mảnh vải | `gap` là **số đo** (bao nhiêu px), `seam` là **quan hệ** tại chỗ nối. Chọn theo quan hệ nên đặt tên theo quan hệ. Không phải từ chuẩn của ngành (ngành gọi *spacing scale* · *gutter*), nhưng đã trả giá đổi tên rồi: 544 call-site + `SeamScale` + `check-seams.mjs` |
| **inset** | khoảng cách từ **viền vào trong** một bề mặt | phân biệt dứt khoát với `seam`: seam ở GIỮA hai thứ, inset ở TRONG một thứ |
| **leaf** | một story, tức một HÌNH mà component tự vẽ ra | tách leaf khi hình đổi, không tách khi chỉ dữ liệu đổi |
| **state** | một giá trị dữ liệu trong cùng một leaf | caller bật thì thành leaf, dữ liệu về thì là state |

## Khuôn bắt buộc của mỗi `context.md` — SÁU MỤC, XẾP LÀM HAI TẦNG ĐỌC

Sáu mục vẫn giữ nguyên số hiệu §1..§6, nhưng từ 2026-07-29 chúng **xếp lại làm hai tầng** để
một lượt quét không phải nạp cả bộ. Số hiệu không đổi nên mọi chỗ trỏ `§4`, `§6`… vẫn đúng.

**PHẦN A · NHẬN BIẾT** — đủ để PHÁT HIỆN một giá trị có lệch hay không:

| # | Mục | Trả lời |
|---|---|---|
| 1 | **THANG** | có bao nhiêu lựa chọn, hữu hạn, không có giá trị ngoài thang |
| 2 | **CÂY QUYẾT ĐỊNH** | hỏi từ trên xuống, dừng ở câu YES đầu tiên, ra ĐÚNG 1 đáp án |
| 6 | **VẠCH CẤM** | thứ không bao giờ được làm; mỗi dòng là một gate script viết được |

**PHẦN B · TRA KHI ĐÃ THẤY LỆCH** — chỉ mở của ĐÚNG trục đang lệch:

| # | Mục | Trả lời |
|---|---|---|
| 3 | **VÉT CẠN CA DỄ LẪN** | mọi CẶP giá trị có thể lẫn + phép phân định dứt khoát cho từng cặp |
| 4 | **BẪY CẤU TRÚC** | lỗi không nằm ở chọn giá trị mà ở đọc sai cấu trúc |
| 5 | **NEO THẬT** | thứ tự ưu tiên khi hai nguồn đá nhau; neo cụ thể nằm ở `example.html` |

**Vì sao tách.** Lane feedback phải quét cả 15 trục một lượt. Đo 2026-07-29: cả bộ là **2 580
dòng**, dài hơn `principles.md` đã bị khai tử vì quá dài (1 408 dòng) — nạp hết là tái lập đúng
bệnh đó. Riêng Phần A của 15 trục là **1 243 dòng**, vừa sức nạp trọn.

⚠️ Tách này **đổi thứ tự nạp, không cắt thông tin quyết định**. Đo lại sau khi tách: số vạch
cấm và số bẫy của cả 15 trục **không đổi một dòng nào**. Thứ đã bỏ chỉ là các bảng "cặp cách từ
2 bậc trở lên", vì kết luận của chúng chính là luật xuyên trục 3 ở ngay trang này.

⛔ **Mục 4 không bao giờ được rút gọn.** Nó là mục ghi rủi ro ĐÃ TỪNG xảy ra, khác hẳn mục 3 vốn
phần lớn là rủi ro lý thuyết. Đo trên trục `naming`: 7 cặp từng cắn thật, 13 cặp ghi "chưa".

**Tiêu chí "vét cạn" phải KHÁCH QUAN, không tuỳ hứng.** Với thang N giá trị, số cặp là
`C(N,2)`; liệt kê đủ từng đó cặp rồi phân nhóm, đó là lúc được phép dừng. Liệt kê "vài ví dụ
hay gặp" không phải vét cạn.
