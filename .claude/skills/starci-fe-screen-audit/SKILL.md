---
name: starci-fe-screen-audit
description: Audit + dựng lại MỘT screen trong Storybook design-system theo canon, đi TỪ ROOT xuống đệ quy (screen → block → design, DỪNG ở atom). Chốt bốn trục — RANH GIỚI IMPORT · KHUNG bố cục · CÂY DEPS · CHỮ HIỆN UI — bằng SCANNER và ĐO DOM, không đọc mắt. Áp §11a/§11a.1 (deps một nấc), §13z (khung từ tầng layout trở lên), §4a (cấm đổi thang cỡ atom), §10a (một seam một chủ), §14d.1 (design là nơi UI/UX thôi). Ca mẫu đã chạy: `CourseContents` (2026-07-27). Dùng khi thầy gõ `/starci-fe-screen-audit <Screen>`, "audit screen X", "áp layout cho screen X", "ghi khung vào deps tree".
---

# /starci-fe-screen-audit — audit + dựng lại một SCREEN, từ root xuống

> **Canon SSOT:** `.claude/fe/principles.md` — §4a cấm đổi thang cỡ atom · §10a một seam
> một chủ · §10c thang `0·1·2·3·6·8` · §11a badge một nấc · **§11a.1 `anatPart` xuống,
> `showAnatomy` KHÔNG** · §11f leaf theo CẤU TRÚC · §12c skeleton co-located · §12g.3 mọi
> leaf phải có `code` · **§13z khung áp từ tầng layout trở lên** · §14d.1 design sở hữu hình.
> **Naming:** `.claude/fe/storybook-naming.md` — chữ HIỆN UI = **Full English**.
> **Code:** `D:\Repositories\starci-academy\.storybook` (branch `mtp`).

## ⛔ Luật cứng của lane

- **KHÔNG chạy `git`** (checkout/reset/stash) trong bất kỳ agent nào.
- **Một file = một agent.** Không bao giờ hai agent ghi cùng file (mất việc).
- Chỉ **một** agent chạy `tsc`/`eslint` (phase verify). Song song là treo máy.
- **JSDoc/comment trong code viết TIẾNG VIỆT** (khớp giọng file xung quanh).
  **Chuỗi HIỆN LÊN PANEL/UI** (`role` · `note` · `reason` · `leaf` · `state` · story `name`)
  viết **TIẾNG ANH**. Hai thứ khác nhau, đừng trộn.
- **Không kết luận bằng đọc mắt.** Mọi phát biểu "đã khớp / đã sạch" phải đến từ **scanner**
  hoặc **số đo DOM**. Lý do ở §"Bẫy đo đạc" cuối file — trò đã báo sai nhiều lần vì grep hụt.

---

## Bốn TRỤC phải chốt (đi lần lượt, không nhảy cóc)

| Trục | Câu hỏi | Hỏng thì trông như |
|---|---|---|
| **1. RANH GIỚI IMPORT** | screen được chạm tầng nào? | `_legacy` sống lại; design lạc lên screen |
| **2. KHUNG bố cục** | ai sở hữu nhịp? | `div className="flex gap-*"` rải khắp, gap trôi khỏi thang |
| **3. CÂY DEPS** | panel có nói đúng thứ đang render? | node ma, node thiếu, ruột con rò ra |
| **4. CHỮ HIỆN UI** | panel đọc bằng tiếng gì? | role tiếng Việt lẫn tiếng Anh |

---

## BƯỚC 0 — Dựng CLOSURE (read-only, bắt buộc trước mọi thứ)

Không có closure thì mọi con số sau đều vô nghĩa (audit nhầm phạm vi).

```js
// scratchpad/closure.mjs — đi theo import `@sb-components/*` từ screen + _shared
visit("components/screens/<Screen>/<Screen>.tsx")
visit("components/screens/<Screen>/_shared.tsx")   // ⚠️ ĐỪNG QUÊN — khai part của screen sống ở đây
```

Xuất: danh sách file + tier (`screen`/`block`/`design`/`layout`/`atom`).
**Mọi scanner sau đều chạy TRÊN closure này**, không quét cả repo.

---

## BƯỚC 1 — TRỤC RANH GIỚI IMPORT

Quét closure, bắt ba loại vi phạm:

| Vi phạm | Vì sao chết | Sửa |
|---|---|---|
| bất kỳ file nào trong closure trỏ `_legacy` | một import ở tầng layout **lôi cả nhánh chết về screen** dù screen sạch | đổi sang bản non-legacy |
| screen import tầng **design** | **design là nơi UI/UX THÔI** — nó không được biết "bài"/"thử thách" là gì | bọc bằng BLOCK mới, block ghép câu chữ, screen chỉ đưa **SỐ** |
| screen import **atom** | screen đang tự trình bày | đẩy xuống block |

✅ Screen ĐƯỢC dùng khung tầng layout (`Container`/`Stack`/`Grid`) — đó chính là chỗ §10c
được thi hành bằng TYPE.

❌ **Neo `CourseContents` (2026-07-27):** `AsyncContent` (tầng layout) import `_legacy/Button`
⇒ `_legacy` vẫn nằm trong closure của screen dù screen sạch. Và `ContinueCard` (design) nằm
thẳng trong screen, screen tự ghép `"Đã đọc 8/23 bài"` ⇒ đẻ block `ContinueLearning` nhận
`lessonsRead`/`lessonsTotal` rồi tự viết câu.

> **Dấu hiệu nhìn-là-thấy:** cây Deps của screen có **một node tier khác** cả đám (5 node
> `block`, 1 node `design`) ⇒ đó là chỗ nhảy cóc tầng.

---

## BƯỚC 2 — TRỤC KHUNG BỐ CỤC

### 2a. Quét thẻ bố cục gõ tay

Quét **screen · block · design** (BỎ QUA layout/atom — xem §13z):

```js
// bỏ comment TRƯỚC khi quét, nếu không sẽ đếm cả chuỗi class trong ghi chú lịch sử
const src = raw.replace(/\/\*[\s\S]*?\*\//g,"").replace(/^\s*\/\/.*$/gm,"")
/<(div|span|section|ul|ol|li)\b[^>]*?className=\{?(?:cn\()?["`]([^"`]*)["`]/g
// giữ lại nếu class có \b(flex|grid|space-[xy]-)\b
```
⚠️ Regex PHẢI cho phép attr đứng TRƯỚC `className` (`<div data-anat-part={…} className=…>`),
không thì undercount.

### 2b. Chọn ĐÚNG khung — đọc HẾT hợp đồng, đừng dừng ở cái tên

| Hình thật | Khung | Hợp đồng cần nhớ |
|---|---|---|
| cột dọc, children tuỳ ý | `Stack.V` | children TUỲ Ý ⇒ Stack, không phải Cluster |
| hàng ngang, children tuỳ ý | `Stack.H` (+`wrap` nếu chật thì xuống dòng) | |
| MỘT track N phần tử ĐỒNG HẠNG | `Cluster` | §13b: `items` DỮ LIỆU, **cấm children** |
| hai vế trái↔phải | `Split` | ⚠️ `start` **ĐƯỢC PHÉP CO** (`min-w-0`), `end` không co ⇒ khi chật nó **BÓP** vế trái |
| cặp nhãn↔giá trị LẶP | `KeyValue.List` | hàng tổng dùng `emphasis`, KHÔNG kẻ `border-t` tay |
| bề mặt thẻ | `SurfaceCard.Base` | `padding` mặc định `3` — đúng luật card `p-3` |
| bề rộng đọc + padding trang | `Container` | ⚠️ `gap` **chỉ áp khi dùng slot `header`/`footer`** |

❌ **Neo (2026-07-27):** hàng "giá ↔ CTA" bị chọn `Split` vì đọc thấy "hai vế trái↔phải".
Đo ra: vế trái bị bóp còn **216px**, chip `−33%` **rớt xuống dòng**. Bản gốc là `flex-wrap` —
chật thì **xuống dòng**, không bóp. Giá là CON SỐ, bóp lại vô nghĩa. → `Stack.H` + `wrap`.

❌ **Neo (2026-07-27):** screen viết `<Container gap={8}>` mà **seam thật = 0px** — Container
chỉ áp gap khi có slot. Viết `gap` mà không ai nhận **còn tệ hơn không viết**: đọc code tưởng
đã đặt nhịp. → cho **một `Stack.V` sở hữu nhịp** (§10a), hai nấc khác nhau: `8` tách VÙNG,
`6` giữa các block cùng vùng.

### 2c. Khung THIẾU năng lực thì BỔ SUNG, đừng hạ chuẩn

Nếu chuyển sang khung mà **hình xấu đi** ⇒ khung thiếu một trục, không phải hình sai.
- ✅ neo: `LayoutAlign` không có `baseline` ⇒ hàng giá nhiều cỡ chữ bị canh tâm. Thêm
  `baseline` vào union dùng chung — **ADDITIVE**, không call-site nào đang chạy đổi, compiler
  bắt mọi bảng `Record<LayoutAlign,…>` khai đủ.
- ⛔ NHƯNG **đừng đổi giá trị đã GHIM** của atom để chữa một chỗ (§4a). Dấu hiệu nhận ra
  sớm: **sửa xong phải chỉnh thêm hằng số thứ hai** (vd `SKELETON_H`) mới khỏi vỡ ⇒ đang
  đụng trục nền. Neo: hạ `Chip.Base` `md`→`sm` cho cả hệ chỉ vì chip trong `PriceTag` trông
  to → thầy bắt revert.

### 2d. RANH GIỚI: atom KHÔNG dùng khung (§13z)

Đo được: `atoms/ → layouts/` = **0 file**; `layouts/ → atoms/` = **25 file** (`Stack` import
`Divider`). Khung dựng TRÊN atom ⇒ atom dùng khung là **vòng lặp tier**.
`<button className="inline-flex gap-1.5">` trong atom là **ĐÚNG**.
🧭 Test: *"dưới component này còn tầng nào không?"* Còn → qua khung. Không → viết tay.

---

## BƯỚC 3 — TRỤC CÂY DEPS (phần dễ sai nhất)

### 3a. Hiểu ĐÚNG cách panel dựng cây

> **`parts` viết tay KHÔNG dựng cây.** Panel rút nó thành **chú giải phẳng**
> (`name → {tier, role, storyId}`); **CẤU TRÚC luôn suy từ DOM** bằng leo-tổ-tiên
> `data-anat-part`. Và **chỉ part có `storyId` THẬT mới vào cây** (danh sách trắng §11a).

Hệ quả bắt buộc thuộc:
1. Muốn node xuất hiện ⇒ component phải **phát `data-anat-part`** VÀ annotation phải **có `storyId`**.
2. Lồng nhau trong `parts` chỉ để tra chú giải — DOM mới quyết cha/con.
3. **Panel gom node THEO TÊN** ⇒ hai `Stack.V` trùng tên sẽ **NHẬP làm một**, cây đọc sai.
   Đặt tên phân biệt (`Stack.V.Page`, `Stack.V.Price`).

### 3b. `anatPart` truyền xuống · `showAnatomy` KHÔNG (§11a.1)

| Prop | Ai đặt | Nghĩa |
|---|---|---|
| `anatPart` | **CHA** đặt cho con | "trong cây của tao mày tên X" → con phát MỘT node |
| `showAnatomy` | **chính component đó**, ở story của nó | "mở ruột tao ra" |

- ⛔ Cha KHÔNG chuyền `showAnatomy={showAnatomy}` xuống con có story riêng ⇒ cháu-nội rò ra
  thành **anh em ngang hàng**. Neo: `TrialConversionStrip` phát **16 part cho một block 7 dep**.
- ⛔ Node đã có `storyId` thì **KHÔNG khai `children`** — nó là CỬA, bấm vào xem ở story của nó.
- ✅ **Ngoại lệ:** node do **CHA tự dựng rồi đặt vào SLOT của con** (`ContinueCard` dựng
  `Chip.Base` → slot `chip` của `List.Meta`) thì **VẪN KHAI** — nó là con của cha, DOM chỉ
  tình cờ lồng nó vào. 🧭 Test: **"AI dựng ra node này?"**

### 3c. Khung CŨNG là dep — đệ quy xuống mọi tầng

Screen khai `Container`/`Stack`; block khai `Page.Header`/`SurfaceCard.List`/`Cluster`…
Thiếu khung thì đọc cây **không biết trang bố trí bằng gì** — mà khung mới là thứ quyết hình.

Component muốn hiện được khung của mình phải **TỰ XƯNG** khi chạy trong story của chính nó:
```tsx
anatPart={anatPart ?? (showAnatomy ? "SurfaceCard" : undefined)}
//         ↑ cha đặt tên thắng        ↑ story của chính nó thì tự xưng
```
Thiếu vế sau ⇒ khung vô hình **đúng ở nơi cần thấy nó nhất**.

### 3d. Nguyên nhân GỐC: khung thiếu prop `anatPart`

Không có `anatPart` thì cha không đặt tên được ⇒ buộc phải chuyền `showAnatomy` ⇒ rò ruột.
**Thêm prop cho con, đừng vá chỗ gọi.** Neo đã vá: `Page.Header` · `Divider.Base` ·
`Choice.Switch` · `Cluster` · `Split` · `Stack.V/H` · `KeyValue.Row/List` · `PhaseScarcityNote`.

### 3e. KHÔNG ĐƯỢC PHÉP ĐỨNG NGOÀI CÂY (thầy chốt 2026-07-27)

Mọi `data-anat-part` phát ra phải vào được cây. Ba ca, ba cách xử:

| Ca | Xử |
|---|---|
| là component thật, thiếu `storyId` (vd thanh `Skeleton.*` = `Typography.Base isSkeleton`) | **KHAI** kèm `storyId` |
| `<span>` bọc thừa chỉ để đeo nhãn | **BỎ span**, đưa `anatPart` thẳng lên component bên trong |
| KHÔNG phải component của hệ (glyph Phosphor) | **GỠ `data-anat-part`** — không có cửa thì đừng badge |

### 3f. Tên node phải khớp CHÍNH XÁC DOM

❌ neo: khai `Feedback.Callout` trong khi DOM phát `CourseTeamGate` (đó là KHUNG **bên trong**
block) · khai `Typography.Original` trong khi DOM phát `OriginalPrice` · khai `StatusChip` —
một component **đã bị xoá khỏi hệ**. Sai tên = node chưa bao giờ vào cây, **không có lỗi build**.

### 3g. `storyId` phải tra, KHÔNG được suy từ title

`storyId` là chuỗi tự do, **không gì kiểm** — sai thì link **gãy CÂM**. Dựng bảng id **offline**:
```js
id = kebab(title).replace(/\//g,"-") + "--" + kebab(exportName tách theo hoa)
// bắt CẢ hai dạng export: `export const X: Story` và `export const X = L.X`
```
rồi đối chiếu **mọi** `storyId:` trong repo. ❌ neo: `Link.SeeMore` kebab thành `link-seemore`
chứ không phải `link-see-more`; trò còn tự xác nhận "đã nhảy đúng" bằng cách đọc `href` thay vì
kiểm id có tồn tại.

---

## BƯỚC 4 — TRỤC CHỮ HIỆN UI

Quét `role` · `note` · `reason` · `leaf` · `state` (BỎ dòng comment) tìm ký tự có dấu tiếng Việt.
Chữ hiện panel = **Full English** (`storybook-naming.md`). JSDoc/comment giữ **tiếng Việt**.
> Sweep lớn (>50 chuỗi) → **workflow Sonnet riêng**, thầy phát lệnh (canon đã ghi).

---

## BƯỚC 5 — VERIFY (một agent duy nhất)

1. `npx tsc --noEmit -p tsconfig.json` — phải im lặng.
2. `npx eslint ".storybook/**/*.tsx"` — phải im lặng.
3. **ĐO DOM** cho từng story vừa đụng:
```js
const doc = document.querySelector('iframe#storybook-preview-iframe').contentDocument
const links = [...doc.querySelectorAll('a[href*="/story/"]')].map(a=>a.textContent.trim())
const parts = [...doc.querySelectorAll('[data-anat-part]')].map(e=>e.getAttribute('data-anat-part'))
// ĐẠT khi: parts.filter(p=>!links.includes(p)).length === 0
```
4. Chạy lại **toàn bộ scanner** — không được có hồi quy ở trục đã đóng.

---

## Bẫy ĐO ĐẠC (đọc trước khi báo cáo bất kỳ con số nào)

| Bẫy | Triệu chứng | Cách tránh |
|---|---|---|
| **HMR ôi** | sửa xong đo vẫn thấy cũ; lỗi trỏ `*.hot-update.js`; **cùng hash qua nhiều lần restart**; story id không có trong `index.json` | **reload cứng**; nặng thì xoá `node_modules/.cache/storybook` (Windows path dài ⇒ dùng `robocopy /MIR` với thư mục rỗng) |
| **console buffer của tab** | lỗi ma tồn tại sau restart | mở **tab mới** rồi đo |
| **grep bỏ sót key có nháy** | báo "block không khai gì" trong khi nó khai `"SurfaceCard.List"` | regex phải nhận **cả** key có nháy lẫn không |
| **`[^}]*?` gãy** | node có `role` chứa `}` (vd `"{phase}"`) bị báo là chưa khai | đừng dựa regex một-dòng cho node nhiều dòng |
| **quét thiếu nguồn khai báo** | báo hàng loạt "đứng ngoài cây" | khai part của SCREEN nằm ở `components/screens/*/_shared.tsx`, **không phải** `stories/` |
| **đếm cả comment** | "còn 4 div gõ tay" mà thật ra là chuỗi class trong ghi chú | **strip comment** trước khi quét |
| **grep locale** | `—`/`×`/`→` bị tính là tiếng Việt | scanner Node đọc **UTF-8**, không `grep -E` |
| **portal** | node khai đúng vẫn không hiện (vd `KeyValue.List` trong `Popover.Content`) | giới hạn THẬT của panel — **báo, đừng giấu**, đừng đi khai thêm cho "đủ" |

---

## Ca mẫu đã chạy — `CourseContents` (2026-07-27)

Kết quả cuối, dùng làm mốc so:

```
Container
  Stack.V.Page              gap-8 · tách VÙNG
    CourseBrief             block  → Page.Header
    Stack.V                 gap-6 · nhịp giữa block
      TrialConversionStrip  block  → SurfaceCard ⊃ Stack.V ⊃ (Stack.H · Stack.H.PriceRow)
      ContinueLearning      block  → ContinueCard (design)
      LearnNudges           block  → SurfaceCard.List
      KeepGoingPath         block  → SurfaceCard.List
```

| Phép đo | Trước | Sau |
|---|---|---|
| `_legacy` trong closure | 1 | **0** |
| `showAnatomy` rò xuống con có story | 23 | **0** |
| thẻ bố cục gõ tay (screen/block/design) | 14 | **0** |
| `storyId` gãy câm (ngoài `_legacy`) | 9 | **0** |
| part đứng ngoài cây | 7 | **0** |
| icon `<size-5` thiếu `weight` | 2 | **0** |
| seam header→thẻ | 0px (gap rơi im lặng) | **32px** |

---

## ✅ Checklist đóng lane

- [ ] Closure dựng từ **cả** `<Screen>.tsx` **và** `_shared.tsx`?
- [ ] `_legacy` trong closure = 0? Screen KHÔNG import design/atom?
- [ ] Thẻ bố cục gõ tay ở screen/block/design = 0 (đã strip comment trước khi đếm)?
- [ ] Mọi khung dùng đều **có mặt trong Deps**, ở MỌI tầng (đệ quy)?
- [ ] Không chỗ nào chuyền `showAnatomy` xuống con có story riêng?
- [ ] Không node nào vừa `storyId` vừa `children` (trừ ca slot cha-dựng)?
- [ ] `parts.filter(p => !links.includes(p)).length === 0` trên DOM THẬT?
- [ ] Mọi `storyId` đối chiếu bảng id, 0 gãy?
- [ ] Chữ hiện panel = English; JSDoc = tiếng Việt?
- [ ] `tsc` + `eslint` im lặng, và **scanner chạy lại** không hồi quy?
