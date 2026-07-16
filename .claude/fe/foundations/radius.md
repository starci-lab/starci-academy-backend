# Foundation — Radius

> Thang bo góc. 1 token GỐC, mọi bậc khác NHÂN theo nó — không phải giá trị rời từng đặt tay.

- **`--radius: 0.5rem` (8px) là NGUỒN DUY NHẤT.** `@heroui/styles` derive cả thang từ nó: `radius-xs` = 0.25×
  (2px) · `xl` = 1.5× (12px) · `2xl` = 2× (16px) · `3xl` = 3× (24px) · `4xl` = 4× (32px). (`sm/md/lg` giữ mặc
  định Tailwind, KHÔNG nhân theo `--radius`.)
- **`--field-radius: 0.75rem`** = fixed = đúng `radius-xl` (1.5×) — token RIÊNG cho input/select/button field
  (utility `rounded-field`), không phải `rounded-xl` trùng số tình cờ.
- **Concentric — bo TRONG nhỏ hơn bo NGOÀI đúng 1 nấc, đã dùng khắp app:** card ngoài `rounded-3xl` → media/
  block lồng trong `rounded-2xl` → input/field `rounded-xl` → chip/avatar/switch pill `rounded-full`. Đừng
  nhảy cách nấc hay chọn radius tuỳ ý cho 1 block mới — bậc theo ĐỘ LỒNG. Xem [[card]] (Gotcha render, media
  inner radius) + [[input]] §2.
- **CẤM thêm `rounded-*` qua className lên component HeroUI đã bake radius UNLAYERED** (`.card`,
  `.accordion--surface`, `.modal__dialog`…) — utility ở `@layer utilities` thua CSS bake, className câm lặng
  không đổi gì (không lỗi, chỉ vô dụng). Xem [[card]] Gotcha render.

> Nguồn: `globals.css` `--radius`/`--field-radius` + `@heroui/styles` heroui.min.css (`--radius-xs/xl/2xl/3xl/4xl`
> derive từ `--radius`; `--field-radius: calc(var(--radius) * 1.5)`).

## Liên quan
- [[card]] · [[input]] · [[gap]] (thang spacing song song, cùng logic "1 gốc, nhân bậc").
