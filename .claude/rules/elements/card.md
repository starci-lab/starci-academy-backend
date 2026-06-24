# Element — Card

> Element doc cho `Card` (HeroUI v3 `@heroui/react`). Tổng hợp các biến thể/cách dùng card đã chốt. Chi tiết từng quyết định nằm ở `drafts/*` (link bên dưới) cho tới khi `/merge`.

## Biến thể / cách dùng card (đã chốt)

### 1. Card thường (surface bounded)
- `<Card><CardContent>` — padding mặc định (`px-4 py-3` họ HeroUI). 1 nấc `bg-surface`. Flat (shadow chỉ overlay).

### 2. LabeledCard (section có nhãn)
- Block `blocks/cards/LabeledCard`: label + icon size-5 **NGOÀI** card, content + `AsyncContent` **TRONG** `<Card>`. Section trên dashboard/landing/profile dùng cái này, KHÔNG tự dựng card + header tay. Ref [[dashboard-labeledcard-and-tabscard]].
- `frameless`: content vốn-là-card(s) → bỏ frame ngoài (tránh card-in-card); nhưng empty/onboarding vẫn phải bọc 1 `<Card>` thật để khớp sibling — [[frameless-section-empty-state-needs-card]].

### 3. ★ ACCORDION CARD (Card p-0 + Accordion surface) — 2026-06-24
- **Khi list/section là 1 accordion → render dạng "Accordion Card": `Card` với content `p-0` bọc `<Accordion variant="surface">` bên trong.** Card chỉ làm KHUNG (bo góc + viền), accordion surface tự lo nền item + separator + bo góc first/last → các item tràn SÁT MÉP, KHÔNG double padding.
- Cách dựng chuẩn (đang dùng ở `CourseDetail/CourseCurriculum`): `LabeledCard` + prop **`flushContent`** (→ `CardContent className="p-0"`) bọc `<Accordion variant="surface">`. Label "Nội dung khóa học" nằm ngoài card.
- Vì sao `p-0`: accordion đã tự có mép/divider/padding item; card pad thêm = lệch + double. Vì sao `variant="surface"`: trên trang đứng (landing/settings, nền `bg-background` sáng) surface = đúng màu card, đọc như card thật. Ref [[accordion-card-surface-on-standalone-pages]].
- Reader/lesson (cụm code block dark) thì accordion dùng `variant="default" + bg-default` thay vì surface — [[lesson-accordion-contrast-and-size]]. Tức da accordion CHỌN THEO NỀN nó nằm trên, không một-cỡ.

### 3b. ★ LIST CARD (static, "da" y chang Accordion Card nhưng KHÔNG click) — 2026-06-24
- **List TĨNH cần trông giống Accordion Card** (vd "Cần biết trước"/prerequisites): bê **đúng class surface của HeroUI accordion** vào 1 list thường → nhìn y hệt card-accordion nhưng không expand/không cursor.
- Container: `<ul>` (frameless, KHÔNG lồng Card) `overflow-hidden rounded-3xl border border-default bg-surface`.
- Mỗi row `<li>`: `relative flex items-start gap-3 px-4 py-4` (khớp `.accordion__trigger` = `px-4 py-4`) + separator inset y chang surface accordion: `after:absolute after:bottom-0 after:left-[3%] after:h-px after:w-[94%] after:bg-surface-foreground/6 after:content-[''] last:after:hidden` (= `.accordion--surface .accordion__item::after`, row cuối ẩn).
- Nguyên tắc: khi đã có 1 "da" component được duyệt (accordion surface), muốn 1 element tĩnh trông y hệt → **soi CSS thật của component** (`@heroui/styles/.../accordion.css`: `bg-surface` · radius `min(32px,--radius-3xl)` · separator `bg-surface-foreground/6 left-[3%] w-[94%]`) rồi attach, KHÔNG tự chế.
- **Đã trích block (2026-06-25):** static list-card giờ có 2 block dùng chung — **`SurfaceListCard`** (rows click được, §3c) + **`CheckListCard`** (rows tĩnh check-led, §3d). Feature CHỈ ghép, KHÔNG inline class surface. `Foundations` (categories/resources) → `SurfaceListCard`; `CoursePrerequisites`/`CourseValueProps` → `CheckListCard`.

### 3c. ★ LIST CARD INTERACTIVE (da §3b NHƯNG row click được + hover như accordion) — 2026-06-24
- **List các lựa chọn BẤM ĐƯỢC mà muốn nhìn như Accordion Card** (vd chọn cổng thanh toán) → bê "da" §3b (surface accordion) nhưng mỗi row là **`<button>`** + hover như accordion trigger. Khác §3b (tĩnh, không click) và khác §3 (accordion thật, có expand) — đây là **list chọn**: click → hành động, hover → đổi nền.
- Container: `<div className="overflow-hidden rounded-3xl border border-default bg-surface">` (= da List Card).
- Mỗi row `<button>`: `relative flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left outline-none transition-colors hover:bg-default focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60` + separator inset y chang surface accordion: `after:absolute after:bottom-0 after:left-[3%] after:h-px after:w-[94%] after:bg-surface-foreground/6 after:content-[''] last:after:hidden`.
- **Hover = `bg-default`** — copy ĐÚNG `.accordion--surface .accordion__trigger:hover` (đọc `@heroui/styles/.../accordion.css`), KHÔNG tự chế tint. → row sáng lên y accordion khi rê chuột.
- **KHÔNG dùng `PressableCard`** ở đây (PressableCard = card rời `bg-surface` + gap, hover `bg-surface-secondary` → ra N card tách bạch, KHÔNG ra 1 list bounded). List card interactive = 1 khối liền, row chia bằng separator inset.
- Áp đầu: `PaymentModal` nhóm cổng "Thanh toán trong nước" (PayOS/Sepay) — bọc trong `LabeledCard frameless` (label + `labelEnd` "VND"), content = list card interactive. Ref [[elements/label]].
- **Đã trích block `blocks/cards/SurfaceListCard`** (`SurfaceListCard` container + `SurfaceListCardRow` row `<button>`/`<a>`, slot leading/title/subtitle/meta/trailing + `onPress`/`href`/`selected`/`isDisabled`). Dùng ở Foundations + PaymentModal. Khác `ListRow` (GitHub-style, hover `bg-surface-secondary`, py-2, border-b) — SurfaceListCardRow = da surface-accordion (hover `bg-default`, py-4, separator inset).
- **`SurfaceListCardItem` (static, free-form row) — 2026-06-25:** khi row đọc-là-1-card-liền nhưng nội dung BESPOKE (không khớp slot leading/title/subtitle của `SurfaceListCardRow`) → `SurfaceListCardItem` (`<div>` tĩnh, KHÔNG button/hover): block sở hữu **padding `px-4 py-4` + separator inset + `last:after:hidden`**, feature tự layout `children` bên trong. Dùng cho list info tĩnh nhiều dòng (vd changelog "Có gì mới": date+chip / title / body). Bọc trong `SurfaceListCard` container + `LabeledCard frameless` (label ngoài, tránh card-in-card). KHÔNG inline class `<ul>` surface ở feature — dùng block. Áp đầu: `ChangelogList` (dashboard).

### 3d. ★ CHECK-LIST CARD (block `CheckListCard` — list TĨNH check-led dùng chung) — 2026-06-25
- **Mọi list "brief items có/không tick" (value props · expected outputs · prerequisites · lesson outcomes) = block `blocks/cards/CheckListCard`** (`CheckListCard` container + `CheckListItem` row). 1 NGUỒN render dùng chung (ref [[concepts/single-source-render]]) — KHÔNG mỗi feature tự dựng `<ul>` + class surface §3b.
- `CheckListCard` = `<ul>` da §3b (`overflow-hidden rounded-3xl border border-default bg-surface`); `CheckListItem` = `<li>` `relative flex items-start gap-3 px-4 py-4` + separator inset + **`showCheck?` (default true)** leading `CheckCircleIcon text-success`. Body = children (`<Typography>` hoặc `<MarkdownContent>`).
- **`showCheck={false}`** cho prerequisites ("cần có TRƯỚC", không phải thành quả). outputs/value-props/outcomes = CÓ tick.
- Luôn cặp **`LabeledCard frameless`** (label ngoài, tránh card-in-card). Khác §3c `SurfaceListCard` (rows click được) — đây rows TĨNH (không click). Dùng ở: CourseValueProps · CoursePrerequisites · ChallengeView outputs+prerequisites · LessonReader outcomes.

### 4. Card lồng card / surface-in-surface
- Card con đặt trên card/modal cha → con dùng **`border border-default` + bg inherit/trong suốt**, KHÔNG fill chồng fill. [[card-in-card-border-not-double-fill]] + [[surface-in-surface-inner-has-border]].
- **Ngược lại — KHÔNG bọc outer card khi NỘI DUNG đã là các bounded object.** Cột/khối detail mà nội dung vốn là nhiều card/list có viền (vd findings) → để chúng đứng PHẲNG trên nền, **mỗi finding 1 card BORDERED TÁCH thẻ (`gap-3`)** — KHÔNG dồn vào 1 inset list dính separator, KHÔNG bọc thêm 1 outer surface card (thừa nấc + "hộp trong hộp"). Gom theo nhóm = eyebrow câm. Áp: `SubmissionResult` cột phải (bỏ outer card; findings = FeedbackCard bordered tách `gap-3`). Ref [[verdict-banner-and-separated-finding-cards]].

### 5. Item card (1 item = 1 card, bounded object)
- Mọi meta/tiến độ của item sống TRONG card đó, đặt cạnh action. [[item-card-meta-inside-bounded-object]].

## Gotcha render (HeroUI v3 unlayered)
- `<Card variant="default">` style **unlayered** → ĐÈ utility `border`/`bg-*` thêm qua className (utility ở `@layer utilities` thua unlayered). Muốn list "nhiều card viền tách bạch" → dùng `PressableCard`/`<div>` + utility surface, KHÔNG `<Card>`. Cùng họ [[item-card-meta-inside-bounded-object]] + [[lesson-accordion-contrast-and-size]].

## Spacing
- Padding card = container sở hữu (`px-4 py-3`); nội dung trong card nhịp `gap-3` (related) / `gap-2` (cụm con). Section ↔ section = `gap-6`. KHÔNG gap-1/5/8/10.
