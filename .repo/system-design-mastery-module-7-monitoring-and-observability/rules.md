<!--
  L0 | VI: Gốc tài liệu — quy ước repo NestJS monorepo StarCI Academy Backend (đọc nhanh / review).
     | EN: Root doc — conventions for the NestJS monorepo backend (quick orientation / code review).
-->
# Quy ước & kiến trúc mã nguồn — StarCI Academy Backend

Tài liệu này mô tả **cấu trúc repository** và **các lớp kiến trúc** chính của backend NestJS, phục vụ đọc nhanh và review mã nguồn (ví dụ trình bày với giảng viên).

---

<!--
  L1 §1 | VI: Nền tảng (Nest 11, Node), app `core`, mã nghiệp vụ tập trung `src/`, cách build Webpack.
       | EN: Platform stack, primary `core` app, business code lives under `src/`, Webpack bundle layout.
-->
## 1. Tổng quan

- **Nền tảng:** [NestJS](https://nestjs.com/) 11, **Node.js** (dự án cấu hình Webpack ghi nhận `>= 24` cho gói `core` build ra).
- **Gói ứng dụng chính:** `core` — API tổng hợp (GraphQL, HTTP, WebSocket, job queue, đồng bộ dữ liệu).
- **Mã nguồn tính năng** tập trung ở thư mục gốc `src/`, **không** nằm toàn bộ trong `apps/core/src` (entry chỉ import từ `src/` qua alias).  
- **Build:** `nest build` với monorepo (`nest-cli.json`); ứng dụng `core` dùng **Webpack** → bundle `dist/apps/core/main.js` (kèm `generate-package-json-webpack-plugin`).

---

<!--
  L1 §2 | VI: Bố cục monorepo (`apps/*` vs `src/`), bảng vai trò, pipeline bootstrap `core`.
       | EN: Monorepo layout (`apps/*` vs shared `src/`), roles table, condensed `core` startup pipeline.
-->
## 2. Monorepo & entry

| Thành phần | Vai trò |
|------------|---------|
| `apps/core` | Ứng dụng chính: `main.ts` bootstrap, `app.module.ts` gom toàn bộ module toàn cục. |
| `apps/backup`, `apps/cli`, `apps/ffmpeg-service`, … | Ứng dụng phụ (backup, CLI, xử lý media, …). |
| `src/` | **Thân mã nghiệp vụ + hạ tầng** dùng chung, import qua `@modules/*` và `@features/*`. |

**Luồng khởi động `core` (rút gọn):** `Sentry` (instrument) → `NestFactory.create(AppModule)` → CORS, cookie, Swagger/Scalar, nén, **Socket.IO** + **Redis** adapter → `listen` theo cấu hình port trong `@modules/env`.

---

<!--
  L1 §3 | VI: Alias TS paths `@modules/*`, `@features/*`; `apps/core` chỉ là composition shell.
       | EN: TypeScript path aliases; `apps/core` is a thin composition layer over `src/`.
-->
## 3. Alias đường dẫn (TypeScript)

Trong `tsconfig.json` gốc:

- `@modules/*` → `./src/modules/*` — **hạ tầng & domain dùng lại** (DB, cache, auth, mail, S3, …).
- `@features/*` → `./src/features/*` — **tính năng theo miền** (API, worker, synchronizer, socket feature, backup feature, …).

Mọi file trong `apps/core/src` chỉ là lớp “vỏ” compose; logic lớn nằm dưới `src/`.

---

<!--
  L1 §4 | VI: Ranh giới `modules` (infrastructure tái dùng) vs `features` (use case / bounded slices).
       | EN: Split between reusable `modules` and domain/use-case `features`.
-->
## 4. Phân tách `modules` và `features`

<!--
  L2 §4.1 | VI: `src/modules` — env, DB drivers, Redis, auth stack, Apollo glue, queues, integrations; thường global.
        | EN: Underlying Nest modules (env, stores, auth, Apollo, messaging, vendors); typically registered global.
-->
### 4.1. `src/modules/` — “Khối nền” có thể tái sử dụng

Ví dụ nhóm chức năng:

- **`env`:** `EnvModule.forRoot()`, load `.env` / `envConfig`.
- **`databases`:** PostgreSQL primary (TypeORM), Qdrant, ScyllaDB, …
- **`native`:** Redis / IoRedis (nhiều instance key).
- **`keycloak`, `cookie`, `jwt` (Nest):** xác thực & phiên.
- **`api`:** Apollo Server (monolithic / federation), decorator GraphQL, interceptor.
- **`bullmq`, `cache`, `throttler`, `elasticsearch`, `s3`, `mailer`, `socketio`, …**

Nguyên tắc: module nền thường đăng ký **`register({ isGlobal: true })`** trong `AppModule` để inject khắp app.

<!--
  L2 §4.2 | VI: `src/features` — API công khai, worker BullMQ, synchronizer, socket/backup/cli theo miền.
        | EN: Feature slices — public API surface, workers, sync jobs, vertical sockets/backup/cli.
-->
### 4.2. `src/features/` — “Tính năng theo use case”

- **`features/api`:** Lớp API công khai.
  - **`api/core`:** `HttpModule` (REST: webhook PayOS/Sepay, Keycloak callback, GitHub OAuth, MinIO, …) + `GraphQLModule` (queries / mutations).
  - **`api/processors`:** Xử lý nền gắn API (ví dụ gửi mail).
- **`features/worker`:** Consumer **BullMQ** xử lý job (enroll, submission, …).
- **`features/synchronizer`:** Đồng bộ CDN, Elasticsearch, indexer, bloom filter email, …
- **`features/socketio`, `features/backup`, `features/cli`:** WebSocket theo feature, backup PostgreSQL, CLI.

---

<!--
  L1 §5 | VI: Hai transport API — GraphQL (pattern resolver/service/handler) và REST trong `http/**`.
       | EN: Dual API layer — GraphQL conventions vs versioned REST controllers under `http/**`.
-->
## 5. Lớp API (GraphQL & HTTP)

<!--
  L2 §5.1 | VI: Wiring Apollo monolithic, configurable query/mutation modules, naming ví dụ `modules.resolver`.
        | EN: Apollo monolithic setup, repeatable operation module layout, illustrative resolver path.
-->
### 5.1. GraphQL

- **`GraphQLModule`** import `QueriesModule` và `MutationsModule` (đều configurable).
- **Apollo:** `CoreModule` đăng ký `ApolloServerModule` kiểu **Monolithic**, `useServices: true`.
- **Pattern lặp lại** cho mỗi operation (query/mutation):
  - `*.module.ts` — Nest `@Module`, thường `extends ConfigurableModuleClass`.
  - `*.resolver.ts` — `@Resolver()`, `@Query()` / `@Mutation()`.
  - `*.service.ts` — điều phối use case.
  - `*.handler.ts` — tách logic truy vấn / side effect nếu cần.
  - `graphql-types` — DTO / object GraphQL request/response.

**Ví dụ đặt tên:** `modules/modules/modules.resolver.ts` — query `modules` (danh sách module theo course); guard Keycloak + guard enrollment + throttle + interceptor transform.

<!--
  L2 §5.2 | VI: REST cho OAuth, webhook, không bắt buộc đi GraphQL; versioning qua Swagger setup.
        | EN: REST for OAuth flows and webhooks; optional alongside GraphQL; API versioning via Swagger config.
-->
### 5.2. HTTP (REST)

- Controller trong `features/api/core/http/**` — route versioned (thường prefix `/api`, versioning trong setup Swagger).
- Dùng cho OAuth redirect/callback, webhook thanh toán, webhook MinIO, v.v. (không nhất thiết qua GraphQL).

---

<!--
  L1 §6 | VI: PostgreSQL TypeORM primary, seed từ mount, UNIQUE `display_id`; các datastore phụ (ES, Qdrant, Redis, Scylla).
       | EN: Primary Postgres + seeding from course mount + global uniqueness constraint; auxiliary data stores.
-->
## 6. Cơ sở dữ liệu & seed

<!--
  L2 §6.1 | VI: `PrimaryPostgreSQLModule`, resolvers optional, seed cascade; cảnh báo trùng `display_id` khi seed.
        | EN: Registration flags (`withResolvers`, `withSeeders`), filesystem-backed seed cascade; `display_id` uniqueness caveat.
-->
### 6.1. PostgreSQL (primary)

- **`PrimaryPostgreSQLModule.register`** bật TypeORM, entity khối lớp (course, module, content, challenge, user, enrollment, payment, CV, …).
- **`withResolvers: true`:** field resolver / dataloader-style services cho GraphQL (trong `postgresql/primary/resolvers`).
- **`withSeeders`:** `SeedersService` chạy **`onModuleInit`** (trừ `manualSeed: true`) — đọc **filesystem mount** (`.mount/data/courses/...`), parse markdown/metadata, `entityManager.save(CourseEntity, courses)` — cascade module → content → challenge → lesson video.

**Lưu ý kiến trúc dữ liệu:** bảng `modules` có **`UNIQUE(display_id)` toàn cục**; nội dung course trên đĩa phải đảm bảo không trùng `display_id` giữa các module khác nhau khi seed lặp.

<!--
  L2 §6.2 | VI: Elasticsearch, Qdrant vectors, Redis đa vai trò, ScyllaDB tùy bật.
        | EN: Search (ES), vectors (Qdrant), Redis multi-role infra, optional Scylla module.
-->
### 6.2. Các store khác

- **Elasticsearch:** tìm kiếm / autocomplete / index (kết hợp `SynchronizerModule`).
- **Qdrant:** vector (LangChain).
- **Redis:** cache, adapter Socket.IO, throttle storage, …
- **ScyllaDB:** module riêng trong `databases` (tùy cấu hình bật).

---

<!--
  L1 §7 | VI: BullMQ async jobs, CQRS/EventBus nội bộ, NATS qua EventEmitter/Event module.
       | EN: Async queues (BullMQ), in-process CQRS, NATS-backed events where wired in AppModule.
-->
## 7. Hàng đợi, sự kiện, CQRS

- **BullMQ (`@modules/bullmq`):** job bất đồng bộ; worker tại `features/worker`.
- **`@nestjs/cqrs` + `CQRSModule` / `EventBusModule`:** command/query/event nội bộ.
- **`EventEmitterModule` + `EventModule`:** có tích hợp **NATS** subjects cho một số sự kiện (cấu hình trong `AppModule`).

---

<!--
  L1 §8 | VI: Dynamic modules (`ConfigurableModuleClass`, `*.module-definition.ts`), `APP_PIPE` + ValidationPipe.
       | EN: Dynamic Nest module pattern and global validation pipe convention.
-->
## 8. Quy ước module Nest trong repo

Nhiều module dùng **`ConfigurableModuleClass`** (dynamic module) với file `*.module-definition.ts` — cho phép `register({ isGlobal, … })` và options typed.

**Providers toàn cục điển hình:** `APP_PIPE` với `ValidationPipe` (class-validator cho DTO).

---

<!--
  L1 §9 | VI: Keycloak GraphQL guard + HTTP flows, throttling Redis-backed, Sentry early init.
       | EN: Auth (Keycloak), rate limiting, observability/error reporting bootstrap.
-->
## 9. Bảo mật & giới hạn tốc độ

- **Keycloak:** guard GraphQL `KeycloakAuthGraphQLGuard`, luồng HTTP redirect/callback.
- **Throttle:** `@UseThrottler` + cấu hình Redis-backed (tuỳ module).
- **Sentry:** khởi tạo sớm trong `main.ts` qua `@modules/sentry/instrument`.

---

<!--
  L1 §10 | VI: Lộ trình đọc code — entry → api wiring → ví dụ resolver → entities/seed → worker queues.
        | EN: Suggested reading order from bootstrap through GraphQL example to persistence and workers.
-->
## 10. Gợi ý đọc mã theo thứ tự

1. `apps/core/src/main.ts` → `apps/core/src/app.module.ts` (danh sách hạ tầng đăng ký).
2. `src/features/api/api.module.ts` → `core.module.ts` → `graphql.module.ts` / `http.module.ts`.
3. Một query cụ thể: ví dụ `src/features/api/core/graphql/queries/modules/modules/modules.resolver.ts` (+ service, handler).
4. Domain DB: `src/modules/databases/postgresql/primary/entities/*.entity.ts` và `seeders/`.
5. Job: `src/features/worker` + queue name trong processor tương ứng.

---

<!--
  L1 §11 | VI: Liên kết format nội dung khóa học (`vi.md`/`en.md`) với parser/seeder và migration/entity.
        | EN: Course content markdown rules on mount affect seeding/API; schema changes need mount + migrations in sync.
-->
## 11. Liên hệ với quy tắc nội dung khóa học

File `.rules/contents/base.md` quy định **format markdown** cho bài học trên **mount** (`vi.md` / `en.md`). Kiến trúc backend **đọc** các file đó qua seeder/parser — đổi quy tắc nội dung có thể ảnh hưởng seed và schema hiển thị API; đổi **kiến trúc** (entity, unique constraint) cần đồng bộ với dữ liệu mount và migration DB.

---

<!--
  L1 §12 | VI: Quy ước comment song ngữ trong mã TypeScript/JavaScript (JSDoc + inline).
       | EN: Bilingual commenting convention for TS/JS source (JSDoc + optional inline).
-->
## 12. Comment mã nguồn song ngữ (VI + EN)

Áp dụng cho **TypeScript/JavaScript** trong các lab/demo của repo (và khuyến nghị đồng bộ khi mang pattern vào monorepo chính).

### 12.1. Định dạng JSDoc chuẩn

- **Dòng tiếng Việt** mô tả vai trò (file / class / hàm / endpoint).
- **Ngay sau đó**, một dòng **`(EN: …)`** — bản lược tiếng Anh cùng ý (giữ trong ngoặc để dễ grep và đồng nhất).

```ts
/**
 * Controller xử lý các yêu cầu xác thực qua HTTP.
 * (EN: Controller handling authentication requests via HTTP.)
 */
```

- Không dùng tiền tố `VI:` trong thân JSDoc; phần tiếng Việt là nội dung mặc định của khối `/**`.
- Có thể **nhiều dòng tiếng Việt** liên tiếp trước một dòng `(EN: …)` nếu mô tả dài.

### 12.2. Phạm vi bắt buộc gợi ý

| Vị trí | Ghi chú |
|--------|---------|
| Đầu file (`main.ts`, module định nghĩa metric, middleware, …) | Khối `/** … */` tóm tắt chức năng file (VI + `(EN:)`). |
| `export class` / `@Controller` / `@Module` | Một khối JSDoc ngay phía trên khai báo. |
| Method handler công khai (`@Get`, `@Post`, service method quan trọng) | JSDoc riêng; với getter/setter hiển nhiên có thể gộp vào class. |
| **Logic không đọc được từ tên biến** (công thức thời gian, normalize route, env fallback, …) | Comment inline `// … (EN: …)` ngay trên dòng hoặc cuối dòng (ưu tiên ngắn). |

Không lặp comment cho **mọi** dòng chỉ import/`return` hiển nhiên — tránh nhiễu; ưu tiên **entrypoint**, **API surface**, và **nhánh logic**.

### 12.3. Ví dụ inline

```ts
const port = Number(process.env.PORT) || 3000
// Cổng lắng nghe: env PORT hoặc mặc định 3000.
// (EN: Listen port from env PORT or default 3000.)
```

### 12.4. Hai tầng comment: **logic** vs **code** (đặc biệt lab Nest/TypeORM)

Dùng khi một đoạn vừa mang **ý nghĩa nghiệp vụ** vừa gọi **API framework** không hiển nhiên.

| Tầng | Trả lời | Ví dụ |
|------|---------|--------|
| **Logic** | *Tại sao / điều kiện / hợp đồng với người dùng hoặc hệ thống* | Chỉ seed khi bảng trống để restart không nhân đôi dữ liệu demo. |
| **Code** | *Cụ thể runtime đang làm gì (TypeORM, hook Nest, …)* | `OnModuleInit` → `await count()` → nhánh `save(create(…))`. |

Quy ước gõ (song ngữ, đồng bộ §12.1):

- Trong **JSDoc** trên method: hai dòng tiếng Việt (một dòng nhãn **Logic —**, một dòng **Code —**), rồi hai dòng `(EN Logic: …)` / `(EN Code: …)`.
- Trong **inline** trên nhánh/hook quan trọng: bốn dòng ngắn tương ứng (Logic / Code × VI + EN).

Không nhồi hai tầng vào **mọi** dòng lặp (ví dụ `return` hiển nhiên sau khi đã JSDoc đủ).

Tham chiếu chuẩn trong repo: `0-monitoring-and-observability/metrics-api/src/cats/cats.service.ts`.

---

<!--
  L1 §13 | VI: Lab lesson 0 — alias TS `@0-monitoring-and-observability`, Postgres cats, compose stack.
       | EN: Lesson 0 lab — TS path alias, Postgres-backed cats, compose stack notes.
-->
## 13. Lab lesson `0-monitoring-and-observability` (metrics-api)

### 13.1. Alias `@0-monitoring-and-observability` và barrel `src/index.ts`

Trong `metrics-api/tsconfig.json`:

- `@0-monitoring-and-observability` → `src/index.ts` (điểm vào barrel).
- `@0-monitoring-and-observability/*` → `src/*` (import theo đường dẫi con).

**Ví dụ đúng trong cùng project:**

```ts
import { CatsService } from "@0-monitoring-and-observability/cats/cats.service"
```

**Từ project khác** (monorepo/tooling khác): thêm `paths` (hoặc package workspace) trỏ `@0-monitoring-and-observability*` vào thư mục `src` của `metrics-api`, rồi:

```ts
import { AppModule } from "@0-monitoring-and-observability"
```

**Không** viết `export * from "@0-monitoring-and-observability"` **trong chính** `src/index.ts` của metrics-api — alias đó trùng barrel đích và gây **import vòng**.

Barrel chỉ nên **`export * from "./đường-tương-đối"`** hoặc `export { … } from "./…"`.

Mỗi **thư mục con có mã** trong lab (`cats/`, `cats/dto/`, `cats/entities/`, `metrics/`) có `index.ts` gom `export * from "./…"` — `src/index.ts` chỉ re-export các barrel thư mục + file gốc (`bootstrap`, `app.module`, `metrics.controller`, `prometheus`).

### 13.2. Build runtime (`nest build` + alias)

`tsc` không tự đổi alias thành đường tương đối trong `dist/`. Script build của lab:

`nest build && tsc-alias -p tsconfig.build.json`

### 13.3. PostgreSQL cho bảng `cats`

- Stack Docker bài **`0-monitoring-and-observability/.docker/compose.yaml`**: service **`postgres`** + biến `POSTGRES_*` trên **`app`** (**metrics-api** image); **`synchronize: true`** chỉ phù hợp lab (production dùng migration).

### 13.4. Comment logic + code trong `cats.service.ts`

Service mèo là **mẫu tham chiếu** cho §12.4: constructor, `onModuleInit` (seed có điều kiện), `findAll`, `create` — mỗi chỗ có cặp mô tả **Logic** (nghiệp vụ/demo) và **Code** (TypeORM / lifecycle Nest), kèm bản `(EN Logic: …)` / `(EN Code: …)` tương ứng.

---

<!--
  L1 §14 | VI: Lab lesson 3 — alias TS `@3-distributed-tracing`, tracing-api một service, OTLP Jaeger.
       | EN: Lesson 3 lab — TS path alias, single tracing-api service, OTLP to Jaeger.
-->
## 14. Lab lesson `3-distributed-tracing` (tracing-api)

### 14.1. Alias `@3-distributed-tracing` và barrel `src/index.ts`

Trong `tracing-api/tsconfig.json`:

- `@3-distributed-tracing` → `src/index.ts` (điểm vào barrel).
- `@3-distributed-tracing/*` → `src/*` (import theo đường dẫn con).

**Không** viết `export * from "@3-distributed-tracing"` trong chính `src/index.ts` của tracing-api — trùng đích → **import vòng** (giống §13.1).

Barrel thư mục feature (`checkout/index.ts`) + `src/index.ts` chỉ `export * from "./…"` tương đối — pattern giống **metrics-api**.

### 14.2. Build runtime (`nest build` + alias)

Giống lesson 0:

`nest build && tsc-alias -p tsconfig.build.json`

### 14.3. Luồng lab tracing

- **`bootstrap.ts`:** khởi động **`NodeSDK`** + **`Resource`** với **`service.name` = `nestjs-tracing-app`** (đúng filter Jaeger Query trong bài học), **`OTLPTraceExporter`** trỏ **`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`** (Compose: `http://jaeger:4318/v1/traces`), **`getNodeAutoInstrumentations()`**; sau đó **`NestFactory.create(AppModule)`** và **`listen`** trên **`PORT`** hoặc **3000**.
- **`CheckoutService.simulateCheckout`:** một **span con** thủ công (`checkout.inventory_reserve`) minh hoạ hop nội bộ + độ trễ ngẫu nhiên; **`traceId`** lấy từ **`trace.getSpan(context.active())`** sau khi span con kết thúc — cùng trace với HTTP inbound (instrumentation HTTP).
- **Compose bài 3:** file **`3-distributed-tracing/.docker/compose.yaml`** — **`name: 3-distributed-tracing`** và network Compose (**`networks."3-distributed-tracing"`**, không `external`), giống pattern bài **`0-monitoring-and-observability`**; **`tracing-api`** map host **`3005:3000`** để không đụng **`metrics-api`** (**`3000:3000`**) khi hai lab chạy song song trên một máy.

Tham chiếu mã: `3-distributed-tracing/tracing-api/src/checkout/checkout.service.ts`, `…/bootstrap.ts`; Compose: `3-distributed-tracing/.docker/compose.yaml`.

---

<!--
  L0 (footer) | VI: Disclaimer cập nhật tài liệu khi refactor lớn.
              | EN: Reminder to refresh this doc after major architectural changes.
-->
*Tài liệu phản ánh trạng thái mã nguồn tại thời điểm tạo file; khi refactor lớn (tách app, đổi ORM, đổi transport), nên cập nhật mục tương ứng.*
