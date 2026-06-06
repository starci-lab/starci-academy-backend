# V2 Migration Context — M15, M16, M17 (cả 2 khóa)

> Extract 2026-06-05 từ code repo qua Explore agents. Feed cho workflow gen content V2.
> Pipeline: roots + bodies(lesson×lang) + challenge submissions + code-context.md + audited.md + gate.

## Mapping & Classification

| Module | Slot | Repo | Loại | Lessons |
|---|---|---|---|---|
| SD M15 Search | 14-distributed-search-autocomplete-system | system-design-mastery-module-15-... | **4-lang heavy** | 3 |
| SD M16 RateLimiter | 15-distributed-rate-limiter | system-design-mastery-module-16-... | **4-lang heavy** | 3 |
| SD M17 FileStorage | 16-distributed-file-storage-content-delivery-network | system-design-mastery-module-17-... | **4-lang heavy** | 3 |
| FS M15 UIPolish | 14-ui-polish-techniques | fullstack-mastery-module-15-... | **agnostic light** (FE-only) | 4 |
| FS M16 Interaction | 15-interaction-and-accessibility | fullstack-mastery-module-16-... | **agnostic light** (FE-only) | 4 |
| FS M17 Observability | 16-observability-logs-tracing-errors | fullstack-mastery-module-17-... | **4-lang heavy** (Tier 5 BE) | 4 |

**4 heavy (SD M15/M16/M17 + FS M17) + 2 light (FS M15/M16).** Rule §1.5: ≤2 heavy 4-lang song song → migrate theo 2 batch:
- **Batch A:** SD M15 + SD M16 (heavy) + FS M15 + FS M16 (light) — 2 heavy OK.
- **Batch B:** SD M17 + FS M17 (heavy) — 2 heavy OK.

**Premium (1-2 lesson cuối):** SD (3 lesson) → L2. FS (4 lesson) → L2+L3.

**⚠️ isSandbox=false cho module Next.js:** FS M15 (UIPolish) + M16 (Interaction) là Next.js → sandbox KHÔNG chạy được (Sandpack/Vite không render Next.js App Router). Khi migrate set `# isSandbox=false` (giống M13/M14 đã làm 2026-06-05). Chỉ module Vite-able mới isSandbox=true.
**Lang model 4-lang:** `0-typescript / 1-java / 2-csharp / 3-go`. Code=Opus, root/sub/ctx/aud=Sonnet.

## ⚠️ PRE-FLIGHT challenge fixes (làm TRƯỚC khi gen)

- **SD M17 L1** (`1-data-deduplication-and-resumable-uploads`): CHỈ có `2-...-hard` + `3-...-insane`, **THIẾU easy(0) + medium(1)**. → cần AUTHOR mới 2 challenge easy/medium (content task, không phải rename).
- **SD M17 L2** (`2-global-cdn-distribution`): có DUPLICATE `2-global-cdn-distribution-easy` trùng index 2 với `2-multi-region-cdn-...-hard`. Folder hiện tại: 0-easy, 1-medium, **2-easy (DUP)**, 2-...-hard, 3-insane. → xóa/merge `2-global-cdn-distribution-easy`, giữ 0/1/2-hard/3-insane (deterministic).
- Các module khác: challenge 4-tier đầy đủ, OK.

---

## SD M15 — Distributed Search & Autocomplete (4-lang, 3 lesson, premium L2)

### L0 `0-inverted-index-and-bm25-from-scratch` — bm25-search-service
- Stack: NestJS + Redis (JSON snapshot persist, AOF). Port 3000 (test 3019).
- Endpoints: `GET /api/search?q=&limit=` → `{query,hits:[{id,score,content}]}` (BM25 k1=1.2 b=0.75); `GET /api/search/stats` → `{numDocs,vocabSize,avgdl}`; `POST /api/search/index {id,content}`; `DELETE /api/search/index/:id`; `POST /api/search/reset`.
- Concepts: inverted index (term→posting list), BM25 TF-IDF, length normalization, tokenization, Redis snapshot persist.
- Seed: 12 docs (ML/search/food/sports/distsys). E2E 5/5 PASS (multiterm IDF ranking, persist qua restart, delete cleanup).

### L1 `1-vector-search-with-embeddings` — vector-search-service
- Stack: NestJS + Postgres16 + pgvector + HNSW + @xenova/transformers (all-MiniLM-L6-v2, 384-dim). Port 3000 (test 3020).
- Endpoints: `GET /api/search?q=&limit=` → `{query,hits:[{id,content,similarity}]}` (cosine `<=>`); stats/index/reset/delete như L0.
- Concepts: dense embeddings 384-dim L2-norm, cosine distance, HNSW ANN index, deterministic embedding (reproducible). E2E 4/4 PASS (zero-token-overlap semantic match, persist qua restart).

### L2 `2-hybrid-search-with-rrf-reranking` — hybrid-search-service (premium)
- Stack: NestJS orchestrator fan-out → L0(BM25 3019)+L1(vector 3020) qua Docker DNS. RRF k=60. Port 3000 (test 3021).
- Endpoints: `GET /api/search?q=&limit=` → `{mode:"hybrid_rrf",hits:[{id,content,rrfScore,sources:{bm25Rank,vectorRank}}]}`; `GET /api/search/bm25`; `GET /api/search/vector` (passthrough).
- Concepts: Reciprocal Rank Fusion (Cormack 2009, `Σ 1/(k+rank_i)`, k=60), cross-list agreement, failure isolation (.catch upstream). E2E 3/3 PASS.

---

## SD M16 — Distributed Rate Limiter (4-lang, 3 lesson, premium L2)

### L0 `0-token-bucket-and-redis-lua-atomicity` — token-bucket-service
- Stack: NestJS + Redis single. Port 3000. Redis key `tb:<key>` hash {tokens,ts}, TTL 60s.
- Endpoints: `POST /api/token-bucket/consume {key,capacity,refillPerSec,tokens?}` → `{allowed,remaining,retryAfterMs,...}`; `GET /api/token-bucket/state?key=`; `GET /api/token-bucket/burst-demo?key&capacity&refill&n`; `POST /api/token-bucket/race-demo {key,capacity,refillPerSec,concurrency}`.
- Concepts: token bucket refill model, **Lua EVALSHA atomicity (race-free)**, retryAfter calc. Lua: HGET tokens+ts, refill theo elapsed, return {allowed,remaining,retry_ms}. E2E 4/4 (concurrency=20→exactly 5 granted).

### L1 `1-sliding-window-log-vs-counter` — sliding-window-service
- Stack: NestJS + Redis single. Port 3000. Keys: `swlog:<key>` ZSET (score=ts), `swctr:<key>:<bucket>` counter.
- Endpoints: `POST /api/sliding-window/log/check {key,limit,windowMs}` → exact count O(N); `POST /api/sliding-window/counter/check` → weighted 2-bucket estimate O(1); `GET /api/sliding-window/compare?key&limit&windowMs&n`.
- Concepts: sliding window log (ZREMRANGEBYSCORE+ZCARD+ZADD, exact, RAM) vs counter (prev*(1-elapsed_ratio)+curr, O(1), ~0.003% err). 2 Lua scripts. E2E 3/3.

### L2 `2-hierarchical-multi-tenant-quota` — hierarchical-quota-service (premium)
- Stack: NestJS + **Redis Cluster 3-node**. Port 3000. Keys hash-tag `{q:<tenantId>}:u|t|g:...` (colocate shard).
- Endpoints: `POST /api/quota/check {tenantId,userId}` → check user(5/s)→tenant(20/s)→global(50/s), name blocked layer + DECR compensation; `POST /api/quota/hot-tenant-demo {tenantId,requests,distinctUsers}`; `GET /api/quota/cluster-info`.
- Concepts: hierarchical quota cascade, compensation rollback (DECR on reject), hash-tag routing cho Lua atomic across cluster, noisy-neighbor protection. Lua LUA_HIERARCHICAL bump() helper. E2E 3/3 (hot-tenant 50req/5user → OK:20 TENANT:30).

---

## SD M17 — Distributed File Storage & CDN (4-lang, 3 lesson, premium L2) ⚠️ pre-flight challenges

### L0 `0-file-chunking-and-metadata-storage` — metadata-service
- Stack: NestJS10 + TypeORM + Postgres16. Port 3000 (test 3032).
- Endpoints: `POST /api/files/upload {name,mimeType,totalSize,payload?}` → `{fileId,chunkCount,chunks:[{chunkIndex,sha256,size,storageObjectKey}]}` (1MB chunk); `GET /api/files/:fileId` (manifest, 404 unknown); `GET /api/files/:fileId/chunks`.
- Concepts: fixed 1MB chunking (CHUNK_SIZE_BYTES), deterministic SHA256/chunk, metadata normalized (files+chunks). storageObjectKey `objects/<fileId>/<chunkIndex>-<shaPrefix>`. E2E 5/5.

### L1 `1-data-deduplication-and-resumable-uploads` — upload-service ⚠️ thiếu easy+medium challenge
- Stack: NestJS + ioredis + TypeORM + Postgres16 + Redis7. Port 3000 (test 3033). Session Postgres, offset Redis `upload:<sessionId>`.
- Endpoints: `POST /api/uploads {name,totalSize}` → `{sessionId,uploadOffset}`; `PATCH /api/uploads/:id {offset,data,sha256}` (hoặc header `Upload-Offset`) → `{deduped,storageObjectKey,bytesWritten,bytesSaved}`; `GET /api/uploads/:id`; `GET /api/dedup/stats` → `{uniqueChunks,totalReferences,savingsPercent}`.
- Concepts: content-defined dedup (sha256 index `chunk_dedup` table, reuse object key), resumable (tus-like, Upload-Offset resume, wrong offset→400), ref_count GC. E2E 7/7 (3 upload→2 unique→33.33% saved).

### L2 `2-global-cdn-distribution` — cdn-api + nginx (premium) ⚠️ duplicate challenge
- Stack: NestJS + TypeORM + Postgres16 + **nginx edge cache**. nginx host 3034; cdn-api **internal-only** (origin shielding).
- Endpoints: `GET /cdn/edge/:fileId/:chunkIndex` (via nginx) → headers `X-Cache:MISS|HIT|BYPASS`, `ETag`, `Cache-Control:public,max-age=60`; `GET /api/cdn/origin/:fileId/:chunkIndex` (bypass); `GET /api/cdn/list`.
- Concepts: origin shielding (cdn-api no host port), nginx proxy_cache 60s TTL, ETag từ sha256, artificial latency 150ms. E2E 6/6 (MISS 162ms→HIT 3ms ~50x).

---

## FS M15 — UI Polish (agnostic FE-only Next.js, 4 lesson, premium L2+L3)

Stack chung: Next.js 14/15 App Router + TS + HeroUI v3 + Tailwind. Verify = Playwright (4 flow/lesson) + browser. isSandbox=true, githubDir=`<slug>/frontend`, backendUrl=`/mocks/14-ui-polish-techniques/<slug>`.

- **L0 `0-toast-system-with-heroui`**: HeroUI ToastProvider (placement bottom-end), `toast.success()`/`toast.promise()` morph loading→success/error, auto-dismiss timeout, stacking. Server-wraps-Client pattern. Port 3460.
- **L1 `1-modal-dialog-with-heroui`**: react-aria-components (DialogTrigger/ModalOverlay/Modal/Dialog), focus trap, focus restore on ESC, overlay dismiss, Tab cycle, aria-labelledby/describedby. Port 3470.
- **L2 `2-dark-mode-and-design-tokens`** (premium): CSS var tokens (`:root`/`[data-theme]`, OKLch), next-themes (toggle+localStorage+system pref), getComputedStyle, MutationObserver, suppressHydrationWarning. Port 3480.
- **L3 `3-internationalization-next-intl`** (premium): next-intl v3, `[locale]` dynamic segment, getTranslations/setRequestLocale, NextIntlClientProvider, ICU plural, middleware locale detect, NEXT_LOCALE cookie, generateStaticParams. messages/{en,vi}.json. Port (playwright).

## FS M16 — Interaction & A11y (agnostic FE-only Next.js, 4 lesson, premium L2+L3)

Stack chung: Next.js 15 App Router + TS + HeroUI v3 + Tailwind. Verify = Playwright. isSandbox=true, githubDir=`<slug>/frontend`, backendUrl=`/mocks/15-interaction-and-accessibility/<slug>`.

- **L0 `0-drag-and-drop-with-dnd-kit`**: @dnd-kit/core+sortable, DndContext, PointerSensor (5px), KeyboardSensor (sortableKeyboardCoordinates), useSortable, arrayMove, keyboard a11y (Space pickup/drop, Arrow move, ESC cancel, aria-pressed). Port 3500.
- **L1 `1-command-palette-with-cmdk`**: cmdk 1.0.4 (Radix Dialog), global Cmd/Ctrl+K listener, Command.Dialog/Input/List/Group/Item, fuzzy filter, role=dialog/listbox/option aria-selected, router.push navigate. Port 3510.
- **L2 `2-focus-trap-and-a11y-patterns`** (premium): manual useFocusTrap hook (cycle Tab/Shift+Tab, ESC, restore activeElement), skip link (WCAG 2.4.1), ARIA landmarks, role=dialog aria-modal, axe-core 0 violations. Tests trong `.playwright/`. Port 3520.
- **L3 `3-animation-with-framer-motion`** (premium): framer-motion 11, motion.button/div, shared layoutId FLIP morph, AnimatePresence exit, usePrefersReducedMotion (matchMedia, opacity-only fallback, data-reduced). Port 3530.

## FS M17 — Observability (4-lang, 4 lesson, premium L2+L3) — Tier 5 BE

Stack: NestJS backend `nest start --watch` host port 3000. 4-lang portable (mapping per lesson). isSandbox không áp (BE). codeImplementations CÓ (M17-M20 vẫn 4-lang).

- **L0 `0-pino-and-correlation-ids`** — backend, no Docker. Pino (nestjs-pino) + AsyncLocalStorage. `GET /orders/:id` → header `x-request-id`, logs carry id; custom `x-request-id` honored; `GET /orders/error` 404 preserves id. Concepts: structured log, correlation ID via ALS (not req.locals), redaction. Port: Java=Logback MDC, C#=Serilog AsyncLocal, Go=context.Context+zap. E2E 3 flow.
- **L1 `1-opentelemetry-distributed-tracing`** — backend + Jaeger Docker (4318 OTLP, 16686 UI). OTel NodeSDK (init FIRST in tracing.ts) + auto-instrument + manual spans. `POST /api/v1/orders/:id/charge` → span `orders.charge` in Jaeger; `fail-` prefix → span ERROR + recordException. Port: Java=otel-javaagent, C#=Activity API, Go=otel-go. E2E 2 flow.
- **L2 `2-sentry-fe-and-be-integration`** (premium) — backend (@sentry/nestjs + SentryExceptionFilter) + frontend Next.js (@sentry/nextjs, replay). `POST /api/v1/orders {forceError}` → 200 happy / 500 captured (chỉ 5xx→Sentry); FE global-error.tsx boundary + FE→BE error correlation. Sentry init in instrument.ts before bootstrap, beforeSend PII scrub, release GIT_SHA. Port: Java=sentry-spring-boot, C#=Sentry NuGet, Go=sentry-go. E2E 4 flow.
- **L3 `3-health-readiness-liveness-probes`** (premium) — backend + Postgres+Redis Docker. @nestjs/terminus + custom RedisHealthIndicator (Promise.race timeout 2s). `GET /health/live` (DB), `/health/ready` (DB+Redis), `/health/startup`. 200 up / 503 down. Concepts: k8s 3 probe patterns, graceful timeout. Port: Java=Spring Actuator, C#=AspNetCore.HealthChecks, Go=custom handlers. E2E 2 flow.

---

## Migration sequencing đề xuất

1. **Pre-flight:** fix SD M17 L2 duplicate (deterministic); author SD M17 L1 easy+medium challenge (hỏi thầy hoặc gen riêng).
2. **Batch A** (4 workflow song song = 2 heavy SD + 2 light FS): SD M15, SD M16, FS M15, FS M16.
3. **Batch B** (2 heavy): SD M17, FS M17.
4. Mỗi batch: verify COUNT → gate → backfill nếu thiếu → memory.

Repo NEEDS-RENAME: module-15→14, 16→15, 17→16 (ghi trong code-context).
