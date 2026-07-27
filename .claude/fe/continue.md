# TIẾP TỤC — Storybook design-system (chốt 2026-07-27)

> Đọc file này TRƯỚC khi làm tiếp. Nó ghi **đang ở đâu · cổng máy nào đang giữ luật gì · còn chờ
> thầy chốt gì · nợ gì**.
>
> **Repo:** FE `C:\Repositories\starci-academy` · BE `C:\Repositories\ac\starci-academy-backend`,
> cùng branch `mtp`. Code design-system nằm ở `starci-academy/.storybook`.
>
> **Canon SSOT** ở BE, không ở FE:
> | File | Giữ gì |
> |---|---|
> | `.claude/fe/principles.md` | **§0** `.storybook`=BẢN VẼ · `src`=CÔNG TRÌNH. Đọc §0 trước khi động vào FE |
> | `.claude/fe/rules/1-decompose.md` | tách cây screen → atom |
> | `.claude/fe/rules/2-leaf-states.md` | chia leaf · vét states · **§8** API `states[]` · **§8a** tên state |
> | `.claude/fe/rules/3-design-tier.md` | **§1.0** gap bằng CHỮ · §1.0a padding · chọn khung · padding |
> | `.claude/fe/rules/4-organization.md` | tổ chức file · typesafe · **§4a** văn xuôi |
> | `.claude/fe/steps/0..5-*.md` | TRÌNH TỰ chạy workflow, mỗi bước có cổng đo |
>
> ⚠️ `starci-academy/.storybook/NEXT-STEPS.md` (2026-07-26) là bàn giao **cũ hơn** file này. Chỗ
> nào hai bên đá nhau thì **file này đúng** — xem mục 5.

---

## 1. Sáu tầng, không phải năm

`AnatomyTier = atom · frame · composite · design · block · screen`.

`layouts` cũ đã tách làm hai theo phép thử **"khung có biết nội dung của nó không"**:

| Tầng | Là gì | Số |
|---|---|---|
| `frame` | **không biết nội dung**, chỉ quyết trục · seam · canh | 5 (`Cluster` `Container` `Grid` `Split` `Stack`) |
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
    name="PhaseScarcityNote.Base" tier="design" leaf="Default"
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
| `scripts/check-seams.mjs` | bố cục gõ tay từ tầng design lên · `gap` vào khung tự sở hữu nhịp · off-scale · `numeric-seam` | ✅ xanh |
| `scripts/check-inline-types.mjs` | hình dữ liệu không tên (`{ a: x }` trong prop/generic/param) | ✅ xanh |
| `scripts/check-padding.mjs` | ~~padding off-scale~~ (nay compiler giữ, `InsetScale` là union chữ — xem `rules/3` §1.0a) · **margin của con** | 🔴 **ĐỎ 20** (9+11, đều tầng composite) · **CHƯA cắm husky** |
| `scripts/check-one-instance-per-state.mjs` | luật **MỘT STATE = MỘT INSTANCE**. Phép thử phân biệt: mảng `.map` chứa **CHUỖI** ⇒ đó là giá trị prop (union dump, phải tách state); chứa **OBJECT** ⇒ đó là dữ liệu thật (nhiều hàng, hợp lệ) | ✅ xanh · **đã cắm `.husky/pre-commit`** |

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
| 2 | ~~**Đặt tên thang `padding`?**~~ **ĐÃ CHỐT 2026-07-27** | `InsetScale = flush · cozy · roomy · airy`, xem `rules/3-design-tier.md` §1.0a |
| 3 | **Cây "Deps" thực chất là cây DOM** | *"nằm trong" ≠ "phụ thuộc vào"*. Popover render qua portal ⇒ `KeyValue.List` khai đúng vẫn không hiện. (a) đổi tên tab thành `Anatomy` · (b) deps lấy từ **import tĩnh**. Nghiêng **(b)** |
| 4 | **Panel gom node THEO TÊN** | `Stack.V.Page`, `Stack.H.PriceRow` không phải tên component, là id bịa để né va chạm |
| 5 | ~~**`Container.gap` vô hiệu im lặng**~~ **ĐÃ CHỐT 2026-07-27** | bỏ hẳn `gap`/`header`/`footer` khỏi `Container` — nó chỉ còn khổ đọc + padding; `Stack` nhận `padding` |
| 6 | **`ContinueLearning` là block chỉ để ghép chuỗi** | câu hỏi thật: prop `ContinueCard` sai từ đầu? Design nhận `meta: string[]` thì **buộc** ai đó ghép chuỗi |
| 7 | **`Cluster` vs `Stack.H`** có phải một khung? | cùng "hàng ngang", khác đường vào (`items` vs `children`) |
| 8 | **F3 — 5 atom cùng trả lời "chọn 1 trong N"** | `Tabs` `ExtendedTabs` `SegmentedToggle` `FlexWrapButtonRadio` `SelectableCardGroup`. 3/5 tự khai là block cũ bê thẳng vào `atoms/` |
| 9 | **F4 — atom mang nội dung DOMAIN** (§6c) | `PricePoint` (biết tiền + kỳ) · `UserCell` (biết user, lại là cụm) ⇒ phải tụt xuống `design` |
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
