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

## Nguyên tắc chọn block
- Item là **đoạn markdown dài** → KHÔNG `ListRow` (truncate) → row tự dựng + `MarkdownContent` ([[description-fields-render-markdown-compact]]).
- Khối "label + list" cần khung card thật → `LabeledCard`; chỉ cần nhẹ (rail) → `LabeledList`.
- List "brief có/không tick" (value props/outputs/prerequisites/outcomes) → `CheckListCard` ([[elements/card]] §3d). List click được nhìn như accordion card → `SurfaceListCard` (§3c). Rail chọn item phẳng no-card → `ListBox` (§4).
- Style chỉ ở block; feature ghép data.
