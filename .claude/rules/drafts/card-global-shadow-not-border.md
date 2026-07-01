# Draft — Card GLOBAL = ELEVATION (shadow-surface mặc định HeroUI) + KHÔNG border — LẬT NGƯỢC "border + no shadow" (2026-06-30)

- File/§ đích khi `/merge`: `elements/card.md` (§ da card global) + **ĐÍNH CHÍNH/ĐÈ** mọi chỗ ghi "card hệ StarCi = flat, border + no shadow" (flip-card draft · [[verdict-banner-and-separated-finding-cards]] FeedbackCard · [[item-card-meta-inside-bounded-object]] · [[flip-card-fixed-height-center-prompt-scroll-answer]]).
- Bối cảnh: thầy soi trang Ôn tập (deck list) → *"card dùng shadow thay vì border (config default), xóa border cho card đi"*. Card đang viền `border-default` + `shadow-none` (override global cũ).

## Luật (STRICT) — ĐẢO chiều da card
- **Card global = dùng ELEVATION mặc định của HeroUI (`.card { @apply shadow-surface }`) + KHÔNG border.** Card đọc như **mặt nổi bằng SHADOW**, KHÔNG phải hộp viền. Đây là **config default** của HeroUI (thầy: "config default") → bỏ override ép-viền cũ.
- **ĐẢO NGƯỢC convention cũ:** trước đây StarCi chốt "card = border `--default` + `shadow-none` (flat bordered)" — GIỜ BỎ. `globals.css` `.card` cũ (`border: 1px solid var(--default) !important; box-shadow: none !important`) → đổi thành `.card { border: none !important }` (giữ `shadow-surface` baked, xoá viền). `.card--transparent` vẫn frameless (`border: none` + `box-shadow: none`).
- **Hệ quả:** mọi HeroUI `<Card>` THƯỜNG (deck list, LabeledCard content, item card…) giờ = shadow + không viền. Card lồng/surface-in-surface **vẫn dùng border** vì chúng là `<div>` + utility `border border-default` (KHÔNG phải `.card` — do HeroUI Card unlayered đè utility, nested card luôn dựng bằng `<div>`) → KHÔNG bị `.card{border:none}` đụng. Tức delineation nested vẫn bằng border ([[surface-in-surface-inner-has-border]] / [[card-in-card-border-not-double-fill]] còn hiệu lực cho DIV nested).

## Card-LIKE block tự thêm `border border-default` (KHÔNG phải `.card`) cũng → SHADOW (CHỐT 2026-06-30)
- Thầy: *"với mấy cái labeled card, accordion card"* (trang Lịch sử học) → block tự dựng surface-card bằng `<div>`/`<ul>`/`<Accordion variant="surface">` + utility `border border-default` cũng phải đổi sang **`shadow-surface`** (bỏ border), khớp da card mới. (Global `.card{border:none}` KHÔNG đụng các block này vì chúng KHÔNG mang class `.card`.)
- **Đổi:** `overflow-hidden rounded-3xl border border-default bg-surface` → `overflow-hidden rounded-3xl bg-surface shadow-surface`. Accordion-card: `overflow-hidden border border-default` → `overflow-hidden shadow-surface`.
- **`overflow-hidden` KHÔNG clip outset box-shadow của CHÍNH nó** (overflow chỉ clip con) → shadow vẫn hiện. OK.
- **`LabeledCard` (non-frameless) KHÔNG cần đụng** — nó dùng HeroUI `<Card>` → đã ăn global shadow. Frameless thì con (SurfaceListCard…) tự đổi.

## ⚠️ DARK MODE — `--surface-shadow` = transparent ở dark → card mất CẢ border LẪN shadow nhìn thấy
- `--surface-shadow` có shadow thật ở LIGHT, **transparent ở DARK** (HeroUI default). → ở dark mode, card (global + labeled/accordion/list) giờ KHÔNG border + KHÔNG shadow → chỉ còn `bg-surface` nổi nhẹ trên `bg-background`. Đây là hệ quả của "config default" (dark vốn không elevation bằng shadow). **Cần thầy xác nhận dark-mode flat-surface OK** trước khi sweep rộng.
- **NGOẠI LỆ giữ border:** accordion `::::accordion` trong lesson reader (`MarkdownContent/map.tsx`) = **surface-in-surface trong card đọc DARK** → shadow vô hình ở đó → **GIỮ `border border-default`** cho delineation. KHÔNG đổi sang shadow. (Cùng lý do: mọi nested/surface-in-surface trong vùng dark cần border, không shadow.)

## Sweep toàn repo (Haiku scan + audit tay) 2026-06-30 — CONVERT card top-level, KEEP surface-in-surface/input/divider
- **Quy tắc phân loại (STRICT) khi sweep:** CHỈ convert card **TOP-LEVEL** (đặt thẳng trên page `bg-background`, không lồng). **GIỮ border** cho:
  - **surface-in-surface** (card trong modal/drawer/reading-card; accordion `::::accordion` trong lesson) → border delineation (shadow vô hình ở dark).
  - **input/field/textarea/dropzone/search** → giữ border + `shadow-field`.
  - **divider** (`border-b/t/l/r` separator) + **state/selection outline** (`border-accent` radio đang chọn, hover-accent) → giữ.
  - **viz/decorative container** (`bg-background` graph, browser-mockup chrome) → border là khung chứa.
- **ĐÃ CONVERT (`border border-default bg-surface` → `bg-surface shadow-surface`, tsc/eslint sạch):** `FlipCard` (block) · `TruthList` (block) · `CourseValueProps`/`CoursePrerequisites` skeleton · `LeaderboardChampion` · `AiSettings` credit card · `RewardsPage` list card · `SystemStatusSkeleton` (×2) · 3 flashcard skeleton (`FlashcardReviewerSkeleton`/`FlashcardDeckListSkeleton`/`DueReviewSkeleton`). + (trước đó) blocks SurfaceListCard/CheckListCard, LearningHistory outlines, FlexWrapButtonRadio.
- **CỐ Ý GIỮ border (KHÔNG convert):** `PaymentModal` list (trong modal) · `ShowcaseMockup`/`KnowledgeGraph`/`LearnLoopScroll` (decorative/marketing/bg-bg) · `EnrollGate` (bg-default gate) · `ChallengeCard` (nghi surface-in-surface trên reading paper — chưa chắc, để dành) · markdown accordion + code/mermaid/image (lesson nested) · mọi input/dropzone/dropdown/chip/divider.
- **Thầy chốt "dark mode flat OK" (2026-06-30)** → ĐÃ sweep nốt accordion-card top-level: `CourseFaq` · `CourseCurriculum` · `ChallengeView` (×3) · `SubmissionResult` · `TaskResult` (`overflow-hidden border border-default` → `overflow-hidden shadow-surface`). GIỮ border CHỈ cho markdown accordion (lesson nested).
- **Gỡ `shadow-none` (thầy chốt 2026-06-30)** — card ép flat giờ ăn global shadow: `FeedbackCard` + skeleton (bg-surface, bỏ luôn `border border-default` dead) · `SubmissionAttemptCard` + skeleton (đổi `bg-transparent border-divider shadow-none` → **`bg-surface`** — bg-surface thay vì transparent để hiện shadow + không "shadow quanh hộp trong suốt"; surface-in-surface trong drawer chấp nhận flat dark-mode).
- **HeroUI `<Card>` + utility `border border-default`** (vd `ComponentCard`, `AiKeyGroup`): border đã bị global `.card{border:none!important}` GIẾT sẵn → đã shadow+no-border, utility `border` = dead code (vô hại, chưa dọn).

## ⚠️ BLAST RADIUS — component ép `shadow-none`/`border` thủ công sẽ lệch (cần sweep khi /merge)
- Component nào trước đây thêm **`shadow-none`** lên `<Card>` (theo convention cũ "no shadow") giờ sẽ **mất shadow** → phẳng trơ (không viền, không shadow). Cần rà bỏ `shadow-none` thừa để ăn shadow mới. Nghi: FeedbackCard, flip-card skeleton, các card từng ghi "shadow-none".
- Component thêm **`border border-default`** thẳng lên `<Card>` (không phải div) → bị `.card{border:none!important}` xoá → mất viền (thường OK, vì giờ shadow gánh). Nếu border đó LOAD-BEARING (vd `border-accent` "của tôi" trên `<Card>`) → chuyển sang `ring-accent` (ring = box-shadow, sống sót) hoặc dựng `<div>`.
- **Drafts/rules ghi "border + no shadow" cần đính chính khi /merge:** flip-card · FeedbackCard verdict · item-card · "card global border + no shadow". Giữ lại: nested surface-border (div) + ngoại lệ frameless.

## Card-LIKE radio (SelectableCardGroup / FlexWrap*Radio) cũng dùng SHADOW (CHỐT 2026-06-30)
- Thầy: *"mấy cái card like như card radio này cũng giữ shadow nhé"* (trang ai-settings, `FlexWrapButtonRadio` card-styled). → component **card-like radio** (chọn-1-card sáng lên) phải đồng bộ da card mới: **chưa chọn = `bg-surface` + `shadow-surface` (KHÔNG border)** · **đang chọn = `bg-<color>/10` + `border-<color>` (tín hiệu chọn) + shadow**. Border-color chỉ còn ở state ĐANG CHỌN (làm signal), bỏ border-default ở state thường (shadow gánh ranh giới).
- **Impl gotcha:** dùng utility **`shadow-surface`** (KHÔNG inline `boxShadow`) — `.button` base CHỈ set `transition: box-shadow` (không set box-shadow literal) nên utility áp được; focus-ring `.button:focus-visible` đã `box-shadow: …, var(--tw-shadow)` → utility shadow **compose** với ring (inline boxShadow sẽ clobber ring). Verify qua `@heroui/styles` heroui.min.css.
- **Đính chính** [[selectable-card-group-surface-select-state]] / [[elements/card]] §3e/§3f: da card-radio "chưa chọn" đổi từ `border border-default` → `shadow-surface` (no border); "đang chọn" giữ `bg-<color>/10 + border-<color>`.

## ĐÃ ÁP DỤNG 2026-06-30 (FE `D:\Repositories\starci-academy`, branch mtp)
- `src/app/globals.css` `.card` override: `border 1px + box-shadow:none` → **`border: none`** (giữ `shadow-surface`). `.card--transparent` thêm `box-shadow: none` (frameless flat). CSS-only → cần hard refresh để ăn (đổi rule cấp `.card`).
- `FlexWrapButtonRadio` (card-styled, `insideCard={false}`): chưa chọn `border-default` → **`shadow-surface`** (no border); đang chọn giữ `border-<color>` + tint + shadow. (ai-settings ladder/surface override.)
- **SurfaceListCard** + **CheckListCard** (block) + **LearningHistory** `CourseOutline`/`CourseMilestoneOutline` ACCORDION_CARD (+ skeleton) → `shadow-surface` (bỏ border). (Lịch sử học = trên màn.)
- **Chưa mirror** sang `FlexWrapCardRadio` + `SelectableCardGroup` (card-radio) — chờ thầy gật.
- **Chưa sweep accordion-card còn lại** (cùng pattern, không trên màn): `CourseFaq` · `CourseCurriculum` · `TaskResult` · `SubmissionResult` · `ChallengeView`(×3). GIỮ border: `MarkdownContent/map` (lesson nested) · `TruthList` (marketing). Chờ thầy xác nhận dark-mode OK rồi sweep.
- **Chưa sweep** component ép `shadow-none`/`border-*` thủ công (blast radius trên) — chờ thầy duyệt có quét không.
