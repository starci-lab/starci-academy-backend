# Backend Test Plan — starci-academy-backend

> Brief. Chi tiết đầy đủ: `~/.claude/plans/kind-purring-lovelace.md`.

## Hiện trạng
- ~15 unit spec, `apps/core` **0 e2e**. Tooling sẵn: Jest 30, `@nestjs/testing`, supertest, ts-jest, `@faker-js/faker`.
- **Bug**: script `test:e2e` trỏ `apps/starci-academy-backend/...` (không tồn tại — app tên `core`) → e2e chưa từng chạy.

## 4 lớp test
| Lớp | Nội dung | Regex | Hạ tầng |
|---|---|---|---|
| L1 Pure unit | hàm thuần, mapper, parser | `*.spec.ts` | none |
| L2 Service unit | service/handler/guard, **mọi dep mock `useValue`** | `*.spec.ts` | none |
| L3 Integration | slice + Postgres/Redis thật (SQL/metadata) | `*.int-spec.ts` | Testcontainers |
| L4 E2E | boot `apps/core` qua supertest | `*.e2e-spec.ts` | Testcontainers |

**Rule cứng:** L2 CẤM import `*.module.ts` thật (kéo TypeORM metadata → boot fail) — chỉ provide token mock. Service dùng `entityManager.transaction(cb)` → mock `transaction` gọi callback với EM giả.

## E2E infra
**Testcontainers (Postgres + Redis thật) + mock mọi external còn lại** (Qdrant/Scylla/ES/Judge0/LLM/payment SDK/Keycloak JWKS/S3/NATS/BullMQ qua `.overrideProvider`). 5 Redis token → cùng 1 container.

## Test-utils (`src/modules/tests/utils/`, import `@modules/tests`)
mocks (entity-manager.transaction, repo, cache, bus, redis) · factories (user/challenge/course/enrollment/submission/ai-entitlement trên faker) · http/outbound (nock) · auth (fake JWT + override guard). **Build trước:** transaction-mock + factories.

## Backlog ưu tiên
- **P0 (tiền/chấm/auth):** webhook sepay/payos/stripe/paypal/nowpayments (chữ ký + idempotency + grant); `ai-entitlement` (BYOK/free/paid/over-quota); `credit-usage` (window tuần+5h); grading (normalize/router/lane) + judge0/coding-submission; keycloak guards + jwks; must-enrolled/admin guard; anti-cheat; transactions/atomic.
- **P1 (domain):** progress (leaderboard/challenge/personal-project); CQRS handler template; ai/balancer; coding-problem; flashcard SM-2; user; discussion.
- **P2:** init seeders parser; synchronizer diff/sync; admin presign/process-video + s3; github oauth callback; GraphQL query/mutation còn lại (L2 bus mock).

## Coverage & CI
- `package.json jest` → `jest.config.ts` **projects**: `unit` (mặc định, ignore `*.int-spec.ts`), `integration` (opt-in Testcontainers). E2E config riêng `apps/core/test/jest-e2e.json`.
- Scripts: `test`→unit; `test:int`→integration runInBand; `test:e2e`→`--config apps/core/test/jest-e2e.json` (**fix path chết**); `test:ci`→unit ci coverage.
- Threshold: P0 90/85 scoped, P1 75/65, global floor 40 ratchet. CI `.github/workflows/ci.yml`: bật lại PR + đổi step → `test:ci` + thêm job `e2e` (needs verify).

## Reference template — ĐÃ LÀM & XANH ✅
1. **Test-utils** `src/modules/tests/utils/` (import `@modules/tests`): `makeEntityManagerMock()` (transaction-cb chạy inline + queryBuilder lock) — khuôn mock cho mọi service unit. Đã exclude `src/modules/tests` khỏi `tsconfig.build.json`.
2. **Unit** `src/modules/ai/ai-entitlement.service.spec.ts` — **17/17 xanh**, no infra. Bao: resolve (Auto/Premium/byok/window-reset), consume (lock+debit), grantTier (idempotent), getByokApiKey, updateSettings. DayjsService dùng THẬT (pure wrapper).
3. **E2E** `apps/core/test/` harness + `app/sepay-webhook.e2e-spec.ts` — **4/4 xanh**, Postgres THẬT qua Testcontainers (`postgres:16-alpine`), grantTier ghi row thật. `npm run test:e2e`.

### Gotchas đã giải (đọc khi nhân rộng e2e)
- **Focused module** (KHÔNG boot full AppModule): chỉ import `PrimaryPostgreSQLModule.register({ isGlobal:true, withHydration:false, withSeeders:false, withResolvers:false })` + `CqrsModule` + controller/handler cần. `withHydration:false` BẮT BUỘC (nếu không kéo `CourseHydrationService`→`AsyncService` thiếu).
- **Env Testcontainers→worker**: globalSetup set `process.env.POSTGRESQL_PRIMARY_*` → propagate sang worker OK (envConfig() đọc live). synchronize:true tự tạo ~150 bảng.
- **supertest**: `import request from "supertest"` (default), KHÔNG `import * as`.
- **app.close()**: TypeORM shutdown hook tìm default DataSource (chỉ có "primary") → `.catch(()=>undefined)`.
- **Seed**: UserEntity chỉ cần `keycloakId`; TransactionEntity cần referenceId/amount/pricingPhase/checkoutUrl/status/paymentType/actionType (+user FK). Truncate giữa test bằng `TRUNCATE ... RESTART IDENTITY CASCADE`.

→ Fan-out P0: unit copy `ai-entitlement.service.spec.ts`; webhook e2e copy `sepay-webhook.e2e-spec.ts` (PayOS/Stripe khác mock verify chữ ký + DTO).

## Pending (chưa làm)
- Scripts `test:unit`/`test:int` + jest `projects` (unit/integration) — hiện `test`=jest all, `test:e2e` đã fix path.
- CI `.github/workflows/ci.yml` bật lại + job e2e.
- Fan-out full services P0→P2.

## Risks
fix path e2e chết · L2 không import module · raw-SQL cần L3 · BullMQ assert `queue.add` không chạy worker · override JWKS · AppModule side-effect (Sentry/cron/synchronizer) → ưu tiên trimmed `E2eAppModule` · định vị file SM-2 trước khi viết.
