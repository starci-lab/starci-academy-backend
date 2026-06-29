# Draft — Cỡ icon theo BỐ CỤC (inline cạnh chữ vs stacked trên chữ), KHÔNG chỉ theo cỡ chữ (2026-06-21)

- File/§ đích khi `/merge`: `elements/icon.md` §3 (ĐÍNH CHÍNH bảng cỡ icon).
- Bối cảnh: thầy chốt cỡ icon phụ thuộc icon nằm **cạnh** chữ (inline) hay **trên** chữ (stacked), không chỉ cỡ chữ.

## Luật (STRICT) — quyết định theo VỊ TRÍ icon so với text
- **Icon INLINE — trước/sau text, CÙNG HÀNG (leading/trailing)** → icon ≈ cỡ chữ (nhỏ, không lấn dòng):
  - cạnh **`text-sm` / `body-sm` (14px)** → **`size-4`** (16px).
  - cạnh **`text-xs` / `body-xs` (12px)** → **`size-3`** (12px).
- **Icon STACKED — PHÍA TRÊN text, icon trên / chữ dưới (flex-col, items-center)** → icon LỚN (là điểm neo thị giác):
  - trên **`text-sm`** → **`size-5`** (20px). (Vd: bottom-tab bar — icon trên, label dưới.)
- **`<Chip>`** = inline cạnh chữ chip (text-xs) → **`size-3`** (chip nén, icon = cỡ chữ, đừng phình pill).
- **text-base / cột đọc (16px)** → `size-6` (giữ). **Avatar-của-1-thứ** → `IconTile` (giữ).

## ĐÍNH CHÍNH bản cũ
- `elements/icon.md` §3 cũ ghi "body-sm (default) → size-5" cho MỌI inline → **SAI** với rule mới: inline cạnh text-sm = **size-4** (không phải size-5). size-5 CHỈ cho icon **stacked trên** text-sm.
- Hệ quả: rà toàn bộ — icon inline size-5 cạnh text-sm → đổi **size-4**; cạnh text-xs → **size-3**. Chỉ icon stacked (bottom-tab…) giữ size-5.

## Nguyên tắc rút ra
- Hỏi: icon **CẠNH** chữ (cùng hàng) hay **TRÊN** chữ (xếp dọc)? Cạnh → nhỏ (≈ chữ: 4/3). Trên → to (5). Vì icon-cạnh không được lấn dòng chữ; icon-trên là điểm neo nên to để cân khối.
