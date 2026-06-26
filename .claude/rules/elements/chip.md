# Element — Chip

> Quy ước cho "chip / pill / tag / badge". Thầy chốt 2026-06-26: *"không dùng component ngoài hay tự redesign chip, kể cả landing"*.

## 1. LUÔN dùng `Chip` (HeroUI) — KHÔNG hand-roll `<span>` pill (STRICT)
- **Mọi chip/pill/tag/badge = block `Chip` (HeroUI `@heroui/react`)**, KHÔNG tự dựng `<span className="rounded-full border px-3 py-1 …">` (hand-roll) hay redesign 1 chip riêng — **kể cả ở landing/marketing**. Hand-roll = lệch da Chip chung (radius/padding/size/focus), nhân bản style, khó đồng bộ. 1 element = 1 component dùng chung ([[concepts/single-source-render]]).
- Cấu trúc: `<Chip size="sm" ...><Chip.Label>{text}</Chip.Label></Chip>` (+ leading icon là child trước `Chip.Label`). KHÔNG nhồi text trần.
- **Bẫy đã dính:** eyebrow landing từng bị "redesign" thành `<span>` quiet-pill tay (border + dot + backdrop-blur) → thầy bác. Trả về `<Chip>`. Muốn quiet/khác màu → override className (mục 2), KHÔNG dựng span mới.

## 2. Màu chip = `bg-<color>/10 text-<color>` (override className), KHÔNG đổi component
- **Chip muốn màu (semantic HOẶC brand) = override `className="bg-<color>/10 text-<color>"`** trên `<Chip>` (tint sáng /10 + chữ đậm màu). KHÔNG tự chế chip mới, KHÔNG dựa mỗi `color` prop (HeroUI soft mặc định tối hơn).
  - **Semantic token:** `bg-accent/10 text-accent` · `bg-success/10 text-success` · `bg-danger/10 text-danger` (vd eyebrow landing = `bg-accent/10 text-accent`; "Đã đọc" = `bg-success/10 text-success` — ref [[three-tier-page-layout]]).
  - **Brand color (hex, vd logo ngôn ngữ):** `bg-[#3178C6]/10 text-[#3178C6]` (TS) · `text-[#E76F00]` (Java) · `#8B5CF6` (C#) · `#00ADD8` (Go). Class phải là **literal trong source** (constant/map) để Tailwind build ra — KHÔNG ghép từ biến runtime (`bg-[${hex}]` không build). Data-driven màu → lưu sẵn chuỗi className trong constant.
- Override `bg`/`text` qua className áp ĐƯỢC trên `<Chip>` (đã verify: read-badge + brand chips). KHÔNG cần `!`.

## 3. Áp đầu (2026-06-26)
- `HeroBanner` (landing hero): eyebrow trả về `<Chip className="bg-accent/10 text-accent">` (bỏ custom span). Language strip = `<Chip className="font-mono bg-[#hex]/10 text-[#hex]">` per lang (brand color, literal trong `LANDING_HERO_KEYWORDS`) + prefix "Giải bằng". Hết hand-roll, hết "chìm".

## Liên quan
- [[three-tier-page-layout]] (chip semantic nổi = `bg-<token>/10 text-<token>`) · [[no-uppercase-text]] / [[no-emoji]] (nội dung chip) · [[concepts/single-source-render]] (1 element = 1 component).
