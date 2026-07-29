# PRESS — bấm vào thứ này thì nó phản hồi thế nào

> Trục này trả lời đúng một câu: **bấm vào thứ này thì nó phản hồi thế nào.**
> Không trả lời bo góc/viền (xem `surface/`), không trả lời màu accent (xem `color/`).
> Neo code thật: [`example.html`](example.html).

---

## 1. THANG — năm bậc, không có bậc thứ sáu

| Bậc | Cơ chế CSS thật | Khi nào | Neo |
|---|---|---|---|
| `none` | không class press nào | phần tử tĩnh, hoặc row/card không có `onPress`/`href` | — |
| `fill` | `hover:bg-default` / `hover:bg-surface-secondary` / `hover:bg-current/15` | **hover**, tô nền cả phần tử hoặc một nút tròn nhỏ bên trong nó | `List.tsx:161-162`, `SurfaceCard.tsx:1141`, `ChipBase.tsx:242` |
| `underline` | `group-hover:underline` / `hover:underline` (qua `Typography`) | **hover**, chỉ gạch chân CHỮ — đọc như một liên kết | `SurfaceCard.tsx:596,1385`, `Typography.tsx:129,138` |
| `scale` | `active:scale-[0.97]` (native `:active`) | **nhấn**, cả khối lún nhẹ | `SurfaceCard.tsx:394,440` |
| `ripple` | vòng tròn `framer-motion` mọc từ điểm nhấn, `scale 0→2` + fade | **nhấn**, LUÔN đi kèm `scale` — nhưng `scale` không LUÔN đi kèm `ripple` (xem §3, cặp cuối) | `SurfaceCard.tsx:331,403` |

**NÚT (`Button`/`ButtonBase`) NẰM NGOÀI THANG NÀY** — không một dòng `active:`/ripple nào
trong `ButtonBase.tsx` hay `button-tokens.ts` (đã grep, 0 kết quả). Press feedback của nút do
**HeroUI vendor** tự vẽ nội bộ (`data-[pressed]`); atom nhà không thêm, không bớt. Hỏi "nút
này ở bậc nào" là hỏi sai câu — SSOT của bậc thang là bốn loại phần tử còn lại: `row · card ·
link · chip`.

---

## 2. CÂY QUYẾT ĐỊNH — hỏi từ trên xuống, dừng ở câu YES đầu tiên

| # | Hỏi | Ra |
|---|---|---|
| 1 | Phần tử có `onPress`/`href` thật không (tương tác thật, không phải `cursor-pointer` hand-roll)? | KHÔNG ⇒ `none` |
| 2 | Là **NÚT** (`ButtonBase`, có `@heroui/react` `Button` bên trong)? | NGOÀI THANG — dừng, xem §1 |
| 3 | Là **CHIP** (token nhỏ, nút dismiss/action tròn `size-4`/`size-6` sống BÊN TRONG nó)? | `fill` nhẹ trên chính nút tròn đó — KHÔNG BAO GIỜ `scale`/`ripple` |
| 4 | Là **ROW** (một hàng phẳng trong danh sách/nav, KHÔNG có viền/bo riêng của chính nó — viền nếu có thuộc khung CHA)? | chọn `fill` (tô cả hàng, prop `hover="fill"`) hoặc `underline` (chỉ gạch tiêu đề, prop `hover="underline"`) — KHÔNG BAO GIỜ đi tới `scale`/`ripple` |
| 5 | Là **CARD/TILE** (có viền/bo/đổ bóng riêng, đứng như MỘT khối tự thân)? | sang câu 5a |
| 5a | Card có `actions` (điều khiển phụ, stretched-link overlay)? | LUÔN `scale`, KHÔNG `ripple` — bất kể `href` hay `onPress` (xem bẫy 2) |
| 5b | Card KHÔNG `actions`, có `href` (điều hướng)? | `underline` qua `group-hover` trên chữ — đọc như LINK, KHÔNG `scale`/`ripple` |
| 5c | Card KHÔNG `actions`, có `onPress` (hành động tại chỗ, không điều hướng)? | `scale` **+** `ripple` — bậc cao nhất, phản hồi duy nhất khi nghỉ hover trơ |
| 6 | Là **LINK** độc lập (không phải row/card — một đoạn chữ/CTA như "Xem thêm")? | `underline` (tự-hover hoặc group-hover tuỳ ngữ cảnh), KHÔNG `fill`, KHÔNG `scale` |

**Trước khi tin cây: nếu component có `src` thật, ĐO nguồn đó.** Cây chỉ là đường lui. Xem §5.

---

## 3. VÉT CẠN CA DỄ LẪN — đủ 10 cặp

Thang 5 bậc (`none · fill · underline · scale · ripple`, đúng thứ tự trong §1) ⇒
`C(5,2) = 10` cặp.

### 3a. Bốn cặp KỀ NHAU — trận đánh chính

| Cặp | Phép phân định DỨT KHOÁT |
|---|---|
| **`none` ↔ `fill`** | Phần tử có `onPress`/`href` THẬT không? Không có ⇒ `none`, kể cả khi ai đó lỡ tay thêm `hover:bg-*` (hover không đi kèm tương tác thật là hover giả, phải gỡ). Có, và nó là ROW hoặc nút dismiss của CHIP ⇒ `fill`. |
| **`fill` ↔ `underline`** | Mất nền tô đi, phần tử còn đọc ra là MỘT HÀNG bấm được không (còn leading icon/meta ngoài tiêu đề, cần khoanh vùng rõ ranh giới bấm) ⇒ `fill`. Bấm được CHỈ nằm ở dòng CHỮ, đọc như một câu dẫn đi nơi khác ⇒ `underline`. |
| **`underline` ↔ `scale`** | Phần tử có VIỀN/BO/BÓNG RIÊNG, tách rời được khỏi danh sách như một khối độc lập không? KHÔNG (nó chỉ là một hàng phẳng hoặc một đoạn chữ) ⇒ `underline`. CÓ, và đích đến là HÀNH ĐỘNG TẠI CHỖ (`onPress`, không điều hướng, không `actions` phụ) ⇒ `scale`. |
| **`scale` ↔ `ripple`** | Card action ĐƠN (không có `actions` phụ) ⇒ hai bậc này LUÔN đi cùng nhau, không phải chọn 1 trong 2. Card CÓ `actions` (stretched-link overlay) ⇒ CHỈ `scale`, ripple bị bỏ hẳn (`SurfaceCard.tsx:429-462` không gọi `<Ripple>`) — phân vân ở cặp này nghĩa là đang hỏi "card đơn hay card có actions phụ", không phải chọn nhầm mức. |

### 3b. Ba cặp CÁCH MỘT BẬC

| Cặp | Đọc thế nào |
|---|---|
| `none` ↔ `underline` | Phân vân ở đây nghĩa là chưa trả lời được "phần tử này có tương tác thật không" — quay lại câu 1 của cây. |
| `fill` ↔ `scale` | Gần như luôn là lẫn ROW với CARD. Một ROW không bao giờ tự đứng như một khối rời — nó luôn nằm trong khung cha đã có viền/bo của chính khung đó. |
| `underline` ↔ `ripple` | So một LINK/ROW-link với một CARD-action đầy đủ — hai thứ không cùng loại phần tử. Vẽ lại câu 4-5 của cây trước. |

### 3c. Ba cặp CÁCH ≥2 BẬC — cố ý không có phép thử

`none`↔`scale` · `fill`↔`ripple` · `none`↔`ripple`. Phân vân giữa hai bậc cách xa nhau như
vậy là dấu hiệu **chọn sai LOẠI PHẦN TỬ** ở câu 2-6 của cây, không phải chọn sai bậc. Viết phép
phân định cho các cặp này là hợp thức hoá việc bỏ qua bước nhận diện phần tử.

---

## 4. BẪY CẤU TRÚC — chọn đúng loại phần tử nhưng vẫn sai

1. **Card có `actions` xoá mất ranh LINK/ACTION.** Nhánh đơn (`!actions`) phân biệt rõ
   `href`(link, `underline`, không scale) và `onPress`(action, `scale`+`ripple`) — nhưng nhánh
   `actions` (stretched-link overlay, `SurfaceCard.tsx:423-463`) áp `scale` cho CẢ HAI, không hề
   đọc `isLink`. Một card điều hướng (`href`) mà có thêm nút phụ (`actions`) sẽ đột ngột lún khi
   nhấn dù nó vẫn là một liên kết — đây là số liệu THẬT trong code, không phải suy luận, và là lý
   do cặp `scale`↔`ripple` ở §3a không có phép phân định gọn.
2. **Suy ROW thành CARD vì nó nằm trong một khung có viền/bo.** `SurfaceCard.Nested`'s
   `NestedSection` (`SurfaceCard.tsx:582-637`) không có viền/bo riêng — viền/bo `rounded-3xl`/
   `border` thuộc CHA (`Nested`), chính hàng chỉ có `p-3` + `divide-y` ở khung ngoài. Áp `scale`
   cho nó vì "nó ở trong một cái card" là lẫn khung CHA với chính phần tử.
3. **Ripple không phải lúc nào cũng đi cùng scale (ngược lại thì luôn).** Đọc code rồi giả định
   "có `active:scale-[0.97]` thì chắc cũng có ripple ở đâu đó" — sai với nhánh `actions` (bẫy 1).
   Luôn xác nhận có `<Ripple>` được render thật, đừng suy từ có scale.
4. **Hand-roll press cho row/card thay vì compose khung có sẵn.** `<div cursor-pointer>` hỏng
   a11y (không focus/keyboard); card/row bọc `<a>`/`<button>` TRẦN thiếu đúng bộ
   scale+transition+no-hover+ripple. Owner của cơ chế là PRIMITIVE (`SurfaceCard.Base`,
   `List.Row`) — consumer compose, không tự vẽ lại.

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **`src` thật của chính component đang sửa** — ĐO nó trước.
2. Cây quyết định §2 — chỉ khi (1) không tồn tại.
3. Canon [`principles/press/context.md`](../press/context.md) (trước đây `principles.md`
   §7/§7a/§7b) — **CHỈ tham khảo, đã LẠC HẬU một phần.** §7 (chốt 2026-07-22/23)
   viết "CARD bấm được luôn `active:scale-[0.97]`+ripple, không hover" như MỘT LUẬT DUY NHẤT cho
   mọi card — nhưng bản thân file cũ, ở mục 6b (ghi ngày **2026-07-29**, MỚI HƠN §7), đã tách
   `href`(link) ra khỏi luật đó: card+`href` (không `actions`) giờ là `underline`, không
   `scale`/`ripple`. Trục này theo bản MỚI + code thật (`SurfaceCard.tsx:384`), không theo câu mở
   đầu §7 nữa. Neo cụ thể: [`example.html`](example.html) §6.

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | ROW hoặc phần tử không viền/bo riêng dùng `active:scale`/ripple | ⛔ không gate được — kỷ luật (§7b) |
| 2 | Card bấm được mang `hover:bg-*` ở trạng thái nghỉ (trừ khi nó đang ở nhánh `underline`-link) | ⛔ không gate được — kỷ luật |
| 3 | Hand-roll `<div cursor-pointer>` cho card/row bấm được thay vì native `<button>`/`<a>` | ⛔ không gate được — kỷ luật (a11y) |
| 4 | Dùng react-aria `data-[pressed]` thay vì `:active` native cho card/row tự viết | ⛔ không gate được — kỷ luật |
| 5 | `transition-all`/`transition-transform` cho hiệu ứng scale thay vì liệt kê đúng `transition-[scale]` (Tailwind v4: `scale` là property riêng, thiếu liệt kê ⇒ giật) | ⛔ không gate được — kỷ luật |
| 6 | Giá trị ngoài union `hover?: "fill" \| "underline"` của `SurfaceCardListItem` | ✅ `tsc` — union literal |
| 7 | Thêm `active:scale`/ripule thủ công vào `ButtonBase` (đè lên press vendor của HeroUI) | ⛔ không gate được — kỷ luật |
