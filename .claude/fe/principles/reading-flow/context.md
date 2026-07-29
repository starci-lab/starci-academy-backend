# READING-FLOW — chữ và khối căn theo lề nào, đọc theo dòng nào (⏳ DRAFT — kế thừa từ `principles.md` §3, CHƯA CHỐT)

> ⏳ Nguồn gốc (`principles.md` dòng 146-161) tự ghi `⏳ DRAFT — chờ thầy chốt`. Trục này CHỈ dựng lại
> khuôn + verify bằng code thật, KHÔNG tự chốt hộ. Mọi chỗ còn treo được giữ nguyên trạng thái treo,
> liệt kê ở cuối và trong `choThayChot`.
> Neo code thật: [`example.html`](example.html).

---

## 1. THANG — HAI thang riêng, không gộp

Trục này gồm **hai trục vuông góc**, hay bị gõ nhầm vào nhau vì cùng có bậc "center":

### Thang A — TEXT-ALIGN: canh CHỮ trong khung văn bản của chính nó
3 bậc, đúng `TypographyAlign` (`Typography.tsx:107-113`) + `TableAlign` (`Table.tsx:33`, chỉ có 2/3 bậc):

| Bậc | Class | Prop |
|---|---|---|
| `start` | `text-start` | mặc định — để trống prop `align` = không set class nào, theo flow cha |
| `center` | `text-center` | `align="center"` |
| `end` | `text-end` | `align="end"` (Table chỉ có `start`\|`end`, không có `center` — số/hành động không bao giờ center) |

**Vốn từ LOGIC (`start`/`end`), KHÔNG phải VẬT LÝ (`left`/`right`)** — chốt tại `Typography.tsx:98-105`
(2026-07-25): khớp đúng HeroUI + các block đã dùng, tự lật khi RTL. Verify code thật: `text-right` =
**0/3** chỗ sống (grep `.storybook/components`, cả 3 còn lại đều nằm `_legacy`) — quy ước logic đã
thắng tuyệt đối ở tầng atom. Nhưng `text-left` (vật lý) vẫn còn **8 chỗ sống**, không đi qua
`Typography` — xem BẪY 2.

### Thang B — BLOCK-POSITION: khối/track đứng ở đâu trong track CHA, dọc theo TRỤC NGANG (hướng đọc)
Bản chất là **một** thang ngữ nghĩa 4 bậc — `start · center · end · between` — nhưng khoác **hai tên
prop khác nhau** tuỳ track chạy hướng nào (`frames/_spacing.ts:95-114`):

| Track | Hướng NGANG (đọc) là trục nào | Prop mang bậc | Giá trị có |
|---|---|---|---|
| **NGANG** (`StackH`, `Cluster`) | trục CHÍNH (main-axis) | `justify` | `start·center·end·between` (đủ 4) |
| **DỌC** (`StackV`) | trục PHỤ (cross-axis) | `align` | `start·center·end·stretch` (KHÔNG có `between` — cross-axis không có khái niệm "co giãn ở giữa") |

`ml-auto` tay trên **một** con là lối thứ ba, KHÔNG nằm trong prop track nào — đẩy đúng một phần tử
về cuối mà không đổi `justify` của cả track. Xem BẪY 4.

**"Hạn chế giữa" = có 4 ngoại lệ được cho phép trên CẢ hai thang** (kế thừa nguyên văn từ draft cũ,
CHƯA CHỐT phạm vi chính xác — xem `choThayChot`): empty-state/lỗi, **1** hero focal, modal xác nhận
1 nút (⚠️ CHƯA tìm được neo sống rõ ràng cho ca này, xem §5 example.html), loading/spinner.

---

## 2. CÂY QUYẾT ĐỊNH — hỏi từ trên xuống, dừng ở câu YES đầu tiên

| # | Hỏi | Ra |
|---|---|---|
| 1 | Đang set cho **CHỮ chạy trong 1 khung văn bản** (đoạn, tiêu đề, caption) hay cho **1 KHỐI/track** đứng ở đâu? | Chữ → Thang A. Khối → câu 2 |
| 2 | Đây có phải 1 trong 4 ngoại lệ ở §1? | Có → được phép `center`, sang câu 3 chọn đúng prop. Không (content chính ≥2 dòng) → mặc định `start`, KHÔNG center — DỪNG |
| 3 | Track đang xét chạy **NGANG** hay **DỌC**? | Ngang → dùng `justify`. Dọc → dùng `align` |
| 4 | Cần đẩy **đúng 1** phần tử về cuối, các phần tử khác vẫn gói ở đầu (không phải dồn CẢ hàng)? | Có → `ml-auto` trên chính phần tử đó, KHÔNG đổi `justify` của cả track |
| 5 | Nội dung nằm trong **`<button>`**/link toàn khối (pressable)? | Có → PHẢI tự set `text-start` (hoặc `text-left`, xem BẪY 2) đè `text-align:center` UA mặc định của trình duyệt — không set gì = ngầm center (BẪY 1) |

**Trước khi tin cây: nếu ô/cột đã có `align` kiểu riêng (Table `TableColumn.align`), dùng NGAY giá trị
đó** — component đã quyết hộ, đừng tự áp lại từ đầu.

---

## 3. VÉT CẠN CA DỄ LẪN — 11 cặp, đếm được

### 3a. Thang A (3 bậc) ⇒ `C(3,2) = 3` cặp

| Cặp | Phép phân định | Đã cắn/xác nhận |
|---|---|---|
| `start` ↔ `center` | Nội dung có **≥2 dòng CHỮ CHẠY** (đoạn văn, mô tả) không? Có ⇒ `start` bắt buộc — mép trái+phải đều răng cưa khi center, mắt phải dò lại điểm bắt đầu mỗi dòng. Không (≤2 dòng NGẮN, hero/caption/empty-state) ⇒ `center` được phép nếu khớp 1 trong 4 ngoại lệ §1. | ✅ toàn bộ ca `text-center` sống đều rơi đúng nhánh "được phép" — xem §4 example.html |
| `center` ↔ `end` | Đây có phải **SỐ/tiền/mốc thời gian/hành động ở CUỐI hàng** không? Có ⇒ `end` (kèm `tabularNums` nếu là số). Không (là caption/nhãn 1 dòng đứng một mình) ⇒ `center`. | ✅ `Table.tsx` `TableAlign` chỉ định nghĩa `start`\|`end`, cố ý KHÔNG có `center` cho cột dữ liệu |
| `start` ↔ `end` | Đây có phải **ô/cột trong 1 hàng có ≥2 field** (label trái, giá trị phải) không? Có ⇒ 2 field 2 đầu, không cùng 1 field. Không (1 field độc lập) ⇒ chọn theo hướng đọc mặc định `start`. | chưa cắn — 2 bậc này hiếm lẫn vì ngược hướng rõ |

### 3b. Thang B (4 bậc ngữ nghĩa) ⇒ `C(4,2) = 6` cặp

| Cặp | Phép phân định | Ghi chú |
|---|---|---|
| `start` ↔ `center` | Đây là **content chính** (nav item, danh sách) hay **1 khối focal đơn lẻ** (hero card, CTA rỗng)? Content chính ⇒ `start`. Focal đơn ⇒ `center`. | ✅ `SettingsSidebarNav` (nav item ⇒ `justify={collapsed?"center":"start"}`, chỉ center khi sidebar THU GỌN — bản thân "collapsed" biến content chính thành 1 icon đơn, đúng exception) |
| `center` ↔ `end` | Phần tử có phải **trailing action/caret DUY NHẤT** cần dồn hẳn về 1 phía không? Có ⇒ `end`. Không (khối cần đứng GIỮA track, ví dụ hero) ⇒ `center`. | ✅ `ContentPager.tsx:113`, `ChallengeDeliverableList.tsx:228` dùng `justify="end"` cho hàng CTA/caret |
| `start` ↔ `between` | Có **đúng 2 nhóm cần tách xa nhau tối đa** (label ↔ value, tiêu đề ↔ hành động) không? Có ⇒ `between`. Không (nhiều phần tử cùng gói về 1 phía) ⇒ `start`. | ✅ `KeyValueList` dùng `justify-between` cho mọi hàng label↔value (raw class, xem BẪY 5) |
| `center` ↔ `between` | Cả track có phải **1 khối duy nhất cần đứng giữa** hay **≥2 nhóm cần đẩy ra 2 đầu**? 1 khối ⇒ `center`. ≥2 nhóm ⇒ `between`. | dễ lẫn khi chỉ có 2 phần tử — 2 phần tử canh `between` và 2 phần tử canh `center` với `gap` lớn trông giống nhau, xem BẪY 4 |
| `end` ↔ `between` | Có phần tử NÀO cần đứng Ở ĐẦU track không? Có ⇒ `between` (đầu giữ nguyên, cuối đẩy ra). Không (mọi thứ dồn cuối) ⇒ `end`. | chưa cắn |
| `stretch` (chỉ có ở `align`, thay cho `between`) ↔ `center` | Nội dung con có cần **chiếm ĐỦ bề ngang** track (input, card full-width) không? Có ⇒ `stretch` (mặc định của `StackV`). Không (khối co theo nội dung, cần đứng giữa) ⇒ `center`. | ✅ `StackV` mặc định `align="stretch"` (`Stack.tsx:129`); mọi hero-card đổi sang `align="center"` đều tường minh (không dựa mặc định) |

### 3c. Hai cặp XUYÊN THANG — không tính vào `C(N,2)` vì khác thang, nhưng là chỗ gõ nhầm nhiều nhất

| Cặp | Vì sao lẫn |
|---|---|
| `text-align` (Thang A, canh CHỮ) ↔ `justify`/`align` (Thang B, canh KHỐI) | Cả hai đều có bậc tên **"center"**, nhưng một cái set thuộc tính CSS `text-align` (chỉ ảnh hưởng CHỮ trong khung của chính phần tử), một cái set `justify-content`/`align-items` (ảnh hưởng VỊ TRÍ của cả khối con trong track cha). Dùng `text-center` để "canh giữa 1 hàng icon+label" là SAI công cụ — hàng đó cần `align="center"` (cross-axis), không phải `text-center`. |
| `justify` ↔ `align` (cùng trong Thang B) | Cùng map ra `"center"` nhưng là **HAI PROP KHÁC NHAU** tuỳ track NGANG hay DỌC (xem Thang B). Cả hai prop đều tồn tại trên MỌI track (`StackBaseProps` có cả `align` lẫn `justify` bất kể `StackV`/`StackH`) nên gõ nhầm KHÔNG lỗi biên dịch — chỉ sai ở kết quả nhìn thấy. |

**Tổng: 3 + 6 + 2 = 11 cặp**, không cặp nào bị bỏ quên.

---

## 4. BẪY CẤU TRÚC — chọn đúng bậc mà vẫn sai, vì đọc sai cấu trúc xung quanh

Năm bẫy dưới đây đều có neo code thật, render ở `example.html` §3.

1. **`<button>` có `text-align:center` MẶC ĐỊNH của trình duyệt (UA stylesheet).** Không viết
   `text-center` ở bất cứ đâu, chữ vẫn ra giữa nếu quên đè. Neo: **9 chỗ sống** phải tự đè —
   `SurfaceCard.tsx:386,609,624,1346,1427,1626,1681`, `Stepper.tsx:206`, `SettingsSidebarNav.tsx:194`.
2. **Vật lý (`text-left`) và logic (`text-start`) cùng giải quyết BẪY 1 nhưng viết 2 kiểu ở 2 nơi
   khác nhau trong CÙNG hệ.** `SurfaceCard.tsx`/`Stepper.tsx` dùng `text-left` (8 chỗ, vật lý) trong
   khi `SettingsSidebarNav.tsx:194` + `ChipButtonList.tsx:77-78` dùng `text-start` (logic) cho ĐÚNG
   cùng một nhu cầu — đè UA default của `<button>`. Không lỗi biên dịch, không lỗi lint, Tailwind
   nhận cả hai cú pháp song song nên trôi lặng lẽ.
3. **Specificity: CSS un-layered của HeroUI thắng utility Tailwind bất kể CLASS nào được viết.**
   `Table.tsx:25-28` tự ghi chú: `.table__column{text-align:left}` (bundle HeroUI, KHÔNG nằm trong
   `@layer`) luôn thắng `text-end` (Tailwind v4, nằm trong `@layer utilities`) nếu áp trực tiếp lên
   `<td>`/`<th>` — thứ tự LAYER quyết định, không phải độ đặc hiệu (specificity) của selector. Né
   bằng cách đặt `text-align` trên **SPAN con** (`Table.tsx:97-98`, `CellBox`) — span đó không bị
   selector của HeroUI chạm tới, nên giá trị trực tiếp trên nó thắng giá trị KẾ THỪA, không cần
   `!important`. Render CSS thật (không mô tả) ở `example.html` §3.
4. **`justify-end` (dồn cả hàng) ↔ `justify-between` (đầu-cuối) ↔ `ml-auto` tay (chỉ đẩy 1 con) —
   ba cơ chế nhìn GIỐNG HỆT khi track chỉ có 2 phần tử, khác hẳn khi có ≥3.** Neo `ml-auto`:
   `UserCell.tsx:129`, `SurfaceCard.tsx:1158,1393,1695`, `List.tsx:188`,
   `SubmissionAttemptsDrawer.tsx:147`. Chọn nhầm cơ chế cho 2 phần tử thì KHÔNG lộ; thêm phần tử
   thứ 3 mới lộ sai ý định.
5. **Gate `check-seams.mjs` chỉ bắt hand-rolled layout khi ĐI KÈM `gap-*` trong CÙNG className**
   (`scripts/check-seams.mjs:122`, regex đòi cả `flex`/`grid` LẪN `gap-`). `justify-*`/`items-*`
   MỘT MÌNH (không `gap-*` cùng chỗ) lọt qua hoàn toàn. Neo lọt gate:
   `PlaygroundSetupSteps.tsx:194` (`"flex items-center justify-between border-b..."`, không có
   `gap-*`) — cùng vi phạm "viết bố cục tay ở tầng composite" như 2 chỗ khác đã bị bắt
   (`Page.tsx:261`, `surface-card-header.tsx:71`, cả hai CÓ `gap-3` nên đã bị gate chặn), nhưng chỗ
   này thoát vì thiếu đúng 1 mảnh regex cần.

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **`src` thật của CHÍNH component đang sửa** — ĐO nó, như mọi trục khác (xem `seam/context.md` §5).
2. **Prop `align` sẵn có của chính component** (`TableColumn.align`, `PriceEmphasis`…) — dùng thẳng,
   đừng tự áp lại cây quyết định từ đầu.
3. Cây quyết định §2 — chỉ dùng khi (1) và (2) không tồn tại.

⚠️ **Neo cũ trong `principles.md` §3 (dòng 159) đã CHẾT**: "dòng ≈ $58.99 khi thanh toán quốc tế
(CourseCard) căn giữa" trỏ vào `CourseCard.tsx` — file đó nay nằm ở
`.storybook/components/_legacy/designs/cards/CourseCard/CourseCard.tsx`, không còn ca sống. Đã
grep thay thế sống (`PriceTag.tsx`) và xác nhận **không còn** dòng hint đó, cũng không còn
center-align nào ở đó — không dùng lại neo cũ này, và CHƯA tìm neo mới thay thế cùng ý.

Neo cụ thể từng nhánh: [`example.html`](example.html) §6.

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | `text-center`/`justify-center`/`align="center"` cho content chính ≥2 dòng, ngoài 4 ngoại lệ §1 | ⛔ chưa gate — kỷ luật |
| 2 | Viết `text-left`/`text-right` (vật lý) thay vì `text-start`/`text-end` (logic) | ⛔ chưa gate — Tailwind nhận cả hai, không lỗi biên dịch |
| 3 | Set `text-align` trực tiếp trên `<td>`/`<th>` khi có CSS un-layered đè (BẪY 3) thay vì bọc span | ⛔ chưa gate — vỡ lặng lẽ, chỉ lộ khi đo `getComputedStyle` |
| 4 | Đổi `justify` của CẢ track khi chỉ cần đẩy ĐÚNG 1 phần tử (lẽ ra dùng `ml-auto`) | ⛔ chưa gate |
| 5 | Viết `justify-*`/`items-*` tay trong `className` ở tầng `composite` trở lên | 🟡 MỘT PHẦN — `check-seams.mjs` chỉ bắt khi đi kèm `gap-*` (BẪY 5), `justify-only` lọt |
| 6 | Render `<button>`/pressable toàn khối mà không tự đè `text-align` (BẪY 1) | ⛔ chưa gate — chỉ lộ khi đo DOM |

Không có luật nào ở trục này được `tsc` bắt (khác trục `seam`, nơi `SeamScale` là union literal) —
`TypographyAlign`/`TableAlign`/`LayoutJustify`/`LayoutAlign` đều là union literal ĐÚNG, nhưng KHÔNG
CÓ union nào bắt được "center hay không nên center" — đó là quyết định NGỮ NGHĨA, không phải cú
pháp, nên cả 6 dòng trên đều dựa vào kỷ luật đọc + đo, không dựa vào compiler.
