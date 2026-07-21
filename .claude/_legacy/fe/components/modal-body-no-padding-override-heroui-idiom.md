# Concept — Modal (HeroUI v3): KHÔNG override `p-*` trên `Modal.Body`; dialog `p-4` lo gutter, body `p-[3px]/-m-[3px]` lo focus-ring

> Heuristic engineering (họ `concepts/*`, FE — chưa có `elements/modal.md`). Thầy chốt 2026-06-24 (soi DevTools `AuthenticationModal` thấy `p-3` drift). Bổ trợ [[surface-in-surface-inner-has-border]] · [[modal-header-tabs-indicator]] (Tabs.Indicator) · [[elements/header]] §5 (modal header).

## HeroUI v3 fact (đọc `@heroui/styles/.../modal.css`)
- `.modal__dialog` = `@apply p-6` mặc định → **gutter thật** (header/body/footer sống trong đây). StarCi override về **`p-4`** (globals.css `.modal__dialog { padding: 1rem !important; }` — pattern override trần `!important` như `.switch__control`). Thầy chốt 2026-06-24: p-6 rộng → **gutter chuẩn = p-4**.
- `.modal__header` = `flex flex-col gap-3` (`mb-0`); `.modal__footer` = `flex flex-row justify-end gap-2` (`mt-0`) → **không padding riêng**.
- `.modal__body` = `-m-[3px] my-0 overflow-visible p-[3px]` → **idiom focus-ring breathing**: 3px padding + -3px margin ngang triệt tiêu (net indent = 0, body thẳng mép header/footer), 3px chỉ để ring/box-shadow input không bị `overflow` cắt.

## Luật (STRICT)
- **KHÔNG set `p-*` lên `Modal.Body`.** Để HeroUI lo: dialog `p-4` (gutter) + body `p-[3px]/-m-[3px]` (breathing). Set `p-3/p-4` lên body = **double padding** (gutter + padding body) + **lệch mép** (body indent > gutter vì `-m-[3px]` không bị đụng) → body thụt vào hơn tiêu đề & nút. `Modal` là block → sở hữu padding; từng modal KHÔNG tự chế.
- **`gap` nội dung body = wrapper TRONG body** (`<div flex flex-col gap-X>`), KHÔNG nhét `gap-*` lên `Modal.Body` (body không luôn là flex).
- **Full-bleed = NGOẠI LỆ CÓ CHỦ ĐÍCH có TÊN, không phải `p-0/p-2` rải bừa.** Search palette (cmd-k input tràn mép), media preview (video/CV/ảnh) sát mép → pattern bleed đặt tên + ghi lý do; KHÔNG để `p-0`/`p-2` lẻ trông như drift.
- **Nguyên tắc rút ra:** component-lib đã bake mô hình padding (gutter ở dialog, breathing ở body) → ĐỪNG đè utility lẻ lên slot con — đọc style bake (`get_styles`/css) trước, để nó tự lo; chỉ opt-out khi có chủ đích đặt tên.

## Liên quan
- [[elements/header]] §5 (modal header = `Typography body semibold` + `pr-8`, không H3) · [[modal-header-tabs-indicator]] (Tabs cần `Tabs.Indicator`) · [[surface-in-surface-inner-has-border]] (khối bounded trong modal = border) · [[when-drawer]] (summary phẳng trong modal — [[when-drawer]]).
