# Element — Color / Token

> Canon màu. Token semantic only. Bổ trợ [[accent-system]] (accent là gia vị) + [[elements/button.md]] + [[elements/chip]] (chip soft).

## 1. Token semantic ONLY (CẤM hex / `slate-*` / `cyan-500`)
- Nền: `bg-background` (bàn) · `bg-surface(-secondary/-tertiary)` (giấy) · field `--field-*`.
- Chữ: `text-foreground` · `text-muted` · `text-accent` · semantic `text-{success,warning,danger}`.
- Viền: `border-separator` / `border-default`. Brand ngoài (FB/GitHub) → token `--brand-*`. Phân loại → map về success/warning/danger/accent.
- Màu data-driven (ngôn ngữ TS/Go, category) = ngoại lệ hex hợp lệ, để ở util domain + dùng `style`/inline, KHÔNG token globals.

## 2. ACTIVE / SELECTED / HIGHLIGHT nhỏ = `bg-<Color>/10` + icon/text `<Color>` (tonal)
- **Component đang active/chọn/nổi (nav row, chip, tab, segment) = nền tint `bg-<Color>/10` + icon & text CÙNG màu `<Color>`** (đậm). Pattern tonal chuẩn (shadcn/Material/Linear). `<Color>` = `accent` (active chính) · `success/warning/danger` (semantic) · `default` (neutral selected → `bg-default text-foreground`).
- **CHỈ cho khối BOUNDED NHỎ.** KHÔNG flood `bg-<Color>/10` lên block/section LỚN — accent là gia vị ở chi tiết, không mảng nền lớn ([[accent-system]]). Highlight "của tôi/đang chọn" trong LIST → accent ở chi tiết (ring/chip/value), KHÔNG tô nền cả row/khối lớn.
- **Chip semantic nổi = `bg-<token>/10 text-<token>`** (soft, no-border) — đã canon ở chip.

## 3. PRIMARY = SOLID (không tint)
- Nút/hành động CHÍNH = **solid fill** (`bg-accent` + `--accent-foreground`), KHÔNG `bg-accent/10`. Tint `/10` chỉ cho active/selected/secondary. Ref [[elements/button.md]] §2.
- **`--accent-foreground` = TRẮNG** (`oklch(100% 0 0)`, chốt 2026-06-26) → chữ/icon/arrow trên accent solid = trắng. ⚠️ accent ~70%L hồng → verify AA 4.5:1; mờ thì hạ accent đậm hơn cho nút.

## 4. Node/box "tone" trên nền TỐI = `color-mix` ĐẶC (không alpha `bg-<Color>/10`); chỉ tô node CÓ NGHĨA
- **Tô tone cho 1 BOX/NODE LỚN trên nền TỐI (diagram, card nhấn) = nền `color-mix(in oklch, var(--<tone>) ~20–26%, var(--surface))` ĐẶC (opaque), KHÔNG `bg-<Color>/10` alpha.** Alpha lem khi có glow/gradient phía sau (glow lọt qua = "kính mờ"); màu-đặc + viền cùng tông = hài hoà (viền màu + nền đen = chọi). Render inline `style` (color-mix khó biểu diễn gọn bằng class).
- **PHÂN BIỆT với CHIP:** chip vẫn `bg-<token>/10` alpha (§2, [[elements/chip]]) — chip nhỏ, trên surface phẳng không glow, alpha OK. Box/node lớn trên glow → color-mix đặc.
- **Chỉ tô node CÓ NGHĨA** (focal=accent + problem=danger), còn lại neutral (`bg-surface`+`border-default`) — 8 node đủ màu = cầu vồng, loãng. Cùng tinh thần [[accent-system]] (accent là gia vị, vài điểm).
- **Chữ giữ `text-foreground`** trên nền tone-đặc (tone do viền+nền gánh; đừng tô chữ theo tone → giảm contrast).
- **NGOẠI LỆ node NEUTRAL trên glow:** để `color-mix(in oklch, var(--surface) ~80%, transparent)` + `backdrop-blur` (translucent hứng glow → node "sống", không đen chết). Phân vai: **tone = đặc (pop) · neutral = glass-trong (hứng glow)**. Ref [[tone-node-fill-solid-colormix-not-alpha]].

## 5. Trong 1 khối stat: dòng CHÍNH `default`, chỉ dòng PHỤ mới `muted` (chốt 2026-07-12)
- **Số/label CHÍNH của 1 khối (headline stat, count đầu dòng) = `text-foreground`** (Typography không set `color`, mặc định đã là `default`) — KHÔNG `color="muted"`. `muted` chỉ dành cho dòng PHỤ/breakdown bên dưới nó.
- Ca cụ thể: `DueReviewHero`'s "Đến hạn hôm nay" — dòng chính `"{count} thẻ cần ôn lại"` = `default`; dòng breakdown `"{overdue} quá hạn + {newCapped} thẻ mới…"` bên dưới mới `color="muted"`. Trước đó CẢ 2 dòng đều bị đóng `muted`, làm mất phân cấp — thầy: *"28 thẻ cần ôn lại => text-foreground, chỉ muted ở text secondary"*.
- Đây là quy tắc PHÂN CẤP chung, không riêng component này: bất kỳ khối `flex-col` xếp 1 số chính + 1 dòng phụ giải thích số đó → chỉ dòng phụ `muted`.

## 6. A11y
- Contrast ≥ 4.5:1 (text), ≥3:1 (phụ/icon). `text-<Color>` trên `bg-<Color>/10` (≈ chữ-màu-trên-trắng): đậm OK; **accent/bright → verify**. Màu KHÔNG là kênh thông tin duy nhất (kèm icon/label).

## 7. ĐÍNH CHÍNH (CHỐT 2026-07-15) — cặp tint = `bg-<status>-soft` + `text-<status>-soft-foreground` NATIVE, KHÔNG `/10` + hue gốc
> Lật §2 và §6 ở TRÊN cho phần cặp-màu-tint (giữ nguyên tinh thần "accent là gia vị / bounded nhỏ").
- **Vấn đề của công thức cũ:** `text-<status>` = hue GỐC full-saturation (light: warning L78% · success L73% · accent L70% · danger L65%) đặt trên nền sáng (tint `/10` ≈ L96–97%) → **contrast KHÔNG đạt 4.5:1** (Storybook a11y chấm đỏ "Color contrast" Serious; warning vàng tệ nhất ~1.8:1). Đây là bug hệ thống, không riêng 1 component.
- **CHỐT MỚI — dùng đúng cặp token SOFT native của HeroUI v3:**
  - nền tint: **`bg-<status>-soft`** (thay `bg-<status>/10`) — `--<status>-soft` = `color-mix(... <status> 15%, transparent)`.
  - chữ + icon: **`text-<status>-soft-foreground`** (thay `text-<status>`) — token này TRỘN `--foreground` để làm TỐI chữ đủ đọc (vd light warning = `mix(warning 80%, foreground 70%)`), đạt AA ở **cả light + dark**.
  - nút/CTA ĐẶC vẫn `bg-<status>` + `text-<status>-foreground` (không đổi).
- **Áp dụng MỌI ngữ cảnh, kể cả nền TRẮNG** — đã tính: `-soft-foreground` trên trắng còn contrast CAO HƠN trên tint (trắng L100 sáng hơn tint) nên không cần phân biệt. Đã sweep toàn `src` (~480 chỗ `text-<status>` + ~480 chỗ `bg-<status>/10`).
- **Blast:** `StatusChip` bỏ override tự chế, dùng thẳng `variant="soft"` native. `Callout` → `bg-<status>-soft`.
- **BẪY đừng đảo:** `--<status>-soft` (nền) trộn với `transparent` → CHỈ làm NỀN (làm chữ sẽ nhạt gần trong suốt). `--<status>-soft-foreground` (chữ) trộn với `--foreground` → CHỈ làm CHỮ.
- Utility hợp lệ (HeroUI expose `--color-<status>-soft` / `--color-<status>-soft-foreground` trong `@theme inline`): `bg-<status>-soft`, `text-<status>-soft-foreground` cho accent/success/warning/danger/default.

## Liên quan
- [[accent-system]] · [[elements/button.md]] · [[elements/chip]] · [[no-emoji]] (icon thay emoji).
