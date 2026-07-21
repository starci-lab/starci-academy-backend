# Foundation — Typography

> Type scale sống trong component HeroUI `Typography` (`type=`), KHÔNG phải Tailwind `text-*` rời.
> `--font-sans` là biến duy nhất app khai cho font family — và đang ĐỨT (xem ghi chú).

- **Thang `type`:** `h1` 36px · `h2` 30px · `h3` 24px · `h4` 20px · `h5` 18px · `h6` 16px — TẤT CẢ
  `font-semibold tracking-tight` (heading không có nấc weight riêng, đã bake semibold cố định). `body` 16px/
  leading-7 · `body-sm` 14px/leading-6 · `body-xs` 12px/leading-5 · `code` 14px mono trên `bg-default`.
- **`weight` (`normal/medium/semibold/bold`) chỉ có nghĩa cho `body*`** (đổi trọng lượng của prose) — đừng
  đè `weight` lên `h1-h6` (đã semibold cố định, đổi = phá bake, không hiệu lực thật hoặc lệch convention).
- **`color` component chỉ bake 2 giá trị: `default`/`muted`.** Mọi màu khác (accent/success/warning/danger)
  là override className, KHÔNG phải variant có sẵn của `Typography` — xem [[color]].
- **PageHeader title = H3 (24px); Modal header = `type="body" weight="semibold"` (16px)** — 2 cấp KHÁC NHAU
  có chủ đích (modal nhỏ hơn page, [[header]] §1/§5). Đừng bê H3 vào modal.
- **`--font-sans: var(--font-inter)` — ĐỨT.** `--font-inter` không được định nghĩa ở đâu trong repo. Font
  thật load là `Open_Sans` (`next/font/google`) gắn trực tiếp `font.className` lên `<body>`, không qua biến
  này. `font-sans` utility dùng NGOÀI `<body>` sẽ fallback sans hệ điều hành. Chưa sửa — flag khi đụng lại
  (đích: `--font-sans: var(--font-open-sans)`).
- **KHÔNG có `--font-serif` khai báo** → `font-serif` ăn fallback OS serif, VỠ dấu tiếng Việt (dấu tách rời
  khỏi nguyên âm). CẤM dùng cho text VN tới khi có serif-face-VN qua `next/font`. Xem
  [[fe-lint-no-next-img-directive-and-serif-polish]].
- **`font-mono` không có override riêng** (Tailwind default mono stack) — CẤM dùng cho UI text thường (model
  name, label…) trừ code thật hoặc thầy duyệt riêng chỗ đó. Xem [[chip]] §4.

> Nguồn: `@heroui/styles/dist/components/typography.css` (`.typography--h1..h6/body*/code`) + `globals.css`
> `--font-sans` + `src/app/[locale]/layout.tsx` (`Open_Sans` qua `next/font/google`).

## Liên quan
- [[header]] · [[color]] · [[fe-lint-no-next-img-directive-and-serif-polish]] · [[chip]].
