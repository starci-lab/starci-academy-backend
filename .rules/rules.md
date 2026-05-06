# Quy ước & kiến trúc mã nguồn — StarCI Academy Backend

Tài liệu này mô tả **cấu trúc repository** và **các lớp kiến trúc** chính của backend NestJS, phục vụ đọc nhanh và review mã nguồn (ví dụ trình bày với giảng viên).

---

## 1. Tổng quan

- **Nền tảng:** [NestJS](https://nestjs.com/) 11, **Node.js** (dự án cấu hình Webpack ghi nhận `>= 24` cho gói `core` build ra).
- **Gói ứng dụng chính:** `core` — API tổng hợp (GraphQL, HTTP, WebSocket, job queue, đồng bộ dữ liệu).
- **Mã nguồn tính năng** tập trung ở thư mục gốc `src/`, **không** nằm toàn bộ trong `apps/core/src` (entry chỉ import từ `src/` qua alias).  
- **Build:** `nest build` với monorepo (`nest-cli.json`); ứng dụng `core` dùng **Webpack** → bundle `dist/apps/core/main.js` (kèm `generate-package-json-webpack-plugin`).

---

## 2. Monorepo & entry

| Thành phần | Vai trò |
|------------|---------|
| `apps/core` | Ứng dụng chính: `main.ts` bootstrap, `app.module.ts` gom toàn bộ module toàn cục. |
| `apps/backup`, `apps/cli`, `apps/ffmpeg-service`, … | Ứng dụng phụ (backup, CLI, xử lý media, …). |
| `src/` | **Thân mã nghiệp vụ + hạ tầng** dùng chung, import qua `@modules/*` và `@features/*`. |

**Luồng khởi động `core` (rút gọn):** `Sentry` (instrument) → `NestFactory.create(AppModule)` → CORS, cookie, Swagger/Scalar, nén, **Socket.IO** + **Redis** adapter → `listen` theo cấu hình port trong `@modules/env`.

---

## 3. Alias đường dẫn (TypeScript)

Trong `tsconfig.json` gốc:

- `@modules/*` → `./src/modules/*` — **hạ tầng & domain dùng lại** (DB, cache, auth, mail, S3, …).
- `@features/*` → `./src/features/*` — **tính năng theo miền** (API, worker, synchronizer, socket feature, backup feature, …).

Mọi file trong `apps/core/src` chỉ là lớp “vỏ” compose; logic lớn nằm dưới `src/`.

---

## 4. Phân tách `modules` và `features`

### 4.1. `src/modules/` — “Khối nền” có thể tái sử dụng

Ví dụ nhóm chức năng:

- **`env`:** `EnvModule.forRoot()`, load `.env` / `envConfig`.
- **`databases`:** PostgreSQL primary (TypeORM), Qdrant, ScyllaDB, …
- **`native`:** Redis / IoRedis (nhiều instance key).
- **`keycloak`, `cookie`, `jwt` (Nest):** xác thực & phiên.
- **`api`:** Apollo Server (monolithic / federation), decorator GraphQL, interceptor.
- **`bullmq`, `cache`, `throttler`, `elasticsearch`, `s3`, `mailer`, `socketio`, …**

Nguyên tắc: module nền thường đăng ký **`register({ isGlobal: true })`** trong `AppModule` để inject khắp app.

### 4.2. `src/features/` — “Tính năng theo use case”

- **`features/api`:** Lớp API công khai.
  - **`api/core`:** `HttpModule` (REST: webhook PayOS/Sepay, Keycloak callback, GitHub OAuth, MinIO, …) + `GraphQLModule` (queries / mutations).
  - **`api/processors`:** Xử lý nền gắn API (ví dụ gửi mail).
- **`features/worker`:** Consumer **BullMQ** xử lý job (enroll, submission, …).
- **`features/synchronizer`:** Đồng bộ CDN, Elasticsearch, indexer, bloom filter email, …
- **`features/socketio`, `features/backup`, `features/cli`:** WebSocket theo feature, backup PostgreSQL, CLI.

---

## 5. Lớp API (GraphQL & HTTP)

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

### 5.2. HTTP (REST)

- Controller trong `features/api/core/http/**` — route versioned (thường prefix `/api`, versioning trong setup Swagger).
- Dùng cho OAuth redirect/callback, webhook thanh toán, webhook MinIO, v.v. (không nhất thiết qua GraphQL).

---

## 6. Cơ sở dữ liệu & seed

### 6.1. PostgreSQL (primary)

- **`PrimaryPostgreSQLModule.register`** bật TypeORM, entity khối lớp (course, module, content, challenge, user, enrollment, payment, CV, …).
- **`withResolvers: true`:** field resolver / dataloader-style services cho GraphQL (trong `postgresql/primary/resolvers`).
- **`withSeeders`:** `SeedersService` chạy **`onModuleInit`** (trừ `manualSeed: true`) — đọc **filesystem mount** (`.mount/data/courses/...`), parse markdown/metadata, `entityManager.save(CourseEntity, courses)` — cascade module → content → challenge → lesson video.

**Lưu ý kiến trúc dữ liệu:** bảng `modules` có **`UNIQUE(display_id)` toàn cục**; nội dung course trên đĩa phải đảm bảo không trùng `display_id` giữa các module khác nhau khi seed lặp.

### 6.2. Các store khác

- **Elasticsearch:** tìm kiếm / autocomplete / index (kết hợp `SynchronizerModule`).
- **Qdrant:** vector (LangChain).
- **Redis:** cache, adapter Socket.IO, throttle storage, …
- **ScyllaDB:** module riêng trong `databases` (tùy cấu hình bật).

---

## 7. Hàng đợi, sự kiện, CQRS

- **BullMQ (`@modules/bullmq`):** job bất đồng bộ; worker tại `features/worker`.
- **`@nestjs/cqrs` + `CQRSModule` / `EventBusModule`:** command/query/event nội bộ.
- **`EventEmitterModule` + `EventModule`:** có tích hợp **NATS** subjects cho một số sự kiện (cấu hình trong `AppModule`).

---

## 8. Quy ước module Nest trong repo

Nhiều module dùng **`ConfigurableModuleClass`** (dynamic module) với file `*.module-definition.ts` — cho phép `register({ isGlobal, … })` và options typed.

**Providers toàn cục điển hình:** `APP_PIPE` với `ValidationPipe` (class-validator cho DTO).

---

## 9. Bảo mật & giới hạn tốc độ

- **Keycloak:** guard GraphQL `KeycloakAuthGraphQLGuard`, luồng HTTP redirect/callback.
- **Throttle:** `@UseThrottler` + cấu hình Redis-backed (tuỳ module).
- **Sentry:** khởi tạo sớm trong `main.ts` qua `@modules/sentry/instrument`.

---

## 10. Gợi ý đọc mã theo thứ tự

1. `apps/core/src/main.ts` → `apps/core/src/app.module.ts` (danh sách hạ tầng đăng ký).
2. `src/features/api/api.module.ts` → `core.module.ts` → `graphql.module.ts` / `http.module.ts`.
3. Một query cụ thể: ví dụ `src/features/api/core/graphql/queries/modules/modules/modules.resolver.ts` (+ service, handler).
4. Domain DB: `src/modules/databases/postgresql/primary/entities/*.entity.ts` và `seeders/`.
5. Job: `src/features/worker` + queue name trong processor tương ứng.

---

## 11. Liên hệ với quy tắc nội dung khóa học

File `.rules/contents/base.md` quy định **format markdown** cho bài học trên **mount** (`vi.md` / `en.md`). Kiến trúc backend **đọc** các file đó qua seeder/parser — đổi quy tắc nội dung có thể ảnh hưởng seed và schema hiển thị API; đổi **kiến trúc** (entity, unique constraint) cần đồng bộ với dữ liệu mount và migration DB.

---

*Tài liệu phản ánh trạng thái mã nguồn tại thời điểm tạo file; khi refactor lớn (tách app, đổi ORM, đổi transport), nên cập nhật mục tương ứng.*
