# Element — Metric (static number display: `MetricCard`, `StatPair`, `Legend`)

> Element doc cho hiển thị SỐ TĨNH (không progress-toward-goal — cái đó là `meter.md`). 3 block khác KHUNG,
> chọn theo NGỮ CẢNH đặt (card độc lập vs strip cạnh nhau vs chú giải màu).

## `MetricCard` (`blocks/stats/MetricCard`) — 1 số, CÓ khung riêng
- Dựng trên `SectionCard` (border+bg+radius riêng) → dùng khi metric ĐỨNG MỘT MÌNH trong grid/sidebar (KPI
  tile, dashboard). `{ icon?, value, label, hint? }` — value `h4 semibold`, label+hint `body-xs muted`.
- **KHÔNG bọc thêm `<Card>` ngoài** ([[card]] — không card-in-card); `SectionCard` đã là frame.
- KHÔNG dùng cho stat strip cạnh nhau (nhiều số trong 1 hàng không mỗi số 1 khung riêng) — đó là `StatPair`.

## `StatPair` (`blocks/stats/StatPair`) — 1 số, FRAMELESS, cho ribbon
- KHÔNG khung/nền/padding riêng — dùng làm 1 trong N cặp trị số cạnh nhau trong 1 `StatRibbon`/hàng do PARENT
  cấp surface + divider. `{ value, label, align?: "start"|"center", size?: "md"|"lg" }` (size `lg` = `h2`
  cho 1 con số hero nổi bật; `md` = `h4` mặc định cho strip thường).
- Đứng riêng KHÔNG có parent cấp frame → trông trần/vô hình — luôn đặt trong 1 hàng có surface.
- **Đính chính (2026-07-09) — "parent cấp surface" KHÔNG có nghĩa `StatPair` phải trần 100%:** lượt đầu sửa card-in-card (`MetricCard`→`StatPair` khi đã có `LabeledCard` cha) bỏ khung SẠCH luôn → mỗi cell trần trụi, KHÔNG còn ranh giới nào giữa 3 số → thầy bắt lại: *"đỏ render dạng surface in surface, có border"*. Đúng bài (`[[card]]` §4): mỗi `StatPair` vẫn nên nằm trong 1 `<div className="rounded-xl border border-default p-3">` — BORDER + bg TRONG SUỐT (kế thừa nền cha), KHÔNG fill lần 2 (`bg-surface`) và KHÔNG bare-trần-không-viền. "Parent cấp surface" nghĩa là cell không tự fill riêng, không phải cell không có ranh giới nào.

## `Legend` (`blocks/stats/Legend`) — chú giải màu độc lập
- Dải `dot + label` giải thích màu của MỘT/NHIỀU bar cùng thang (vd nhiều `SegmentBar` chia sẻ 1 thang màu độ
  khó) — tách legend ra 1 chỗ thay vì lặp legend dưới từng bar. `{ items: {key,label,color}[] }`.
- Cùng render y hệt legend built-in của `SegmentBar` (xem `meter.md`) — dùng `Legend` khi cần TÁCH RIÊNG khỏi
  bar (nhiều bar chung 1 legend); dùng `hideLegend` trên `SegmentBar` khi mỗi bar tự đủ legend.

## Chọn block nào
- Số ĐỨNG MỘT MÌNH cần khung → `MetricCard`. Nhiều số cạnh nhau trong 1 ribbon đã có khung → `StatPair`.
  Chú giải màu tách khỏi bar → `Legend`. Số biểu thị TIẾN ĐỘ tới mục tiêu (không phải snapshot tĩnh) →
  KHÔNG 3 block này — dùng `meter.md`.

> Block: `blocks/stats/{MetricCard,StatPair,Legend}`

## Liên quan
- `meter.md` (progress/tỉ lệ — khác "số tĩnh") · [[card]] (MetricCard dựng trên SectionCard, không lồng thêm
  Card) · [[progress-block-growing-quantity-headline-not-vanity-strip]] (khi nào 1 số ngang-hàng là vanity so
  với 1 meter có nghĩa — đọc trước khi dùng `StatPair` hàng loạt).
