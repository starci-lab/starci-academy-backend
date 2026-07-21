# Element — List

> Element doc cho họ "list" (blocks/lists). Chọn block theo bản chất item + ngữ cảnh. Chi tiết quyết định ở `drafts/*` cho tới khi `/merge`.

## Các block list (đã chốt)

### 1. `ListRow` — 1 hàng nhãn ngắn (truncate + trailing meta)
- Row nhãn 1 dòng, GitHub-style: title `truncate` + meta/trailing phải. Item title NGẮN. KHÔNG cho đoạn markdown dài (sẽ cắt cụt). Ref [[outcome-list-as-labeledcard-check-list]] (phân vai ListRow vs row tự dựng).

### 2. `PaginatedList` — list có phân trang
- List + pager. Pager căn TRÁI thẳng mép content, có hover/cursor. Ref [[list-pager-left-align-and-hover]].

### 3. ★ `LabeledList` — nhãn + list ngắn (+ CTA), KHÔNG card frame — 2026-06-24
- **Khi 1 khối là "label + danh sách item ngắn (+ 1 action)" mà KHÔNG cần khung card** (rail/panel) → dùng `blocks/lists/LabeledList`, KHÔNG tự dựng `<div>` + `Label` + `Separator` tay.
- **Cấu trúc + nhịp (block sở hữu):** `section flex flex-col gap-3` = 3 nhóm cách `gap-3`:
  1. **Header** = `icon + Label` (`flex items-center gap-2`).
  2. **List** = `flex flex-col gap-2` bọc children (item ↔ item = `gap-2`).
  3. **Action** (optional) = footer CTA (vd `Button self-start`).
- **Props:** `{ label, icon?, children (item rows), action?, className }`. Feature chỉ truyền data + render row + CTA; KHÔNG style.
- **Phân biệt với [[elements/card]] §2 `LabeledCard`:** LabeledCard = label NGOÀI + content trong **`<Card>`** (có khung surface). LabeledList = **KHÔNG khung**, content là 1 **list gap-2** + action — nhẹ hơn, cho rail/panel nơi thêm card sẽ nặng / đụng luật "không 2 card liên tiếp" ([[concepts/card]]).
- **KHÔNG divider giữa header/list/action** — ngăn bằng whitespace `gap-3` (ref [[concepts/whitespace-over-dividers]]). **KHÔNG dòng count thừa** ("N thử thách"/"N thẻ") khi list đã hiện item.
- Áp đầu: rail "Trên trang này" — `LessonChallenges` ("Luyện tập bài này") + `LessonFlashcards` ("Ôn tập bài này").

### 4. ListBox FLAT RAIL (master-detail) — HeroUI `ListBox`, KHÔNG card — 2026-06-25
- **Rail chọn item trong trang master-detail** (vd "Các lần thử" của `SubmissionResult`) = HeroUI **`ListBox`** render PHẲNG (KHÔNG card/viền bao ngoài).
- `ListBox` `className="gap-1 p-0"` (**`p-0`** bỏ padding mặc định `.list-box--default` 4px → list sát mép rail). `ListBox.Item` `rounded-2xl px-3 py-2` (rounded thống nhất họ radius page: card 3xl, inset 2xl) + hover `data-[hovered=true]:bg-default-100` + selected `data-[selected=true]:bg-accent/10`; `selectionMode="single"` + `selectedKeys` (controlled theo URL) + `onAction` (push `?param=`).
- Nhãn rail = block **`<Label>`** (HeroUI), KHÔNG `<Typography body-xs muted>`.
- Khác `SurfaceListCard`/`CheckListCard` ([[elements/card]] §3c/§3d, có khung surface bounded) — ListBox rail = list PHẲNG no-card (chỉ row + selected-highlight). Ref [[submission-result-flat-listbox-rail-and-detail-surface-card]].
- **Rail KIÊM bộ lọc/sort:** rail không chỉ "chọn item xem detail" — chọn 1 row có thể **re-sort/lọc** panel phải theo chiều đó (vd Leaderboard: rail = hạng mục XP, click → bảng re-rank theo hạng mục). Re-sort **client-side** khi payload đã đủ field (đừng fetch lại). Row chiều CHƯA có data → disabled "Sắp có" (`WarningCircleIcon`/mờ, không lock). Row có thể giàu hơn (icon màu category + tên + **giá trị của tôi** + caption), không chỉ 1 dòng.
- **Mobile:** rail dọc cạnh-trái chỉ hợp `lg+`; màn hẹp → **thu thành hàng chip cuộn ngang TRÊN đầu detail** (`hidden lg:flex` cho ListBox · `flex lg:hidden overflow-x-auto` cho chip-row). 1 component render cả 2 (pure CSS), cùng họ responsive với [[fe responsive breadcrumb]]. Ref [[master-detail-rail-as-filter-and-mobile-chips]].

## 5. Leading của row = `IconTile` (không icon trơ nhỏ) — CHỐT 2026-06-25
- **Leading của 1 row đại diện cho 1 ĐỐI TƯỢNG (bài học/khóa/dự án/item) → block `IconTile`, KHÔNG icon SVG trơ cỡ nhỏ (`size-4/5`).** Icon trơ trong row cao (`py-4` + title + subtitle) nhìn **nhỏ/yếu/lạc lõng**, không cân khối chữ. `IconTile size="sm"` (48px tile, icon tự `size-6`) có **trọng lượng** → đọc ra "avatar của 1 thứ".
- **Tận dụng ảnh:** `IconTile` nhận `src` (cover, `object-cover` + tự fallback khi 404) + `icon` (fallback). Item có cover (course `coverImageUrl`…) → truyền `src`; không có → fallback icon trên nền tint. 1 block lo cả 2 (khỏi guard ảnh-vs-icon ở feature). Tone `neutral` cho list trung tính (design restraint), `accent`/semantic chỉ khi nhấn. Truyền icon **bare** (IconTile auto-size + tone).
- **Phân biệt:** icon trơ nhỏ chỉ hợp khi row GỌN 1 dòng (nhãn ngắn, không subtitle — vd `LabeledList` item) hoặc icon là **marker phụ** (check/bullet). Row "item đối tượng" (title+subtitle+meta, card-like) → IconTile. Hỏi: leading này là **avatar của 1 thứ** (→ IconTile) hay **marker phụ** (→ icon trơ)?
- **Skeleton mirror tile:** `Skeleton size-12 rounded-xl shrink-0` + 2 dòng (`h-4 w-1/2` + `h-3 w-1/3`), KHÔNG 1 vạch đơn → không nhảy chiều cao. Ref [[row-leading-icontile-not-bare-small-icon]] + [[elements/icon]] §cỡ + [[item-card-meta-inside-bounded-object]]. Áp đầu: `Bookmarks/BookmarkCard`.

## 5b. GIẢI PHẪU 1 LIST SURFACE duyệt-được = 4 phần dọc (search · count · list · pager) — CHỐT 2026-06-25
- **List duyệt/chọn CÓ THỂ DÀI** (deck/catalog/submissions/results) render đủ 4 phần, theo thứ tự:
  1. **Search** (lọc) — hàng đầu. Input variant theo nền ([[elements/input]] §3: trên background → không variant; trên card → `secondary`).
  2. **Count** — bên PHẢI hàng search: `"Tìm thấy {n} …"` (muted `body-sm`, `shrink-0`), `n` = số ĐÃ LỌC. Hàng search = `flex flex-wrap items-center justify-between gap-3` (input `w-full sm:max-w-sm` trái · count phải). Count cạnh search CÓ NGHĨA (giữ), khác count vanity DƯỚI list ([[whitespace-over-dividers]]).
  3. **List** — item `flex flex-col gap-3`, mỗi item theo bản chất (§1-6).
  4. **Pager** = `PaginatedList` (§2): căn TRÁI thẳng mép item (`justify-start`, cả wrapper `Pagination` LẪN `Pagination.Content`), **tự ẩn `totalPages ≤ 1`**, search đổi list → reset page 1. HeroUI `Pagination.{Link,Previous,Next}` KHÔNG bake hover/cursor → tự thêm `cursor-pointer rounded-medium transition-colors hover:bg-default` + active `data-[active=true]:hover:bg-accent`; `isDisabled` tự bỏ pointer ([[interactive-needs-hover]]).
- **Ngoại lệ:** list NGẮN cố định/ít item (rail "luyện tập bài này", ≤ vài row) → chỉ list (+ label), KHÔNG search/count/pager (thừa).
- Cân nhắc block bọc (`SearchableList`/`PaginatedList`) để feature chỉ truyền data. Ref [[list-surface-anatomy-search-count-list-pagination]].

## 5c. List item-card có thể DÀI → toggle Grid ⇆ Line (persist) — CHỐT 2026-06-21
- **List item-card (deck/catalog) có thể dài → toggle `Grid ⇆ Line`** ở hàng search (phải, cạnh count) = block `SegmentedControl` icon-only (`SquaresFourIcon` grid · `ListIcon` line, `aria-label` a11y, KHÔNG hand-roll 2 nút). **Grid** (mặc định) = `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` giữ mô tả. **Line** = 1 hàng gọn (title + chip + meta + CTA, bỏ mô tả, bỏ bar). Persist `localStorage` (hydrate sau mount, SSR-safe). Chỉ đổi cách render phần "list" của §5b. Ref [[list-grid-line-view-toggle-and-thin-card-meter]].

## 5d. Progress trong list: 1 thanh tại 1 thời điểm (group mở = bar · group gập = count) — CHỐT 2026-06-19
- **Đừng lặp thanh progress full-width cho MỌI item/group trong list** (nhiều thanh = nhiễu). Chỉ progress TỔNG giữ thanh; per-section nhẹ. Trong list group gập/mở (accordion): **group ĐANG MỞ → 1 thanh progress** · **group GẬP → chỉ "n/m" muted** bên phải header (không thanh). → cả màn 1 thanh/section tại 1 lúc + tổng ở top. Cần accordion **controlled** (`expandedKeys`) để biết group nào mở. Ref [[one-progress-bar-at-a-time]].

## 6. STATUS LIST (trạng thái, không click) ≠ `ListBox` (chọn item, tương tác) — CHỐT 2026-07
- **Rail thể hiện TRẠNG THÁI của 1 tiến trình có thứ tự (stepper phase, các bước job, timeline) mà item KHÔNG click-được → render STATUS LIST** (`<ul>` rows thường), KHÔNG `ListBox` (§4). `ListBox` = control **CHỌN item** (`selectionMode` + `onSelectionChange`); ép nó lên nội dung không-tương-tác = sai affordance (đọc "bấm được" trong khi không).
- **Trạng thái do ICON mang màu, KHÔNG tint cả row** ([[accent-system]] §2/§4): done = `CheckCircleIcon text-success` · current = `CircleIcon text-accent` + label `text-accent` · todo = `CircleIcon text-muted` + label `text-muted`. Row nền trong suốt. (Khác "đang chọn" persistent selection của `ListBox` vốn tint `bg-accent/10` — phase-current là STATUS, không phải selection.)
- **a11y:** phase hiện tại `aria-current="step"`; nhãn phase có TEXT (không chỉ màu).
- **Câu hỏi phân biệt:** item này user **click để chọn/đổi view** (→ `ListBox` §4) hay chỉ **hiển thị hệ đang ở đâu, do hệ điều khiển** (→ status list)? Áp đầu: `SystemDesignInterview` rail 5 phase (Yêu cầu→Ước lượng→Tổng thể→Đào sâu→Tradeoff) — do AI/nút chuyển điều khiển, không click-được → status list (icon done/current/todo + timer), KHÔNG `ListBox`.

## Nguyên tắc chọn block
- Item là **đoạn markdown dài** → KHÔNG `ListRow` (truncate) → row tự dựng + `MarkdownContent` ([[description-fields-render-markdown-compact]]).
- Khối "label + list" cần khung card thật → `LabeledCard`; chỉ cần nhẹ (rail) → `LabeledList`.
- List "brief có/không tick" (value props/outputs/prerequisites/outcomes) → `CheckListCard` ([[elements/card]] §3d). List click được nhìn như accordion card → `SurfaceListCard` (§3c). Rail chọn item phẳng no-card, TƯƠNG TÁC → `ListBox` (§4). Rail trạng thái, KHÔNG tương tác → status list (§6).
- Style chỉ ở block; feature ghép data.
