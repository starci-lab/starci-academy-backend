# System Design Personal Project V2 — Roadmap 20 Module (để thầy duyệt)

> Capstone = build một ecommerce platform **phân tán (microservices)**, **API-only** (không FE — "viết api thôi cũng được"). **20 module / 56 task** (workflow `systemdesign-20-milestone-roadmap`).
>
> Mỗi task chấm 0-100 (outcome 30 / approach 70, yes/no + critical); chấm = **functionality-in-code/config** (grader đọc source/config, không chạy cluster). README text-only.
> `4lang` = service (TS/Java/C#/Go, học viên chọn 1) · `agnostic` = infra declarative (docker-compose/kong/k8s/helm). **Tất cả required** (không có UI optional như FS).

## Phase 1 — Foundations (M1–5)
| M | Module | Tasks |
|---|---|---|
| 1 | Monorepo & Service Scaffolding | multi-service-workspace-setup (agnostic) · per-service `/health` (4lang) |
| 2 | Containerize (Docker + Compose) | multi-stage Dockerfile/service (4lang) · docker-compose orchestration (agnostic) |
| 3 | Database-Per-Service + Migration | 2 DB độc lập catalog/order (agnostic) · migration products table (4lang) |
| 4 | Catalog Service API | GET /products pagination (4lang) · GET /products/:id (4lang) |
| 5 | Kong API Gateway | kong db-less routing (agnostic) · rate-limit plugin (agnostic) |

## Phase 2 — Messaging & Coordination (M6–10)
| M | Module | Tasks |
|---|---|---|
| 6 | Keycloak SSO & Service Auth | JWT validate ở gateway (agnostic) · service-to-service signed requests (4lang) · keycloak deploy+OAuth2 (agnostic) |
| 7 | Inter-Service Sync (REST/gRPC) | service contract (4lang) · timeout/retry/circuit-breaker (4lang) · graceful failure mapping (4lang) |
| 8 | Async Event-Driven | publish-subscribe broker (4lang) · event envelope+versioning (agnostic) · dead-letter-queue (agnostic) |
| 9 | Kafka Ordered Pipeline | partition-by-key (4lang) · consumer-group scaling (4lang) · offset mgmt at-least-once (4lang) |
| 10 | Distributed Saga | saga steps+compensation (4lang) · failure rollback LIFO (4lang) · idempotent retry-safe (4lang) |

## Phase 3 — Scale & Data (M11–15)
| M | Module | Tasks |
|---|---|---|
| 11 | Redis Caching (Cache-Aside) | cache-aside+TTL (4lang) · write-through invalidation (4lang) · list cache pagination (4lang) |
| 12 | Elasticsearch Search | index mapping (4lang) · full-text search+filters (4lang) · autocomplete prefix (4lang) |
| 13 | Distributed Rate Limiting | token-bucket limiter (agnostic) · per-client quota (agnostic) · atomic Redis state+Lua (agnostic) |
| 14 | Flash-Sale High Concurrency | atomic stock no-oversell (4lang) · idempotency-key dedup (4lang) · concurrency load test (4lang) |
| 15 | Data Replication & CDC | outbox transactional (4lang) · outbox relay→Kafka (4lang) · search index sync via CDC (4lang) |

## Phase 4 — Ops & Advanced (M16–20)
| M | Module | Tasks |
|---|---|---|
| 16 | Observability | structured logs+context (4lang) · distributed trace-id propagation (4lang) · Prometheus metrics (4lang) |
| 17 | Distributed Locks & Election | Redis mutex lock (4lang) · leader-election singleton job (4lang) · idempotent ops under lock (4lang) |
| 18 | Wallet & Payment Ledger | double-entry ledger (4lang) · 2PC-vs-Saga transfer (4lang) · idempotency+reconciliation (4lang) |
| 19 | Webhook Delivery | outbox+retry dispatch (4lang) · dead-letter-queue (4lang) · HMAC signature+idempotent consumer (4lang) |
| 20 | Deploy & Capstone | k8s manifests/helm (agnostic) · stateless+persistent tier (agnostic) · E2E order-flow (agnostic) · README runbook (agnostic) |

## Tổng kết
- **56 task, 100% backend/infra** (≈36 task service 4lang + ≈20 task infra agnostic). Không FE.
- Phủ trọn pattern phân tán: gateway, SSO, sync+resilience, async/Kafka, saga, cache, search, rate-limit, flash-sale, CDC/outbox, observability, locks/election, ledger 2PC/saga, webhook DLQ, k8s deploy.
- Reuse map về 11 milestone SD cũ ở foundations (monorepo/docker/kong/db-per-service); phần nâng cao chủ yếu `new` (cần viết content V2).
- outcomeIntent = đọc-code/config verify (HTTP shape/status, event publish/consume, offset commit, atomic update, lock acquire, ledger balance, HMAC).

## Cần thầy chốt
1. **Khung SD 20 module** — ổn chưa? (foundations → messaging → scale → ops)
2. Gật cả FS + SD → workflow viết content V2 từng task (en/vi, gate). 
