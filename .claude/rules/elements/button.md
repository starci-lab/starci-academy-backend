# Element — Button / CTA

> Canon nút. Bổ trợ [[elements/icon]] (cỡ icon trong nút) + [[elements/color]] (màu) + draft [[primary-cta-icon-size-lg]].

## 1. Variant theo VAI (HeroUI `Button variant=`)
- **`primary`** = hành động CHÍNH — **SOLID** (`bg-accent`, chữ/icon = `--accent-foreground` = **trắng**). **Tối đa 1 primary / surface.**
- **`secondary` / `tertiary` / `ghost` / `outline`** = hành động phụ/thứ cấp.
- **Destructive** (xoá…) = tách rõ (`danger`), KHÔNG để cạnh primary như ngang hàng.
- **CẤM tô màu nút bằng className** (`bg-*`/`text-*`) — màu do variant lo. Style nút chỉ ở variant/globals.

## 2. CTA chính = primary SOLID + `size="lg"` + ARROW
- **CTA chính PHẢI: `variant="primary"` + `size="lg"` + icon `ArrowRightIcon`.** (Ref [[primary-cta-icon-size-lg]].)
- **Icon CTA = ARROW (`ArrowRightIcon`) — đồng nhất, thay mọi icon CTA khác** (Play/Plus/Rocket…). Arrow = "đi tới / proceed", hợp mọi CTA. Thầy chốt 2026-06-26: *"nút CTA thì xài arrow hết"*.
- **Arrow đặt TRAILING** (`Label →`) — convention "đi tới". Cỡ icon theo text nút ([[elements/icon]] §3: leading=trailing, button text-sm → `size-5`).
- **Màu: SOLID, KHÔNG tint `/10`.** Tint `bg-accent/10` chỉ cho active/selected nhỏ ([[elements/color]] §2 + [[highlight-accent-as-detail-not-block-fill]]), KHÔNG cho CTA chính.
- **Nút KHÔNG icon = sub-CTA** → `size` md (mặc định), không lg → đọc như cấp dưới CTA chính.
- **1 surface tối đa 1 nút icon+lg** (CTA chính). 2 nút icon+lg cạnh nhau → 1 cái sai vai.

## 3. Ngoại lệ
- **FAB nổi** (rounded-full trên canvas, vd MindMap) · **thanh mobile compact** (CourseMobileEnrollBar) — context chật, có thể giữ `md`/icon khác; cân nhắc, không auto ép.
- **Icon-only** (không label) → BẮT BUỘC `aria-label`. Cỡ icon `size-5` mặc định.
- **Text bấm-được KHÔNG phải nút khối = `Link`** (href→navigate / `onPress`→overlay), KHÔNG `<button>`+style tay.

## Liên quan
- [[elements/icon]] (arrow trailing, cỡ theo text) · [[elements/color]] (primary solid + accent-fg trắng; active tint) · [[primary-cta-icon-size-lg]] (size lg + scan).
