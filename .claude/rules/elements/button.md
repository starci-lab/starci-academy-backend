# Element — Button / CTA

> Canon nút. Bổ trợ [[elements/icon]] (cỡ icon trong nút) + [[elements/color]] (màu) + draft [[primary-cta-icon-size-lg]].

## 1. Variant theo VAI (HeroUI `Button variant=`)
- **`primary`** = hành động CHÍNH — **SOLID** (`bg-accent`, chữ/icon = `--accent-foreground` = **trắng**). **Tối đa 1 primary / surface.**
- **`secondary` / `tertiary` / `ghost` / `outline`** = hành động phụ/thứ cấp.
- **Destructive** (xoá…) = tách rõ (`danger`), KHÔNG để cạnh primary như ngang hàng.
- **CẤM tô màu nút bằng className** (`bg-*`/`text-*`) — màu do variant lo. Style nút chỉ ở variant/globals.

## 2. CTA chính = primary SOLID + `size="lg"` + ARROW
- **CTA chính PHẢI: `variant="primary"` + `size="lg"` + icon `ArrowRightIcon`.** (Ref [[primary-cta-icon-size-lg]].)
- **Icon CTA = ARROW (`ArrowRightIcon`) — đồng nhất, thay mọi icon CTA khác** (Play/Plus/Rocket…). Arrow = "đi tới / proceed", hợp mọi CTA. Thầy chốt 2026-06-26: *"nút CTA thì xài arrow hết"*. **Kể cả CTA mua/enroll/đăng-ký → arrow, KHÔNG cart** (thầy chốt lại 2026-06-29: giữ arrow cho đồng nhất, không ngoại lệ commerce).
- **Arrow đặt TRAILING** (`Label →`) — convention "đi tới". Cỡ icon theo text nút ([[elements/icon]] §3: leading=trailing, button text-sm → `size-5`).
- **Màu: SOLID, KHÔNG tint `/10`.** Tint `bg-accent/10` chỉ cho active/selected nhỏ ([[elements/color]] §2 + [[highlight-accent-as-detail-not-block-fill]]), KHÔNG cho CTA chính.
- **Nút KHÔNG icon = sub-CTA** → `size` md (mặc định), không lg → đọc như cấp dưới CTA chính.
- **1 surface tối đa 1 nút icon+lg** (CTA chính). 2 nút icon+lg cạnh nhau → 1 cái sai vai.

## 3. Ngoại lệ
- **FAB nổi** (rounded-full trên canvas, vd MindMap) · **thanh mobile compact** (CourseMobileEnrollBar) · **thanh toolbar/navbar-strip compact** (editor toolbar ở navbar bottom-layer) — context chật, giữ `md` (default), KHÔNG ép `lg` (nút lg làm strip cao/khó đoán height).
- **Icon-only** (không label) → BẮT BUỘC `aria-label`. Cỡ icon `size-5` mặc định.
- **Text bấm-được KHÔNG phải nút khối = `Link`** (href→navigate / `onPress`→overlay), KHÔNG `<button>`+style tay.

## 4. Control-button trong item/block LẶP-ĐƯỢC: reorder = `tertiary` · delete = `danger-soft` (STRICT)
- Header của 1 item/block lặp-được (RepeatableItemCard, block card) có cụm **↑↓ (đảo thứ tự) + xoá**. Phân vai màu theo NGHĨA, KHÔNG để chung `ghost` (không phân biệt destructive):
  - **↑↓ (move up/down) = `variant="tertiary"`** (thao tác phụ, trung tính, quiet).
  - **Xoá/remove = `variant="danger-soft"`** — đỏ **MỀM** (tint), KHÔNG `danger` ĐẶC. Trash lặp lại nhiều item/block → danger đặc quá loud/đỏ chói; `danger-soft` vẫn đọc ra destructive mà không hét. Thầy chốt 2026-07-06.
  - Áp cả cấp **item** (RepeatableItemCard) LẪN **block lớn** (block card header — block cũng có ↑↓ đảo thứ tự cả block, không chỉ item).
- Phân biệt với §1 "destructive = `danger`": nút xoá **ĐƠN LẺ, nổi bật** (vd xoá tài khoản, huỷ đơn) = `danger` đặc; nút xoá **lặp trong list control** (item/block) = `danger-soft` (mềm, đỡ chói khi nhiều).

## 5. Nút màu WARNING (không có variant) = inline `--button-bg` (KHÔNG className `bg-*`)
- HeroUI Button **KHÔNG có `variant="warning"`**. Muốn nút warning (vàng) → `variant="ghost"` + **inline `style`** override `--button-bg` / `--button-bg-hover` / `--button-color` (`var(--warning)` + `--warning-foreground`). KHÔNG `bg-warning` className (base `.button` đổ nền qua **`--button-bg` var**, className `bg-*` thua — [[elements/card]] §3f gotcha). Dùng cho **CTA trong alert warning** (nút tô màu theo status alert — [[elements/alert]] §4).

## Liên quan
- [[elements/icon]] (arrow trailing, cỡ theo text) · [[elements/color]] (primary solid + accent-fg trắng; active tint) · [[primary-cta-icon-size-lg]] (size lg + scan) · [[elements/alert]] (nút CTA trong alert theo status) · [[editor-shell-navbar-toolbar-fullheight-sidebar-and-control-button-semantics]] (draft nguồn).
