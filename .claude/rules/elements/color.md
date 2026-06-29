# Element — Color / Token

> Canon màu. Token semantic only. Bổ trợ [[highlight-accent-as-detail-not-block-fill]] (accent là gia vị) + [[elements/button.md]] + [[elements/chip]] (chip soft).

## 1. Token semantic ONLY (CẤM hex / `slate-*` / `cyan-500`)
- Nền: `bg-background` (bàn) · `bg-surface(-secondary/-tertiary)` (giấy) · field `--field-*`.
- Chữ: `text-foreground` · `text-muted` · `text-accent` · semantic `text-{success,warning,danger}`.
- Viền: `border-separator` / `border-default`. Brand ngoài (FB/GitHub) → token `--brand-*`. Phân loại → map về success/warning/danger/accent.
- Màu data-driven (ngôn ngữ TS/Go, category) = ngoại lệ hex hợp lệ, để ở util domain + dùng `style`/inline, KHÔNG token globals.

## 2. ACTIVE / SELECTED / HIGHLIGHT nhỏ = `bg-<Color>/10` + icon/text `<Color>` (tonal)
- **Component đang active/chọn/nổi (nav row, chip, tab, segment) = nền tint `bg-<Color>/10` + icon & text CÙNG màu `<Color>`** (đậm). Pattern tonal chuẩn (shadcn/Material/Linear). `<Color>` = `accent` (active chính) · `success/warning/danger` (semantic) · `default` (neutral selected → `bg-default text-foreground`).
- **CHỈ cho khối BOUNDED NHỎ.** KHÔNG flood `bg-<Color>/10` lên block/section LỚN — accent là gia vị ở chi tiết, không mảng nền lớn ([[highlight-accent-as-detail-not-block-fill]]). Highlight "của tôi/đang chọn" trong LIST → accent ở chi tiết (ring/chip/value), KHÔNG tô nền cả row/khối lớn.
- **Chip semantic nổi = `bg-<token>/10 text-<token>`** (soft, no-border) — đã canon ở chip.

## 3. PRIMARY = SOLID (không tint)
- Nút/hành động CHÍNH = **solid fill** (`bg-accent` + `--accent-foreground`), KHÔNG `bg-accent/10`. Tint `/10` chỉ cho active/selected/secondary. Ref [[elements/button.md]] §2.
- **`--accent-foreground` = TRẮNG** (`oklch(100% 0 0)`, chốt 2026-06-26) → chữ/icon/arrow trên accent solid = trắng. ⚠️ accent ~70%L hồng → verify AA 4.5:1; mờ thì hạ accent đậm hơn cho nút.

## 4. A11y
- Contrast ≥ 4.5:1 (text), ≥3:1 (phụ/icon). `text-<Color>` trên `bg-<Color>/10` (≈ chữ-màu-trên-trắng): đậm OK; **accent/bright → verify**. Màu KHÔNG là kênh thông tin duy nhất (kèm icon/label).

## Liên quan
- [[highlight-accent-as-detail-not-block-fill]] · [[elements/button.md]] · [[elements/chip]] · [[no-emoji]] (icon thay emoji).
