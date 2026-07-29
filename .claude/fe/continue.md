# TIẾP TỤC — Storybook design-system (chốt 2026-07-28, cập nhật 2026-07-29)

> ⚠️ **§0-6 dưới đây đã CŨ (chốt 2026-07-28)** — giữ lại vì nhiều mục §4 vẫn còn giá trị tham
> khảo, nhưng bản đồ 5 tầng/cổng máy ở đó là ảnh chụp NGÀY ĐÓ. **Trạng thái THẬT hiện tại nằm ở
> `.claude/fe/steps/13-feedback-anatomy-registry.md`** (nhật ký feedback dạng batch, tới
> §3a tính đến 2026-07-29) — đọc file đó để biết chuyện gì vừa xảy ra, KHÔNG đọc lại §1-§6 dưới
> đây như hiện trạng.

## 0. TRẠNG THÁI 2026-07-29 — đọc mục này trước khi làm tiếp

**Việc lớn vừa xong trong ngày** (chi tiết đủ ở `steps/13-...md` §2g→§3a):
- Skill mới `/starci-fe-story-feedback` (2 lượt QA cho feedback CODE thầy đưa khi soi Storybook)
  + luật "kiểm tồn đọng trước khi trả lời" (chống lặp lỗi rơi mất fix đã chốt).
- `SurfaceCard.Pressable` gộp vào `.Base` (`isPressable` suy nội bộ, đúng khuôn `List.Row`).
- Layout khung MỚI `frames/SplitWorkspace/` (read-column + sticky-aside, đúng CSS thật
  `ChallengeView`/`PersonalProjectWorkspace`) — áp cho `ChallengePage` + `PersonalProjectTaskPage`.
- Bug THẬT tìm ra ở `Container.tsx`: `@container` + `padding` chung 1 element khiến
  `@app-xl:` KHÔNG BAO GIỜ fire khi `size="xl"` (cap trùng đúng ngưỡng breakpoint) — đã fix tách
  2 lớp. **Luật rút ra: `tsc`/9-gate/eslint sạch KHÔNG chứng minh container-query render đúng —
  phải đo `getComputedStyle` trên browser thật.**
- `Typography` thêm `parseInlineCode` (backtick→`<code>` span-only, cho chỗ không lồng được
  `MarkdownContent` như accordion title trong `<button>`) + fix `decoration-[1.5px]` khớp
  HeroUI `Link` thật.
- `InputText` thêm prop `variant` (khớp `InputTextarea` đã có sẵn).
- Batch `isSkeleton` cho 24 composite còn thiếu + leaf `Skeleton` cho story tương ứng.
- Dọn `*Screen` → `*Page` khớp thư mục `pages/` (17 tên).

**Đã push lên `mtp` cả 2 repo** (commit `cb01d7d0` FE, `34006466` BE) — mọi thứ trên đây đã lên
nhánh chung, không còn nằm working-tree cục bộ.

**Đang treo, chưa xong**:
1. `ChallengePage` — 2 điểm feedback ảnh chụp ("vàng phải lệch" / "vàng trái render đàng hoàng
   hơn") — đo DOM thật (`ProgressMeterTargetMark`) không thấy bug, đang chờ thầy gửi ảnh crop
   sát hơn hoặc mô tả cụ thể hơn.
2. **Đang chạy 3 workflow Sonnet audit Foundations** (`FoundationsCategoryPage` /
   `FoundationsGridPage` / `FoundationResourcePage`, theo quy trình 4 trục: ranh giới import ·
   khung bố cục · cây deps · chữ hiện UI) — chạy nền, kết quả CHƯA có khi ghi dòng này. Việc
   TIẾP THEO khi phiên sau mở lên: đọc `/workflows` hoặc hỏi lại xem 3 audit này đã xong chưa,
   rồi review + verify + commit riêng (đừng coi output workflow là đã verify — luôn tự chạy lại
   tsc/9-gate/eslint trước khi tin).

⚠️ **Repo `starci-academy` (FE) đang có NHIỀU PHIÊN CHAT SONG SONG cùng ghi** — trước khi
`git stash`/`git reset`/bất kỳ lệnh nào có thể mất việc người khác, LUÔN `git status` trước và
KHÔNG BAO GIỜ stash để "so sánh nợ cũ" (dùng cách khác, vd đọc kỹ mô tả lỗi) — 1 lần stash có
thể làm biến mất hàng trăm file người khác đang sửa dở.

---
>
> **Repo:** FE `C:\Repositories\starci-academy` · BE `C:\Repositoriesc\starci-academy-backend`,
> cùng branch `mtp`. Code design-system nằm ở `starci-academy/.storybook`.
>
> **Canon SSOT** ở BE, không ở FE:
> | File | Giữ gì |
> |---|---|
> | [`.claude/fe/rules/0-boundary.md`](rules/0-boundary.md) | **§0** `.storybook`=BẢN VẼ · `src`=CÔNG TRÌNH. Đọc §0 trước khi động vào FE |
> | `.claude/fe/rules/1-decompose.md` | tách cây screen → atom |
> | `.claude/fe/rules/2-leaf-states.md` | chia leaf · vét states · **§8** API `states[]` · **§8a** tên state |
> | `.claude/fe/rules/3-shape-tier.md` | **§1.0** gap bằng CHỮ · §1.0a padding · chọn khung · padding |
> | `.claude/fe/rules/4-organization.md` | tổ chức file · typesafe · **§3b KHÔNG namespace** · **§4a** văn xuôi |
> | `.claude/fe/steps/0..5-*.md` | TRÌNH TỰ chạy workflow, mỗi bước có cổng đo |
> | `.claude/fe/steps/7-bo-namespace.md` | **đã xong** — bỏ namespace, 4 cái bẫy codemod |
> | `.claude/fe/steps/8-tinh-gon-trung-lap.md` | **đã xong** — dọn trùng + 2 việc chờ thầy chốt |
>
> ⚠️ `starci-academy/.storybook/NEXT-STEPS.md` (2026-07-26) là bàn giao **cũ hơn** file này. Chỗ
> nào hai bên đá nhau thì **file này đúng** — xem mục 5.

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
