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

## 3. CHIP CẠNH CHIP = VI PHẠM → text trước, chip bên cạnh (STRICT) — CHỐT 2026-06-28
- **KHÔNG đặt 2 `Chip` DÍNH CẠNH NHAU làm 1 cụm thông tin** (vd `[chấm bởi qwen2.5-coder:7b]` `[Miễn phí]` = 2 chip kề). 2 chip kề = "pill nối pill", nặng, mắt không phân được đâu là nhãn đâu là giá trị — cùng họ [[concepts/card]] (không 2 box bordered liên tiếp). Chip là **GIA VỊ điểm xuyết**, không phải khối nền hàng loạt ([[highlight-accent-as-detail-not-block-fill]]).
- **Cách đúng: phần MÔ TẢ/định danh = TEXT THUẦN (kèm icon nếu cần), phần PHÂN LOẠI/trạng thái = 1 `Chip` BÊN CẠNH.** Vd "chấm bởi `<model>`" = **text thuần** (sparkle icon + chữ) → rồi **`AiCategoryChip` (tier "Miễn phí")** = chip bên cạnh. Đọc ra: *[ai chấm — text] + [hạng — chip]*, không phải 2 chip ngang hàng.
- **Quy tắc rút ra:** trong 1 cụm meta, **TỐI ĐA 1 chip** mang 1 trục phân loại; mọi thứ còn lại (model name, label, count mô tả) để text thuần cạnh nó. Cần 2 trục phân loại thật sự → vẫn cách nhau gap + cân nhắc cái nào xứng chip, cái nào hạ xuống text. Hỏi: thông tin này là **mô tả** (→ text) hay **1 nhãn phân loại bounded** (→ chip)? Đừng chip-hoá mọi mẩu.

## 4. KHÔNG `font-mono` nếu thầy chưa duyệt (STRICT) — CHỐT 2026-06-28
- **CẤM `font-mono` cho text UI thường** (model name, label, value, tên file inline trong row…) khi **chưa có lệnh thầy**. Mono đọc "lập trình/code", lệch da typography hệ (Inter sans), trông kỹ-thuật-thô. Vd "chấm bởi qwen2.5-coder:7b" → chữ THƯỜNG (sans), KHÔNG mono.
- **Mono chỉ khi:** (a) là **code/inline-code thật** render qua `MarkdownContent` (renderer tự lo `<code>` — [[elements/richtext]]); (b) **thầy duyệt riêng** cho chỗ đó (vd language-strip landing §5 dưới — brand logo names). Mặc định mọi text khác = sans.

## 5. Chip REMOVABLE (xoá được): X = trailing child của `<Chip>` (không sibling span), X = HeroUI `Link` accent + hover OPACITY (KHÔNG `CloseButton`) — CHỐT 2026-07-06
- **Chip xoá được (skill/interest/tag picker) = `<Chip><Chip.Label>{name}</Chip.Label><X/></Chip>`** — X là trailing child TRỰC TIẾP TRONG pill (như example HeroUI `<Chip><Xmark/><Chip.Label/></Chip>`), KHÔNG bọc `<span inline-flex gap-2><Chip/><X/></span>` (cách đó vẽ "chip + nút X đứng CẠNH" = 2 khối rời).
- **X = HeroUI `Link` màu accent, KHÔNG `CloseButton`:** `CloseButton` (`.close-button--default`) bake `bg-default` LUÔN → vòng tròn xám hằn quanh X trên chip nhỏ (nặng). Dùng `<Link className="text-accent no-underline opacity-60 transition-opacity hover:opacity-100 hover:no-underline" aria-label onPress>{<XIcon aria-hidden className="size-3"/>}</Link>` (`Link` không có `bg` baked → phẳng).
- **Hover X = OPACITY** (`opacity-60→100`), KHÔNG underline, KHÔNG fill. Đây là 1 mode riêng "dismiss glyph nhỏ trong pill" — KHÁC 3 mode go-there/user/accordion của [[hover-style-matches-clickable-nature]] (X-trong-chip không phải link điều hướng, không phải identity-cụm). `XIcon size-3` (khớp `Chip size="sm"`), `aria-label` bắt buộc.
- Chip KHÔNG xoá được (status/badge thông tin, vd "Đã xác thực") → KHÔNG có X.

## 6. Áp đầu (2026-06-26)
- `HeroBanner` (landing hero): eyebrow trả về `<Chip className="bg-accent/10 text-accent">` (bỏ custom span). Language strip = `<Chip className="font-mono bg-[#hex]/10 text-[#hex]">` per lang (brand color, literal trong `LANDING_HERO_KEYWORDS`, **mono = ngoại lệ thầy duyệt** cho tên ngôn ngữ) + prefix "Giải bằng". Hết hand-roll, hết "chìm".
- `SubmissionResult`/`GradingByline` (2026-06-28): "chấm bởi `<model>`" từ `<Chip font-mono>` → **text thuần** (sparkle accent size-5 + chữ sans foreground) + `AiCategoryChip` chip bên cạnh. Hết chip-cạnh-chip, hết mono.

## Liên quan
- [[three-tier-page-layout]] (chip semantic nổi = `bg-<token>/10 text-<token>`) · [[no-uppercase-text]] / [[no-emoji]] (nội dung chip) · [[concepts/single-source-render]] (1 element = 1 component).
