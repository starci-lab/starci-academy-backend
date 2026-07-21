# Concept — 3 TẦNG loading TÁCH BẠCH: entry SPLASH (cold load) · TOP-BAR (nav SPA) · region SKELETON; hand-roll không dep, splash = overlay tự-tắt (KHÔNG raw `<Suspense fallback>`)

> Heuristic loading/feedback (họ `concepts/*`, FE App Router + React 19). Thầy 2026-06-27: *"tạo trang suspense với mỗi khi load trang có thanh lướt trên đầu"*. Bổ trợ [[starci-async]] (region skeleton) · [[sticky]] · [[scrollbar-gutter]].

## Luật (STRICT) — 3 tầng, đừng gộp
1. **Cold load (vào web) → SPLASH full-screen** (`AppSplash`): logo + thanh accent, mờ đi khi app ready.
2. **Điều hướng SPA (mỗi nav) → TOP BAR** (`TopLoader`): thanh accent 3px trượt mép trên, trickle → 100% rồi mờ.
3. **Region fetch trong trang → `AsyncContent` skeleton** ([[starci-async]], GIỮ).
- Mỗi tầng 1 affordance; **dùng CHUNG đúng 1 thanh accent 3px** (splash + top bar) cho nhất quán.

## Top bar = HAND-ROLL, KHÔNG thêm dep (`nextjs-toploader`/`@bprogress`)
- App Router KHÔNG có router-events global (cố ý). Cơ chế đủ:
  - **START** = patch `history.pushState` (App Router đẩy URL optimistic ở ĐẦU nav → fire sớm) + listen `popstate`. KHÔNG patch `replaceState` (router.replace mostly shallow `?param=` — đừng bar cái đó).
  - **DONE** = `useEffect(complete, [pathname, searchParams])` (segment mới commit → pathname đổi).
  - **Indeterminate trickle:** bò tới ~90% rồi snap 100% (nprogress-style).
  - **Anti-flash:** delay ~120ms mới PAINT bar; nav prefetch nhanh (< 120ms) → bar không hiện. + **safety timeout** ~10s (same-page link tự complete, không kẹt 90%).
  - **reduced-motion:** không trickle, hiện/ẩn tĩnh.
- **`useLinkStatus` KHÔNG phải bar global** — chỉ `{pending}` của 1 `<Link>`; hợp hint inline, không phải thanh lướt chính.
- **Z-index:** navbar `z-50` < top bar `z-[60]` < splash overlay `z-[70]`. Bar `fixed inset-x-0 top-0 h-[3px] bg-accent`, width JS-driven.

## Entry splash = OVERLAY tự-tắt TRONG providers, KHÔNG raw `<Suspense fallback>` (STRICT)
- **"Trang Suspense lúc vào web" (ý = màn loading vào app) ≠ React `<Suspense>` literal.** Thực thi đúng = **overlay client tự-quản** mount TRONG cây providers, KHÔNG `<Suspense fallback>` boundary ngoài cùng. 3 lý do:
  1. **Theme:** `<Suspense fallback>` render khi subtree (gồm theme provider) suspend → fallback NGOÀI theme provider → ăn token `:root` (light) dù app dark → **flash sai màu**. Overlay TRONG providers có `.dark` class → đúng nền ngay.
  2. **Đừng splash mọi nav:** bọc `{children}` trong `<Suspense fallback={splash}>` sẽ splash MỖI nav suspend (sai — nav là việc của top bar).
  3. **Tin cậy:** SSR-streamed HTML thường resolve sẵn → `<Suspense fallback>` hiếm hiện đủ lâu. Overlay tự-quản (visible mặc định → SSR PAINT vào HTML → fade sau mount + min-time ~550ms) đảm bảo splash LUÔN thấy khi cold load.
- **Pattern:** `fixed inset-0 z-[70] bg-background`, visible mặc định (SSR HTML → thấy trước cả JS), `useEffect` sau mount → set `leaving` sau MIN_VISIBLE → fade opacity → `gone` → `return null`. reduced-motion: tĩnh.
- **Nguyên tắc rút ra:** instruction kỹ thuật có pitfall (theme/timing) → chọn cách đạt INTENT (entry overlay themed, SSR-painted, không đụng nav) + ghi lại lý do; đừng gắn fallback vào 1 Suspense boundary (sai theme + sai phạm vi).

## Impl
- `blocks/layout/TopLoader` + `blocks/layout/AppSplash` (client), mount TRONG SwrProvider (sau `<UseEffects/>`, trước `<Navbar/>`). Keyframe (`appSplashTrickle`) ở `globals.css` + guard reduced-motion. `history.pushState` patch bắt cả `router.push` (App Router đẩy URL đầu nav) — nếu 1 số CTA `router.push` không hiện bar thì cân nhắc intercept anchor-click / wrap router. Per-route `loading.tsx` skeleton (route nặng) = optional (`/starci-fe-skeleton-apply`).

## Liên quan
- [[starci-async]] (region skeleton — tầng 3) · [[sticky]] / [[scrollbar-gutter]] (layout chrome) · [[heatmap-trong-la-bug-token-khong-redesign]] (đừng kéo dep khi tự dựng đủ).
