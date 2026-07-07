---
name: fe
description: >
  Frontend conventions + design system (UI 2.0) for the MAIN StarCi Academy web app at
  `D:\Repositories\starci-academy` (Next.js App Router + React 19 + HeroUI v3 + Tailwind v4 + SWR
  + Redux + zustand + Phosphor). Use this skill whenever building, fixing, refactoring, or reviewing
  UI in that repo — pages, components, blocks, features, hooks, forms, API calls, styling. Encodes the
  4-layer architecture (Tokens → HeroUI+globals → Blocks → Features), design tokens, blocks library,
  AsyncContent + toast conventions, and engineering rules. NOT for lesson FE repos under `.repo/`
  (use skill-code-example-fe). Trigger when the user types `/fe` or asks to touch the main frontend.
---

# /fe — Main StarCi Academy frontend (UI 2.0)

Repo: **`D:\Repositories\starci-academy`** (Next.js App Router · React 19 · Tailwind v4 · HeroUI v3
`@heroui/react` · next-themes · SWR · Redux Toolkit · react-hook-form+zod · zustand · **Phosphor Icons**).

> ⚠️ FE thật ở `D:\Repositories\starci-academy` — KHÔNG phải `ac\starci-academy` (repo rỗng).

## BƯỚC 0 — ĐỌC SSOT TRƯỚC (bắt buộc, non-trivial work)

Rules v2 (SSOT) sống ở repo BE: **`D:\Repositories\starci-academy-backend\.claude\rules\`** (dù mô tả app FE). Mindset thiết kế = `concepts/*.md` + skill **`ui-ux-pro-max`**. Đọc trước khi sửa UI:

1. **`concepts/*.md`** — triết lý + heuristics + when-to-use-what (accent · card · single-source · fair-monetization…).
2. **`elements/*.md`** khi đụng element đó (render NTN): `elements/{button,card,chip,input,list,tabs,icon,label,header,sidebar,alert,accordion,color,price,richtext}.md`.
3. **`layouts/*.md`** (gap/spacing/sticky/scrollbar) + **`responsives/*.md`** (overflow/co giãn) khi đụng bố cục/nhịp.

**Khi thầy dạy/chốt 1 điều, hoặc feedback sau khi trò làm xong → GHI THẲNG vào canonical v2** (`.claude/rules/{concepts,elements,layouts,responsives}/*.md`, đúng file/section) — **CHỈ khi là nguyên tắc TÁI DÙNG thật, giữ ngắn.** (Workflow `drafts/*` đã khai tử 2026-07-06 — KHÔNG tạo draft.)

## Luật vàng

**Mỗi loại quyết định sống ở ĐÚNG MỘT tầng. Style chảy 1 chiều, feature chỉ GHÉP — không vẽ.**
Cần `!important` đè chính code mình = quyết định nằm sai tầng.

| Tầng | Nơi | CHỈ quyết định |
|---|---|---|
| 4 Features | `components/features/**` | lấy data gì, dispatch gì, ghép cái gì (đọc store/SWR) — **KHÔNG style** |
| 3 Blocks | `components/blocks/<category>/<Block>/` | đồ ghép tái dùng, **OWN style**, props-only, CẤM store/SWR |
| 2 HeroUI + globals | `@heroui/react` + `globals.css` | **trông thế nào**: dùng HeroUI thẳng; đổi look toàn cục → override BEM trong globals |
| 1 Tokens | `globals.css` | CSS vars semantic: màu · spacing · radius · type |

> ⚠️ `components/reuseable/**` + `components/layouts/**` = **LEGACY**, KHÔNG thêm code mới (migrate dần).

## MUST (phá là sai)

- **Style chỉ ở blocks (tầng 3) hoặc globals (tầng 1).** Features/layouts: `className` = **chỉ PLACEMENT**
  (w/h/size · flex/grid/col-span/order · gap/m-* · justify/items · `md:/lg:`). CẤM `bg-* border* shadow*
  rounded* text-{size} font-* truncate opacity p-*`. Đổi look HeroUI dùng-nhiều-nơi → override `.bem__class`
  trong globals; look 1 cụm → tạo **block**.
- **Token semantic only:** `bg-background`/`bg-surface`/`text-foreground`/`text-muted`/`text-accent`/
  `border-separator`/`text-{success,warning,danger}`. CẤM hex/`slate-*`/`cyan-500` (brand ngoài → token `--brand-*`).
- **Spacing `0/2/3/4/6`** (lưới 4px, cả `gap` lẫn `padding`, **CẤM `1.5`**); **padding card `px-4 py-3` cố định**.
  Radius concentric `rounded-2xl`(khung)→`rounded-xl`(ô/field)→`rounded-full`; con<cha. Flat (shadow chỉ ở overlay).
- **Text = `Typography`** (`type/weight/color/truncate/align` qua PROP; `color` chỉ default|muted → màu nhấn
  `text-{token}` là ngoại lệ duy nhất). CẤM `<div>/<span>`+text class, CẤM `text-[Npx]`. **Canh chữ = prop
  `align`** (KHÔNG dựa `text-center` cha — Typography bake text-align, đè inherit).
- **Icon = phosphor `@phosphor-icons/react` export `*Icon`** (bare name deprecated). **Brand/social logo
  = `react-icons/fa6`** (`FaGithub/FaLinkedin/FaXTwitter`). KHÔNG `@gravity-ui`/`lucide`/`react-simple-icons`.
  Icon đại diện entity → block **`IconTile`**.
- **HeroUI dùng thẳng + compound đúng slot** (`onPress` không `onClick`; `isPending`). Dropdown/Popover =
  `Dropdown.Item`+`ItemIndicator`+`Label`, group=`Dropdown.Section`>`Header`. Tabs = block **`ExtendedTabs`**.
  Text bấm được = `Link` (href→navigate / `onPress`→modal); nút khối = `Button` (variant ngữ nghĩa, 1 primary).
- **MỌI fetch/SWR → bọc block `AsyncContent`** (`isLoading`+`skeleton` mirror layout + `isEmpty`+`emptyContent`
  PROPS + `error`+`errorContent` PROPS; ưu tiên error→loading→empty→content; emptyContent rỗng=tự ẩn). CẤM
  `isLoading?`/Spinner trần/`data??[]`. List phân trang → `useSWRInfinite`.
- **Call API qua wrapper:** GraphQL write → `useGraphQLWithToast()`; REST write → `useRestWithToast()`. CẤM
  `toast.*` thô. Read KHÔNG toast. Phản hồi <100ms: nút `isPending`; auto-save → text "đang lưu/đã lưu".
- **Section card = block `LabeledCard`** (`Label`+icon size-5 NGOÀI card; content+`AsyncContent` TRONG card;
  see-more=`Link`+caret). `SectionCard` (reuseable) = legacy.
- **Sticky:** tab-strip/sub-header ngang đầu trang = sticky (`top-16 z-40`); sidebar identity = KHÔNG sticky.
- **page.tsx chỉ `return` 1 component** từ `components/`. **English-only** comment/identifier; UI text qua i18n.

## SHOULD (default, lệch phải có lý do)

- 1 component = 1 folder + `index.tsx`; **tên folder y chang tên component**; nested ASAP; sub-component
  lồng cha; hook feature-local → `<Feature>/hooks/`, chung → `src/hooks/<kind>/`.
- Mọi `*Props extends WithClassNames`; container props CHỈ `className/classNames`, tự đọc store/SWR
  (CẤM data/callback/id props) — trừ list-item trong `.map` + block (props-only, cha wiring).
- File-splitting `types/ enums/ constants/ utils/ map.ts`; `Array<T>` không `T[]`; handler `onXXX`+`useCallback`;
  derived `useMemo`; import 1 hướng (`modules/types ← … ← components`); barrel dừng ở category.
- Form = `src/hooks/rhf/useXxxForm` (rhf+zod, component chỉ bind); overlay = 1 zustand store + `ModalContainer`.

## AVOID (mùi xấu)

`text-[Npx]` · hex/`slate-*` · `gap/p` lệch scale (đặc biệt `1.5`) · `handleXxx` · arrow-logic inline JSX ·
`toast.*` thô · mega-barrel · hardcode text · bọc/dựng lại HeroUI · `useEffect` trong hook SWR · style trong
features · `<div>/<span>`+text class · raw empty/loading/error ngoài `AsyncContent` · tạo file `drafts/*` (workflow đã khai tử — ghi thẳng canonical v2).

## Workflow khi vào việc

1. Đọc Bước 0 (rules v2: `concepts/*` + `elements/*` + `layouts/*` + `responsives/*`), rồi file chi tiết của phần đang sửa.
2. Thiết kế xám trước (layout/hierarchy), xác định 1 hành động chính.
3. Lắp từ block + HeroUI có sẵn; chỉ tạo block mới khi thiếu. Feature chỉ ghép.
4. Đủ 3 state qua `AsyncContent` + async feedback (`isPending`/saving) + toast cho write.
5. `npx tsc --noEmit` + `npm run lint` sạch (baseline: 4 lỗi blog WIP pre-existing). Verify bằng mắt (chạy→chụp→soi→sửa).
