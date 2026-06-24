# Draft — Màu/variant Input theo NỀN nó nằm trên + result-count cân bằng phải thanh search (2026-06-25)

- File/§ đích khi `/merge`: `elements/input.md` (MỚI) + `starci-ui.rules` (form/TextField) + liên quan [[accordion-card-surface-on-standalone-pages]] (chọn da theo nền) + [[whitespace-over-dividers]] (count có nghĩa vs vanity).
- Bối cảnh: trang Ôn tập (`/learn/flashcards`) khối "Bộ thẻ theo chủ đề" (`FlashcardDeckList`). (1) Search input `variant="secondary"` (fill `--default` xám) đặt trên `bg-background` (xám nhạt) → **blend, mất ranh giới ô input**. (2) Nửa phải hàng search trống hoác → mất cân bằng. Thầy chốt: *"ghi rules màu input: nằm trên background → KHÔNG có variant; nằm trên card hoặc bg-surface → về secondary"* + *"bên phải thanh search có số lượng để cân bằng"*.

## Luật 1 (STRICT) — variant Input chọn để TƯƠNG PHẢN với nền nó nằm trên
- **Input đặt thẳng trên PAGE BACKGROUND (`bg-background`) → KHÔNG truyền `variant` (default = `primary`).** HeroUI Input default `primary` = base `.input` `bg-field` (trắng/surface, `--field-background` oklch 100% light) + `shadow-field` nhẹ + border `--field-border` → ô input **nổi rõ** trên nền background xám. (Input default variant = `primary`, đọc `input.styles.ts` `defaultVariants.variant: "primary"` → bỏ prop là đủ, không cần ghi `variant="primary"`.)
- **Input đặt trên CARD / `bg-surface` (surface trắng) → `variant="secondary"`.** `.input--secondary` = `bg: var(--default)` (xám nhạt) + `shadow-none` → trên surface TRẮNG, fill xám của secondary **nổi/phân biệt** với mặt card. Nếu để default (`bg-field` trắng) trên card trắng → input **blend vào card**, mất ranh giới.
- **Nguyên tắc:** variant Input phải **tương phản với NỀN nó NẰM TRÊN**, không một-cỡ-cho-tất-cả (cùng họ với chọn da accordion/card theo nền — [[accordion-card-surface-on-standalone-pages]]):
  | Input nằm trên | variant | vì sao |
  |---|---|---|
  | **background** (xám nhạt) | **không variant** (`primary`, `bg-field` trắng) | trắng nổi trên nền xám |
  | **card / bg-surface** (trắng) | **`secondary`** (`bg-default` xám) | xám nổi trên surface trắng |
- **Hệ quả quét repo:** repo đang `variant="secondary"` ~39 chỗ TextField (mặc định cũ, áp bừa). KHI đụng 1 input → hỏi "nó nằm trên nền gì?": background → bỏ variant; card/surface → giữ secondary. (Chưa quét loạt; đổi khi chạm.)

## Luật 2 (STRICT) — thanh search lọc list: result-count bên PHẢI để cân bằng
- **Thanh search lọc 1 list → hàng `flex flex-wrap items-center justify-between gap-3`: input TRÁI + result-count PHẢI.** Nửa phải hàng search hay trống → lấp bằng **count kết quả** (`"Tìm thấy {n} bộ thẻ"`, muted `body-sm`, `shrink-0`) → cân bằng layout + cho biết "lọc ra bao nhiêu". Count = **số ĐÃ LỌC** (`filteredDecks.length`), gõ search thì phản ánh số khớp. Input `w-full sm:max-w-sm` (mobile full, desktop cap), `flex-wrap` để count rớt dưới ở hẹp.
- **Count này CÓ NGHĨA → GIỮ** (số kết quả của 1 bộ lọc, là nhãn của hành động search), KHÁC count vanity "N item" đặt DƯỚI 1 list đã liệt kê item (cái đó cắt — [[whitespace-over-dividers]]). Phân biệt: count cạnh search = "lọc ra mấy cái"; count dưới list = lặp lại thứ mắt đã đếm.

## ĐÃ ÁP DỤNG 2026-06-25 (FE)
- `FlashcardDeckList`: search bọc `<div flex flex-wrap items-center justify-between gap-3>` + `<Typography body-sm muted shrink-0>{flashcard.deck.found}</Typography>` (count phải); `TextField variant="secondary"` → **bỏ variant** (search trên background). i18n `flashcard.deck.found` = "Tìm thấy {count} bộ thẻ" / "{count} decks found". tsc sạch.
- **Chưa đụng:** list decks render TẤT CẢ (no pagination) — nếu cần pager thì `PaginatedList` (căn trái — [[list-pager-left-align-and-hover]]); count phải search vẫn là tổng đã-lọc. Hỏi thầy.
