# Draft — List card có-thể-dài: toggle Grid ⇆ Line (persisted) + meter trong card = THIN hairline div bar, KHÔNG ProgressBar béo (2026-06-21)

- File/§ đích khi `/merge`: `elements/list.md` (view toggle) + `concepts/` (meter) + liên quan [[list-surface-anatomy-search-count-list-pagination]] · [[progress-block-growing-quantity-headline-not-vanity-strip]] · [[weekly-goal-meter-defaults-and-heat-token-readd]] (div bar tin cậy) · [[single-select-among-options-use-tabs]] (SegmentedControl).
- Bối cảnh: deck list "Học thẻ" (`FlashcardDeckList`) sau khi bỏ rail → vào pane. Card full-width xếp dọc (15 deck) = rất dài; meter "Đã thuộc 0/10" render bằng `ProgressMeter` (HeroUI `ProgressBar size=sm`) → ở 0% thành **thanh xám béo** (như pill rỗng). Thầy: *"dùng separator size 1 được không, thêm grid hoặc line view"*.

## Luật 1 (STRICT) — List card duyệt-được CÓ THỂ DÀI → toggle Grid ⇆ Line, persist
- **List các item-card (deck/catalog/bộ sưu tập) có thể dài → cấp toggle `Grid ⇆ Line`** ở hàng search (bên phải, cạnh result-count). **Grid** (mặc định) = card rộng-rãi giữ mô tả, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` → list ngắn lại ~½, vẫn đọc được chủ đề. **Line** = 1 item = 1 hàng gọn (title + chip + meta + CTA, bỏ mô tả) → đặc nhất, quét nhanh.
- **Toggle = block `SegmentedControl`** (`single-select` setting — [[single-select-among-options-use-tabs]]). `label` nhận **ReactNode** → icon-only OK (`SquaresFourIcon` grid · `ListIcon` line) + `aria-label` trên icon cho a11y. KHÔNG hand-roll 2 nút.
- **Persist `localStorage`** (vd `starci.flashcard.deckView`), hydrate sau mount (SSR-safe: start "grid" → đọc storage trong `useEffect`). Như rail-width persist.
- Phân biệt: đây là LAYOUT của 1 list (grid vs line). Vẫn theo giải phẫu list (search + count + list + pager — [[list-surface-anatomy-search-count-list-pagination]]); toggle chỉ đổi cách render phần "list".

## Luật 2 (STRICT) — Meter TRONG card (mastery at-a-glance) = THIN hairline div bar, KHÔNG ProgressBar/ProgressMeter béo
- **Thanh tiến độ NHỎ trong 1 card (mastery/hoàn-thành của 1 item) = div hairline mảnh** (`h-1 w-full rounded-full bg-default` track + `<div h-full rounded-full bg-accent style=width:%>` fill) + label `body-xs muted` "Đã thuộc m/total" phía trên. **KHÔNG dùng block `ProgressMeter`/HeroUI `ProgressBar size="sm"`** — ở 0% nó render thành **pill xám béo** (nặng, vô nghĩa). Div bar mảnh hơn + tin cậy hơn (đúng [[weekly-goal-meter-defaults-and-heat-token-readd]]: "bar render reliable = div thường bg-default track + bg-accent fill width:%").
- **Line view**: bỏ luôn bar, chỉ giữ text "m/total" (`body-xs muted shrink-0`) — hàng gọn không cần bar.
- `ProgressMeter` (block) vẫn OK cho meter LỚN headline (vd "Hoàn thành khoá" full-width); chỉ meter NHỎ trong item-card mới dùng hairline div.

## ĐÃ ÁP DỤNG 2026-06-21
- `FlashcardDeckList`: thêm `view` state (grid/line) + persist `starci.flashcard.deckView` + `SegmentedControl` icon-only (SquaresFour/List) ở search row. Grid = `grid sm:2 lg:3` card (giữ mô tả + hairline bar). Line = hàng gọn (title flex-1 truncate + chip + m/total + Học). Bỏ `ProgressMeter` → hairline `h-1` div bar. `DECKS_PER_PAGE` 8→9 (chia hết lưới 3). i18n `flashcard.deck.{viewAria,viewGrid,viewLine}` (vi+en). tsc/eslint/JSON sạch.
- **Chưa đụng:** `FlashcardStatsStrip` ("Tiến bộ" SegmentBar) — thầy có thể muốn mảnh đồng bộ; chờ xác nhận.
