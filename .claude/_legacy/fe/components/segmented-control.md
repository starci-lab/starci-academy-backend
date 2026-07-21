# Element — Segmented Control (block `SegmentedControl`)

> Element doc cho pill switch gọn. Chi tiết "khi nào tabs vs segmented vs selectable-card" đã chốt ở
> [[tabs]] §0 — đây là API/da của RIÊNG component.

## Khi nào dùng
- Chọn ĐÚNG 1 trong vài (2-~5) lựa chọn loại-trừ, KHÔNG đổi panel/nội dung lớn phía dưới — 1 SETTING gọn tại
  chỗ (currency VND/USD, mức độ, view Grid⇆Line). Đổi PANEL/section lớn → dùng `TabsCard` (underline, xem
  [[tabs]]), KHÔNG `SegmentedControl`.
- Chọn 1-trong-N mà mỗi option GIÀU (icon + description + badge, cần grid card to) → `SelectableCardGroup`
  (xem `selectable-card.md`), không phải `SegmentedControl` (chỉ hợp label ngắn 1 dòng).
- **Gotcha thật (2026-07-09):** Flashcards' mode switch "Học thẻ/Hỏi nhanh" từng dùng `SegmentedControl` dù nó
  đổi CẢ trang (route riêng `/review` vs `/quiz`) — vi phạm rule trên. Trước khi chọn `SegmentedControl`, tự
  hỏi: bấm xong có văng sang route/component khác hẳn không? Có → đó là `TabsCard` (xem [[tabs]] §0b), dù chỉ
  2 lựa chọn cũng vậy — số lượng lựa chọn không quyết định, THỨ nó điều khiển (setting tại chỗ vs đổi panel)
  mới quyết định.

## Quy tắc
- Da: track `bg-default rounded-2xl p-1`, segment ACTIVE nổi lên `bg-surface` (không phải accent) +
  `font-medium`; segment thường `text-muted hover:text-foreground`. Đây là 1 trong 2 kiểu tabs theo vai
  ([[tabs]] §0): SETTING gọn = block/pill, KHÔNG accent-underline như nav tab.
- Equal-width (`flex-1` mỗi segment) — track co giãn theo số lượng, không hug-content.
- `role="group"` + mỗi segment `aria-pressed` (button thường, KHÔNG HeroUI `Tabs`/`RadioGroup`) — component tự
  quản single-select bằng so sánh `value === item.value`, không phải React Aria radio.
- `isDisabled` per-item → `opacity-50 cursor-not-allowed`, giữ trong track (không ẩn) để user biết option tồn
  tại nhưng chưa khả dụng.
- Generic `<T extends string>` — value là union string của caller, không ép enum cụ thể trong block.

> Block: `blocks/navigation/SegmentedControl`

## Liên quan
- [[tabs]] §0 (khi nào tabs vs segmented) · `selectable-card.md` (khi option giàu hơn 1 dòng label) ·
  [[card]] §3f (biến thể "insideCard" của họ radio-pill anh em, `FlexWrapButtonRadio` — cùng vai chọn-1 nhưng
  wrap nhiều hàng, khác `SegmentedControl` chỉ 1 hàng cố định).
