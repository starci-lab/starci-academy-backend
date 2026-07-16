# Element — Tooltip (block `InfoTooltip`)

> Element doc cho tooltip giải thích thuật ngữ khi hover. Khác Tooltip DECORATIVE (title attr trình duyệt) —
> đây là block chủ đích cho "thuật ngữ khó" (rank/tier/KPI/streak/league…).

## Khi nào dùng
- Có 1 THUẬT NGỮ/chip/label khó hiểu ngay mà cần 1 câu giải thích ngắn khi hover → bọc trigger trong
  `blocks/feedback/InfoTooltip`, KHÔNG tự dựng `Tooltip` (HeroUI) + `Tooltip.Content` tay ở feature (style
  inset/max-width/arrow đã bake trong block — 1 nguồn, [[single-source-render]]).
- KHÔNG dùng cho hành động (nút mở modal, control) — Tooltip chỉ GIẢI THÍCH, không thay label/affordance.

## Quy tắc
- API: `{ children (trigger), title?, description?, content? (override full body), placement? }`. Có `content`
  → bỏ qua `title`/`description` (cho tooltip giàu hơn 1 dòng — vd nhiều số).
- Trigger LUÔN có `cursor-help` (block tự set) — tín hiệu "hover để biết thêm", khác `cursor-pointer` của element
  bấm được ([[interactive-needs-hover]] nói về hover-để-BẤM; đây là hover-để-ĐỌC, cursor khác đi để phân biệt).
- **Affordance = chính phần tử đã có nghĩa, KHÔNG thêm icon ⓘ phụ bên cạnh.** Precedent: `PriceTag` (xem
  [[price]]) gắn tooltip breakdown NGAY vào chip `−X%` (`cursor-help` trên chip đó) — không có icon info rời.
- `max-w-[260px]` bake trong block (đủ cho 2-3 dòng ngắn) — nội dung dài hơn nên rút gọn, không ép tooltip
  thành panel.
- `delay={200}` bake — đừng chỉnh trễ hover riêng ở feature.

> Block: `blocks/feedback/InfoTooltip`

## Liên quan
- [[price]] (breakdown tooltip trên chip %) · [[interactive-needs-hover]] (phân biệt hover-đọc vs hover-bấm).
