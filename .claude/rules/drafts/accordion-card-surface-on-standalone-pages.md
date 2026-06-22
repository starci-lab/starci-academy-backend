# Draft — Accordion-card trên trang đứng (settings/profile…) dùng `variant="surface"` (bg-surface = màu card), KHÔNG bg-default (2026-06-23)

- File/§ đích khi `/merge`: `starci-ui.rules` (Accordion) + **đính chính** [[accordion-default-fill-everywhere]] +
  [[lesson-accordion-contrast-and-size]].
- Bối cảnh: trang **Lịch sử học** (`/profile/settings/learning`), 2 tab Contents/Personal Project render
  accordion-card. Ban đầu dùng `variant="default" + bg-default` (theo luật cũ) → trên nền `bg-background` sáng của
  trang settings, item accordion **trơn, hoà vào nền**, không ra "card". Thầy: *"accordion màu card được không, màu
  surface"*.

## Luật (STRICT)
- **"Da" của accordion-card PHỤ THUỘC NGỮ CẢNH nền, không một-cỡ-cho-tất-cả:**
  - **Trang ĐỨNG / settings / profile** (accordion là 1 card đặt thẳng trên `bg-background`, KHÔNG nằm giữa code
    block) → **`variant="surface"`** (HeroUI bake `bg-surface` = đúng màu card + `rounded-3xl` + separator item +
    bo góc first/last) → đọc như 1 card thật. Đây là **đính chính** [[accordion-default-fill-everywhere]] (luật cũ
    ép MỌI accordion `bg-default`): chỉ đúng cho **reading/lesson** context.
  - **Lesson reader / markdown** (accordion nằm cùng cụm code block, dark) → vẫn `variant="default" + bg-default`
    (khớp màu code block, nổi trên nền dark) như [[lesson-accordion-contrast-and-size]]. `surface` ở đây trùng nền dark.
  - Quy tắc rút ra: chọn da để accordion **tương phản với nền nó NẰM TRÊN** + đồng bộ với "họ" xung quanh (card →
    surface; code-block cluster → default). KHÔNG mặc định 1 màu.
- **HeroUI fact (đọc `get_styles Accordion`):** `.accordion--surface { bg-surface; border-radius: min(32px,
  --radius-3xl) }` + tự lo separator (`bg-surface-foreground/6`, `left-[3%] w-[94%]`) + bo góc first/last trigger.
  **KHÔNG có border.** → muốn viền card thì thêm utility **`border border-default`** (layered → ÁP ĐƯỢC, khác
  `<Card>` unlayered đè utility). KHÔNG tự thêm `rounded-*`/`bg-*` (surface đã bake; thêm utility radius bị
  unlayered đè). `.accordion--default` KHÔNG bake bg (trong suốt) → đó là lý do default trông "trơn" trên nền sáng.
- **Skeleton mirror đúng da:** surface accordion → skeleton wrapper `rounded-3xl border border-default bg-surface`
  (không phải bg-default), để loading khớp loaded.

## ĐÃ ÁP DỤNG 2026-06-23
- `CourseOutline` (tab Nội dung) + `CourseMilestoneOutline` (tab Dự án cá nhân): `Accordion variant="surface"` +
  `className="overflow-hidden border border-default"`; skeleton frame `rounded-3xl border border-default bg-surface`.
  Title trigger `text-base font-semibold`, meta cạnh `Accordion.Indicator` (giữ theo [[accordion-default-fill-everywhere]]).
  tsc/lint sạch.
