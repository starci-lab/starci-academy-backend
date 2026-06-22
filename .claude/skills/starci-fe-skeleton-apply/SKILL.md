---
name: starci-fe-skeleton-apply
description: >
  Build / refine the LOADING SKELETON for a page in the MAIN StarCi Academy web app (`D:\Repositories\starci-academy`,
  branch `final-mvp`) so every data-backed region renders a skeleton that MIRRORS its loaded layout (no collapse, no
  jump on resolve) through `AsyncContent`, with the canonical nullish `isLoading` formula. Inspect the loading state
  via DevTools network throttle or a temporary fetcher `sleep` (the old `AsyncContent` `debug` hold was REMOVED — do
  NOT use it). The skeleton-state counterpart of `/starci-fe-ux-apply`; reads the `/fe` + `starci-async` SSOT. Trigger
  when the user types `/starci-fe-skeleton-apply <page>` or asks to "apply skeleton", "làm skeleton cho trang",
  "skeleton mirror", "sửa loading state".
---

# /starci-fe-skeleton-apply — Build the loading skeleton

Make the **loading state** of a page correct: every data-backed region renders a skeleton that **mirrors the real
layout**, so the box never collapses or jumps when data resolves. The skeleton-state sibling of `/starci-fe-ux-apply`
(structure) and `/ui-apply` (pixel polish). It does NOT restructure IA or redesign — it only makes the skeleton match
what's already there.

> ⚠️ Repo FE thật = **`D:\Repositories\starci-academy`** (branch `final-mvp`). KHÔNG phải `C:\…` (bản cũ).

> 🚫 **`AsyncContent` KHÔNG còn prop `debug`** (cơ chế 3s-hold đã bị BỎ HẲN — nó là footgun giữ skeleton 3s cho user
> thật). ĐỪNG thêm `debug` vào bất kỳ `AsyncContent` nào; nếu thấy `debug` còn sót → XÓA. Soi loading bằng cách khác
> (xem §Soi loading).

## Trước khi làm
- Áp **`/fe`** (đọc `main.md` + `starci-<element>.md` + `drafts/*`) + **`starci-async`** (hợp đồng 4-state + luật
  "skeleton mirrors loaded layout"). Skeleton là 1 nhánh của `AsyncContent`, không phải spinner trần.
- Xác định **1 trang/feature** đích (arg). Liệt kê MỌI vùng fetch trong trang.

## Làm (loop)
1. **Enumerate** mọi vùng fetch trong trang. Vùng nào còn `if (isLoading) return <Skeleton/>` / `isLoading ? … : …` /
   empty/error tay → **migrate sang `AsyncContent`** (theo `starci-async`). Mỗi vùng có `skeleton={…}` + `isLoading`
   theo công thức mặc định ở MUST. Nếu content cần derivation nặng từ `data` (dễ crash khi null) → tách body ra
   sub-component `<Feature>Content` nhận `data` non-null, container chỉ còn fetch + `AsyncContent` + `{data ? <Content/> : null}`.
2. **Build/refine skeleton mirror** cho từng vùng, đặt trong component riêng **`<Feature>/<Feature>Skeleton/index.tsx`**
   (style sống trong skeleton component, **KHÔNG inline trong feature**; mẫu `ProfileHeroSkeleton`, `CourseContentsSkeleton`,
   `LeagueCardSkeleton`). Skeleton phải:
   - **Cùng cấu trúc cột/hàng** với layout thật (cùng số card/row — list dài thì 4–6 row đại diện).
   - **Cùng nhịp** (`gap-*`/`p-*`, `max-w`/`mx-auto`, vị trí so với rail); **cùng hình khối** (`rounded-xl` ô /
     `rounded-full` avatar/chip, `h-*`/`w-*` xấp xỉ thật → **resolve KHÔNG nhảy layout**); mirror cả khung (vd content
     `LabeledCard` thì skeleton cũng label-ngoài + `<Card>`).
   - Dùng **`Skeleton` từ `@/components/blocks`** (có `Skeleton.Typography` đã type sẵn cho dòng chữ) — KHÔNG import
     `Skeleton` từ `@heroui/react` cho text (thiếu `.Typography` ở type). Nhận `className` để mirror placement.
3. **Soi loading** (xem §Soi loading) → so skeleton vs layout thật, bắt lệch (thiếu row, sai width/radius, lệch mép,
   **nhảy** khi resolve). Sửa tới khi khớp. Lặp.

## Soi loading (KHÔNG dùng `debug`)
`AsyncContent` không còn 3s-hold. Để thấy skeleton:
- **DevTools → Network → throttle** ("Slow 3G" / custom) rồi reload → skeleton hiện đủ lâu để soi/chụp. (Cách mặc định.)
- Hoặc **tạm thêm `await new Promise(r => setTimeout(r, 1500))` ở đầu fetcher** của leaf query đang soi → **GỠ ngay sau khi soi xong** (đừng commit).
- Lần đầu (chưa có cache) skeleton tự hiện đúng thời gian load thật — reload cứng (Ctrl/Shift+R) để bỏ cache SWR.

## MUST
- **Công thức `isLoading` mặc định = `data === null || data === undefined || isLoading`** ⇒ hiện skeleton khi
  **data CHƯA về (nullish) HOẶC đang loading**. Dùng **nullish check tường minh** (`=== null || === undefined`),
  KHÔNG dùng `!data` — vì `!data` bắt nhầm giá trị **falsy hợp lệ** (`0`, `""`, `false`) → kẹt skeleton oan.
  Repo idiom là `=== null || === undefined` (KHÔNG `== null`; eslint cấm loose-eq). Lý do: che luôn khoảng `data` còn
  `undefined` mà cờ `isLoading` chưa kịp `true` (tránh flash blank 1 nhịp). KHÔNG flicker khi revalidate: SWR giữ
  `data` cũ + `isLoading=false` lúc focus/mutate → cả 3 vế false.
  - ⚠️ **Caveat — query trả `null` lúc RỖNG** (khác `undefined` = chưa tải): nullish check sẽ kẹt skeleton ở nhánh
    rỗng → dùng cờ resolved (`items.length === 0 || isLoading`, `!entity`…) + `isEmpty`/`emptyContent` lo. Grid luôn
    render (heatmap 0 hoạt động vẫn ra lưới) → đừng để `length === 0` kẹt skeleton. `[]` array rỗng OK (không nullish).
  - Hook tổng hợp chỉ phơi `isLoading` (không có `data` thô, vd `useResumeItems`) → truyền thẳng `isLoading={isLoading}`.
- **KHÔNG prop `debug`** trên `AsyncContent` (đã bỏ khỏi block). Grep `debug=` toàn trang về 0 trước khi xong.
- **Skeleton mirror, không spinner trần.** Cùng cấu trúc/nhịp/khối với loaded → no jump. CẤM `<Spinner/>` thay skeleton,
  CẤM skeleton 1 ô vuông cho 1 layout nhiều khối.
- **Style ở skeleton component / blocks, feature chỉ ghép** (`/fe`: feature className = placement). Skeleton dùng
  token + spacing scale `0/2/3/4/6`, `rounded-xl`/`rounded-full` concentric.
- **Mọi vùng fetch đi qua `AsyncContent`** với `skeleton` mirror + `emptyContent`/`errorContent` (đừng quên empty/error
  chỉ vì đang làm loading); section tự ẩn khi rỗng → bỏ `emptyContent` (render null).

## Sau khi làm
- `npx tsc --noEmit` + `npm run lint` sạch (baseline: 4 lỗi blog WIP pre-existing). Grep `debug=` = 0.
- Verify: skeleton khớp layout, resolve không nhảy. Chụp cho thầy 1 ảnh skeleton (qua throttle) + 1 ảnh loaded.
- **Thầy feedback → ghi `.claude/rules/drafts/<temp>.md`** (rút nguyên tắc tổng quát), gộp khi `/merge`.
