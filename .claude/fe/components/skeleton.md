# Element — Skeleton (block `Skeleton` compound)

> Element doc cho placeholder loading. Bổ trợ [[loading-feedback-three-tiers-splash-toploader-skeleton]]
> (skeleton = tầng 3/3 của loading — tầng 1 splash cold-load, tầng 2 top-bar nav SPA) và
> [[asynccontent-remove-debug-hold]] (KHÔNG có 3s-hold debug — skeleton chỉ hiện đúng thời gian load thật).

## Khi nào dùng
- Vùng data-backed (region fetch trong trang) đang load lần đầu (`isLoading && !data`) → render 1 CÂY
  `Skeleton.*` MIRROR đúng layout thật, đặt vào prop `skeleton` của `AsyncContent`. KHÔNG tự vẽ `<div
  className="h-4 bg-default animate-pulse">` tay — mỗi `Skeleton.<X>` đã sized khớp box thật của component X.

## Quy tắc
- **1 placeholder / 1 HeroUI component thật, sized để KHÔNG NHẢY LAYOUT khi resolve** — vd
  `Skeleton.Typography type="body-sm"` cao đúng glyph-height của `Typography type="body-sm"` thật (căn giữa
  trong line-box, không lệch khi swap sang text thật). Danh sách hiện có: `Typography`, `Paragraph`, `Input`,
  `TextArea`, `Select`, `Button`, `Switch`, `Checkbox`, `RadioGroup`, `Slider`, `Avatar`, `Chip`, `Badge`,
  `Kbd`, `ProgressBar`, `SegmentBar`, `Meter`, `Card`, `Accordion`, `Disclosure`, `Tabs`, `Breadcrumbs`,
  `Pagination`, `Table`, `ListBox`, `ListRow`, `Menu`, `UserCell`, `Metric`.
- **`<Skeleton className="...">` (bare, không subcomponent) = raw shimmer bar** — dùng khi KHÔNG có
  `Skeleton.<X>` sẵn cho khối cần giả (vd `IconTile` tile: `Skeleton size-12 rounded-xl shrink-0`, xem
  [[list]] §5). Size bằng className tự do.
- **Xây skeleton bằng cách MIRROR CÂY layout thật** — giữ structural node (Separator, spacer div, wrapper,
  gap) NGUYÊN VẸN, chỉ swap content-node → `Skeleton.<X>` tương ứng. KHÔNG tự nghĩ layout khác cho skeleton.
- **KHÔNG có prop `debug`/3s-hold** ([[asynccontent-remove-debug-hold]] — đã bị gỡ hẳn khỏi `AsyncContent`).
  Soi loading bằng Network throttle (DevTools) hoặc `await sleep` tạm ở fetcher, KHÔNG hold nhân tạo.
- Thiếu 1 `Skeleton.<X>` cho component mới cần mirror → thêm 1 file mới trong `blocks/skeleton/Skeleton/`
  (đăng ký vào `Object.assign` ở `index.tsx`) — KHÔNG lách bằng raw bar khi component đó lặp lại nhiều nơi.

> Block: `blocks/skeleton/Skeleton` (compound, 28 subcomponent hiện có)

## Liên quan
- [[loading-feedback-three-tiers-splash-toploader-skeleton]] (skeleton = tầng 3, phân biệt splash/top-bar) ·
  [[asynccontent-remove-debug-hold]] (không 3s-hold; priority error→loading→empty→content) ·
  [[list]] §5 (skeleton mirror IconTile row) · [[card]] (skeleton mirror card).
