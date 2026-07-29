# S1 — Dựng primitive/block THIẾU (gốc rễ TRƯỚC)

Block chỉ compose được khi element nó cần đã tồn tại → dựng cái thiếu **trước** khi sửa block consume.

- **Thứ tự phụ thuộc:** primitive (gốc rễ) → block con → block đích. Chỉ dựng cái đã chốt trong plan (tên/props/nơi sống đã ghi).
- **Nơi sống:** story-local `.storybook/stories/blocks/<family>/<Name>/{<Name>.tsx (port), <Name>.stories.tsx}`.
  - **Title theo TẦNG:** `Primitives/<Cat>/<Name>` cho primitive · `Block/<Cat>/<Name>` cho block.
  - Tag story `news` "Chờ duyệt".
- **Reuse, đừng đẻ trùng:** plan chốt "reuse `StatusChip`" → consume nó, KHÔNG hand-roll lại pill/tint.
- **Element mới render đủ state riêng** (có/không slot · truncate/tràn · empty nếu có) — 1 leaf/state (theo cây S3).
- **Group primitive** (vd `ButtonGroup`) **sở hữu gap con** (§4) — consumer chỉ truyền các nút, không tự rải gap.
