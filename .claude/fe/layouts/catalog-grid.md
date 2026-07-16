# Pattern — Catalog grid/line (search + count + grid⇆line toggle + card list + pager)

> Shell/route: `CourseCatalog` (`src/components/features/course/CourseCatalog/index.tsx`, route `/courses`) — grid⇆line toggle, persist. `JobList` (`src/components/features/careers/Jobs/JobList/index.tsx`, route `/jobs`) — row-ONLY (1 posting có quá nhiều field cho tile — title/company/location/mode/salary — nên luôn render row, không có toggle).

## Khi nào dùng
- Duyệt N item CÙNG LOẠI, đủ đơn giản để tile hoá (course) hoặc đủ giàu field để phải luôn-là-row (job posting). Đây là bản ĐẦY-ĐỦ (có tile) của [[search-filter-list-surface]] — dùng file đó khi item không cần grid.

## Region map
1. **`PageHeader`** — breadcrumb + title, + `actions` khi có CTA phụ (vd "Đăng tin" ở `JobList`).
2. **Search row** — input trái (`w-full sm:max-w-sm`) + phải: result-count muted + (optional) toggle grid⇆line (`SegmentedControl` icon-only, persist `localStorage`).
3. **Filter row** (optional, khi có facet) — mỗi facet 1 `FlexWrapButtonRadio` single-select, XUỐNG DÒNG riêng dưới search row (không dồn chung 1 hàng).
4. **List** qua `AsyncContent` — skeleton MIRROR đúng view đang chọn (grid skeleton ≠ line skeleton, tránh nhảy layout khi resolve); grid = `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, line/row-only = `SurfaceListCard` + rows.
5. **Pager** — `Pagination` trái-align thẳng mép item; HeroUI không bake hover — tự thêm `hover:bg-default`.
- **Empty 2 kiểu** (`JobList`): platform-empty (0 item toàn hệ thống, KHÔNG filter) → funnel 2 chiều ("chưa ai đăng — bạn đăng thử?"); filtered-empty (có filter, 0 khớp) → CTA "xoá bộ lọc". Đừng gộp chung 1 empty-state cho cả 2 nguyên nhân.

## Liên quan
[[search-filter-list-surface]] (anatomy chung, khi KHÔNG cần grid/tile) · [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]] (ma trận rỗng/1/N/overflow) · card (component canon — grid/line CourseCard, radius đồng bộ 2 view) · [[page-shell-selection]].
