# FS Personal-Project — Roadmap task-per-milestone (StarCi Shop, M0-M20)

> Duyệt 2026-06-12. `⊕` = task MỚI (gen full). `·` = đã có (polish tab). BE = per-language (ts/java/csharp/go, 4 body); FE = agnostic (1 body). UI preview = `:::tab` theo heroui-rules + milestone-rules.
> Lô-0 (M0-M4 new tasks) gen riêng để validate format. M5-M20 = 4 lô song song.

## Lô A — M5-M9 (async + frontend app)
**M5 async-and-realtime** (BE): · Background Job BullMQ · ⊕ Email/SMS đơn hàng (worker gửi email/SMS xác nhận, retry, log) · ⊕ Cron dọn giỏ & đơn treo (scheduled job xoá giỏ bỏ quên + expire đơn PENDING hoàn tồn) · ⊕ WebSocket push trạng thái đơn (gateway auth per-user, client subscribe)
**M6 storefront-frontend** (FE): ⊕ App Shell+Routing · ⊕ Product list filter/sort (grid đọc catalog API, filter category/giá, sync URL query) · ⊕ Chi tiết SP (/products/:id, add-to-cart, skeleton, hết hàng) · ⊕ Giỏ hàng client (cart API, badge, optimistic)
**M7 checkout-and-account-frontend** (FE): ⊕ Auth UI+Route Guard · ⊕ Cart state+Mini-cart (Zustand/jotai sync API) · ⊕ Checkout form RHF+Zod (POST /orders, xử lý lỗi server) · ⊕ Orders+Detail view · ⊕ Account Profile (sửa profile, đổi mật khẩu, logout)
**M8 admin-dashboard** (FE + 1 BE): ⊕ Admin Shell+Role Gate · ⊕ Product CRUD UI · ⊕ Order Mgmt UI (đổi trạng thái) · ⊕ Admin Role Endpoint (BE per-lang, 403 non-admin) · ⊕ Dashboard Metrics (KPI doanh thu/đơn/tồn)
**M9 ui-polish-and-accessibility** (FE): ⊕ Toast System · ⊕ Confirm Dialogs (focus-trap, Esc) · ⊕ Dark Mode+Theming · ⊕ i18n vi/en · ⊕ Keyboard Nav+ARIA

## Lô B — M10-M13 (payment + scale DB)
**M10 payment-integration** (BE + 1 FE): ⊕ Checkout session+redirect (POST /payments/checkout payment intent, mock provider) · ⊕ Webhook verify HMAC+update đơn (idempotent → PAID, chống replay) · ⊕ Sổ kép+đối soát (double-entry ledger, GET /payments/ledger) · ⊕ Refund+đảo sổ kép · ⊕ Checkout UI+status (FE: redirect, polling PAID/FAILED)
**M11 database-indexing** (BE + 1 FE): ⊕ Composite/partial index (EXPLAIN ANALYZE trước/sau) · ⊕ Giết N+1 đơn hàng (join/dataloader) · ⊕ Keyset cursor pagination · ⊕ Query-stats endpoint (EXPLAIN tự động, slow query) · ⊕ Catalog infinite-scroll dùng cursor (FE)
**M12 caching-with-redis** (BE + 1 FE): ⊕ Cache-aside+TTL chi tiết SP (hit/miss metric) · ⊕ Chống stampede (lock/single-flight + jittered TTL) · ⊕ Invalidation khi update SP · ⊕ HTTP cache ETag/Cache-Control/304 · ⊕ UI freshness+refresh (FE)
**M13 flash-sale-and-concurrency-control** (BE + 1 FE): · Pessimistic lock oversell · ⊕ Redis atomic trừ kho (DECR/Lua, reject nhanh) · ⊕ Idempotent purchase (Idempotency-Key chống double-buy) · ⊕ Queue/rate-limit quá tải (waiting-room, retry-after) · ⊕ Flash-sale UI countdown (FE)

## Lô C — M14-M17 (reliability + advanced)
**M14 idempotency-and-reliability** (BE + 1 FE): ⊕ Idempotency-Key /orders · ⊕ Dedup webhook thanh toán (event_id) · ⊕ Outbox pattern (order_event cùng transaction, relay publish) · ⊕ Retry exactly-once trừ kho (unique constraint event_id) · ⊕ UI retry-safe (FE: idempotency key, chống double-submit)
**M15 advanced-search** (BE + 1 FE): ⊕ Full-text tsvector+GIN (trigger, to-tsquery) · ⊕ Faceted+counts (filter category/brand/price + đếm facet) · ⊕ Autocomplete suggest (trigram/ts_headline prefix) · ⊕ Ranking ts_rank+keyset pagination · ⊕ UI search bar+facet+suggest (FE)
**M16 advanced-authentication** (BE + 1 FE): ⊕ OAuth social (Google/GitHub callback) · ⊕ 2FA TOTP (setup QR, verify) · ⊕ Quản lý phiên (list/revoke per-device) · ⊕ Reset password (token email, revoke phiên cũ) · ⊕ UI bảo mật TK (FE)
**M17 media-pipeline** (BE + 1 FE): ⊕ Upload+validate (multipart, mime/size, media record) · ⊕ Resize thumbnail sharp (worker queue sm/md/lg webp) · ⊕ Signed URL (chống hotlink) · ⊕ UI ảnh responsive lazy (FE: srcset/sizes, blur placeholder) · ⊕ **[thêm task 5]** Image CDN cache/transform on-the-fly hoặc EXIF strip+optimize (đề xuất cho đủ 5)

## Lô D — M18-M20 (security + perf + ship)
**M18 security-hardening** (BE per-lang): ⊕ Input validation+SQLi/XSS defense · ⊕ CSRF+secure cookies (double-submit, SameSite/HttpOnly) · ⊕ Rate-limit+brute-force guard (429) · ⊕ Helmet/CSP/CORS lockdown · ⊕ Secrets mgmt+config hygiene (fail-fast, redact logs)
**M19 advanced-frontend-and-performance** (FE): ⊕ RSC+Suspense streaming product page · ⊕ Optimistic cart/wishlist (rollback+toast) · ⊕ Infinite scroll (IntersectionObserver+cursor) · ⊕ Virtualized long lists (60fps) · ⊕ Code-splitting+bundle budget (dynamic import)
**M20 observability-testing-and-deploy** (BE + FE): ⊕ Structured logging+request tracing (correlation id, redact PII) · ⊕ Sentry error tracking (BE+FE, release tags, sourcemap) · ⊕ BE test suite (unit + integration test DB) · ⊕ Playwright e2e checkout flow · ⊕ Docker+CI/CD deploy VPS (multi-stage, health-checked rollout)
