# Pattern — Search + count + list + pager (anatomy TỐI THIỂU của mọi list surface duyệt-được)

> Shell/route: `CourseCatalog`, `JobList` (grounded đầy đủ ở [[catalog-grid]]) — cũng chính là hình dạng bên trong RAIL của `Practice`/`SettingsLayout` khi rail có search. File này là ANATOMY DÙNG CHUNG cho list KHÔNG cần tile/grid — [[catalog-grid]] là bản đầy-đủ (có grid/line toggle).

## Khi nào dùng
- Bất kỳ list CÓ THỂ DÀI cần lọc/duyệt — kể cả khi không có card/tile (row thuần đủ).

## 4 phần dọc (thứ tự cố định)
1. **Search** — input lọc, debounce ~300-350ms trước khi hit backend, LUÔN reset page về 1 khi query đổi.
2. **Count** — nằm PHẢI cùng hàng search, muted `body-sm shrink-0`, `"Tìm thấy {n}…"` (n = số ĐÃ LỌC, không phải tổng).
3. **List** — mỗi item qua `AsyncContent` (`error → loading → empty → content`); skeleton MIRROR layout thật (không "nhảy" khi resolve).
4. **Pager** — trái-align thẳng mép item. Ẩn khi `totalPages ≤ 1` (`JobList`) HOẶC luôn hiện để UI ổn định khi danh sách chắc chắn sẽ lớn dần (`CourseCatalog`) — quyết theo ngữ cảnh, không có mặc định chung.
- **Filter facet** (optional, giữa search-row và list) — mỗi facet 1 control single-select RIÊNG DÒNG (`FlexWrapButtonRadio`), KHÔNG dồn vào chung hàng search.

## Liên quan
[[catalog-grid]] (bản đầy-đủ, có grid⇆line) · [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]] (ma trận rỗng/1/N/overflow) · [[asynccontent-remove-debug-hold]] (AsyncContent priority) · list, input (component canon) · [[page-shell-selection]].
