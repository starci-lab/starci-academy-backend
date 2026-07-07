---
name: starci-fe-skeleton-apply
description: >
  Build/refine the LOADING SKELETON for a page or region in the MAIN StarCi Academy web app
  (`C:\Repositories\starci-academy`) so every data-backed region renders a skeleton that MIRRORS its loaded layout
  (no collapse, no jump on resolve), through `AsyncContent`, using the canonical nullish `isLoading` formula. The
  loading-state counterpart of `starci-fe-ux-apply` / `starci-fe-block-apply` — it does NOT restructure IA, only makes
  the skeleton match what's already there. Grounded in `fe/patterns/` (AsyncContent priority · 3-tier loading) +
  `fe/components/skeleton` + `starci-async`. Inspect loading via DevTools Network throttle or a temp fetcher sleep
  (NO `debug` prop — removed). Trigger when the user types `/starci-fe-skeleton-apply <page>`, or asks to "làm skeleton
  · sửa loading state · skeleton mirror · fix loading".
---

# /starci-fe-skeleton-apply — Dựng SKELETON loading (mirror layout, resolve không nhảy)

Làm **loading state** đúng: mọi vùng fetch render skeleton **MIRROR layout thật** → khi data về **không sập/nhảy**. Anh
em loading-state của layout/block apply. **KHÔNG** restructure IA — chỉ làm skeleton khớp cái đang có.

## Nền tra
- `fe/patterns/asynccontent-remove-debug-hold` (priority `error → loading → empty → content`, KHÔNG debug-hold) · `loading-feedback-three-tiers-splash-toploader-skeleton` · `labeled-section-render-empty-not-self-hide`.
- `fe/components/skeleton` (block `Skeleton` + `Skeleton.Typography` cho dòng chữ) · `fe/foundations` (spacing/radius) · skill `starci-async` (hợp đồng AsyncContent 4-state).

## Làm (loop)
1. **Enumerate** mọi vùng fetch trong trang. Vùng còn `if (isLoading) return <Skeleton/>` / `isLoading ? … : …` / empty/error tay → **migrate sang `AsyncContent`** (`skeleton` + `isLoading` + `emptyContent`/`errorContent`). Content cần derivation nặng từ `data` → tách `<Feature>Content` nhận `data` non-null; container chỉ fetch + AsyncContent.
2. **Build skeleton mirror** trong **component riêng** `<Feature>/<Feature>Skeleton/index.tsx` (style SỐNG ở skeleton, KHÔNG inline feature): **cùng cấu trúc** cột/hàng (cùng số card/row; list dài → 4-6 row đại diện) · **cùng nhịp** (`gap-*`/`p-*`, `max-w`/`mx-auto`, vị trí vs rail) · **cùng hình khối** (`rounded-xl` ô / `rounded-full` avatar-chip, `h-*`/`w-*` xấp xỉ) → **resolve KHÔNG nhảy**. Dùng block `Skeleton` (đừng import `Skeleton` HeroUI cho text — thiếu `.Typography`).
3. **Soi loading** (KHÔNG `debug`): DevTools Network throttle "Slow 3G" + reload cứng; hoặc tạm `await new Promise(r=>setTimeout(r,1500))` đầu fetcher rồi GỠ. So skeleton vs thật → bắt lệch (thiếu row · sai width/radius · lệch mép · **nhảy** khi resolve). Sửa tới khi khớp.

## MUST
- **`isLoading` = `data === null || data === undefined || isLoading`** (nullish TƯỜNG MINH, KHÔNG `!data` — bắt nhầm `0`/`""`/`false`). Query trả `null` lúc RỖNG (≠ `undefined` chưa tải) → dùng cờ resolved (`items.length === 0 || isLoading`) + `emptyContent`, đừng kẹt skeleton.
- **Skeleton MIRROR, KHÔNG spinner trần.** Cùng cấu trúc/nhịp/khối với loaded. CẤM `<Spinner/>` thay skeleton; CẤM 1 ô vuông cho layout nhiều khối.
- **KHÔNG prop `debug`** (đã bỏ khỏi block). Style ở skeleton component/blocks, feature chỉ GHÉP. Spacing scale `0/2/3/4/6`.
- Mọi vùng fetch đi qua `AsyncContent` (đừng quên empty/error); section tự ẩn khi rỗng → render null.

## Verify
- `npx tsc --noEmit` + `npm run lint` sạch. Soi skeleton (throttle) vs loaded → **không nhảy**. Chụp 1 ảnh skeleton + 1 loaded.
- Ruling tái dùng → ghi `fe/patterns/` hoặc `fe/components/skeleton`. Có sửa canon → **push private**; sạch → **public** (rule `.claude/CANON.md`).

## Liên quan
- `starci-fe-ux-apply` (gọi skeleton SAU khi dựng structure) · `starci-fe-block-apply` (skeleton 1 block) · `starci-async` (AsyncContent/Empty/Error).
