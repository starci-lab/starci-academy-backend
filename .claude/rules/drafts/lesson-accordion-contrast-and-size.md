# Draft — Accordion directive trong lesson: thêm border (chống trùng nền) + title text-base (reading) (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (Accordion/MarkdownContent) + cập nhật [RENDER-AUDIT].
- Bối cảnh: khối `::::accordion`/`:::panel` (vd "Luồng 1/2/3" trong §Kiểm thử). Thầy: *"accordion trùng màu với
  nhỏ xíu à"*.
- Docs HeroUI v3 (đã đọc): Accordion `variant` chỉ `default|surface`; `.accordion--surface` = `bg-surface`
  (dark mode ≈ `bg-background` → **trùng màu**); `.accordion__trigger` base = **`text-sm`** (title nhỏ).

## Luật (STRICT)
- **`variant="surface"` của HeroUI Accordion trong dark mode TRÙNG nền** (`bg-surface` ≈ `bg`). Border-default thôi
  **KHÔNG đủ** (thầy: *"vẫn vậy này, để màu khác đi"*). → dùng **`variant="default"` + `bg-default`** (đúng màu hộp
  **code block** — đã hiển thị rõ trong reader) + `overflow-hidden rounded-2xl border border-default`. Khối nổi hẳn
  như 1 card riêng.
- **Vì sao default chứ không surface + override bg:** style component HeroUI v3 có thể **unlayered** → `.accordion--surface{bg-surface}`
  **đè** utility `bg-default` (utility nằm trong `@layer utilities`, thua unlayered) ⇒ override bg trên surface KHÔNG
  ăn. Chọn `variant="default"` (không bake bg) rồi tự cho `bg-default` → không đánh nhau specificity, KHÔNG cần `!`.
- **Title accordion trong READING = `text-base`** (16px), không `text-sm` (14px). `.accordion__trigger` mặc định
  `text-sm` → ở body 16px trông nhỏ; override span title `reading ? text-base : text-sm`. Body panel theo renderer
  markdown (đã base ở reading).
- **Nhịp:** accordion reading dùng `my-4` (đồng nhịp block khác), compact `my-2`.
- Nguyên tắc rút ra: **đọc docs component thật** (`heroui-react` skill: `get_component_docs`/`get_styles`) trước khi
  chỉnh — variant nào tồn tại, class base ra sao — KHÔNG đoán; rồi vá tương phản/size bằng token app.
