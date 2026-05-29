# 08 — Business Domain (`src/modules/bussiness/`)

> ⚠️ Tên `bussiness` (thừa 1 chữ s) là **typo cố ý** — KHÔNG đổi (vỡ imports khắp repo).

Domain layer = nơi đặt **business rule** tổng hợp nhiều entity. Đứng giữa data layer (entity thuần) và feature layer (resolver/controller).

| Sub | Purpose |
|-----|---------|
| `user/` | User domain (profile, settings) |
| `transactions/` | Wallet / payment transactions |
| `progress/` | Course/lesson/milestone progress tracking |
| `jobs/` | Job board domain |
| `guards/` | Domain-aware guards (enrollment, ownership) |
| `pipes/` | Domain-aware pipes |
| `bloom-filters/` | Bloom filter helpers (email dedup…) |

## Quy tắc layering (QUAN TRỌNG)
```
controller/resolver (features/api)  →  domain service (bussiness/)  →  EntityManager (databases/)
```
- ✅ Resolver/controller gọi **domain service**, domain service áp rule + truy vấn qua `EntityManager`.
- ❌ **KHÔNG** bypass: controller đi thẳng vào TypeORM repo (ngoại lệ: query đơn giản 1 entity, không có rule).
- Domain service đăng ký + export trong `BussinessModule`; `BussinessModule.register({ isGlobal: true })` ở `apps/core/src/app.module.ts`.

## Pattern service
- `@Injectable()`, inject `@InjectPrimaryPostgreSQLEntityManager()` + module service khác (cache, crypto, balancer…).
- Method theo conventions: `{Action}Params` / `{Action}Result`, JSDoc đầy đủ, inline step comments (xem 13).
- Side-effect cross-domain → publish event (CQRS, xem 09) hoặc enqueue job (BullMQ, xem 10), KHÔNG gọi chéo domain lung tung.

## Guards / pipes domain
- `bussiness/guards/` — guard cần dữ liệu nghiệp vụ (vd kiểm tra user đã enroll course chưa). Khác guard hạ tầng (`@modules/keycloak`).
- Dùng ở feature layer: `@UseGuards(EnrollmentGuard)` trên resolver/controller.
