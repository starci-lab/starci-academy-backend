# Backend Pattern Docs

Định nghĩa cấu trúc + pattern viết code của backend StarCi Academy (`C:\Repositories\ac\starci-academy-backend`, NestJS 11 monorepo).
Đọc file phù hợp **trước khi viết/sửa code**. Song song với FE `.claude/pattern/` và bổ sung cho:
- `.claude/tech-integration/` — kiến trúc & integration chi tiết (databases, messaging, auth, AI, payments…).
- `.claude/skills/coding-conventions/` — luật viết code TS chuẩn (authoritative, mirror `.cursor/rules/starci-academy.mdc`).

> Pattern docs = **CÁCH viết** (module layout, layering, data/GraphQL/CQRS pattern, điều hướng).
> Tech-integration = **CÁI GÌ có** (integration nào, ở đâu). Conventions skill = **luật chi tiết** (naming, JSDoc, params/result, lint).

| File | Nội dung |
|------|----------|
| [01-overview.md](01-overview.md) | Stack + cây `apps/` + `src/` + điều hướng nhanh |
| [02-apps-entry-points.md](02-apps-entry-points.md) | `apps/` runnable + bootstrap + `app.module.ts` |
| [03-modules-layer.md](03-modules-layer.md) | `src/modules/` — pattern 3-file `register({ isGlobal })` |
| [04-features-layer.md](04-features-layer.md) | `src/features/` — api / synchronizer / socketio / video-encoder |
| [05-graphql.md](05-graphql.md) | Leaf module 3-piece, resolver, response wrapper, enum |
| [06-rest.md](06-rest.md) | HTTP controllers, DTOs, webhook, Swagger/Scalar |
| [07-data-typeorm.md](07-data-typeorm.md) | `EntityManager` injection, entities/enums, no active-record |
| [08-business-domain.md](08-business-domain.md) | `bussiness/` domain layer (data vs domain vs feature) |
| [09-cqrs-events.md](09-cqrs-events.md) | CQRS event bus + `ICQRSHandler` + NATS subjects |
| [10-background-work.md](10-background-work.md) | BullMQ processors, synchronizers, cron/interval, seeders |
| [11-config-env.md](11-config-env.md) | `envConfig()` vs `app.yaml` vs mount key files |
| [12-exceptions.md](12-exceptions.md) | `AbstractException`, error normalization |
| [13-conventions.md](13-conventions.md) | Tóm tắt luật viết code → trỏ về conventions skill |
| [14-frontend-link.md](14-frontend-link.md) | Hợp đồng BE ↔ FE |

## Điều hướng nhanh
- Thêm GraphQL query/mutation? → [05](05-graphql.md).
- Thêm REST/webhook? → [06](06-rest.md).
- Truy vấn DB? → [07](07-data-typeorm.md) (luôn `EntityManager`).
- Logic nghiệp vụ nhiều entity? → [08](08-business-domain.md).
- Job nền / sync / cron? → [10](10-background-work.md).
- Thêm module mới? → [03](03-modules-layer.md).
- Giá trị cấu hình? → [11](11-config-env.md).
- Ném lỗi? → [12](12-exceptions.md).
