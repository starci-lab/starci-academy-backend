export const meta = {
  name: 'fs-build-batch',
  description: 'Author FS personal-project milestone tasks (gold-format, 4-lang or ts-only) for one batch of 5 milestones',
  phases: [{ title: 'Build' }],
}

const ROOT = '.mount/data/courses/0-fullstack-mastery/milestones'
const GOLD = `${ROOT}/12-flash-sale-and-concurrency-control/tasks/0-oversell-proof-with-pessimistic-lock`

// ── Full 20-milestone task spec. langs: "4" = TS/Java/C#/Go backend; "ts" = single typescript (React/Next FE or agnostic infra).
// Each task: { slug, langs, et (en title), vt (vi title), ed (en desc), vd (vi desc), critical (what the critical criteria assert), spec (what to build + key tech + advanced) }
const MILESTONES = [
  { i: 0, folder: '0-project-foundation', tasks: [
    { slug: '0-clean-architecture-and-health', langs: '4', et: 'Clean Architecture + Health Endpoint', vt: 'Kiến Trúc Sạch + Endpoint Health', critical: 'GET /health returns 200 with a real liveness JSON; structure separates http/domain/data layers',
      spec: 'Scaffold the backend with a clean layered structure (http/controller, domain/service, data/repo) and a GET /health liveness endpoint returning 200 {"status":"ok"}. Advanced: graceful shutdown, dependency-injection boundaries, env-based bootstrap.' },
    { slug: '1-typed-config-and-structured-logging', langs: '4', et: 'Typed Config + Structured Logging', vt: 'Config Có Kiểu + Structured Logging', critical: 'config is validated at boot (fails fast on missing vars); logs are structured JSON with a request id',
      spec: '12-factor typed config validated at startup (zod/Joi / @ConfigurationProperties / Options / env struct) and structured JSON logging (pino/winston, Logback JSON, Serilog, zap) with per-request correlation id. Advanced: redact secrets, log levels per env, fail-fast on invalid config.' },
    { slug: '2-postgres-orm-and-migration', langs: '4', et: 'PostgreSQL + ORM + Migrations', vt: 'PostgreSQL + ORM + Migration', critical: 'a single pooled DataSource is shared; schema is created via a real migration (not synchronize)',
      spec: 'Integrate PostgreSQL via an ORM with ONE shared pooled connection and a real migration creating the first table. Advanced: pool sizing, migration up/down, transactional bootstrap, connection retry/backoff.' },
  ]},
  { i: 1, folder: '1-authentication-and-authorization', tasks: [
    { slug: '0-user-entity-and-password-hash', langs: '4', et: 'User Entity + Password Hashing', vt: 'Entity User + Hash Mật Khẩu', critical: 'passwords are stored only as an argon2id/bcrypt hash, never plaintext or a reversible form',
      spec: 'User entity + register storing argon2id (or bcrypt) hashes with per-user salt. Advanced: tuned work factor, timing-safe compare, pepper, migration-friendly hash upgrades.' },
    { slug: '1-jwt-register-and-login', langs: '4', et: 'JWT Register & Login', vt: 'Đăng Ký & Đăng Nhập JWT', critical: 'login verifies the hash and issues a signed JWT; wrong password returns 401, never a token',
      spec: 'Register + login issuing a signed access JWT (short TTL). Advanced: asymmetric signing (RS256), claims design, clock-skew tolerance, login throttling.' },
    { slug: '2-refresh-rotation-and-rbac', langs: '4', et: 'Refresh Rotation + RBAC', vt: 'Refresh Rotation + RBAC', critical: 'refresh tokens rotate on use and a reused (revoked) token is rejected; protected routes enforce role',
      spec: 'Refresh-token rotation with reuse-detection (revoke family on replay) + role-based guards on protected routes. Advanced: token family tracking, httpOnly cookie storage, RBAC policy layer, logout-all.' },
  ]},
  { i: 2, folder: '2-product-catalog', tasks: [
    { slug: '0-product-entity-seed-and-pagination', langs: '4', et: 'Product Entity, Seed & Pagination', vt: 'Entity Sản Phẩm, Seed & Phân Trang', critical: 'GET /products is paginated (limit/offset or page) and returns total + items, never the whole table',
      spec: 'Product entity, seed data, and a paginated list endpoint. Advanced: stable sort, total count strategy, DTO shaping, N+1-free includes.' },
    { slug: '1-image-upload-s3-minio', langs: '4', et: 'Image Upload to S3/MinIO', vt: 'Upload Ảnh Lên S3/MinIO', critical: 'images upload to S3/MinIO (presigned or streamed), the stored URL is returned, content-type/size validated',
      spec: 'Upload product images to S3/MinIO via presigned URL or streamed multipart, validating content-type and size. Advanced: presigned PUT, virus/extension allowlist, multipart for large files, CDN URL.' },
    { slug: '2-category-and-variant', langs: '4', et: 'Categories & Variants', vt: 'Danh Mục & Biến Thể', critical: 'products belong to a category and expose variants (e.g. size/color) with their own stock/price',
      spec: 'Category relation + product variants (size/color) each with own SKU/price/stock. Advanced: nested-set/closure-table categories, variant matrix, unique SKU constraints.' },
  ]},
  { i: 3, folder: '3-cart-and-orders', tasks: [
    { slug: '0-cart-api-per-user', langs: '4', et: 'Per-User Cart API', vt: 'API Giỏ Hàng Theo User', critical: 'each user has an isolated cart; add/update/remove mutate only that user’s cart',
      spec: 'Per-user cart with add/update/remove line items. Advanced: merge guest cart on login, price snapshotting, quantity caps, optimistic UI contract.' },
    { slug: '1-order-creation-in-transaction', langs: '4', et: 'Order Creation in a Transaction', vt: 'Tạo Đơn Trong Transaction', critical: 'an order + its items + stock decrement all commit in ONE transaction; any failure rolls back fully',
      spec: 'Create an order from the cart atomically: insert order + items + decrement stock in a single transaction. Advanced: isolation level, partial-failure rollback, order total recomputation server-side.' },
    { slug: '2-order-history', langs: '4', et: 'Order History API', vt: 'API Lịch Sử Đơn', critical: 'GET /orders returns only the authenticated user’s orders, paginated, with items',
      spec: 'Paginated order history scoped to the user with line items + status. Advanced: cursor pagination, eager item loading without N+1, status filter.' },
  ]},
  { i: 4, folder: '4-async-and-realtime', tasks: [
    { slug: '0-background-jobs-bullmq', langs: '4', et: 'Background Jobs (BullMQ)', vt: 'Background Job (BullMQ)', critical: 'order post-processing runs in a queued worker, not in the request; the job retries on failure',
      spec: 'Offload order post-processing to a BullMQ (or lang equivalent: Spring @Async/Quartz, Hangfire, asynq) worker with retry + backoff. Advanced: idempotent jobs, dead-letter, concurrency control, graceful drain.' },
    { slug: '1-email-and-sms-notifications', langs: '4', et: 'Email & SMS Notifications', vt: 'Thông Báo Email & SMS', critical: 'an order confirmation is sent via a real provider (SendGrid/Twilio) from the worker, not the request path',
      spec: 'Send order-confirmation email (SendGrid) + SMS (Twilio) from the worker. Advanced: template rendering, provider failover, rate caps, send-once via job idempotency.' },
    { slug: '2-realtime-order-status-websocket', langs: '4', et: 'Realtime Order Status (WebSocket)', vt: 'Trạng Thái Đơn Realtime (WebSocket)', critical: 'order status changes push to the owning user over a WebSocket room; other users do not receive it',
      spec: 'Push order-status updates over Socket.IO (or lang WS) into a per-user room. Advanced: auth handshake, room scoping, reconnect/resume, backpressure.' },
  ]},
  { i: 5, folder: '5-storefront-frontend', tasks: [
    { slug: '0-heroui-app-shell', langs: 'ts', et: 'HeroUI App Shell', vt: 'App Shell HeroUI', critical: 'the shell renders a navbar labelled "App", routes work, and the theme/providers wrap the tree',
      spec: 'Next.js + HeroUI v3 app shell: navbar ("App" left), providers, layout. FE only (typescript). Advanced: RSC layout boundaries, font/optimization, provider composition. Include a ```layout widget mockup.' },
    { slug: '1-product-list-filter-and-detail', langs: 'ts', et: 'Product List, Filter & Detail', vt: 'Danh Sách, Lọc & Chi Tiết SP', critical: 'the list fetches via TanStack Query, filters drive the URL (shareable), detail loads by id',
      spec: 'Product grid with TanStack Query, URL-synced filters, and a detail page (RSC). Advanced: query keys/cache, URL state, suspense boundaries, prefetch on hover. Include ```layout widgets.' },
    { slug: '2-frontend-performance', langs: 'ts', et: 'Frontend Performance', vt: 'Hiệu Năng Frontend', critical: 'images use next/image, heavy components are memoized/code-split, and a measured budget is documented',
      spec: 'Tune the storefront: next/image, memoization, code-splitting, measured Lighthouse/Web-Vitals budget. Advanced: bundle analysis, route-level splitting, image priority/LCP.' },
  ]},
  { i: 6, folder: '6-checkout-and-account-frontend', tasks: [
    { slug: '0-auth-ui-and-route-guard', langs: 'ts', et: 'Auth UI + Route Guard', vt: 'UI Auth + Route Guard', critical: 'unauthenticated users hitting a protected route are redirected; the login form calls the API and stores the session',
      spec: 'Mono shadcn-style login/register UI + a route guard that blocks protected pages when unauthenticated. Advanced: token refresh on 401, redirect-back, server-side guard. Include ```layout widgets for the login form + navbar.' },
    { slug: '1-cart-state-and-checkout-form', langs: 'ts', et: 'Cart State + Checkout Form', vt: 'State Giỏ Hàng + Form Checkout', critical: 'cart state persists (Zustand persist) and the checkout form validates with Zod before submit',
      spec: 'Cart client-state with Zustand persist + a React-Hook-Form + Zod checkout form that gates submit on validation. Advanced: schema-driven errors, optimistic add-to-cart, hydration-safe persistence. Include ```layout widget.' },
    { slug: '2-orders-ui-with-realtime', langs: 'ts', et: 'Orders UI with Realtime', vt: 'UI Đơn Hàng + Realtime', critical: 'the orders page lists the user’s orders and updates status live from the WebSocket',
      spec: 'Orders list UI subscribing to the realtime status socket. Advanced: optimistic status, reconnect handling, list virtualization. Include ```layout widget.' },
  ]},
  { i: 7, folder: '7-admin-dashboard', tasks: [
    { slug: '0-product-crud-admin', langs: 'ts', et: 'Product CRUD (Admin)', vt: 'CRUD Sản Phẩm (Admin)', critical: 'admin can create/edit/delete products through forms that call the API and reflect results',
      spec: 'Admin product CRUD UI (table + form). Advanced: optimistic mutations, server-action vs client, form reuse. Include ```layout widget.' },
    { slug: '1-order-management', langs: 'ts', et: 'Order Management', vt: 'Quản Lý Đơn', critical: 'admin can view all orders and change status, and the change persists via the API',
      spec: 'Admin order list + status transitions. Advanced: bulk actions, filters, audit trail. Include ```layout widget.' },
    { slug: '2-role-gated-admin-access', langs: 'ts', et: 'Role-Gated Admin Access', vt: 'Chặn Admin Theo Role', critical: 'non-admin users cannot reach admin pages (guard redirects) and admin-only API calls are rejected server-side',
      spec: 'Gate the whole admin area behind an admin role on both client (guard) and server (API). Advanced: middleware-based gate, 403 vs redirect, least-privilege. Include ```layout widget.' },
  ]},
  { i: 8, folder: '8-ui-polish-and-accessibility', tasks: [
    { slug: '0-toast-dialog-darkmode-i18n', langs: 'ts', et: 'Toasts, Dialogs, Dark Mode, i18n', vt: 'Toast, Dialog, Dark Mode, i18n', critical: 'toasts/dialogs work, dark mode toggles and persists, and copy is translated via i18n (no hardcoded strings)',
      spec: 'Toast + dialog system, persisted dark mode, next-intl i18n with no hardcoded user-facing strings. Advanced: theme without flash (FOUC), locale routing, a11y-friendly dialogs. Include ```layout widget.' },
    { slug: '1-keyboard-aria-and-interaction', langs: 'ts', et: 'Keyboard, ARIA & Interaction', vt: 'Keyboard, ARIA & Tương Tác', critical: 'interactive widgets (dnd-kit/cmdk) are keyboard-operable and expose correct ARIA roles/focus management',
      spec: 'Accessible interactions: a dnd-kit reorder or cmdk palette, full keyboard nav, focus trap, ARIA roles. Advanced: roving tabindex, screen-reader labels, focus restoration. Include ```layout widget.' },
  ]},
  { i: 9, folder: '9-payment-integration', tasks: [
    { slug: '0-gateway-checkout', langs: '4', et: 'Payment Gateway Checkout', vt: 'Checkout Qua Cổng Thanh Toán', critical: 'checkout creates a real gateway payment intent/session (Stripe/PayOS) and the order ties to its reference',
      spec: 'Create a payment via Stripe/PayOS and link the order to the gateway reference. Advanced: intent vs session, currency/amount integrity server-side, 3DS handling.' },
    { slug: '1-webhook-signature-verification', langs: '4', et: 'Webhook Signature Verification', vt: 'Xác Minh Chữ Ký Webhook', critical: 'the webhook verifies the provider HMAC signature and rejects forged/altered payloads before acting',
      spec: 'Verify the gateway webhook HMAC signature on the raw body before marking paid. Advanced: raw-body capture, replay window, constant-time compare, idempotent handling.' },
    { slug: '2-refund-and-double-entry-ledger', langs: '4', et: 'Refund + Double-Entry Ledger', vt: 'Hoàn Tiền + Sổ Kép', critical: 'every money movement is recorded as balanced double-entry rows; refunds reconcile and never lose money',
      spec: 'Record payments/refunds as balanced double-entry ledger rows that always sum to zero. Advanced: immutable ledger, refund partials, reconciliation report, integrity invariant check.' },
  ]},
  { i: 10, folder: '10-database-indexing-and-query-optimization', tasks: [
    { slug: '0-composite-and-partial-indexes', langs: '4', et: 'Composite & Partial Indexes', vt: 'Composite & Partial Index', critical: 'a slow query is sped up by a composite/partial index proven via EXPLAIN showing an index scan (not seq scan)',
      spec: 'Add composite/partial indexes matching real query predicates and prove the plan change with EXPLAIN. Advanced: column order, covering index (INCLUDE), partial WHERE, index bloat awareness.' },
    { slug: '1-explain-analyze-and-kill-n-plus-1', langs: '4', et: 'EXPLAIN ANALYZE + Kill N+1', vt: 'EXPLAIN ANALYZE + Giết N+1', critical: 'an N+1 access pattern is found and replaced by a single joined/batched query, proven by query count/EXPLAIN',
      spec: 'Diagnose an N+1 with EXPLAIN ANALYZE / query logs and fix it with a join or batched load. Advanced: dataloader/batching, eager vs lazy, query-count assertions in tests.' },
    { slug: '2-keyset-cursor-pagination', langs: '4', et: 'Keyset (Cursor) Pagination', vt: 'Phân Trang Keyset (Cursor)', critical: 'listing uses keyset/seek pagination (WHERE id < cursor) instead of OFFSET, stable under inserts',
      spec: 'Replace OFFSET pagination with keyset/seek pagination using an indexed cursor. Advanced: composite cursors, stable ordering ties, bidirectional paging.' },
  ]},
  { i: 11, folder: '11-caching-with-redis', tasks: [
    { slug: '0-cache-aside-with-ttl', langs: '4', et: 'Cache-Aside with TTL', vt: 'Cache-Aside Với TTL', critical: 'reads check Redis first, fill on miss with a TTL, and a cache hit avoids the DB (proven by logs/metrics)',
      spec: 'Cache-aside read path for a hot endpoint with TTL. Advanced: key design, serialization, negative caching, TTL jitter.' },
    { slug: '1-stampede-protection-singleflight', langs: '4', et: 'Cache Stampede Protection', vt: 'Chống Cache Stampede', critical: 'on a hot-key miss under concurrency, only ONE rebuild hits the DB (singleflight/lock), not N',
      spec: 'Prevent stampede with a per-key lock / singleflight / request-coalescing so a cold hot-key triggers one rebuild. Advanced: probabilistic early expiry, lock TTL, stale-while-revalidate.' },
    { slug: '2-invalidation-and-http-cache', langs: '4', et: 'Invalidation + HTTP Caching', vt: 'Invalidation + HTTP Cache', critical: 'a write invalidates the affected cache keys, and responses carry correct ETag/Cache-Control',
      spec: 'Invalidate cache on write + add ETag/Cache-Control for client/CDN caching. Advanced: tag-based invalidation, conditional GET (304), cache versioning.' },
  ]},
  { i: 12, folder: '12-flash-sale-and-concurrency-control', tasks: [
    { slug: '1-optimistic-version-lock', langs: '4', et: 'Optimistic Version Locking', vt: 'Khoá Lạc Quan (Version)', critical: 'concurrent updates use a version column; a stale update is rejected and retried, no lost update',
      spec: 'Implement optimistic locking with a version column (UPDATE ... WHERE version = $old) + bounded retry, contrasting with the pessimistic lock of task 0. Advanced: retry budget, jitter, when optimistic beats pessimistic.' },
    { slug: '2-redis-atomic-decrement', langs: '4', et: 'Redis Atomic Decrement (Lua)', vt: 'Trừ Kho Atomic Redis (Lua)', critical: 'stock is gated by an atomic Redis DECR / Lua script so oversell is blocked before the DB, then reconciled',
      spec: 'Use an atomic Redis counter / Lua script as an admission gate that prevents oversell before the DB, then reconcile to Postgres. Advanced: Lua atomicity, reconciliation/outbox to DB, drift detection.' },
  ]},
  { i: 13, folder: '13-idempotency-and-reliability', tasks: [
    { slug: '0-idempotency-key-endpoint', langs: '4', et: 'Idempotency-Key Endpoint', vt: 'Endpoint Idempotency-Key', critical: 'a repeated request with the same Idempotency-Key returns the original result and does NOT double-charge/double-create',
      spec: 'Accept an Idempotency-Key header, store the first result, and replay it for duplicates. Advanced: key TTL, in-flight collision handling, scope per user+route.' },
    { slug: '1-webhook-dedup', langs: '4', et: 'Webhook Deduplication', vt: 'Dedup Webhook', critical: 'a redelivered webhook (same event id) is processed at most once',
      spec: 'Deduplicate provider webhooks by event id so redelivery is a no-op. Advanced: processed-events table, unique constraint, exactly-once side effects.' },
    { slug: '2-outbox-pattern', langs: '4', et: 'Transactional Outbox', vt: 'Transactional Outbox', critical: 'state change + an outbox row commit in one transaction; a relay publishes the event without dual-write loss',
      spec: 'Write domain change + an outbox event in the same transaction, with a relay that publishes and marks sent. Advanced: at-least-once relay, poller vs CDC, ordering, cleanup.' },
  ]},
  { i: 14, folder: '14-advanced-search', tasks: [
    { slug: '0-postgres-full-text-tsvector', langs: '4', et: 'Postgres Full-Text Search', vt: 'Full-Text Search Postgres', critical: 'search uses a tsvector column + GIN index (to_tsquery), not LIKE %x%, and ranks by relevance',
      spec: 'Full-text search with a generated tsvector column + GIN index and ranked results (ts_rank). Advanced: weights (title vs body), trigram fallback, language config, index maintenance.' },
    { slug: '1-faceted-filtering', langs: '4', et: 'Faceted Filtering', vt: 'Lọc Faceted', critical: 'search returns facet counts (category/price buckets) alongside results that match the active filters',
      spec: 'Faceted filtering returning bucket counts + filtered results in one round. Advanced: efficient aggregate queries, multi-select facets, count accuracy under filters.' },
    { slug: '2-autocomplete-and-relevance', langs: '4', et: 'Autocomplete + Relevance', vt: 'Autocomplete + Độ Liên Quan', critical: 'a prefix query returns ranked suggestions fast (indexed prefix / trie / edge-ngram), debounced on the client',
      spec: 'Prefix autocomplete (indexed prefix or trigram/edge-ngram) with ranked suggestions. Advanced: trie structure, typo tolerance, popularity boost, debounce contract.' },
  ]},
  { i: 15, folder: '15-advanced-authentication', tasks: [
    { slug: '0-oauth-google-login', langs: '4', et: 'OAuth Google Login', vt: 'Đăng Nhập OAuth Google', critical: 'the OAuth authorization-code flow exchanges the code server-side, verifies state, and links/creates a user',
      spec: 'Google OAuth2 authorization-code flow: redirect, state check, server-side code exchange, account link/create. Advanced: PKCE, state/nonce, account linking by verified email.' },
    { slug: '1-two-factor-totp', langs: '4', et: 'Two-Factor (TOTP)', vt: 'Xác Thực Hai Lớp (TOTP)', critical: 'TOTP enrolment stores a secret, and login requires a valid 6-digit code within the time window',
      spec: 'TOTP 2FA: enrol (QR/secret), verify codes with a time window, recovery codes. Advanced: drift window, replay prevention, encrypted secret at rest, backup codes.' },
    { slug: '2-session-management-and-password-reset', langs: '4', et: 'Sessions + Password Reset', vt: 'Quản Lý Phiên + Reset Mật Khẩu', critical: 'a password-reset uses a single-use, time-limited token; sessions can be listed and revoked',
      spec: 'Session listing/revocation + password reset via single-use expiring token emailed to the user. Advanced: token hashing at rest, invalidate sessions on reset, device/session metadata.' },
  ]},
  { i: 16, folder: '16-media-pipeline', tasks: [
    { slug: '0-image-resize-and-thumbnails', langs: '4', et: 'Image Resize & Thumbnails', vt: 'Resize Ảnh & Thumbnail', critical: 'an uploaded image is processed into multiple sized variants (sharp / ImageSharp / imaging / bimg) and stored',
      spec: 'Process uploads into resized/thumbnail variants (sharp in TS; equivalents per lang) off the request path. Advanced: format conversion (webp/avif), strip metadata, async via worker, dimension limits.' },
    { slug: '1-signed-url-delivery', langs: '4', et: 'Signed-URL Delivery', vt: 'Phân Phối Signed-URL', critical: 'media is served via short-lived signed URLs; an expired/forged URL is rejected',
      spec: 'Serve media through time-limited signed URLs (S3 presigned / HMAC). Advanced: expiry tuning, per-object scope, CDN signing, hotlink protection.' },
    { slug: '2-responsive-lazy-images-fe', langs: 'ts', et: 'Responsive Lazy Images (FE)', vt: 'Ảnh Responsive Lazy (FE)', critical: 'the frontend renders srcset/sizes responsive images with lazy loading and correct LCP priority',
      spec: 'Render responsive images (srcset/sizes, next/image) with lazy loading and LCP priority on the hero. FE typescript. Advanced: blur placeholder, priority hints, CLS avoidance. Include ```layout widget.' },
  ]},
  { i: 17, folder: '17-security-hardening', tasks: [
    { slug: '0-xss-csrf-sqli-defense', langs: '4', et: 'XSS / CSRF / SQLi Defense', vt: 'Phòng Thủ XSS / CSRF / SQLi', critical: 'inputs are validated/escaped, queries are parameterized (no string-built SQL), and state-changing routes need a CSRF token',
      spec: 'Defend the OWASP basics: input validation + output encoding (XSS), parameterized queries (SQLi), CSRF tokens / SameSite for state-changing routes. Advanced: content sanitization, prepared statements everywhere, double-submit cookie.' },
    { slug: '1-app-rate-limiting', langs: '4', et: 'Application Rate Limiting', vt: 'Rate-Limit Ứng Dụng', critical: 'an abuse-prone route enforces a per-identity rate limit returning 429 with Retry-After when exceeded',
      spec: 'Per-identity rate limiting (throttler / bucket) on login & sensitive routes, returning 429 + Retry-After. Advanced: sliding window, per-route policy, distributed counter note (defer to SD), header standards.' },
    { slug: '2-helmet-csp-and-secrets', langs: '4', et: 'Helmet/CSP + Secrets', vt: 'Helmet/CSP + Secrets', critical: 'security headers + a real CSP are set, and secrets load from env/Vault (never committed)',
      spec: 'Security headers (Helmet/equivalent) + a real Content-Security-Policy, and secrets sourced from env/Vault. Advanced: CSP nonces, HSTS, secret rotation, no secrets in logs.' },
  ]},
  { i: 18, folder: '18-advanced-frontend-and-performance', tasks: [
    { slug: '0-rsc-streaming-and-suspense', langs: 'ts', et: 'RSC Streaming + Suspense', vt: 'RSC Streaming + Suspense', critical: 'a page streams server components with Suspense boundaries so above-the-fold renders before slow data resolves',
      spec: 'Stream React Server Components with Suspense so the shell paints before slow data. Advanced: granular boundaries, loading.tsx, parallel data, selective hydration. Include ```layout widget.' },
    { slug: '1-optimistic-ui-updates', langs: 'ts', et: 'Optimistic UI Updates', vt: 'Cập Nhật UI Lạc Quan', critical: 'a mutation updates the UI immediately and rolls back on error (useOptimistic / TanStack optimistic)',
      spec: 'Optimistic mutation (add-to-cart/like) with rollback on failure. Advanced: cache reconciliation, race handling, useOptimistic vs manual. Include ```layout widget.' },
    { slug: '2-infinite-scroll-virtualization-codesplit', langs: 'ts', et: 'Infinite Scroll + Virtualization', vt: 'Infinite Scroll + Virtualization', critical: 'a long list uses infinite query + windowed virtualization so the DOM node count stays bounded',
      spec: 'Infinite scroll (useInfiniteQuery) + windowed virtualization + route code-splitting for a large catalog. Advanced: scroll restoration, prefetch threshold, bounded DOM. Include ```layout widget.' },
  ]},
  { i: 19, folder: '19-observability-testing-and-deploy', tasks: [
    { slug: '0-structured-logs-and-sentry', langs: '4', et: 'Structured Logs + Sentry', vt: 'Structured Log + Sentry', critical: 'errors report to Sentry with context, and logs are structured + correlated by request id',
      spec: 'Wire Sentry error reporting + structured correlated logs across the request lifecycle. Advanced: trace/span correlation, release health, PII scrubbing, sampling.' },
    { slug: '1-vitest-playwright-e2e', langs: 'ts', et: 'Vitest + Playwright E2E', vt: 'Vitest + Playwright E2E', critical: 'a unit/integration suite (Vitest) and a happy-path Playwright e2e both run green in CI',
      spec: 'Unit/integration with Vitest + a Playwright e2e covering login→buy. Advanced: test data seeding, MSW mocking, CI parallelism, flake control.' },
    { slug: '2-docker-cicd-and-vps-deploy', langs: 'ts', et: 'Docker + CI/CD + VPS Deploy', vt: 'Docker + CI/CD + Deploy VPS', critical: 'a multi-stage Docker image builds in CI (GitHub Actions) and the app is deployed behind nginx + TLS on a VPS',
      spec: 'Multi-stage Dockerfile + docker-compose, a GitHub Actions build/deploy pipeline, and a VPS deploy behind nginx + certbot TLS. Agnostic/infra (documented as typescript track). Advanced: layer caching, healthcheck, zero-downtime reload, secrets in CI.' },
  ]},
]

function buildPrompt(m, t) {
  const langLine = t.langs === '4'
    ? 'FOUR language blocks in this exact order: typescript, java, csharp, go (## 0 typescript, ## 1 java, ## 2 csharp, ## 3 go). Each lang block scores sum to exactly 100 (outcome 30 = 3×10, approach 70 = 40+15+15).'
    : 'ONE language block only: ## 0 with lang `typescript` (this is a frontend / agnostic task — do NOT invent Java/C#/Go). The single block scores sum to exactly 100 (outcome 30 = 3×10, approach 70 = 40+15+15).'
  return `You are authoring ONE task for the StarCi "Personal Project V2" Fullstack course. Write TWO files (vi.md in Vietnamese, en.md in English — perfect mirrors) following the GOLD template EXACTLY.

GOLD TEMPLATE (read BOTH files first, copy their structure/grammar precisely):
- ${GOLD}/en.md
- ${GOLD}/vi.md

TARGET FILES (create them):
- ${ROOT}/${m.folder}/tasks/${t.slug}/en.md
- ${ROOT}/${m.folder}/tasks/${t.slug}/vi.md

TASK META:
- en title: ${t.et}
- vi title: ${t.vt}
- orderIndex: ${t.slug.split('-')[0]}
- type: techIntegrate ; weight: 2 ; maxScore: 100 ; verified: 2026-06-10
- description: write a 1-2 sentence en/vi description of exactly what to build.

WHAT TO BUILD (spec): ${t.spec}
CRITICAL CRITERIA (the critical=true items must assert): ${t.critical}

LANGUAGES: ${langLine}

EACH lang \`### body\` MUST use this callout structure (mono, like gold), in this order:
1. \`:::muted\\nMục tiêu\\n:::\` (vi) / \`Goal\` (en) — what + why, 1 short paragraph.
2. \`:::muted\\nCác bước (làm theo thứ tự)\\n:::\` (vi) / \`Steps (in order)\` (en) — a SEQUENTIAL hands-on CODE GUIDE for THIS task: **Bước 1..N / Step 1..N**, each step has its own real, runnable code block in that language, a file layout (\`\`\`text), and — if the task has UI — a \`\`\`layout HTML widget (mono shadcn Tailwind: rounded-3xl, border, bg-black text-white, text-neutral-500). Build the feature step by step.
3. \`:::muted\\nGiải pháp\\n:::\` (vi) / \`Solution\` (en) — the key sentence + mechanism (what + how), code if needed.
4. \`:::muted\\nTrade-off\\n:::\` — trade-offs, cost, when NOT to use (compare alternatives).
5. \`:::muted\\nCạm bẫy & Failure-mode\\n:::\` (vi) / \`Pitfalls & failure modes\` (en) — real bugs, what breaks if done wrong.
6. \`:::muted\\nNâng cao (gợi ý)\\n:::\` (vi) / \`Advanced (suggestions)\` (en) — production-grade upgrades.

CRITERIA (after each \`### body\`): \`### outcome\` with #### 0/1/2 (scores 10/10/10) then \`### approach\` with #### 0/1/2 (scores 40/15/15). Each criterion has ##### body, ##### score, ##### critical. Make outcome[0]=true critical AND approach[0]=true critical (assert the CRITICAL line above). outcome = observable behavior (HTTP status, JSON, live result). approach = read-the-code (mechanism present). approach[2] always = "Evidence and documentation: README documents run command + pastes a REAL terminal/test smoke output ... (Screenshots optional, NOT graded)". Outcome criteria text is identical across langs; approach[0] is lang-specific (names the lang's mechanism).

GRAMMAR (mount format — copy gold exactly): top fields \`# title / # description / # type / # weight / # orderIndex / # maxScore / # verified\` each value wrapped in \`<!-- @starci/seperator -->\` lines. Then \`# criterias\`, \`## N\` per lang, \`### lang\` / \`### body\` (value separator-wrapped), \`### outcome\` / \`#### N\` / \`##### body|score|critical\`, \`### approach\` likewise. EVERY leaf value is wrapped by a \`<!-- @starci/seperator -->\` before and after.

RULES: The app is just "App" / "the shop" — NEVER "StarCi Shop" or any brand/logo. Code comments in English only. vi.md fully Vietnamese with diacritics; en.md fully English; they must mirror (same # of lang blocks, callouts, criteria, separators). Real, correct, idiomatic code per language. No placeholder/TODO.

After writing both files, self-check: each lang block scores total 100; ≥1 critical=true per outcome and per approach; ≥6 :::muted callouts per lang; vi/en mirror; zero "StarCi Shop". Then return a one-line status: "OK ${m.folder}/${t.slug}" or "FIX <what>".`
}

// ── run: process this batch's milestones, tasks chunked 2-concurrent to stay well under rate limits.
const batch = (args && typeof args.batch === 'number') ? args.batch : 0
const slice = MILESTONES.filter((m) => m.i >= batch * 5 && m.i < batch * 5 + 5)
const tasks = []
for (const m of slice) for (const t of m.tasks) tasks.push({ m, t })

phase('Build')
log(`Batch ${batch}: ${slice.length} milestones, ${tasks.length} tasks`)
const out = []
for (let k = 0; k < tasks.length; k += 2) {
  const chunk = tasks.slice(k, k + 2)
  const res = await parallel(chunk.map(({ m, t }) => () =>
    agent(buildPrompt(m, t), { label: `${m.folder}/${t.slug}`, phase: 'Build' })))
  out.push(...res)
  log(`done ${Math.min(k + 2, tasks.length)}/${tasks.length}`)
}
return { batch, tasks: tasks.length, results: out.filter(Boolean).length }
