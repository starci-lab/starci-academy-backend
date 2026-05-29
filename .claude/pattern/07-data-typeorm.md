# 07 — Data Layer (TypeORM 0.3)

Schema sống ở `src/modules/databases/postgresql/primary/`:
```
primary/
├─ entities/   # *.entity.ts (+ *-translation.entity.ts nếu i18n) — CHỈ schema, không business rule
├─ enums/      # enum dùng trong entity + GraphQL (createEnumType)
├─ ...         # data source, manager injection token
```

## Truy vấn: `EntityManager`, KHÔNG `Repository` (STRICT)
Repo dùng **`EntityManager` inject qua `@InjectPrimaryPostgreSQLEntityManager()`** cho MỌI call DB. KHÔNG dùng `@InjectRepository(Entity, POSTGRESQL_PRIMARY)`.

```ts
import { Injectable } from "@nestjs/common"
import { EntityManager } from "typeorm"
import { AiModelEntity, InjectPrimaryPostgreSQLEntityManager } from "@modules/databases"

@Injectable()
export class MyService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    async list() {
        return this.entityManager.find(AiModelEntity, { where: { enabled: true } })
    }

    async upsert(row: AiModelEntity) {
        return this.entityManager.save(row)
    }
}
```

### Vì sao
- 1 injection point/service, không boilerplate per-entity.
- Manager dùng được mọi entity → join / multi-entity transaction dễ.
- Module **KHÔNG** cần `NestTypeOrmModule.forFeature([...])` — `PrimaryPostgreSQLModule` (global ở app.module) đã expose manager. Chỉ cần add service vào `providers` + `exports`.

### Anti-pattern
- ❌ `@InjectRepository(AiModelEntity, POSTGRESQL_PRIMARY)` — boilerplate, khó refactor.
- ❌ `NestTypeOrmModule.forFeature([...])` trong feature module — thừa.
- ❌ Active record: KHÔNG gọi `entity.save()` trực tiếp (TypeORM 0.3 dùng repository/manager pattern).

## Entity & enum
- Entity i18n tách bảng dịch: `<x>.entity.ts` + `<x>-translation.entity.ts`.
- Enum vừa dùng cho cột DB vừa cho GraphQL → định nghĩa 1 lần ở `enums/` + companion `createEnumType` (xem 05). Value khớp FE.
- Schema tổng quan (70+ entity) → memory `sd-main-db-schema.md` + tech-integration `03-databases-and-storage.md`.

## Stores phụ
- **Qdrant** (vector): `src/modules/databases/qdrant/`. **Elasticsearch**: `@modules/elasticsearch` + synchronizer reindex (xem 10).
- **Redis**: 2 module khác nhau — `RedisModule` (node-redis v5, key `Adapter`/`Cache`) vs `IoRedisModule` (ioredis, key `Cache`). ⚠️ Đừng inject nhầm (interface khác nhau).
