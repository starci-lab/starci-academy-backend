# TIẾP TỤC — Storybook design-system (cập nhật 2026-07-29, cuối phiên)

> ⚠️ **§1-6 phía dưới đã CŨ (ảnh chụp 2026-07-28)** — giữ vì vài mục còn tham khảo được, nhưng
> bản đồ tầng và danh sách cổng ở đó KHÔNG còn đúng. Trạng thái thật đọc §0 ngay dưới, rồi
> `principles/INDEX.md`.

## 0. TRẠNG THÁI — đọc mục này trước khi làm tiếp

### 0a. Canon đã đổi KIẾN TRÚC, không chỉ đổi nội dung

`principles.md` **đã chết**. Nó còn 81 dòng và chỉ là **bản đồ chuyển hướng**. Đừng đọc nó để
lấy luật, đừng thêm luật vào đó. Ba lý do giết nó, đo được chứ không phải ý kiến: nó **nói
ngược code** (§12a liệt namespace là mẫu đúng trong khi gate cấm hẳn), nó **trích sai chính
nguồn nó viện dẫn** (§9d nói Tier A "luôn bold", dẫn 2 file đang `semibold` làm bằng chứng), và
nó dài tới mức luật trong đó chỉ được trích lẻ tẻ chứ không được thi hành.

Thay bằng **15 trục** trong `principles/`, mỗi trục trả lời ĐÚNG MỘT câu "chọn giá trị nào" và
có đúng hai file:

| File | Cho ai | Nội dung |
|---|---|---|
| `context.md` | **LLM đọc để QUYẾT** | thang · cây quyết định · vét cạn ca dễ lẫn · bẫy · vạch cấm |
| `example.html` | **mắt người soi** | render thật ca SAI cạnh ca ĐÚNG, kèm phép phân định và nguyên lý |

Chia theo NGƯỜI ĐỌC nên hai file không trùng nội dung, do đó **không lệch nhau được**.

**Bắt đầu ở [`principles/INDEX.md`](principles/INDEX.md)** — ngắn có chủ đích, có bảng "đang
phân vân về gì thì mở file nào". Nạp file đó mỗi lượt; chỉ mở trục nào đang chạm tới. Nạp cả
15 trục mỗi lượt là quay lại đúng bệnh của `principles.md`.

Xem `example.html`: cấu hình `principles` trong `.claude/launch.json`, cổng **8083**.

### 0b. Tên tầng — CHỐT 2026-07-29, đĩa là trọng tài

Trước đó **năm nguồn khai năm danh sách khác nhau**. Chốt lấy tên thư mục thật, vì đĩa là thứ
duy nhất không nói dối được. Danh sách đầy đủ ở `principles/INDEX.md`.

Dùng chung ở gốc: `atoms` · `behaviors` · `frames` · `composites`.
Theo app dưới `<app>/`: `blocks` · `layouts` · `overlays` · `pages`. Cộng `heroui` là tầng
vendor không có thư mục.

**`designs` và `screens` đã CHẾT.** Hai gate từng đi tìm chúng, và đó chính là lý do gate bỏ
sót 54% cây.

### 0c. Hai cổng gác đã siết, và cái giá của nó

| Cổng | Trước | Sau |
|---|---|---|
| `check-seams` phủ sóng | **46%** (118/258 file) | **97%** |
| `check-seams` hit | 91 | **0** |
| `check-padding` hit | 34 | **0** (7 ngoại lệ khai kèm lý do) |

`InsetScale` thêm bậc **`snug`** (`p-2`). `Flex`/`Stack` nhận **`as`** và **`inline`**.

Cơ chế ngoại lệ mới: khai `// inset-exception: <lý do>` **theo DÒNG**, và **bắt buộc có lý do**
— khai suông vẫn bị bắt, đã kiểm bằng negative control. Ngoại lệ **hiện ra chứ không im**: con
số đó bò lên nghĩa là thang lại thiếu bậc.

### 0d. Đã push, cả hai repo `0 0` với origin

`bff8fbb2` + `f9b8201e` (FE) · `82b002fb3` + `ecf62e8b9` (canon).

---

## 0e. VIỆC CÒN LẠI, xếp theo thứ tự nên làm

**1 — Caret trong control: `size-4` hay `size-5`?**
Bảng `§1c` của trục `icon` nói vị trí `DIV` tra theo line-height ⇒ `size-5`, nhưng `Select`
đang `size-4` và `Accordion` thì vendor tự áp `size-4`. Nếu bảng đúng thì **mọi caret trong
control toàn app đang nhỏ hơn một bậc**; nếu sai thì phải sửa bảng.
⇒ **Đo trên browser rồi mới chốt.** Bảng dựng 2026-07-29, chưa thử lửa.

**2 — Bốn câu thật sự cần mắt thầy.** Tìm bằng `grep -rn "CHỜ THẦY CHỐT" principles/`.

⚠️ Grep ra **11 nhãn** nhưng chỉ **4 câu riêng biệt** — một câu hay xuất hiện ở cả `context.md`
lẫn `example.html`, và vài nhãn là câu đã ĐÓNG còn kể lại lịch sử ("nhãn CHỜ THẦY CHỐT nay đã
đóng"). Đếm nhãn rồi báo là đếm sai; đọc từng nhãn mới ra số thật.

| Trục | Câu |
|---|---|
| `async` | screen được gọi thẳng `AsyncContent` hay phải qua block — chọn (a) hay (b) |
| `frame` | ranh giới `Stack.H` ↔ `Cluster`, soát lại 2026-07-29 vẫn chưa chốt |
| `reading-flow` | một ngoại lệ căn lề còn áp dụng không, hay đã lỗi thời |
| `surface` | thu hẹp phạm vi một luật bề mặt |

Cả bốn đúng loại cần người: hai đường ra hai kết quả **nhìn khác nhau**, hoặc là quyết định về
sản phẩm chứ không phải về sự thật.

**3 — 44 gate chưa viết.** Mỗi trục tự liệt ra vạch cấm nào **viết script được mà chưa ai
viết** (đánh dấu ⬜ trong `context.md`). Nặng nhất là `icon` và `skeleton`.
Đây là thứ phân tích 40 vòng feedback chỉ ra: **50% số lần thầy phải feedback thuộc loại máy
bắt được**. Giờ nó là danh sách đếm được, không còn là cảm giác.

**4 — Một mâu thuẫn CHỦ Ý còn đứng.** `rules/1-decompose.md` §2 cấm screen import composite,
§5 lại liệt cùng câu đó là "chờ chốt". `git blame` cho thấy hai dòng sửa trong **CÙNG một
commit** — nên đây không phải sót do quên dọn.

---

## 0f. BA BÀI HỌC của phiên — thứ dễ mất nhất khi hết phiên

**Thấy neo lệch luật thì nghi CÁI NEO trước, đừng nghi cái luật.**
Trò từng treo câu "Tier A dùng `bold` hay `semibold`" và đi hỏi thầy, trong khi §3b của chính
file đó đã trả lời. Cái tưởng là mâu thuẫn chỉ là canon **trích neo nhầm** — lấy 2 file trong
`src` đang `semibold` ra minh hoạ cho luật `bold`, mà `src` là CÔNG TRÌNH, được phép lệch bản vẽ.

**Code trả lời câu "CÓ LÀM ĐƯỢC KHÔNG", không trả lời câu "CÓ NÊN KHÔNG".**
Tài liệu cũ nói chip cấm icon; đọc code thấy `ChipBase` có `icon` nên kết luận ngược lại là
chip nhận icon. **Cả hai đều sai một nửa.** Ranh giới thật (icon trạng thái được, icon miền
không) không nằm trong type, không grep ra được — phải người chốt. Một prop TỒN TẠI không phải
là một luật CHO PHÉP.

**Một phép đếm phủ một cách viết mà bỏ cách kia thì luôn báo thiếu.**
Thang `InsetScale` dựng trên phép đếm chỉ đếm prop `padding=` mà bỏ class viết tay, nên kết
luận "không ai dùng `2`" trong khi 34 call-site đang dùng. Cùng lỗi ở chỗ khác: "5/5 caret đều
`size-4`" đếm ĐÚNG nhưng đọc SAI, vì năm chỗ đó **không cùng một loại**.

---

## 0g. Phiên song song — bốn lần chạm mặt, cách xử

Suốt ngày có một phiên khác ghi cùng repo. Cả bốn lần **chờ hoặc nhường đều đúng**:

| Lúc | Xử |
|---|---|
| `SeamScale` đầu phiên | chờ, họ tự hoàn tất |
| `InlineIconLabel` 7 lỗi tsc | không đụng, họ sửa xong thì `tsc` tự xanh |
| `Flex`/`Stack` cùng lúc | dừng tay. Bản của họ dùng union hẹp hơn, **đúng hơn bản mình**, lấy bản họ |
| rebase canon cuối phiên | đụng THẬT ở `principles.md`. Không lấy đại một bên: mở diff, tìm thấy **3 bài học** họ thêm vào file vừa khai tử, chuyển từng cái về nhà mới |

**Push lần đầu bị từ chối ở CẢ HAI repo** vì behind origin. Đó là may — push thẳng được thì đã
đè mất việc của người khác. Luôn `git fetch` + đếm lệch trước khi push.

---

## 1. NĂM tầng + vendor (design đã XOÁ 2026-07-28)

`AnatomyTier = heroui · atom · frame · composite · block · screen`.

> Tầng `design` bị xoá vì phép thử của nó trùng với composite: cả hai đều "biết nội dung,
> không biết miền". Câu cũ "đẻ ở tầng design" nay đọc thành **composite**; block ĐƯỢC import
> block, nhưng phải kiếm được tầng của nó (`check-passthrough-block`).

`layouts` cũ đã tách làm hai theo phép thử **"khung có biết nội dung của nó không"**:

| Tầng | Là gì | Số |
|---|---|---|
| `frame` | **không biết nội dung**, chỉ quyết trục · seam · canh | 6 (`Cluster` `Container` `Grid` `ResponsiveRow` `Split` `Stack`) — `ResponsiveRow` thêm 2026-07-29, xem `principles/frame/context.md` §1 |
| `composite` | **biết nội dung**, dựng bằng frame (`SurfaceCard` `Section` `KeyValue` `Form` `ModalShell`…) | 37 |

Phép thử là **"sở hữu nội dung"**, không phải "đếm import" — một khung 0 import vẫn có thể biết
nội dung của nó.

**`frames` còn 5 hộc, không phải 7 (thầy chốt 2026-07-27):** `cluster` `container` `grid` `split`
`stack`. `DragScrollArea`/`ResizableRail` đã tách sang `behaviors/` — chúng thêm HÀNH VI (kéo,
cuộn, đổi cỡ), không thuần quyết trục/seam/canh nên không phải frame. `Flex` là tầng cài đặt
**NỘI BỘ** mà các frame khác dùng chung bên dưới, không export ra ngoài `frames/`.

`Container` đã bỏ `gap`/`header`/`footer`, chỉ còn giữ **khổ đọc** và **padding**. `Stack` nhận
`padding` (trước đây chỉ `Container` nhận).

---

## 2. Hai thứ chốt trong lượt này

### 2a. `states[]` — panel biết leaf có mấy state (thầy chốt layout C)

```tsx
<BlockAnatomy
    name="PhaseScarcityNote" tier="block" leaf="Default"
    renderClassName="mx-auto max-w-xl"
    reason="Bất biến của CẢ leaf, viết MỘT lần."
    states={[
        { name: "seatsRemaining = 14", why: "2 câu văn xuôi", code: `…`, render: <…/> },
        { name: "nextPhasePriceVnd = null", why: "…", code: `…`, render: <…/> },
    ]}
/>
```

Panel = **tab state + khung bên** (why · deps · code), panel **tự mở `@container`** để đo bề ngang
của chính nó, và **không bị bó theo khổ render** (đo được: panel 1201px trong khi render giữ
576px). Anatomy **BẬT sẵn**, toolbar chỉ để tắt khi chỉ cần soi pixel.

⛔ **Bản NEXT-STEPS cũ ghi "tab States đã BỎ, thêm lại là vỡ tsc" — đã LẠC HẬU.** `states[]` là
API hiện hành, 109 file story đã di trú. Đừng tháo.

`why` viết cho **LLM đọc để vẽ lại**, nên có khuôn: `name` = điều kiện dữ liệu · `why` = đúng 2
câu **văn xuôi English** (câu 1 render đổi gì, câu 2 vì sao sản phẩm muốn thế) · `code` = snippet
của **chính state đó** · `reason` = bất biến của cả leaf. **Không `—` `↔` `->` `=>`** (§4a).

### 2b. `gap` nói QUAN HỆ bằng CHỮ, số là compile error

```tsx
<Stack.V gap="grouped">   // ✅
<Stack.V gap={3}>         // ❌ compile error
```

`SeamScale = flush · tight · related · grouped · section · page`, SSOT
`.storybook/components/frames/_spacing.ts`. Số chỉ còn sống trong bảng `GAP_CLASS`. Đo DOM 6
state: **0 · 4 · 8 · 12 · 24 · 32px**.

`padding` **cũng viết bằng CHỮ** (thầy chốt 2026-07-27, đảo lại quyết định cũ "giữ SỐ"):
`InsetScale = flush(p-0) · cozy(p-3) · roomy(p-6) · airy(p-8)`, SSOT cùng file
`_spacing.ts`. Nó vẫn là **lòng của một mặt** chứ không phải seam giữa hai thứ, nên không dùng
chung bộ từ với `SeamScale` — `padding="related"` vẫn là câu vô nghĩa, nhưng lòng của một mặt
giờ có bộ từ RIÊNG của nó thay vì giữ số.

Chọn bậc = **sáu câu hỏi** (`rules/3` §1.0), dừng ở câu đúng đầu tiên. Chỗ hay lẫn nhất
`related` vs `grouped` có phép thử: **đổi chỗ hai con** — vẫn hiểu là đồng hạng, lú là có thứ tự.

---

## 3. Cổng máy — cái gì đang được GIỮ, cái gì vẫn chỉ là văn xuôi

| Cổng | Giữ luật gì | Trạng thái |
|---|---|---|
| `scripts/check-story-ids.mjs` | `storyId` trỏ tới story thật (sai thì **gãy câm**, không lỗi build) | ✅ xanh · **đã cắm `.husky/pre-commit`** |
| `scripts/check-seams.mjs` | bố cục gõ tay từ tầng frame lên · `gap` vào khung tự sở hữu nhịp · off-scale · `numeric-seam` | ✅ xanh |
| `scripts/check-inline-types.mjs` | hình dữ liệu không tên (`{ a: x }` trong prop/generic/param) | ✅ xanh |
| `scripts/check-padding.mjs` | ~~padding off-scale~~ (nay compiler giữ, `InsetScale` là union chữ — xem `rules/3` §1.0a) · **margin của con** | ✅ **XANH 0** (Stepper sửa bằng cấu trúc 2026-07-28) |
| `scripts/check-one-instance-per-state.mjs` | luật **MỘT STATE = MỘT INSTANCE**. Phép thử phân biệt: mảng `.map` chứa **CHUỖI** ⇒ đó là giá trị prop (union dump, phải tách state); chứa **OBJECT** ⇒ đó là dữ liệu thật (nhiều hàng, hợp lệ) | ✅ xanh · **đã cắm `.husky/pre-commit`** |
| `scripts/check-no-namespace.mjs` | **KHÔNG namespace** — bắt cả `Object.assign` lẫn `export const X = { … }`; có `--control` | ✅ **0** |
| `scripts/check-member-as-state.mjs` | một state phải là ĐIỀU KIỆN DỮ LIỆU, không phải tên member | ✅ xanh |
| `scripts/check-orphan-parts.mjs` | part có badge mà không khai trong cây | ✅ **0** |
| `scripts/check-passthrough-block.mjs` | block bọc đúng một con mà không thêm quyết định **hay câu chữ** | ✅ **0** · có `--control` hai chiều |

**Luật CHƯA có cổng nào giữ** (biết trước để không tưởng là sạch):
- ngoại lệ §11a.1 *"cha dựng rồi đặt vào slot của con thì vẫn khai"* — chỉ đọc JXS mới trả lời được.
- `gap`/`padding` chọn **đúng bậc** — cổng chỉ kiểm bậc có trong thang, không kiểm quan hệ.
- ranh giới tiếng Việt/Anh: copy sản phẩm (`"Tiếp tục"`) bị trích trong prose English, scanner
  không phân biệt nổi.

### Luật về cổng, học bằng máu lượt này
> Cổng ghim regex theo **cú pháp cũ** thì đổi từ vựng làm nó **đi câm mà vẫn báo xanh**.
> `gap-into-frame` ghim `gap=\{(\d+)\}`; ngày thang đổi sang chữ nó xanh trong khi không kiểm gì.
>
> ⇒ Đổi từ vựng một prop thì **soi lại mọi cổng nhắc tên prop đó**, và mỗi cổng chỉ tin sau
> **negative control**: cắm lỗi giả → thấy đỏ → gỡ ra. Cổng `check-story-ids` từng báo "sạch"
> trong khi mù 10 `storyId` nằm ở `_shared.tsx`; chỉ negative control mới lộ.

**Kết quả đo `check-one-instance-per-state.mjs` lượt đầu:** union dump `11 → 0`, states
`789 → 805`. 4/11 báo động ban đầu là **báo động giả** — agent đọc mảng `.map` thấy chứa OBJECT
(dữ liệu thật, nhiều hàng hợp lệ) nên **tự chối tách**, thay vì tách bừa theo cổng.

---

## 4. Chờ THẦY chốt

| # | Việc | Vì sao cần thầy |
|---|---|---|
| 1 | **Cắm `check-padding` vào husky?** | đang đỏ 20 chỗ ⇒ cắm bây giờ là chặn mọi commit sau. Dọn trước rồi cắm? (phần scale nay compiler giữ, chỉ còn margin cần dọn) |
| 2 | ~~**Đặt tên thang `padding`?**~~ **ĐÃ CHỐT 2026-07-27** | `InsetScale = flush · cozy · roomy · airy`, xem `rules/3-shape-tier.md` §1.0a |
| 3 | **Cây "Deps" thực chất là cây DOM** | *"nằm trong" ≠ "phụ thuộc vào"*. Popover render qua portal ⇒ `KeyValue.List` khai đúng vẫn không hiện. (a) đổi tên tab thành `Anatomy` · (b) deps lấy từ **import tĩnh**. Nghiêng **(b)** |
| 4 | **Panel gom node THEO TÊN** | `Stack.V.Page`, `Stack.H.PriceRow` không phải tên component, là id bịa để né va chạm |
| 5 | ~~**`Container.gap` vô hiệu im lặng**~~ **ĐÃ CHỐT 2026-07-27** | bỏ hẳn `gap`/`header`/`footer` khỏi `Container` — nó chỉ còn khổ đọc + padding; `Stack` nhận `padding` |
| 6 | **`ContinueLearning` là block chỉ để ghép chuỗi** | câu hỏi thật: prop `ContinueCard` sai từ đầu? Design nhận `meta: string[]` thì **buộc** ai đó ghép chuỗi |
| 7 | **`Cluster` vs `Stack.H`** có phải một khung? | cùng "hàng ngang", khác đường vào (`items` vs `children`) |
| 8 | **F3 — 5 atom cùng trả lời "chọn 1 trong N"** | `Tabs` `ExtendedTabs` `SegmentedToggle` `FlexWrapButtonRadio` `SelectableCardGroup`. 3/5 tự khai là block cũ bê thẳng vào `atoms/` |
| 9 | **F4 — atom mang nội dung DOMAIN** (§6c) | `PricePoint` (biết tiền + kỳ) · `UserCell` (biết user, lại là cụm) ⇒ phải tụt xuống `composite` |
| 10 | **§4a vs ca `baseline` là hai tiền lệ ngược** | *thêm giá trị vào union* (additive, compiler bắt khai đủ) khác *đổi giá trị đã ghim* (mọi call-site đổi hình). Cần viết thành một câu trong §4a |

---

## 5. Nợ kỹ thuật (không chặn)

- **`.storybook/NEXT-STEPS.md` còn 3 phát biểu lạc hậu** — mục 5 đã sửa; nếu còn thấy chỗ nào nói
  "5 tầng", "layouts", "states đã bỏ" thì tin file này.
- **2 helper còn đi đường anatomy CŨ** (sửa 2 chỗ này là ~14 story đổi theo):
  `stories/atoms/text/Typography/_leaves.tsx` · `components/screens/CourseContents/_shared.tsx`.
- **`_legacy`** — 5 link Deps gãy (đã ghi sổ, không chặn) + 378 leaf thiếu `code`. 4 file story lỡ
  dịch sang English trước khi thầy bảo dừng, **chưa revert**.
- **20 chỗ padding/margin sai** ở tầng composite — chạy `node scripts/check-padding.mjs` để lấy list.
- **22 eslint warning** `no-arbitrary-token` còn lại: hằng skeleton `my-[5px] h-[14px]` sống trong
  `.ts` nên rule (chỉ soi className trong JSX) **không thấy** — lỗ đã ghi trong `_skeleton-bar.ts`.
- **`CourseBrief` nhận 5 scalar rời của cùng một thực thể** — gom thành `course={{…}}`?
- **Cổng đếm state thiếu `why`/`code`** — nay đếm được vì `states[]` đã là API, chưa viết.
- **`ModalShell` có prop `bodyStartsWithTabs`** — gốc bệnh: khung phải HỎI nội dung bên trong nó
  là loại gì (có tab ở đầu body hay không) để tự chỉnh khoảng cách. Đây là mẫu **con-treo**: chưa
  gặp ca cần thì prop ấy **BIẾN MẤT**, không phải khai sẵn cho tương lai.

---

## 6. Cách làm tiếp

```bash
cd C:/Repositories/starci-academy && npm run storybook
```

**Bốn bẫy đã cắn, đọc trước khi gõ:**

1. **Storybook không boot** — máy bật Smart App Control chặn native `.node` của `oxc-resolver`:
   ```bash
   npm install @oxc-resolver/binding-wasm32-wasi@11.24.2 --no-save --force --ignore-scripts
   ```
   🚫 ĐỪNG set `NAPI_RS_FORCE_WASI=true` (global, kéo `@swc/core` sang WASI và vỡ). `npm ci` xoá
   binding này, cài lại khi cần.
2. **Watcher Windows kẹt khi THÊM/XOÁ/ĐỔI TÊN file story** — sửa nội dung thì HMR ok, thêm story
   mới thì index không cập nhật. `netstat -ano | grep ":6006.*LISTENING"` → kill PID → chạy lại.
   Xác nhận bằng `curl -s http://localhost:6006/index.json`.
3. **Đừng đoán `storyId`** — lấy từ `index.json`. Id thật có tên thư mục LẶP
   (`frames-cluster-cluster-base--gaps`), đoán theo title là trượt.
4. **Đừng tin đọc mắt, cũng đừng tin báo cáo agent.** Mọi phát biểu "đã sạch" phải từ cổng hoặc
   số đo DOM. Lỗi tầng layout **không làm vỡ tsc**: class Tailwind sai tên thì im lặng không sinh
   CSS. Sau mỗi lượt: `npx tsc --noEmit` + `npx eslint .storybook` + 5 cổng.

**Codemod — lỗi tự cắn, đừng lặp (vòng `gap` 2026-07-27):**
- regex thay `gap={N}` **ăn cả trong chuỗi prose** ⇒ nháy lồng nháy, vỡ 7 file. Phải biết vị trí
  đang nằm trong chuỗi nháy kép hay không rồi mới quyết escape.
- regex `[\s\S]*?` trong sửa import **nhảy qua dòng** ⇒ xoá 12 import của một file.
- `\bgap = ([0-9])\b` ăn số `0` của `0.1` (three.js) ⇒ để lại `.1`, vỡ cú pháp.

**Codemod — bài học CŨ tái phạm ở vòng `padding` 2026-07-27, ba lần liên tiếp:**
- `padding={0}` sống ở **BA ngữ cảnh khác nhau** trong cùng file: JSX attribute (thay được) ·
  chuỗi prose (phải để yên) · JSX attribute **BÊN TRONG một chuỗi** (phải escape). Một regex
  không phân biệt được ba cái đó — đây đúng là bài học `gap={N}` ở trên, chỉ khác prop, và lượt
  này vấp lại ba lần liên tiếp vì rút kinh nghiệm chưa đủ sâu.
- lỗi **PHẠM VI**: chạy codemod chỉ trên file có nhắc tên KIỂU (`SpaceScale`/`InsetScale`), trong
  khi nhiều call-site dùng thẳng `padding={0}` mà không nhắc tên kiểu nào cả ⇒ **trượt cả một
  file**.

⇒ Codemod xong **đọc `tsc` rồi đọc DIFF**, và chạy `--dry` trước. Đây là lần thứ hai cùng một
lớp lỗi (context-blindness của regex) cắn — ghi cả hai vòng lại một chỗ để lần ba không lặp nữa.
