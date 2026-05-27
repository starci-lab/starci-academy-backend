# 03 — Databases & Storage

| Tech | Module path | Ghi chú |
|------|-------------|---------|
| **PostgreSQL (primary)** | `src/modules/databases/postgresql/primary/` | TypeORM 0.3, ~70 entities, có `resolvers/`, `seeders/`, `hydration/`, `lock/`, `sync-state.service.ts`. Register: `PrimaryPostgreSQLModule.register({ withResolvers, withSeeders })`. |
| TypeORM entities | `src/modules/databases/postgresql/primary/entities/` | Mỗi domain object 1 file `.entity.ts` + `*-translation.entity.ts` cho i18n. Schema tổng: xem memory `sd-main-db-schema.md`. |
| **Qdrant** (vector DB) | `src/modules/databases/qdrant/` | Dùng cho embedding/RAG via LangChain |
| **ScyllaDB** (Cassandra) | `src/modules/databases/scylladb/` | High-throughput writes (vd: events, logs) |
| **Elasticsearch** | `src/modules/elasticsearch/` | Search + indexing, có `elasticsearch.providers.ts`, `utils/`, decorators |
| **Redis (node-redis v5)** | `src/modules/native/redis/` | Instance keys: `Adapter` (Socket.IO Redis adapter), `Cache` |
| **Redis (ioredis)** | `src/modules/native/ioredis/` | Instance keys: `Cache` — dùng cho cache-manager, BullMQ |
| **Cache** | `src/modules/cache/` | cache-manager v7 + Keyv + Redis. Có `interceptors/`, decorators `@Cache(...)`. |
| **S3 / MinIO** | `src/modules/s3/` | AWS SDK v3. Services: `s3-bucket`, `s3-build`, `s3-copy`, `s3-name-resolver`, `s3-read`, `s3-upload`. Presigned URLs. |
| **Filesystem (mount)** | `src/modules/filesystem/` | `mount.service.ts`, `mount-storage.service.ts` — đọc/ghi filesystem theo cấu hình mount (dùng cho course content `.mount/data/`). |

## Lưu ý

- Có **2 Redis modules** khác nhau: `RedisModule` (node-redis) vs `IoRedisModule` (ioredis). Không nhầm lẫn — xem [21-gotchas.md](21-gotchas.md).
- Khi thêm entity, nhớ tạo cả `*-translation.entity.ts` nếu cần i18n và update `entities/index.ts`.
