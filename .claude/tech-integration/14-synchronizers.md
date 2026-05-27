# 14 — Synchronizers (`src/features/synchronizer/`)

`core/` chứa orchestrators, `processors/` chứa BullMQ consumers.

| Sub | Core path | Processor path | Purpose |
|-----|-----------|----------------|---------|
| CDN | `core/cdn-synchronizer/` | `processors/sync-cdn/` | Push assets sang CDN (S3 + invalidate) |
| Elasticsearch | `core/elasticsearch-synchronizer/` | `processors/sync-elasticsearch/` | Reindex PG → ES |
| Indexer | `core/indexer-synchronizer/` | `processors/sync-indexer/` | Generic indexer (autocomplete, …) |
| Bloom filters | `core/bloom-filters-synchronizer/` | `processors/sync-email-bloom-filter/` | Sync bloom filters (email dedup) |

## Orchestrator chính

`src/features/synchronizer/core/sync-orchestrator.service.ts` điều phối tất cả synchronizer trên — trigger qua schedule (`@nestjs/schedule`) hoặc manual API.

## sync-state entity

State của từng sync run lưu ở `src/modules/databases/postgresql/primary/entities/sync-state.entity.ts` + service `sync-state.service.ts`.

## Khi thêm synchronizer mới

1. Tạo orchestrator ở `src/features/synchronizer/core/<name>-synchronizer/`.
2. Tạo processor ở `src/features/synchronizer/processors/sync-<name>/`.
3. Đăng ký trong `core.module.ts` và `processors.module.ts` tương ứng.
4. Hook vào `sync-orchestrator.service.ts` nếu cần điều phối tập trung.
