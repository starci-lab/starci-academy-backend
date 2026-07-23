# Storybook Stories — STRICT (code-style cho `*.stories.tsx`)

> Cách VIẾT STORY (`.storybook/stories/**/*.stories.tsx`) của app FE chính (`starci-academy`, branch `mtp`). Đây là code-style cho **story** — khác code-style cho **component** (`src/components`). Story là tài liệu SỐNG của design system: viết sai thì nó DẠY sai chính cái nó demo. Mọi mẫu ✅/❌ dưới đây trích thẳng story thật trong `.storybook/stories/` (bỏ ổ đĩa). Verify = `tsc --noEmit` + `eslint --max-warnings=0`, KHÔNG cần browser (story = code khai báo). Format tuân [[imports-and-format]] (4-space · double-quote · no-semi · no-any).

## 1. Khung file — `meta` typed annotation, KHÔNG `satisfies`

- `import type { Meta, StoryObj } from "@storybook/nextjs"`; component import theo alias `@/components/...`.
- `meta` khai bằng **type annotation** `const meta: Meta<typeof X> = { ... }` → `export default meta` → `type Story = StoryObj<typeof X>`. Chỉ 2 field: `title` + `component`.
- Grounding: 100% story thật dùng annotation `Meta<typeof X>` + `export default meta`; **0 story dùng `satisfies Meta`**. Đừng "hiện đại hoá" sang `satisfies` — lệch cả corpus.

```tsx
// ✅ .storybook/stories/blocks/buttons/Button/Button.stories.tsx
const meta: Meta<typeof Button> = {
    title: "Core/Button/Button",
    component: Button,
}
export default meta
type Story = StoryObj<typeof Button>
```

```tsx
// ❌ satisfies (không có trong corpus) + gộp nhiều field lạ
export default {
    title: "Button",
    component: Button,
    parameters: { layout: "centered" },   // ❌ xem §3
} satisfies Meta<typeof Button>
```

## 2. `meta.title` gom cây theo HỌ — `<Root>/<Category>/<Name>` 3 tầng

- Luôn ĐỦ 3 tầng: **Root** / **Category (họ)** / **Name (leaf)**. Root hiện tại = `Core` (đa số) — GIỮ một Root nhất quán cho cả cây; đừng tự đẻ Root mới.
- **Category = tên HỌ, viết hoa số ít**, suy từ folder code: `async`→`Async`, `chips`→`Chip`, `buttons`→`Button`, `cards`→`Card`, `lists`→`List`, `form`→`Form`, `stats`→`Stat`, `navigation`→`Navigation`, `layout`→`Layout`, `feed`→`Feed`, `feedback`→`Feedback`, `identity`→`Identity`, `skeleton`→`Skeleton`. Component 1-mình-1-họ vẫn đủ 3 tầng (`Core/Skeleton/Skeleton`) — chấp nhận chữ lặp để giữ 1 hình dạng cây.
- Ngoại lệ THẬT = đổi CÂY theo VAI, không phải bỏ tầng: `InfoTooltip` (code ở `feedback/`) → `Core/Overlays/InfoTooltip`; `DiffViewer` → `Core/Rendering/CodeDiff`. Đây là gom về họ đúng vai, vẫn đủ 3 tầng.
- Sidebar tự gom folder theo Category; mỗi component GIỮ mục con riêng (Controls/Docs riêng) — KHÔNG merge nhiều component vào 1 file.

```tsx
// ✅ .storybook/stories/blocks/chips/DifficultyChip/DifficultyChip.stories.tsx
title: "Core/Chip/DifficultyChip"        // Root / Họ / Leaf
```

```tsx
// ❌ 2 tầng, mất họ → leaf trôi cạnh folder trong sidebar
title: "DifficultyChip"
// ❌ Root lạ, lệch phần còn lại của cây (đang là "Core/…")
title: "Components/Chip/DifficultyChip"
```

> ⚠ DRIFT đang có: một số file dùng Root `"Block/…"` thay vì `"Core/…"` (vd `Block/Feed/ChatPanel`, `Block/Commerce/PricingTable`). Root nên THỐNG NHẤT — khi đụng file, kéo về Root dominant `Core`, đừng nhân thêm biến thể.

## 3. Canvas full-bleed — TUYỆT ĐỐI KHÔNG set `parameters.layout`

- `.storybook/preview.tsx` đã set `layout: "fullscreen"` GLOBAL + decorator `min-h-screen w-full p-8`; content chảy từ **trên-trái**, canvas ĐỒNG NHẤT cả Storybook. Story override `layout` (nhất là `"centered"`) sẽ shrink-wrap canvas → strand `h-full` của decorator → block trôi lửng giữa khoảng trắng.
- **Wrapper bó chiều RỘNG thì GIỮ** (`w-80`, `max-w-2xl`…) — hẹp nhiều khi chính là nội dung story (narrow container, test truncation). Rule này chỉ cấm `layout`, không cấm width.

```tsx
// ✅ .storybook/stories/blocks/form/TextField/TextField.stories.tsx — bó WIDTH được giữ, KHÔNG có parameters.layout
render: () => (
    <div className="flex w-80 flex-col gap-3">
        ...
    </div>
)
```

```tsx
// ❌ tự set layout → nghịch canvas global, block trôi giữa trang
export const Default: Story = {
    parameters: { layout: "centered" },
    ...
}
```

## 4. `parameters.usage` (caption "Usage") — BẮT BUỘC mỗi story

- Mỗi story PHẢI có `parameters.usage`. Decorator trong `preview.tsx` render nó thành `Alert` "Usage" ngay TRÊN canvas; `autodocs` lấy JSDoc `/** */` phía trên story cho tab Docs. Không có `usage` = mất note trên canvas.
- **Nội dung = KHI NÀO dùng, PHẢI loại trừ ANH EM** — không tả cơ chế "nó làm gì". Block có lựa chọn thay thế (pager ⇆ nút "Tải thêm"; modal ⇆ drawer; tabs ⇆ segmented; variant này ⇆ variant kia) thì `usage` phải nói *chọn cái này THAY VÌ cái kia khi nào*.
- **Markdown-inline (backtick) CHỈ sống trong `usage`** — `preview.tsx` `renderUsage` tách `` `code` `` → `<code>` styled. Ngoài `usage` (vd description trong `render`) KHÔNG markdown.

```tsx
// ✅ .storybook/stories/blocks/buttons/Button/Button.stories.tsx — nói CHỌN cái nào khi nào, backtick ok trong usage
parameters: {
    usage:
        "Pick a variant by ROLE, not by the color you'd like to see: primary = the main CTA (at most 1 per surface) · " +
        "secondary = a supporting button PAIRED with a primary · tertiary = a supporting button that stands ALONE ...",
}
```

```tsx
// ❌ tả cơ chế trông-thế-nào, không cho biết KHI NÀO nên chọn nó
parameters: { usage: "A blue rounded button with a shadow." }
// ❌ thiếu hẳn usage
export const Default: Story = { render: () => <Button>OK</Button> }
```

## 5. Story so-sánh nhiều biến thể (`AllVariants`/`Branches`/`AllDifficulties`/`SizesAndStates`)

Khung CỐ ĐỊNH, ground từ `Button.stories.tsx` (`AllVariants`) và `AsyncContent.stories.tsx` (`Branches`):

- **Ngoài cùng LUÔN `flex flex-col gap-6`, neo TRÁI** — xếp DỌC, bất kể biến thể to (card) hay bé (chip). KHÔNG hàng ngang, KHÔNG grid ≥2 cột. (Xếp ngang/grid đẩy content sang phải + bóp mỗi ô hẹp → biến thể không render ở chiều rộng thật.)
- **Mỗi biến thể = cụm `flex flex-col gap-3`** gồm: (a) label-group `flex flex-col gap-2` → (b) demo thật.
- **Nhãn = `<Label>` (HeroUI) + CHỮ HOA ĐẦU** (`error` → `Error`) — KHÔNG hand-roll `<span className="text-xs text-muted">`.
- **Ngay dưới `<Label>` = 1 description "biến thể này XÀI LÚC NÀO"** bằng `<Typography type="body-sm" color="muted">` — `body-sm` chính là `text-sm`, đừng hand-roll `<span className="text-sm text-muted">`. Description = ĐIỀU KIỆN CHỌN, viết **chữ thường, KHÔNG markdown** (children `<Typography>` trần, không đi qua `renderUsage`).

```tsx
// ✅ .storybook/stories/blocks/buttons/Button/Button.stories.tsx
render: () => (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
                <Label>Primary</Label>
                <Typography type="body-sm" color="muted">
                    The main CTA. At most one per surface — two primaries breaks the hierarchy ...
                </Typography>
            </div>
            <Button variant="primary">Enroll now</Button>
        </div>
        {/* ...secondary, tertiary, ghost... mỗi cái 1 cụm gap-3 */}
    </div>
)
```

```tsx
// ❌ grid ngang + nhãn span-muted tay + không có description "khi nào"
render: () => (
    <div className="grid grid-cols-3 gap-4">
        <span className="text-xs text-muted">primary</span>
        <Button variant="primary">Enroll now</Button>
    </div>
)
```

- **Story chỉ PHẢN ÁNH luật, KHÔNG đẻ luật:** biến thể canon chưa có luật thì mô tả theo call-site thật đang dùng nó — đừng bịa luật mới trong story.

## 6. Bộ story TỐI THIỂU — 1 story chỉ đáng tồn tại nếu cho thấy điều KHÔNG suy ra được từ story khác

- 1 story = 1 **trạng thái / bố cục / hành vi KHÁC HÌNH trực quan**, không phải 1 giá trị prop khác.
- **Enum/tone/size explosion → GỘP 1 story so-sánh** (`AllVariants`/`AllDifficulties`) render mọi biến thể 1 lượt; bỏ per-value.
- **XOÁ filler:** chỉ khác `className`, chỉ khác SỐ LƯỢNG item, chỉ khác 1 icon/1 từ, 2 story gần trùng.
- **GIỮ:** 1 Default thật + state THẬT KHÁC HÌNH (loading / empty / error / disabled / overflow / truncation / có-vs-không slot đổi layout). Vd `ChatPanel` giữ đúng 3 story `Conversation` / `Empty` / `Typing` — mỗi cái 1 hình khác.

```tsx
// ✅ .storybook/stories/blocks/chips/DifficultyChip — 1 story AllDifficulties gộp cả 4 level
export const AllDifficulties: Story = { render: () => (/* 4 biến thể xếp dọc */) }
```

```tsx
// ❌ nổ 4 story per-value, không story nào cho thấy gì mới
export const Beginner: Story = ...
export const Intermediate: Story = ...
export const Advanced: Story = ...
export const Insane: Story = ...
```

## 7. Skeleton stories — MIRROR shape, demo qua `AsyncContent` / `isLoading`

Theo cách trong `Skeleton.stories.tsx` + `AsyncContent/components.tsx`:

- **Skeleton phải MIRROR cây layout thật** — giữ node cấu trúc (separator, wrapper, gap, cùng `p-3` như row thật) và CHỈ thay node content bằng `Skeleton.<Component>`; đừng rải shimmer bừa. Mục tiêu: box không nhảy/không collapse khi resolve.
- **Demo state loading qua wrapper thật** (`AsyncContent isLoading + skeleton={...}`), không dựng skeleton rời rạc trong story chính.
- **Story tra-cứu Skeleton** = bảng: skeleton bên trái, node THẬT cùng `type` bên phải để soi khớp chiều cao.

```tsx
// ✅ .storybook/stories/blocks/async/AsyncContent/components.tsx — skeleton mirror row thật (cùng SurfaceListCard + p-3 + separator)
export const skeleton = (
    <SurfaceListCard>
        {[0, 1].map((row) => (
            <SurfaceListCardItem key={row}>
                <div className="flex items-center gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-0">
                        <Skeleton.Typography type="body-sm" width="1/2" />
                        <Skeleton.Typography type="body-xs" width="1/3" />
                    </div>
                    <Skeleton className="size-4 rounded" />
                </div>
            </SurfaceListCardItem>
        ))}
    </SurfaceListCard>
)
```

```tsx
// ❌ shimmer phẳng, không mirror → box nhảy layout khi content về
export const skeleton = <div className="h-40 w-full animate-pulse bg-default" />
```

## 8. Mock data — domain thật, ngày ISO CỐ ĐỊNH, callback no-op

- **Dữ liệu giả mang tính domain THẬT** (tên khoá/bài/người dùng thực tế), không `foo`/`lorem`. Corpus hiện tại viết bằng tiếng Anh (vd `"Build a REST API"`, `"Authentication & authorization"`) — bám giọng của corpus, đừng trộn ngẫu nhiên.
- **Ngày = chuỗi ISO CỐ ĐỊNH**, TUYỆT ĐỐI không `new Date()` / `Date.now()` (story phải deterministic để snapshot ổn định). Grounding: 0 story dùng `new Date()`.
- **Callback = no-op** `() => {}` (hoặc state thật trong `Controlled`, xem §9).
- Mock data nặng / component `Controlled` tách ra file `components.tsx` cạnh story, import vào.

```tsx
// ✅ .storybook/stories/blocks/feed/CommentThread/components.tsx
createdAt: "2026-07-14T09:00:00.000Z",   // ISO cố định
onPress: () => {},                        // no-op
```

```tsx
// ❌ ngày động → snapshot đổi mỗi lần chạy
createdAt: new Date().toISOString(),
```

## 9. Stateful → wrapper `Controlled` (trong `components.tsx`); presentational → render thẳng

- Block cần `value + onChange` / selection / open-close → wrapper `Controlled` giữ `useState`, đặt ở `components.tsx` cạnh story, story chỉ truyền `initial*`. Block thuần render props → render thẳng trong `render`.

```tsx
// ✅ .storybook/stories/blocks/feed/ChatPanel/ChatPanel.stories.tsx
import { baseMessages, Controlled } from "./components"
render: () => <Controlled initialMessages={baseMessages} />
```

```tsx
// ❌ nhồi useState thẳng vào render của StoryObj (khó tái dùng, lặp ở mỗi story)
render: () => {
    const [messages, setMessages] = useState(baseMessages)   // → đưa vào Controlled ở components.tsx
    return <ChatPanel messages={messages} ... />
}
```

## 10. Block presentational + `AsyncContent` — taxonomy `variant / scenario / state`

Block story dựng theo cây **`variant / scenario / state`** (chi tiết ở skill `starci-fe-story-fix-block-apply`). Ánh xạ 3 tầng vào CODE — **KHÔNG bắt block phình 3 props**:

- **variant** = **prop** hình thái (`variant="item" | "hero"`).
- **scenario = SHAPE** = **prop discriminator** quyết COMPOSITION (part nào render). Dùng **discriminated union** để data ↔ shape KHÔNG lệch:
  ```tsx
  type Props = { variant: Variant; title: ReactNode; meta?: ReactNode[]; timeLeft?: ReactNode; urgent?: boolean; ctaLabel?: ReactNode } & (
      | { scenario: "progress"; value: number; max?: number }   // progress ⇒ BẮT BUỘC value
      | { scenario: "no-progress" }                              // no-progress ⇒ CẤM value
  )
  // component: {scenario === "progress" && <ProgressMeter value={value} max={max} />}
  ```
- **state (loading / error / empty)** = **KHÔNG phải prop của block** — block chỉ render **LOADED**. State do wrapper **`AsyncContent`** lo (switch ưu tiên `error → loading → empty → content`). API thật (`blocks/async/AsyncContent`):
  - `isLoading` + `skeleton` = cây `Skeleton.*` MIRROR đúng shape (per-scenario — vd No-progress skeleton KHÔNG có thanh).
  - `error` + `errorContent={{ title, onRetry, retryLabel }}` (props, không phải node).
  - `isEmpty` + `emptyContent={{…}}` — CHỈ khi consumer có nhánh empty.
  - `children` = block loaded.

**Story render "các loại ra":**
```tsx
// loaded leaves — render block TRỰC TIẾP (variant × scenario × tone)
export const NotUrgent: Story = { name: "Không gấp",
    render: () => <ContinueCard variant="hero" scenario="progress" value={2} max={8} /> }
export const Urgent: Story = { name: "Gấp",
    render: () => <ContinueCard variant="hero" scenario="progress" value={7} max={8} timeLeft="2 minutes left" urgent /> }
export const NotStarted: Story = { name: "Chưa có tiến độ",
    render: () => <ContinueCard variant="hero" scenario="no-progress" /> }

// state leaves — QUA AsyncContent THẬT (đừng hand-roll <SectionCard><Skeleton/>)
export const Loading: Story = { name: "Đang tải",
    render: () => (
        <AsyncContent isLoading skeleton={<HeroProgressSkeleton />}>
            <ContinueCard variant="hero" scenario="progress" value={2} max={8} />
        </AsyncContent>
    ) }
export const LoadError: Story = { name: "Lỗi tải (mạng rớt)",
    render: () => (
        <AsyncContent isLoading={false} error={new Error("network")}
            errorContent={{ title: "Mất kết nối", retryLabel: "Thử lại", onRetry: () => {} }}>
            <ContinueCard variant="hero" scenario="progress" value={2} max={8} />
        </AsyncContent>
    ) }
```

- **Skeleton MIRROR shape (§7) → 1 skeleton per SCENARIO** (Progress có thanh · No-progress không), KHÔNG nhân theo tone.
- ⚠️ `ContinueCard` (template) đang được nắn về chuẩn này (`scenario` prop tường minh + loading/error qua `AsyncContent`, thay cho `value===undefined` ngầm + `<SectionCard><Skeleton/>` hand-roll).

## 10b. Anatomy = ĐÚNG cây DOM thật, PER-LEAF (`BlockAnatomy`)

Mỗi **leaf** (mỗi story state/scenario) bọc render của nó trong **`BlockAnatomy` RIÊNG** — mỗi leaf tự mang trục anatomy (Sơ đồ + Cây). **KHÔNG** story `Anatomy` gom, **KHÔNG** `blockShell` (đã bỏ).

```tsx
export const Loading: Story = { name: "Đang tải",
    render: () => frame(
        <BlockAnatomy name="FlashcardDeckList" tier="block" leaf="Đang tải" parts={LOADING_PARTS}
            note="AsyncContent nhánh loading → lưới skeleton mirror.">
            <FlashcardDeckList decks={[]} isLoading showAnatomy onOpenDeck={() => {}} />
        </BlockAnatomy>) }
```

- ⭐ **`parts` PHẢN ÁNH ĐÚNG cây DOM/JSX mà leaf đó render.** MỌI primitive/sub-block render thật đều CÓ MẶT — kể cả part **cấu trúc** (`AsyncContent`, wrapper switch) — **nesting khớp DOM** (dùng `children` cho part con), thứ tự top-to-bottom. Đối chiếu JSX THẬT: **không sót, không dư, không "curate" cho gọn**.
- ⭐ **Dùng primitive THẬT** (import bản port), **CẤM stub inline hand-roll** — vd phải dùng `AsyncContent` thật chứ không tự viết fragment `if(isLoading)…`; có vậy cây DOM mới trung thực và part mới hiện badge được.
- **Part gắn `tier`** (`block` / `design` / `primitive`). Cụm ≥2 element ĐỒNG VAI = **1 GROUP** (`ButtonGroup · nút chính + phụ`, KHÔNG `Button ×2`).
- **Leaf khác composition → `parts` riêng**; leaf CÙNG composition (chỉ khác tone/data) → share 1 hằng `*_PARTS`. `reason` (đầy đủ) chỉ ở leaf chính; các leaf khác dùng `note` một dòng.
- **Cơ chế badge:** panel **ĐO** `[data-anat-part]` (gắn thẳng element THẬT, hoặc marker `inset-0` do `AnatomyOverlay` nhả khi `showAnatomy`) rồi vẽ badge — **pill/label KHÔNG đè nội dung**. `name` trong spec phải **KHỚP** label/tag của part thật thì badge mới neo đúng. Hover = **tụ sáng** (mờ part không liên quan, giữ part + tổ tiên), badge nảy + hàng legend sáng.

## 11. Verify = `tsc` + `eslint`, KHÔNG browser

Story là code khai báo. Sau khi sửa/thêm story: chạy `tsc --noEmit` + `eslint --max-warnings=0` cho file đụng vào. KHÔNG drive Storybook qua browser để "verify" — chậm và không phải việc của lane này; thầy tự soi UI trên Storybook đang mở (HMR tự áp). Story phải sạch: no unused import, no `any`, 4-space, double-quote, no-semi.

## 12. Test — smoke (`test-runner`) + Chromatic + axe; `play` CHỈ cho tương tác

⛔ **KHÔNG viết test cross-product (nCn) cho primitive presentational** — over-engineer (boilerplate lớn × nhiều primitive, chỉ assert lại Tailwind class mà Chromatic đã bắt). Regression của primitive tĩnh là VISUAL → Chromatic lo. Bộ ĐỦ:

- **`test-runner` smoke** (`@storybook/test-runner`, Playwright): tự động chạy MỌI story → fail nếu crash/không render. Enforce coverage **KHÔNG cần viết `play`**. Cần Storybook chạy + `npx playwright install chromium` (1 lần); `npm run test-storybook`.
- **Chromatic**: visual regression snapshot mỗi story → bắt "sửa prop-mapping → nhìn khác" (size/màu/layout).
- **axe** (`@storybook/addon-a11y`): a11y fail-on-error.
- **`play` (`storybook/test`)**: CHỈ viết khi có HÀNH VI tương tác thật cần assert — click→onPress, mở/đóng overlay, validate form (neo `PriceTag` play mở dialog). KHÔNG dùng assert size/count của primitive tĩnh.

→ Story = trình bày state (Variants/Sizes/Loading…) + thầy soi mắt · regression = Chromatic + smoke · behavior = `play` khi CẦN. Đừng đẻ story `⚙ Test` cross-product.

## Liên quan
- [[imports-and-format]] — 4-space · double-quote · no-semi · thứ tự import (áp cho cả story).
- [[loading-and-skeleton]] · [[async-data]] — mirror-shape skeleton + wrapper async (nguồn của §7 · §10).
- [[props-and-types]] · [[type-safety]] — `WithClassNames`, no-any (component mà story demo).
- Skill `starci-fe-story-fix-block-apply` (S3 render-states) — cây `variant/scenario/state` mà §10 code theo; block `AsyncContent` (`src/components/blocks/async/AsyncContent`) — switch state thật.
