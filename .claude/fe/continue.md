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
| `frame` | **không biết nội dung**, chỉ quyết trục · seam · canh | 7 (`Container` `Grid` `Cluster` `Split` `Stack` `Flex` `DragScrollArea`/`ResizableRail`) |
| `composite` | **biết nội dung**, dựng bằng frame (`SurfaceCard` `Section` `KeyValue` `Form` `ModalShell`…) | 37 |

Phép thử là **"sở hữu nội dung"**, không phải "đếm import" — một khung 0 import vẫn có thể biết
nội dung của nó.

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

`padding` **giữ SỐ** (`SpaceScale = 0|1|2|3|6|8`) cố ý: nó là **lòng của một mặt**, không phải
seam giữa hai thứ, nên `padding="related"` không phát biểu gì.

Chọn bậc = **sáu câu hỏi** (`rules/3` §1.0), dừng ở câu đúng đầu tiên. Chỗ hay lẫn nhất
`related` vs `grouped` có phép thử: **đổi chỗ hai con** — vẫn hiểu là đồng hạng, lú là có thứ tự.

---

## 3. Cổng máy — cái gì đang được GIỮ, cái gì vẫn chỉ là văn xuôi

| Cổng | Giữ luật gì | Trạng thái |
|---|---|---|
| `scripts/check-story-ids.mjs` | `storyId` trỏ tới story thật (sai thì **gãy câm**, không lỗi build) | ✅ xanh · **đã cắm `.husky/pre-commit`** |
| `scripts/check-seams.mjs` | bố cục gõ tay từ tầng design lên · `gap` vào khung tự sở hữu nhịp · off-scale · `numeric-seam` | ✅ xanh |
| `scripts/check-inline-types.mjs` | hình dữ liệu không tên (`{ a: x }` trong prop/generic/param) | ✅ xanh |
| `scripts/check-padding.mjs` | padding off-scale · **margin của con** | 🔴 **ĐỎ 20** (9+11, đều tầng composite) · **CHƯA cắm husky** |

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

---

## 4. Chờ THẦY chốt

| # | Việc | Vì sao cần thầy |
|---|---|---|
| 1 | **Cắm `check-padding` vào husky?** | đang đỏ 20 chỗ ⇒ cắm bây giờ là chặn mọi commit sau. Dọn trước rồi cắm? |
| 2 | **Đặt tên thang `padding`?** | muốn thành chữ thì phải nghĩ từ vựng khác hẳn — padding tả *độ thoáng của một mặt*, không tả quan hệ |
| 3 | **Cây "Deps" thực chất là cây DOM** | *"nằm trong" ≠ "phụ thuộc vào"*. Popover render qua portal ⇒ `KeyValue.List` khai đúng vẫn không hiện. (a) đổi tên tab thành `Anatomy` · (b) deps lấy từ **import tĩnh**. Nghiêng **(b)** |
| 4 | **Panel gom node THEO TÊN** | `Stack.V.Page`, `Stack.H.PriceRow` không phải tên component, là id bịa để né va chạm |
| 5 | **`Container.gap` vô hiệu im lặng** | khi không dùng slot `header`/`footer` thì `gap` bị bỏ (đo được **0px** trong khi code ghi `gap="page"`). Sửa cho nó luôn `flex flex-col` sẽ đổi hình MỌI consumer (§4a). Cách nhẹ: **bỏ hẳn prop** |
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
   CSS. Sau mỗi lượt: `npx tsc --noEmit` + `npx eslint .storybook` + 4 cổng.

**Codemod — 3 lỗi tự cắn trong lượt này, đừng lặp:**
- regex thay `gap={N}` **ăn cả trong chuỗi prose** ⇒ nháy lồng nháy, vỡ 7 file. Phải biết vị trí
  đang nằm trong chuỗi nháy kép hay không rồi mới quyết escape.
- regex `[\s\S]*?` trong sửa import **nhảy qua dòng** ⇒ xoá 12 import của một file.
- `\bgap = ([0-9])\b` ăn số `0` của `0.1` (three.js) ⇒ để lại `.1`, vỡ cú pháp.
⇒ Codemod xong **đọc `tsc` rồi đọc DIFF**, và chạy `--dry` trước.
