# 21 — Gotchas (đọc trước khi sửa)

## Typo cố ý — KHÔNG đổi

| Thực tế | Đúng chính tả | Vị trí |
|---------|---------------|--------|
| `bussiness` | business | `src/modules/bussiness/` |
| `vaildators` | validators | `src/modules/vaildators/` |

Đổi tên = vỡ imports khắp repo. Nếu muốn sửa, phải rename + grep replace toàn bộ + update `nest-cli.json` + path aliases.

## Hai Redis modules khác nhau

- `RedisModule` (`src/modules/native/redis/`) dùng **node-redis v5**. Instance keys: `Adapter` (Socket.IO Redis adapter), `Cache`.
- `IoRedisModule` (`src/modules/native/ioredis/`) dùng **ioredis**. Instance key: `Cache` (cache-manager, BullMQ throttler).

Đừng inject nhầm — interface 2 client khác nhau.

## WinstonModule register 2 lần

Trong `apps/core/src/app.module.ts`:

```ts
WinstonModule.register({ serviceName: ServiceName.Api, level: WinstonLevel.Info })          // line ~158
WinstonModule.register({ serviceName: ServiceName.Api, level: WinstonLevel.Verbose, isGlobal: true })   // line ~221
```

Lần thứ 2 (Verbose + isGlobal) **ghi đè** lần đầu. Khi debug logger, kiểm tra cái sau cùng. Không nên copy pattern này.

## `apps/core/` là root Nest CLI

`"root": "apps/core"` trong `nest-cli.json`. `npm start` mặc định chạy core. Khi muốn chạy app khác, **bắt buộc** dùng `nest start <name>`.

## PostgreSQL Module — manual seed

`PrimaryPostgreSQLModule.register({ withSeeders: { manualSeed: true } })` — seeders không tự chạy lúc boot. Phải trigger qua CLI hoặc init flow. Đừng giả định DB đã seed sẵn.

## Validation pipe global

Khai báo ở `apps/core/src/app.module.ts` qua `APP_PIPE: ValidationPipe`. DTO sẽ tự validate. Không cần `@UsePipes(ValidationPipe)` ở controller.

## Path alias chỉ resolve qua TypeScript

`@modules/*` và `@features/*` chỉ work với `ts-node` / webpack (đã cấu hình). Khi chạy raw `node dist/...`, webpack đã inline path → ok. Nhưng script tự viết bằng `tsx` ngoài monorepo có thể fail.

## CQRS double-register

Trong `apps/core/src/app.module.ts`:

```ts
CqrsModule.forRoot()              // Nest core
CQRSModule.register({ isGlobal: true })  // wrapper riêng tại src/modules/cqrs/
```

Cả 2 đều cần — wrapper bổ sung event bus custom. Đừng xóa cái nào.

## TypeORM 0.3 syntax

Dùng repository pattern, **không** dùng active record. Không gọi `entity.save()` trực tiếp.

## Event subjects NATS

Khi thêm subject mới phải add vào enum `EventName` (`src/modules/event/enums/`) **và** khai báo trong `EventModule.register({ nats: { subjects: [...] } })` ở `apps/core/src/app.module.ts`. Quên 1 trong 2 → subject không subscribe.
