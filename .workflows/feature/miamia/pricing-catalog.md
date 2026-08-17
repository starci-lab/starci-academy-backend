<!-- starci-workflow: v2 -->

# Public pricing catalog MiaMia

## plan r1

Proposed revision: `pricing-catalog-plan-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | api — không phải miamia-colyseus |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Database | N/A — read-only mounted app config, không đọc/ghi PostgreSQL |
| Purpose | Khóa GraphQL public pricing catalog làm nguồn giá và quyền lợi cho MiaMia FE. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\pricing-catalog.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này; source backend/FE chỉ đọc. |

### SCHEMA EVIDENCE

| Evidence | Result |
|---|---|
| Live endpoint | `http://localhost:3071/graphql` trả schema đầy đủ. |
| Query inventory | 34 fields; có `systemConfig`, `myExamDownloadEntitlement`, `myPaymentStatus`; không có pricing/package catalog public. |
| Mutation inventory | 41 fields; có `purchaseMembership`, `purchaseExamDownloadPackage`, `submitContact`. |
| Existing source of truth | `MountFilesystemService.appConfig()` đọc `membership` và `examDownloads` từ mounted `app.yaml`. |
| App identity | `nest-cli.json` có `api` và `miamia-colyseus`; capability thuộc GraphQL app `api`. |
| Database | Không cần entity/manager/migration; query chỉ projection config. |

### SIBLING VÀ ARCHITECTURE

| Decision | Choice | Evidence |
|---|---|---|
| Operation family | `queries/payments/pricing-catalog` | Catalog bao phủ membership và exam-download checkout; `payments` là aggregate trung lập duy nhất giữa hai purchase families. |
| CQRS shape | Mirror `queries/payments/my-payment-status` | Query, handler, service, resolver, module-definition, module, twin spec và aggregate registration. |
| Config-read behavior | Mirror `queries/system/system-config` | Public no-auth GraphQL query, Soft throttler, locale success message, handler đọc `MountFilesystemService`. |
| Transport | GraphQL `pricingCatalog` | Fields-in/fields-out; không có lý do REST. |
| Persistence | None | Không được thêm repository, EntityManager, entity hay migration. |
| Security | Public, no secret fields | Chỉ giá, enabled flags và product entitlements; không expose PayOS/SePay credential, inbox, mounted paths hoặc provider config. |

### PROPOSED GRAPHQL CONTRACT

```graphql
query PricingCatalog {
  pricingCatalog {
    success
    message
    error
    data {
      membership {
        enabled
        monthlyPriceVnd
        yearlyPriceVnd
        demoPaperLimit
        aiCreditsPerDay
        entitlements {
          learnPhrases
          gamesSolo
          examDemo
          examFull
          chatbot
          ragLookup
          gamesMultiplayer
          weaknessReport
        }
      }
      examDownloads {
        enabled
        packages {
          packageId
          priceVnd
          continuousUpdates
          zaloSupport
          commercialTeaching
          brandPromotionMonths
        }
      }
    }
  }
}
```

| Field rule | Frozen meaning |
|---|---|
| `monthlyPriceVnd` | Exact `membership.priceVnd`; integer > 0 khi membership enabled. |
| `yearlyPriceVnd` | Exact optional config; GraphQL nullable, integer > 0 khi present. |
| Membership optional fields | `demoPaperLimit`, `aiCreditsPerDay`, `entitlements` members nullable only when config omits their parent; không tạo benefit mặc định. |
| Entitlement tier | GraphQL enum `PricingAccessTier = free | pro`, mapped one-to-one từ `AppConfigEntitlementTier`. |
| Packages | Luôn emit đúng hai enum members `personal`, `commercial`, theo thứ tự đó; mỗi package lấy nguyên benefit/price từ config. |
| Disabled catalog | Trả `enabled: false` và vẫn trả configured values để UI có thể giải thích unavailable; checkout mutations vẫn là authority từ chối mua. |
| Invalid numeric config | Throw `PricingCatalogConfigInvalidException` với `section` và `field`; không publish zero/negative/non-integer. |
| Resale | Không thêm `resaleAllowed` vì config chưa sở hữu field đó; FE giữ copy “không bán lại” như product policy đã duyệt, không giả field server. |

### PROPOSED FILE TREE

| Path | Holds | Shape owner |
|---|---|---|
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/graphql-types/access-tier.ts` | `PricingAccessTier`, GraphQL registration và exact free/pro mapping. | Existing `AppConfigEntitlementTier`; type-safety enum rule. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/graphql-types/response.ts` | Membership, entitlement, exam-download package/catalog data và response wrapper. | Proposed GraphQL contract; mirrors sibling response objects. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.query.ts` | `ExecuteParams<undefined>` message only. | CQRS-2; mirrors `SystemConfigQuery`. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.handler.ts` | Validate safe numeric fields and project mounted config without mutation. | CQRS-3/5; `MountFilesystemService` config source. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.handler.spec.ts` | Twin decision matrix. | CQRS-7, TESTING-5. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.service.ts` | One-line QueryBus dispatch. | CQRS-4; mirrors payment sibling. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.resolver.ts` | Public `pricingCatalog`, Soft throttle, locale and transform interceptor. | GraphQL default transport; mirrors `systemConfig`. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.module-definition.ts` | Configurable module definition. | Payments sibling module shape. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.module.ts` | CqrsModule plus resolver/service/handler providers. | Payments sibling module shape. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/index.ts` | Export operation module only. | Existing operation public surface. |
| `apps/api/src/features/api/core/graphql/queries/payments/payments.module.ts` | Register `PricingCatalogQueryModule` beside `MyPaymentStatusQueryModule`. | Aggregate composition owner. |
| `apps/api/src/modules/exceptions/errors/payment/pricing-catalog-config-invalid.ts` | Named domain exception with `{ section, field }` metadata. | Exception canon; no raw Error/Nest builtin. |
| `test/e2e/pricing-catalog.e2e-spec.ts` | Public catalog → authenticated checkout amount consistency flow. | Business consequence and production GraphQL transport. |

No `index.ts` barrel beyond the operation module export, no entity, migration, repository, REST controller, cache or new config field.

### TEST MATRIX

| Lane | Case | Assertion |
|---|---|---|
| Unit | Full live-shaped config | Response preserves 49k/490k, Personal 249k, Commercial 4.999m and every benefit exactly. |
| Unit | Membership disabled | `enabled: false` preserved; no invented availability. |
| Unit | Exam downloads disabled | `enabled: false` preserved; package facts remain configured. |
| Unit | Missing optional yearly/demo/AI/entitlements | Corresponding GraphQL data becomes null/nullable; handler does not fabricate defaults. |
| Unit | Every `PricingAccessTier` member | `free` and `pro` map unchanged; no wildcard/default branch. |
| Unit | Every `ExamDownloadPackage` member | Personal and Commercial map to their own config, fixed order, no mixed benefits. |
| Unit | Membership monthly at 0, negative, decimal | Throw named config-invalid exception when enabled. |
| Unit | Optional yearly at 0, negative, decimal | Throw when present. |
| Unit | Either package price at 0, negative, decimal | Throw with exact package/field metadata. |
| Unit | `brandPromotionMonths` negative or decimal | Throw; zero remains valid for Personal. |
| Schema | Public field and response shape | Anonymous query succeeds; no auth guard and no secret/provider fields introspectable. |
| E2E | Catalog price equals checkout charge | Read catalog anonymously, create authenticated Pro, Personal and Commercial PayOS intents through GraphQL with external PayOS result stubbed, then assert persisted transaction amounts equal catalog values. |
| E2E negative | Disabled offer | Catalog reports disabled and production checkout refuses; no transaction is persisted. |
| Live | Running local API | Anonymous `pricingCatalog` returns mounted values; response contains no credential-like field. |

### ACCEPTANCE COMMANDS

```powershell
npx tsc -p apps/api/tsconfig.app.json --noEmit
npm run lint:check
npm run test:unit -- --runInBand
npx jest --config test/e2e/jest-e2e.json --runInBand test/e2e/pricing-catalog.e2e-spec.ts
npm run build
```

### OUTPUTS

| Concept | Result |
|---|---|
| Capability brief | Public `pricingCatalog` projection makes mounted prices and entitlement facts the one FE source without exposing secrets. |
| Architecture | CQRS query in payments family; public GraphQL door; config-only handler; no database. |
| Consistency proof | E2E binds prices shown publicly to amounts persisted by all three checkout intents. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/miamia/pricing-catalog.md` | `added` — Backend Feature Plan r1 only; no product source. |
| `.workflows/designs/miamia/tai-de-bang-gia.md` | `modified` — record FE Review approval and post-approval `submitContact` finding. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt public catalog contract | **A — Duyệt `pricing-catalog-plan-r1` (đề xuất):** expose prices, enabled flags và entitlement facts như schema trên. **B — Thu gọn:** chỉ expose prices/enabled, FE tự giữ benefit copy. |
| White-label correction | **A — Review r2 reuse `submitContact(category: partnership)` (đề xuất):** tạo contact form/overlay có success/failure thật. **B — Giữ informational `Liên hệ sau`:** không tương tác ở Apply đầu. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree đang có uncommitted `myPaymentStatus` paths, gồm chính aggregate `payments.module.ts`. | Apply phải baseline-commit trạng thái hiện tại trước sửa và chỉ track pricing diff từ baseline; không ghi đè status work. |
| `submitContact` có thật nhưng resolver hiện hardcode inbox/StarCi copy và không đi qua CQRS. | Có thể reuse cho White-label về capability, nhưng Design Review r2 phải khóa UI owner; audit/refactor mutation là concern riêng, không lén đưa vào pricing catalog. |
| Mounted app config hiện được typed/cast chứ chưa có schema validation tổng thể. | Handler pricing phải chặn số public sai; không mở rộng thành refactor toàn config parser. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mở rộng `systemConfig` với giá | Query domain `pricingCatalog` trong payments family | Giá và license không phải tuning hệ thống; mở rộng sẽ biến `systemConfig` thành generic bag. |
| Hardcode giá trong FE | Read-only public catalog | Checkout đã đọc mounted config; hai nguồn sẽ drift. |
| Đọc PostgreSQL | Read mounted app config | Giá/package không nằm trong database và capability không ghi state. |
| Expose provider/payment secrets | Chỉ public product facts | FE không cần credential để render hoặc checkout. |

### OWED

| Owed | Cleared by |
|---|---|
| Review exact schema, paths và test matrix | `starci-be-feature-review` sau approval Plan r1. |
| White-label owner correction | `starci-fe-design-review` r2 theo lựa chọn A/B. |
| Production implementation | Backend Apply sau approved Review; FE Apply chỉ sau live catalog và approved FE Review r2. |

## review r1

Proposed revision: `pricing-catalog-review-r1`

Approved revision: `pricing-catalog-review-r1`

Approval evidence: thầy trả lời `Duyệt pricing-catalog-review-r1 và tai-de-bang-gia-review-r2.`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | api — không phải miamia-colyseus |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Database | N/A — read-only mounted app config |
| Purpose | Challenge và khóa exact public GraphQL catalog, config validation, file boundary và proof trước Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\pricing-catalog.md |
| Language | vi |
| Phase | review |
| Touching | Workflow này và source/schema chỉ đọc; không sửa production source. |

### REVIEW VERDICT

| Claim | Verdict | Frozen meaning | Evidence |
|---|---|---|---|
| Public `pricingCatalog` thuộc payments query family | KEEP | Anonymous, Soft throttle, QueryBus dispatch, handler chỉ đọc `MountFilesystemService.appConfig()`. | `systemConfig` chứng minh public door; `my-payment-status` chứng minh payments aggregate/CQRS family. |
| `examDownloads` luôn tồn tại | REVISE | `examDownloads` nullable; config vắng trả `null`, không tạo `enabled: false` hoặc package giả. | `AppConfig.examDownloads?: AppConfigExamDownloads`; checkout cũng dùng `catalog?.enabled`. |
| Tạo package enum mới trong operation | REJECT | Reuse `ExamDownloadPackage` và `GraphQLTypeExamDownloadPackage`. | Purchase mutation và payment status đã dùng enum canonical này. |
| Tin TypeScript cast là runtime validation | REJECT | Validate mọi value được publish: boolean, integer, access tier; lỗi dùng một named domain exception. | Mounted config chưa có schema validation tổng thể; GraphQL serialization không phải domain validator. |
| E2E chỉ snapshot response | REVISE | Anonymous catalog phải được nối với ba authenticated checkout intents và persisted amount. | Mục tiêu capability là chống drift giữa giá hiển thị và giá charge. |

### FROZEN GRAPHQL CONTRACT

```graphql
query PricingCatalog {
  pricingCatalog {
    success
    message
    error
    data {
      membership {
        enabled
        monthlyPriceVnd
        yearlyPriceVnd
        demoPaperLimit
        aiCreditsPerDay
        entitlements {
          learnPhrases gamesSolo examDemo examFull chatbot
          ragLookup gamesMultiplayer weaknessReport
        }
      }
      examDownloads {
        enabled
        packages {
          packageId priceVnd continuousUpdates zaloSupport
          commercialTeaching brandPromotionMonths
        }
      }
    }
  }
}
```

| Contract point | Exact rule |
|---|---|
| `membership` | Non-null vì `AppConfig.membership` bắt buộc; expose `enabled` và exact configured monthly price. |
| `yearlyPriceVnd` | Nullable; exact configured value khi có. Checkout hiện vẫn chỉ bán monthly, catalog không ngụ ý yearly checkout đã tồn tại. |
| `demoPaperLimit` | Nullable; non-negative integer khi có. |
| `aiCreditsPerDay` | Nullable projection của `membership.ai?.creditsPerDay`; positive integer khi có. |
| `entitlements` | Nullable khi parent vắng; mỗi member bắt buộc là `free` hoặc `pro`; GraphQL dùng `PricingAccessTier`. |
| `examDownloads` | Nullable khi entire config section vắng; nếu có thì `enabled` và packages đều phải valid. |
| `packages` | Hai row cố định Personal rồi Commercial; `packageId` reuse canonical `ExamDownloadPackage`. |
| Disabled section | Vẫn publish configured facts nếu section tồn tại; mutation checkout vẫn là authority từ chối mua. |
| Invalid config | Throw `PricingCatalogConfigInvalidException({ section, field, packageId? })`; không coerce, default hoặc publish partial. |
| Security | Schema không có provider, credential, inbox, mount path, webhook secret hoặc checkout URL. |

### EXACT PRODUCTION BOUNDARY

| Tree | Frozen change |
|---|---|
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/graphql-types/access-tier.ts` | Add `PricingAccessTier`, GraphQL registration và exhaustive mapping từ `AppConfigEntitlementTier`. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/graphql-types/response.ts` | Add exact code-first object types; `examDownloads`, yearly/demo/AI/entitlements nullable đúng contract. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.query.ts` | Add `ExecuteParams<undefined>` message. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.handler.ts` | Add config projection và validation; override `process`, không persistence. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.handler.spec.ts` | Add twin unit matrix. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.service.ts` | Add one-line QueryBus dispatch. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.resolver.ts` | Add anonymous Soft-throttled GraphQL query, locale message và transform interceptor. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.module-definition.ts` | Add configurable module definition. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/pricing-catalog.module.ts` | Add CqrsModule wiring for resolver/service/handler. |
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/index.ts` | Add operation module export only. |
| `apps/api/src/features/api/core/graphql/queries/payments/payments.module.ts` | Register pricing module beside payment status without disturbing existing worktree change. |
| `apps/api/src/modules/exceptions/errors/payment/pricing-catalog-config-invalid.ts` | Add named 500 domain exception with section, field and optional package ID metadata. |
| `test/e2e/pricing-catalog.e2e-spec.ts` | Add anonymous schema/catalog cases and catalog-to-checkout amount consistency flow. |

Không có entity, migration, repository, REST controller, cache, config field hay edit ngoài bảng trên.

### TEST MATRIX

| Lane | Required case | Proof |
|---|---|---|
| Unit | Full config | Exact 49k/490k, 249k, 4.999m, benefits, Personal→Commercial order. |
| Unit | Missing `examDownloads` | Response returns `examDownloads: null`; no fabricated package. |
| Unit | Missing optional membership parents | Nullable fields only; no defaults. |
| Unit | Disabled membership/download | Flags and configured facts preserved. |
| Unit | Invalid monthly/yearly/demo/AI/package/promotion number | Exact config-invalid metadata; zero rules distinguish non-negative from positive fields. |
| Unit | Invalid enabled/benefit booleans | Named exception, no coercion. |
| Unit | Unknown entitlement tier | Named exception; exhaustive free/pro mapping. |
| Schema | Anonymous query | Success without auth; no secret-like field introspectable. |
| E2E | Catalog → three checkout intents | Pro, Personal, Commercial transaction amounts equal corresponding catalog amounts. |
| E2E | Disabled offer | Catalog reports disabled; checkout refuses; zero transaction persisted. |
| Live | Running API | Anonymous query returns mounted config and credential-key scan is empty. |

### ACCEPTANCE

```powershell
npx tsc -p apps/api/tsconfig.app.json --noEmit
npm run lint:check
npm run test:unit -- --runInBand
npx jest --config test/e2e/jest-e2e.json --runInBand test/e2e/pricing-catalog.e2e-spec.ts
npm run build
```

Live proof additionally queries `http://localhost:3071/graphql` after restart and compares the three returned prices with transaction amounts created by the test account.

### OUTPUTS

| Concept | Result |
|---|---|
| Proposed capability | `pricingCatalog` is one public, config-backed product truth for Pro and download-license offers. |
| Architecture | CQRS query under payments; no database; strict runtime validation before publication. |
| Consistency meaning | A price shown to FE must equal the amount persisted by its checkout mutation. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/miamia/pricing-catalog.md` | `modified` — append Backend Feature Review r1; no production source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt exact backend revision | **Duyệt `pricing-catalog-review-r1` (đề xuất):** nullable absent download config, reuse package enum, validate full public projection và bind catalog-to-checkout E2E. **Sửa revision:** nêu field, path hoặc test cần đổi. |

### WARNINGS

| Warning | Impact |
|---|---|
| `membership.yearlyPriceVnd` được catalog expose nhưng purchase mutation chưa nhận billing period. | FE chỉ được mô tả yearly nếu không tạo CTA checkout; Review FE hiện bán Pro monthly 49k. |
| Existing payment-status worktree chưa commit và cùng chạm `payments.module.ts`. | Apply phải baseline commit toàn trạng thái hiện tại rồi chỉ track catalog diff; không ghi đè status code. |
| Full unit suite có thể lớn. | Apply vẫn phải chạy frozen gates; focused pass không thay full relevant test gate. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Non-null `examDownloads` khi config optional | Nullable section | Không được bịa availability/package khi mount chưa có section. |
| New package enum | Existing `ExamDownloadPackage` | Wire identity đã tồn tại ở checkout và payment status. |
| Type cast làm runtime proof | Explicit handler validation | Mounted YAML có thể sai dù TypeScript compile. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval Review r1 | Thầy trả lời `Duyệt pricing-catalog-review-r1`. |
| Production implementation | `starci-be-feature-apply` sau approval, baseline commit trước source edit. |
| Live catalog consumed by FE | Backend Apply + schema/live proof trước FE Apply. |

## Backend Feature Apply — pricing-catalog-review-r1

### CONTEXT

| Field | Value |
|---|---|
| Source | `D:\Repositories\starci-academy-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Project | `miamia` |
| Frontend | `D:\Repositories\miamia-fe` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Workdir | `D:\Repositories\mia-mia-backend` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\pricing-catalog.md` |
| Purpose | Apply catalog giá public đã duyệt và chứng minh giá checkout lấy cùng canonical config. |

### APPROVAL

| Revision | Evidence | Result |
|---|---|---|
| `pricing-catalog-review-r1` | Thầy trả lời chính xác `Duyệt pricing-catalog-review-r1 và tai-de-bang-gia-review-r2.` | APPROVED |

### OUTPUTS

| Concept | Result |
|---|---|
| Product truth | Một query anonymous trả Pro, Personal và Commercial từ mounted config; không trả credential/provider config. |
| Price consistency | Giá catalog và amount do checkout persist dùng cùng cấu hình server. |
| Failure semantics | Config public sai bị từ chối bằng named exception; không default/coerce hoặc publish partial. |

### CHANGES

| Tree | Details |
|---|---|
| `apps/api/src/features/api/core/graphql/queries/payments/pricing-catalog/**` | Thêm query, handler, resolver, service, module, GraphQL types và unit specs đúng frozen tree. |
| `apps/api/src/features/api/core/graphql/queries/payments/payments.module.ts` | Đăng ký pricing catalog cạnh payment-status hiện hữu. |
| `apps/api/src/modules/exceptions/errors/payment/pricing-catalog-config-invalid.ts` | Thêm lỗi domain cho mounted config không hợp lệ. |
| `test/e2e/pricing-catalog.e2e-spec.ts` | Chứng minh anonymous schema/catalog và catalog-to-checkout amount trên PostgreSQL thật. |

### PROOF

| Gate | Result |
|---|---|
| Baseline | `b550e4d6fbfb09c3a55993f9b0fcd11e01f6d52b` — commit trước Apply. |
| Typecheck | PASS. |
| Unit tập trung | PASS 14/14. |
| E2E catalog | PASS 3/3, gồm HTTP GraphQL, PostgreSQL thật và ba checkout consistency cases. |
| Lint toàn backend | PASS 0 errors; còn 520 warnings lịch sử. |
| Build | PASS. |
| Live anonymous query | PASS tại `http://localhost:3071/graphql`: Pro 49k/tháng, 490k/năm; Personal 249k; Commercial 4.999m; quảng bá thương hiệu 12 tháng. |
| Credential scan | PASS — schema/response không có secret, provider credential hoặc mounted path. |
| Workflow validator | PASS cho record đích: 0 lỗi; toàn workflow root còn 743 lỗi lịch sử ngoài hai record này. |

### NEED APPROVALS

| Need | Status |
|---|---|
| Revision r1 | Đã duyệt. |
| Source review/commit cuối | Diff đang để worktree cho thầy kiểm tra; chưa tự commit sau Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Focused boundary lint còn một warning kiến trúc ở path exception đã được Review khóa; full lint không có error. | Không ảnh hưởng build/runtime; di chuyển exception cần Audit/Feature revision riêng. |
| Live PayOS provider đang unavailable; SDK create nằm trong retry nhưng không có hard timeout. | Checkout Personal/Commercial có thể treo trước persistence; catalog vẫn đúng và query/consistency E2E xanh, nhưng không được tuyên bố live payment hoàn tất. |

### APPLY STATUS

`pricing-catalog-review-r1` đã apply xong trong exact boundary; gate catalog đóng. Live payment settlement vẫn là gate riêng của payment reliability.
