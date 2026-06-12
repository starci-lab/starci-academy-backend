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

## Expose GraphQL = `@Field`, KHÔNG strip lúc read (SECURITY, STRICT)
Entity vừa là bảng DB vừa là `@ObjectType`. GraphQL **chỉ serialize field có `@Field`** → đó là cổng kiểm soát lộ dữ liệu, **gate ở schema**.
- **Field nhạy cảm / nội bộ** (đáp án mẫu `solutions`, rubric chấm điểm, secret, cờ nội bộ) → giữ `@Column`/`@OneToMany` để seed/đọc nội bộ, **BỎ `@Field`**. JSDoc ghi rõ "NOT a GraphQL field". Resolver/service trả nguyên entity cũng KHÔNG lộ — GraphQL bỏ field không khai báo.
- ❌ **Anti-pattern**: để `@Field` rồi `delete obj.x` trong service/handler ("strip lúc read"). Mong manh — sót 1 đường đọc (ES `_source`, REST, query khác) là rò; và che client-side (FE giấu sau nút) = mở Network thấy hết. Bug thật đã dính: `solutions` của coding-problem lộ qua detail query dù FE giấu sau "reveal".
- Muốn phục vụ field nhạy cảm có điều kiện → **mutation/query riêng có guard** (vd reveal mutation trả `solutions` sau khi ghi nhận + tính điểm), KHÔNG nhét vào read chung rồi lọc.
- Đồng bộ tầng khác: ES sync builder **đừng index** field nhạy cảm; FE query **đừng request** field đã gỡ (gỡ ở `query-*.ts`/`mutation-*.ts`).

## Stores phụ
- **Qdrant** (vector): `src/modules/databases/qdrant/`. **Elasticsearch**: `@modules/elasticsearch` + synchronizer reindex (xem 10).
- **Redis**: 2 module khác nhau — `RedisModule` (node-redis v5, key `Adapter`/`Cache`) vs `IoRedisModule` (ioredis, key `Cache`). ⚠️ Đừng inject nhầm (interface khác nhau).
