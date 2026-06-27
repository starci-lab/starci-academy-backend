# Draft — Top route-loading bar (thanh lướt) + entry "Suspense" splash: 1 thanh accent, hand-rolled không dep (2026-06-27)

- File/§ đích khi `/merge`: `elements/` (loading/feedback) hoặc `concepts/` + liên quan [[starci-async]] (per-region AsyncContent) · [[sticky]]/[[scrollbar-gutter]] (layout chrome) · [[heatmap-trong-la-bug-token-khong-redesign]] (đừng kéo dep khi tự dựng đủ).
- Bối cảnh: thầy *"Tạo trang suspense với mỗi khi load trang có cái thanh lướt trên đầu trang."* → brainstorm chốt: (A) top bar mọi nav + (1) splash khi vào web. FE `D:\Repositories\starci-academy` (branch `final-mvp`), Next 16 + React 19.

## Luật (STRICT)
- **3 TẦNG loading TÁCH BẠCH, đừng gộp:**
  1. **Cold load (vào web) → SPLASH full-screen** (`AppSplash`): logo + thanh accent, mờ đi khi app ready.
  2. **Điều hướng SPA (mỗi nav) → TOP BAR** (`TopLoader`): thanh accent 3px trượt mép trên, trickle → 100% rồi mờ.
  3. **Region fetch trong trang → `AsyncContent` skeleton** (đã có, GIỮ).
  → Mỗi tầng 1 affordance; **dùng CHUNG đúng 1 thanh accent 3px** (splash + top bar) cho nhất quán.
- **Top bar = HAND-ROLL, KHÔNG thêm dep (`nextjs-toploader`/`@bprogress`).** App Router KHÔNG có router-events global (cố ý). Cơ chế đủ & robust:
  - **START** = patch `history.pushState` (App Router đẩy URL optimistic ở ĐẦU nav → fire sớm) + listen `popstate` (back/forward). KHÔNG patch `replaceState` (router.replace mostly shallow filter `?param=` — đừng bar những cái đó).
  - **DONE** = `useEffect(complete, [pathname, searchParams])` (next/navigation) — segment mới commit thì pathname đổi.
  - **Indeterminate trickle** (route KHÔNG có load-event thật): bò tới ~90% rồi snap 100% (pattern nprogress/buildui).
  - **Anti-flash:** delay ~120ms mới PAINT bar; nav prefetch nhanh (done < 120ms) → bar không hiện (khỏi nháy). + **safety timeout** ~10s (same-page link → tự complete, không kẹt 90%).
  - **reduced-motion:** không trickle, chỉ hiện/ẩn 1 đoạn tĩnh.
- **`useLinkStatus` KHÔNG phải bar global** — nó là `{pending}` của 1 `<Link>` ("only last link's pending"). Chỉ hợp hint inline cho nút prefetch=false, KHÔNG dùng làm thanh lướt chính.
- **Z-index:** navbar `z-50` (sẵn) < top bar `z-[60]` < splash overlay `z-[70]`. Bar `fixed inset-x-0 top-0 h-[3px]`, fill `bg-accent`, width JS-driven.

## Luật 2 (STRICT) — "Trang Suspense vào web" = OVERLAY tự-tắt TRONG providers, KHÔNG raw `<Suspense fallback>`
- **ĐÍNH CHÍNH ý "cấp vào `<Suspense fallback>` sẵn có":** thực thi đúng = **overlay client tự-quản** mount TRONG cây providers, KHÔNG dùng `<Suspense fallback>` của boundary ngoài cùng. 3 lý do:
  1. **Theme:** `<Suspense fallback>` render khi subtree (gồm `NextThemesProvider`) đang suspend → fallback nằm NGOÀI theme provider → splash ăn token `:root` (light) dù app dark → **flash sai màu**. Overlay TRONG providers thì có `.dark` class (next-themes set qua blocking script trước paint) → đúng nền ngay.
  2. **Đừng splash mọi nav:** bọc `{children}` trong `<Suspense fallback={splash}>` sẽ hiện splash full-screen MỖI lần nav suspend (sai — nav là việc của top bar). Boundary NGOÀI cùng (bọc providers) chỉ suspend lúc initial, nhưng vướng lỗi theme (#1).
  3. **Tin cậy:** SSR-streamed HTML thường resolve sẵn → `<Suspense fallback>` hiếm khi hiện đủ lâu. Overlay tự-quản (visible mặc định → SSR PAINT vào HTML → fade sau mount + min-time ~550ms) đảm bảo splash LUÔN thấy khi cold load, fade mượt.
- **Pattern overlay:** `fixed inset-0 z-[70] bg-background`, visible mặc định (render trong SSR HTML → thấy trước cả JS), `useEffect` sau mount → set `leaving` sau MIN_VISIBLE → fade opacity → `gone` → `return null`. reduced-motion: bar tĩnh.
- **Nguyên tắc rút ra:** "trang Suspense lúc vào web" (ý người dùng = màn loading vào app) ≠ React `<Suspense>` literal. Hiện thực đúng INTENT = entry overlay tự-tắt (themed, SSR-painted, không đụng nav), không phải gắn fallback vào 1 Suspense boundary (sai theme + sai phạm vi). Khi instruction kỹ thuật có pitfall (theme/timing), chọn cách đạt INTENT + ghi lại lý do.

## Kỹ thuật / impl (đã làm 2026-06-27)
- `blocks/layout/TopLoader/index.tsx` (client): history-patch + popstate START, `[pathname,searchParams]` DONE, trickle + show-delay 120ms + safety 10s + reduced-motion; `z-[60]` `bg-accent`.
- `blocks/layout/AppSplash/index.tsx` (client): overlay tự-tắt (min 550ms + fade 350ms), `BrandLogo` + thanh accent (keyframe `appSplashTrickle`) + `t("common.loading")`; `z-[70]`.
- `globals.css`: thêm `@keyframes appSplashTrickle` + guard reduced-motion `.app-splash-bar`.
- `InnerLayout.tsx`: mount `<AppSplash/>` + `<TopLoader/>` TRONG `SwrProvider`, sau `<UseEffects/>`, TRƯỚC `<Navbar/>`.
- i18n `common.loading` (vi "Đang tải…" / en "Loading…").
- tsc + eslint sạch cho 3 file (nền branch đang vỡ vì refactor cookie-consent/seo/landing — KHÔNG do thay đổi này).

## Nợ / chưa làm
- **Chưa verify mắt:** working tree FE đang mid-refactor (`@/modules/seo/*`, `@/hooks/zustand/cookieConsent/store`, landing `KnowledgeGraph`/`TrackCard`/`TruthList`/`marketing/index.ts` thiếu) → InnerLayout không compile → mọi route 500. Verify khi các refactor đó land (hard-refresh thấy splash; nav giữa trang thấy thanh hồng).
- **router.push KHÔNG qua `<Link>`:** history.pushState patch bắt được (App Router đẩy URL đầu nav). Nếu sau thấy 1 số CTA `router.push` không hiện bar → cân nhắc cũng intercept anchor-click hoặc wrap router.
- Per-route `loading.tsx` skeleton (route nặng) = optional đợt sau (`/starci-fe-skeleton-apply`).
- Doc brainstorm: `blocks/layout/TopLoader/UX-BRAINSTORM.md`.
