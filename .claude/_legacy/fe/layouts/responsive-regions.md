# Layout — Vùng CO GIÃN theo màn (responsive / adaptive regions)

> Vùng đổi cách xếp theo viewport. Phân biệt ([supercharge.design](https://supercharge.design/articles/adaptive-layout-vs-responsive-layout)):
> **responsive** = fluid trong 1 shape (max-width, flex-wrap); **adaptive** = ĐỔI shape/shell theo breakpoint (rail→chips,
> 2-pane→stack). StarCi dùng cả hai + adaptive-by-task ([[surface-job-drives-layout]]).

## Luật adaptive (STRICT)
- **Rail dọc chỉ `lg+`.** Màn hẹp → **fold thành hàng CHIP cuộn ngang** trên đầu pane, cùng URL-state (`hidden lg:flex` cho rail · `flex lg:hidden overflow-x-auto` cho chip-row). Grounded: `LearnMobileTabBar`/`LearnMobileBar`, `useSmViewpoint`.
- **2-pane → XẾP DỌC** trên mobile (`flex-col lg:grid`): context trên, workspace/detail = tab-strip/collapsible dưới ([[full-bleed-work-surface]]).
- **Reposition/reflow** (Material/Fluent): card dọc→ngang, FAB→nav-rail khi rộng thêm — dùng khi có chỗ, không nhồi.
- **Overlay swap by modality:** desktop = Drawer/Modal cạnh · mobile = bottom-sheet (`placement="bottom"` + `useSmViewpoint`) — [[when-drawer]].

## Responsive (fluid, không đổi shape)
- Container `max-w-*` + `mx-auto`; flex-wrap cho chip/nút; `min-w-0` trên chuỗi flex để co được.
- **Khối RỘNG hơn cột → CUỘN (`overflow-x-auto`), KHÔNG phá layout** (mermaid/table/code) — `foundations/wide-content-scrolls-not-blocks-ui`.
- Chống jitter scrollbar → `foundations/scrollbar-gutter`.

## Gotcha
- Rail dọc cạnh-trái KHÔNG hợp mobile → luôn có nhánh chip-row, đừng để rail `hidden` mà không thay bằng gì (mất nav).
- Đổi shape theo breakpoint phải **giữ 1 nguồn state** (URL), không 2 state cho desktop/mobile.

## Liên quan
[[region-model]] · [[surface-job-drives-layout]] · [[full-bleed-work-surface]] · [[when-drawer]] · `foundations/breakpoints` · `foundations/wide-content-scrolls-not-blocks-ui` · `foundations/scrollbar-gutter` · `components/sidebar` (mobile fold).
