# Element — Accordion

> Element doc cho Accordion (HeroUI v3 `@heroui/react`) + accordion render từ markdown directive `::::accordion`/`:::panel`. Chi tiết quyết định ở `drafts/*` cho tới khi `/merge`.

## 1. Accordion §2.1.5 (testcase lesson) = SURFACE-IN-SURFACE — CHỐT 2026-06-25
- Khối "Kiểm thử" §2.1.5 (các **Luồng N**) trong lesson reader render bằng directive `::::accordion` / `:::panel{title}` → mỗi luồng 1 panel gập/mở.
- **Accordion này NẰM TRÊN surface của reading column (lesson body) → là SURFACE-IN-SURFACE → `variant="surface"`** (KHÔNG `default`). Đây là **đính chính** [[lesson-accordion-contrast-and-size]] (bản cũ ép `variant="default" + bg-default` cho lesson reader): thầy chốt §2.1.5 testcase phải đọc như **1 card surface lồng trong surface** (ref [[elements/card]] §4 surface-in-surface).
- **BẮT BUỘC kèm `border border-default`** (surface-in-surface: surface trong PHẢI có viền để phân tách — [[surface-in-surface-inner-has-border]]). HeroUI `.accordion--surface` bake `bg-surface` + radius `min(32px,--radius-3xl)` + separator item (`bg-surface-foreground/6`, `left-[3%] w-[94%]`) + bo góc first/last **NHƯNG KHÔNG có border** → tự thêm utility `border border-default`.
- **Render (đã áp `MarkdownContent/map.tsx` `accordionblock`):**
  ```tsx
  <HeroUI.Accordion variant="surface" className={`${reading ? "my-4" : "my-2"} overflow-hidden border border-default`}>
  ```
  Bỏ `bg-default` + `rounded-2xl` cũ (surface đã bake bg + radius; thêm utility radius bị unlayered đè). Border là utility layered → áp được. `overflow-hidden` để clip góc.
- Panel: `:::panel{title="Luồng N — …"}` → `Accordion.Item` > `Heading > Trigger` (title `text-sm font-semibold` + `Accordion.Indicator`) > `Panel > Body` (`space-y-1.5`). Token render bởi FE đã commit — ref [[accordion-directive-token]].

## 2. Vì sao surface chứ không default (gotcha HeroUI unlayered)
- `.accordion--surface` (HeroUI v3) **unlayered** → bake `bg-surface` + radius. Muốn viền card → thêm `border border-default` (utility `@layer utilities` — **layered** nên áp được trên unlayered, KHÁC việc thêm `bg-*`/`rounded-*` sẽ bị unlayered đè). KHÔNG tự thêm `rounded-*`/`bg-*` cho surface accordion.
- `.accordion--default` KHÔNG bake bg (trong suốt) → trên nền sáng trông "trơn", hoà nền. Dùng default chỉ khi accordion nằm GIỮA cụm code block dark cần khớp màu `bg-default` (context reading/markdown dark) — nhưng §2.1.5 testcase thầy chốt là **surface** (đọc như card), không default.

## 3. Chọn "da" theo NGỮ CẢNH nền (không một-cỡ)
- **Lesson reader / standalone page (nền sáng `bg-background`/`--overlay`), accordion là 1 card có nghĩa** → `variant="surface"` + `border border-default` (đọc ra card thật). Ref [[accordion-card-surface-on-standalone-pages]].
- **Cụm code-block dark cần khớp màu** → `variant="default" + bg-default` (chỉ context đó). Ref [[lesson-accordion-contrast-and-size]].
- Quy tắc rút ra: chọn da để accordion **tương phản với nền nó NẰM TRÊN** + đồng bộ "họ" xung quanh (card → surface; code-block cluster → default).
- **Trang GIẢI challenge (`ChallengeView`, full-bleed standalone) → `variant="surface"`, KHÔNG `bg-default`.** Đây là "standalone page" (đứng trên `bg-background` như card thật), KHÔNG phải cụm markdown/code-block dark → đúng nhánh §3 dòng 1 (không phải dòng 2). Class: `variant="surface"` + `className="overflow-hidden border border-default"` (KHÔNG tự thêm `bg-*`/`rounded-*` — surface đã bake). Áp cho 3 accordion "Yêu cầu · Các bước hướng dẫn · Gợi ý".

## 4. Accordion Card (Card p-0 + Accordion surface) — landing/settings
- Khi section là accordion đặt trong `LabeledCard flushContent` (Card `p-0`) → `Accordion variant="surface"` tràn sát mép (card lo khung, accordion lo nền/separator). Ref [[elements/card]] §3 Accordion Card.

## Liên quan
- [[elements/card]] §4 (surface-in-surface) · [[surface-in-surface-inner-has-border]] (inner có border) · [[accordion-directive-token]] (token `::::accordion`/`:::panel`) · [[accordion-card-surface-on-standalone-pages]] · đính chính [[lesson-accordion-contrast-and-size]].
