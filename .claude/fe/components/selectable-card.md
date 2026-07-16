# Element — Selectable card / radio-pill (block `SelectableCardGroup`, `FlexWrapCardRadio`, `FlexWrapButtonRadio`)

> Element doc NGẮN — nội dung ĐẦY ĐỦ (da, gotcha unlayered, `insideCard`) đã sống ở [[card]] §3e/§3f. File này
> chỉ là entry point để tra nhanh theo TÊN BLOCK; đọc [[card]] cho quyết định thật.

## 3 block, chọn theo hình dạng + layout
| Block | Layout | Khi dùng |
|---|---|---|
| `SelectableCardGroup` | `grid` cột cố định (1/2/3) | Chọn 1-trong-N CARD TO (icon + label + description + badge) — [[card]] §3e |
| `FlexWrapCardRadio` | `flex flex-wrap` box card nhỏ | Chọn 1-trong-N NHỎ, GỌN, cần wrap xuống hàng, màu selected cấu hình được — [[card]] §3f |
| `FlexWrapButtonRadio` | `flex flex-wrap` (mỗi option = `<Button>` THẬT) | Giống trên nhưng option cần chiều cao ĐỒNG NHẤT (vd kèm slot `trailing` "+N") — [[card]] §3f |

## Quy tắc cốt lõi (tóm — xem [[card]] §3e/§3f cho đầy đủ)
- Cả 3 build trên HeroUI `RadioGroup`/`Radio` (React Aria) — role radiogroup + arrow-key roving thật, KHÔNG
  hand-roll `<button aria-pressed>` (trừ `FlexWrapButtonRadio` vốn PHẢI dùng `<Button>` thật vì lồng trong
  `Radio` label sẽ vỡ nested-interactive — nó dùng `role="group"` + `aria-pressed` riêng).
- **Selected = nền `bg-<color>/10` + viền `border-<color>`; chữ GIỮ `text-foreground`** (không tô chữ accent —
  tín hiệu chọn do nền+viền gánh, [[accent-system]]).
- **Gotcha unlayered:** `Radio` root (`.radio` HeroUI) bake unlayered → style card-visual ở INNER `<div>` theo
  render-prop (`isSelected`/`isDisabled`/`isFocusVisible`), không style thẳng lên `Radio`/`Radio.Content`.
- `FlexWrapCardRadio`/`FlexWrapButtonRadio` có `color` cấu hình (`accent`/`success`/`danger`/`warning`) +
  prop `insideCard` (khi nằm trong 1 card sẵn → native `primary`/`tertiary`, không surface riêng).

> Block: `blocks/navigation/{SelectableCardGroup,FlexWrapCardRadio,FlexWrapButtonRadio}`

## Liên quan
- [[card]] §3e-§3f (nguồn đầy đủ) · `segmented-control.md` (khi option chỉ là label ngắn 1 dòng, không cần
  card) · [[accent-system]].
