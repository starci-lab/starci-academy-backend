# Tech Integration — Index

> Bản đồ "công nghệ nào nằm ở đâu trong source" cho `starci-academy-backend`.
> Mỗi file dưới đây cover 1 chủ đề. Đọc theo nhu cầu.

## Mục lục

1. [01-overview.md](01-overview.md) — Tổng quan kiến trúc, path aliases, pattern module
2. [02-entry-points.md](02-entry-points.md) — Các app trong `apps/` và cách chạy
3. [03-databases-and-storage.md](03-databases-and-storage.md) — PostgreSQL, Qdrant, ScyllaDB, ES, Redis, Cache, S3, Filesystem
4. [04-messaging-and-realtime.md](04-messaging-and-realtime.md) — BullMQ, NATS, EventEmitter, CQRS, Socket.IO, SSE
5. [05-auth-and-security.md](05-auth-and-security.md) — Keycloak, JWT, Passport, Throttler, Crypto, Validators, Sentry
6. [06-ai-and-llm.md](06-ai-and-llm.md) — AI routers, LangChain, vector store
7. [07-payments-and-webhooks.md](07-payments-and-webhooks.md) — PayOS, Sepay
8. [08-email-and-notifications.md](08-email-and-notifications.md) — Mailer, Pug templates, bloom filter dedup
9. [09-media-and-video.md](09-media-and-video.md) — FFmpeg, Bento4, video encoder pipeline
10. [10-external-integrations.md](10-external-integrations.md) — Axios, GitHub, Google APIs, Solana
11. [11-observability.md](11-observability.md) — Winston+Loki, Sentry, Mixin
12. [12-api-surface.md](12-api-surface.md) — REST controllers, GraphQL (Apollo), Swagger/Scalar
13. [13-processors.md](13-processors.md) — BullMQ consumers (api/processors)
14. [14-synchronizers.md](14-synchronizers.md) — CDN/ES/Indexer/BloomFilter sync
15. [15-business-domain.md](15-business-domain.md) — `modules/bussiness/` domain layer
16. [16-init-and-seeders.md](16-init-and-seeders.md) — Startup init plugins, seeders
17. [17-env-and-config.md](17-env-and-config.md) — Env, locale, exceptions
18. [18-build-and-run.md](18-build-and-run.md) — Scripts npm, Docker, nest CLI
19. [19-conventions.md](19-conventions.md) — Quy ước thêm tích hợp mới
20. [20-quick-lookup.md](20-quick-lookup.md) — "Muốn X → mở đâu" cheat sheet
21. [21-gotchas.md](21-gotchas.md) — Typo cố ý, double-register, các pitfall

---

## Khi nào dùng

- Cần định hướng codebase nhanh → mở `01-overview.md` + `20-quick-lookup.md`
- Cần thêm tech mới → mở `19-conventions.md`
- Bị lỗi/đọc nhầm tên folder → mở `21-gotchas.md`
- Tìm chỗ tích hợp 1 tech cụ thể → mở file mục 3–14 phù hợp

_Tạo 2026-05-27. Cập nhật khi thêm module/feature mới._
