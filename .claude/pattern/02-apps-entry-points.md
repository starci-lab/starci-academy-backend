# 02 — Apps & Entry Points (`apps/`)

Mỗi app = 1 runnable Nest application, có `main.ts`, `app.module.ts`, `Dockerfile`, `compose.yaml` (dev), `vps-compose.yaml` (prod), `webpack.config.cjs`.

| App | Entry | Run | Vai trò |
|-----|-------|-----|---------|
| `core` | `apps/core/src/main.ts` | `npm start` (mặc định) | HTTP API + GraphQL + Socket.IO + processors |
| `cli` | `apps/cli/src/main.ts` | `npm run cli -- <cmd>` | nest-commander (seed, migrate, ad-hoc) |
| `backup` | `apps/backup/src/main.ts` | `nest start backup` | PG dump → S3 |
| `mock` | `apps/mock/src/main.ts` | `nest start mock` | In-memory mock server (Sandpack) |

> Video encoding chạy **trong app `core`** (`VideoEncoderModule` + `FfmpegModule`, BullMQ processors ở `src/features/video-encoder/`), không phải app riêng.

## `app.module.ts` = bản kê khai trung tâm
- **`apps/core/src/app.module.ts`** — danh sách module đang on. **Đọc file này TRƯỚC** khi cần biết module nào active / cách register.
- **`apps/cli/src/app.module.ts`** — subset của core cho CLI.
- Module bật bằng `<Module>.register({ isGlobal: true })`. Một số bật flag riêng: `ApiModule.register({ useProcessors: true })`, `PrimaryPostgreSQLModule.register({ withSeeders: { manualSeed: true } })`.

## Thứ tự bootstrap (core)
1. `EnvModule` load env.
2. Winston logger sẵn sàng.
3. Database connect (Postgres + phụ).
4. `InitModule` chạy seeders (nếu cần) + startup synchronizers.
5. `features/api/core/http/http.ts` bind: CORS → cookie parser → Validation pipe (global qua `APP_PIPE`) → Swagger/Scalar → Apollo GraphQL gateway.
6. Socket.IO bind → ready.

## Gotchas (xem tech-integration `21-gotchas.md`)
- ⚠️ `apps/core` là **root** Nest CLI (`"root": "apps/core"`). `npm start` chạy core; app khác **bắt buộc** `nest start <name>`.
- ⚠️ `WinstonModule.register(...)` gọi 2 lần trong core app.module — lần sau (Verbose + isGlobal) ghi đè. Đừng copy pattern này.
