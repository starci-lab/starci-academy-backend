# Draft — Mọi Accordion (kể cả feature tự dựng, không qua markdown) dùng CHUNG màu `bg-default` (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (Accordion) + **mở rộng** [[lesson-accordion-contrast-and-size]].
- Bối cảnh: trang challenge — khối "Yêu cầu" + "Các bước hướng dẫn" + "Gợi ý" dựng bằng HeroUI Accordion TRỰC TIẾP
  trong feature (không qua MarkdownContent). Lúc đầu để variant trống → **không có nền**, nhạt nhoà, KHÁC accordion
  "Các bước" của trang task (render qua markdown directive, có nền `bg-default`). Thầy: *"render accordion như hình
  task, dùng đúng màu của accordion"*.

## Luật (STRICT)
- **MỌI Accordion trong app — feature tự dựng hay render qua markdown — dùng CHUNG đúng 1 da:**
  `variant="default"` + `overflow-hidden rounded-2xl border border-default bg-default`. Đây là da canonical của
  `MarkdownContent` accordion directive (`map.tsx` `accordionblock`) — cùng `bg-default` với code block → nổi rõ
  trên nền trang (dark mode). KHÔNG để variant trống (nhạt) hay `variant="surface"` (trùng nền dark). Mở rộng
  [[lesson-accordion-contrast-and-size]] ra cả accordion **dựng tay trong feature**, không chỉ markdown.
- **Trigger title = `text-base font-semibold`** (reading), `text-start`, layout `flex w-full items-center
  justify-between gap-3` + `<Accordion.Indicator/>` bên phải. Meta của item (vd chip điểm "40 điểm") gom **bên phải
  cạnh Indicator** (`flex shrink-0 items-center gap-2`), không nhét trái.
- **Default mở/gập theo vai nội dung:** nội dung LÕI cần đọc ngay (vd "Yêu cầu" — what to build) → `defaultExpandedKeys`
  mở sẵn; nội dung HƯỚNG DẪN/phụ (các bước, gợi ý) → gập sẵn (mở từng cái khi cần). Cùng 1 da, khác default state.
- **Nguyên tắc rút ra:** khi 1 surface (markdown) đã có "da" thầy duyệt cho 1 element, feature dựng element đó bằng
  tay PHẢI copy đúng da (class) — soi component nguồn (vd `MarkdownContent/map.tsx`) lấy class thật, KHÔNG tự chế
  variant khác → tránh 2 phong cách cho cùng 1 element.

## ĐÃ ÁP DỤNG 2026-06-21
- `ChallengeView`: "Yêu cầu" (mở sẵn) · "Các bước hướng dẫn" (gập) · "Gợi ý" (gập) → đều `variant="default"` +
  `overflow-hidden rounded-2xl border border-default bg-default`, title `text-base font-semibold`, chip điểm cạnh
  Indicator. Copy đúng class từ `MarkdownContent/map.tsx` `accordionblock`.
