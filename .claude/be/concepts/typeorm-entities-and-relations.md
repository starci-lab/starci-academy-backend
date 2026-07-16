# Concept — TypeORM entities & relations (PostgreSQL primary)

> Schema thật ở `src/modules/databases/postgresql/primary/entities/` — ~70+ entity. CHỈ schema, không business rule (rule ở `bussiness/`, xem [[feature-layer]]).

- **Truy vấn qua `EntityManager`, KHÔNG `Repository` (STRICT)**: inject `@InjectPrimaryPostgreSQLEntityManager()` cho MỌI call DB — 1 injection point/service, join/multi-entity transaction dễ, module không cần `forFeature([...])`.
- ❌ Anti-pattern: `@InjectRepository(Entity, POSTGRESQL_PRIMARY)`, `NestTypeOrmModule.forFeature`, active-record (`entity.save()` trực tiếp — TypeORM 0.3 dùng repository/manager pattern).
- i18n: tách bảng dịch `<x>.entity.ts` + `<x>-translation.entity.ts`. Enum vừa dùng cho cột DB vừa GraphQL → định nghĩa 1 lần + companion `createEnumType`.
- **Expose GraphQL = `@Field`, KHÔNG strip lúc read (SECURITY, STRICT)**: field nhạy cảm (đáp án mẫu, rubric, secret) → giữ `@Column` nhưng BỎ `@Field`, JSDoc ghi "NOT a GraphQL field". ❌ Đừng để `@Field` rồi `delete obj.x` trong service ("strip lúc read") — mong manh, sót 1 đường đọc (ES `_source`, REST, query khác) là rò dữ liệu.
- Stores phụ: Qdrant (vector, `databases/qdrant/`, xem [[rag-langchain]]) · Elasticsearch (`@modules/elasticsearch`, xem [[elasticsearch-sync]]) · Redis 2 module khác nhau (`native/redis` node-redis v5 vs `native/ioredis` ioredis) — đừng inject nhầm, interface khác nhau.

> Nguồn: `src/modules/databases/postgresql/primary/`
